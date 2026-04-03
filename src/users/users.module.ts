import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { EmailModule } from 'src/email/email.module';
import { EmailVerificationModule } from 'src/email-verification/email-verification.module';
import { StackAuthModule } from '../stack-auth/stack-auth.module';

@Module({
  imports: [EmailModule, EmailVerificationModule, StackAuthModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
