import { Controller, Get, Post, Patch, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { TripMembersService } from './trip-members.service';

@Controller('trip-members')
export class TripMembersController {
  constructor(private readonly tripMembersService: TripMembersService) {}

  // Demander à rejoindre un trip
  @Post('request')
  @HttpCode(HttpStatus.CREATED)
  requestToJoin(@Body() data: { tripId: string; userId: string }) {
    return this.tripMembersService.requestToJoin(data.tripId, data.userId);
  }

  @Patch(':tripId/accept/:userId')
  acceptMember(
    @Param('tripId') tripId: string,
    @Param('userId') userId: string,
    @Body() data: { organizerId: string; messageId?: string }
  ) {
    return this.tripMembersService.acceptMember(tripId, userId, data.organizerId, data.messageId);
  }

  @Patch(':tripId/decline/:userId')
  declineMember(
    @Param('tripId') tripId: string,
    @Param('userId') userId: string,
    @Body() data: { organizerId: string; messageId?: string }
  ) {
    return this.tripMembersService.declineMember(tripId, userId, data.organizerId, data.messageId);
  }

  // Quitter un trip
  @Patch(':tripId/leave')
  leaveTrip(@Param('tripId') tripId: string, @Body() data: { userId: string }) {
    return this.tripMembersService.leaveTrip(tripId, data.userId);
  }

  // Récupérer tous les membres d'un trip
  @Get(':tripId')
  getMembersByTrip(@Param('tripId') tripId: string) {
    return this.tripMembersService.getMembersByTrip(tripId);
  }

  // Récupérer les demandes en attente (organizer only)
  @Get(':tripId/pending')
  getPendingRequests(
    @Param('tripId') tripId: string,
    @Query('organizerId') organizerId: string
  ) {
    return this.tripMembersService.getPendingRequests(tripId, organizerId);
  }

  // Vérifier le statut d'un membre
  @Get(':tripId/status/:userId')
  getMemberStatus(@Param('tripId') tripId: string, @Param('userId') userId: string) {
    return this.tripMembersService.getMemberStatus(tripId, userId);
  }
}