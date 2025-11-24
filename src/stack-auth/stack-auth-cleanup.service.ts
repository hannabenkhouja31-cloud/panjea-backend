import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { sql } from 'drizzle-orm';

@Injectable()
export class StackAuthCleanupService {
  constructor(private readonly databaseService: DatabaseService) {}

  async forceDeleteStackAuthUser(email: string): Promise<boolean> {
    try {
      await this.databaseService.db.execute(
        sql`DELETE FROM neon_auth.users WHERE primary_email = ${email}`
      );
      return true;
    } catch (error) {
      console.error('Error force deleting Stack Auth user:', error);
      return false;
    }
  }

  async forceDeleteStackAuthUserById(userId: string): Promise<boolean> {
    try {
      await this.databaseService.db.execute(
        sql`DELETE FROM neon_auth.users WHERE id = ${userId}`
      );
      return true;
    } catch (error) {
      console.error('Error force deleting Stack Auth user by ID:', error);
      return false;
    }
  }
}