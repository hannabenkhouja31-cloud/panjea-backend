import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { eq, and, desc, or, sql } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { messages, users, tripMembers, trips, tripMedia } from 'src/database/schemas';
import { NewMessage } from './entities/messages.entity';

@Injectable()
export class MessagesService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findByTripId(tripId: string, userId: string, page: number = 1, limit: number = 30) {
    const offset = (page - 1) * limit;

    const [trip] = await this.databaseService.db
      .select({ organizerId: trips.organizerId })
      .from(trips)
      .where(eq(trips.id, tripId));

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    const isOrganizer = trip.organizerId === userId;
    const isMember = await this.verifyUserInTrip(tripId, userId);

    const messagesWithSender = await this.databaseService.db
      .select({
        id: messages.id,
        tripId: messages.tripId,
        content: messages.content,
        questionData: messages.questionData,
        visibleTo: messages.visibleTo,
        createdAt: messages.createdAt,
        readBy: messages.readBy,
        sender: {
          id: users.id,
          username: users.username,
          profilePictureUrl: users.profilePictureUrl,
        },
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.tripId, tripId))
      .orderBy(desc(messages.createdAt))
      .limit(limit + 1)
      .offset(offset);

    const filteredMessages = messagesWithSender.filter(msg => {
      if (!msg.visibleTo) {
        return isMember;
      }
      return msg.visibleTo.includes(userId);
    });

    const hasMore = filteredMessages.length > limit;
    const messagesData = hasMore ? filteredMessages.slice(0, limit) : filteredMessages;

    return {
      data: messagesData.map(msg => ({
        id: msg.id.toString(),
        tripId: msg.tripId,
        content: msg.content,
        questionData: msg.questionData,
        visibleTo: msg.visibleTo,
        createdAt: msg.createdAt,
        readBy: msg.readBy,
        sender: msg.sender,
      })),
      meta: {
        page,
        limit,
        hasMore,
      },
    };
  }

  async create(data: Omit<NewMessage, 'createdAt'>) {
    const isMember = await this.verifyUserInTrip(data.tripId, data.senderId);
    
    if (!isMember) {
      throw new ForbiddenException('User is not a member of this trip');
    }

    const [message] = await this.databaseService.db
      .insert(messages)
      .values({
        ...data,
        readBy: []
      })
      .returning();

    const [sender] = await this.databaseService.db
      .select({
        id: users.id,
        username: users.username,
        profilePictureUrl: users.profilePictureUrl,
      })
      .from(users)
      .where(eq(users.id, data.senderId));

    return {
      id: message.id.toString(),
      tripId: message.tripId,
      content: message.content,
      questionData: message.questionData,
      visibleTo: message.visibleTo,
      createdAt: message.createdAt,
      readBy: message.readBy,
      sender,
    };
  }

  async verifyUserInTrip(tripId: string, userId: string): Promise<boolean> {
    const [member] = await this.databaseService.db
      .select()
      .from(tripMembers)
      .where(
        and(
          eq(tripMembers.tripId, tripId),
          eq(tripMembers.userId, userId),
          eq(tripMembers.status, 'JOINED')
        )
      );

    return !!member;
  }

  async getLastMessagesByTrips(tripIds: string[], userId: string) {
    const lastMessages = await Promise.all(
      tripIds.map(async (tripId) => {
        const [trip] = await this.databaseService.db
          .select({ organizerId: trips.organizerId })
          .from(trips)
          .where(eq(trips.id, tripId));

        if (!trip) return null;

        const isOrganizer = trip.organizerId === userId;
        const isMember = await this.verifyUserInTrip(tripId, userId);

        const [lastMessage] = await this.databaseService.db
          .select({
            id: messages.id,
            tripId: messages.tripId,
            content: messages.content,
            questionData: messages.questionData,
            visibleTo: messages.visibleTo,
            createdAt: messages.createdAt,
            readBy: messages.readBy,
            sender: {
              id: users.id,
              username: users.username,
              profilePictureUrl: users.profilePictureUrl,
            },
          })
          .from(messages)
          .leftJoin(users, eq(messages.senderId, users.id))
          .where(
            and(
              eq(messages.tripId, tripId),
              or(
                sql`${messages.visibleTo} IS NULL`,
                sql`${userId} = ANY(${messages.visibleTo})`
              )
            )
          )
          .orderBy(desc(messages.createdAt))
          .limit(1);

        if (!lastMessage) return null;

        if (!lastMessage.visibleTo || lastMessage.visibleTo.includes(userId)) {
          return {
            id: lastMessage.id.toString(),
            tripId: lastMessage.tripId,
            content: lastMessage.content,
            questionData: lastMessage.questionData,
            visibleTo: lastMessage.visibleTo,
            createdAt: lastMessage.createdAt,
            readBy: lastMessage.readBy,
            sender: lastMessage.sender,
          };
        }

        return null;
      })
    );

    return lastMessages.filter(msg => msg !== null);
  }

  async setMessageReadByUser(messageId: string, userId: string) {
    const [message] = await this.databaseService.db
      .update(messages)
      .set({
        readBy: sql`
          CASE 
            WHEN ${userId} = ANY(${messages.readBy}) 
            THEN ${messages.readBy}
            ELSE array_append(${messages.readBy}, ${userId})
          END
        `
      })
      .where(eq(messages.id, BigInt(messageId)))
      .returning();

    return message;
  }

  async createQuestionMessage(data: {
    tripId: string;
    askerId: string;
    organizerId: string;
    question: string;
  }) {
    const [message] = await this.databaseService.db
      .insert(messages)
      .values({
        tripId: data.tripId,
        senderId: data.askerId,
        content: data.question,
        questionData: {
          askerId: data.askerId,
          organizerId: data.organizerId,
          type: 'question',
        },
        visibleTo: [data.askerId, data.organizerId],
        readBy: [],
      })
      .returning();

    const [sender] = await this.databaseService.db
      .select({
        id: users.id,
        username: users.username,
        profilePictureUrl: users.profilePictureUrl,
      })
      .from(users)
      .where(eq(users.id, data.askerId));

    if (!sender) {
      throw new NotFoundException('Asker not found');
    }

    return {
      id: message.id.toString(),
      tripId: message.tripId,
      content: message.content,
      questionData: message.questionData,
      visibleTo: message.visibleTo,
      createdAt: message.createdAt,
      readBy: message.readBy,
      sender,
    };
  }

  async createAnswerMessage(data: {
    tripId: string;
    organizerId: string;
    askerId: string;
    answer: string;
    relatedQuestionId: string;
  }) {
    const [message] = await this.databaseService.db
      .insert(messages)
      .values({
        tripId: data.tripId,
        senderId: data.organizerId,
        content: data.answer,
        questionData: {
          askerId: data.askerId,
          organizerId: data.organizerId,
          type: 'answer',
          relatedQuestionId: data.relatedQuestionId,
        },
        visibleTo: [data.askerId, data.organizerId],
        readBy: [],
      })
      .returning();

    const [sender] = await this.databaseService.db
      .select({
        id: users.id,
        username: users.username,
        profilePictureUrl: users.profilePictureUrl,
      })
      .from(users)
      .where(eq(users.id, data.organizerId));

    if (!sender) {
      throw new NotFoundException('Organizer not found');
    }

    

    return {
      id: message.id.toString(),
      tripId: message.tripId,
      content: message.content,
      questionData: message.questionData,
      visibleTo: message.visibleTo,
      createdAt: message.createdAt,
      readBy: message.readBy,
      sender,
    };
  }

  async createJoinRequestMessage(data: {
    tripId: string;
    userId: string;
    organizerId: string;
    username: string;
  }) {
    const [message] = await this.databaseService.db
      .insert(messages)
      .values({
        tripId: data.tripId,
        senderId: data.userId,
        content: `${data.username} souhaite rejoindre le voyage`,
        questionData: {
          askerId: data.userId,
          organizerId: data.organizerId,
          type: 'join_request',
        },
        visibleTo: [data.userId, data.organizerId],
        readBy: [],
      })
      .returning();

    const [sender] = await this.databaseService.db
      .select({
        id: users.id,
        username: users.username,
        profilePictureUrl: users.profilePictureUrl,
      })
      .from(users)
      .where(eq(users.id, data.userId));

    if (!sender) {
      throw new NotFoundException('User not found');
    }

    return {
      id: message.id.toString(),
      tripId: message.tripId,
      content: message.content,
      questionData: message.questionData,
      visibleTo: message.visibleTo,
      createdAt: message.createdAt,
      readBy: message.readBy,
      sender,
    };
  }

  async updateMessageType(messageId: string, newType: 'join_accepted' | 'join_declined', newVisibleTo: string[]) {
    const [updatedMessage] = await this.databaseService.db
      .update(messages)
      .set({
        questionData: sql`jsonb_set(${messages.questionData}, '{type}', '"${sql.raw(newType)}"')`,
        visibleTo: newVisibleTo,
      })
      .where(eq(messages.id, BigInt(messageId)))
      .returning();

    const [sender] = await this.databaseService.db
      .select({
        id: users.id,
        username: users.username,
        profilePictureUrl: users.profilePictureUrl,
      })
      .from(users)
      .where(eq(users.id, updatedMessage.senderId));

    return {
      id: updatedMessage.id.toString(),
      tripId: updatedMessage.tripId,
      content: updatedMessage.content,
      questionData: updatedMessage.questionData,
      visibleTo: updatedMessage.visibleTo,
      createdAt: updatedMessage.createdAt,
      readBy: updatedMessage.readBy,
      sender,
    };
  }

  async getUnansweredQuestionsForUser(userId: string) {
  const answersNotRead = await this.databaseService.db
    .select({
      id: messages.id,
      tripId: messages.tripId,
      content: messages.content,
      questionData: messages.questionData,
      createdAt: messages.createdAt,
      readBy: messages.readBy,
      sender: {
        id: users.id,
        username: users.username,
        profilePictureUrl: users.profilePictureUrl,
      },
    })
    .from(messages)
    .leftJoin(users, eq(messages.senderId, users.id))
    .where(
      and(
        sql`${messages.questionData}->>'type' = 'answer'`,
        sql`${messages.questionData}->>'askerId' = ${userId}`,
        sql`NOT (${userId} = ANY(${messages.readBy}))`
      )
    )
    .orderBy(desc(messages.createdAt));

  return answersNotRead.map(msg => ({
    id: msg.id.toString(),
    tripId: msg.tripId,
    content: msg.content,
    questionData: msg.questionData,
    createdAt: msg.createdAt,
    readBy: msg.readBy,
    sender: msg.sender,
  }));
}

async getTripsWithQuestions(userId: string) {
  const questionsAndAnswers = await this.databaseService.db
    .select({
      tripId: messages.tripId,
      messageId: messages.id,
      content: messages.content,
      questionData: messages.questionData,
      createdAt: messages.createdAt,
      readBy: messages.readBy,
    })
    .from(messages)
    .where(
      and(
        sql`${messages.questionData}->>'askerId' = ${userId}`,
        or(
          sql`${messages.questionData}->>'type' = 'question'`,
          sql`${messages.questionData}->>'type' = 'answer'`
        )
      )
    )
    .orderBy(desc(messages.createdAt));

  const tripIds = [...new Set(questionsAndAnswers.map(m => m.tripId))];
  
  if (tripIds.length === 0) {
    return [];
  }

  const tripsData = await this.databaseService.db
    .select({
      id: trips.id,
      title: trips.title,
      destinationCountry: trips.destinationCountry,
      createdAt: trips.createdAt,
      organizerId: trips.organizerId,
    })
    .from(trips)
    .where(
      or(...tripIds.map(id => eq(trips.id, id)))
    );

  const tripsMediaData = await this.databaseService.db
    .select({
      id: tripMedia.id,
      tripId: tripMedia.tripId,
      url: tripMedia.url,
      position: tripMedia.position,
    })
    .from(tripMedia)
    .where(
      or(...tripIds.map(id => eq(tripMedia.tripId, id)))
    )
    .orderBy(tripMedia.position);

  return tripsData.map(trip => {
    const tripMessages = questionsAndAnswers.filter(m => m.tripId === trip.id);
    const lastMessage = tripMessages[0];
    const unreadCount = tripMessages.filter(m => {
      const qData = m.questionData as any;
      return qData?.type === 'answer' && 
        (!m.readBy || !m.readBy.includes(userId));
    }).length;

    const media = tripsMediaData
      .filter(m => m.tripId === trip.id)
      .map(m => ({
        id: m.id.toString(),
        url: m.url,
        position: m.position
      }));

    return {
      id: trip.id,
      title: trip.title,
      destinationCountry: trip.destinationCountry,
      createdAt: trip.createdAt,
      organizerId: trip.organizerId,
      media: media,
      lastMessageDate: lastMessage?.createdAt,
      unreadAnswersCount: unreadCount,
    };
  }).sort((a, b) => 
    new Date(b.lastMessageDate || 0).getTime() - new Date(a.lastMessageDate || 0).getTime()
  );
}

async markTripQuestionsAsRead(tripId: string, userId: string) {
  await this.databaseService.db
    .update(messages)
    .set({
      readBy: sql`
        CASE 
          WHEN ${userId} = ANY(${messages.readBy}) 
          THEN ${messages.readBy}
          ELSE array_append(${messages.readBy}, ${userId})
        END
      `
    })
    .where(
      and(
        eq(messages.tripId, tripId),
        sql`${messages.questionData}->>'type' = 'answer'`,
        sql`${messages.questionData}->>'askerId' = ${userId}`
      )
    );

  return { success: true };
}

  async createJoinNotificationMessage(data: {
    tripId: string;
    username: string;
    systemUserId: string;
  }) {
    const [message] = await this.databaseService.db
      .insert(messages)
      .values({
        tripId: data.tripId,
        senderId: data.systemUserId,
        content: `${data.username} a rejoint le groupe`,
        questionData: {
          type: 'join_notification',
        },
        visibleTo: null,
        readBy: [],
      })
      .returning();

    const [sender] = await this.databaseService.db
      .select({
        id: users.id,
        username: users.username,
        profilePictureUrl: users.profilePictureUrl,
      })
      .from(users)
      .where(eq(users.id, data.systemUserId));

    return {
      id: message.id.toString(),
      tripId: message.tripId,
      content: message.content,
      questionData: message.questionData,
      visibleTo: message.visibleTo,
      createdAt: message.createdAt,
      readBy: message.readBy,
      sender,
    };
  }
}