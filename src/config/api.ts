const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1']);

const normalizeApiBaseUrl = (value: string) => value.replace(/\/+$/, '');

const getConfiguredApiBaseUrl = () => {
  const rawValue = import.meta.env.VITE_API_BASE_URL?.trim();
  return rawValue ? normalizeApiBaseUrl(rawValue) : null;
};

const isLocalDevelopmentHost = () => LOCAL_HOSTNAMES.has(window.location.hostname);

export const buildApiUrl = (path: string) => {
  const configuredApiBaseUrl = getConfiguredApiBaseUrl();
  if (configuredApiBaseUrl) {
    return `${configuredApiBaseUrl}${path}`;
  }

  if (isLocalDevelopmentHost()) {
    return path;
  }

  throw new Error(
    'Для цього GitHub-hosting не налаштовано backend API. Запустіть проєкт локально або задайте VITE_API_BASE_URL для окремого сервера.',
  );
};
