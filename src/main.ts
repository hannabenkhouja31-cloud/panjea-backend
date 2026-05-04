import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import 'dotenv/config';

import { AppModule } from './app.module';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true })
  );

  const extraOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : [];

  app.addHook('preHandler', (request, reply, done) => {
    if (request.method === 'POST') {
      console.log('[REQUEST]', request.method, request.url, JSON.stringify(request.body));
    }
    done();
  });

  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'https://www.panjea.fr',
      'https://panjea.fr',
      ...extraOrigins,
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: '*',
    credentials: true,
  });
  
  try {
    if(process.env.DATABASE_URL) {
      const sql = neon(process.env.DATABASE_URL);
      const db = drizzle({ client: sql });

      await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
      console.log(`Panjea backend is running on: ${await app.getUrl()}`);
      console.log('[VERSION] Backend started at', new Date().toISOString());
    }
  }
  
  catch(error) {
    console.log(error)
    console.log("Sorry...Backend can't start due to the error above :/")
    process.exit(1);
      
  }
    
}

bootstrap();