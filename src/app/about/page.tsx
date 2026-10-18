import { getAbout } from "@/lib/server/api";
import { renderMarkdown } from "@/lib/markdown";
import MarkdownBody from "@/components/MarkdownBody";

export const dynamic = "force-dynamic";

export const metadata = { title: "关于" };

export default async function About() {
	const md = await getAbout().catch(() => "");
	const { html } = await renderMarkdown(
		md ||
			"# 关于此站\n\n这里是关于页。在 **管理后台 → 关于页** 编辑本内容。\n\n本站文章存储于 EdgeOne KV，图片存储于 EdgeOne Blob。",
		3,
	);
	return (
		<div className="flex w-full rounded-[var(--radius-large)] overflow-hidden relative mb-4">
			<div className="card-base z-10 px-6 md:px-9 pt-6 pb-6 relative w-full">
				<h1 className="font-bold mb-4 text-3xl text-black/90 dark:text-white/90">关于</h1>
				<MarkdownBody html={html} />
			</div>
		</div>
	);
}
