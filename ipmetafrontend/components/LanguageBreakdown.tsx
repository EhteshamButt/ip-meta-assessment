import { LanguageStat } from "@/lib/types";

const SERIES_VARS = [
  "var(--series-1)",
  "var(--series-2)",
  "var(--series-3)",
  "var(--series-4)",
  "var(--series-5)",
  "var(--series-6)",
];

export function LanguageBreakdown({ languages }: { languages: LanguageStat[] }) {
  if (languages.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
        Top languages
      </h2>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Share of non-fork repositories by primary language
      </p>

      <ul className="mt-4 space-y-3">
        {languages.map((stat, index) => (
          <li key={stat.language}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: SERIES_VARS[index % SERIES_VARS.length] }}
                  aria-hidden
                />
                {stat.language}
              </span>
              <span className="tabular-nums text-zinc-500 dark:text-zinc-400">
                {stat.percentage}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${stat.percentage}%`,
                  backgroundColor: SERIES_VARS[index % SERIES_VARS.length],
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
