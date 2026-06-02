import axios from 'axios';

const API_BASE_URL = import.meta.env.DEV ? window.location.origin : 'https://api.astarclasses.com';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for adding auth headers
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('icfy_token');
        const requestUrl = String(config.url || '');
        let requestPath = requestUrl;

        try {
            if (requestUrl.startsWith('http')) {
                requestPath = new URL(requestUrl).pathname;
            }
        } catch {
            requestPath = requestUrl;
        }

        const isPublicReviewRoute =
            (requestPath.startsWith('/api/reviews') && !requestPath.startsWith('/api/reviews/me'));

        // Only attach the token for protected API routes.
        // Public review endpoints and auth calls should not send stale/invalid auth tokens.
        if (
            token &&
            !requestPath.includes('/public/') &&
            !requestPath.includes('/api/auth/') &&
            !requestPath.includes('/auth/') &&
            !isPublicReviewRoute
        ) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for handling errors
api.interceptors.response.use(
    (response) => {
        console.log('API Response Success:', response.status, response.config.url);
        console.log('Response data:', response.data);
        return response;
    },
    (error) => {
        console.error('API Response Error:', error.response?.status, error.config?.url);
        console.error('Error data:', error.response?.data);
        console.error('Error message:', error.message);

        if (error.response?.status === 401) {
            // Clear stale auth tokens only on 401 (Unauthorized — token missing/invalid).
            // NOT on 403 (Forbidden — user exists but lacks permission for that resource).
            localStorage.removeItem('icfy_token');
            localStorage.removeItem('icfy_user');
            localStorage.removeItem('icfy_role');
            localStorage.removeItem('adminAuth');
        }

        // Normalize error object for components to use easily
        const normalizedError = {
            status: error.response?.status,
            message: error.response?.data?.message ||
                error.response?.data?.error ||
                error.response?.data?.errorMessage ||
                error.message ||
                'An unexpected error occurred',
            data: error.response?.data
        };

        return Promise.reject(normalizedError);
    }
);

export default api;
