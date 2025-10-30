import { Module } from '@nestjs/common';
import { UploadthingController } from './uploadthing.controller';

@Module({
  controllers: [UploadthingController],
})
export class UploadthingModule {}