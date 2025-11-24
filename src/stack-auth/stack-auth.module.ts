import { Global, Module } from '@nestjs/common';
import { StackAuthService } from './stack-auth.service';
import { StackAuthCleanupService } from './stack-auth-cleanup.service';

@Global()
@Module({
  providers: [StackAuthService, StackAuthCleanupService],
  exports: [StackAuthService],
})
export class StackAuthModule {}