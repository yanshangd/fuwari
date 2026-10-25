import { siteConfig } from "../../site.config";
import { Github, IdCard, Instagram, Link2, Mail, MessageCircle, Rss, Send, Youtube } from "lucide-react";
import type { Profile as ProfileInfo } from "@/lib/server/api";

// 图标名到 lucide 的映射；后台下拉只列这些，未知名字退化成首字母徽章
const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
	github: Github,
	rss: Rss,
	mail: Mail,
	link: Link2,
	message: MessageCircle,
	telegram: Send,
	youtube: Youtube,
	instagram: Instagram,
	twitter: () => <span className="font-black text-lg">𝕏</span>,
};

export default function Profile({ name, bio, links }: ProfileInfo) {
	const items = links && links.length ? links : siteConfig.links;
	return (
		<div className="card-base p-3">
			<a
				aria-label="进入关于页"
				href="/about"
				className="group block relative mx-auto mt-1 lg:mx-0 lg:mt-0 mb-3 max-w-[12rem] lg:max-w-none overflow-hidden rounded-xl active:scale-95"
			>
				<span className="absolute transition pointer-events-none group-hover:bg-black/30 group-active:bg-black/50 w-full h-full z-50 flex items-center justify-center">
					<IdCard className="transition opacity-0 scale-90 group-hover:scale-100 group-hover:opacity-100 text-white text-5xl" />
				</span>
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={siteConfig.avatar}
					alt="作者头像"
					className="mx-auto lg:w-full h-full lg:mt-0 aspect-square object-cover"
				/>
			</a>
			<div className="px-2">
				<div className="font-bold text-xl text-center mb-1 dark:text-neutral-50 transition">
					{name || siteConfig.name}
				</div>
				<div className="h-1 w-5 bg-[var(--primary)] mx-auto rounded-full mb-2 transition" />
				<div className="text-center text-neutral-400 mb-2.5 transition">{bio || siteConfig.bio}</div>
				<div className="flex flex-wrap gap-2 justify-center mb-1">
					{items.map((item, i) => {
						const Icon = ICONS[item.icon || ""] ?? null;
						return (
							<a
								key={`${item.name}-${i}`}
								rel="me"
								aria-label={item.name}
								href={item.url}
								target={item.url.startsWith("http") ? "_blank" : undefined}
								className={
									items.length === 1
										? "btn-regular rounded-lg h-10 gap-2 px-3 font-bold active:scale-95"
										: "btn-regular rounded-lg h-10 w-10 active:scale-90"
								}
							>
								{Icon ? <Icon className="text-[1.5rem] w-[1.5rem] h-[1.5rem]" /> : item.name[0]}
								{items.length === 1 && item.name}
							</a>
						);
					})}
				</div>
			</div>
		</div>
	);
}
