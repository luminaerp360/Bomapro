import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { RentSchedulesService } from './rent-schedules.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Rent Schedules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rent-schedules')
export class RentSchedulesController {
  constructor(private readonly scheduleService: RentSchedulesService) {}

  @Get()
  findAll(
    @Req() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('propertyId') propertyId?: string,
    @Query('leaseId') leaseId?: string,
    @Query('month') month?: string,
    @Query('scope') scope?: string,
  ) {
    const tenantId = req.user?.tenantId || '';
    return this.scheduleService.findAll(tenantId, {
      page,
      limit,
      search,
      status,
      propertyId,
      leaseId,
      month,
      scope,
    });
  }

  @Get('by-lease/:leaseId')
  findByLease(@Req() req, @Param('leaseId') leaseId: string) {
    const tenantId = req.user?.tenantId || '';
    return this.scheduleService.findByLease(tenantId, leaseId);
  }

  @Get('by-property/:propertyId')
  findByProperty(@Req() req, @Param('propertyId') propertyId: string) {
    const tenantId = req.user?.tenantId || '';
    return this.scheduleService.findByProperty(tenantId, propertyId);
  }

  @Get('by-unit/:unitId')
  findByUnit(@Req() req, @Param('unitId') unitId: string) {
    const tenantId = req.user?.tenantId || '';
    return this.scheduleService.findByUnit(tenantId, unitId);
  }

  @Get('overdue')
  findOverdue(@Req() req) {
    const tenantId = req.user?.tenantId || '';
    return this.scheduleService.findOverdue(tenantId);
  }

  @Get('balance/:leaseId')
  getLeaseBalance(@Req() req, @Param('leaseId') leaseId: string) {
    const tenantId = req.user?.tenantId || '';
    return this.scheduleService.getLeaseBalance(tenantId, leaseId);
  }

  @Post(':scheduleId/send-invoice')
  sendInvoice(@Param('scheduleId') scheduleId: string, @Req() req) {
    const tenantId = req.user?.tenantId || '';
    return this.scheduleService.sendInvoiceEmail(scheduleId, tenantId);
  }

  @Post('send-bulk-reminders')
  sendBulkReminders(@Body('mode') mode: 'overdue' | 'all_due', @Req() req) {
    const tenantId = req.user?.tenantId || '';
    return this.scheduleService.sendBulkReminders(tenantId, mode || 'all_due');
  }

  @Post(':scheduleId/apply-payment')
  applyPayment(
    @Param('scheduleId') scheduleId: string,
    @Body('paymentId') paymentId: string,
    @Body('amount') amount: number,
    @Body('paymentDate') paymentDate: string,
    @Body('paymentMethod') paymentMethod: string,
    @Req() req,
  ) {
    const tenantId = req.user?.tenantId || '';
    return this.scheduleService.updateScheduleStatus(scheduleId, tenantId);
  }

  @Delete(':scheduleId')
  delete(@Param('scheduleId') scheduleId: string, @Req() req) {
    const tenantId = req.user?.tenantId || '';
    return this.scheduleService.delete(scheduleId, tenantId);
  }
}
