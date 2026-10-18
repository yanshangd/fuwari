import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { PostMeta } from "@/lib/types";
import MetaRow from "./PostMeta";

export default function PostCard({ post, delay = 0 }: { post: PostMeta; delay?: number }) {
	const hasCover = !!post.image;
	return (
		<>
			<div
				className="card-base flex flex-col-reverse md:flex-col w-full rounded-[var(--radius-large)] overflow-hidden relative onload-animation"
				style={{ animationDelay: `calc(var(--content-delay) + ${delay * 50}ms)` }}
			>
				<div
					className={`pl-6 md:pl-9 pr-6 md:pr-2 pt-6 md:pt-7 pb-6 relative ${
						hasCover ? "md:w-[calc(100%_-_28%_-_12px)]" : "md:w-[calc(100%_-_52px_-_12px)]"
					} w-full`}
				>
					<Link
						href={`/posts/${post.slug}`}
						className="transition group w-full block font-bold mb-3 text-3xl text-90 hover:text-[var(--primary)] dark:hover:text-[var(--primary)] active:text-[var(--title-active)] before:w-1 before:h-5 before:rounded-md before:bg-[var(--primary)] before:absolute before:top-[35px] before:left-[18px] before:hidden md:before:block"
					>
						{post.title}
						<ChevronRight className="inline text-[2rem] text-[var(--primary)] md:hidden translate-y-0.5 absolute" />
						<ChevronRight className="text-[var(--primary)] text-[2rem] transition hidden md:inline absolute translate-y-0.5 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0" />
					</Link>
					<MetaRow
						meta={post}
						hideTagsForMobile
						hideUpdateDate
						className="mb-4"
					/>
					<div className="transition text-75 mb-3.5 pr-4 line-clamp-2 md:line-clamp-1">
						{post.description || post.excerpt}
					</div>
					<div className="text-sm text-black/30 dark:text-white/30 flex gap-4 transition">
						<div>{post.words ?? 0} 字</div>
						<div>|</div>
						<div>{post.minutes ?? 1} 分钟</div>
					</div>
				</div>
				{hasCover && (
					<Link
						href={`/posts/${post.slug}`}
						aria-label={post.title}
						className="group max-h-[20vh] md:max-h-none mx-4 mt-4 -mb-2 md:mb-0 md:mx-0 md:mt-0 md:w-[28%] relative md:absolute md:top-3 md:bottom-3 md:right-3 rounded-xl overflow-hidden active:scale-95"
					>
						<span className="absolute pointer-events-none z-10 w-full h-full group-hover:bg-black/30 group-active:bg-black/50 transition" />
						<span className="absolute pointer-events-none z-20 w-full h-full flex items-center justify-center">
							<ChevronRight className="transition opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 text-white w-12 h-12" />
						</span>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img src={post.image} alt={post.title} className="w-full h-full object-cover" />
					</Link>
				)}
				{!hasCover && (
					<Link
						href={`/posts/${post.slug}`}
						aria-label={post.title}
						className="!hidden md:!flex btn-regular w-[3.25rem] absolute right-3 top-3 bottom-3 rounded-xl bg-[var(--enter-btn-bg)] hover:bg-[var(--enter-btn-bg-hover)] active:bg-[var(--enter-btn-bg-active)] active:scale-95"
					>
						<ChevronRight className="transition text-[var(--primary)] text-4xl mx-auto w-9 h-9" />
					</Link>
				)}
			</div>
			<div className="transition border-t-[1px] border-dashed mx-6 border-black/10 dark:border-white/[0.15] last:border-t-0 md:hidden" />
		</>
	);
}
