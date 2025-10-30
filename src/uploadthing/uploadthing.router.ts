import { createUploadthing } from 'uploadthing/server';
import type { FileRouter } from 'uploadthing/server';

const f = createUploadthing();

export const uploadRouter = {
  profilePicture: f({
    image: {
      maxFileSize: '4MB',
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      return { uploadedAt: new Date() };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Upload complete!');
      console.log('File URL (public):', file.ufsUrl);
      
      return { url: file.ufsUrl };
    }),
  
  tripMedia: f({
    image: {
      maxFileSize: '4MB',
      maxFileCount: 10,
    },
  })
    .middleware(async ({ req }) => {
      return { uploadedAt: new Date() };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Trip media upload complete!');
      console.log('File URL (public):', file.ufsUrl);
      
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;