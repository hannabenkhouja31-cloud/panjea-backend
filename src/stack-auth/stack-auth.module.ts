// stack-auth.module.ts
import { Module } from '@nestjs/common';
import { StackAuthController } from './stack-auth.controller';
import { StackAuthService } from './stack-auth.service';
import { StackAuthCleanupService } from './stack-auth-cleanup.service';
import { DatabaseModule } from '../database/database.module'; // Si tu utilises DatabaseService

@Module({
  imports: [DatabaseModule], // Importer les modules dont tu as besoin
  controllers: [StackAuthController],
  providers: [
    StackAuthService,
    StackAuthCleanupService, // Ajouter le cleanup service
  ],
  exports: [StackAuthService, StackAuthCleanupService], // Exporter si nécessaire
})
export class StackAuthModule {}