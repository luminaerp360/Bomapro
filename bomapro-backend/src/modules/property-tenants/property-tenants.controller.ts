import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { PropertyTenantsService } from './property-tenants.service';
import { CreatePropertyTenantDto, UpdatePropertyTenantDto } from './dto/property-tenant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Property Tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('property-tenants')
export class PropertyTenantsController {
  constructor(private readonly propertyTenantsService: PropertyTenantsService) {}

  @Post()
  create(@Body() dto: CreatePropertyTenantDto, @Req() req) {
    const tenantId = req.user?.tenantId || '';
    return this.propertyTenantsService.create(dto, tenantId);
  }

  @Get()
  findAll(
    @Req() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('propertyId') propertyId?: string,
  ) {
    const tenantId = req.user?.tenantId || '';
    return this.propertyTenantsService.findAll(tenantId, page, limit, search, propertyId);
  }

  @Get('stats')
  getStats(@Req() req) {
    const tenantId = req.user?.tenantId || '';
    return this.propertyTenantsService.getStats(tenantId);
  }

  @Get('by-property/:propertyId')
  findByProperty(@Req() req, @Param('propertyId') propertyId: string) {
    const tenantId = req.user?.tenantId || '';
    return this.propertyTenantsService.findByProperty(tenantId, propertyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    const tenantId = req.user?.tenantId || '';
    return this.propertyTenantsService.findById(id, tenantId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePropertyTenantDto, @Req() req) {
    const tenantId = req.user?.tenantId || '';
    return this.propertyTenantsService.update(id, tenantId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    const tenantId = req.user?.tenantId || '';
    return this.propertyTenantsService.remove(id, tenantId);
  }
}
