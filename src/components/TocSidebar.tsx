"use client";
import { useEffect, useState } from "react";
import type { TocItem } from "@/lib/markdown";

// fuwari 式侧边目录：右侧固定面板 + 滚动高亮
export default function TocSidebar({ items }: { items: TocItem[] }) {
	const [active, setActive] = useState("");
	useEffect(() => {
		if (!items.length) return;
		const onScroll = () => {
			let current = "";
			for (const it of items) {
				const el = document.getElementById(it.id);
				if (el && el.getBoundingClientRect().top <= 120) current = it.id;
			}
			setActive(current);
		};
		window.addEventListener("scroll", onScroll, { passive: true });
		onScroll();
		return () => window.removeEventListener("scroll", onScroll);
	}, [items]);

	if (!items.length) return null;
	return (
		<div
			id="toc-wrapper"
			className="hidden 2xl:block transition fixed top-24 right-4 w-[11rem] max-h-[70vh] overflow-y-auto hide-scrollbar z-40"
		>
			<div id="toc" className="flex flex-col gap-1">
				{items.map((it) => (
					<a
						key={it.id}
						href={`#${it.id}`}
						style={{ paddingLeft: `${(it.depth - 1) * 0.75 + 0.5}rem` }}
						className={`link text-sm py-0.5 transition truncate ${
							active === it.id
								? "text-[var(--primary)] font-bold"
								: "text-50 hover:text-[var(--btn-content)]"
						}`}
					>
						{it.text}
					</a>
				))}
			</div>
		</div>
	);
}
