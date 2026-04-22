import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { users } from '../database/schemas/users.schema';
import { NewUser } from './entities/user.entity';
import { travelTypes, trips, userTravelTypes } from 'src/database/schemas';
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

  async create(data: NewUser & { travelTypes?: string[]; email?: string | null }) {
    const { travelTypes: travelTypesData, email, ...userData } = data;

    let user;

    try {
      [user] = await this.databaseService.db
        .insert(users)
        .values(userData)
        .returning();

      console.log('=== USER CREATION START ===');
      console.log('User ID:', user.id);
      console.log('Username:', user.username);
      console.log('Email provided:', email);

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
      }

      let userEmail: string | null | undefined = email;

      if (!userEmail) {
        console.log('No email provided, fetching from Stack Auth...');
        userEmail = await this.stackAuthService.getUserEmail(user.id);
      }

      if (!userEmail) {
        console.error('No email available for user:', user.id);
        console.log('=== USER CREATION END (NO EMAIL) ===\n');
        return user;
      }

      try {
        console.log('[EMAIL FLOW] Starting email flow for user:', user.id);
        console.log('[EMAIL FLOW] Resolved email:', userEmail);
        console.log('[EMAIL FLOW] Username:', user.username);

        console.log('[EMAIL FLOW] Step 1/2 - Generating verification token...');
        const verificationToken = await this.emailVerificationService.generateVerificationToken(user.id);
        console.log('[EMAIL FLOW] Verification token generated:', verificationToken ? 'OK (non-null)' : 'NULL/UNDEFINED');

        console.log('[EMAIL FLOW] Step 2/2 - Calling emailService.sendWelcomeEmail...');
        await this.emailService.sendWelcomeEmail(userEmail, user.username, verificationToken);

        console.log('[EMAIL FLOW] Welcome email sent successfully');
        console.log('=== USER CREATION END (SUCCESS) ===\n');
      } catch (error) {
        console.error('[EMAIL FLOW] ERROR - message:', error?.message);
        console.error('[EMAIL FLOW] ERROR - name:', error?.name);
        console.error('[EMAIL FLOW] ERROR - stack:', error?.stack);
        console.error('[EMAIL FLOW] ERROR - full object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        console.log('=== USER CREATION END (ERROR) ===\n');
      }

      return user;
    } catch (error) {
      console.error('Error creating user in database:', error);

      if (userData.id) {
        try {
          await this.stackAuthService.deleteUser(userData.id);
        } catch (cleanupError) {
          console.error('Error during cleanup:', cleanupError);
        }
      }

      throw error;
    }
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

  async findByEmail(email: string) {
    const [user] = await this.databaseService.db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (!user) {
      throw new NotFoundException(`User with ID ${email} not found`);
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
        isFromBubble: false,
        createdAt: user.createdAt,
      };
    }

    return {
      ...user
    };
  }

  async migrateBubbleUser(oldId: string, newId: string, data: NewUser & { travelTypes?: string[]; email?: string | null }) {
    console.log('🔄 Starting migration:', { oldId, newId, username: data.username });

    const [oldUser] = await this.databaseService.db
      .select()
      .from(users)
      .where(eq(users.id, oldId));

    if (!oldUser) {
      throw new NotFoundException('User not found');
    }

    const [existingUser] = await this.databaseService.db
      .select()
      .from(users)
      .where(eq(users.username, data.username));

    if (existingUser && existingUser.id !== oldId) {
      console.error('❌ Username already taken:', data.username);
      throw new ConflictException(`Le pseudo "${data.username}" est déjà utilisé. Veuillez en choisir un autre.`);
    }

    const { travelTypes: travelTypesData, email, ...userData } = data;

    const mergedData = {
      ...oldUser,
      ...userData,
      id: newId,
      username: data.username,
      isFromBubble: false,
      emailVerified: true,
    };

    await this.databaseService.db
      .delete(userTravelTypes)
      .where(eq(userTravelTypes.userId, oldId));

    console.log('📝 Creating new user with username:', mergedData.username);

    await this.databaseService.db
      .update(users)
      .set({ username: oldUser.id })
      .where(eq(users.id, oldUser.id));

    const [newUser] = await this.databaseService.db
      .insert(users)
      .values(mergedData)
      .returning();

    console.log('🗺️ Transferring trips...');
    await this.databaseService.db
      .update(trips)
      .set({ organizerId: newId })
      .where(eq(trips.organizerId, oldId));

    console.log('🗑️ Deleting old user...');
    await this.databaseService.db
      .delete(users)
      .where(eq(users.id, oldId));

    if (travelTypesData && travelTypesData.length > 0) {
      console.log('🎒 Adding travel types...');
      const travelTypeRecords = await this.databaseService.db
        .select()
        .from(travelTypes)
        .where(inArray(travelTypes.slug, travelTypesData));

      if (travelTypeRecords.length > 0) {
        const userTravelTypeValues = travelTypeRecords.map(tt => ({
          userId: newUser.id,
          travelTypeId: tt.id,
        }));
        await this.databaseService.db
          .insert(userTravelTypes)
          .values(userTravelTypeValues);
      }
    }

    if (email) {
      try {
        console.log('📧 Sending welcome email to migrated user...');
        const verificationToken = await this.emailVerificationService.generateVerificationToken(newUser.id);
        await this.emailService.sendWelcomeEmail(email, newUser.username, verificationToken);
        console.log('✅ Welcome email sent successfully');
      } catch (error) {
        console.error('❌ Error sending welcome email:', error);
      }
    }

    console.log('✅ Migration completed successfully');
    return newUser;
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

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    if (isUUID) {
      console.log(`🗑️ Deleting from Stack Auth (valid UUID): ${id}`);
      const deleteResult = await this.stackAuthService.deleteUser(id);

      if (!deleteResult) {
        throw new Error('Failed to delete user from Stack Auth');
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      console.log(`⭐️ Skipping Stack Auth deletion (Bubble ID): ${id}`);
    }

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

    if (!user) {
      throw new NotFoundException(`User with username ${username} not found`);
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
        isFromBubble: false,
        createdAt: user.createdAt,
      };
    }

    return {
      ...user
    };
  }
}