import { siteConfig } from "../../site.config";

export default function License({ title, url }: { title: string; url: string }) {
	if (!siteConfig.license.enable) return null;
	return (
		<div className="transition border border-[var(--line-color)] px-4 py-3 rounded-xl text-sm text-50 bg-[var(--license-block-bg)] break-all">
			<span className="font-bold text-75">本文标题：</span>
			{title}
			<br />
			<span className="font-bold text-75">本文链接：</span>
			{url}
			<br />
			<span className="font-bold text-75">版权声明：</span>
			本博客所有文章除特别声明外，均采用{" "}
			<a
				href={siteConfig.license.url}
				target="_blank"
				rel="noopener"
				className="link-underline text-[var(--primary)]"
			>
				{siteConfig.license.name}
			</a>{" "}
			许可协议。转载请注明出处！
		</div>
	);
}
