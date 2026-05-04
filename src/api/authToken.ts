import Cookies from 'js-cookie';

type JwtPayload = {
  exp?: number;
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

export const hasValidAccessToken = (): boolean => {
  const accessToken = Cookies.get('accessToken');
  if (!accessToken) return false;

  try {
    const [, payload] = accessToken.split('.');
    if (!payload) return false;

    const decodedPayload = base64UrlToJson(payload) as JwtPayload;
    const isExpired = decodedPayload.exp ? decodedPayload.exp * 1000 <= Date.now() : false;

    if (isExpired) {
      Cookies.remove('accessToken');
      return false;
    }

    return true;
  } catch {
    Cookies.remove('accessToken');
    return false;
  }
};
