import { SearchForm } from "@/components/SearchForm";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-24 text-center">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl dark:text-zinc-50">
          GitHub Developer Dashboard
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-base text-zinc-600 dark:text-zinc-400">
          Enter any GitHub username to pull their public profile, repository
          stats, and top languages straight from the GitHub API.
        </p>
      </div>

      <SearchForm />
    </main>
  );
}
