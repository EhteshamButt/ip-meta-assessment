import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ApiError, getDeveloperDashboard, getDeveloperRepos } from "@/lib/api";
import { DeveloperDashboard, PaginatedRepos } from "@/lib/types";
import { ProfileHeader } from "@/components/ProfileHeader";
import { StatsGrid } from "@/components/StatsGrid";
import { LanguageBreakdown } from "@/components/LanguageBreakdown";
import { RepoBrowser } from "@/components/RepoBrowser";
import { ErrorState } from "@/components/ErrorState";

const REPO_PAGE_SIZE = 9;

type PageProps = {
  params: Promise<{ username: string }>;
};

type LoadResult =
  | { ok: true; dashboard: DeveloperDashboard; initialRepos: PaginatedRepos }
  | { ok: false; message: string };

async function loadDeveloperData(username: string): Promise<LoadResult> {
  try {
    const [dashboard, initialRepos] = await Promise.all([
      getDeveloperDashboard(username),
      getDeveloperRepos(username, { page: 1, perPage: REPO_PAGE_SIZE, sort: "updated" }),
    ]);
    return { ok: true, dashboard, initialRepos };
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      notFound();
    }

    const message =
      error instanceof ApiError
        ? error.message
        : "Unexpected error loading this profile. Please try again.";
    return { ok: false, message };
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `${username} · Developer Dashboard`,
    description: `GitHub profile, repository stats, and top languages for ${username}.`,
  };
}

export default async function DeveloperPage({ params }: PageProps) {
  const { username } = await params;
  const result = await loadDeveloperData(username);

  if (!result.ok) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <ErrorState message={result.message} />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 space-y-8 px-6 py-10">
      <ProfileHeader profile={result.dashboard.profile} />
      <StatsGrid dashboard={result.dashboard} />
      <LanguageBreakdown languages={result.dashboard.topLanguages} />
      <RepoBrowser initial={result.initialRepos} />
    </main>
  );
}
