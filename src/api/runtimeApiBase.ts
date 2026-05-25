const API_BASE_URL = import.meta.env.DEV
    ? window.location.origin
    : (import.meta.env.VITE_API_BASE_URL || 'https://api.astarclasses.com').replace(/\/$/, '');

export type Primitive = string | number | boolean;
export type QueryValue = Primitive | null | undefined;
export type QueryRecord = Record<string, QueryValue>;

export class ApiError extends Error {
    response?: { data?: unknown; status: number };

    constructor(message: string, status: number, data?: unknown) {
        super(message);
        this.name = 'ApiError';
        this.response = { data, status };
    }
}

export function getBaseUrl() {
    return API_BASE_URL;
}

// Legacy exports for backward compatibility
export function getApiBaseCandidates(): string[] {
    return [API_BASE_URL];
}

export function getPreferredApiBaseUrl(): string {
    return API_BASE_URL;
}

export function setActiveApiBaseUrl(_baseUrl: string): void {
    // no-op: always uses API_BASE_URL
}

export function clearActiveApiBaseUrl(): void {
    // no-op: always uses API_BASE_URL
}

export function getStoredActiveApiBaseUrl(): string {
    return '';
}

export async function makeApiCall<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    endpoint: string,
    data?: unknown,
    query?: QueryRecord
): Promise<T> {
    const url = new URL(endpoint.startsWith('/') ? endpoint : `/${endpoint}`, API_BASE_URL);

    if (query) {
        Object.entries(query).forEach(([key, value]) => {
            if (value != null) {
                url.searchParams.set(key, String(value));
            }
        });
    }

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    const token = localStorage.getItem('icfy_token');
    const isPublicReviewEndpoint =
        endpoint === '/api/reviews' ||
        (endpoint.startsWith('/api/reviews/') && !endpoint.startsWith('/api/reviews/me'));

    if (
        token &&
        !endpoint.includes('/public/') &&
        !endpoint.includes('/api/auth/') &&
        !isPublicReviewEndpoint
    ) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url.toString(), {
        method,
        headers,
        ...(data ? { body: JSON.stringify(data) } : {})
    });

    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch {
            errorData = await response.text().catch(() => null);
        }
        throw new ApiError(
            `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            errorData
        );
    }

    return response.json();
}
