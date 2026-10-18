export default function MarkdownBody({ html }: { html: string }) {
	return (
		<div
			className="custom-md markdown-content"
			dangerouslySetInnerHTML={{ __html: html }}
		/>
	);
}
