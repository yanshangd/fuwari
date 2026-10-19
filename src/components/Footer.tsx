import { siteConfig } from "../../site.config";

export default function Footer({ name }: { name?: string }) {
	const year = new Date().getFullYear();
	const since = siteConfig.footer.since;
	return (
		<footer>
			<div className="transition border-t border-black/10 dark:border-white/15 my-10 border-dashed mx-8 md:mx-32" />
			<div className="transition rounded-2xl mb-12 flex flex-col items-center justify-center px-6">
				<div className="transition text-50 text-sm text-center">
					&copy; {since === year ? year : `${since} - ${year}`} {name || siteConfig.name}. All Rights
					Reserved. /
					<a className="transition link text-[var(--primary)] font-medium" href="/rss.xml">
						RSS
					</a>{" "}
					/
					<a className="transition link text-[var(--primary)] font-medium" href="/sitemap.xml">
						Sitemap
					</a>
					<br />
					Powered by{" "}
					<a
						className="transition link text-[var(--primary)] font-medium"
						target="_blank"
						rel="noopener"
						href="https://nextjs.org"
					>
						Next.js
					</a>{" "}
					&{" "}
					<a
						className="transition link text-[var(--primary)] font-medium"
						target="_blank"
						rel="noopener"
						href="https://cloud.tencent.com/product/edgeone-pages"
					>
						EdgeOne Makers
					</a>{" "}
					&{" "}
					<a
						className="transition link text-[var(--primary)] font-medium"
						target="_blank"
						rel="noopener"
						href="https://github.com/saicaca/fuwari"
					>
						Fuwari
					</a>
				</div>
			</div>
		</footer>
	);
}
