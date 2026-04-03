import { Module } from '@nestjs/common';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { TripMediaService } from './trip-media.service';
import { TripMediaController } from './trip-media.controller';
import { TemporaryTripMediaController } from './temporary-trip-media.controller';
import { TemporaryTripMediaService } from './temporary-trip-media.service';

@Module({
  controllers: [TripsController, TripMediaController, TemporaryTripMediaController],
  providers: [TripsService, TripMediaService, TemporaryTripMediaService],
  exports: [TripsService, TripMediaService, TemporaryTripMediaService],
})
export class TripsModule {}
