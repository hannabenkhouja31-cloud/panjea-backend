import { Injectable, Logger } from '@nestjs/common';
import { StackAuthService } from './stack-auth.service';

@Injectable()
export class StackAuthCleanupService {
  private readonly logger = new Logger(StackAuthCleanupService.name);

  constructor(
    private readonly stackAuthService: StackAuthService,
  ) {}

  async forceDeleteStackAuthUser(email: string): Promise<boolean> {
    this.logger.log(`🧹 Force deleting Stack Auth user: ${email}`);

    try {
      const user = await this.stackAuthService.getUserByEmail(email);

      if (!user) {
        this.logger.log(`✅ User ${email} not found in Stack Auth (already deleted?)`);
        return true;
      }

      this.logger.log(`🔍 Found user ${user.id}, deleting...`);
      const deleted = await this.stackAuthService.deleteUser(user.id);

      if (deleted) {
        this.logger.log(`✅ Successfully deleted user ${email} from Stack Auth`);
        return true;
      }

      this.logger.error(`❌ Failed to delete user ${email} from Stack Auth`);
      return false;
    } catch (error) {
      this.logger.error(`❌ Error deleting user ${email}:`, error);
      return false;
    }
  }

  async forceDeleteStackAuthUserById(userId: string): Promise<boolean> {
    this.logger.log(`🧹 Force deleting Stack Auth user by ID: ${userId}`);

    try {
      const deleted = await this.stackAuthService.deleteUser(userId);

      if (deleted) {
        this.logger.log(`✅ Successfully deleted user ${userId} from Stack Auth`);
        return true;
      }

      this.logger.error(`❌ Failed to delete user ${userId} from Stack Auth`);
      return false;
    } catch (error) {
      this.logger.error(`❌ Error deleting user ${userId}:`, error);
      return false;
    }
  }
}