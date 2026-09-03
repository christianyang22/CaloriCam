import { API_BASE_URL } from '../config/constants';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'ngrok-skip-browser-warning': 'true',
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (response.status === 401) {
    throw new ApiError('Sesión expirada', 401);
  }

  if (!response.ok) {
    const detail = Array.isArray(data?.detail)
      ? 'Formato de datos incorrecto.'
      : data?.detail || 'Error del servidor.';
    throw new ApiError(detail, response.status);
  }

  return data;
}
