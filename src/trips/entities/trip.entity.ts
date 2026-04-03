import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { trips } from 'src/database/schemas/trips.schema';


export type Trip = InferSelectModel<typeof trips>;
export type NewTrip = InferInsertModel<typeof trips>;