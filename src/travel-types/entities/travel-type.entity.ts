import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { travelTypes } from 'src/database/schemas/travel-types.schema';


export type travelTypes = InferSelectModel<typeof travelTypes>;
