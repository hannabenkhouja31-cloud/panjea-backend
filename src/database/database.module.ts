import { Global, Module } from '@nestjs/common';
import { drizzleProvider } from './drizzle.provider';
import { DatabaseService } from './database.service';

@Global()
@Module({
  providers: [drizzleProvider, DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}