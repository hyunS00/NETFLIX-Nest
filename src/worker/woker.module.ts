import { Module } from '@nestjs/common';
import { ThumbnailGeerationProcess } from './thumbnail-generation.worker';

@Module({
  providers: [ThumbnailGeerationProcess],
})
export class WorkerModule {}
