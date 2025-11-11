import { Injectable, BadRequestException } from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { userReports } from '../database/schemas/user-reports.schema';
import { users } from '../database/schemas/users.schema';

@Injectable()
export class UserReportsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async checkUserReport(reportedUserId: string, reporterUserId: string) {
    const [existingReport] = await this.databaseService.db
      .select()
      .from(userReports)
      .where(
        and(
          eq(userReports.reportedUserId, reportedUserId),
          eq(userReports.reporterUserId, reporterUserId)
        )
      );

    if (!existingReport) {
      return { hasReported: false, reportStatus: null };
    }

    return {
      hasReported: true,
      reportStatus: existingReport.status,
    };
  }

  async createReport(data: {
    reportedUserId: string;
    reporterUserId: string;
    reason: string;
    description: string;
  }) {
    const existingReport = await this.checkUserReport(
      data.reportedUserId,
      data.reporterUserId
    );

    if (existingReport.hasReported && existingReport.reportStatus === 'PENDING') {
      throw new BadRequestException('Vous avez déjà signalé cet utilisateur');
    }

    await this.databaseService.db.insert(userReports).values({
      reportedUserId: data.reportedUserId,
      reporterUserId: data.reporterUserId,
      reason: data.reason,
      description: data.description,
      status: 'PENDING',
    });

    await this.databaseService.db
      .update(users)
      .set({
        reportedCount: sql`${users.reportedCount} + 1`,
      })
      .where(eq(users.id, data.reportedUserId));

    return { success: true };
  }
}