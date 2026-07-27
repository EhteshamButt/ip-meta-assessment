import Image from "next/image";
import { DeveloperProfile } from "@/lib/types";
import { formatDate } from "@/lib/format";

export function ProfileHeader({ profile }: { profile: DeveloperProfile }) {
  return (
    <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
      <Image
        src={profile.avatarUrl}
        alt={`${profile.username}'s avatar`}
        width={112}
        height={112}
        className="rounded-full border border-zinc-200 dark:border-zinc-800"
        priority
      />

      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          {profile.name ?? profile.username}
        </h1>
        <a
          href={profile.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          @{profile.username}
        </a>

        {profile.bio && (
          <p className="mt-2 max-w-xl text-sm text-zinc-700 dark:text-zinc-300">{profile.bio}</p>
        )}

        <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
          {profile.company && <span>{profile.company}</span>}
          {profile.location && <span>{profile.location}</span>}
          {profile.blog && (
            <a
              href={profile.blog.startsWith("http") ? profile.blog : `https://${profile.blog}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-950 dark:hover:text-zinc-50"
            >
              {profile.blog}
            </a>
          )}
          <span>Joined {formatDate(profile.joinedAt)}</span>
        </dl>
      </div>
    </div>
  );
}
