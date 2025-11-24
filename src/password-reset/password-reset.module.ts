import { Module } from '@nestjs/common';
import { PasswordResetService } from './password-reset.service';
import { PasswordResetController } from './password-reset.controller';
import { EmailModule } from '../email/email.module';
import { StackAuthModule } from '../stack-auth/stack-auth.module';

@Module({
  imports: [EmailModule, StackAuthModule],
  providers: [PasswordResetService],
  controllers: [PasswordResetController],
  exports: [PasswordResetService],
})
export class PasswordResetModule {}