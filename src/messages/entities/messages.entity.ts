import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { messages } from 'src/database/schemas/messages.schema';

export type Message = InferSelectModel<typeof messages>;
export type NewMessage = InferInsertModel<typeof messages>;