import Link from "next/link";
import { BookOpen, CalendarDays, Pencil, Tags } from "lucide-react";
import { formatDate } from "@/lib/date";
import type { PostMeta as Meta } from "@/lib/types";

export default function PostMeta({
	meta,
	hideTagsForMobile = false,
	hideUpdateDate = false,
	className,
}: {
	meta: Pick<Meta, "published" | "updated" | "tags" | "category">;
	hideTagsForMobile?: boolean;
	hideUpdateDate?: boolean;
	className?: string;
}) {
	const updated = meta.updated && meta.updated !== meta.published;
	const tagsHidden = hideTagsForMobile ? "hidden md:flex" : "flex";
	return (
		<div
			className={`flex flex-wrap text-neutral-500 dark:text-neutral-400 items-center gap-4 gap-x-4 gap-y-2 ${className ?? ""}`}
		>
			<div className="flex items-center">
				<div className="meta-icon">
					<CalendarDays className="text-xl w-5 h-5" />
				</div>
				<span className="text-50 text-sm font-medium">{formatDate(meta.published)}</span>
			</div>
			{!hideUpdateDate && updated && (
				<div className="flex items-center">
					<div className="meta-icon">
						<Pencil className="text-xl w-5 h-5" />
					</div>
					<span className="text-50 text-sm font-medium">{formatDate(meta.updated!)}</span>
				</div>
			)}
			<div className="flex items-center">
				<div className="meta-icon">
					<BookOpen className="text-xl w-5 h-5" />
				</div>
				<div className="flex flex-row flex-nowrap items-center">
					<Link
						href={meta.category ? `/archive?category=${encodeURIComponent(meta.category)}` : "/archive"}
						aria-label={`查看分类 ${meta.category || "默认"}`}
						className="link-lg transition text-50 text-sm font-medium hover:text-[var(--primary)] dark:hover:text-[var(--primary)] whitespace-nowrap"
					>
						{meta.category || "未分类"}
					</Link>
				</div>
			</div>
			<div className={`items-center ${tagsHidden}`}>
				<div className="meta-icon">
					<Tags className="text-xl w-5 h-5" />
				</div>
				<div className="flex flex-row flex-nowrap items-center">
					{meta.tags.length > 0 ? (
						meta.tags.map((tag, i) => (
							<span key={tag} className="flex">
								{i > 0 && <span className="mx-1.5 text-[var(--meta-divider)] text-sm">/</span>}
								<Link
									href={`/archive?tag=${encodeURIComponent(tag.trim())}`}
									aria-label={`查看标签 ${tag.trim()}`}
									className="link-lg transition text-50 text-sm font-medium hover:text-[var(--primary)] dark:hover:text-[var(--primary)] whitespace-nowrap"
								>
									{tag.trim()}
								</Link>
							</span>
						))
					) : (
						<div className="transition text-50 text-sm font-medium">无标签</div>
					)}
				</div>
			</div>
		</div>
	);
}
