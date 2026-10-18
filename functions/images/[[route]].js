// EdgeOne Pages Functions：图片服务（/images/*），从 Blob namespace blog-assets 读取。
// 写入走 /api/upload，这里只读，返回强缓存头（key 含随机串，内容不可变）。

const MIME = {
	png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif",
	webp: "image/webp", avif: "image/avif", svg: "image/svg+xml", ico: "image/x-icon",
};

async function blobStore(env) {
	if (env && env.BLOB_STORE) return env.BLOB_STORE;
	const { getStore } = await import("@edgeone/pages-blob");
	return getStore("blog-assets");
}

export async function onRequest(context) {
	const { request, env } = context;
	if (request.method !== "GET" && request.method !== "HEAD")
		return new Response("method not allowed", { status: 405 });
	const url = new URL(request.url);
	const key = decodeURIComponent(url.pathname).replace(/^\/+/, "");
	if (!/^images\/[a-f0-9]+\.(png|jpe?g|gif|webp|avif|svg|ico)$/.test(key))
		return new Response("not found", { status: 404 });

	let buf;
	try {
		buf = await (await blobStore(env)).get(key, { type: "arrayBuffer" });
	} catch (e) {
		return new Response("store error: " + (e && e.message), { status: 502 });
	}
	if (!buf) return new Response("not found", { status: 404 });
	const ext = key.split(".").pop();
	return new Response(buf, {
		headers: {
			"content-type": MIME[ext] || "application/octet-stream",
			"cache-control": "public, max-age=31536000, immutable",
			"content-length": String(buf.byteLength),
		},
	});
}
