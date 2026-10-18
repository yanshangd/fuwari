import type { NextConfig } from "next";

// API_BASE 仅本地开发设置（指向 functions/dev-server.mjs）。
// 线上 /api、/images 由 EdgeOne Pages Functions 直接接管，不需要代理。
const apiBase = process.env.API_BASE;

const nextConfig: NextConfig = {
	images: { unoptimized: true },
	output: "standalone",
	serverExternalPackages: ["katex", "shiki", "@shikijs/rehype"],
	async rewrites() {
		if (!apiBase) return [];
		return [
			{ source: "/api/:path*", destination: `${apiBase}/api/:path*` },
			{ source: "/images/:path*", destination: `${apiBase}/images/:path*` },
		];
	},
};

export default nextConfig;
