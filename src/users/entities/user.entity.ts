import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { users } from 'src/database/schemas/users.schema';

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;