import OrderDetailPage from "./OrderDetail";

export function generateStaticParams() {
  return [{ id: "__" }];
}

export default function Page() {
  return <OrderDetailPage />;
}
