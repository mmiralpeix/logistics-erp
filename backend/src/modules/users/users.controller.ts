import { Controller, Get, Post, Body, Patch, Param, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Users')
@ApiBearerAuth('JWT')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me/dashboard-config')
  @ApiOperation({ summary: 'Obtener configuración personalizada del Dashboard del usuario' })
  getDashboardConfig(@Req() req: any) {
    return this.usersService.getDashboardConfig(req.user.id);
  }

  @Patch('me/dashboard-config')
  @ApiOperation({ summary: 'Guardar configuración personalizada del Dashboard del usuario' })
  updateDashboardConfig(@Req() req: any, @Body() config: any) {
    return this.usersService.updateDashboardConfig(req.user.id, config);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  create(@Body() body: any) {
    return this.usersService.create(body);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  update(@Param('id') id: string, @Body() body: any) {
    return this.usersService.update(id, body);
  }

  @Patch(':id/toggle')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  toggle(@Param('id') id: string) {
    return this.usersService.toggleActive(id);
  }
}
