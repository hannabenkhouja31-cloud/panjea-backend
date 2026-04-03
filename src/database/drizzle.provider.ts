import { Provider } from '@nestjs/common';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schemas/index';

export const DRIZZLE = Symbol('DRIZZLE');

export const drizzleProvider: Provider = {
  provide: DRIZZLE,
  useFactory: () => {
    const sql = neon(process.env.DATABASE_URL!);
    return drizzle(sql, { schema });
  },
};