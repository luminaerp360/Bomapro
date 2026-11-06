import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { TenantRepository } from './repositories/tenant.repository';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private readonly tenantRepository: TenantRepository) {}

  async create(dto: CreateTenantDto, ownerUserId: string) {
    const slug = dto.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

    const existing = await this.tenantRepository.findBySlug(slug);
    if (existing) {
      throw new ConflictException(`Tenant with slug "${slug}" already exists`);
    }

    return this.tenantRepository.create({
      ...dto,
      slug,
      ownerUserId,
    } as any);
  }

  async findAll() {
    return this.tenantRepository.findBy({});
  }

  async findById(id: string) {
    const tenant = await this.tenantRepository.findById(id);
    if (!tenant || tenant.isDeleted) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  async findBySlug(slug: string) {
    const tenant = await this.tenantRepository.findBySlug(slug);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  async findByIds(ids: string[]) {
    return this.tenantRepository.findByIds(ids);
  }

  async findByOwner(ownerUserId: string) {
    return this.tenantRepository.findByOwner(ownerUserId);
  }

  async update(id: string, dto: UpdateTenantDto) {
    if (Array.isArray(dto.notificationEmails)) {
      dto.notificationEmails = [
        ...new Set(
          dto.notificationEmails
            .map((e) => (typeof e === 'string' ? e.trim().toLowerCase() : ''))
            .filter((e) => e && e.includes('@')),
        ),
      ];
    }
    const tenant = await this.tenantRepository.update(id, dto as any);
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async sendTestEmail(id: string, targetEmail?: string) {
    const tenant = await this.findById(id);
    const smtp = tenant.smtpConfig || {};
    const useCustom = Boolean(smtp.useCustomSmtp && smtp.host && smtp.user && smtp.pass);

    const host = useCustom ? smtp.host! : process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = useCustom ? Number(smtp.port || 465) : parseInt(process.env.SMTP_PORT || '465', 10);
    const secure = useCustom
      ? smtp.secure !== undefined
        ? Boolean(smtp.secure)
        : port === 465
      : process.env.SMTP_SECURE
      ? process.env.SMTP_SECURE === 'true'
      : port === 465;
    const user = useCustom ? smtp.user! : process.env.SMTP_USER || 'luminaerp360@gmail.com';
    const pass = useCustom
      ? smtp.pass!
      : process.env.SMTP_PASSWORD || process.env.SMTP_PASS || 'uloh bcxz vqgf stgt';
    const fromEmail = useCustom
      ? smtp.fromEmail || smtp.user || user
      : process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'luminaerp360@gmail.com';
    const fromName = (useCustom && smtp.fromName) || tenant.name || 'Bomapro Property Management';

    const recipients = targetEmail?.trim()
      ? [targetEmail.trim()]
      : [
          ...(Array.isArray(tenant.notificationEmails) ? tenant.notificationEmails : []),
          tenant.billingEmail,
          tenant.contactEmail,
        ]
          .map((e) => (e || '').trim())
          .filter((e) => e && e.includes('@'));

    const uniqueRecipients = [...new Set(recipients)];
    if (uniqueRecipients.length === 0) {
      throw new BadRequestException(
        'Please provide a test email address or add at least one notification email in settings.',
      );
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: uniqueRecipients.join(', '),
      subject: `✓ SMTP & Notification Test – ${tenant.name || 'Bomapro'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; background: #f8fafc; border-radius: 14px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="display: inline-block; width: 48px; height: 48px; background: #059669; border-radius: 12px; line-height: 48px; color: white; font-size: 22px;">🏠</div>
            <h2 style="color: #0f172a; margin: 10px 0 4px;">Email Configuration Verified</h2>
            <p style="color: #64748b; font-size: 13px; margin: 0;">${tenant.name || 'Bomapro Property Management'}</p>
          </div>
          <div style="background: white; border-radius: 12px; padding: 22px; border: 1px solid #e2e8f0;">
            <p style="color: #334155; margin-top: 0;">Your email notification system is working properly and ready to send:</p>
            <ul style="color: #475569; font-size: 14px; line-height: 1.7;">
              <li>Instant Rent Invoices with 1-Click Public Payment Links (<code>/pay/:token</code>)</li>
              <li>Itemized Overdue & Unpaid Balance Statements</li>
              <li>Payment Receipts to Tenants & Instant Alerts to Admin Notification Emails</li>
            </ul>
            <div style="background: #f1f5f9; border-radius: 8px; padding: 12px 16px; margin-top: 16px; font-size: 12px; color: #475569;">
              <div><strong>Mode:</strong> ${useCustom ? 'Custom Organization SMTP' : 'System Default SMTP (.env)'}</div>
              <div><strong>Sender:</strong> ${fromName} &lt;${fromEmail}&gt;</div>
              <div><strong>SMTP Server:</strong> ${host}:${port} (${secure ? 'SSL/TLS' : 'STARTTLS'})</div>
              <div><strong>Recipients Tested:</strong> ${uniqueRecipients.join(', ')}</div>
            </div>
          </div>
        </div>
      `,
    });

    return {
      success: true,
      message: `Test email sent to ${uniqueRecipients.join(', ')} via ${useCustom ? 'Custom SMTP' : 'Default System SMTP'} (${fromEmail})`,
    };
  }

  async remove(id: string) {
    return this.tenantRepository.delete(id);
  }
}
