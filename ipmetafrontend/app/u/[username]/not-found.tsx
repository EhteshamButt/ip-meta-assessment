import Link from "next/link";

export default function DeveloperNotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        User not found
      </h1>
      <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
        We couldn&apos;t find a GitHub account with that username. Double-check
        the spelling and try again.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-lg bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
      >
        Back to search
      </Link>
    </main>
  );
}
