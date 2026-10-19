// EdgeOne Pages Functions：博客数据 API（/api/*）
// 文章存 KV（绑定名 blog_ugc，key 仅允许字母数字下划线），图片存 Blob（namespace blog-assets）。
// 鉴权：PBKDF2 校验管理员密码 → HMAC 签名 cookie；公开读、登录写。

const COOKIE = "eb_admin";
const TOKEN_TTL = 7 * 86400;
const PBKDF2_ROUNDS = 10000; // EdgeOne WebCrypto 对迭代次数有上限，勿调高
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const SEARCH_SCAN_LIMIT = 300;

const json = (data, status = 200) =>
	new Response(JSON.stringify({ ok: true, data }), {
		status,
		headers: { "content-type": "application/json" },
	});
const err = (status, code, message) =>
	new Response(JSON.stringify({ ok: false, code, message }), {
		status,
		headers: { "content-type": "application/json" },
	});

const readJson = async (req) => {
	try {
		return await req.json();
	} catch {
		return {};
	}
};

const enc = new TextEncoder();
const hexEnc = (buf) =>
	Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");

function kvOf(env) {
	return (
		(env && env.blog_ugc) ||
		(typeof blog_ugc !== "undefined" ? blog_ugc : undefined) ||
		(globalThis.blog_ugc)
	);
}

async function kvGet(env, key, fallback = null) {
	try {
		const raw = await kvOf(env).get(key);
		if (raw == null) return fallback;
		return typeof raw === "string" ? JSON.parse(raw) : raw;
	} catch {
		return fallback;
	}
}
async function kvPut(env, key, val) {
	await kvOf(env).put(key, JSON.stringify(val));
}
async function kvDel(env, key) {
	try {
		await kvOf(env).delete(key);
	} catch {
		/* 忽略 */
	}
}

// KV key 命名限制：仅字母数字下划线。文章 key：post_<slug 中 - 转 _>
const slugOk = (s) => /^[a-z0-9][a-z0-9_-]{0,79}$/.test(s);
const postKey = (slug) => "post_" + slug.replace(/-/g, "_");
const IDX_KEY = "posts_index";
const AUTH_KEY = "auth_config";
const ABOUT_KEY = "about_body";
const PROFILE_KEY = "site_profile";

async function blobStore(env) {
	if (env && env.BLOB_STORE) return env.BLOB_STORE;
	const { getStore } = await import("@edgeone/pages-blob");
	return getStore("blog-assets");
}

// ---------- 鉴权 ----------

async function pbkdf2(password, saltHex) {
	const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, [
		"deriveBits",
	]);
	const bits = await crypto.subtle.deriveBits(
		{
			name: "PBKDF2",
			salt: enc.encode(saltHex),
			iterations: PBKDF2_ROUNDS,
			hash: "SHA-256",
		},
		key,
		256,
	);
	return hexEnc(bits);
}

async function hmacHex(secret, msg) {
	const key = await crypto.subtle.importKey(
		"raw",
		enc.encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	return hexEnc(await crypto.subtle.sign("HMAC", key, enc.encode(msg)));
}

const randHex = (n) => hexEnc(crypto.getRandomValues(new Uint8Array(n)));

function parseCookies(req) {
	const out = {};
	for (const p of (req.headers.get("cookie") || "").split(";")) {
		const i = p.indexOf("=");
		if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
	}
	return out;
}

async function makeToken(secret) {
	const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL;
	return `${exp}.${await hmacHex(secret, "eb_admin:" + exp)}`;
}

async function checkToken(secret, token) {
	if (!token || !secret) return false;
	const [expStr, sig] = String(token).split(".");
	const exp = Number(expStr);
	if (!Number.isFinite(exp) || exp < Date.now() / 1000) return false;
	const want = await hmacHex(secret, "eb_admin:" + expStr);
	return sig === want;
}

function authCookie(token, secure) {
	return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${TOKEN_TTL}${secure ? "; Secure" : ""}`;
}

async function requireAuth(context) {
	const { request, env } = context;
	const cfg = await kvGet(env, AUTH_KEY);
	if (!cfg) return err(401, "not_setup", "站点尚未初始化，请先设置管理员密码");
	const secure = new URL(request.url).protocol === "https:";
	if (!(await checkToken(cfg.secret, parseCookies(request)[COOKIE])))
		return err(401, "unauthorized", "未登录或会话已过期");
	return null;
}

const clientIp = (req) =>
	(req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";

async function ipFailKey(env, ip) {
	const h = hexEnc(await crypto.subtle.digest("SHA-256", enc.encode(ip))).slice(0, 16);
	return "fail_" + h;
}

// ---------- 文章 ----------

function metaOf(p) {
	const { body, prev, next, ...meta } = p;
	return meta;
}

function sortIndex(list) {
	return list.sort((a, b) => (a.published < b.published ? 1 : a.published > b.published ? -1 : a.slug < b.slug ? 1 : -1));
}

// 预生成纯文本摘录与字数统计，供列表/搜索用，避免读取正文
function plainText(md) {
	return String(md || "")
		.replace(/```[\s\S]*?```/g, " ")
		.replace(/`[^`]*`/g, " ")
		.replace(/<[^>]*>/g, " ") // 正文允许内嵌 HTML（如文首卡片），摘要只要文字
		.replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
		.replace(/^[#>*+\-|\s]+/gm, " ")
		.replace(/[#*_>~|`\[\]]/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}
const plainExcerpt = (md) => plainText(md).slice(0, 160);

// 中日韩按字符数折算（约 400 字/分钟），拉丁词按 200 词/分钟
function wordStats(md) {
	const text = plainText(md);
	const cjk = (text.match(/[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/g) || []).length;
	const latin = text.replace(/[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/g, " ")
		.split(/\s+/).filter((w) => /[\w-]/.test(w)).length;
	return { words: cjk + latin, minutes: Math.max(1, Math.round(latin / 200 + cjk / 400)) };
}

async function writePost(env, post) {
	const now = new Date().toISOString();
	const rec = {
		slug: post.slug,
		title: String(post.title || "").trim() || "未命名",
		published: post.published ? new Date(post.published).toISOString() : now,
		updated: now,
		draft: !!post.draft,
		description: String(post.description || "").trim(),
		image: String(post.image || "").trim(),
		tags: Array.isArray(post.tags) ? post.tags.map((t) => String(t).trim()).filter(Boolean) : [],
		category: String(post.category || "").trim(),
		lang: String(post.lang || ""),
		body: String(post.body || ""),
		excerpt: plainExcerpt(post.body),
	};
	const idx = (await kvGet(env, IDX_KEY, [])) || [];
	const old = idx.find((m) => m.slug === rec.slug);
	const meta = { ...metaOf(rec), excerpt: rec.excerpt, ...wordStats(rec.body) };
	if (old) idx[idx.indexOf(old)] = meta;
	else idx.push(meta);
	await kvPut(env, postKey(rec.slug), rec);
	await kvPut(env, IDX_KEY, sortIndex(idx));
	return meta;
}

async function handlePostGet(context, slug, includeDrafts) {
	const { env } = context;
	if (!slug || !slugOk(slug)) return err(404, "not_found", "文章不存在");
	const rec = await kvGet(env, postKey(slug));
	if (!rec || (rec.draft && !includeDrafts)) return err(404, "not_found", "文章不存在");
	return json(rec);
}

async function handleSearch(context) {
	const { env, url } = context;
	const q = (url.searchParams.get("q") || "").trim().toLowerCase();
	const full = url.searchParams.get("scope") === "full";
	if (!q) return json({ hits: [] });
	const idx = ((await kvGet(env, IDX_KEY, [])) || []).filter((m) => !m.draft);
	const hits = [];
	for (const m of idx) {
		if (hits.length >= 30) break;
		const hay = `${m.title} ${m.description} ${m.tags.join(" ")} ${m.category}`.toLowerCase();
		if (hay.includes(q)) {
			hits.push({
				slug: m.slug, title: m.title, description: m.description,
				published: m.published, snippet: m.excerpt ? m.excerpt.slice(0, 120) : "",
			});
			continue;
		}
		if (!full) continue;
		if (idx.indexOf(m) >= SEARCH_SCAN_LIMIT) continue;
		const rec = await kvGet(env, postKey(m.slug));
		if (!rec) continue;
		const bodyL = String(rec.body || "").toLowerCase();
		const at = bodyL.indexOf(q);
		if (at >= 0) {
			const s = Math.max(0, at - 40);
			hits.push({
				slug: m.slug, title: m.title, description: m.description, published: m.published,
				snippet: plainText(rec.body).slice(s, s + 120),
			});
		}
	}
	return json({ hits });
}

// ---------- 入口路由 ----------

export async function onRequest(context) {
	const { request, env } = context;
	const url = new URL(request.url);
	const seg = url.pathname.split("/").filter(Boolean).slice(1); // 去掉前导 api
	const method = request.method;
	const secure = url.protocol === "https:";

	if (method === "GET" && seg[0] === "health") {
		const cfg = await kvGet(env, AUTH_KEY, null);
		const idx = (await kvGet(env, IDX_KEY, [])) || [];
		return json({
			kv: !!kvOf(env),
			kvSource: env && env.blog_ugc ? "env" : "global",
			hasAuth: !!(cfg && cfg.hash),
			posts: idx.length,
			blobNs: "blog-assets",
		});
	}

	// 初始化：仅在 auth_config 不存在时允许一次
	if (method === "POST" && seg[0] === "setup") {
		if (await kvGet(env, AUTH_KEY)) return err(403, "already", "管理员已初始化");
		const { password } = await readJson(request);
		if (!password || String(password).length < 8)
			return err(400, "weak_password", "密码至少 8 位");
		const salt = randHex(16);
		const cfg = {
			salt,
			hash: await pbkdf2(String(password), salt),
			secret: randHex(32),
			created_at: new Date().toISOString(),
		};
		await kvPut(env, AUTH_KEY, cfg);
		const token = await makeToken(cfg.secret);
		const res = json({ logged_in: true });
		res.headers.set("set-cookie", authCookie(token, secure));
		return res;
	}

	if (method === "POST" && seg[0] === "login") {
		const f = (await kvGet(env, await ipFailKey(env, clientIp(request)))) || { n: 0, until: 0 };
		if (f.until > Date.now() / 1000) return err(429, "too_many", "尝试过多，请稍后再试");
		const cfg = await kvGet(env, AUTH_KEY);
		if (!cfg) return err(404, "not_setup", "请先调用 setup 初始化管理员密码");
		const { password } = await readJson(request);
		const ok = password && (await pbkdf2(String(password), cfg.salt)) === cfg.hash;
		if (!ok) {
			await kvPut(env, await ipFailKey(env, clientIp(request)), {
				n: f.n + 1,
				until: Math.floor(Date.now() / 1000) + Math.min(3600, 60 * 2 ** Math.min(f.n, 6)),
			});
			return err(401, "bad_password", "密码错误");
		}
		await kvDel(env, await ipFailKey(env, clientIp(request)));
		const token = await makeToken(cfg.secret);
		const res = json({ logged_in: true });
		res.headers.set("set-cookie", authCookie(token, secure));
		return res;
	}

	if (method === "POST" && seg[0] === "logout") {
		const res = json({ ok: true });
		res.headers.set("set-cookie", `${COOKIE}=; Path=/; Max-Age=0`);
		return res;
	}

	if (method === "GET" && seg[0] === "session") {
		const cfg = await kvGet(env, AUTH_KEY);
		const loggedIn = !!(cfg && (await checkToken(cfg.secret, parseCookies(request)[COOKIE])));
		return json({ setup: !!cfg, logged_in: loggedIn });
	}

	// 公开读
	if (method === "GET" && seg[0] === "posts" && !seg[1]) {
		const idx = ((await kvGet(env, IDX_KEY, [])) || []).filter((m) => !m.draft);
		return json({ posts: idx });
	}
	if (method === "GET" && seg[0] === "post" && seg[1] && seg[1] !== "all" && slugOk(seg[1])) {
		return handlePostGet(context, seg[1], false);
	}
	if (method === "GET" && seg[0] === "search") return handleSearch({ env, url });
	if (method === "GET" && seg[0] === "about") {
		return json({ body: (await kvGet(env, ABOUT_KEY, "")) || "" });
	}
	if (method === "GET" && seg[0] === "profile") {
		return json({ profile: (await kvGet(env, PROFILE_KEY, null)) || {} });
	}

	// 以下全部需要登录
	if (["posts", "post", "about", "profile", "upload"].includes(seg[0]) && method !== "GET") {
		const denied = await requireAuth(context);
		if (denied) return denied;
	}

	if (method === "GET" && seg[0] === "posts" && seg[1] === "all") {
		const denied = await requireAuth(context);
		if (denied) return denied;
		const idx = (await kvGet(env, IDX_KEY, [])) || [];
		return json({ posts: idx });
	}
	if (method === "GET" && seg[0] === "post" && seg[1] === "all" && seg[2]) {
		// /api/post/all/<slug> —— 含草稿，需登录
		const denied = await requireAuth(context);
		if (denied) return denied;
		if (!slugOk(seg[2])) return err(404, "not_found", "文章不存在");
		return handlePostGet(context, seg[2], true);
	}

	if (method === "POST" && seg[0] === "post") {
		const body = await readJson(request);
		if (!body.slug || !slugOk(body.slug))
			return err(400, "bad_slug", "slug 仅允许小写字母数字-_，以字母数字开头，≤80 字符");
		return json({ meta: await writePost(env, body) });
	}
	if (method === "DELETE" && seg[0] === "post" && seg[1] && slugOk(seg[1])) {
		await kvDel(env, postKey(seg[1]));
		const idx = (await kvGet(env, IDX_KEY, [])) || [];
		await kvPut(env, IDX_KEY, idx.filter((m) => m.slug !== seg[1]));
		return json({ deleted: seg[1] });
	}
	if (method === "POST" && seg[0] === "about") {
		const { body } = await readJson(request);
		await kvPut(env, ABOUT_KEY, String(body || ""));
		return json({ saved: true });
	}
	if (method === "POST" && seg[0] === "profile") {
		const { name, bio } = await readJson(request);
		const profile = {
			name: String(name || "").trim().slice(0, 40),
			bio: String(bio || "").trim().slice(0, 200),
		};
		await kvPut(env, PROFILE_KEY, profile);
		return json({ saved: true, profile });
	}
	if (method === "POST" && seg[0] === "upload") {
		const name = (url.searchParams.get("name") || "image.png").toLowerCase();
		const m = name.match(/\.([a-z0-9]{2,5})$/);
		const ext = m ? m[1] : "";
		if (!["png", "jpg", "jpeg", "gif", "webp", "avif", "svg", "ico"].includes(ext))
			return err(400, "bad_type", "仅支持图片：png jpg gif webp avif svg ico");
		const buf = await request.arrayBuffer();
		if (!buf.byteLength) return err(400, "empty", "文件为空");
		if (buf.byteLength > MAX_IMAGE_BYTES) return err(413, "too_large", "图片不能超过 8MB");
		const key = `images/${randHex(16)}.${ext}`;
		await (await blobStore(env)).put(key, buf, { contentType: MIME[ext] || "application/octet-stream" });
		return json({ url: "/" + key, bytes: buf.byteLength });
	}

	return err(404, "no_route", `未知接口：${method} ${url.pathname}`);
}

const MIME = {
	png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif",
	webp: "image/webp", avif: "image/avif", svg: "image/svg+xml", ico: "image/x-icon",
};
