import { Controller, Get, Post, Body, Patch, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import type { NewUser } from './entities/user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Créer un utilisateur
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() data: NewUser & { travelTypes?: string[] }) {
    return this.usersService.create(data);
  }

  // Récupérer un utilisateur par ID
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  // Modifier un utilisateur
  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Partial<NewUser> & { travelTypes?: string[] }) {
    return this.usersService.update(id, data);
  }
}