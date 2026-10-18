import Link from "next/link";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

const ADJ_DIST = 2;
const VISIBLE = ADJ_DIST * 2 + 1;
const HIDDEN = -1;

export function buildPages(current: number, last: number): number[] {
	let l = current;
	let r = current;
	let count = 1;
	while (0 < l - 1 && r + 1 <= last && count + 2 <= VISIBLE) {
		count += 2;
		l--;
		r++;
	}
	while (0 < l - 1 && count < VISIBLE) {
		count++;
		l--;
	}
	while (r + 1 <= last && count < VISIBLE) {
		count++;
		r++;
	}
	const pages: number[] = [];
	if (l > 1) pages.push(1);
	if (l === 3) pages.push(2);
	if (l > 3) pages.push(HIDDEN);
	for (let i = l; i <= r; i++) pages.push(i);
	if (r < last - 2) pages.push(HIDDEN);
	if (r === last - 2) pages.push(last - 1);
	if (r < last) pages.push(last);
	return pages;
}

const pageHref = (p: number) => (p <= 1 ? "/" : `/?page=${p}`);

export default function Pagination({
	current,
	last,
	className,
}: {
	current: number;
	last: number;
	className?: string;
}) {
	if (last <= 1) return null;
	const pages = buildPages(current, last);
	return (
		<div className={`${className ?? ""} flex flex-row gap-3 justify-center my-4`}>
			<Link
				href={pageHref(Math.max(1, current - 1))}
				aria-label="上一页"
				className={`btn-card overflow-hidden rounded-lg text-[var(--primary)] w-11 h-11 ${current <= 1 ? "disabled" : ""}`}
			>
				<ChevronLeft className="text-[1.75rem] w-7 h-7" />
			</Link>
			<div className="bg-[var(--card-bg)] flex flex-row rounded-lg items-center text-neutral-700 dark:text-neutral-300 font-bold">
				{pages.map((p, i) =>
					p === HIDDEN ? (
						<MoreHorizontal key={`h${i}`} className="mx-1 w-7" />
					) : p === current ? (
						<div
							key={p}
							className="h-11 w-11 rounded-lg bg-[var(--primary)] flex items-center justify-center font-bold text-white dark:text-black/70"
						>
							{p}
						</div>
					) : (
						<Link
							key={p}
							href={pageHref(p)}
							aria-label={`第 ${p} 页`}
							className="btn-card w-11 h-11 rounded-lg overflow-hidden active:scale-[0.85]"
						>
							{p}
						</Link>
					),
				)}
			</div>
			<Link
				href={pageHref(Math.min(last, current + 1))}
				aria-label="下一页"
				className={`btn-card overflow-hidden rounded-lg text-[var(--primary)] w-11 h-11 ${current >= last ? "disabled" : ""}`}
			>
				<ChevronRight className="text-[1.75rem] w-7 h-7" />
			</Link>
		</div>
	);
}
