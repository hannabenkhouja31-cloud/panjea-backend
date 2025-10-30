import { Controller, Get, Param, Query, Headers, UnauthorizedException, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { MessagesService } from './messages.service';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('trip/:tripId')
  findByTripId(
    @Param('tripId') tripId: string,
    @Headers('x-user-id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    if (!userId) {
      throw new UnauthorizedException('User ID required');
    }
    
    return this.messagesService.findByTripId(
      tripId,
      userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 30
    );
  }

  @Get('last-messages')
  getLastMessages(
    @Query('tripIds') tripIds: string,
    @Headers('x-user-id') userId: string
  ) {
    if (!userId) {
      throw new UnauthorizedException('User ID required');
    }
    
    const tripIdsArray = tripIds.split(',');
    return this.messagesService.getLastMessagesByTrips(tripIdsArray, userId);
  }

  @Post('readBy')
  @HttpCode(HttpStatus.OK)
  setMessageReadByUser(
    @Query('messageId') messageId: string,
    @Headers('x-user-id') userId: string
  ) {
    if (!userId) {
      throw new UnauthorizedException('User ID required');
    }
    
    return this.messagesService.setMessageReadByUser(messageId, userId);
  }
}