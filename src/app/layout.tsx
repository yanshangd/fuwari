import type { Metadata } from "next";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import "@fontsource-variable/jetbrains-mono";
import "katex/dist/katex.min.css";
import "./globals.css";
import { siteConfig } from "../../site.config";
import { getProfile, type Profile } from "@/lib/server/api";
import Navbar from "@/components/Navbar";
import SideBar from "@/components/SideBar";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";

export const dynamic = "force-dynamic";

// fuwari 原版默认图标：按明暗主题各出 4 个尺寸
const favicons = ["light", "dark"].flatMap((theme) =>
	[32, 128, 180, 192].map((size) => ({
		url: `/favicon/favicon-${theme}-${size}.png`,
		type: "image/png",
		sizes: `${size}x${size}`,
		media: `(prefers-color-scheme: ${theme})`,
	})),
);

export const metadata: Metadata = {
	title: {
		default: `${siteConfig.title} - ${siteConfig.subtitle}`,
		template: `%s - ${siteConfig.title}`,
	},
	description: siteConfig.subtitle,
	metadataBase: siteConfig.url ? new URL(siteConfig.url) : undefined,
	icons: { icon: favicons },
	other: { rss: "/rss.xml" },
};

// 在首屏渲染前应用主题与主色调，避免闪烁
const themeInit = `
try {
  const theme = localStorage.getItem('theme') || 'auto';
  const dark = theme === 'dark' || (theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
  const hue = localStorage.getItem('hue') || '${siteConfig.themeColor.hue}';
  document.documentElement.style.setProperty('--hue', hue);
} catch (e) {}
`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	let profile: Profile = {};
	try {
		profile = await getProfile();
	} catch {
		profile = {}; // KV 不可用时回落到 site.config.ts 默认文案
	}
	return (
		<html
			lang="zh-CN"
			className="transition text-[14px] md:text-[16px]"
			suppressHydrationWarning
		>
			<head>
				<script dangerouslySetInnerHTML={{ __html: themeInit }} />
				<link rel="alternate" type="application/rss+xml" title={siteConfig.name} href="/rss.xml" />
			</head>
			<body className="min-h-screen transition">
				<div className="relative z-50 pointer-events-none max-w-[var(--page-width)] px-0 md:px-4 mx-auto">
					<div className="pointer-events-auto sticky top-0 transition-all">
						<Navbar />
					</div>
				</div>
				<div className="max-w-[var(--page-width)] mx-auto px-0 md:px-4 pt-4">
					<div className="grid grid-cols-1 lg:grid-cols-[17.5rem_auto] gap-4 w-full">
						<SideBar profile={profile} />
						<main className="min-w-0">
							<div id="content-wrapper" className="onload-animation">
								{children}
								<div className="footer-anim onload-animation lg:hidden mt-6">
									<Footer name={profile.name} />
								</div>
							</div>
							<div className="footer-anim onload-animation hidden lg:block">
								<Footer name={profile.name} />
							</div>
						</main>
					</div>
				</div>
				<BackToTop />
			</body>
		</html>
	);
}
