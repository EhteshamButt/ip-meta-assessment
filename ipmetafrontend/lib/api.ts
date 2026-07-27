import {
  ApiErrorBody,
  DeveloperDashboard,
  PaginatedRepos,
  RepoSort,
} from "./types";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
}

async function apiFetch<T>(path: string): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${getApiBaseUrl()}${path}`);
  } catch {
    throw new ApiError(
      "Could not reach the API. Is the backend running?",
      0,
    );
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
    const message = Array.isArray(body?.message)
      ? body.message.join(", ")
      : (body?.message ?? `Request failed with status ${response.status}`);
    throw new ApiError(message, response.status);
  }

  return response.json() as Promise<T>;
}

export function getDeveloperDashboard(username: string): Promise<DeveloperDashboard> {
  return apiFetch<DeveloperDashboard>(`/github/${encodeURIComponent(username)}`);
}

export function getDeveloperRepos(
  username: string,
  options: { page?: number; perPage?: number; sort?: RepoSort } = {},
): Promise<PaginatedRepos> {
  const params = new URLSearchParams();
  if (options.page) params.set("page", String(options.page));
  if (options.perPage) params.set("perPage", String(options.perPage));
  if (options.sort) params.set("sort", options.sort);

  const query = params.toString();
  return apiFetch<PaginatedRepos>(
    `/github/${encodeURIComponent(username)}/repos${query ? `?${query}` : ""}`,
  );
}
