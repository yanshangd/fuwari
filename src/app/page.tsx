import { getPublishedPosts } from "@/lib/server/api";
import PostCard from "@/components/PostCard";
import Pagination from "@/components/Pagination";
import { siteConfig } from "../../site.config";

export const dynamic = "force-dynamic";

export default async function Home({
	searchParams,
}: {
	searchParams: Promise<{ page?: string }>;
}) {
	const { page: pageStr } = await searchParams;
	const perPage = siteConfig.postsPerPage;
	let posts: Awaited<ReturnType<typeof getPublishedPosts>> = [];
	let error: string | null = null;
	try {
		posts = await getPublishedPosts();
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
	}
	const currentPage = Math.max(1, Number(pageStr) || 1);
	const lastPage = Math.max(1, Math.ceil(posts.length / perPage));
	const clamped = Math.min(currentPage, lastPage);
	const slice = posts.slice((clamped - 1) * perPage, clamped * perPage);

	return (
		<div>
			{error && (
				<div className="card-base p-6 mb-4 text-sm text-50">
					文章数据不可用：{error}
					<div className="mt-2">如果是首次部署，请先访问 /admin 初始化管理员并发布文章。</div>
				</div>
			)}
			<div className="flex flex-col rounded-[var(--radius-large)] bg-[var(--card-bg)] py-1 md:py-0 md:bg-transparent md:gap-4 mb-4">
				{slice.map((p, i) => (
					<PostCard key={p.slug} post={p} delay={i} />
				))}
				{!error && slice.length === 0 && (
					<div className="card-base p-10 text-center text-50">
						还没有文章，去{" "}
						<a href="/admin" className="text-[var(--primary)] font-bold">
							管理后台
						</a>{" "}
						写第一篇吧。
					</div>
				)}
			</div>
			<Pagination current={clamped} last={lastPage} className="onload-animation" />
		</div>
	);
}
