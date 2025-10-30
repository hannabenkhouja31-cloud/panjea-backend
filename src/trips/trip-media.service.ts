import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { tripMedia } from '../database/schemas';
import { UTApi } from 'uploadthing/server';

@Injectable()
export class TripMediaService {
  private utapi: UTApi;

  constructor(private readonly databaseService: DatabaseService) {
    this.utapi = new UTApi({
      token: process.env.UPLOADTHING_TOKEN,
    });
  }

  async create(tripId: string, url: string, position: number) {
    const [media] = await this.databaseService.db
      .insert(tripMedia)
      .values({ tripId, url, position })
      .returning();
    
    return {
      ...media,
      id: media.id.toString(),
    };
  }

  async findByTrip(tripId: string) {
    const mediaList = await this.databaseService.db
      .select()
      .from(tripMedia)
      .where(eq(tripMedia.tripId, tripId))
      .orderBy(tripMedia.position);
    
    return mediaList.map(media => ({
      ...media,
      id: media.id.toString(),
    }));
  }

  async remove(id: bigint) {
    const [media] = await this.databaseService.db
      .select()
      .from(tripMedia)
      .where(eq(tripMedia.id, id));

    if (!media) {
      return null;
    }

    const fileKey = media.url.split('/').pop();
    if (fileKey) {
      await this.utapi.deleteFiles(fileKey);
    }

    await this.databaseService.db
      .delete(tripMedia)
      .where(eq(tripMedia.id, id));

    return {
      ...media,
      id: media.id.toString(),
    };
  }

  async updatePositions(updates: { id: bigint; position: number }[]) {
    if (updates.length === 0) return;

    const TEMP_OFFSET = 10000;

    for (const update of updates) {
      await this.databaseService.db
        .update(tripMedia)
        .set({ position: TEMP_OFFSET + update.position })
        .where(eq(tripMedia.id, update.id));
    }

    for (const update of updates) {
      await this.databaseService.db
        .update(tripMedia)
        .set({ position: update.position })
        .where(eq(tripMedia.id, update.id));
    }
  }
}