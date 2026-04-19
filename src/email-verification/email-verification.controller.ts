// email-verification.controller.ts
import { Controller, Get, Post, Query, Body, Res, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { EmailVerificationService } from './email-verification.service';
import type { FastifyReply } from 'fastify';

@Controller('email-verification')
export class EmailVerificationController {
  private readonly logger = new Logger(EmailVerificationController.name);

  constructor(
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  @Get('verify')
  async verifyEmail(
    @Query('token') token: string,
    @Res() res: FastifyReply,
  ) {
    this.logger.log(`=== EMAIL VERIFICATION REQUEST ===`);
    this.logger.log(`Token received: ${token ? token.substring(0, 10) + '...' : 'NONE'}`);
    this.logger.log(`Frontend URL: ${process.env.FRONTEND_URL}`);

    if (!token) {
      this.logger.warn(`✗ No token provided`);
      const redirectUrl = `${process.env.FRONTEND_URL}/profile?verification=invalid`;
      this.logger.log(`Redirecting to: ${redirectUrl}`);
      this.logger.log(`=== END VERIFICATION REQUEST (INVALID) ===\n`);
      return res.status(302).redirect(redirectUrl);
    }

    const result = await this.emailVerificationService.verifyToken(token);

    if (result.success) {
      this.logger.log(`✓ Verification successful`);
      const redirectUrl = `${process.env.FRONTEND_URL}/profile?verification=success`;
      this.logger.log(`Redirecting to: ${redirectUrl}`);
      this.logger.log(`=== END VERIFICATION REQUEST (SUCCESS) ===\n`);
      return res.status(302).redirect(redirectUrl);
    }

    this.logger.warn(`✗ Verification failed`);
    const redirectUrl = `${process.env.FRONTEND_URL}/profile?verification=expired`;
    this.logger.log(`Redirecting to: ${redirectUrl}`);
    this.logger.log(`=== END VERIFICATION REQUEST (EXPIRED) ===\n`);
    return res.status(302).redirect(redirectUrl);
  }

  @Post('resend')
  @HttpCode(HttpStatus.OK)
  async resendVerificationEmail(@Body() body: { userId: string }) {
    return this.emailVerificationService.resendVerificationEmail(body.userId);
  }
}