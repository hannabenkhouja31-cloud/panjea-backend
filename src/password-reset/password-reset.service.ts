import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { passwordResetTokens, users } from '../database/schemas';
import { eq, and, gt } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { StackAuthService } from '../stack-auth/stack-auth.service';

@Injectable()
export class PasswordResetService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly stackAuthService: StackAuthService,
  ) {}

  async generateResetToken(email: string): Promise<{ success: boolean; token?: string; userId?: string }> {
    const stackUser = await this.stackAuthService.getUserByEmail(email);
    
    if (!stackUser) {
      return { success: false };
    }

    const [user] = await this.databaseService.db
      .select()
      .from(users)
      .where(eq(users.id, stackUser.id));

    if (!user) {
      return { success: false };
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.databaseService.db.insert(passwordResetTokens).values({
      id: randomBytes(16).toString('hex'),
      userId: user.id,
      token,
      expiresAt,
    });

    return { success: true, token, userId: user.id };
  }

  async verifyResetToken(token: string): Promise<{ success: boolean; userId?: string }> {
    const [tokenRecord] = await this.databaseService.db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.used, false),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      );

    if (!tokenRecord) {
      return { success: false };
    }

    return { success: true, userId: tokenRecord.userId };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean }> {
    const verification = await this.verifyResetToken(token);

    if (!verification.success || !verification.userId) {
      return { success: false };
    }

    const passwordUpdated = await this.stackAuthService.updatePassword(verification.userId, newPassword);

    if (!passwordUpdated) {
      return { success: false };
    }

    await this.databaseService.db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.token, token));

    return { success: true };
  }
}