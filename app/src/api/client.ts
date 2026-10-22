import { API_BASE_URL } from '../config';

/** Error thrown for any non-2xx API response; message comes from the server's `{ error }` body when present. */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

let authToken: string | null = null;

/** Called by the auth layer whenever the session token changes. */
export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

/** Turns a server-relative path (e.g. a receiptUrl) into a full URL. */
export function resolveAssetUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  formData?: FormData;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  let body: BodyInit | undefined;
  if (options.formData) {
    // Let fetch set the multipart Content-Type (with boundary) itself.
    body = options.formData;
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body,
    });
  } catch {
    throw new ApiError(0, 'Could not reach the server. Check your connection and try again.');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const serverMessage =
      data !== null && typeof data === 'object' && 'error' in data
        ? String((data as { error: unknown }).error)
        : null;
    throw new ApiError(response.status, serverMessage ?? `Request failed (${response.status}).`);
  }

  return data as T;
}

export const api = {
  get<T>(path: string): Promise<T> {
    return request<T>(path);
  },
  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, { method: 'POST', body });
  },
  patch<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, { method: 'PATCH', body });
  },
  delete(path: string): Promise<void> {
    return request<void>(path, { method: 'DELETE' });
  },
  postForm<T>(path: string, formData: FormData): Promise<T> {
    return request<T>(path, { method: 'POST', formData });
  },
};
