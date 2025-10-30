import { Controller, Get, HttpCode } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @HttpCode(204)
  getPing(): { message: string; timestamp: string } {
    return { 
      message: this.appService.getPing(),
      timestamp: new Date().toLocaleDateString()+' at '+new Date().toLocaleTimeString()
    };
  }
}
