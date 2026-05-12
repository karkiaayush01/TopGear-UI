import type { AppointmentStatus, PartRequestStatus, ReviewType, VehicleType } from './models';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    email: string;
    verificationCode: string;
    password: string;
}

export interface SignupRequest {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phoneNumber?: string | null;
}

export interface CreatePartRequest {
    partName: string;
    partPrice: number;
    sellingPrice: number;
    quantity: number;
    vendorId: string;
    description: string;
    vehicleType: number;
    partImage?: File;
}

export interface EditPartRequest {
    partName?: string;
    partPrice?: number;
    sellingPrice?: number;
    vendorId?: string;
    description?: string;
    vehicleType?: number;
    imageUrl?: string;
}

export interface PartSearchQuery {
    search?: string;
    q?: string;
    limit?: number;
    vehicleType?: number;
    minSellingPrice?: number;
    maxSellingPrice?: number;
    minQuantity?: number;
    maxQuantity?: number;
}

export interface CreateVendorRequest {
    vendorName: string;
    companyName?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    contactPerson?: string | null;
}

export interface EditVendorRequest {
    vendorId: string;
    vendorName: string;
    companyName?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    contactPerson?: string | null;
    isActive: boolean;
}

export interface CreatePurchaseInvoiceItemRequest {
    partId: string;
    quantity: number;
    unitPrice: number;
}

export interface CreatePurchaseInvoiceRequest {
    vendorId: string;
    items: CreatePurchaseInvoiceItemRequest[];
}

export interface CreateCustomerRequest {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
}

export interface UpdateCustomerRequest {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
}

export interface CustomerSearchParams {
    name?: string;
    phone?: string;
    customerId?: string;
    vehiclePlateNumber?: string;
    page?: number;
    pageSize?: number;
}

export interface CreateVehicleRequest {
    make: string;
    model: string;
    year: number;
    plateNumber: string;
    vehicleType: VehicleType;
}

export interface UpdateVehicleRequest {
    make?: string;
    model?: string;
    year?: number;
    plateNumber?: string;
    vehicleType?: VehicleType;
}

export interface CreatePartSaleItemRequest {
    partId: string;
    quantity: number;
}

export interface CreatePartSaleRequest {
    customerId: string;
    isCredit?: boolean;
    items: CreatePartSaleItemRequest[];
}

export interface CustomerPurchaseRequest {
    items: CreatePartSaleItemRequest[];
}

export interface CreatePartRequestSubmissionRequest {
    partName: string;
    vehicleDetails?: string | null;
    quantity: number;
    notes?: string | null;
}

export interface ReviewPartRequestRequest {
    status: PartRequestStatus;
    adminNotes?: string | null;
}

export interface CreateAppointmentRequest {
    customerId: string;
    vehicleType: VehicleType;
    appointmentDate: string;
    notes?: string | null;
}

export interface UpdateAppointmentRequest {
    status?: AppointmentStatus;
    appointmentDate?: string;
    notes?: string | null;
}

export interface CreateReviewRequest {
    reviewType: ReviewType;
    partId?: string | null;
    appointmentId?: string | null;
    rating: number;
    comment?: string | null;
}

export interface EditReviewRequest {
    rating?: number;
    comment?: string | null;
}

export interface FinancialReportQuery {
    period?: 'daily' | 'monthly' | 'yearly';
    from?: string;
    to?: string;
}

export interface PurchaseInvoiceReportQuery {
    from?: string;
    to?: string;
}
