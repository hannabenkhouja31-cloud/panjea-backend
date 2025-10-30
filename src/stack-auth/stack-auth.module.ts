import { Global, Module } from '@nestjs/common';
import { StackAuthService } from './stack-auth.service';

@Global()
@Module({
  providers: [StackAuthService],
  exports: [StackAuthService],
})
export class StackAuthModule {}