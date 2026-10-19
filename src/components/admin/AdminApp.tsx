"use client";
import { useCallback, useEffect, useState } from "react";
import {
	ImagePlus,
	LogOut,
	Plus,
	Save,
	Trash2,
	Upload,
	 Eye,
} from "lucide-react";
import type { Post, PostMeta } from "@/lib/types";

type Session = { setup: boolean; logged_in: boolean };

async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
	const res = await fetch(path, {
		credentials: "same-origin",
		headers: init?.body && !(init.body instanceof FormData)
			? { "content-type": "application/json" }
			: undefined,
		...init,
	});
	const body = await res.json().catch(() => null);
	if (!res.ok || !body?.ok) throw new Error(body?.message || `请求失败（${res.status}）`);
	return body.data as T;
}

export default function AdminApp() {
	const [session, setSession] = useState<Session | null>(null);
	const [error, setError] = useState("");

	const refresh = useCallback(async () => {
		try {
			setSession(await api<Session>("/api/session"));
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
		}
	}, []);
	useEffect(() => {
		refresh();
	}, [refresh]);

	if (!session) return <Shell>{error || <Loading />}</Shell>;
	if (!session.setup) return <Shell><AuthCard mode="setup" onDone={refresh} /></Shell>;
	if (!session.logged_in) return <Shell><AuthCard mode="login" onDone={refresh} /></Shell>;
	return <Dashboard onLogout={refresh} />;
}

function Shell({ children }: { children: React.ReactNode }) {
	return (
		<div className="card-base p-6 md:p-10 max-w-2xl mx-auto">{children}</div>
	);
}
function Loading() {
	return <div className="text-50 py-8 text-center">加载中…</div>;
}

function AuthCard({ mode, onDone }: { mode: "setup" | "login"; onDone: () => void }) {
	const [password, setPassword] = useState("");
	const [busy, setBusy] = useState(false);
	const [err, setErr] = useState("");
	const submit = async () => {
		setBusy(true);
		setErr("");
		try {
			await api(`/api/${mode}`, { method: "POST", body: JSON.stringify({ password }) });
			onDone();
		} catch (e) {
			setErr(e instanceof Error ? e.message : String(e));
		} finally {
			setBusy(false);
		}
	};
	return (
		<div className="space-y-4">
			<h1 className="text-2xl font-bold text-90">
				{mode === "setup" ? "初始化管理员" : "管理员登录"}
			</h1>
			{mode === "setup" && (
				<p className="text-50 text-sm">
					首次部署：设置管理员密码（至少 8 位）。此操作只能执行一次。
				</p>
			)}
			<input
				type="password"
				value={password}
				onChange={(e) => setPassword(e.target.value)}
				onKeyDown={(e) => e.key === "Enter" && submit()}
				placeholder="管理员密码"
				className="w-full h-11 rounded-lg bg-[var(--btn-regular-bg)] px-4 outline-none text-75"
			/>
			{err && <div className="text-red-500 text-sm">{err}</div>}
			<button
				onClick={submit}
				disabled={busy || password.length < (mode === "setup" ? 8 : 1)}
				className="btn-regular rounded-lg h-11 px-6 font-bold active:scale-95 disabled:opacity-50"
			>
				{mode === "setup" ? "设置并登录" : "登录"}
			</button>
		</div>
	);
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
	const [tab, setTab] = useState<"posts" | "about">("posts");
	const [posts, setPosts] = useState<PostMeta[] | null>(null);
	const [editing, setEditing] = useState<Post | null>(null);
	const [isNew, setIsNew] = useState(false);

	const reload = useCallback(async () => {
		try {
			const d = await api<{ posts: PostMeta[] }>("/api/posts/all");
			setPosts(d.posts);
		} catch {
			setPosts([]);
		}
	}, []);
	useEffect(() => {
		reload();
	}, [reload]);

	if (editing) {
		return (
			<div className="card-base p-4 md:p-8">
				<PostForm
					initial={editing}
					isNew={isNew}
					onCancel={() => {
						setEditing(null);
						reload();
					}}
				/>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="card-base p-4 flex items-center justify-between flex-wrap gap-2">
				<div className="flex gap-2">
					<TabBtn active={tab === "posts"} onClick={() => setTab("posts")}>文章</TabBtn>
					<TabBtn active={tab === "about"} onClick={() => setTab("about")}>关于页</TabBtn>
				</div>
				<button
					onClick={async () => {
						await api("/api/logout", { method: "POST" }).catch(() => {});
						onLogout();
					}}
					className="btn-plain rounded-lg h-10 px-4 font-bold"
				>
					<LogOut className="w-5 h-5 mr-2" /> 退出
				</button>
			</div>

			{tab === "posts" && (
				<div className="card-base p-4 md:p-6">
					<div className="flex justify-between items-center mb-4">
						<div className="text-50 text-sm">{posts?.length ?? 0} 篇（含草稿）</div>
						<button
							onClick={() => {
								setEditing(emptyPost());
								setIsNew(true);
							}}
							className="btn-regular rounded-lg h-10 px-4 font-bold active:scale-95"
						>
							<Plus className="w-5 h-5 mr-1" /> 新文章
						</button>
					</div>
					{!posts && <Loading />}
					{posts?.map((p) => (
						<div
							key={p.slug}
							className="flex items-center gap-3 border-b border-dashed border-[var(--line-divider)] py-3 last:border-b-0"
						>
							<span
								className={`shrink-0 text-xs font-bold px-2 py-1 rounded ${
									p.draft ? "bg-[var(--admonitions-color-warning)] text-black" : "bg-[var(--admonitions-color-tip)] text-black"
								}`}
							>
								{p.draft ? "草稿" : "已发布"}
							</span>
							<div className="min-w-0 flex-1">
								<div className="font-bold text-90 truncate">{p.title}</div>
								<div className="text-50 text-xs">
									{p.slug} · {p.published.slice(0, 10)} · {p.words ?? 0} 字
								</div>
							</div>
							{!p.draft && (
								<a
									href={`/posts/${p.slug}`}
									target="_blank"
									rel="noopener"
									title="查看"
									className="btn-plain rounded-lg h-9 w-9"
								>
									<Eye className="w-5 h-5" />
								</a>
							)}
							<button
								title="编辑"
								onClick={async () => {
									try {
										setEditing(await api<Post>(`/api/post/all/${p.slug}`));
										setIsNew(false);
									} catch (e) {
										alert(e instanceof Error ? e.message : e);
									}
								}}
								className="btn-plain rounded-lg h-9 px-3 font-bold"
							>
								编辑
							</button>
							<button
								title="删除"
								onClick={async () => {
									if (!confirm(`确定删除《${p.title}》？此操作不可恢复。`)) return;
									await api(`/api/post/${p.slug}`, { method: "DELETE" }).catch((e) =>
										alert(e.message),
									);
									reload();
								}}
								className="btn-plain rounded-lg h-9 w-9 text-red-500"
							>
								<Trash2 className="w-5 h-5" />
							</button>
						</div>
					))}
					{posts?.length === 0 && <div className="text-50 py-6 text-center">还没有文章</div>}
				</div>
			)}

			{tab === "about" && (
				<div className="card-base p-4 md:p-6">
					<AboutForm />
				</div>
			)}
		</div>
	);
}

function TabBtn({
	active,
	onClick,
	children,
}: {
	active: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			onClick={onClick}
			className={`rounded-lg h-10 px-5 font-bold transition ${
				active
					? "bg-[var(--primary)] text-white dark:text-black/70"
					: "btn-plain"
			}`}
		>
			{children}
		</button>
	);
}

function emptyPost(): Post {
	return {
		slug: "",
		title: "",
		published: new Date().toISOString(),
		updated: null,
		draft: true,
		description: "",
		image: "",
		tags: [],
		category: "",
		lang: "",
		body: "",
	};
}

function PostForm({
	initial,
	isNew,
	onCancel,
}: {
	initial: Post;
	isNew: boolean;
	onCancel: () => void;
}) {
	const [post, setPost] = useState<Post>(initial);
	const [tagsText, setTagsText] = useState(initial.tags.join(", "));
	const [busy, setBusy] = useState(false);
	const [err, setErr] = useState("");
	const set = (k: keyof Post, v: any) => setPost((p) => ({ ...p, [k]: v }));

	const save = async () => {
		setBusy(true);
		setErr("");
		try {
			const body: Post = {
				...post,
				tags: tagsText.split(/[,，]/).map((t) => t.trim()).filter(Boolean),
			};
			await api("/api/post", { method: "POST", body: JSON.stringify(body) });
			onCancel();
		} catch (e) {
			setErr(e instanceof Error ? e.message : String(e));
		} finally {
			setBusy(false);
		}
	};

	const upload = async (file: File) => {
		setErr("");
		try {
			const d = await api<{ url: string }>(`/api/upload?name=${encodeURIComponent(file.name)}`, {
				method: "POST",
				body: file,
			});
			setPost((p) => ({ ...p, image: d.url }));
		} catch (e) {
			setErr(e instanceof Error ? e.message : String(e));
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<h2 className="text-xl font-bold text-90">{isNew ? "新文章" : `编辑：${post.slug}`}</h2>
				<label className="flex items-center gap-2 text-50 text-sm">
					<input
						type="checkbox"
						checked={post.draft}
						onChange={(e) => set("draft", e.target.checked)}
					/>
					草稿
				</label>
			</div>
			<Field label="标题">
				<input value={post.title} onChange={(e) => set("title", e.target.value)} className={inputCls} />
			</Field>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Field label="Slug（仅小写字母数字-_）">
					<input
						value={post.slug}
						disabled={!isNew}
						onChange={(e) => set("slug", e.target.value)}
						placeholder="my-first-post"
						className={inputCls}
					/>
				</Field>
				<Field label="发布日期">
					<input
						type="date"
						value={post.published.slice(0, 10)}
						onChange={(e) => set("published", new Date(e.target.value).toISOString())}
						className={inputCls}
					/>
				</Field>
				<Field label="分类">
					<input value={post.category} onChange={(e) => set("category", e.target.value)} className={inputCls} />
				</Field>
			</div>
			<Field label="标签（逗号分隔）">
				<input value={tagsText} onChange={(e) => setTagsText(e.target.value)} className={inputCls} />
			</Field>
			<Field label="描述（列表页摘要，留空则自动取正文开头）">
				<input value={post.description} onChange={(e) => set("description", e.target.value)} className={inputCls} />
			</Field>
			<Field label="封面图">
				<div className="flex gap-2 items-center">
					<input
						value={post.image}
						onChange={(e) => set("image", e.target.value)}
						placeholder="/images/xxx.png 或外部链接"
						className={inputCls}
					/>
					<label className="btn-regular rounded-lg h-11 px-4 font-bold cursor-pointer shrink-0 active:scale-95">
						<Upload className="w-5 h-5 mr-1" />
						上传图片
						<input
							type="file"
							accept="image/*"
							className="hidden"
							onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
						/>
					</label>
				</div>
				{post.image && (
					// eslint-disable-next-line @next/next/no-img-element
					<img src={post.image} alt="封面预览" className="mt-2 max-h-32 rounded-lg" />
				)}
			</Field>
			<Field label="正文（Markdown，图片可先上传再用 /images/ 链接）">
				<textarea
					value={post.body}
					onChange={(e) => set("body", e.target.value)}
					spellCheck={false}
					className={bodyInputCls("min-h-[60vh]")}
					placeholder={"# 标题\n\n支持 GFM、代码块、$math$、> [!NOTE] 提示块…"}
				/>
			</Field>
			{err && <div className="text-red-500 text-sm">{err}</div>}
			<div className="flex gap-3">
				<button
					onClick={save}
					disabled={busy || !post.title || !post.slug}
					className="btn-regular rounded-lg h-11 px-6 font-bold active:scale-95 disabled:opacity-50"
				>
					<Save className="w-5 h-5 mr-1" /> {busy ? "保存中…" : "保存"}
				</button>
				<button onClick={onCancel} className="btn-plain rounded-lg h-11 px-6 font-bold">
					返回
				</button>
			</div>
		</div>
	);
}

const fieldCls =
	"w-full rounded-lg bg-[var(--btn-regular-bg)] px-4 outline-none text-75 focus:bg-[var(--btn-regular-bg-hover)] transition disabled:opacity-50";
const inputCls = `${fieldCls} h-11`;
// 高度只由 min-h 决定，否则 textarea 会被 h-11 压成单行
const bodyInputCls = (minH: string) =>
	`${fieldCls} py-3 font-mono text-sm leading-6 resize-y ${minH}`;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<label className="block">
			<span className="block text-50 text-sm font-bold mb-1.5">{label}</span>
			{children}
		</label>
	);
}

function AboutForm() {
	const [md, setMd] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const [msg, setMsg] = useState("");
	useEffect(() => {
		api<{ body: string }>("/api/about")
			.then((d) => setMd(d.body))
			.catch(() => setMd(""));
	}, []);
	if (md === null) return <Loading />;
	return (
		<div className="space-y-3">
			<h2 className="text-xl font-bold text-90 flex items-center gap-2">
				<ImagePlus className="w-5 h-5" /> 关于页内容（Markdown）
			</h2>
			<textarea
				value={md}
				onChange={(e) => setMd(e.target.value)}
				spellCheck={false}
				className={bodyInputCls("min-h-[45vh]")}
			/>
			<div className="flex items-center gap-3">
				<button
					disabled={busy}
					onClick={async () => {
						setBusy(true);
						setMsg("");
						try {
							await api("/api/about", { method: "POST", body: JSON.stringify({ body: md }) });
							setMsg("已保存");
						} catch (e) {
							setMsg(e instanceof Error ? e.message : String(e));
						} finally {
							setBusy(false);
						}
					}}
					className="btn-regular rounded-lg h-11 px-6 font-bold active:scale-95 disabled:opacity-50"
				>
					<Save className="w-5 h-5 mr-1" /> 保存
				</button>
				<span className="text-50 text-sm">{msg}</span>
			</div>
		</div>
	);
}
