import { NextRequest } from "next/server";
import { getPublishedPosts } from "@/lib/server/api";
import { siteConfig } from "../../../site.config";

export const dynamic = "force-dynamic";

const xmlEsc = (s: string) => s.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);

export async function GET(req: NextRequest) {
	const base =
		siteConfig.url ||
		`${req.headers.get("x-forwarded-proto") || "https"}://${req.headers.get("x-forwarded-host") || req.headers.get("host")}`;
	const posts = await getPublishedPosts().catch(() => []);
	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${base}/</loc></url>
  <url><loc>${base}/archive</loc></url>
  <url><loc>${base}/about</loc></url>
  ${posts
  	.map(
  		(p) =>
  			`<url><loc>${base}/posts/${xmlEsc(p.slug)}</loc><lastmod>${p.published.slice(0, 10)}</lastmod></url>`,
  	)
  	.join("\n  ")}
</urlset>`;
	return new Response(xml, {
		headers: { "content-type": "application/xml; charset=utf-8" },
	});
}
