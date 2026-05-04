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
