import { Platform } from 'react-native';

const DEFAULT_IOS_LOCAL_API_BASE_URL = 'http://localhost:5000';
const DEFAULT_ANDROID_LOCAL_API_BASE_URL = 'http://10.0.2.2:5000';
const DEFAULT_PRODUCTION_API_BASE_URL = 'https://api.tokotrubus.com';

const configuredApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

function getDefaultLocalApiBaseUrl() {
  if (Platform.OS === 'android') {
    return DEFAULT_ANDROID_LOCAL_API_BASE_URL;
  }

  return DEFAULT_IOS_LOCAL_API_BASE_URL;
}

function normalizeConfiguredApiBaseUrl(baseUrl: string) {
  if (!__DEV__ || Platform.OS !== 'android') {
    return baseUrl;
  }

  return baseUrl
    .replace('://localhost', '://10.0.2.2')
    .replace('://127.0.0.1', '://10.0.2.2');
}

const fallbackApiBaseUrl = __DEV__
  ? getDefaultLocalApiBaseUrl()
  : DEFAULT_PRODUCTION_API_BASE_URL;

export const MOBILE_API_BASE_URL = (
  configuredApiBaseUrl
    ? normalizeConfiguredApiBaseUrl(configuredApiBaseUrl)
    : fallbackApiBaseUrl
).replace(/\/$/, '');
