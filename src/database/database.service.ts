import { Inject, Injectable } from '@nestjs/common';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { DRIZZLE } from './drizzle.provider';
import * as schema from './schemas/index';

@Injectable()
export class DatabaseService {
  constructor(
    @Inject(DRIZZLE) public db: NeonHttpDatabase<typeof schema>,
  ) {}
}