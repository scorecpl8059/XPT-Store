import AdminUserDetailPage from "./AdminUserDetail";

export function generateStaticParams() {
  return [{ id: "__" }];
}

export default function Page() {
  return <AdminUserDetailPage />;
}
