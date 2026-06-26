import StaticPage from "./StaticPageView";

export function generateStaticParams() {
  return [
    { slug: "__" },
    { slug: "terms" },
    { slug: "privacy" },
    { slug: "return-policy" },
  ];
}

export default function Page() {
  return <StaticPage />;
}
