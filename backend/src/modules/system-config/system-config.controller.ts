import { Controller, Get, Put, Param, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { SystemConfigService } from './system-config.service';

@ApiTags('System Config')
@ApiBearerAuth('JWT')
@Controller('system-config')
export class SystemConfigController {
  constructor(private systemConfigService: SystemConfigService) {}

  @Get(':key')
  get(@Param('key') key: string) {
    return this.systemConfigService.get(key);
  }

  @Put(':key')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  upsert(@Param('key') key: string, @Body() body: { value: any; label?: string }) {
    return this.systemConfigService.upsert(key, body.value, body.label);
  }
}
