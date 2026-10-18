"use client";
import { useState } from "react";
import { MoreHorizontal } from "lucide-react";

export default function CollapsibleWidget({
	name,
	id,
	collapsedHeight = "7.5rem",
	threshold = 20,
	count,
	children,
	className,
	style,
}: {
	name: string;
	id: string;
	collapsedHeight?: string;
	threshold?: number;
	count: number;
	children: React.ReactNode;
	className?: string;
	style?: React.CSSProperties;
}) {
	const collapsible = count >= threshold;
	const [collapsed, setCollapsed] = useState(collapsible);
	return (
		<div className={`pb-4 card-base ${className ?? ""}`} style={style}>
			<div className="font-bold transition text-lg text-neutral-900 dark:text-neutral-100 relative ml-8 mt-4 mb-2 before:w-1 before:h-4 before:rounded-md before:bg-[var(--primary)] before:absolute before:left-[-16px] before:top-[5.5px]">
				{name}
			</div>
			<div
				id={id}
				className="px-4 overflow-hidden transition-[height] duration-300"
				style={collapsed ? { height: collapsedHeight } : undefined}
			>
				{children}
			</div>
			{collapsible && collapsed && (
				<div className="px-4 -mb-2">
					<button
						onClick={() => setCollapsed(false)}
						className="btn-plain rounded-lg w-full h-9"
					>
						<span className="text-[var(--primary)] flex items-center justify-center gap-2 -translate-x-2">
							<MoreHorizontal className="text-[1.75rem]" /> 更多
						</span>
					</button>
				</div>
			)}
		</div>
	);
}
