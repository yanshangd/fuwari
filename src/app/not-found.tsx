import Link from "next/link";

export default function NotFound() {
	return (
		<div className="card-base p-12 text-center">
			<div className="text-6xl font-black text-[var(--primary)] mb-3">404</div>
			<div className="text-50 mb-6">喵？这个页面不存在。</div>
			<Link
				href="/"
				className="btn-regular rounded-lg h-11 px-6 font-bold inline-flex active:scale-95"
			>
				回到首页
			</Link>
		</div>
	);
}
