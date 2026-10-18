import Link from "next/link";
import { ArrowUpRight, Home } from "lucide-react";
import { siteConfig } from "../../site.config";
import ThemeToggle from "./ThemeToggle";
import SearchPanel from "./SearchPanel";
import MobileMenu from "./MobileMenu";

export default function Navbar() {
	return (
		<div id="navbar" className="z-50 onload-animation">
			<div className="absolute h-8 left-0 right-0 -top-8 bg-[var(--card-bg)] transition" />
			<div className="card-base !overflow-visible max-w-[var(--page-width)] h-[4.5rem] !rounded-t-none mx-auto flex items-center justify-between px-4">
				<Link
					href="/"
					className="btn-plain scale-animation rounded-lg h-[3.25rem] px-5 font-bold active:scale-95"
				>
					<span className="flex flex-row text-[var(--primary)] items-center text-md">
						<Home className="text-[1.75rem] mb-1 mr-2" />
						{siteConfig.title}
					</span>
				</Link>
				<div className="hidden md:flex">
					{siteConfig.navLinks.map((l) =>
						l.external ? (
							<a
								key={l.name}
								href={l.path}
								target="_blank"
								rel="noopener"
								aria-label={l.name}
								className="btn-plain scale-animation rounded-lg h-11 font-bold px-5 active:scale-95"
							>
								<span className="flex items-center">
									{l.name}
									<ArrowUpRight className="text-[0.875rem] transition -translate-y-[1px] ml-1 text-black/[0.2] dark:text-white/[0.2]" />
								</span>
							</a>
						) : (
							<Link
								key={l.name}
								href={l.path}
								aria-label={l.name}
								className="btn-plain scale-animation rounded-lg h-11 font-bold px-5 active:scale-95"
							>
								{l.name}
							</Link>
						),
					)}
				</div>
				<div className="flex">
					<SearchPanel />
					<ThemeToggle />
					<MobileMenu className="md:!hidden" />
				</div>
			</div>
		</div>
	);
}
