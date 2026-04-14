export interface PortalProfile {
  _id: string;
  name: string;
  email: string;
  phone: string;
  idNumber: string;
  avatar: string;
  currentPropertyId: string;
  currentLeaseId: string;
  isActive: boolean;
  occupation: string;
  employer: string;
}

export interface PortalLease {
  _id: string;
  leaseNumber: string;
  status: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  currency: string;
  depositAmount: number;
  depositPaid: boolean;
  paymentFrequency: string;
  paymentDueDay: number;
  terms: string;
  propertyName: string;
  unitNumber: string;
  propertyTenantName: string;
  isSigned: boolean;
  signedAt?: string;
}

export interface PortalPayment {
  _id: string;
  amount: number;
  currency: string;
  paymentDate: string;
  paymentMethod: string;
  paymentType: string;
  status: string;
  mpesaTransactionId: string;
  mpesaPhoneNumber: string;
  receiptNumber: string;
  paymentPeriod: string;
  propertyName: string;
  notes: string;
}

export interface PortalBalance {
  balance: number;
  totalPaid: number;
  totalDue: number;
  rentAmount: number;
  currency: string;
  overdueMonths: number;
}

export interface PortalDamage {
  _id: string;
  description: string;
  damageType: string;
  severity: string;
  status: string;
  location: string;
  notes: string;
  reportedDate: string;
  propertyName: string;
  createdAt?: string;
}

export interface MpesaStkResponse {
  message: string;
  checkoutRequestId: string;
  paymentId: string;
}
