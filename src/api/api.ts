import Cookies from "js-cookie";
import type { User } from "../models/models";
import type { ForgotPasswordRequest, LoginRequest, ResetPasswordRequest, SignupRequest } from "../models/requestModels";
import type { LoginResponse, MessageResponse, SignupResponse } from "../models/responseModels";
import { getHeaders } from "./apiUtils";
import { CONFIG } from "../config";

const API_URL = CONFIG.API_URL;

const getApiError = async (response: Response, fallback: string): Promise<string> => {
  const contentType = response.headers.get("Content-Type");

  if (contentType?.includes("application/json")) {
    const error = await response.json();

    if (typeof error === "string") return error;
    if (typeof error?.message === "string") return error.message;
    if (typeof error?.title === "string") return error.title;
  }

  const message = await response.text();
  return message || `${fallback}: ${response.status} ${response.statusText}`;
};

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(await getApiError(response, "Failed to login"));
  }

  const loginResponse = await response.json();
  Cookies.set("accessToken", loginResponse.accessToken);

  return loginResponse;
};

export const signup = async (data: SignupRequest): Promise<SignupResponse> => {
  const response = await fetch(`${API_URL}/auth/signup`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(await getApiError(response, "Failed to signup"));
  }

  return response.json();
};

export const requestForgotPasswordCode = async (data: ForgotPasswordRequest): Promise<MessageResponse> => {
  const searchParams = new URLSearchParams({ email: data.email });

  const response = await fetch(`${API_URL}/auth/forgot-password?${searchParams.toString()}`, {
    method: "POST",
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(await getApiError(response, "Failed to send reset code"));
  }

  return response.json();
};

export const resetPassword = async (data: ResetPasswordRequest): Promise<string> => {
  const response = await fetch(`${API_URL}/auth/reset-password`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(await getApiError(response, "Failed to reset password"));
  }

  const contentType = response.headers.get("Content-Type");
  if (contentType?.includes("application/json")) {
    return response.json();
  }

  return response.text();
};

export const logout = (): void => {
  Cookies.remove("accessToken");
};

export const fetchMe = async (): Promise<User> => {
  const response = await fetch(`${API_URL}/auth/user/me`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(await getApiError(response, "Failed to load user"));
  }

  return response.json();
};
