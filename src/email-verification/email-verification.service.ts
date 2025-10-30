import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { emailVerificationTokens, users } from '../database/schemas';
import { eq, and, gt } from 'drizzle-orm';
import { randomBytes } from 'crypto';

@Injectable()
export class EmailVerificationService {
  constructor(private readonly databaseService: DatabaseService) {}

  async generateVerificationToken(userId: string): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.databaseService.db.insert(emailVerificationTokens).values({
      id: randomBytes(16).toString('hex'),
      userId,
      token,
      expiresAt,
    });

    return token;
  }

  async verifyToken(token: string): Promise<{ success: boolean; userId?: string }> {
    const [tokenRecord] = await this.databaseService.db
      .select()
      .from(emailVerificationTokens)
      .where(
        and(
          eq(emailVerificationTokens.token, token),
          eq(emailVerificationTokens.used, false),
          gt(emailVerificationTokens.expiresAt, new Date())
        )
      );

    if (!tokenRecord) {
      return { success: false };
    }

    await this.databaseService.db
      .update(emailVerificationTokens)
      .set({ used: true })
      .where(eq(emailVerificationTokens.id, tokenRecord.id));

    await this.databaseService.db
      .update(users)
      .set({ emailVerified: true })
      .where(eq(users.id, tokenRecord.userId));

    return { success: true, userId: tokenRecord.userId };
  }
}