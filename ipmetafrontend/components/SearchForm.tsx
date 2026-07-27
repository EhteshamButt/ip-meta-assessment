"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const SUGGESTIONS = ["torvalds", "gaearon", "sindresorhus", "yyx990803"];

export function SearchForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function goToProfile(username: string) {
    const trimmed = username.trim();
    if (!trimmed) {
      setError("Enter a GitHub username to continue.");
      return;
    }
    setError(null);
    router.push(`/u/${encodeURIComponent(trimmed)}`);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    goToProfile(value);
  }

  return (
    <div className="w-full max-w-xl">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="GitHub username, e.g. torvalds"
          aria-label="GitHub username"
          className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-950 outline-none placeholder:text-zinc-400 focus:border-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-50"
        />
        <button
          type="submit"
          className="rounded-lg bg-zinc-950 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          Search
        </button>
      </form>

      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
        <span>Try:</span>
        {SUGGESTIONS.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => goToProfile(name)}
            className="rounded-full border border-zinc-200 px-3 py-1 text-zinc-700 transition-colors hover:border-zinc-950 hover:text-zinc-950 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-50 dark:hover:text-zinc-50"
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}
