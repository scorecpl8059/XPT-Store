import ProductDetailPage from "./ProductDetail";

export function generateStaticParams() {
  return [{ slug: "__" }];
}

export default function Page() {
  return <ProductDetailPage />;
}
