import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center px-4">
      <Compass className="h-16 w-16 text-primary animate-spin-slow mb-6" />
      <h1 className="text-4xl font-extrabold text-white sm:text-6xl">404</h1>
      <h2 className="text-xl font-bold text-zinc-300 mt-4">Page Not Found</h2>
      <p className="mt-4 text-sm text-zinc-400 max-w-sm">
        The link you followed might be broken, or the page may have been removed. Let's get you back on track.
      </p>
      <Link
        href="/"
        className="mt-8 gradient-btn text-white font-semibold rounded-xl px-8 py-3 text-sm"
      >
        Go back home
      </Link>
    </div>
  );
}
