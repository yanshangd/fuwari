import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, Clock, FileText } from "lucide-react";
import { getPost, getPublishedPosts } from "@/lib/server/api";
import { renderMarkdown } from "@/lib/markdown";
import { siteConfig } from "../../../../site.config";
import MarkdownBody from "@/components/MarkdownBody";
import MetaRow from "@/components/PostMeta";
import License from "@/components/License";
import TocSidebar from "@/components/TocSidebar";

export const dynamic = "force-dynamic";

interface Props {
	params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params;
	try {
		const post = await getPost(slug);
		return {
			title: post.title,
			description: post.description || post.title,
			openGraph: {
				title: post.title,
				description: post.description || post.title,
				type: "article",
				publishedTime: post.published,
				images: post.image ? [post.image] : undefined,
			},
		};
	} catch {
		return { title: slug };
	}
}

export default async function PostPage({ params }: Props) {
	const { slug } = await params;
	const post = await getPost(slug).catch(() => null);
	if (!post || post.draft) notFound();
	const posts = await getPublishedPosts().catch(() => []);
	const idx = posts.findIndex((p) => p.slug === slug);
	const newer = idx > 0 ? posts[idx - 1] : null; // 下一篇（更新）
	const older = idx >= 0 && idx < posts.length - 1 ? posts[idx + 1] : null; // 上一篇（更早）

	const { html, toc } = await renderMarkdown(post.body, siteConfig.toc.depth);
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "BlogPosting",
		headline: post.title,
		description: post.description || post.title,
		keywords: post.tags,
		datePublished: post.published,
	};

	return (
		<>
			{siteConfig.toc.enable && <TocSidebar items={toc} />}
			<article className="flex w-full rounded-[var(--radius-large)] overflow-hidden relative mb-4">
				<div id="post-container" className="card-base z-10 px-6 md:px-9 pt-6 pb-4 relative w-full">
					<div className="flex flex-row text-black/30 dark:text-white/30 gap-5 mb-3 transition onload-animation">
						<div className="flex flex-row items-center">
							<FileText className="h-6 w-6 rounded-md bg-black/5 dark:bg-white/10 p-1 mr-2" />
							<div className="text-sm">{post.words ?? 0} 字</div>
						</div>
						<div className="flex flex-row items-center">
							<Clock className="h-6 w-6 rounded-md bg-black/5 dark:bg-white/10 p-1 mr-2" />
							<div className="text-sm">{post.minutes ?? 1} 分钟阅读</div>
						</div>
					</div>
					<div className="relative onload-animation">
						<h1 className="transition w-full block font-bold mb-3 text-3xl md:text-[2.25rem]/[2.75rem] text-black/90 dark:text-white/90 md:before:w-1 before:h-5 before:rounded-md before:bg-[var(--primary)] before:absolute before:top-[0.75rem] before:left-[-1.125rem]">
							{post.title}
						</h1>
					</div>
					<div className="onload-animation">
						<MetaRow meta={post} className="mb-5" />
						{!post.image && (
							<div className="border-[var(--line-divider)] border-dashed border-b-[1px] mb-5" />
						)}
					</div>
					{post.image && (
						// eslint-disable-next-line @next/next/no-img-element
						<img
							id="post-cover"
							src={post.image}
							alt={post.title}
							className="mb-8 rounded-xl w-full object-cover onload-animation max-h-[24rem]"
						/>
					)}
					<div className="mb-6 onload-animation">
						<MarkdownBody html={html} />
					</div>
					<License
						title={post.title}
						url={`${siteConfig.url || ""}/posts/${post.slug}`}
					/>
					<script
						type="application/ld+json"
						dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
					/>
				</div>
			</article>

			<div className="flex flex-col md:flex-row justify-between mb-4 gap-4 overflow-hidden w-full">
				{newer ? (
					<Link
						href={`/posts/${newer.slug}`}
						aria-label={`下一篇：${newer.title}`}
						className="w-full font-bold overflow-hidden active:scale-95"
					>
						<div className="btn-card rounded-2xl w-full h-[3.75rem] max-w-full px-4 flex items-center !justify-start gap-4">
							<ChevronLeft className="w-8 h-8 text-[var(--primary)]" />
							<div className="overflow-hidden transition overflow-ellipsis whitespace-nowrap max-w-[calc(100%_-_3rem)] text-black/75 dark:text-white/75">
								{newer.title}
							</div>
						</div>
					</Link>
				) : (
					<div className="w-full" />
				)}
				{older ? (
					<Link
						href={`/posts/${older.slug}`}
						aria-label={`上一篇：${older.title}`}
						className="w-full font-bold overflow-hidden active:scale-95"
					>
						<div className="btn-card rounded-2xl w-full h-[3.75rem] max-w-full px-4 flex items-center !justify-end gap-4">
							<div className="overflow-hidden transition overflow-ellipsis whitespace-nowrap max-w-[calc(100%_-_3rem)] text-black/75 dark:text-white/75">
								{older.title}
							</div>
							<ChevronRight className="w-8 h-8 text-[var(--primary)]" />
						</div>
					</Link>
				) : (
					<div className="w-full" />
				)}
			</div>
		</>
	);
}
