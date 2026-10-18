// 本地开发服务器：用文件系统模拟 EdgeOne KV/Blob，让 next dev 能走通 /api 与 /images。
// 用法：npm run dev:api（默认 http://localhost:8788），配合 API_BASE=http://localhost:8788。

import { createServer } from "node:http";
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { onRequest as apiHandler } from "./api/[[route]].js";
import { onRequest as imageHandler } from "./images/[[route]].js";

const DIR = ".edgeone-dev";
const KV_FILE = join(DIR, "kv.json");
const BLOB_DIR = join(DIR, "blob");
mkdirSync(BLOB_DIR, { recursive: true });

const kvMap = existsSync(KV_FILE) ? JSON.parse(readFileSync(KV_FILE, "utf8")) : {};
const saveKv = () => {
	mkdirSync(DIR, { recursive: true });
	writeFileSync(KV_FILE, JSON.stringify(kvMap));
};

const env = {
	blog_ugc: {
		get: async (k) => (k in kvMap ? kvMap[k] : null),
		put: async (k, v) => {
			kvMap[k] = typeof v === "string" ? v : JSON.stringify(v);
			saveKv();
		},
		delete: async (k) => {
			delete kvMap[k];
			saveKv();
		},
		list: async () => ({ keys: Object.keys(kvMap).map((k) => ({ name: k })) }),
	},
	BLOB_STORE: {
		put: async (key, buf) => {
			const p = join(BLOB_DIR, key);
			mkdirSync(join(p, ".."), { recursive: true });
			writeFileSync(p, Buffer.from(buf));
		},
		get: async (key, opts = {}) => {
			const p = join(BLOB_DIR, key);
			if (!existsSync(p)) return opts.type === "json" ? null : null;
			const b = readFileSync(p);
			if (opts.type === "json") return JSON.parse(b.toString("utf8"));
			if (opts.type === "arrayBuffer") return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
			return b.toString("utf8");
		},
		delete: async (key) => {
			try {
				rmSync(join(BLOB_DIR, key));
			} catch {
				/* ignore */
			}
		},
		list: async () => ({ blobs: [] }),
	},
};

const MIME_BY_EXT = {
	".html": "text/html; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".json": "application/json",
	".png": "image/png",
	".jpg": "image/jpeg",
	".svg": "image/svg+xml",
};

const server = createServer(async (req, res) => {
	const url = new URL(req.url, `http://${req.headers.host}`);
	let handler = null;
	if (url.pathname === "/api" || url.pathname.startsWith("/api/")) handler = apiHandler;
	else if (url.pathname.startsWith("/images/")) handler = imageHandler;
	else {
		// 静态：从 public/ 提供本地头像等资源
		const p = join("public", url.pathname);
		if (existsSync(p) && !url.pathname.endsWith("/")) {
			res.writeHead(200, { "content-type": MIME_BY_EXT[p.slice(p.lastIndexOf("."))] || "application/octet-stream" });
			res.end(readFileSync(p));
			return;
		}
		res.writeHead(404).end("dev-server: no route " + url.pathname);
		return;
	}

	const chunks = [];
	for await (const c of req) chunks.push(c);
	const body = Buffer.concat(chunks);
	const headers = new Headers();
	for (const [k, v] of Object.entries(req.headers)) if (v !== undefined) headers.set(k, String(v));
	const webReq = new Request(url, {
		method: req.method,
		headers,
		body: ["GET", "HEAD"].includes(req.method) ? undefined : body,
		duplex: "half",
	});

	let response;
	try {
		response = await handler({ request: webReq, env, params: {} });
	} catch (e) {
		res.writeHead(500, { "content-type": "application/json" });
		res.end(JSON.stringify({ ok: false, code: "dev_server", message: String((e && e.stack) || e) }));
		return;
	}
	res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
	res.end(Buffer.from(await response.arrayBuffer()));
});

const port = Number(process.env.PORT || 8788);
server.listen(port, () => console.log(`edgeone-blog dev api → http://localhost:${port} (kv: ${Object.keys(kvMap).length} keys)`));
