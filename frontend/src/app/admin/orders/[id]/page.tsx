import AdminOrderDetailPage from "./AdminOrderDetail";

export function generateStaticParams() {
  return [{ id: "__" }];
}

export default function Page() {
  return <AdminOrderDetailPage />;
}
