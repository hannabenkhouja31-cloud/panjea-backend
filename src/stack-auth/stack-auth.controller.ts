import { Controller, Delete, Post, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { StackAuthService } from './stack-auth.service';
import { StackAuthCleanupService } from './stack-auth-cleanup.service';

@Controller('stack-auth')
export class StackAuthController {
  constructor(
    private readonly stackAuthService: StackAuthService,
    private readonly stackAuthCleanupService: StackAuthCleanupService,
  ) {}

  @Delete('delete-user/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') id: string) {
    console.log('🗑️ [CONTROLLER] Delete user request for ID:', id);
    const success = await this.stackAuthService.deleteUser(id);
    if (!success) {
      console.log('⚠️ [CONTROLLER] Normal delete failed, forcing cleanup...');
      await this.stackAuthCleanupService.forceDeleteStackAuthUserById(id);
    }
    console.log('✅ [CONTROLLER] Delete user completed');
  }

  @Post('force-delete-by-email')
  @HttpCode(HttpStatus.NO_CONTENT)
  async forceDeleteByEmail(@Body() body: { email: string }) {
    console.log('🗑️ [CONTROLLER] Force delete by email request:', body.email);
    const result = await this.stackAuthCleanupService.forceDeleteStackAuthUser(body.email);
    console.log('✅ [CONTROLLER] Force delete completed, success:', result);
  }
}