import { Controller, Get } from '@nestjs/common';
import { TravelMomentsService } from './travel-moments.service';

@Controller('travel-moments')
export class TravelMomentsController {
  constructor(private readonly travelMomentsService: TravelMomentsService) {}

  @Get()
  findAll() {
    return this.travelMomentsService.findAll();
  }
}