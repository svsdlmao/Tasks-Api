import { Global, Module } from '@nestjs/common';
import { MirrorService } from './mirror.service';
import { RestoreService } from './restore.service';

/** Global so any service can inject MirrorService without importing this module. */
@Global()
@Module({
  providers: [MirrorService, RestoreService],
  exports: [MirrorService],
})
export class MirrorModule {}
