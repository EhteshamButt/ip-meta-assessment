function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800 ${className}`} />;
}

export default function LoadingDeveloperPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 space-y-8 px-6 py-10">
      <div className="flex items-center gap-6">
        <Pulse className="h-28 w-28 shrink-0 !rounded-full" />
        <div className="flex-1 space-y-3">
          <Pulse className="h-6 w-48" />
          <Pulse className="h-4 w-32" />
          <Pulse className="h-4 w-full max-w-md" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Pulse key={i} className="h-20" />
        ))}
      </div>

      <Pulse className="h-40" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Pulse key={i} className="h-32" />
        ))}
      </div>
    </main>
  );
}
