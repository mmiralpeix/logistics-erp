import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DriversService } from './drivers.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';

@ApiTags('Drivers')
@ApiBearerAuth('JWT')
@Controller('drivers')
export class DriversController {
  constructor(private driversService: DriversService) {}

  @Get() findAll(@Query('search') s?: string, @Query('page') p?: number, @Query('limit') l?: number) {
    return this.driversService.findAll(s, p, l);
  }

  @Get('expiring-licenses') getExpiring() { return this.driversService.getExpiringLicenses(); }

  @Get('available') getAvailable(@Query('date') date?: string) {
    return this.driversService.getAvailableForDate(date ? new Date(date) : new Date());
  }

  @Get(':id') findOne(@Param('id') id: string) { return this.driversService.findOne(id); }

  @Post() create(@Body() dto: CreateDriverDto) { return this.driversService.create(dto); }

  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateDriverDto) { return this.driversService.update(id, dto); }

  @Delete(':id') remove(@Param('id') id: string) { return this.driversService.remove(id); }

  @Post(':id/trainings')
  @ApiOperation({ summary: 'Agregar capacitación a conductor' })
  addTraining(@Param('id') id: string, @Body() body: any) { return this.driversService.addTraining(id, body); }
}
