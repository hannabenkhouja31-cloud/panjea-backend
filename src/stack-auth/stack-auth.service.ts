import { Injectable, OnModuleInit } from '@nestjs/common';
import { StackServerApp } from '@stackframe/js';
import { StackAuthCleanupService } from './stack-auth-cleanup.service';

@Injectable()
export class StackAuthService implements OnModuleInit {
  private stackServerApp: StackServerApp;

  constructor(private readonly stackAuthCleanupService: StackAuthCleanupService) {}

  onModuleInit() {
    this.stackServerApp = new StackServerApp({
      projectId: process.env.STACK_PROJECT_ID,
      publishableClientKey: process.env.STACK_PUBLISHABLE_CLIENT_KEY,
      secretServerKey: process.env.STACK_SECRET_SERVER_KEY,
      tokenStore: 'memory',
    });
  }

  async getUserEmail(userId: string): Promise<string | null> {
    try {
      const user = await this.stackServerApp.getUser(userId);
      return user?.primaryEmail || null;
    } catch (error) {
      console.error('Error fetching user email:', error);
      return null;
    }
  }

  async getUser(userId: string) {
    try {
      return await this.stackServerApp.getUser(userId);
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  async getUserByEmail(email: string) {
    try {
      const users = await this.stackServerApp.listUsers();
      return users.find(u => u.primaryEmail === email) || null;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      return null;
    }
  }

  async updatePassword(userId: string, newPassword: string): Promise<boolean> {
    try {
      const user = await this.stackServerApp.getUser(userId);
      if (!user) return false;

      await user.update({ password: newPassword });
      return true;
    } catch (error) {
      console.error('Error updating password:', error);
      return false;
    }
  }

  async deleteUser(userId: string): Promise<boolean> {
    try {
      const user = await this.stackServerApp.getUser(userId);
      if (!user) {
        console.log(`User ${userId} not found in Stack Auth`);
        return true;
      }

      await user.delete();

      await new Promise(resolve => setTimeout(resolve, 1000));
      const checkUser = await this.stackServerApp.getUser(userId);

      if (checkUser) {
        console.error(`User ${userId} still exists after deletion attempt, forcing cleanup`);
        return await this.stackAuthCleanupService.forceDeleteStackAuthUserById(userId);
      }

      return true;
    } catch (error) {
      if (error.message?.includes('not found')) {
        return true;
      }
      console.error('Error deleting user from Stack Auth:', error);
      return await this.stackAuthCleanupService.forceDeleteStackAuthUserById(userId);
    }
  }
}