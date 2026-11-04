import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Properties')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  create(@Body() dto: any, @Req() req) {
    const tenantId = req.user?.tenantId || req.user?.tenantIds?.[0] || '';
    return this.propertiesService.create(dto, tenantId);
  }

  @Get()
  findAll(
    @Req() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    const tenantId = req.user?.tenantId || req.user?.tenantIds?.[0] || '';
    return this.propertiesService.findAll(tenantId, page, limit, search, status, type);
  }

  @Get('stats')
  getStats(@Req() req) {
    const tenantId = req.user?.tenantId || req.user?.tenantIds?.[0] || '';
    return this.propertiesService.getStats(tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    const tenantId = req.user?.tenantId || req.user?.tenantIds?.[0] || '';
    return this.propertiesService.findById(id, tenantId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any, @Req() req) {
    const tenantId = req.user?.tenantId || req.user?.tenantIds?.[0] || '';
    return this.propertiesService.update(id, tenantId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    const tenantId = req.user?.tenantId || req.user?.tenantIds?.[0] || '';
    return this.propertiesService.remove(id, tenantId);
  }
}
