import { Controller, Get, Query, Res } from '@nestjs/common';
import { EmailVerificationService } from './email-verification.service';
import type { FastifyReply } from 'fastify';

@Controller('email-verification')
export class EmailVerificationController {
  constructor(
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  @Get('verify')
  async verifyEmail(
    @Query('token') token: string,
    @Res() res: FastifyReply,
  ) {
    if (!token) {
      return res.status(302).redirect(`${process.env.FRONTEND_URL}/profile?verification=invalid`);
    }

    const result = await this.emailVerificationService.verifyToken(token);

    if (result.success) {
      return res.status(302).redirect(`${process.env.FRONTEND_URL}/profile?verification=success`);
    }

    return res.status(302).redirect(`${process.env.FRONTEND_URL}/profile?verification=expired`);
  }
}