import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { MessagesModule } from 'src/messages/messages.module';

@Module({
  imports: [MessagesModule],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class ChatGatewayModule {}