import { Controller, Get, Post, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { TemporaryTripMediaService } from './temporary-trip-media.service';

@Controller('temporary-trip-media')
export class TemporaryTripMediaController {
  constructor(private readonly temporaryTripMediaService: TemporaryTripMediaService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() data: { userId: string; url: string }) {
    return this.temporaryTripMediaService.create(data.userId, data.url);
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.temporaryTripMediaService.findByUser(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Body() data: { userId: string }) {
    return this.temporaryTripMediaService.remove(BigInt(id), data.userId);
  }
}