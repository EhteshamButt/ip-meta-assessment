import Link from "next/link";

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-zinc-200 bg-white px-6 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
        Something went wrong
      </p>
      <p className="max-w-md text-sm text-zinc-500 dark:text-zinc-400">{message}</p>
      <Link
        href="/"
        className="mt-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-950 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-50 dark:hover:text-zinc-50"
      >
        Back to search
      </Link>
    </div>
  );
}
