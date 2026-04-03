import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { DatabaseService } from '../../database/database.service';
import { users } from '../../database/schemas';
import { eq } from 'drizzle-orm';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly databaseService: DatabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const userId = request.headers['x-user-id'] as string;

    if (!userId) {
      throw new ForbiddenException('Authentification requise');
    }

    const [user] = await this.databaseService.db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user || !user.isAdmin) {
      throw new ForbiddenException('Accès réservé aux administrateurs');
    }

    return true;
  }
}