import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { MessagesService } from 'src/messages/messages.service';

const userSocketMap = new Map<string, string>();

@WebSocketGateway({
  cors: true
})
export class ChatGateway {
  constructor(private readonly messagesService: MessagesService) {}

  @WebSocketServer()
  server: Server;

  handleConnection(client: any) {
    console.log(`Client connecté: ${client.id}`);
  }

  handleDisconnect(client: any) {
    console.log(`Client déconnecté: ${client.id}`);
    for (const [userId, socketId] of userSocketMap.entries()) {
      if (socketId === client.id) {
        userSocketMap.delete(userId);
        console.log(`Removed ${userId} from userSocketMap`);
        break;
      }
    }
  }

  @SubscribeMessage('identification')
  handleIdentification(@MessageBody() userId: string, @ConnectedSocket() client: any) {
    console.log('Identification Reçue:', userId);
    userSocketMap.set(userId, client.id);
    console.log(`Mapped ${userId} to socket ${client.id}`);
    client.emit('identification', 'Identify verified');
  }

  @SubscribeMessage('joinTrip')
  async handleJoinTrip(
    @MessageBody() data: { tripId: string; userId: string },
    @ConnectedSocket() client: any
  ) {
    const isMember = await this.messagesService.verifyUserInTrip(data.tripId, data.userId);
    
    if (isMember) {
      client.join(data.tripId);
      client.emit('joinedTrip', data.tripId);
      console.log(`User ${data.userId} joined trip room ${data.tripId}`);
    } else {
      client.emit('error', 'Not authorized to join this trip');
    }
  }

  @SubscribeMessage('leaveTrip')
  handleLeaveTrip(
    @MessageBody() data: { tripId: string },
    @ConnectedSocket() client: any
  ) {
    client.leave(data.tripId);
    client.emit('leftTrip', data.tripId);
    console.log(`Client left trip room ${data.tripId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: { tripId: string; userId: string; content: string },
    @ConnectedSocket() client: any
  ) {
    try {
      const message = await this.messagesService.create({
        tripId: data.tripId,
        senderId: data.userId,
        content: data.content,
        readBy: [data.userId],
      });

      this.server.to(data.tripId).emit('newMessage', message);
      
      console.log(`Message sent to trip ${data.tripId}:`, message);
    } catch (error) {
      client.emit('error', error.message);
      console.error('Error sending message:', error);
    }
  }

  notifyMemberAccepted(userId: string, tripId: string) {
    const socketId = userSocketMap.get(userId);
    
    if (socketId) {
      this.server.to(socketId).emit('memberAccepted', { tripId });
      console.log(`✅ Notification envoyée à ${userId} (socket: ${socketId}) pour le trip ${tripId}`);
    } else {
      console.log(`⚠️ User ${userId} n'est pas connecté, notification non envoyée`);
    }
  }

  sendQuestionMessage(tripId: string, message: any) {
    const visibleTo = message.visibleTo || [];
    
    visibleTo.forEach((userId: string) => {
      const socketId = userSocketMap.get(userId);
      if (socketId) {
        this.server.to(socketId).emit('newMessage', message);
        console.log(`Question message sent to user ${userId}`);
      }
    });
  }

  sendAnswerMessage(tripId: string, message: any) {
    const visibleTo = message.visibleTo || [];
    
    visibleTo.forEach((userId: string) => {
      const socketId = userSocketMap.get(userId);
      if (socketId) {
        this.server.to(socketId).emit('newMessage', message);
        console.log(`Answer message sent to user ${userId}`);
      }
    });
  }

  @SubscribeMessage('test')
  handleMessage(@MessageBody() data: string, @ConnectedSocket() client: any) {
    console.log('Reçu:', data);
    client.emit('handleMessageFromBackendTest', 'Bien reçu!');
    this.server.emit('broadcast', 'Nouveau message de quelqu\'un!');
  }

  sendJoinRequestMessage(tripId: string, message: any) {
    const visibleTo = message.visibleTo || [];
    
    visibleTo.forEach((userId: string) => {
      const socketId = userSocketMap.get(userId);
      if (socketId) {
        this.server.to(socketId).emit('newMessage', message);
        console.log(`Join request message sent to user ${userId}`);
      }
    });
  }

  sendUpdatedMessage(tripId: string, message: any) {
    const visibleTo = message.visibleTo || [];
    
    visibleTo.forEach((userId: string) => {
      const socketId = userSocketMap.get(userId);
      if (socketId) {
        this.server.to(socketId).emit('messageUpdated', message);
        console.log(`Updated message sent to user ${userId}`);
      }
    });

    this.server.to(tripId).emit('messageUpdated', message);
  }
}