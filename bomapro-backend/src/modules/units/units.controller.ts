import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { UnitsService } from './units.service';
import { CreateUnitDto, UpdateUnitDto, BulkImportUnitsDto } from './dto/unit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Units')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('units')
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Post('bulk-import')
  bulkImport(@Body() dto: BulkImportUnitsDto, @Req() req) {
    const tenantId = req.user?.tenantId || req.user?.tenantIds?.[0] || '';
    return this.unitsService.bulkImport(dto, tenantId);
  }

  @Post()
  create(@Body() dto: CreateUnitDto, @Req() req) {
    const tenantId = req.user?.tenantId || req.user?.tenantIds?.[0] || '';
    return this.unitsService.create(dto, tenantId);
  }

  @Get()
  findAll(
    @Req() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('propertyId') propertyId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('unitType') unitType?: string,
    @Query('floor') floor?: string,
  ) {
    const tenantId = req.user?.tenantId || req.user?.tenantIds?.[0] || '';
    return this.unitsService.findAll(tenantId, page, limit, propertyId, status, search, unitType, floor);
  }

  @Get('stats')
  getStats(@Req() req, @Query('propertyId') propertyId?: string) {
    const tenantId = req.user?.tenantId || req.user?.tenantIds?.[0] || '';
    return this.unitsService.getStats(tenantId, propertyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    const tenantId = req.user?.tenantId || req.user?.tenantIds?.[0] || '';
    return this.unitsService.findById(id, tenantId);
  }

  @Get('property/:propertyId')
  findByProperty(@Param('propertyId') propertyId: string, @Req() req) {
    const tenantId = req.user?.tenantId || req.user?.tenantIds?.[0] || '';
    return this.unitsService.findByProperty(propertyId, tenantId);
  }

  @Get('available/:propertyId')
  findAvailable(@Param('propertyId') propertyId: string, @Req() req) {
    const tenantId = req.user?.tenantId || req.user?.tenantIds?.[0] || '';
    return this.unitsService.findAvailableByProperty(propertyId, tenantId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUnitDto, @Req() req) {
    const tenantId = req.user?.tenantId || req.user?.tenantIds?.[0] || '';
    return this.unitsService.update(id, tenantId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    const tenantId = req.user?.tenantId || req.user?.tenantIds?.[0] || '';
    return this.unitsService.remove(id, tenantId);
  }
}
