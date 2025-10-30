import { Controller, Get, Post, Delete, Req, Res, HttpStatus } from '@nestjs/common';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { createRouteHandler } from 'uploadthing/server';
import { UTApi } from 'uploadthing/server';
import { uploadRouter } from './uploadthing.router';

const handler = createRouteHandler({
  router: uploadRouter,
  config: {
    token: process.env.UPLOADTHING_TOKEN,
  },
});

@Controller('api/uploadthing')
export class UploadthingController {
  private utapi: UTApi;

  constructor() {
    this.utapi = new UTApi({
      token: process.env.UPLOADTHING_TOKEN,
    });
  }

  private fastifyToWebRequest(req: FastifyRequest): Request {
    const url = `${req.protocol}://${req.hostname}${req.url}`;
    
    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
      if (value) {
        headers.set(key, Array.isArray(value) ? value.join(', ') : String(value));
      }
    });

    const init: RequestInit = {
      method: req.method,
      headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      init.body = JSON.stringify(req.body);
    }

    return new Request(url, init);
  }

  @Get()
  async handleGet(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    try {
      const webRequest = this.fastifyToWebRequest(req);
      const response = await handler(webRequest);
      return this.sendResponse(response, res);
    } catch (error) {
      console.error('Erreur GET uploadthing:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        error: 'Erreur serveur',
        details: error.message,
      });
    }
  }

  @Post()
  async handlePost(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    try {
      const webRequest = this.fastifyToWebRequest(req);
      const response = await handler(webRequest);
      return this.sendResponse(response, res);
    } catch (error) {
      console.error('Erreur POST uploadthing:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        error: 'Erreur serveur',
        details: error.message,
      });
    }
  }

  @Delete()
  async handleDelete(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    try {
      const body = req.body as { url?: string };
      const { url } = body;

      if (!url) {
        return res.status(HttpStatus.BAD_REQUEST).send({
          error: 'URL manquante',
        });
      }

      const fileKey = url.split('/').pop();

      if (!fileKey) {
        return res.status(HttpStatus.BAD_REQUEST).send({
          error: 'Clé de fichier invalide',
        });
      }

      await this.utapi.deleteFiles(fileKey);

      return res.status(HttpStatus.OK).send({
        success: true,
      });
    } catch (error) {
      console.error('Erreur lors de la suppression sur UploadThing:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        error: 'Erreur lors de la suppression',
      });
    }
  }

  private async sendResponse(fetchResponse: Response, fastifyRes: FastifyReply) {
    try {
      fetchResponse.headers.forEach((value, key) => {
        fastifyRes.header(key, value);
      });

      const body = await fetchResponse.text();

      return fastifyRes.status(fetchResponse.status).send(body);
    } catch (error) {
      console.error('Erreur sendResponse:', error);
      return fastifyRes.status(500).send({ error: 'Erreur lors de la réponse' });
    }
  }
}