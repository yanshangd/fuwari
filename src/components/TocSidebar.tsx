"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { TocItem } from "@/lib/markdown";

// fuwari 式侧边目录：右侧固定面板 + 滚动高亮
export default function TocSidebar({ items }: { items: TocItem[] }) {
	const [active, setActive] = useState("");
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
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

	// .onload-animation 的 animation-fill-mode: forwards 会永久留下 transform，
	// fixed 后代会被它锚住，所以目录必须挂到 body 上
	if (!items.length || !mounted) return null;
	return createPortal(
		<div
			id="toc-wrapper"
			className="hidden 2xl:block transition fixed top-24 right-4 w-[var(--toc-width)] max-w-[13rem] max-h-[70vh] overflow-y-auto hide-scrollbar z-40"
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
		</div>,
		document.body,
	);
}
