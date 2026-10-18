export interface PostMeta {
	slug: string;
	title: string;
	published: string; // ISO
	updated?: string | null;
	draft: boolean;
	description: string;
	image: string;
	tags: string[];
	category: string;
	lang: string;
	excerpt?: string;
	words?: number;
	minutes?: number;
}

export interface Post extends PostMeta {
	body: string; // markdown
}

export interface PostWithNav extends Post {
	prev: { slug: string; title: string } | null;
	next: { slug: string; title: string } | null;
}

export interface TagCount {
	name: string;
	count: number;
}

export interface CategoryCount {
	name: string;
	count: number;
}

export interface SearchHit {
	slug: string;
	title: string;
	description: string;
	published: string;
	snippet: string;
}
