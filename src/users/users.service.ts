import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { users } from '../database/schemas/users.schema';
import { NewUser } from './entities/user.entity';
import { travelTypes, userTravelTypes } from 'src/database/schemas';
import { StackAuthService } from '../stack-auth/stack-auth.service';
import { EmailService } from '../email/email.service';
import { EmailVerificationService } from '../email-verification/email-verification.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly stackAuthService: StackAuthService,
    private readonly emailService: EmailService,
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  async create(data: NewUser & { travelTypes?: string[] }) {
    const { travelTypes: travelTypesData, ...userData } = data;
        
    const [user] = await this.databaseService.db
      .insert(users)
      .values(userData)
      .returning();

    console.log('User créé:', user);

    if (travelTypesData && travelTypesData.length > 0) {
      const travelTypeRecords = await this.databaseService.db
        .select()
        .from(travelTypes)
        .where(inArray(travelTypes.slug, travelTypesData));

      if (travelTypeRecords.length > 0) {
        const userTravelTypeValues = travelTypeRecords.map(tt => ({
          userId: user.id,
          travelTypeId: tt.id,
        }));
        await this.databaseService.db
          .insert(userTravelTypes)
          .values(userTravelTypeValues);
      } 
    } else {
      console.log('Pas de travelTypes fournis ou tableau vide');
    }

    const email = await this.stackAuthService.getUserEmail(user.id);
    if (email) {
      const verificationToken = await this.emailVerificationService.generateVerificationToken(user.id);
      this.emailService.sendWelcomeEmail(email, user.username, verificationToken)
        .catch(err => console.error('Welcome email error:', err));
    }

    return user;
  }

  async findAll() {
    return await this.databaseService.db.select().from(users);
  }

  async findOne(id: string) {
    const [user] = await this.databaseService.db
      .select()
      .from(users)
      .where(eq(users.id, id));

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (user.isDeleted) {
      return {
        id: user.id,
        username: 'Utilisateur supprimé',
        languages: [],
        budgetLevel: 1,
        travelTypes: [],
        tripsCount: 0,
        isVerified: false,
        emailVerified: false,
        isDeleted: true,
        createdAt: user.createdAt,
      };
    }

    const userTravelTypeRecords = await this.databaseService.db
      .select({
        slug: travelTypes.slug,
      })
      .from(userTravelTypes)
      .leftJoin(travelTypes, eq(userTravelTypes.travelTypeId, travelTypes.id))
      .where(eq(userTravelTypes.userId, id));

    return {
      ...user,
      travelTypes: userTravelTypeRecords.map(record => record.slug),
    };
  }

  async update(id: string, data: Partial<NewUser> & { travelTypes?: string[] }) {
    const { travelTypes: travelTypesData, ...userData } = data;
        
    const [user] = await this.databaseService.db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();

    if (travelTypesData && travelTypesData.length > 0) {
      await this.databaseService.db
        .delete(userTravelTypes)
        .where(eq(userTravelTypes.userId, id));

      const travelTypeRecords = await this.databaseService.db
        .select()
        .from(travelTypes)
        .where(inArray(travelTypes.slug, travelTypesData));

      if (travelTypeRecords.length > 0) {
        const userTravelTypeValues = travelTypeRecords.map(tt => ({
          userId: id,
          travelTypeId: tt.id,
        }));
        await this.databaseService.db
          .insert(userTravelTypes)
          .values(userTravelTypeValues);
      }
    }

    return user;
  }

  async anonymize(id: string) {
    const timestamp = Date.now();
    const anonymizedData = {
      username: `deleted_user_${timestamp}_${id.substring(0, 8)}`,
      description: null,
      city: null,
      country: null,
      profilePictureUrl: null,
      languages: [],
      budgetLevel: 1,
      isDeleted: true,
    };

    await this.databaseService.db
      .delete(userTravelTypes)
      .where(eq(userTravelTypes.userId, id));

    const deleteResult = await this.stackAuthService.deleteUser(id);
    
    if (!deleteResult) {
      throw new Error('Failed to delete user from Stack Auth');
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    const [user] = await this.databaseService.db
      .update(users)
      .set(anonymizedData)
      .where(eq(users.id, id))
      .returning();

    return user;
  }

  async remove(id: string) {
    const [user] = await this.databaseService.db
      .delete(users)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async findByUsername(username: string) {
    const [user] = await this.databaseService.db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }
}