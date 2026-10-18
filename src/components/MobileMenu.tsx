"use client";
import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { siteConfig } from "../../site.config";

export default function MobileMenu({ className }: { className?: string }) {
	const [open, setOpen] = useState(false);
	return (
		<div className="relative">
			<button
				id="nav-menu-switch"
				aria-label="菜单"
				onClick={() => setOpen((v) => !v)}
				className={`btn-plain scale-animation rounded-lg w-11 h-11 active:scale-90 ${className ?? ""}`}
			>
				{open ? <X className="text-[1.25rem]" /> : <Menu className="text-[1.25rem]" />}
			</button>
			<div
				className={`float-panel absolute top-full right-0 mt-2 w-48 ${open ? "" : "float-panel-closed"}`}
			>
				<div className="flex flex-col p-2">
					{siteConfig.navLinks.map((l) =>
						l.external ? (
							<a
								key={l.name}
								href={l.path}
								target="_blank"
								rel="noopener"
								onClick={() => setOpen(false)}
								className="btn-plain scale-animation rounded-lg h-11 font-bold px-5 justify-start"
							>
								{l.name}
							</a>
						) : (
							<Link
								key={l.name}
								href={l.path}
								onClick={() => setOpen(false)}
								className="btn-plain scale-animation rounded-lg h-11 font-bold px-5 justify-start"
							>
								{l.name}
							</Link>
						),
					)}
				</div>
			</div>
		</div>
	);
}
