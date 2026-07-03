import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/" className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm hover:bg-primary/90">
        Go home
      </Link>
    </div>
  );
}
