import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentRepository } from './repositories/payment.repository';
import { CreatePaymentDto, UpdatePaymentDto } from './dto/payment.dto';
import { RentSchedulesService } from '../rent-schedules/rent-schedules.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly rentSchedulesService: RentSchedulesService,
  ) {}

  async create(dto: CreatePaymentDto, tenantId: string, recordedBy: string) {
    const receiptNumber = `RCP-${Date.now().toString(36).toUpperCase()}`;
    const payment = await this.paymentRepository.create({
      ...dto,
      tenantId,
      recordedBy,
      receiptNumber,
      status: 'completed', // Auto-complete payments on creation
    } as any);

    // Apply payment to rent schedule if it's a rent payment
    if (payment.leaseId && dto.paymentType === 'rent') {
      try {
        await this.rentSchedulesService.recordPayment(
          tenantId,
          payment.leaseId,
          payment.amount,
          payment._id.toString(),
          payment.paymentDate,
          payment.paymentMethod,
        );
      } catch (error) {
        console.error('Failed to record payment in rent schedule:', error.message);
        // Don't fail payment creation if schedule update fails
      }
    }

    return payment;
  }

  async findAll(tenantId: string, page = 1, limit = 20, search?: string, status?: string, paymentMethod?: string) {
    const filter: any = { tenantId };
    if (status) filter.status = status;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (search) {
      filter.$or = [
        { receiptNumber: { $regex: search, $options: 'i' } },
        { mpesaTransactionId: { $regex: search, $options: 'i' } },
        { propertyName: { $regex: search, $options: 'i' } },
        { propertyTenantName: { $regex: search, $options: 'i' } },
        { paymentPeriod: { $regex: search, $options: 'i' } },
      ];
    }
    return this.paymentRepository.findPaginated({ page, limit, filter });
  }

  async findById(id: string, tenantId: string) {
    const payment = await this.paymentRepository.findById(id);
    if (!payment || payment.isDeleted || payment.tenantId !== tenantId) {
      throw new NotFoundException('Payment not found');
    }
    return payment;
  }

  async findByLease(tenantId: string, leaseId: string) {
    return this.paymentRepository.findByLease(tenantId, leaseId);
  }

  async findByProperty(tenantId: string, propertyId: string) {
    return this.paymentRepository.findByProperty(tenantId, propertyId);
  }

  async findByPropertyTenant(tenantId: string, propertyTenantId: string) {
    return this.paymentRepository.findByPropertyTenant(tenantId, propertyTenantId);
  }

  async findByDateRange(tenantId: string, startDate: string, endDate: string) {
    return this.paymentRepository.findByDateRange(tenantId, new Date(startDate), new Date(endDate));
  }

  async markCompleted(id: string, tenantId: string) {
    await this.findById(id, tenantId);
    const payment = await this.paymentRepository.update(id, { status: 'completed' } as any);
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  async update(id: string, tenantId: string, dto: UpdatePaymentDto) {
    await this.findById(id, tenantId);
    const payment = await this.paymentRepository.update(id, dto as any);
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  async remove(id: string, tenantId: string) {
    await this.findById(id, tenantId);
    return this.paymentRepository.delete(id);
  }

  async getStats(tenantId: string) {
    const [total, completed, pending, failed] = await Promise.all([
      this.paymentRepository.countByTenant(tenantId),
      this.paymentRepository.countByStatus(tenantId, 'completed'),
      this.paymentRepository.countByStatus(tenantId, 'pending'),
      this.paymentRepository.countByStatus(tenantId, 'failed'),
    ]);
    const [totalCompleted, totalPending] = await Promise.all([
      this.paymentRepository.getTotalByStatus(tenantId, 'completed'),
      this.paymentRepository.getTotalByStatus(tenantId, 'pending'),
    ]);
    const now = new Date();
    const monthlyRevenue = await this.paymentRepository.getMonthlyRevenue(tenantId, now.getFullYear(), now.getMonth() + 1);
    return { total, completed, pending, failed, totalCompleted, totalPending, monthlyRevenue };
  }

  /** Record a completed M-Pesa payment confirmed via proxy polling (no STK push initiated here) */
  async confirmMpesaPayment(
    tenantId: string,
    recordedBy: string,
    dto: {
      leaseId?: string;
      propertyTenantId?: string;
      propertyId?: string;
      amount: number;
      phoneNumber: string;
      mpesaReceiptNumber: string;
      checkoutRequestId: string;
      paymentPeriod?: string;
      paymentType?: string;
      notes?: string;
      propertyName?: string;
      propertyTenantName?: string;
    },
  ) {
    const receiptNumber = `RCP-${Date.now().toString(36).toUpperCase()}`;
    // Format phone
    const cleanPhone = dto.phoneNumber.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? '254' + cleanPhone.slice(1)
      : cleanPhone.startsWith('254') ? cleanPhone : '254' + cleanPhone;

    const payment = await this.paymentRepository.create({
      tenantId,
      leaseId: dto.leaseId || '',
      propertyTenantId: dto.propertyTenantId || '',
      propertyId: dto.propertyId || '',
      amount: dto.amount,
      currency: 'KES',
      paymentDate: new Date(),
      paymentMethod: 'mpesa',
      paymentType: dto.paymentType || 'rent',
      status: 'completed',
      mpesaTransactionId: dto.mpesaReceiptNumber,
      mpesaPhoneNumber: formattedPhone,
      receiptNumber,
      paymentPeriod: dto.paymentPeriod || '',
      notes: dto.notes || '',
      propertyName: dto.propertyName || '',
      propertyTenantName: dto.propertyTenantName || '',
      recordedBy,
    } as any);

    // Apply to rent schedule
    if (payment.leaseId && (payment as any).paymentType === 'rent') {
      this.rentSchedulesService.recordPayment(
        tenantId,
        payment.leaseId,
        payment.amount,
        payment._id.toString(),
        payment.paymentDate,
        'mpesa',
      ).catch((e) => console.error('Rent schedule error', e.message));
    }

    return payment;
  }
}
