import { NextRequest } from "next/server";
import { siteConfig } from "../../../site.config";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
	const base =
		siteConfig.url ||
		`${req.headers.get("x-forwarded-proto") || "https"}://${req.headers.get("x-forwarded-host") || req.headers.get("host")}`;
	const txt = `User-agent: *
Allow: /
Disallow: /admin

Sitemap: ${base}/sitemap.xml
`;
	return new Response(txt, {
		headers: { "content-type": "text/plain; charset=utf-8" },
	});
}
