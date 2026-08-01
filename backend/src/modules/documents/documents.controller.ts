import { Controller, Get, Post, Delete, Param, Query, UploadedFile, UseInterceptors, Body, Res, StreamableFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import { DocumentsService } from './documents.service';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Documents')
@ApiBearerAuth('JWT')
@Controller('documents')
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Get() findAll(@Query('vehicleId') v?: string, @Query('driverId') d?: string, @Query('tripId') t?: string, @Query('tipo') tipo?: string) {
    return this.documentsService.findAll({ vehicleId: v, driverId: d, tripId: t, tipo });
  }

  @Get('expiring') getExpiring() { return this.documentsService.getExpiringSoon(); }

  @Get(':id/download')
  async download(@Param('id') id: string, @Res({ passthrough: true }) res: Response): Promise<StreamableFile> {
    const { stream, doc } = await this.documentsService.getFileStream(id);
    res.set({
      'Content-Type': doc.mimeType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${doc.fileName}"`,
    });
    return new StreamableFile(stream);
  }

  @Get(':id') findOne(@Param('id') id: string) { return this.documentsService.findOne(id); }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATIONS_MANAGER, UserRole.DISPATCHER, UserRole.ACCOUNTANT)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  create(@UploadedFile() file: Express.Multer.File, @Body() body: any) {
    return this.documentsService.create(file, body);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATIONS_MANAGER)
  remove(@Param('id') id: string) { return this.documentsService.remove(id); }
}

