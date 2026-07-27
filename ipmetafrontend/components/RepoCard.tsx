import { RepoSummary } from "@/lib/types";
import { formatCompactNumber, formatRelativeDate } from "@/lib/format";

export function RepoCard({ repo }: { repo: RepoSummary }) {
  return (
    <a
      href={repo.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-50"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="truncate font-medium text-zinc-950 dark:text-zinc-50">
          {repo.name}
        </span>
        {repo.isFork && (
          <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            Fork
          </span>
        )}
      </div>

      {repo.description && (
        <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
          {repo.description}
        </p>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-xs text-zinc-500 dark:text-zinc-400">
        {repo.language && (
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[var(--series-1)]" aria-hidden />
            {repo.language}
          </span>
        )}
        <span>★ {formatCompactNumber(repo.stars)}</span>
        <span>⑂ {formatCompactNumber(repo.forks)}</span>
        <span>Updated {formatRelativeDate(repo.updatedAt)}</span>
      </div>
    </a>
  );
}
