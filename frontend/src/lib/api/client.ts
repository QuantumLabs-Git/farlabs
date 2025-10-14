const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? (typeof window === 'undefined' ? 'http://127.0.0.1:8000' : '');

const DEFAULT_DEMO_TOKEN = process.env.NEXT_PUBLIC_DEMO_JWT ?? 'demo-user-token';

function resolveAuthHeader(providedHeaders?: HeadersInit): Record<string, string> {
  if (providedHeaders && typeof providedHeaders === 'object' && 'Authorization' in providedHeaders) {
    return {};
  }

  if (typeof window !== 'undefined') {
    const stored = window.localStorage?.getItem('farlabs.jwt');
    if (stored) {
      return { Authorization: `Bearer ${stored}` };
    }
  }

  return DEFAULT_DEMO_TOKEN ? { Authorization: `Bearer ${DEFAULT_DEMO_TOKEN}` } : {};
}

class ApiClient {
  async request<TResponse>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: TResponse; status: number }> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...resolveAuthHeader(options.headers),
        ...(options.headers ?? {})
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Request failed with status ${response.status}`);
    }

    const data = (await response.json()) as TResponse;
    return {
      data,
      status: response.status
    };
  }

  get<TResponse>(endpoint: string, options: RequestInit = {}) {
    return this.request<TResponse>(endpoint, { method: 'GET', ...options });
  }

  post<TResponse, TBody = unknown>(endpoint: string, body: TBody, options: RequestInit = {}) {
    return this.request<TResponse>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      ...options
    });
  }
}

export const apiClient = new ApiClient();
