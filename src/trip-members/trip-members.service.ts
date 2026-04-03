import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { tripMembers, trips, users } from 'src/database/schemas';
import { ChatGateway } from 'src/websocket/chat.gateway';
import { MessagesService } from 'src/messages/messages.service';

@Injectable()
export class TripMembersService {
  
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly chatGateway: ChatGateway,
    private readonly messagesService: MessagesService,
  ) {}

  async requestToJoin(tripId: string, userId: string) {
    // Vérifier que le trip existe
    const [trip] = await this.databaseService.db
      .select()
      .from(trips)
      .where(eq(trips.id, tripId));

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    // Vérifier si l'utilisateur est déjà membre ou a déjà une demande
    const [existingMember] = await this.databaseService.db
      .select()
      .from(tripMembers)
      .where(
        and(
          eq(tripMembers.tripId, tripId),
          eq(tripMembers.userId, userId)
        )
      );

    if (existingMember) {
      if (existingMember.status === 'JOINED') {
        throw new BadRequestException('Already a member of this trip');
      }
      if (existingMember.status === 'PENDING') {
        throw new BadRequestException('Request already pending');
      }
      if (existingMember.status === 'DECLINED') {
        throw new BadRequestException('Your request was declined');
      }
      if (existingMember.status === 'LEFT') {
        // Permettre de rejoindre à nouveau en créant une nouvelle demande
        await this.databaseService.db
          .update(tripMembers)
          .set({ status: 'PENDING', joinedAt: new Date() })
          .where(
            and(
              eq(tripMembers.tripId, tripId),
              eq(tripMembers.userId, userId)
            )
          );
        return { message: 'Request to join sent again' };
      }
    }

    // Créer la demande
    await this.databaseService.db
      .insert(tripMembers)
      .values({
        tripId,
        userId,
        status: 'PENDING',
      });

    return { message: 'Request to join sent' };
  }

  async acceptMember(tripId: string, userId: string, organizerId: string, messageId?: string) {
    const [trip] = await this.databaseService.db
      .select()
      .from(trips)
      .where(eq(trips.id, tripId));

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    if (trip.organizerId !== organizerId) {
      throw new ForbiddenException('Only the organizer can accept members');
    }

    const [member] = await this.databaseService.db
      .select()
      .from(tripMembers)
      .where(
        and(
          eq(tripMembers.tripId, tripId),
          eq(tripMembers.userId, userId)
        )
      );

    if (!member) {
      throw new NotFoundException('Member request not found');
    }

    if (member.status !== 'PENDING') {
      throw new BadRequestException('Member is not in pending status');
    }

    await this.databaseService.db
      .update(tripMembers)
      .set({ status: 'JOINED' })
      .where(
        and(
          eq(tripMembers.tripId, tripId),
          eq(tripMembers.userId, userId)
        )
      );

    this.chatGateway.notifyMemberAccepted(userId, tripId);

    if (messageId) {
      const updatedMessage = await this.messagesService.updateMessageType(
        messageId,
        'join_accepted',
        [organizerId]
      );
      this.chatGateway.sendUpdatedMessage(tripId, updatedMessage);

      const [acceptedUser] = await this.databaseService.db
        .select()
        .from(users)
        .where(eq(users.id, userId));

      if (acceptedUser) {
        const notificationMessage = await this.messagesService.createJoinNotificationMessage({
          tripId,
          username: acceptedUser.username,
          systemUserId: organizerId,
        });
        this.chatGateway.sendJoinRequestMessage(tripId, notificationMessage);
      }
    }
    
    return { message: 'Member accepted' };
  }

  async declineMember(tripId: string, userId: string, organizerId: string, messageId?: string) {
    const [trip] = await this.databaseService.db
      .select()
      .from(trips)
      .where(eq(trips.id, tripId));

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    if (trip.organizerId !== organizerId) {
      throw new ForbiddenException('Only the organizer can decline members');
    }

    const [member] = await this.databaseService.db
      .select()
      .from(tripMembers)
      .where(
        and(
          eq(tripMembers.tripId, tripId),
          eq(tripMembers.userId, userId)
        )
      );

    if (!member) {
      throw new NotFoundException('Member request not found');
    }

    if (member.status !== 'PENDING') {
      throw new BadRequestException('Member is not in pending status');
    }

    await this.databaseService.db
      .update(tripMembers)
      .set({ status: 'DECLINED' })
      .where(
        and(
          eq(tripMembers.tripId, tripId),
          eq(tripMembers.userId, userId)
        )
      );

    if (messageId) {
      const updatedMessage = await this.messagesService.updateMessageType(
        messageId,
        'join_declined',
        [organizerId]
      );
      this.chatGateway.sendUpdatedMessage(tripId, updatedMessage);
    }

    return { message: 'Member declined' };
  }

  async leaveTrip(tripId: string, userId: string) {

    const [member] = await this.databaseService.db
      .select()
      .from(tripMembers)
      .where(
        and(
          eq(tripMembers.tripId, tripId),
          eq(tripMembers.userId, userId)
        )
      );

    if (!member) {
      throw new NotFoundException('You are not a member of this trip');
    }

    if (member.status !== 'JOINED') {
      throw new BadRequestException('You are not an active member of this trip');
    }

    const [trip] = await this.databaseService.db
      .select()
      .from(trips)
      .where(eq(trips.id, tripId));

    if (trip.organizerId === userId) {
      throw new BadRequestException('The organizer cannot leave their own trip');
    }

    await this.databaseService.db
      .update(tripMembers)
      .set({ status: 'LEFT' })
      .where(
        and(
          eq(tripMembers.tripId, tripId),
          eq(tripMembers.userId, userId)
        )
      );

    return { message: 'You left the trip' };
  }

  async getMembersByTrip(tripId: string) {
    const members = await this.databaseService.db
      .select({
        id: tripMembers.id,
        tripId: tripMembers.tripId,
        status: tripMembers.status,
        joinedAt: tripMembers.joinedAt,
        user: {
          id: users.id,
          username: users.username,
          profilePictureUrl: users.profilePictureUrl,
        },
      })
      .from(tripMembers)
      .leftJoin(users, eq(tripMembers.userId, users.id))
      .where(eq(tripMembers.tripId, tripId));

    return members.map(member => ({
      id: member.id.toString(),
      tripId: member.tripId,
      status: member.status,
      joinedAt: member.joinedAt,
      user: member.user,
    }));
  }

  async getPendingRequests(tripId: string, organizerId: string) {
    // Vérifier que c'est bien l'organisateur
    const [trip] = await this.databaseService.db
      .select()
      .from(trips)
      .where(eq(trips.id, tripId));

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    if (trip.organizerId !== organizerId) {
      throw new ForbiddenException('Only the organizer can view pending requests');
    }

    const pendingMembers = await this.databaseService.db
      .select({
        id: tripMembers.id,
        tripId: tripMembers.tripId,
        status: tripMembers.status,
        joinedAt: tripMembers.joinedAt,
        user: {
          id: users.id,
          username: users.username,
          profilePictureUrl: users.profilePictureUrl,
        },
      })
      .from(tripMembers)
      .leftJoin(users, eq(tripMembers.userId, users.id))
      .where(
        and(
          eq(tripMembers.tripId, tripId),
          eq(tripMembers.status, 'PENDING')
        )
      );

    return pendingMembers.map(member => ({
      id: member.id.toString(),
      tripId: member.tripId,
      status: member.status,
      joinedAt: member.joinedAt,
      user: member.user,
    }));
  }

  async getMemberStatus(tripId: string, userId: string) {
    const [member] = await this.databaseService.db
      .select()
      .from(tripMembers)
      .where(
        and(
          eq(tripMembers.tripId, tripId),
          eq(tripMembers.userId, userId)
        )
      );

    if (!member) {
      return { status: null };
    }

    return { status: member.status };
  }
}