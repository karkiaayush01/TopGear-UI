import type { Customer, Part } from './models';

export interface LoginResponse {
    accessToken: string;
    userId: string;
    email: string;
    role: string;
}

export interface MessageResponse {
    message: string;
}

export interface SignupResponse {
    message: string;
    userId: string;
}

export interface PagedPartsResponse {
    items: Part[];
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
}

export interface PagedCustomersResponse {
    items: Customer[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface RegisterUserResponse {
    message: string;
    userId: string;
}
