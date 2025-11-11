import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { TripsModule } from './trips/trips.module';
import { DatabaseModule } from './database/database.module';
import { TravelTypesModule } from './travel-types/travel-types.module';
import { UploadthingModule } from './uploadthing/uploadthing.module';
import { ChatGatewayModule } from './websocket/chat.gateway.module';
import { MessagesModule } from './messages/messages.module';
import { TripMembersModule } from './trip-members/trip-members.modules';
import { EmailModule } from './email/email.module';
import { StackAuthModule } from './stack-auth/stack-auth.module';
import { EmailVerificationModule } from './email-verification/email-verification.module';
import { PasswordResetModule } from './password-reset/password-reset.module';
import { TripQuestionsModule } from './trip-questions/trip-questions.module';
import { UserReportsModule } from './user-reports/user-reports.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [AdminModule, UserReportsModule, TripQuestionsModule, PasswordResetModule, EmailVerificationModule, StackAuthModule, EmailModule, UsersModule, TripsModule, DatabaseModule, TripMembersModule, TravelTypesModule, UploadthingModule, MessagesModule, ChatGatewayModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
