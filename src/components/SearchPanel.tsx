"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import type { SearchHit } from "@/lib/types";

// 搜索面板：直连同源 /api/search（由 EdgeOne Functions 或本地 dev-server 承载）
export default function SearchPanel({ className }: { className?: string }) {
	const [open, setOpen] = useState(false);
	const [q, setQ] = useState("");
	const [hits, setHits] = useState<SearchHit[] | null>(null);
	const [loading, setLoading] = useState(false);
	const panelRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (!open) return;
		inputRef.current?.focus();
		const onClick = (e: MouseEvent) => {
			if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
				const btn = document.getElementById("search-switch");
				if (!btn || !btn.contains(e.target as Node)) setOpen(false);
			}
		};
		document.addEventListener("click", onClick);
		return () => document.removeEventListener("click", onClick);
	}, [open]);

	useEffect(() => {
		if (!open) return;
		if (!q.trim()) {
			setHits(null);
			return;
		}
		setLoading(true);
		const t = setTimeout(async () => {
			try {
				const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&scope=full`);
				const body = await res.json();
				if (body.ok) setHits(body.data.hits);
				else setHits([]);
			} catch {
				setHits([]);
			} finally {
				setLoading(false);
			}
		}, 300);
		return () => clearTimeout(t);
	}, [q, open]);

	return (
		<div className={className ?? "relative"} ref={panelRef}>
			<button
				id="search-switch"
				aria-label="搜索"
				onClick={() => setOpen((v) => !v)}
				className="btn-plain scale-animation rounded-lg h-11 w-11 active:scale-90"
			>
				{open ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
			</button>
			<div
				id="search-panel"
				className={`search-panel float-panel absolute top-full right-0 mt-2 w-[min(24rem,90vw)] ${open ? "" : "float-panel-closed"}`}
			>
				<div className="p-3">
					<input
						ref={inputRef}
						value={q}
						onChange={(e) => setQ(e.target.value)}
						placeholder="搜索标题与正文…"
						className="w-full h-11 rounded-lg bg-[var(--btn-regular-bg)] px-4 outline-none text-75 placeholder:text-black/30 placeholder:dark:text-white/30 focus:bg-[var(--btn-regular-bg-hover)] transition"
					/>
					<div className="max-h-[20rem] overflow-y-auto mt-2 space-y-1 hide-scrollbar">
						{loading && <div className="text-50 text-sm px-2 py-4">搜索中…</div>}
						{!loading && hits?.map((h) => (
							<Link
								key={h.slug}
								href={`/posts/${h.slug}`}
								onClick={() => setOpen(false)}
								className="block rounded-lg px-3 py-2 hover:bg-[var(--btn-plain-bg-hover)] transition"
							>
								<div className="font-bold text-90 truncate">{h.title}</div>
								{h.snippet && (
									<div className="text-50 text-sm line-clamp-2">…{h.snippet}…</div>
								)}
							</Link>
						))}
						{!loading && hits && hits.length === 0 && (
							<div className="text-50 text-sm px-2 py-4">没有找到相关文章</div>
						)}
						{!loading && hits === null && (
							<div className="text-50 text-sm px-2 py-4">输入关键词开始搜索</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
