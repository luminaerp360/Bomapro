import { Controller, Get, Post, Param, Body, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { RentSchedulesService } from '../rent-schedules/rent-schedules.service';
import { Tenant } from '../tenants/schemas/tenant.schema';
import { PaymentMethod, PaymentType } from './schemas/payment.schema';

@ApiTags('Public Invoices')
@Controller('public-invoices')
export class PublicInvoicesController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly rentSchedulesService: RentSchedulesService,
    @InjectModel(Tenant.name) private readonly tenantModel: Model<Tenant>,
  ) {}

  @Get(':token')
  async getPublicInvoice(@Param('token') token: string) {
    const invoice = await this.rentSchedulesService.findByPublicToken(token);
    let org: any = null;
    if (invoice.tenantId) {
      try {
        org = await this.tenantModel.findById(invoice.tenantId).lean().exec();
      } catch {}
    }

    return {
      invoice,
      organization: {
        name: org?.name || 'Bomapro Property Management',
        logoUrl: org?.logoUrl || '',
        contactEmail: org?.billingEmail || org?.contactEmail || '',
        mpesaClientId: org?.mpesaClientId || '',
      },
    };
  }

  @Post(':token/pay-manual')
  async payManual(
    @Param('token') token: string,
    @Body()
    body: {
      amount: number;
      paymentMethod: PaymentMethod;
      mpesaTransactionId?: string;
      mpesaPhoneNumber?: string;
      bankReference?: string;
      chequeNumber?: string;
      referenceNumber?: string;
      notes?: string;
    },
  ) {
    const invoice = await this.rentSchedulesService.findByPublicToken(token);
    const amount = Number(body.amount);
    if (!amount || amount <= 0) {
      throw new BadRequestException('Please enter a valid payment amount greater than 0');
    }

    const method = body.paymentMethod || PaymentMethod.MPESA;
    const payment = await this.paymentsService.create(
      {
        leaseId: invoice.leaseId,
        propertyTenantId: invoice.propertyTenantId || '',
        propertyId: invoice.propertyId,
        unitId: invoice.unitId,
        unitNumber: invoice.unitNumber || '',
        leaseNumber: invoice.leaseNumber || '',
        propertyName: invoice.propertyName || '',
        propertyTenantName: invoice.propertyTenantName || '',
        scheduleId: String(invoice._id),
        selectedMonths: invoice.month ? [invoice.month] : [],
        paymentPeriod: invoice.monthLabel || invoice.month,
        amount,
        currency: invoice.currency || 'KES',
        paymentDate: new Date().toISOString(),
        paymentMethod: method,
        paymentType: PaymentType.RENT,
        mpesaTransactionId: body.mpesaTransactionId || '',
        mpesaPhoneNumber: body.mpesaPhoneNumber || invoice.propertyTenantPhone || '',
        bankReference: body.bankReference || '',
        chequeNumber: body.chequeNumber || '',
        referenceNumber: body.referenceNumber || '',
        notes: body.notes || `Paid via public invoice link (${invoice.invoiceNumber})`,
      },
      String(invoice.tenantId),
      'public-invoice-link',
    );

    const updatedInvoice = await this.rentSchedulesService.findByPublicToken(token);
    return {
      message: 'Payment recorded successfully',
      payment,
      invoice: updatedInvoice,
    };
  }

  @Post(':token/confirm-mpesa')
  async confirmMpesa(
    @Param('token') token: string,
    @Body()
    body: {
      amount: number;
      phoneNumber: string;
      mpesaReceiptNumber: string;
      checkoutRequestId: string;
      notes?: string;
    },
  ) {
    const invoice = await this.rentSchedulesService.findByPublicToken(token);
    const amount = Number(body.amount) || invoice.balanceDue || invoice.amount;

    const payment = await this.paymentsService.confirmMpesaPayment(
      String(invoice.tenantId),
      'public-invoice-stk',
      {
        leaseId: invoice.leaseId,
        propertyTenantId: invoice.propertyTenantId || '',
        propertyId: invoice.propertyId,
        unitId: invoice.unitId,
        unitNumber: invoice.unitNumber || '',
        leaseNumber: invoice.leaseNumber || '',
        propertyName: invoice.propertyName || '',
        propertyTenantName: invoice.propertyTenantName || '',
        scheduleId: String(invoice._id),
        selectedMonths: invoice.month ? [invoice.month] : [],
        paymentPeriod: invoice.monthLabel || invoice.month,
        amount,
        phoneNumber: body.phoneNumber || invoice.propertyTenantPhone || '',
        mpesaReceiptNumber: body.mpesaReceiptNumber,
        checkoutRequestId: body.checkoutRequestId,
        paymentType: 'rent',
        notes: body.notes || `M-Pesa STK payment via public invoice link (${invoice.invoiceNumber})`,
      },
    );

    const updatedInvoice = await this.rentSchedulesService.findByPublicToken(token);
    return {
      message: 'M-Pesa payment confirmed successfully',
      payment,
      invoice: updatedInvoice,
    };
  }
}

