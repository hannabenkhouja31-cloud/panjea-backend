import { Controller, Get, Post, Delete, Patch, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { TripMediaService } from './trip-media.service';

@Controller('trip-media')
export class TripMediaController {
  constructor(private readonly tripMediaService: TripMediaService) {}

  @Get('trip/:tripId')
  findByTrip(@Param('tripId') tripId: string) {
    return this.tripMediaService.findByTrip(tripId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.tripMediaService.remove(BigInt(id));
  }

  @Patch('positions')
  updatePositions(@Body() data: { updates: { id: string; position: number }[] }) {
    const updates = data.updates.map(u => ({ id: BigInt(u.id), position: u.position }));
    return this.tripMediaService.updatePositions(updates);
  }
}