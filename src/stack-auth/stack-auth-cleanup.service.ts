import { Injectable } from '@nestjs/common';
import { StackAuthService } from './stack-auth.service';

@Injectable()
export class StackAuthCleanupService {
  constructor(
    private readonly stackAuthService: StackAuthService,
  ) {}

  async forceDeleteStackAuthUser(email: string): Promise<boolean> {
    try {
      console.log('🧹 [CLEANUP] Starting force delete for email:', email);

      const user = await this.stackAuthService.getUserByEmail(email);
      console.log('🔍 [CLEANUP] Found user via Stack Auth API:', user?.id);

      if (!user) {
        console.log('✅ [CLEANUP] No user found with this email');
        return true;
      }

      console.log('🗑️ [CLEANUP] Deleting user via Stack Auth API...');
      const deleted = await this.stackAuthService.deleteUser(user.id);
      console.log('✅ [CLEANUP] Delete result:', deleted);

      return deleted;
    } catch (error) {
      console.error('❌ [CLEANUP] Error force deleting Stack Auth user:', error);
      return false;
    }
  }

  async forceDeleteStackAuthUserById(userId: string): Promise<boolean> {
    try {
      console.log('🧹 [CLEANUP] Starting force delete for userId:', userId);
      return await this.stackAuthService.deleteUser(userId);
    } catch (error) {
      console.error('❌ [CLEANUP] Error force deleting Stack Auth user by ID:', error);
      return false;
    }
  }
}