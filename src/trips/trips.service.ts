import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, inArray, and, sql } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { NewTrip } from './entities/trip.entity';
import { travelTypes, tripTags, trips, tripMedia, tripMembers, users } from 'src/database/schemas';
import { temporaryTripMedia } from 'src/database/schemas/temporary-trip-media.schema';

@Injectable()
export class TripsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(data: Omit<NewTrip, 'monthYear'> & { startDate: string; endDate: string; travelTypes?: string[]; temporaryMediaIds?: string[] }) {
    const { travelTypes: travelTypesData, startDate, endDate, temporaryMediaIds, ...tripData } = data;
    
    const monthYear = `[${startDate},${endDate})`;
    
    const [trip] = await this.databaseService.db
      .insert(trips)
      .values({
        ...tripData,
        monthYear: sql`${monthYear}::daterange`,
      })
      .returning();

    if (travelTypesData && travelTypesData.length > 0) {
      const travelTypeRecords = await this.databaseService.db
        .select()
        .from(travelTypes)
        .where(inArray(travelTypes.slug, travelTypesData));

      if (travelTypeRecords.length > 0) {
        const tripTagValues = travelTypeRecords.map(tt => ({
          tripId: trip.id,
          travelTypeId: tt.id,
        }));
        await this.databaseService.db
          .insert(tripTags)
          .values(tripTagValues);
      }
    }

    if (temporaryMediaIds && temporaryMediaIds.length > 0) {
      const temporaryMediaBigIntIds = temporaryMediaIds.map(id => BigInt(id));
      
      const temporaryMedia = await this.databaseService.db
        .select()
        .from(temporaryTripMedia)
        .where(inArray(temporaryTripMedia.id, temporaryMediaBigIntIds));

      const tripMediaValues = temporaryMedia.map((media, index) => ({
        tripId: trip.id,
        url: media.url,
        position: index + 1,
      }));

      if (tripMediaValues.length > 0) {
        await this.databaseService.db
          .insert(tripMedia)
          .values(tripMediaValues);
      }

      await this.databaseService.db
        .delete(temporaryTripMedia)
        .where(inArray(temporaryTripMedia.id, temporaryMediaBigIntIds));
    }

    if(trip.id) {
      await this.databaseService.db
        .insert(tripMembers)
        .values({
          tripId:trip.id, 
          userId: trip.organizerId, 
          status:"JOINED"
        });
    }

    
    return trip;
  }

  async findByMember(userId: string) {
  // Récupérer tous les tripIds où l'utilisateur est JOINED
  const memberTrips = await this.databaseService.db
    .select({ tripId: tripMembers.tripId })
    .from(tripMembers)
    .where(
      and(
        eq(tripMembers.userId, userId),
        eq(tripMembers.status, 'JOINED')
      )
    );

  if (memberTrips.length === 0) {
    return [];
  }

  const tripIds = memberTrips.map(m => m.tripId);

  // Récupérer les détails complets de ces trips
  const userTrips = await this.databaseService.db
    .select()
    .from(trips)
    .where(inArray(trips.id, tripIds));

  const tripsWithTags = await Promise.all(
    userTrips.map(async (trip) => {
      const tripTagRecords = await this.databaseService.db
        .select({
          slug: travelTypes.slug,
        })
        .from(tripTags)
        .leftJoin(travelTypes, eq(tripTags.travelTypeId, travelTypes.id))
        .where(eq(tripTags.tripId, trip.id));

      const tripMediaRecords = await this.databaseService.db
        .select()
        .from(tripMedia)
        .where(eq(tripMedia.tripId, trip.id))
        .orderBy(tripMedia.position);

      return {
        ...trip,
        travelTypes: tripTagRecords.map(record => record.slug),
        media: tripMediaRecords.map(media => ({
          ...media,
          id: media.id.toString(),
        })),
      };
    })
  );

  return tripsWithTags;
}

  async findAll(query?: { page?: number; limit?: number; sortBy?: string; order?: string }) {
    const page = query?.page || 1;
    const limit = query?.limit || 15;
    const sortBy = query?.sortBy || 'createdAt';
    const order = query?.order || 'desc';
    
    const offset = (page - 1) * limit;

    const [allTrips, totalTrips] = await Promise.all([
      this.databaseService.db
        .select()
        .from(trips)
        .orderBy(order === 'desc' ? sql`${trips[sortBy]} DESC` : sql`${trips[sortBy]} ASC`)
        .limit(limit)
        .offset(offset),
      
      this.databaseService.db
        .select({ count: sql<number>`count(*)::int` })
        .from(trips)
        .then(result => result[0].count)
    ]);

    const tripsWithTags = await Promise.all(
      allTrips.map(async (trip) => {
        const tripTagRecords = await this.databaseService.db
          .select({
            slug: travelTypes.slug,
          })
          .from(tripTags)
          .leftJoin(travelTypes, eq(tripTags.travelTypeId, travelTypes.id))
          .where(eq(tripTags.tripId, trip.id));

        const tripMediaRecords = await this.databaseService.db
          .select()
          .from(tripMedia)
          .where(eq(tripMedia.tripId, trip.id))
          .orderBy(tripMedia.position);

        const [organizer] = await this.databaseService.db
          .select({
            isDeleted: users.isDeleted,
            isBanned: users.isBanned,
          })
          .from(users)
          .where(eq(users.id, trip.organizerId));

        return {
          ...trip,
          travelTypes: tripTagRecords.map(record => record.slug),
          media: tripMediaRecords.map(media => ({
            ...media,
            id: media.id.toString(),
          })),
          organizerIsDeleted: organizer?.isDeleted ?? true,
          organizerIsBanned: organizer?.isBanned ?? false,
        };
      })
    );

    const totalPages = Math.ceil(totalTrips / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      data: tripsWithTags,
      meta: {
        total: totalTrips,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }

  async findOne(id: string) {
    const [trip] = await this.databaseService.db
      .select()
      .from(trips)
      .where(eq(trips.id, id));

    if (!trip) {
      throw new NotFoundException(`Trip with ID ${id} not found`);
    }

    const tripTagRecords = await this.databaseService.db
      .select({
        slug: travelTypes.slug,
      })
      .from(tripTags)
      .leftJoin(travelTypes, eq(tripTags.travelTypeId, travelTypes.id))
      .where(eq(tripTags.tripId, id));

    const tripMediaRecords = await this.databaseService.db
      .select()
      .from(tripMedia)
      .where(eq(tripMedia.tripId, id))
      .orderBy(tripMedia.position);

    return {
      ...trip,
      travelTypes: tripTagRecords.map(record => record.slug),
      media: tripMediaRecords.map(media => ({
        ...media,
        id: media.id.toString(),
      })),
    };
  }

  async update(id: string, data: Partial<Omit<NewTrip, 'monthYear'>> & { startDate?: string; endDate?: string; travelTypes?: string[]; temporaryMediaIds?: string[] }) {
    const { travelTypes: travelTypesData, startDate, endDate, temporaryMediaIds, ...tripData } = data;
    
    const [existingTrip] = await this.databaseService.db
      .select()
      .from(trips)
      .where(eq(trips.id, id));

    if (!existingTrip) {
      throw new NotFoundException(`Trip with ID ${id} not found`);
    }

    const updateData: any = { ...tripData };
    
    if (startDate && endDate) {
      const monthYear = `[${startDate},${endDate})`;
      updateData.monthYear = sql`${monthYear}::daterange`;
    }

    const [trip] = await this.databaseService.db
      .update(trips)
      .set(updateData)
      .where(eq(trips.id, id))
      .returning();

    if (travelTypesData && travelTypesData.length > 0) {
      await this.databaseService.db
        .delete(tripTags)
        .where(eq(tripTags.tripId, id));

      const travelTypeRecords = await this.databaseService.db
        .select()
        .from(travelTypes)
        .where(inArray(travelTypes.slug, travelTypesData));

      if (travelTypeRecords.length > 0) {
        const tripTagValues = travelTypeRecords.map(tt => ({
          tripId: id,
          travelTypeId: tt.id,
        }));
        await this.databaseService.db
          .insert(tripTags)
          .values(tripTagValues);
      }
    }

    if (temporaryMediaIds && temporaryMediaIds.length > 0) {
      const temporaryMediaBigIntIds = temporaryMediaIds.map(id => BigInt(id));
      
      const temporaryMedia = await this.databaseService.db
        .select()
        .from(temporaryTripMedia)
        .where(inArray(temporaryTripMedia.id, temporaryMediaBigIntIds));

      const existingMedia = await this.databaseService.db
        .select()
        .from(tripMedia)
        .where(eq(tripMedia.tripId, id))
        .orderBy(tripMedia.position);

      const nextPosition = existingMedia.length + 1;

      const tripMediaValues = temporaryMedia.map((media, index) => ({
        tripId: id,
        url: media.url,
        position: nextPosition + index,
      }));

      if (tripMediaValues.length > 0) {
        await this.databaseService.db
          .insert(tripMedia)
          .values(tripMediaValues);
      }

      await this.databaseService.db
        .delete(temporaryTripMedia)
        .where(inArray(temporaryTripMedia.id, temporaryMediaBigIntIds));
    }

    return trip;
  }

  async remove(id: string) {
    const [trip] = await this.databaseService.db
      .select()
      .from(trips)
      .where(eq(trips.id, id));

    if (!trip) {
      throw new NotFoundException(`Trip with ID ${id} not found`);
    }

    const tripMediaRecords = await this.databaseService.db
      .select()
      .from(tripMedia)
      .where(eq(tripMedia.tripId, id));

    if (tripMediaRecords.length > 0) {
      const utapi = new (await import('uploadthing/server')).UTApi({
        token: process.env.UPLOADTHING_TOKEN,
      });

      const fileKeys = tripMediaRecords
        .map(media => media.url.split('/').pop())
        .filter((key): key is string => !!key);

      if (fileKeys.length > 0) {
        try {
          await utapi.deleteFiles(fileKeys);
        } catch (error) {
          console.error('Erreur suppression fichiers UploadThing:', error);
        }
      }
    }

    await this.databaseService.db
      .delete(trips)
      .where(eq(trips.id, id));
  }

  async findByOrganizer(organizerId: string) {
    const organizerTrips = await this.databaseService.db
      .select()
      .from(trips)
      .where(eq(trips.organizerId, organizerId));

    const tripsWithTags = await Promise.all(
      organizerTrips.map(async (trip) => {
        const tripTagRecords = await this.databaseService.db
          .select({
            slug: travelTypes.slug,
          })
          .from(tripTags)
          .leftJoin(travelTypes, eq(tripTags.travelTypeId, travelTypes.id))
          .where(eq(tripTags.tripId, trip.id));

        const tripMediaRecords = await this.databaseService.db
          .select()
          .from(tripMedia)
          .where(eq(tripMedia.tripId, trip.id))
          .orderBy(tripMedia.position);

        return {
          ...trip,
          travelTypes: tripTagRecords.map(record => record.slug),
          media: tripMediaRecords.map(media => ({
            ...media,
            id: media.id.toString(),
          })),
        };
      })
    );

    return tripsWithTags;
  }
}