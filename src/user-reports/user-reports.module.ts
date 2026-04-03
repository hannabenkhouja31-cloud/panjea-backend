import { Module } from '@nestjs/common';
import { UserReportsController } from './user-reports.controller';
import { UserReportsService } from './user-reports.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [UserReportsController],
  providers: [UserReportsService],
  exports: [UserReportsService],
})
export class UserReportsModule {}