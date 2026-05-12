import Cookies from "js-cookie";
import type {
  Appointment,
  Customer,
  FinancialReport,
  HighSpender,
  Part,
  PartRequest,
  PartSale,
  PendingCredit,
  PurchaseInvoice,
  PurchaseInvoiceReport,
  RegularCustomer,
  Review,
  Staff,
  User,
  Vehicle,
  Vendor,
} from "../models/models";
import type {
  CreateAppointmentRequest,
  CreateCustomerRequest,
  CreatePartRequest,
  CreatePartRequestSubmissionRequest,
  CreatePartSaleRequest,
  CreatePurchaseInvoiceRequest,
  CreateReviewRequest,
  CreateVehicleRequest,
  CreateVendorRequest,
  CustomerPurchaseRequest,
  CustomerSearchParams,
  EditPartRequest,
  EditReviewRequest,
  EditVendorRequest,
  FinancialReportQuery,
  ForgotPasswordRequest,
  LoginRequest,
  PartSearchQuery,
  PurchaseInvoiceReportQuery,
  ResetPasswordRequest,
  ReviewPartRequestRequest,
  SignupRequest,
  UpdateAppointmentRequest,
  UpdateCustomerRequest,
  UpdateVehicleRequest,
} from "../models/requestModels";
import type {
  LoginResponse,
  MessageResponse,
  PagedCustomersResponse,
  PagedPartsResponse,
  RegisterUserResponse,
  SignupResponse,
} from "../models/responseModels";
import { getHeaders } from "./apiUtils";
import { CONFIG } from "../config";

const API_URL = CONFIG.API_URL;

const getApiError = async (response: Response, fallback: string): Promise<string> => {
  const contentType = response.headers.get("Content-Type");

  if (contentType?.includes("application/json")) {
    try {
      const error = await response.json();
      if (typeof error === "string") return error;
      if (typeof error?.message === "string") return error.message;
      if (typeof error?.title === "string") return error.title;
      if (error?.errors) {
        const messages = Object.values(error.errors).flat();
        if (messages.length) return messages.join(', ');
      }
    } catch {
      // fall through
    }
  }

  try {
    const message = await response.text();
    if (message) return message;
  } catch {
    // ignore
  }

  return `${fallback}: ${response.status} ${response.statusText}`;
};

const request = async <T>(
  path: string,
  init: RequestInit,
  fallback: string,
): Promise<T> => {
  const response = await fetch(`${API_URL}${path}`, init);

  if (!response.ok) {
    throw new Error(await getApiError(response, fallback));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("Content-Type");
  if (contentType?.includes("application/json")) {
    return response.json() as Promise<T>;
  }

  return (await response.text()) as T;
};

const buildQuery = (params: Record<string, unknown>): string => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.append(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
};

// ─── Auth ──────────────────────────────────────────────────────────────────

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await request<LoginResponse>(
    `/auth/login`,
    { method: "POST", headers: getHeaders(), body: JSON.stringify(data) },
    "Failed to login",
  );
  Cookies.set("accessToken", response.accessToken);
  return response;
};

export const signup = (data: SignupRequest): Promise<SignupResponse> =>
  request<SignupResponse>(
    `/auth/signup`,
    { method: "POST", headers: getHeaders(), body: JSON.stringify(data) },
    "Failed to signup",
  );

export const requestForgotPasswordCode = (data: ForgotPasswordRequest): Promise<MessageResponse> =>
  request<MessageResponse>(
    `/auth/forgot-password${buildQuery({ email: data.email })}`,
    { method: "POST", headers: getHeaders() },
    "Failed to send reset code",
  );

export const resetPassword = (data: ResetPasswordRequest): Promise<string> =>
  request<string>(
    `/auth/reset-password`,
    { method: "POST", headers: getHeaders(), body: JSON.stringify(data) },
    "Failed to reset password",
  );

export const logout = (): void => {
  Cookies.remove("accessToken");
};

export type MeResponse = Omit<User, 'role'>;

export const fetchMe = (): Promise<MeResponse> =>
  request<MeResponse>(`/auth/user/me`, { method: 'GET', headers: getHeaders() }, "Failed to load user");

// ─── Parts ─────────────────────────────────────────────────────────────────

export const getAllParts = (): Promise<Part[]> =>
  request<Part[]>(`/part`, { method: 'GET', headers: getHeaders() }, "Failed to load parts");

export const searchParts = (query: PartSearchQuery): Promise<PagedPartsResponse> =>
  request<PagedPartsResponse>(
    `/part/search${buildQuery(query as Record<string, unknown>)}`,
    { method: 'GET', headers: getHeaders() },
    "Failed to search parts",
  );

export const getPartById = (id: string): Promise<Part> =>
  request<Part>(`/part/${id}`, { method: 'GET', headers: getHeaders() }, "Failed to load part");

export const createPart = async (data: CreatePartRequest): Promise<Part> => {
  const formData = new FormData();
  formData.append('PartName', data.partName);
  formData.append('PartPrice', data.partPrice.toString());
  formData.append('SellingPrice', data.sellingPrice.toString());
  formData.append('Quantity', data.quantity.toString());
  formData.append('VendorId', data.vendorId);
  formData.append('Description', data.description);
  formData.append('VehicleType', data.vehicleType.toString());
  if (data.partImage) formData.append('PartImage', data.partImage);

  return request<Part>(
    `/part`,
    { method: 'POST', headers: getHeaders(""), body: formData },
    "Failed to create part",
  );
};

export const updatePart = (id: string, data: EditPartRequest): Promise<Part> =>
  request<Part>(
    `/part/${id}`,
    { method: 'PATCH', headers: getHeaders(), body: JSON.stringify(data) },
    "Failed to update part",
  );

export const deletePart = (id: string): Promise<void> =>
  request<void>(`/part/${id}`, { method: 'DELETE', headers: getHeaders() }, "Failed to delete part");

// ─── Vendors ───────────────────────────────────────────────────────────────

export const getAllVendors = (): Promise<Vendor[]> =>
  request<Vendor[]>(`/vendor`, { method: 'GET', headers: getHeaders() }, "Failed to load vendors");

export const getVendorById = (id: string): Promise<Vendor> =>
  request<Vendor>(`/vendor/${id}`, { method: 'GET', headers: getHeaders() }, "Failed to load vendor");

export const createVendor = (data: CreateVendorRequest): Promise<Vendor> =>
  request<Vendor>(
    `/vendor`,
    { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) },
    "Failed to create vendor",
  );

export const updateVendor = (id: string, data: EditVendorRequest): Promise<Vendor> =>
  request<Vendor>(
    `/vendor/${id}`,
    { method: 'PATCH', headers: getHeaders(), body: JSON.stringify(data) },
    "Failed to update vendor",
  );

export const deleteVendor = (id: string): Promise<void> =>
  request<void>(`/vendor/${id}`, { method: 'DELETE', headers: getHeaders() }, "Failed to delete vendor");

// ─── Staff ─────────────────────────────────────────────────────────────────

export const getAllStaff = (includeDeleted = false): Promise<Staff[]> =>
  request<Staff[]>(
    `/staff${buildQuery({ includeDeleted })}`,
    { method: 'GET', headers: getHeaders() },
    "Failed to load staff",
  );

export const registerStaff = (data: SignupRequest): Promise<RegisterUserResponse> =>
  request<RegisterUserResponse>(
    `/staff/register`,
    { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) },
    "Failed to register staff",
  );

export const deactivateStaff = (staffId: string): Promise<MessageResponse> =>
  request<MessageResponse>(
    `/staff/${staffId}/deactivate`,
    { method: 'PATCH', headers: getHeaders() },
    "Failed to deactivate staff",
  );

export const deleteStaff = (staffId: string): Promise<MessageResponse> =>
  request<MessageResponse>(
    `/staff/${staffId}`,
    { method: 'DELETE', headers: getHeaders() },
    "Failed to delete staff",
  );

// ─── Customers ─────────────────────────────────────────────────────────────

export const createCustomer = (data: CreateCustomerRequest): Promise<Customer> =>
  request<Customer>(
    `/customer/register`,
    { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) },
    "Failed to register customer",
  );

export const getCustomerById = (id: string): Promise<Customer> =>
  request<Customer>(`/customer/${id}`, { method: 'GET', headers: getHeaders() }, "Failed to load customer");

export const updateCustomer = (id: string, data: UpdateCustomerRequest): Promise<void> =>
  request<void>(
    `/customer/${id}`,
    { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) },
    "Failed to update customer",
  );

export const deactivateCustomer = (id: string): Promise<void> =>
  request<void>(`/customer/${id}`, { method: 'DELETE', headers: getHeaders() }, "Failed to deactivate customer");

export const searchCustomers = (params: CustomerSearchParams): Promise<PagedCustomersResponse> =>
  request<PagedCustomersResponse>(
    `/customer/search${buildQuery(params as Record<string, unknown>)}`,
    { method: 'GET', headers: getHeaders() },
    "Failed to search customers",
  );

// ─── Vehicles ──────────────────────────────────────────────────────────────

export const getCustomerVehicles = (customerId: string): Promise<Vehicle[]> =>
  request<Vehicle[]>(
    `/customer/${customerId}/vehicles`,
    { method: 'GET', headers: getHeaders() },
    "Failed to load vehicles",
  );

export const addVehicle = (customerId: string, data: CreateVehicleRequest): Promise<Vehicle> =>
  request<Vehicle>(
    `/customer/${customerId}/vehicles`,
    { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) },
    "Failed to add vehicle",
  );

export const updateVehicle = (
  customerId: string,
  vehicleId: string,
  data: UpdateVehicleRequest,
): Promise<Vehicle> =>
  request<Vehicle>(
    `/customer/${customerId}/vehicles/${vehicleId}`,
    { method: 'PATCH', headers: getHeaders(), body: JSON.stringify(data) },
    "Failed to update vehicle",
  );

export const deleteVehicle = (customerId: string, vehicleId: string): Promise<void> =>
  request<void>(
    `/customer/${customerId}/vehicles/${vehicleId}`,
    { method: 'DELETE', headers: getHeaders() },
    "Failed to delete vehicle",
  );

// ─── Purchase Invoices ─────────────────────────────────────────────────────

export const getAllPurchaseInvoices = (): Promise<PurchaseInvoice[]> =>
  request<PurchaseInvoice[]>(
    `/purchase-invoice`,
    { method: 'GET', headers: getHeaders() },
    "Failed to load purchase invoices",
  );

export const getPurchaseInvoiceById = (id: string): Promise<PurchaseInvoice> =>
  request<PurchaseInvoice>(
    `/purchase-invoice/${id}`,
    { method: 'GET', headers: getHeaders() },
    "Failed to load purchase invoice",
  );

export const createPurchaseInvoice = (data: CreatePurchaseInvoiceRequest): Promise<PurchaseInvoice> =>
  request<PurchaseInvoice>(
    `/purchase-invoice`,
    { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) },
    "Failed to create purchase invoice",
  );

export const deletePurchaseInvoice = (id: string): Promise<void> =>
  request<void>(
    `/purchase-invoice/${id}`,
    { method: 'DELETE', headers: getHeaders() },
    "Failed to delete purchase invoice",
  );

// ─── Part Sales ────────────────────────────────────────────────────────────

export const createPartSale = (data: CreatePartSaleRequest): Promise<PartSale> =>
  request<PartSale>(
    `/part-sale`,
    { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) },
    "Failed to create sale",
  );

export const customerSelfPurchase = (data: CustomerPurchaseRequest): Promise<PartSale> =>
  request<PartSale>(
    `/part-sale/purchase`,
    { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) },
    "Failed to complete purchase",
  );

export const getSaleById = (saleId: string): Promise<PartSale> =>
  request<PartSale>(
    `/part-sale/${saleId}`,
    { method: 'GET', headers: getHeaders() },
    "Failed to load sale",
  );

export const getAllSales = (): Promise<PartSale[]> =>
  request<PartSale[]>(
    `/part-sale`,
    { method: 'GET', headers: getHeaders() },
    "Failed to load sales",
  );

export const getMySales = (): Promise<PartSale[]> =>
  request<PartSale[]>(
    `/part-sale/mine`,
    { method: 'GET', headers: getHeaders() },
    "Failed to load your purchases",
  );

export const getSalesByCustomer = (customerId: string): Promise<PartSale[]> =>
  request<PartSale[]>(
    `/part-sale/customer/${customerId}`,
    { method: 'GET', headers: getHeaders() },
    "Failed to load customer sales",
  );

export const markSaleAsPaid = (saleId: string): Promise<PartSale> =>
  request<PartSale>(
    `/part-sale/${saleId}/mark-paid`,
    { method: 'PATCH', headers: getHeaders() },
    "Failed to mark as paid",
  );

export const sendSaleInvoiceEmail = (saleId: string): Promise<MessageResponse> =>
  request<MessageResponse>(
    `/part-sale/${saleId}/send-invoice`,
    { method: 'POST', headers: getHeaders() },
    "Failed to send invoice email",
  );

// ─── Part Requests ─────────────────────────────────────────────────────────

export const getAllPartRequests = (): Promise<PartRequest[]> =>
  request<PartRequest[]>(
    `/part-request`,
    { method: 'GET', headers: getHeaders() },
    "Failed to load part requests",
  );

export const getPartRequestById = (id: string): Promise<PartRequest> =>
  request<PartRequest>(
    `/part-request/${id}`,
    { method: 'GET', headers: getHeaders() },
    "Failed to load part request",
  );

export const getMyPartRequests = (): Promise<PartRequest[]> =>
  request<PartRequest[]>(
    `/part-request/mine`,
    { method: 'GET', headers: getHeaders() },
    "Failed to load your part requests",
  );

export const createPartRequest = (data: CreatePartRequestSubmissionRequest): Promise<PartRequest> =>
  request<PartRequest>(
    `/part-request`,
    { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) },
    "Failed to submit part request",
  );

export const reviewPartRequest = (id: string, data: ReviewPartRequestRequest): Promise<PartRequest> =>
  request<PartRequest>(
    `/part-request/${id}/review`,
    { method: 'PATCH', headers: getHeaders(), body: JSON.stringify(data) },
    "Failed to review part request",
  );

// ─── Appointments ──────────────────────────────────────────────────────────

export const getAllAppointments = (): Promise<Appointment[]> =>
  request<Appointment[]>(
    `/appointment`,
    { method: 'GET', headers: getHeaders() },
    "Failed to load appointments",
  );

export const getAppointmentById = (id: string): Promise<Appointment> =>
  request<Appointment>(
    `/appointment/${id}`,
    { method: 'GET', headers: getHeaders() },
    "Failed to load appointment",
  );

export const getAppointmentsByCustomer = (customerId: string): Promise<Appointment[]> =>
  request<Appointment[]>(
    `/appointment/customer/${customerId}`,
    { method: 'GET', headers: getHeaders() },
    "Failed to load customer appointments",
  );

export const createAppointment = (data: CreateAppointmentRequest): Promise<Appointment> =>
  request<Appointment>(
    `/appointment`,
    { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) },
    "Failed to book appointment",
  );

export const updateAppointment = (id: string, data: UpdateAppointmentRequest): Promise<Appointment> =>
  request<Appointment>(
    `/appointment/${id}`,
    { method: 'PATCH', headers: getHeaders(), body: JSON.stringify(data) },
    "Failed to update appointment",
  );

export const cancelAppointment = (id: string): Promise<void> =>
  request<void>(
    `/appointment/${id}/cancel`,
    { method: 'DELETE', headers: getHeaders() },
    "Failed to cancel appointment",
  );

export const deleteAppointment = (id: string): Promise<void> =>
  request<void>(
    `/appointment/${id}`,
    { method: 'DELETE', headers: getHeaders() },
    "Failed to delete appointment",
  );

// ─── Reviews ───────────────────────────────────────────────────────────────

export const getAllReviews = (): Promise<Review[]> =>
  request<Review[]>(`/review`, { method: 'GET', headers: getHeaders() }, "Failed to load reviews");

export const getReviewsByPart = (partId: string): Promise<Review[]> =>
  request<Review[]>(
    `/review/part/${partId}`,
    { method: 'GET', headers: getHeaders() },
    "Failed to load reviews",
  );

export const getReviewsByCustomer = (customerId: string): Promise<Review[]> =>
  request<Review[]>(
    `/review/customer/${customerId}`,
    { method: 'GET', headers: getHeaders() },
    "Failed to load reviews",
  );

export const createReview = (data: CreateReviewRequest): Promise<Review> =>
  request<Review>(
    `/review`,
    { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) },
    "Failed to create review",
  );

export const editReview = (id: string, data: EditReviewRequest): Promise<Review> =>
  request<Review>(
    `/review/${id}`,
    { method: 'PATCH', headers: getHeaders(), body: JSON.stringify(data) },
    "Failed to update review",
  );

export const deleteReview = (id: string): Promise<void> =>
  request<void>(`/review/${id}`, { method: 'DELETE', headers: getHeaders() }, "Failed to delete review");

// ─── Reports ───────────────────────────────────────────────────────────────

export const getFinancialReport = (query: FinancialReportQuery = {}): Promise<FinancialReport> =>
  request<FinancialReport>(
    `/report/financial${buildQuery(query as Record<string, unknown>)}`,
    { method: 'GET', headers: getHeaders() },
    "Failed to load financial report",
  );

export const getPurchaseInvoiceReport = (
  query: PurchaseInvoiceReportQuery = {},
): Promise<PurchaseInvoiceReport> =>
  request<PurchaseInvoiceReport>(
    `/report/purchase-invoice${buildQuery(query as Record<string, unknown>)}`,
    { method: 'GET', headers: getHeaders() },
    "Failed to load purchase invoice report",
  );

export const getRegularCustomers = (minPurchases = 2): Promise<RegularCustomer[]> =>
  request<RegularCustomer[]>(
    `/report/customers/regulars${buildQuery({ minPurchases })}`,
    { method: 'GET', headers: getHeaders() },
    "Failed to load regular customers",
  );

export const getHighSpenders = (top = 10): Promise<HighSpender[]> =>
  request<HighSpender[]>(
    `/report/customers/high-spenders${buildQuery({ top })}`,
    { method: 'GET', headers: getHeaders() },
    "Failed to load high spenders",
  );

export const getPendingCredits = (): Promise<PendingCredit[]> =>
  request<PendingCredit[]>(
    `/report/customers/pending-credits`,
    { method: 'GET', headers: getHeaders() },
    "Failed to load pending credits",
  );
