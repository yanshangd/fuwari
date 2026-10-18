import type { Metadata } from "next";
import AdminApp from "@/components/admin/AdminApp";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "管理后台",
	robots: { index: false, follow: false },
};

export default function AdminPage() {
	return (
		<div className="mb-8">
			<AdminApp />
		</div>
	);
}
