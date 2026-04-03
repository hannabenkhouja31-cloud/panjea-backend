import { Module } from '@nestjs/common';
import { TripMembersService } from './trip-members.service';
import { TripMembersController } from './trip-members.controller';
import { ChatGatewayModule } from 'src/websocket/chat.gateway.module';
import { MessagesModule } from 'src/messages/messages.module';

@Module({
  imports: [ChatGatewayModule, MessagesModule],
  controllers: [TripMembersController],
  providers: [TripMembersService],
  exports: [TripMembersService],
})
export class TripMembersModule {}