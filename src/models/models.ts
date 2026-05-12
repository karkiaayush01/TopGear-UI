export type UserRole = 'Admin' | 'Staff' | 'Customer';

export interface User {
    userId: string;
    fullName: string;
    email: string;
    phoneNumber: string | null;
    role: UserRole;
}

export enum VehicleType {
    Bike = 1,
    Scooter = 2,
    Car = 3,
    Truck = 4,
}

export enum AppointmentStatus {
    Pending = 1,
    Confirmed = 2,
    Completed = 3,
    Cancelled = 4,
}

export enum PartRequestStatus {
    Pending = 1,
    Reviewed = 2,
    Approved = 3,
    Rejected = 4,
}

export enum ReviewType {
    Part = 1,
    Service = 2,
}

export enum UserAccountStatus {
    Inactive = 0,
    Active = 1,
    Deactivated = 2,
    Deleted = 3,
}

export interface Staff {
    userId: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    phoneNumber: string | null;
    status: UserAccountStatus;
}

export interface Part {
    partId: string;
    purchasePrice: string;
    partPrice: number;
    sellingPrice: number;
    quantity: number;
    vendorId: string;
    vendorName: string;
    description: string;
    partName?: string;
    vehicleType: VehicleType;
    imageUrl: string;
}

export interface Vendor {
    vendorId: string;
    vendorName: string;
    companyName: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    contactPerson: string | null;
    isActive: boolean;
    createdAt: string;
    totalPartsSupplied: number;
}

export interface Customer {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string | null;
    imageUrl: string | null;
}

export interface Vehicle {
    vehicleId: string;
    customerId: string;
    make: string;
    model: string;
    year: number;
    plateNumber: string;
    vehicleType: VehicleType;
}

export interface PurchaseInvoiceItem {
    partId: string;
    partName: string;
    quantity: number;
    unitPrice: number;
}

export interface PurchaseInvoice {
    purchaseInvoiceId: string;
    vendorId: string;
    vendorName: string;
    invoiceDate: string;
    items: PurchaseInvoiceItem[];
}

export interface PartSaleItem {
    saleItemId: string;
    partId: string;
    partName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

export interface PartSale {
    saleId: string;
    customerId: string;
    customerName: string;
    customerEmail: string;
    createdById: string;
    createdByName: string;
    saleDate: string;
    subTotal: number;
    discountAmount: number;
    finalAmount: number;
    isCredit: boolean;
    isPaid: boolean;
    paidAt: string | null;
    items: PartSaleItem[];
}

export interface PartRequest {
    partRequestId: string;
    customerId: string;
    customerName: string;
    partName: string;
    vehicleDetails: string | null;
    quantity: number;
    notes: string | null;
    status: PartRequestStatus;
    adminNotes: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface Appointment {
    appointmentId: string;
    customerId: string;
    customerName: string;
    vehicleType: VehicleType;
    appointmentDate: string;
    status: AppointmentStatus;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface Review {
    reviewId: string;
    customerId: string;
    customerName: string;
    reviewType: ReviewType;
    partId: string | null;
    appointmentId: string | null;
    rating: number;
    comment: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface RegularCustomer {
    customerId: string;
    customerName: string;
    email: string;
    purchaseCount: number;
    totalSpent: number;
    lastPurchaseDate: string;
}

export interface HighSpender {
    rank: number;
    customerId: string;
    customerName: string;
    email: string;
    totalSpent: number;
    purchaseCount: number;
}

export interface PendingCredit {
    customerId: string;
    customerName: string;
    email: string;
    phone: string;
    unpaidInvoiceCount: number;
    totalAmountDue: number;
    oldestUnpaidDate: string;
}

export interface PeriodRevenueSummary {
    label: string;
    saleCount: number;
    revenue: number;
    discount: number;
}

export interface TopSellingPartSummary {
    partId: string;
    partName: string;
    totalQuantity: number;
    totalRevenue: number;
}

export interface FinancialReport {
    from: string | null;
    to: string | null;
    period: string;
    totalSales: number;
    totalRevenue: number;
    totalDiscount: number;
    cashRevenue: number;
    creditRevenue: number;
    byPeriod: PeriodRevenueSummary[];
    topSellingParts: TopSellingPartSummary[];
}

export interface VendorPurchaseSummary {
    vendorId: string;
    vendorName: string;
    invoiceCount: number;
    totalAmount: number;
}

export interface PartPurchaseSummary {
    partId: string;
    partName: string;
    totalQuantity: number;
    totalAmount: number;
}

export interface PurchaseInvoiceReport {
    from: string | null;
    to: string | null;
    totalInvoices: number;
    totalAmountSpent: number;
    totalUnitsPurchased: number;
    byVendor: VendorPurchaseSummary[];
    byPart: PartPurchaseSummary[];
}

export const vehicleTypeLabel = (type: VehicleType): string => VehicleType[type] ?? String(type);
export const appointmentStatusLabel = (s: AppointmentStatus): string => AppointmentStatus[s] ?? String(s);
export const partRequestStatusLabel = (s: PartRequestStatus): string => PartRequestStatus[s] ?? String(s);
