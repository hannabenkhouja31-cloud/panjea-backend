import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { travelTypes } from 'src/database/schemas';

@Injectable()
export class TravelTypesService {

  constructor(private readonly databaseService: DatabaseService) {}

  async findAll() {
    const travelTypesInDb = await this.databaseService.db.select().from(travelTypes);
    return travelTypesInDb;
  }

}
