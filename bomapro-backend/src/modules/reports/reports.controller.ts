import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  getDashboard(@Req() req, @Query('propertyId') propertyId?: string) {
    const tenantId = req.user?.tenantId || '';
    return this.reportsService.getDashboardStats(tenantId, propertyId);
  }

  @Get('revenue')
  getRevenue(@Req() req, @Query('year') year?: number, @Query('propertyId') propertyId?: string) {
    const tenantId = req.user?.tenantId || '';
    const reportYear = year || new Date().getFullYear();
    return this.reportsService.getRevenueReport(tenantId, reportYear, propertyId);
  }

  @Get('occupancy')
  getOccupancy(@Req() req) {
    const tenantId = req.user?.tenantId || '';
    return this.reportsService.getOccupancyReport(tenantId);
  }

  @Get('lease-expiry')
  getLeaseExpiry(@Req() req, @Query('days') days?: number, @Query('propertyId') propertyId?: string) {
    const tenantId = req.user?.tenantId || '';
    return this.reportsService.getLeaseExpiryReport(tenantId, days, propertyId);
  }

  @Get('damages')
  getDamages(@Req() req, @Query('propertyId') propertyId?: string) {
    const tenantId = req.user?.tenantId || '';
    return this.reportsService.getDamagesReport(tenantId, propertyId);
  }
}
