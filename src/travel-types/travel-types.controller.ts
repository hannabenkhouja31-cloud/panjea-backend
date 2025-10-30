import { Controller, Get, HttpCode } from '@nestjs/common';
import { TravelTypesService } from './travel-types.service';

@Controller('travel-types')
export class TravelTypesController {
  constructor(private readonly travelTypesService: TravelTypesService) {}

  // Récupérer tous les types de voyage
  @Get()
  @HttpCode(200)
  findAll() {
    return this.travelTypesService.findAll();
  }
}