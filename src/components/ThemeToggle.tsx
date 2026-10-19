"use client";
import { useEffect, useState } from "react";
import { Contrast, Moon, Sun } from "lucide-react";

const LIGHT = "light";
const DARK = "dark";
const AUTO = "auto";

export function getStoredTheme() {
	const t = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
	return t === LIGHT || t === DARK || t === AUTO ? t : AUTO;
}

export function applyTheme(theme: string) {
	const dark =
		theme === DARK ||
		(theme === AUTO && window.matchMedia("(prefers-color-scheme: dark)").matches);
	document.documentElement.classList.toggle("dark", dark);
	localStorage.setItem("theme", theme);
	window.dispatchEvent(new CustomEvent("eb-theme-change", { detail: theme }));
}

export default function ThemeToggle({ className }: { className?: string }) {
	const [theme, setTheme] = useState<string>(AUTO);
	useEffect(() => setTheme(getStoredTheme()), []);
	const cycle = () => {
		const next = theme === LIGHT ? DARK : theme === DARK ? AUTO : LIGHT;
		applyTheme(next);
		setTheme(next);
	};
	const Icon = theme === LIGHT ? Sun : theme === DARK ? Moon : Contrast;
	return (
		<button
			aria-label="切换主题（浅色/深色/自动）"
			className={className ?? "btn-plain scale-animation rounded-lg h-11 w-11 active:scale-90"}
			onClick={cycle}
		>
			<Icon className="w-5 h-5" />
		</button>
	);
}
