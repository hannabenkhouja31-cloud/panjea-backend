import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, desc, sql, and, lt } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { userReports } from '../database/schemas/user-reports.schema';
import { users } from '../database/schemas/users.schema';
import { banHistory } from '../database/schemas/ban-history.schema';

@Injectable()
export class AdminService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getAllReports(status?: string) {
    const baseQuery = this.databaseService.db
      .select({
        id: userReports.id,
        reportedUserId: userReports.reportedUserId,
        reporterUserId: userReports.reporterUserId,
        reason: userReports.reason,
        description: userReports.description,
        status: userReports.status,
        actionTaken: userReports.actionTaken,
        banDuration: userReports.banDuration,
        createdAt: userReports.createdAt,
        reviewedAt: userReports.reviewedAt,
        reviewedBy: userReports.reviewedBy,
      })
      .from(userReports)
      .orderBy(desc(userReports.createdAt));

    const reports = status 
      ? await baseQuery.where(eq(userReports.status, status))
      : await baseQuery;

    const reportsWithUsers = await Promise.all(
      reports.map(async (report) => {
        const [reportedUser] = await this.databaseService.db
          .select({
            id: users.id,
            username: users.username,
            reportedCount: users.reportedCount,
            isBanned: users.isBanned,
            bannedAt: users.bannedAt,
            bannedReason: users.bannedReason,
            bannedUntil: users.bannedUntil,
          })
          .from(users)
          .where(eq(users.id, report.reportedUserId));

        const [reporterUser] = await this.databaseService.db
          .select({
            id: users.id,
            username: users.username,
          })
          .from(users)
          .where(eq(users.id, report.reporterUserId));

        const uniqueReporters = await this.databaseService.db
          .selectDistinct({ reporterUserId: userReports.reporterUserId })
          .from(userReports)
          .where(eq(userReports.reportedUserId, report.reportedUserId));

        return {
          ...report,
          id: report.id.toString(),
          reportedUser: {
            ...reportedUser,
            uniqueReportersCount: uniqueReporters.length,
          },
          reporterUser,
        };
      })
    );

    return reportsWithUsers;
  }

  async banUser(data: {
    userId: string;
    reason: string;
    duration?: number;
    bannedUntil?: Date;
    adminId: string;
  }) {
    const [user] = await this.databaseService.db
      .select()
      .from(users)
      .where(eq(users.id, data.userId));

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    if (user.isBanned) {
      throw new BadRequestException('Utilisateur déjà banni');
    }

    const isPermanent = !data.bannedUntil;
    
    await this.databaseService.db
      .update(users)
      .set({
        isBanned: true,
        bannedAt: new Date(),
        bannedReason: data.reason,
        bannedUntil: data.bannedUntil || null,
      })
      .where(eq(users.id, data.userId));

    await this.databaseService.db
      .insert(banHistory)
      .values({
        userId: data.userId,
        adminId: data.adminId,
        action: isPermanent ? 'BANNED_PERMANENT' : 'BANNED_TEMPORARY',
        reason: data.reason,
        duration: data.duration,
        bannedUntil: data.bannedUntil,
      });

    const userReportsList = await this.databaseService.db
      .select()
      .from(userReports)
      .where(eq(userReports.reportedUserId, data.userId));

    if (userReportsList.length > 0) {
      await this.databaseService.db
        .update(userReports)
        .set({
          status: 'RESOLVED',
          actionTaken: isPermanent ? 'BANNED_PERMANENT' : 'BANNED_TEMPORARY',
          banDuration: data.duration,
          reviewedAt: new Date(),
          reviewedBy: data.adminId,
        })
        .where(eq(userReports.reportedUserId, data.userId));
    }

    return { success: true };
  }

  async updateBan(data: {
    userId: string;
    duration?: number;
    bannedUntil?: Date;
    adminId: string;
  }) {
    const [user] = await this.databaseService.db
      .select()
      .from(users)
      .where(eq(users.id, data.userId));

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    if (!user.isBanned) {
      throw new BadRequestException('Utilisateur non banni');
    }

    const isPermanent = !data.bannedUntil;
    
    await this.databaseService.db
      .update(users)
      .set({
        bannedUntil: data.bannedUntil || null,
      })
      .where(eq(users.id, data.userId));

    await this.databaseService.db
      .insert(banHistory)
      .values({
        userId: data.userId,
        adminId: data.adminId,
        action: isPermanent ? 'BAN_UPDATED_PERMANENT' : 'BAN_UPDATED_TEMPORARY',
        reason: user.bannedReason,
        duration: data.duration,
        bannedUntil: data.bannedUntil,
      });

    return { success: true };
  }

  async unbanUser(userId: string, adminId: string) {
    const [user] = await this.databaseService.db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    if (!user.isBanned) {
      throw new BadRequestException('Utilisateur non banni');
    }

    await this.databaseService.db
      .update(users)
      .set({
        isBanned: false,
        bannedAt: null,
        bannedReason: null,
        bannedUntil: null,
      })
      .where(eq(users.id, userId));

    await this.databaseService.db
      .insert(banHistory)
      .values({
        userId: userId,
        adminId: adminId,
        action: 'UNBANNED',
        reason: `Débanni par l'administrateur`,
      });

    return { success: true };
  }

  async dismissReport(reportId: string, adminId: string) {
    const reportIdBigInt = BigInt(reportId);

    const [report] = await this.databaseService.db
      .select()
      .from(userReports)
      .where(eq(userReports.id, reportIdBigInt));

    if (!report) {
      throw new NotFoundException('Signalement non trouvé');
    }

    await this.databaseService.db
      .update(userReports)
      .set({
        status: 'DISMISSED',
        actionTaken: 'DISMISSED',
        reviewedAt: new Date(),
        reviewedBy: adminId,
      })
      .where(eq(userReports.id, reportIdBigInt));

    return { success: true };
  }

  async getBanHistory(userId: string) {
    const history = await this.databaseService.db
      .select({
        id: banHistory.id,
        action: banHistory.action,
        reason: banHistory.reason,
        duration: banHistory.duration,
        bannedUntil: banHistory.bannedUntil,
        createdAt: banHistory.createdAt,
        adminUsername: users.username,
      })
      .from(banHistory)
      .leftJoin(users, eq(banHistory.adminId, users.id))
      .where(eq(banHistory.userId, userId))
      .orderBy(desc(banHistory.createdAt));

    return history.map(h => ({
      ...h,
      id: h.id.toString(),
    }));
  }

  async getAdminStats() {
    const [pending] = await this.databaseService.db
      .select({ count: sql<number>`count(*)` })
      .from(userReports)
      .where(eq(userReports.status, 'PENDING'));

    const [resolved] = await this.databaseService.db
      .select({ count: sql<number>`count(*)` })
      .from(userReports)
      .where(eq(userReports.status, 'RESOLVED'));

    const [bannedUsers] = await this.databaseService.db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.isBanned, true));

    const [totalReports] = await this.databaseService.db
      .select({ count: sql<number>`count(*)` })
      .from(userReports);

    return {
      pendingCount: Number(pending.count) || 0,
      resolvedCount: Number(resolved.count) || 0,
      bannedUsersCount: Number(bannedUsers.count) || 0,
      totalReportsCount: Number(totalReports.count) || 0,
    };
  }

  async checkAndUnbanExpiredBans() {
    const now = new Date();
    
    const expiredBans = await this.databaseService.db
      .select()
      .from(users)
      .where(
        and(
          eq(users.isBanned, true),
          lt(users.bannedUntil, now)
        )
      );

    for (const user of expiredBans) {
      await this.databaseService.db
        .update(users)
        .set({
          isBanned: false,
          bannedAt: null,
          bannedReason: null,
          bannedUntil: null,
        })
        .where(eq(users.id, user.id));

      await this.databaseService.db
        .insert(banHistory)
        .values({
          userId: user.id,
          adminId: user.id,
          action: 'AUTO_UNBANNED',
          reason: 'Ban temporaire expiré',
        });
    }

    return { unbannedCount: expiredBans.length };
  }

  
}