export interface LoginResponse {
    accessToken: string;
    userId: string;
    email: string;
    role: string;
}

export interface SignupResponse {
    message: string;
    userId: string;
}
