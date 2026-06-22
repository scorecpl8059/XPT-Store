import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-bold text-ws-blue">404</p>
      <h1 className="mt-4 text-xl font-semibold text-ws-text">
        Page not found
      </h1>
      <p className="mt-2 text-sm text-ws-text-muted max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center justify-center rounded-md bg-ws-blue text-white text-sm font-medium px-4 py-2 hover:bg-ws-blue-hover transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
}
