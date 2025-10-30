import { Module } from '@nestjs/common';
import { TravelTypesService } from './travel-types.service';
import { TravelTypesController } from './travel-types.controller';

@Module({
  controllers: [TravelTypesController],
  providers: [TravelTypesService],
})
export class TravelTypesModule {}
