import { Module } from '@nestjs/common';
import { TtlCacheService } from '../common/cache/ttl-cache.service';
import { GithubController } from './github.controller';
import { GithubService } from './github.service';

@Module({
  controllers: [GithubController],
  providers: [GithubService, TtlCacheService],
})
export class GithubModule {}
