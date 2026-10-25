export interface NavLink {
	name: string;
	path: string;
	external?: boolean;
}

export interface SocialLink {
	name: string;
	url: string;
	icon: string; // lucide icon name or 'fa6-brands:xxx' legacy id
}

export const siteConfig = {
	title: "沐兮的小站",
	subtitle: "有趣的地方",
	lang: "zh_CN",
	url: "https://blog.coosspadger.cn", // 部署域名，留空则从请求头推断
	themeColor: {
		hue: 250, // 0-360；fixed=true 时访客看不到换色器
		fixed: true,
	},
	postsPerPage: 5,
	avatar: "/assets/avatar.png",
	name: "沐兮",
	bio: "有趣的地方",
	links: [{ name: "RSS", url: "/rss.xml", icon: "rss" }] as SocialLink[],
	navLinks: [
		{ name: "首页", path: "/" },
		{ name: "文章", path: "/archive" },
		{ name: "关于", path: "/about" },
	] as NavLink[],
	footer: {
		since: 2026,
	},
	license: {
		enable: true,
		name: "CC BY-NC-SA 4.0",
		url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
	},
	toc: {
		enable: true,
		depth: 2,
	},
};

export type SiteConfig = typeof siteConfig;
