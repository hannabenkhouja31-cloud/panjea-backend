// email-verification.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { emailVerificationTokens, users } from '../database/schemas';
import { eq, and, gt } from 'drizzle-orm';
import { randomBytes } from 'crypto';

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async generateVerificationToken(userId: string): Promise<string> {
    this.logger.log(`=== GENERATE VERIFICATION TOKEN ===`);
    this.logger.log(`User ID: ${userId}`);
    
    const token = randomBytes(32).toString('hex');
    const tokenId = randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    this.logger.log(`Token ID: ${tokenId}`);
    this.logger.log(`Token: ${token.substring(0, 10)}...`);
    this.logger.log(`Expires at: ${expiresAt.toISOString()}`);

    try {
      await this.databaseService.db.insert(emailVerificationTokens).values({
        id: tokenId,
        userId,
        token,
        expiresAt,
      });

      this.logger.log(`✓ Token saved to database`);
      this.logger.log(`=== END GENERATE TOKEN ===\n`);
    } catch (error) {
      this.logger.error(`✗ Error saving token to database:`, error);
      this.logger.log(`=== END GENERATE TOKEN (ERROR) ===\n`);
      throw error;
    }

    return token;
  }

  async verifyToken(token: string): Promise<{ success: boolean; userId?: string }> {
    this.logger.log(`=== VERIFY TOKEN ===`);
    this.logger.log(`Token: ${token.substring(0, 10)}...`);
    this.logger.log(`Current time: ${new Date().toISOString()}`);

    try {
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
        this.logger.warn(`✗ Token not found or expired/used`);
        
        const [anyToken] = await this.databaseService.db
          .select()
          .from(emailVerificationTokens)
          .where(eq(emailVerificationTokens.token, token));
        
        if (anyToken) {
          this.logger.log(`Token exists but:`);
          this.logger.log(`- Used: ${anyToken.used}`);
          this.logger.log(`- Expired: ${anyToken.expiresAt < new Date()}`);
          this.logger.log(`- Expires at: ${anyToken.expiresAt.toISOString()}`);
        } else {
          this.logger.log(`Token does not exist in database`);
        }
        
        this.logger.log(`=== END VERIFY TOKEN (FAILED) ===\n`);
        return { success: false };
      }

      this.logger.log(`✓ Token found and valid`);
      this.logger.log(`Token ID: ${tokenRecord.id}`);
      this.logger.log(`User ID: ${tokenRecord.userId}`);
      this.logger.log(`Expires at: ${tokenRecord.expiresAt.toISOString()}`);

      this.logger.log(`Marking token as used...`);
      await this.databaseService.db
        .update(emailVerificationTokens)
        .set({ used: true })
        .where(eq(emailVerificationTokens.id, tokenRecord.id));

      this.logger.log(`Updating user email verification status...`);
      await this.databaseService.db
        .update(users)
        .set({ emailVerified: true })
        .where(eq(users.id, tokenRecord.userId));

      this.logger.log(`✓ Email verified successfully for user ${tokenRecord.userId}`);
      this.logger.log(`=== END VERIFY TOKEN (SUCCESS) ===\n`);

      return { success: true, userId: tokenRecord.userId };
    } catch (error) {
      this.logger.error(`✗ Error verifying token:`, error);
      this.logger.log(`=== END VERIFY TOKEN (ERROR) ===\n`);
      return { success: false };
    }
  }
}