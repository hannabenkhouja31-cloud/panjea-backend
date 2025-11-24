import { Controller, Get, Post, Body, Patch, Param, HttpCode, HttpStatus, Delete } from '@nestjs/common';
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

  @Get('by-email/:email')
  findByEmail(@Param('email') email: string) {
    return this.usersService.findByEmail(email);
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

  @Post('migrate-bubble')
  @HttpCode(HttpStatus.OK)
  async migrateBubbleUser(@Body() body: { oldId: string; newId: string; userData: NewUser & { travelTypes?: string[] } }) {
    return this.usersService.migrateBubbleUser(body.oldId, body.newId, body.userData);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.usersService.anonymize(id);
  }
}