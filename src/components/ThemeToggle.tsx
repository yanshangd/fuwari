"use client";
import { useEffect, useState } from "react";

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
	const Icon =
		theme === LIGHT
			? SunIcon
			: theme === DARK
				? MoonIcon
				: AutoIcon;
	return (
		<button
			aria-label="切换主题（浅色/深色/自动）"
			className={className ?? "btn-plain scale-animation rounded-lg h-11 w-11 active:scale-90"}
			onClick={cycle}
		>
			<Icon />
		</button>
	);
}

function SunIcon() {
	return (
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
			<circle cx="12" cy="12" r="4" />
			<path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
		</svg>
	);
}
function MoonIcon() {
	return (
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
		</svg>
	);
}
function AutoIcon() {
	return (
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<rect x="2" y="4" width="20" height="14" rx="2" />
			<path d="M8 22h8M12 18v4" />
		</svg>
	);
}
