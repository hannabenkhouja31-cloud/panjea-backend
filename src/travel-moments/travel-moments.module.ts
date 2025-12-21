import { Module } from '@nestjs/common';
import { TravelMomentsController } from './travel-moments.controller';
import { TravelMomentsService } from './travel-moments.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [TravelMomentsController],
  providers: [TravelMomentsService],
  exports: [TravelMomentsService],
})
export class TravelMomentsModule {}