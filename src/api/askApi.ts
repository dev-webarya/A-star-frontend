import { makeApiCall, type QueryRecord } from './runtimeApiBase.ts';

const FORCE_LOCAL_ASK_API = String(import.meta.env.VITE_USE_LOCAL_ASK_API || '').toLowerCase() === 'true';
const USE_LOCAL_MODE = FORCE_LOCAL_ASK_API;

type AskQuestion = {
    id: string;
    category: any;
    title: string;
    descriptionHtml: string;
    createdAt: string;
    slug: string;
};

const STORAGE_KEY = 'astar_ask_questions';

function readLocalQuestions(): AskQuestion[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as AskQuestion[]) : [];
    } catch {
        return [];
    }
}

function writeLocalQuestions(data: AskQuestion[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export const askApi = {
    async getAll(params?: QueryRecord) {
        if (USE_LOCAL_MODE) {
            return { data: { content: readLocalQuestions() } };
        }

        try {
            // Using /api/questions as per Swagger "Question (Public)" tag
            const data = await makeApiCall<any>('GET', '/api/questions', undefined, params);
            return { data };
        } catch (error) {
            console.error('Failed to fetch questions:', error);
            if (import.meta.env.DEV) return { data: { content: readLocalQuestions() } };
            throw error;
        }
    },

    async getById(id: string) {
        if (USE_LOCAL_MODE) {
            const q = readLocalQuestions().find(q => q.id === id);
            return { data: q };
        }
        try {
            const data = await makeApiCall<any>('GET', `/api/questions/${id}`);
            return { data };
        } catch (error) {
            console.error('Failed to fetch question by ID:', error);
            throw error;
        }
    },

    async getBySlug(slug: string) {
        if (USE_LOCAL_MODE) {
            const q = readLocalQuestions().find(q => q.slug === slug);
            return { data: q };
        }
        try {
            const data = await makeApiCall<any>('GET', `/api/questions/slug/${slug}`);
            return { data };
        } catch (error) {
            console.error('Failed to fetch question by slug:', error);
            throw error;
        }
    },

    async create(payload: { title: string; descriptionHtml: string; categoryId: string }) {
        if (USE_LOCAL_MODE) {
            const existing = readLocalQuestions();
            const next: AskQuestion = {
                ...payload,
                id: `${Date.now()}`,
                createdAt: new Date().toISOString(),
                slug: payload.title.toLowerCase().replace(/ /g, '-'),
                category: { id: payload.categoryId, name: 'Local Category' }
            };
            const updated = [next, ...existing];
            writeLocalQuestions(updated);
            return { data: next };
        }

        const endpoints = [
            '/api/questions/public',
            '/api/questions',
            '/api/admin/questions',
        ];
        for (const ep of endpoints) {
            try {
                const data = await makeApiCall<AskQuestion>('POST', ep, payload);
                return { data };
            } catch (err: any) {
                if (ep === endpoints[endpoints.length - 1]) {
                    throw err;
                }
                console.warn(`POST ${ep} failed, trying next:`, err?.status || err?.message);
            }
        }
        throw new Error('All question creation endpoints failed');
    },

    async update(id: string, payload: { title: string; descriptionHtml: string; categoryId: string }) {
        if (USE_LOCAL_MODE) {
            const existing = readLocalQuestions();
            const updated = existing.map((item) => (item.id === id ? { ...item, ...payload } : item));
            writeLocalQuestions(updated);
            return { data: updated.find((item) => item.id === id) };
        }

        try {
            const data = await makeApiCall<AskQuestion>('PUT', `/api/admin/questions/${id}`, payload);
            return { data };
        } catch (error) {
            console.error('Failed to update question:', error);
            throw error;
        }
    },

    async delete(id: string) {
        if (USE_LOCAL_MODE) {
            const existing = readLocalQuestions();
            const updated = existing.filter(q => q.id !== id);
            writeLocalQuestions(updated);
            return { success: true };
        }
        try {
            await makeApiCall('DELETE', `/api/admin/questions/${id}`);
            return { success: true };
        } catch (error) {
            console.error('Failed to delete question:', error);
            throw error;
        }
    }
};
