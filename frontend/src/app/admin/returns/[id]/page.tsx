import AdminReturnDetailPage from "./AdminReturnDetail";

export function generateStaticParams() {
  return [{ id: "__" }];
}

export default function Page() {
  return <AdminReturnDetailPage />;
}
