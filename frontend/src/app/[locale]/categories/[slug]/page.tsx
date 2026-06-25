import CategoryPage from "./CategoryView";

export function generateStaticParams() {
  return [{ slug: "__" }];
}

export default function Page() {
  return <CategoryPage />;
}
