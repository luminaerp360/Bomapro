import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TenantPortalService } from './tenant-portal.service';
import { TenantPortalJwtGuard } from './guards/tenant-portal-jwt.guard';
import { PortalLoginDto, PortalSetupPasswordDto, UpdatePortalProfileDto } from './dto/portal-auth.dto';
import { InitiateMpesaPaymentDto } from './dto/portal-payment.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Tenant Portal')
@Controller('tenant-portal')
export class TenantPortalController {
  constructor(private readonly service: TenantPortalService) {}

  // ──── Public Auth ────────────────────────────────────

  @Post('auth/setup-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set portal password using invite token' })
  setupPassword(@Body() dto: PortalSetupPasswordDto) {
    return this.service.setupPassword(dto);
  }

  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tenant portal login' })
  login(@Body() dto: PortalLoginDto) {
    return this.service.login(dto);
  }

  // ──── Protected Profile ──────────────────────────────

  @ApiBearerAuth()
  @UseGuards(TenantPortalJwtGuard)
  @Get('profile')
  @ApiOperation({ summary: 'Get tenant profile' })
  getProfile(@Request() req: any) {
    return this.service.getProfile(req.user.sub);
  }

  @ApiBearerAuth()
  @UseGuards(TenantPortalJwtGuard)
  @Put('profile')
  @ApiOperation({ summary: 'Update tenant phone number' })
  updateProfile(@Request() req: any, @Body() dto: UpdatePortalProfileDto) {
    return this.service.updateProfile(req.user.sub, dto);
  }

  // ──── Lease ──────────────────────────────────────────

  @ApiBearerAuth()
  @UseGuards(TenantPortalJwtGuard)
  @Get('lease')
  @ApiOperation({ summary: 'Get tenant active lease' })
  getLease(@Request() req: any) {
    return this.service.getLease(req.user.sub, req.user.orgTenantId);
  }

  @ApiBearerAuth()
  @UseGuards(TenantPortalJwtGuard)
  @Post('lease/:id/sign')
  @ApiOperation({ summary: 'Sign lease agreement' })
  signLease(@Param('id') id: string, @Request() req: any) {
    return this.service.signLease(id, req.user.sub, req.user.orgTenantId);
  }

  // ──── Payments ───────────────────────────────────────

  @ApiBearerAuth()
  @UseGuards(TenantPortalJwtGuard)
  @Get('payments')
  @ApiOperation({ summary: 'Get tenant payment history' })
  getPayments(@Request() req: any) {
    return this.service.getPayments(req.user.sub, req.user.orgTenantId);
  }

  @ApiBearerAuth()
  @UseGuards(TenantPortalJwtGuard)
  @Post('payments/confirm-mpesa')
  @ApiOperation({ summary: 'Record confirmed M-Pesa payment (proxy-polled flow)' })
  confirmMpesaPayment(@Request() req: any, @Body() body: any) {
    return this.service.confirmMpesaPayment(req.user.sub, req.user.orgTenantId, body);
  }

  @ApiBearerAuth()
  @UseGuards(TenantPortalJwtGuard)
  @Post('payments/mpesa-stk')
  @ApiOperation({ summary: 'Initiate M-Pesa STK push payment' })
  initiateMpesaPayment(@Request() req: any, @Body() dto: InitiateMpesaPaymentDto) {
    return this.service.initiateMpesaPayment(req.user.sub, req.user.orgTenantId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(TenantPortalJwtGuard)
  @Get('payments/:id/status')
  @ApiOperation({ summary: 'Check payment status' })
  getPaymentStatus(@Param('id') id: string, @Request() req: any) {
    return this.service.getPaymentStatus(id, req.user.sub);
  }

  // ──── Org Settings ───────────────────────────────────

  @ApiBearerAuth()
  @UseGuards(TenantPortalJwtGuard)
  @Get('org-settings')
  @ApiOperation({ summary: 'Get organisation settings (incl. mpesaClientId)' })
  getOrgSettings(@Request() req: any) {
    return this.service.getOrgSettings(req.user.orgTenantId);
  }

  // ──── Invoices (alias for payments list) ────────────

  @ApiBearerAuth()
  @UseGuards(TenantPortalJwtGuard)
  @Get('invoices')
  @ApiOperation({ summary: 'Get invoices (completed payments)' })
  getInvoices(@Request() req: any) {
    return this.service.getPayments(req.user.sub, req.user.orgTenantId);
  }

  // ──── M-Pesa Callback (public — called by Safaricom) ─

  @Post('mpesa/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'M-Pesa STK push callback (Safaricom only)' })
  mpesaCallback(@Body() body: any) {
    return this.service.handleMpesaCallback(body);
  }

  // ──── Resend Invite (admin-side utility) ─────────────

  @ApiBearerAuth()
  @UseGuards(TenantPortalJwtGuard)
  @Post('resend-invite/:propertyTenantId')
  @ApiOperation({ summary: 'Resend portal invite email (for property managers)' })
  resendInvite(@Param('propertyTenantId') propertyTenantId: string, @Request() req: any) {
    return this.service.resendInvite(propertyTenantId, req.user.orgTenantId);
  }
}
