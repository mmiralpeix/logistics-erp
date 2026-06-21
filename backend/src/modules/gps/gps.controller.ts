import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { GpsService } from './gps.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('GPS')
@ApiBearerAuth('JWT')
@Controller('gps')
export class GpsController {
  constructor(private gpsService: GpsService) {}

  @Get('positions')
  @ApiOperation({ summary: 'Posición en tiempo real de todos los vehículos' })
  getPositions() { return this.gpsService.getActiveVehiclesPosition(); }

  @Get('devices') getDevices() { return this.gpsService.getDevices(); }
  @Post('devices') registerDevice(@Body() body: any) { return this.gpsService.registerDevice(body); }

  @Public()
  @Post('webhook/:deviceId')
  @ApiOperation({ summary: 'Webhook para recibir actualizaciones de posición (Teltonika/Traccar)' })
  updatePosition(@Param('deviceId') deviceId: string, @Body() body: any) {
    return this.gpsService.updatePosition(deviceId, body.lat || body.latitude, body.lon || body.longitude, body.speed, body.event);
  }

  @Get('geofences') getGeofences() { return this.gpsService.getGeofences(); }
  @Post('geofences') createGeofence(@Body() body: any) { return this.gpsService.createGeofence(body); }
}
