import StaticPage from "./StaticPageView";

export function generateStaticParams() {
  return [{ slug: "__" }];
}

export default function Page() {
  return <StaticPage />;
}
