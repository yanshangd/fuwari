import Link from "next/link";
import { BookOpen } from "lucide-react";
import { getPublishedPosts } from "@/lib/server/api";
import type { PostMeta } from "@/lib/types";
import Profile from "./Profile";
import CollapsibleWidget from "./CollapsibleWidget";

function deriveCounts(posts: PostMeta[], pick: (p: PostMeta) => string[]) {
	const map = new Map<string, number>();
	for (const p of posts)
		for (const t of pick(p)) map.set(t, (map.get(t) ?? 0) + 1);
	return [...map.entries()]
		.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
		.map(([name, count]) => ({ name, count }));
}

export default async function SideBar() {
	let posts: PostMeta[] = [];
	try {
		posts = await getPublishedPosts();
	} catch {
		posts = []; // KV 不可用时侧栏渲染空列表，不阻塞整页
	}
	const tags = deriveCounts(posts, (p) => p.tags);
	const cats = deriveCounts(posts, (p) => (p.category ? [p.category] : []));
	return (
		<aside id="sidebar" className="w-full lg:max-w-[17.5rem]">
			<div className="flex flex-col w-full gap-4 mb-4 onload-animation">
				<Profile />
			</div>
			<div className="transition-all duration-700 flex flex-col w-full gap-4 sticky top-4">
				<CollapsibleWidget
					name="分类"
					id="categories"
					count={cats.length}
					threshold={5}
					className="onload-animation"
					style={{ animationDelay: "150ms" }}
				>
					{cats.map((c) => (
						<Link
							key={c.name}
							href={`/archive?category=${encodeURIComponent(c.name)}`}
							aria-label={`查看分类 ${c.name} 的全部文章`}
							className="flex items-center justify-between rounded-lg h-9 bg-[var(--btn-regular-bg)] text-50 px-4 mb-2 btn-regular hover:text-[var(--primary)] transition"
						>
							<div className="flex items-center">
								<BookOpen className="w-4 h-4 mr-2 text-[var(--btn-content)]" />
								{c.name}
							</div>
							<span className="h-6 min-w-[2rem] rounded-full flex items-center justify-center bg-[var(--toc-badge-bg)] px-1 font-bold text-xs">
								{c.count}
							</span>
						</Link>
					))}
					{cats.length === 0 && <div className="text-50 text-sm pb-2">暂无分类</div>}
				</CollapsibleWidget>
				<CollapsibleWidget
					name="标签"
					id="tags"
					count={tags.length}
					className="onload-animation"
					style={{ animationDelay: "200ms" }}
				>
					<div className="flex gap-2 flex-wrap pb-2">
						{tags.map((t) => (
							<Link
								key={t.name}
								href={`/archive?tag=${encodeURIComponent(t.name)}`}
								aria-label={`查看标签 ${t.name} 的全部文章`}
								className="btn-regular rounded-md h-8 px-2 text-sm font-medium active:scale-90 transition"
							>
								{t.name}
							</Link>
						))}
						{tags.length === 0 && <div className="text-50 text-sm">暂无标签</div>}
					</div>
				</CollapsibleWidget>
			</div>
		</aside>
	);
}
