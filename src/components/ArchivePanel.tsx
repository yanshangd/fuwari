"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import type { PostMeta } from "@/lib/types";
import { formatDate, formatYear } from "@/lib/date";

interface Props {
	posts: PostMeta[];
	initialTag?: string;
	initialCategory?: string;
}

export default function ArchivePanel({ posts, initialTag = "", initialCategory = "" }: Props) {
	const [q, setQ] = useState("");
	const [tag, setTag] = useState(initialTag);
	const [category, setCategory] = useState(initialCategory);
	const [folded, setFolded] = useState<Record<string, boolean>>({});

	const filtered = useMemo(() => {
		const kw = q.trim().toLowerCase();
		return posts.filter((p) => {
			if (tag && !p.tags.some((t) => t.toLowerCase() === tag.toLowerCase())) return false;
			if (category && p.category !== category) return false;
			if (kw) {
				const hay = `${p.title} ${p.description} ${p.excerpt ?? ""} ${p.tags.join(" ")}`.toLowerCase();
				if (!hay.includes(kw)) return false;
			}
			return true;
		});
	}, [posts, q, tag, category]);

	const byYear = useMemo(() => {
		const map = new Map<string, PostMeta[]>();
		for (const p of filtered) {
			const y = formatYear(p.published);
			if (!map.has(y)) map.set(y, []);
			map.get(y)!.push(p);
		}
		return [...map.entries()];
	}, [filtered]);

	return (
		<div className="card-base p-6 md:p-8">
			<div className="flex flex-wrap gap-3 items-center mb-2">
				<div className="relative flex-1 min-w-[12rem]">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-50" />
					<input
						value={q}
						onChange={(e) => setQ(e.target.value)}
						placeholder="搜索标题、描述与摘录…"
						className="w-full h-11 rounded-lg bg-[var(--btn-regular-bg)] pl-10 pr-4 outline-none text-75 focus:bg-[var(--btn-regular-bg-hover)] transition"
					/>
				</div>
				{tag && <FilterChip label={`标签：${tag}`} onClear={() => setTag("")} />}
				{category && <FilterChip label={`分类：${category}`} onClear={() => setCategory("")} />}
			</div>
			<div className="text-50 text-sm mb-6">共 {filtered.length} 篇文章</div>

			{byYear.map(([year, list]) => {
				const isFolded = folded[year];
				return (
					<div key={year} className="mb-6">
						<button
							onClick={() => setFolded((f) => ({ ...f, [year]: !f[year] }))}
							className="flex items-center gap-2 font-bold text-xl text-90 hover:text-[var(--primary)] transition mb-2"
						>
							{isFolded ? (
								<ChevronRight className="w-6 h-6" />
							) : (
								<ChevronDown className="w-6 h-6" />
							)}
							{year}
							<span className="text-50 text-sm font-normal">（{list.length} 篇）</span>
						</button>
						{!isFolded && (
							<div className="border-l-2 border-dashed border-[var(--line-color)] ml-3 pl-5 space-y-1">
								{list.map((p) => (
									<div key={p.slug} className="flex items-baseline gap-3 group">
										<span className="text-50 text-sm shrink-0 w-20 font-mono">
											{formatDate(p.published).slice(5)}
										</span>
										<Link
											href={`/posts/${p.slug}`}
											className="text-75 group-hover:text-[var(--primary)] transition truncate"
										>
											{p.title}
										</Link>
									</div>
								))}
							</div>
						)}
					</div>
				);
			})}
			{byYear.length === 0 && <div className="text-50 py-8 text-center">没有符合条件的文章</div>}
		</div>
	);
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
	return (
		<button
			onClick={onClear}
			className="btn-regular rounded-lg h-9 px-3 text-sm font-bold active:scale-95"
		>
			{label} ✕
		</button>
	);
}
