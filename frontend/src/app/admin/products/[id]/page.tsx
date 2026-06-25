import EditProductPage from "./EditProduct";

export function generateStaticParams() {
  return [{ id: "__" }];
}

export default function Page() {
  return <EditProductPage />;
}
