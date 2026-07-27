export interface AppConfig {
  port: number;
  githubToken?: string;
  githubApiBaseUrl: string;
  corsOrigin: string;
  cacheTtlMs: number;
  openaiApiKey?: string;
  openaiModel: string;
}

export default (): { app: AppConfig } => ({
  app: {
    port: parseInt(process.env.PORT ?? '4000', 10),
    githubToken: process.env.GITHUB_TOKEN,
    githubApiBaseUrl:
      process.env.GITHUB_API_BASE_URL ?? 'https://api.github.com',
    corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    cacheTtlMs: parseInt(process.env.CACHE_TTL_MS ?? '300000', 10),
    openaiApiKey: process.env.OPENAI_API_KEY,
    openaiModel: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
  },
});
