import { Injectable } from '@nestjs/common';
import { eq, lt } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { UTApi } from 'uploadthing/server';
import { temporaryTripMedia } from 'src/database/schemas/temporary-trip-media.schema';

@Injectable()
export class TemporaryTripMediaService {
  private utapi: UTApi;

  constructor(private readonly databaseService: DatabaseService) {
    this.utapi = new UTApi({
      token: process.env.UPLOADTHING_TOKEN,
    });
  }

  async create(userId: string, url: string) {
    const [media] = await this.databaseService.db
      .insert(temporaryTripMedia)
      .values({ userId, url })
      .returning();
    
    return {
      ...media,
      id: media.id.toString(),
    };
  }

  async findByUser(userId: string) {
    const mediaList = await this.databaseService.db
      .select()
      .from(temporaryTripMedia)
      .where(eq(temporaryTripMedia.userId, userId));
    
    return mediaList.map(media => ({
      ...media,
      id: media.id.toString(),
    }));
  }

  async remove(id: bigint, userId: string) {
    const [media] = await this.databaseService.db
      .select()
      .from(temporaryTripMedia)
      .where(eq(temporaryTripMedia.id, id));

    if (!media || media.userId !== userId) {
      return null;
    }

    const fileKey = media.url.split('/').pop();
    if (fileKey) {
      await this.utapi.deleteFiles(fileKey);
    }

    await this.databaseService.db
      .delete(temporaryTripMedia)
      .where(eq(temporaryTripMedia.id, id));

    return {
      ...media,
      id: media.id.toString(),
    };
  }

  async removeByIds(ids: bigint[]) {
    const mediaList = await this.databaseService.db
      .select()
      .from(temporaryTripMedia)
      .where(eq(temporaryTripMedia.id, ids[0]));

    for (const media of mediaList) {
      const fileKey = media.url.split('/').pop();
      if (fileKey) {
        await this.utapi.deleteFiles(fileKey);
      }
    }

    await this.databaseService.db
      .delete(temporaryTripMedia)
      .where(eq(temporaryTripMedia.id, ids[0]));
  }

  async cleanOldMedia(hoursOld: number = 24) {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hoursOld);

    const oldMedia = await this.databaseService.db
      .select()
      .from(temporaryTripMedia)
      .where(lt(temporaryTripMedia.uploadedAt, cutoffDate));

    for (const media of oldMedia) {
      const fileKey = media.url.split('/').pop();
      if (fileKey) {
        await this.utapi.deleteFiles(fileKey);
      }
    }

    await this.databaseService.db
      .delete(temporaryTripMedia)
      .where(lt(temporaryTripMedia.uploadedAt, cutoffDate));

    return oldMedia.length;
  }
}