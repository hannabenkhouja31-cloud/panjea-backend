import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Headers } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from '../common/guards/admin.guard';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('reports')
  getAllReports(@Query('status') status?: string) {
    return this.adminService.getAllReports(status);
  }

  @Get('stats')
  getAdminStats() {
    return this.adminService.getAdminStats();
  }

  @Post('ban-user')
  banUser(
    @Body() data: { 
      userId: string; 
      reason: string; 
      duration?: number;
      bannedUntil?: string;
    },
    @Headers('x-user-id') adminId: string
  ) {
    return this.adminService.banUser({ 
      ...data, 
      bannedUntil: data.bannedUntil ? new Date(data.bannedUntil) : undefined,
      adminId 
    });
  }

  @Patch('update-ban')
  updateBan(
    @Body() data: { 
      userId: string;
      duration?: number;
      bannedUntil?: string;
    },
    @Headers('x-user-id') adminId: string
  ) {
    return this.adminService.updateBan({ 
      ...data,
      bannedUntil: data.bannedUntil ? new Date(data.bannedUntil) : undefined,
      adminId 
    });
  }

  @Patch('unban-user/:userId')
  unbanUser(
    @Param('userId') userId: string,
    @Headers('x-user-id') adminId: string
  ) {
    return this.adminService.unbanUser(userId, adminId);
  }

  @Patch('dismiss-report/:reportId')
  dismissReport(
    @Param('reportId') reportId: string,
    @Headers('x-user-id') adminId: string
  ) {
    return this.adminService.dismissReport(reportId, adminId);
  }

  @Get('ban-history/:userId')
  getBanHistory(@Param('userId') userId: string) {
    return this.adminService.getBanHistory(userId);
  }

  @Post('check-expired-bans')
  checkExpiredBans() {
    return this.adminService.checkAndUnbanExpiredBans();
  }
}