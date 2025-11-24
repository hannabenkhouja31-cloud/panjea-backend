import { Global, Module } from '@nestjs/common';
import { StackAuthService } from './stack-auth.service';
import { StackAuthCleanupService } from './stack-auth-cleanup.service';
import { DatabaseModule } from '../database/database.module';
import { StackAuthController } from './stack-auth.controller';

@Global()
@Module({
  imports: [DatabaseModule],
  controllers: [StackAuthController],
  providers: [StackAuthCleanupService, StackAuthService],
  exports: [StackAuthService],
})
export class StackAuthModule {}