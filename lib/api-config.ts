const DEFAULT_LOCAL_API_BASE_URL = 'http://localhost:5000';
const DEFAULT_PRODUCTION_API_BASE_URL = 'https://api.tokotrubus.com';

const configuredApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

const fallbackApiBaseUrl = __DEV__
  ? DEFAULT_LOCAL_API_BASE_URL
  : DEFAULT_PRODUCTION_API_BASE_URL;

export const MOBILE_API_BASE_URL = (
  configuredApiBaseUrl || fallbackApiBaseUrl
).replace(/\/$/, '');
