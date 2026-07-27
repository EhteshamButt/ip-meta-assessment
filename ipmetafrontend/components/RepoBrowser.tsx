"use client";

import { useState, useTransition } from "react";
import { getDeveloperRepos } from "@/lib/api";
import { PaginatedRepos, RepoSort, RepoSummary } from "@/lib/types";
import { RepoCard } from "./RepoCard";

const SORT_OPTIONS: { value: RepoSort; label: string }[] = [
  { value: "updated", label: "Recently updated" },
  { value: "stars", label: "Most stars" },
  { value: "forks", label: "Most forks" },
  { value: "name", label: "Name" },
];

const PAGE_SIZE = 9;

export function RepoBrowser({ initial }: { initial: PaginatedRepos }) {
  const [sort, setSort] = useState<RepoSort>(initial.sort);
  const [repos, setRepos] = useState<RepoSummary[]>(initial.repos);
  const [page, setPage] = useState(initial.page);
  const [hasNextPage, setHasNextPage] = useState(initial.hasNextPage);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function changeSort(nextSort: RepoSort) {
    if (nextSort === sort) return;
    setSort(nextSort);
    setError(null);

    startTransition(async () => {
      try {
        const result = await getDeveloperRepos(initial.username, {
          sort: nextSort,
          page: 1,
          perPage: PAGE_SIZE,
        });
        setRepos(result.repos);
        setPage(1);
        setHasNextPage(result.hasNextPage);
      } catch {
        setError("Couldn't load repositories for that sort order. Try again.");
      }
    });
  }

  function loadMore() {
    setError(null);
    startTransition(async () => {
      try {
        const nextPage = page + 1;
        const result = await getDeveloperRepos(initial.username, {
          sort,
          page: nextPage,
          perPage: PAGE_SIZE,
        });
        setRepos((prev) => [...prev, ...result.repos]);
        setPage(nextPage);
        setHasNextPage(result.hasNextPage);
      } catch {
        setError("Couldn't load more repositories. Try again.");
      }
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
          Repositories
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => changeSort(option.value)}
              disabled={isPending}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                sort === option.value
                  ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {repos.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
          This user has no public repositories yet.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {repos.map((repo) => (
            <RepoCard key={repo.id} repo={repo} />
          ))}
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {hasNextPage && (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={isPending}
            className="rounded-lg border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-950 hover:text-zinc-950 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-50 dark:hover:text-zinc-50"
          >
            {isPending ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
