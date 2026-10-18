"use client";
import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function BackToTop() {
	const [show, setShow] = useState(false);
	useEffect(() => {
		const onScroll = () => setShow(window.scrollY > 300);
		window.addEventListener("scroll", onScroll, { passive: true });
		onScroll();
		return () => window.removeEventListener("scroll", onScroll);
	}, []);
	return (
		<div
			id="back-to-top"
			className={`fixed bottom-10 right-10 z-50 transition-all ${show ? "opacity-100" : "opacity-0 pointer-events-none"}`}
		>
			<button
				id="back-to-top-btn"
				aria-label="返回顶部"
				onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
				className="btn-regular rounded-lg w-11 h-11 active:scale-90"
			>
				<ArrowUp className="text-[1.25rem]" />
			</button>
		</div>
	);
}
