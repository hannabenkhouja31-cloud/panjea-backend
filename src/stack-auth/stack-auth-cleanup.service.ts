import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { sql } from 'drizzle-orm';

@Injectable()
export class StackAuthCleanupService {
  constructor(private readonly databaseService: DatabaseService) {}

  async forceDeleteStackAuthUser(email: string): Promise<boolean> {
    try {
      console.log('🧹 [CLEANUP] Starting force delete for email:', email);

      const checkQuery = sql`SELECT id, email FROM neon_auth.users_sync WHERE email = ${email}`;
      const existing = await this.databaseService.db.execute(checkQuery);
      console.log('🔍 [CLEANUP] Found existing users:', existing.rows);

      const deleteQuery = sql`DELETE FROM neon_auth.users_sync WHERE email = ${email}`;
      const result = await this.databaseService.db.execute(deleteQuery);
      console.log('✅ [CLEANUP] Delete result:', result);

      const verifyQuery = sql`SELECT id, email FROM neon_auth.users_sync WHERE email = ${email}`;
      const verify = await this.databaseService.db.execute(verifyQuery);
      console.log('🔍 [CLEANUP] Verification after delete:', verify.rows);

      return verify.rows.length === 0;
    } catch (error) {
      console.error('❌ [CLEANUP] Error force deleting Stack Auth user:', error);
      return false;
    }
  }

  async forceDeleteStackAuthUserById(userId: string): Promise<boolean> {
    try {
      console.log('🧹 [CLEANUP] Starting force delete for userId:', userId);

      const checkQuery = sql`SELECT id, email FROM neon_auth.users_sync WHERE id = ${userId}`;
      const existing = await this.databaseService.db.execute(checkQuery);
      console.log('🔍 [CLEANUP] Found existing users:', existing.rows);

      const deleteQuery = sql`DELETE FROM neon_auth.users_sync WHERE id = ${userId}`;
      const result = await this.databaseService.db.execute(deleteQuery);
      console.log('✅ [CLEANUP] Delete result:', result);

      const verifyQuery = sql`SELECT id, email FROM neon_auth.users_sync WHERE id = ${userId}`;
      const verify = await this.databaseService.db.execute(verifyQuery);
      console.log('🔍 [CLEANUP] Verification after delete:', verify.rows);

      return verify.rows.length === 0;
    } catch (error) {
      console.error('❌ [CLEANUP] Error force deleting Stack Auth user by ID:', error);
      return false;
    }
  }
}