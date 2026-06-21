import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Users')
@ApiBearerAuth('JWT')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get() @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN) findAll() { return this.usersService.findAll(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.usersService.findOne(id); }
  @Post() @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN) create(@Body() body: any) { return this.usersService.create(body); }
  @Patch(':id') @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN) update(@Param('id') id: string, @Body() body: any) { return this.usersService.update(id, body); }
  @Patch(':id/toggle') @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN) toggle(@Param('id') id: string) { return this.usersService.toggleActive(id); }
}
