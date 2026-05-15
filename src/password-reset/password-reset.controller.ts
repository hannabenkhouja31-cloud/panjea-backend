import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { PasswordResetService } from './password-reset.service';
import { EmailService } from '../email/email.service';
import { StackAuthService } from '../stack-auth/stack-auth.service';

@Controller('password-reset')
export class PasswordResetController {
  constructor(
    private readonly passwordResetService: PasswordResetService,
    private readonly emailService: EmailService,
    private readonly stackAuthService: StackAuthService,
  ) {}

  @Post('request')
  async requestReset(@Body('email') email: string) {
    const result = await this.passwordResetService.generateResetToken(email);

    if (result.success && result.token && result.userId) {
      this.emailService
        .sendPasswordResetEmail(email, result.token)
        .catch(err => console.error('Password reset email error:', err));
    }

    return { success: true };
  }

  @Get('verify')
  async verifyToken(@Query('token') token: string) {
    const result = await this.passwordResetService.verifyResetToken(token);
    return result;
  }

  @Post('confirm')
  async confirmReset(@Body('token') token: string, @Body('newPassword') newPassword: string) {
    try {
      const result = await this.passwordResetService.resetPassword(token, newPassword);
      if (!result.success) {
        return { success: false, message: 'Token invalide, expiré ou mot de passe non mis à jour' };
      }
      return { success: true };
    } catch (err) {
      console.error('confirmReset error:', err);
      return { success: false, message: 'Erreur serveur lors de la réinitialisation' };
    }
  }
}