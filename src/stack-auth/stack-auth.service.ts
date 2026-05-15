import { Injectable, OnModuleInit } from '@nestjs/common';
import { StackServerApp } from '@stackframe/js';

@Injectable()
export class StackAuthService implements OnModuleInit {
  private stackServerApp: StackServerApp;

  constructor() {}

  onModuleInit() {
    this.stackServerApp = new StackServerApp({
      projectId: process.env.STACK_PROJECT_ID,
      secretServerKey: process.env.STACK_SECRET_SERVER_KEY,
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
      return users.find((u) => u.primaryEmail === email) || null;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      return null;
    }
  }

  async updatePassword(userId: string, newPassword: string): Promise<boolean> {
    try {
      const user = await this.stackServerApp.getUser(userId);
      if (!user) return false;

      await this.stackServerApp.updateUser(userId, { password: newPassword });
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
      console.log(`✅ User ${userId} deleted from Stack Auth`);
      return true;
    } catch (error) {
      if (error.message?.includes('not found')) {
        return true;
      }
      console.error('❌ Error deleting user from Stack Auth:', error);
      return false;
    }
  }
}