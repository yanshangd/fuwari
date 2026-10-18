// 冒烟测试：dev-server 的全部接口流程。node scripts/smoke.mjs [base]
const base = process.argv[2] || "http://localhost:8788";
let cookie = "";
const results = [];
const step = async (name, fn) => {
	try {
		const r = await fn();
		results.push(`✓ ${name}${r ? " — " + r : ""}`);
	} catch (e) {
		results.push(`✗ ${name}: ${e.message}`);
	}
};
const jfetch = async (path, init = {}) => {
	const res = await fetch(base + path, { ...init, headers: { cookie, ...(init.headers || {}) } });
	const setc = res.headers.getSetCookie?.() || [];
	for (const c of setc) cookie = c.split(";")[0];
	return res;
};
const okJson = async (path, init) => {
	const res = await jfetch(path, init);
	const b = await res.json();
	if (!b.ok) throw new Error(b.message || JSON.stringify(b));
	return b.data;
};

const PNG = Buffer.from(
	"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
	"base64",
);

await step("setup", async () => {
	const login = async () =>
		okJson("/api/login", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ password: "test12345" }),
		});
	let d;
	try {
		d = await okJson("/api/setup", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ password: "test12345" }),
		});
	} catch {
		d = await login(); // 已初始化时回退登录，保证脚本可重复运行
	}
	return d.logged_in ? "已登录" : "";
}).catch(() => {});
await step("session", async () => {
	const d = await okJson("/api/session");
	if (!d.logged_in) {
		await okJson("/api/login", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ password: "test12345" }),
		});
	}
	return "已登录";
});
await step("发文章", async () => {
	const d = await okJson("/api/post", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({
			slug: "hello-edgeone",
			title: "Hello EdgeOne",
			tags: ["测试", "EdgeOne"],
			category: "随笔",
			description: "第一篇 KV 文章",
			body: "# 你好\n\n这是存在 KV 里的文章。\n\n```js\nconsole.log('hi');\n```\n\n> [!NOTE]\n> 提示块测试\n",
			draft: false,
		}),
	});
	const m = d.meta;
	return `${m.slug} words=${m.words} minutes=${m.minutes} excerpt=${(m.excerpt || "").slice(0, 12)}`;
});
await step("公开读文章", async () => {
	const d = await okJson("/api/post/hello-edgeone");
	if (!d.body.includes("KV")) throw new Error("正文不符");
	return "正文正确";
});
await step("列表", async () => {
	const d = await okJson("/api/posts");
	return `${d.posts.length} 篇`;
});
await step("搜索", async () => {
	const d = await okJson("/api/search?q=kv&scope=full");
	if (!d.hits.length) throw new Error("搜不到");
	return `命中 ${d.hits.length} 篇`;
});
await step("上传图片→Blob", async () => {
	const d = await okJson("/api/upload?name=pixel.png", { method: "POST", body: PNG });
	return d.url;
});
let imgUrl = "";
await step("图片 URL", async () => {
	const d = await okJson("/api/upload?name=p2.png", { method: "POST", body: PNG });
	imgUrl = d.url;
	return d.url;
});
await step("读图片", async () => {
	const res = await fetch(base + imgUrl);
	if (!res.ok) throw new Error("HTTP " + res.status);
	const buf = Buffer.from(await res.arrayBuffer());
	if (buf.compare(PNG) !== 0) throw new Error("字节不一致");
	return `${buf.length}B 一致`;
});
await step("草稿保护", async () => {
	await okJson("/api/post", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ slug: "secret-draft", title: "草稿", draft: true, body: "x" }),
	});
	const res = await jfetch("/api/post/secret-draft");
	if (res.status !== 404) throw new Error("草稿被公开读到");
	const all = await okJson("/api/posts/all");
	if (!all.posts.some((p) => p.slug === "secret-draft")) throw new Error("登录列表缺草稿");
	if (all.posts.some((p) => p.slug === "secret-draft" && p.draft !== true))
		throw new Error("草稿标记丢失");
	return `草稿未泄漏（登录列表 ${all.posts.length} 篇）`;
});
await step("删除文章", async () => {
	await okJson("/api/post/secret-draft", { method: "DELETE" });
	const all = await okJson("/api/posts/all");
	if (all.posts.some((p) => p.slug === "secret-draft")) throw new Error("没删掉");
	return `删除生效（剩 ${all.posts.length} 篇）`;
});
await step("清理夹具", async () => {
	await okJson("/api/post/hello-edgeone", { method: "DELETE" });
	const all = await okJson("/api/posts/all");
	return `剩 ${all.posts.length} 篇`;
});

console.log(results.join("\n"));
const failed = results.filter((r) => r.startsWith("✗"));
process.exit(failed.length ? 1 : 0);
