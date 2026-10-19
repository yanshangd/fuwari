import { headers } from "next/headers";
import type { Post, PostMeta, SearchHit } from "@/lib/types";

// 同源 /api/* 由 EdgeOne Functions（线上）或 next rewrites 代理到本地 dev-server（开发）承载。

async function origin() {
	if (process.env.API_BASE) return process.env.API_BASE.replace(/\/+$/, "");
	const h = await headers();
	const proto = h.get("x-forwarded-proto") || "https";
	const host = h.get("x-forwarded-host") || h.get("host");
	if (!host) throw new Error("无法推断 API origin：请求缺少 host 头");
	return `${proto}://${host}`;
}

interface Wrapper<T> {
	ok: boolean;
	data?: T;
	code?: string;
	message?: string;
}

async function getJson<T>(path: string, cookie?: string): Promise<T> {
	const res = await fetch(`${(await origin())}${path}`, {
		cache: "no-store",
		headers: cookie ? { cookie } : undefined,
	});
	const body = (await res.json().catch(() => null)) as Wrapper<T> | null;
	if (!res.ok || !body || !body.ok) {
		throw new Error(body?.message || `api ${path} 请求失败（${res.status}）`);
	}
	return body.data as T;
}

export const getPublishedPosts = () =>
	getJson<{ posts: PostMeta[] }>("/api/posts").then((d) => d.posts);

export const getAllPosts = (cookie?: string) =>
	getJson<{ posts: PostMeta[] }>("/api/posts/all", cookie).then((d) => d.posts);

export const getPost = (slug: string, cookie?: string) =>
	getJson<Post>(`/api/post/${encodeURIComponent(slug)}`, cookie);

export const getPostAny = (slug: string, cookie: string) =>
	getJson<Post>(`/api/post/all/${encodeURIComponent(slug)}`, cookie);

export const getSearchHits = (q: string, full = false) =>
	getJson<{ hits: SearchHit[] }>(
		`/api/search?q=${encodeURIComponent(q)}${full ? "&scope=full" : ""}`,
	).then((d) => d.hits);

export const getAbout = () => getJson<{ body: string }>("/api/about").then((d) => d.body);

export type Profile = { name?: string; bio?: string };

export const getProfile = () =>
	getJson<{ profile: Profile }>("/api/profile").then((d) => d.profile);

export const getPostSlugs = async () => {
	const posts = await getPublishedPosts();
	return posts.filter((p) => !p.draft).map((p) => p.slug);
};
