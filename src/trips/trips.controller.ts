import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { TripsService } from './trips.service';
import type { NewTrip } from './entities/trip.entity';

@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  // Créer un nouveau voyage
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() data: Omit<NewTrip, 'monthYear'> & { startDate: string; endDate: string; travelTypes?: string[]; temporaryMediaIds?: string[] }) {
    return this.tripsService.create(data);
  }

  // Récupérer tous les voyages
  @Get()
  findAll(@Query('page') page?: string, @Query('limit') limit?: string, @Query('sortBy') sortBy?: string, @Query('order') order?: string) {
    return this.tripsService.findAll({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 15,
      sortBy: sortBy || 'createdAt',
      order: order || 'desc',
    });
  }
  // Récupérer les voyages d'un organisateur
  @Get('organizer/:organizerId')
  findByOrganizer(@Param('organizerId') organizerId: string) {
    return this.tripsService.findByOrganizer(organizerId);
  }

  // Récupérer tous les trips où l'utilisateur est membre JOINED
  @Get('member/:userId')
  findByMember(@Param('userId') userId: string) {
    return this.tripsService.findByMember(userId);
  }

  // Récupérer un voyage par ID
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tripsService.findOne(id);
  }

  // Modifier un voyage
  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Partial<Omit<NewTrip, 'monthYear'>> & { startDate?: string; endDate?: string; travelTypes?: string[]; temporaryMediaIds?: string[] }) {
    return this.tripsService.update(id, data);
  }

  // Supprimer un voyage
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.tripsService.remove(id);
  }

  @Patch('transfer-organizer')
  @HttpCode(HttpStatus.OK)
  async transferOrganizer(@Body() data: { oldOrganizerId: string; newOrganizerId: string }) {
    return this.tripsService.transferOrganizer(data.oldOrganizerId, data.newOrganizerId);
  }
}