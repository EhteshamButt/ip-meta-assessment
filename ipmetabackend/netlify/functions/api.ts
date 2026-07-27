import express from 'express';
import serverless from 'serverless-http';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import type { AppModule as AppModuleType } from '../../src/app.module';
import type { HttpExceptionFilter as HttpExceptionFilterType } from '../../src/common/filters/http-exception.filter';
import type { AppConfig } from '../../src/config/configuration';

// Netlify bundles this file with esbuild, which does not implement
// emitDecoratorMetadata — importing Nest's raw src/*.ts (decorator-based DI)
// straight into an esbuild bundle silently breaks dependency injection.
// Importing the already-compiled dist/ output (built by `npm run build`
// before Netlify bundles functions, see netlify.toml) sidesteps that: by the
// time esbuild sees this file, the decorator transform already happened via
// tsc and dist/ is plain JS. The `import type`s above are compile-time only
// (erased before bundling) and just give these two proper types.

/* eslint-disable @typescript-eslint/no-require-imports */
const AppModule = (
  require('../../dist/app.module') as { AppModule: typeof AppModuleType }
).AppModule;
const HttpExceptionFilter = (
  require('../../dist/common/filters/http-exception.filter') as {
    HttpExceptionFilter: typeof HttpExceptionFilterType;
  }
).HttpExceptionFilter;
/* eslint-enable @typescript-eslint/no-require-imports */

type LambdaEvent = Record<string, unknown>;
type LambdaContext = Record<string, unknown>;
type LambdaHandler = (
  event: LambdaEvent,
  context: LambdaContext,
) => Promise<unknown>;

let cachedHandler: LambdaHandler | undefined;

async function bootstrap(): Promise<LambdaHandler> {
  const expressApp = express();
  const nestApp = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
    {
      logger: ['error', 'warn'],
    },
  );

  const configService = nestApp.get(ConfigService);
  const { corsOrigin } = configService.getOrThrow<AppConfig>('app');

  nestApp.enableCors({
    origin: corsOrigin.split(',').map((origin) => origin.trim()),
  });
  nestApp.useGlobalFilters(new HttpExceptionFilter());
  await nestApp.init();

  // The redirect in netlify.toml sends /api/* here; basePath strips
  // whatever leading segment Netlify hands back (either "/api" or
  // "/.netlify/functions/api", depending on how the event is proxied) so
  // the Nest routes underneath (which are not prefixed with "api" in this
  // entry point) see a clean path like "/github/torvalds".
  return serverless(expressApp, { basePath: '/api' });
}

export const handler: LambdaHandler = async (event, context) => {
  if (!cachedHandler) {
    cachedHandler = await bootstrap();
  }
  return cachedHandler(event, context);
};
