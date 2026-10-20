import { getPublishedPosts } from "@/lib/server/api";
import ArchivePanel from "@/components/ArchivePanel";

export const dynamic = "force-dynamic";

export const metadata = { title: "文章" };

export default async function Archive({
	searchParams,
}: {
	searchParams: Promise<{ tag?: string; category?: string }>;
}) {
	const { tag, category } = await searchParams;
	const posts = await getPublishedPosts().catch(() => []);
	return (
		<ArchivePanel posts={posts} initialTag={tag} initialCategory={category} />
	);
}
