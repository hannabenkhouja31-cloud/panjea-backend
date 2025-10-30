import { Module } from '@nestjs/common';
import { TripQuestionsController } from './trip-questions.controller';
import { ChatGatewayModule } from 'src/websocket/chat.gateway.module';
import { UsersModule } from 'src/users/users.module';
import { MessagesModule } from 'src/messages/messages.module';
import { TripsModule } from 'src/trips/trips.module';
import { TripMembersModule } from 'src/trip-members/trip-members.modules';

@Module({
  imports: [ChatGatewayModule, UsersModule, MessagesModule, TripsModule, TripMembersModule],
  controllers: [TripQuestionsController],
})
export class TripQuestionsModule {}