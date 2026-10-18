import { NextRequest } from "next/server";
import { getPublishedPosts } from "@/lib/server/api";
import { siteConfig } from "../../../site.config";

export const dynamic = "force-dynamic";

const xmlEsc = (s: string) =>
	s.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);

export async function GET(req: NextRequest) {
	const base =
		siteConfig.url ||
		`${req.headers.get("x-forwarded-proto") || "https"}://${req.headers.get("x-forwarded-host") || req.headers.get("host")}`;
	const posts = await getPublishedPosts().catch(() => []);
	const items = posts
		.map(
			(p) => `
    <item>
      <title>${xmlEsc(p.title)}</title>
      <link>${base}/posts/${p.slug}</link>
      <guid>${base}/posts/${p.slug}</guid>
      <description>${xmlEsc(p.description || p.excerpt || "")}</description>
      <pubDate>${new Date(p.published).toUTCString()}</pubDate>
      ${p.tags.map((t) => `<category>${xmlEsc(t)}</category>`).join("")}
    </item>`,
		)
		.join("");
	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEsc(siteConfig.title)}</title>
    <link>${base}</link>
    <description>${xmlEsc(siteConfig.subtitle)}</description>
    <language>${siteConfig.lang}</language>
    <atom:link href="${base}/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;
	return new Response(xml, {
		headers: { "content-type": "application/rss+xml; charset=utf-8" },
	});
}
