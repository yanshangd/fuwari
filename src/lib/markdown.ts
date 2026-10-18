import "server-only";
import { createHighlighter, type Highlighter } from "shiki";
import rehypeShikiFromHighlighter from "@shikijs/rehype/core";
import katex from "rehype-katex";
import raw from "rehype-raw";
import autolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import stringify from "rehype-stringify";
import gfm from "remark-gfm";
import math from "remark-math";
import parse from "remark-parse";
import remarkRehype from "remark-rehype";
import readingTime from "reading-time";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import type { Root } from "hast";

export interface TocItem {
	depth: number;
	text: string;
	id: string;
}

export interface RenderedPost {
	html: string;
	toc: TocItem[];
	minutes: number;
}

const LANGS = [
	"js", "jsx", "ts", "tsx", "json", "jsonc", "html", "vue", "svelte", "css", "scss",
	"less", "bash", "sh", "powershell", "bat", "python", "go", "rust", "java", "kotlin",
	"c", "cpp", "csharp", "php", "ruby", "swift", "sql", "yaml", "toml", "ini", "dockerfile",
	"markdown", "diff", "xml", "lua", "perl", "r", "dart",
];

let highlighterPromise: Promise<Highlighter> | null = null;
function getHighlighter() {
	if (!highlighterPromise) {
		highlighterPromise = createHighlighter({
			themes: ["github-light", "github-dark"],
			langs: LANGS,
		});
	}
	return highlighterPromise;
}

// `> [!NOTE]` 风格的 GitHub Alerts → <div class="alert alert-note">
const ALERT_TYPES: Record<string, string> = {
	NOTE: "note",
	TIP: "tip",
	IMPORTANT: "important",
	WARNING: "warning",
	CAUTION: "caution",
};
function remarkGithubAlerts() {
	// 作用在 mdast 树上（remark 阶段）
	return (tree: any) => {
		visit(tree, "blockquote", (node: any) => {
			const para = node.children?.[0];
			if (para?.type !== "paragraph") return;
			const textNode = para.children?.[0];
			if (textNode?.type !== "text") return;
			const m = textNode.value.match(/^\[!(\w+)\]\s*\n?/);
			const type = m && ALERT_TYPES[m[1].toUpperCase()];
			if (!type || !m) return;
			textNode.value = textNode.value.slice(m[0].length);
			if (!textNode.value) para.children.shift();
			node.data ??= {};
			node.data.hName = "div";
			node.data.hProperties = { className: ["alert", `alert-${type}`] };
		});
	};
}

function collectToc(toc: TocItem[], maxDepth: number) {
	return (tree: Root) => {
		visit(tree, "element", (node) => {
			if (!/^h[1-6]$/.test(node.tagName)) return;
			const depth = Number(node.tagName[1]);
			if (depth > maxDepth) return;
			const id = (node.properties?.id as string) || "";
			if (!id) return;
			const text = (node.children || [])
				.map((c) => (c.type === "text" ? c.value : ""))
				.join("")
				.trim();
			toc.push({ depth, text, id });
		});
	};
}

export async function renderMarkdown(
	markdown: string,
	tocDepth = 3,
): Promise<RenderedPost> {
	const toc: TocItem[] = [];
	const hl = await getHighlighter();
	const processor = unified()
		.use(parse)
		.use(gfm)
		.use(math)
		.use(remarkGithubAlerts)
		.use(remarkRehype, { allowDangerousHtml: true })
		.use(raw)
		.use(rehypeSlug)
		.use(katex, { throwOnError: false, strict: false })
		.use(collectToc, toc, tocDepth)
		.use(rehypeShikiFromHighlighter, hl, {
			themes: { light: "github-light", dark: "github-dark" },
			defaultColor: false,
		})
		.use(autolinkHeadings as any, {
			behavior: "append",
			properties: { className: ["heading-anchor"], ariaHidden: true },
			content: { type: "text", value: "#" },
		})
		.use(stringify);

	const html = String(await processor.process(markdown));
	const stats = readingTime(stripMarkdown(markdown), { wordsPerMinute: 200 });
	return { html, toc, minutes: Math.max(1, Math.round(stats.minutes)) };
}

function stripMarkdown(md: string) {
	return md
		.replace(/```[\s\S]*?```/g, " ")
		.replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
		.replace(/[#>*_~`|-]/g, " ")
		.replace(/\s+/g, " ");
}
