import Cookies from 'js-cookie';

type JwtPayload = {
  exp?: number;
  sub?: string;
  email?: string;
  role?: string;
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?: string;
};

const base64UrlToJson = (value: string): unknown => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const paddedBase64 = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const json = decodeURIComponent(
    atob(paddedBase64)
      .split('')
      .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
      .join(''),
  );

  return JSON.parse(json);
};

const decodeToken = (): JwtPayload | null => {
  const accessToken = Cookies.get('accessToken');
  if (!accessToken) return null;
  try {
    const [, payload] = accessToken.split('.');
    if (!payload) return null;
    return base64UrlToJson(payload) as JwtPayload;
  } catch {
    return null;
  }
};

export const hasValidAccessToken = (): boolean => {
  const payload = decodeToken();
  if (!payload) {
    Cookies.remove('accessToken');
    return false;
  }

  const isExpired = payload.exp ? payload.exp * 1000 <= Date.now() : false;
  if (isExpired) {
    Cookies.remove('accessToken');
    return false;
  }

  return true;
};

export type UserRole = 'Admin' | 'Staff' | 'Customer';

export const getTokenRole = (): UserRole | null => {
  const payload = decodeToken();
  if (!payload) return null;

  const raw =
    payload.role ??
    payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

  if (raw === 'Admin' || raw === 'Staff' || raw === 'Customer') return raw;
  return null;
};
