import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { UserReportsService } from './user-reports.service';

@Controller('user-reports')
export class UserReportsController {
  constructor(private readonly userReportsService: UserReportsService) {}

  @Get('check')
  checkUserReport(
    @Query('reportedUserId') reportedUserId: string,
    @Query('reporterUserId') reporterUserId: string
  ) {
    return this.userReportsService.checkUserReport(reportedUserId, reporterUserId);
  }

  @Post()
  createReport(@Body() data: {
    reportedUserId: string;
    reporterUserId: string;
    reason: string;
    description: string;
  }) {
    return this.userReportsService.createReport(data);
  }
}