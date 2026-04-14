import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, UpdatePaymentDto } from './dto/payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  create(@Body() dto: CreatePaymentDto, @Req() req) {
    const tenantId = req.user?.tenantId || '';
    const recordedBy = req.user?.userId || '';
    return this.paymentsService.create(dto, tenantId, recordedBy);
  }

  @Get()
  findAll(
    @Req() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('paymentMethod') paymentMethod?: string,
  ) {
    const tenantId = req.user?.tenantId || '';
    return this.paymentsService.findAll(tenantId, page, limit, search, status, paymentMethod);
  }

  @Get('stats')
  getStats(@Req() req) {
    const tenantId = req.user?.tenantId || '';
    return this.paymentsService.getStats(tenantId);
  }

  @Get('by-lease/:leaseId')
  findByLease(@Req() req, @Param('leaseId') leaseId: string) {
    const tenantId = req.user?.tenantId || '';
    return this.paymentsService.findByLease(tenantId, leaseId);
  }

  @Get('by-property/:propertyId')
  findByProperty(@Req() req, @Param('propertyId') propertyId: string) {
    const tenantId = req.user?.tenantId || '';
    return this.paymentsService.findByProperty(tenantId, propertyId);
  }

  @Get('by-tenant/:propertyTenantId')
  findByPropertyTenant(@Req() req, @Param('propertyTenantId') propertyTenantId: string) {
    const tenantId = req.user?.tenantId || '';
    return this.paymentsService.findByPropertyTenant(tenantId, propertyTenantId);
  }

  @Get('date-range')
  findByDateRange(
    @Req() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const tenantId = req.user?.tenantId || '';
    return this.paymentsService.findByDateRange(tenantId, startDate, endDate);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    const tenantId = req.user?.tenantId || '';
    return this.paymentsService.findById(id, tenantId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePaymentDto, @Req() req) {
    const tenantId = req.user?.tenantId || '';
    return this.paymentsService.update(id, tenantId, dto);
  }

  @Put(':id/complete')
  markCompleted(@Param('id') id: string, @Req() req) {
    const tenantId = req.user?.tenantId || '';
    return this.paymentsService.markCompleted(id, tenantId);
  }

  @Post('confirm-mpesa')
  confirmMpesaPayment(@Body() body: any, @Req() req) {
    const tenantId = req.user?.tenantId || '';
    const recordedBy = req.user?.userId || '';
    return this.paymentsService.confirmMpesaPayment(tenantId, recordedBy, body);
  }

  @Post(':id/resend-invoice')
  resendInvoice(@Param('id') id: string, @Req() req) {
    const tenantId = req.user?.tenantId || '';
    return this.paymentsService.resendInvoice(id, tenantId);
  }

  @Post('send-reminder/:propertyTenantId')
  sendReminder(@Param('propertyTenantId') propertyTenantId: string, @Req() req) {
    const tenantId = req.user?.tenantId || '';
    return this.paymentsService.sendPaymentReminder(propertyTenantId, tenantId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    const tenantId = req.user?.tenantId || '';
    return this.paymentsService.remove(id, tenantId);
  }
}
