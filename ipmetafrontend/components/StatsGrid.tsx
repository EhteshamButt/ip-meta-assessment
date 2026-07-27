import { DeveloperDashboard } from "@/lib/types";
import { formatCompactNumber } from "@/lib/format";

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        {formatCompactNumber(value)}
      </p>
    </div>
  );
}

export function StatsGrid({ dashboard }: { dashboard: DeveloperDashboard }) {
  const { profile, stats } = dashboard;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatTile label="Followers" value={profile.followers} />
      <StatTile label="Following" value={profile.following} />
      <StatTile label="Public repos" value={profile.publicRepos} />
      <StatTile label="Stars earned" value={stats.totalStars} />
    </div>
  );
}
