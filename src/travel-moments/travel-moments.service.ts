import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { travelMoments } from '../database/schemas/travel-moments.schema';

@Injectable()
export class TravelMomentsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll() {
    return await this.databaseService.db.select().from(travelMoments).execute();
  }
}