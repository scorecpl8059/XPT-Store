import AdminPageEditor from "./AdminPageEditor";

export function generateStaticParams() {
  return [{ id: "__" }];
}

export default function Page() {
  return <AdminPageEditor />;
}
