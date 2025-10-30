import { Controller, Post, Body, Param, BadRequestException, NotFoundException } from '@nestjs/common';
import { ChatGateway } from 'src/websocket/chat.gateway';
import { UsersService } from 'src/users/users.service';
import { MessagesService } from 'src/messages/messages.service';
import { CreateTripQuestionDto } from './dto/create-trip-question.dto';
import { TripsService } from 'src/trips/trips.service';
import { AnswerTripQuestionDto } from './dto/answer-trip-question.dto';
import { CreateJoinRequestDto } from './dto/create-join-request.dto';
import { TripMembersService } from 'src/trip-members/trip-members.service';

@Controller('trips')
export class TripQuestionsController {
  constructor(
    private readonly chatGateway: ChatGateway,
    private readonly usersService: UsersService,
    private readonly tripsService: TripsService,
    private readonly messagesService: MessagesService,
    private readonly tripMembersService: TripMembersService,
  ) {}

  @Post(':tripId/answer-question')
  async answerQuestion(
    @Param('tripId') tripId: string,
    @Body() answerTripQuestionDto: AnswerTripQuestionDto,
  ) {
    const { organizerId, askerId, answer, relatedQuestionId } = answerTripQuestionDto;

    const trip = await this.tripsService.findOne(tripId);
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    if (trip.organizerId !== organizerId) {
      throw new BadRequestException('Only the organizer can answer questions');
    }

    try {
      const message = await this.messagesService.createAnswerMessage({
        tripId,
        organizerId,
        askerId,
        answer,
        relatedQuestionId,
      });

      this.chatGateway.sendAnswerMessage(tripId, message);

      return { success: true, message };
    } catch (error) {
      throw new BadRequestException(`Failed to send answer: ${error.message}`);
    }
  }

  @Post(':tripId/ask-question')
  async askQuestion(
    @Param('tripId') tripId: string,
    @Body() createTripQuestionDto: CreateTripQuestionDto,
  ) {
    const { askerId, question } = createTripQuestionDto;

    const trip = await this.tripsService.findOne(tripId);
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    let fromUser: Awaited<ReturnType<typeof this.usersService.findOne>>;
    try {
      fromUser = await this.usersService.findOne(askerId);
    } catch (error) {
      throw new BadRequestException(`Asker with ID ${askerId} not found`);
    }

    try {
      const message = await this.messagesService.createQuestionMessage({
        tripId,
        askerId,
        organizerId: trip.organizerId,
        question,
      });

      this.chatGateway.sendQuestionMessage(tripId, message);

      return { success: true, message };
    } catch (error) {
      throw new BadRequestException(`Failed to send question: ${error.message}`);
    }
  }

  @Post(':tripId/join-request')
  async createJoinRequest(
    @Param('tripId') tripId: string,
    @Body() createJoinRequestDto: CreateJoinRequestDto,
  ) {
    const { userId } = createJoinRequestDto;

    const trip = await this.tripsService.findOne(tripId);
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    let fromUser: Awaited<ReturnType<typeof this.usersService.findOne>>;
    try {
      fromUser = await this.usersService.findOne(userId);
    } catch (error) {
      throw new BadRequestException(`User with ID ${userId} not found`);
    }

    try {
      await this.tripMembersService.requestToJoin(tripId, userId);
      
      const message = await this.messagesService.createJoinRequestMessage({
        tripId,
        userId,
        organizerId: trip.organizerId,
        username: fromUser.username,
      });

      this.chatGateway.sendJoinRequestMessage(tripId, message);

      return { success: true, message };
    } catch (error) {
      throw new BadRequestException(`Failed to send join request: ${error.message}`);
    }
  }
}