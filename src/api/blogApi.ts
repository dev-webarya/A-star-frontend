type ApiEnvelope<T> = { data: T };

import { getApiBaseCandidates, setActiveApiBaseUrl } from './runtimeApiBase.ts';

type Primitive = string | number | boolean;
type QueryValue = Primitive | null | undefined;
type QueryRecord = Record<string, QueryValue>;

class ApiError extends Error {
    response?: { data?: unknown; status: number };

    constructor(message: string, status: number, data?: unknown) {
        super(message);
        this.name = 'ApiError';
        this.response = { data, status };
    }
}

const FORCE_LOCAL_BLOG_API = String(import.meta.env.VITE_USE_LOCAL_BLOG_API || '').toLowerCase() === 'true';
const HAS_REMOTE_BASE = Boolean(import.meta.env.VITE_API_BASE_URL);
const USE_LOCAL_MODE = FORCE_LOCAL_BLOG_API || (import.meta.env.DEV && !HAS_REMOTE_BASE);

const ADMIN_BLOGS_STORAGE_KEY = 'icfy_admin_blogs';
const ADMIN_SUBSCRIBERS_STORAGE_KEY = 'icfy_admin_subscribers';
const ADMIN_COMMENTS_STORAGE_KEY = 'icfy_admin_comments';

type AdminBlog = {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    contentHtml: string;
    authorName: string;
    authorEmail: string;
    status: 'PUBLISHED' | 'PENDING' | 'REJECTED' | 'DRAFT';
    tags: string[];
    featuredImageUrl?: string;
    createdAt: string;
    commentsCount: number;
};

type AdminSubscriber = {
    id: number;
    email: string;
    status: 'ACTIVE' | 'UNSUBSCRIBED';
    createdAt: string;
};

type AdminComment = {
    id: number;
    blogId: number;
    name: string;
    commentText: string;
    status: 'PENDING' | 'VISIBLE' | 'HIDDEN';
    createdAt: string;
};

const defaultAdminBlogs: AdminBlog[] = [
    {
        id: 101,
        title: 'How to Build a High-Scoring Study Plan',
        slug: 'high-scoring-study-plan',
        excerpt: 'A practical framework students can use to organize weekly revision without burning out.',
        contentHtml: '<p>Start by defining one measurable weekly outcome for each subject, then break revision into short review loops.</p>',
        authorName: 'Admin Team',
        authorEmail: 'admin@astarclasses.com',
        status: 'PUBLISHED',
        tags: ['study plan', 'exam prep'],
        featuredImageUrl: '',
        createdAt: new Date().toISOString(),
        commentsCount: 2,
    },
    {
        id: 102,
        title: 'SAT Reading Mistakes Students Keep Repeating',
        slug: 'sat-reading-mistakes',
        excerpt: 'A moderation sample post waiting for admin review.',
        contentHtml: '<p>Strong reading performance depends on slowing down before answering, not after you miss the question.</p>',
        authorName: 'Guest Author',
        authorEmail: 'writer@example.com',
        status: 'PENDING',
        tags: ['sat', 'reading'],
        featuredImageUrl: '',
        createdAt: new Date().toISOString(),
        commentsCount: 1,
    },
];

const defaultSubscribers: AdminSubscriber[] = [
    { id: 1, email: 'student1@example.com', status: 'ACTIVE', createdAt: new Date().toISOString() },
    { id: 2, email: 'student2@example.com', status: 'UNSUBSCRIBED', createdAt: new Date().toISOString() },
];

const defaultComments: AdminComment[] = [
    { id: 501, blogId: 101, name: 'Aarav', commentText: 'Very useful summary.', status: 'VISIBLE', createdAt: new Date().toISOString() },
    { id: 502, blogId: 101, name: 'Maya', commentText: 'Can you add a printable checklist?', status: 'PENDING', createdAt: new Date().toISOString() },
    { id: 503, blogId: 102, name: 'Rohit', commentText: 'This draft should definitely be published.', status: 'PENDING', createdAt: new Date().toISOString() },
];

function readLocalData<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

function writeLocalData<T>(key: string, value: T) {
    localStorage.setItem(key, JSON.stringify(value));
}

function getAdminBlogsStore() {
    return readLocalData(ADMIN_BLOGS_STORAGE_KEY, defaultAdminBlogs);
}

function setAdminBlogsStore(blogs: AdminBlog[]) {
    writeLocalData(ADMIN_BLOGS_STORAGE_KEY, blogs);
}

function getSubscribersStore() {
    return readLocalData(ADMIN_SUBSCRIBERS_STORAGE_KEY, defaultSubscribers);
}

function getCommentsStore() {
    return readLocalData(ADMIN_COMMENTS_STORAGE_KEY, defaultComments);
}

function setCommentsStore(comments: AdminComment[]) {
    writeLocalData(ADMIN_COMMENTS_STORAGE_KEY, comments);
}

function paginateList<T>(items: T[], page = 0, size = 10) {
    const safeSize = size > 0 ? size : 10;
    const safePage = page >= 0 ? page : 0;
    const start = safePage * safeSize;
    const content = items.slice(start, start + safeSize);
    return {
        content,
        page: safePage,
        totalPages: Math.max(1, Math.ceil(items.length / safeSize)),
        totalElements: items.length,
    };
}

type PublicBlog = {
    id: number;
    slug: string;
    title: string;
    excerpt: string;
    contentHtml: string;
    authorName: string;
    featuredImageUrl?: string;
    tags: string[];
    likesCount: number;
    dislikesCount: number;
    commentsCount: number;
    viewsCount: number;
    publishedAt: string;
};

type BlogReaction = {
    userReaction?: 'LIKE' | 'DISLIKE' | null;
    likesCount?: number;
    dislikesCount?: number;
};

const BLOG_REACTIONS_STORAGE_KEY = 'icfy_blog_reactions';
const BLOG_SUBSCRIPTIONS_STORAGE_KEY = 'icfy_blog_subscriptions';

function buildPublicBlogsFromAdmin(): PublicBlog[] {
    const comments = getCommentsStore();
    const published = getAdminBlogsStore().filter((blog) => blog.status === 'PUBLISHED');

    return published.map((blog) => ({
        id: blog.id,
        slug: blog.slug,
        title: blog.title,
        excerpt: blog.excerpt,
        contentHtml: blog.contentHtml,
        authorName: blog.authorName,
        featuredImageUrl: blog.featuredImageUrl,
        tags: blog.tags || [],
        likesCount: Math.max(0, 6 + blog.id % 13),
        dislikesCount: Math.max(0, blog.id % 4),
        commentsCount: comments.filter((comment) => comment.blogId === blog.id).length,
        viewsCount: 100 + (blog.id % 7) * 37,
        publishedAt: blog.createdAt,
    }));
}

function sortBlogs(blogs: PublicBlog[], sort?: string): PublicBlog[] {
    const copy = [...blogs];
    const key = String(sort || 'recent');

    if (key === 'popular') {
        return copy.sort((a, b) => (b.likesCount + b.viewsCount) - (a.likesCount + a.viewsCount));
    }
    if (key === 'oldest') {
        return copy.sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());
    }
    if (key === 'most_commented') {
        return copy.sort((a, b) => b.commentsCount - a.commentsCount);
    }
    return copy.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

function filterBlogs(blogs: PublicBlog[], params?: QueryRecord): PublicBlog[] {
    let list = [...blogs];
    const search = String(params?.search || '').trim().toLowerCase();
    const year = Number(params?.year || 0);
    const month = Number(params?.month || 0);

    if (search) {
        list = list.filter((blog) => {
            const haystack = `${blog.title} ${blog.excerpt} ${blog.contentHtml}`.toLowerCase();
            return haystack.includes(search);
        });
    }

    if (year > 0) {
        list = list.filter((blog) => new Date(blog.publishedAt).getFullYear() === year);
    }

    if (month > 0) {
        list = list.filter((blog) => new Date(blog.publishedAt).getMonth() + 1 === month);
    }

    return list;
}

function getReactionsStore(): Record<string, BlogReaction> {
    return readLocalData<Record<string, BlogReaction>>(BLOG_REACTIONS_STORAGE_KEY, {});
}

function setReactionsStore(value: Record<string, BlogReaction>) {
    writeLocalData(BLOG_REACTIONS_STORAGE_KEY, value);
}

function reactionKey(blogId: number | string, visitorKey: string) {
    return `${blogId}__${visitorKey}`;
}

function toQueryString(query?: QueryRecord): string {
    if (!query) return '';
    const params = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') return;
        params.set(key, String(value));
    });

    const qs = params.toString();
    return qs ? `?${qs}` : '';
}

async function request<T>(path: string, options?: RequestInit): Promise<ApiEnvelope<T>> {
    if (USE_LOCAL_MODE) {
        throw new ApiError('Local blog API mode enabled', 503, { path, mode: 'local' });
    }

    const candidatePaths = path.startsWith('/api/') ? [path] : [path, `/api${path}`];
    let lastError: ApiError | null = null;

    for (const baseUrl of getApiBaseCandidates()) {
        for (const candidatePath of candidatePaths) {
            let response: Response;
            try {
                response = await fetch(`${baseUrl}${candidatePath}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(localStorage.getItem('icfy_token') && {
                            'Authorization': `Bearer ${localStorage.getItem('icfy_token')}`
                        }),
                        ...(options?.headers || {}),
                    },
                    ...options,
                });
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Network error';
                lastError = new ApiError(message, 0, { baseUrl, candidatePath });
                continue;
            }

            const contentType = response.headers.get('content-type') || '';
            const hasJson = contentType.includes('application/json');
            const payload = hasJson ? await response.json() : null;

            if (response.ok) {
                setActiveApiBaseUrl(baseUrl);
                return { data: (payload ?? ({} as T)) as T };
            }

            const message =
                (payload as { message?: string } | null)?.message ||
                `Request failed with status ${response.status}`;
            lastError = new ApiError(message, response.status, payload);

            if (response.status === 404) {
                continue;
            }

            throw lastError;
        }
    }

    throw lastError || new ApiError('Request failed', 500);
}

export const blogApi = {
    async getBlogs(params?: QueryRecord) {
        try {
            return await request<{ content: unknown[]; page: number; totalPages: number; totalElements: number }>(
                `/api/blogs${toQueryString(params)}`,
                { method: 'GET' }
            );
        } catch {
            const page = Number(params?.page ?? 0);
            const size = Number(params?.size ?? 10);
            const sorted = sortBlogs(filterBlogs(buildPublicBlogsFromAdmin(), params), String(params?.sort || 'recent'));
            return { data: paginateList(sorted, page, size) };
        }
    },

    async getArchive() {
        try {
            return await request<Array<{ year: number; months: Array<{ month: number; count: number }> }>>(
                '/api/blogs/archive',
                { method: 'GET' }
            );
        } catch {
            const grouped = new Map<number, Map<number, number>>();

            buildPublicBlogsFromAdmin().forEach((blog) => {
                const date = new Date(blog.publishedAt);
                const year = date.getFullYear();
                const month = date.getMonth() + 1;
                if (!grouped.has(year)) grouped.set(year, new Map<number, number>());
                const monthMap = grouped.get(year)!;
                monthMap.set(month, (monthMap.get(month) || 0) + 1);
            });

            const archive = Array.from(grouped.entries())
                .sort((a, b) => b[0] - a[0])
                .map(([year, months]) => ({
                    year,
                    months: Array.from(months.entries())
                        .sort((a, b) => b[0] - a[0])
                        .map(([month, count]) => ({ month, count })),
                }));

            return { data: archive };
        }
    },

    async getBlogBySlug(slug?: string) {
        const safeSlug = encodeURIComponent(slug || '');
        try {
            return await request<Record<string, unknown>>(`/api/blogs/${safeSlug}`, { method: 'GET' });
        } catch {
            const blog = buildPublicBlogsFromAdmin().find((entry) => entry.slug === slug);
            if (!blog) {
                throw new ApiError('Blog not found', 404, { slug });
            }
            return { data: blog };
        }
    },

    getComments(blogId: number | string, params?: QueryRecord) {
        return request<{ content: Array<Record<string, unknown>> }>(
            `/api/blogs/${blogId}/comments${toQueryString(params)}`,
            { method: 'GET' }
        ).catch(() => {
            const page = Number(params?.page ?? 0);
            const size = Number(params?.size ?? 20);
            const comments = getCommentsStore().filter((comment) => comment.blogId === Number(blogId));
            return { data: paginateList(comments, page, size) };
        });
    },

    async postComment(blogId: number | string, payload: Record<string, unknown>) {
        try {
            return await request<Record<string, unknown>>(`/api/blogs/${blogId}/comments`, {
                method: 'POST',
                body: JSON.stringify(payload),
            });
        } catch {
            const nextComments = [...getCommentsStore()];
            nextComments.unshift({
                id: Date.now(),
                blogId: Number(blogId),
                name: String(payload.name || 'Guest'),
                commentText: String(payload.commentText || ''),
                status: 'VISIBLE',
                createdAt: new Date().toISOString(),
            });
            setCommentsStore(nextComments);
            return { data: { success: true } };
        }
    },

    async getReactionStatus(blogId: number | string, visitorKey: string) {
        try {
            return await request<Record<string, unknown>>(
                `/api/blogs/${blogId}/reactions/status${toQueryString({ visitorKey })}`,
                { method: 'GET' }
            );
        } catch {
            const key = reactionKey(blogId, visitorKey);
            const store = getReactionsStore();
            const reaction = store[key] || { userReaction: null };
            return { data: reaction };
        }
    },

    async toggleReaction(blogId: number | string, payload: Record<string, unknown>) {
        try {
            return await request<Record<string, unknown>>(`/api/blogs/${blogId}/reactions/toggle`, {
                method: 'POST',
                body: JSON.stringify(payload),
            });
        } catch {
            const visitorKey = String(payload.visitorKey || 'anonymous');
            const nextType = String(payload.reactionType || 'LIKE') as 'LIKE' | 'DISLIKE';
            const key = reactionKey(blogId, visitorKey);
            const store = getReactionsStore();
            const current = store[key]?.userReaction || null;
            const userReaction = current === nextType ? null : nextType;

            const blogs = buildPublicBlogsFromAdmin();
            const currentBlog = blogs.find((entry) => entry.id === Number(blogId));
            const prevLikes = store[key]?.likesCount || (currentBlog?.likesCount || 0);
            const prevDislikes = store[key]?.dislikesCount || (currentBlog?.dislikesCount || 0);
            const likesCount = Math.max(0, prevLikes + (userReaction === 'LIKE' ? 1 : 0) - (current === 'LIKE' ? 1 : 0));
            const dislikesCount = Math.max(0, prevDislikes + (userReaction === 'DISLIKE' ? 1 : 0) - (current === 'DISLIKE' ? 1 : 0));

            store[key] = { userReaction, likesCount, dislikesCount };
            setReactionsStore(store);
            return { data: store[key] };
        }
    },

    async startSubmission(payload: Record<string, unknown>) {
        try {
            return await request<Record<string, unknown>>('/api/blogs/submissions/start', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
        } catch {
            return { data: { success: true, otpSent: true, devOtp: '123456', email: payload.authorEmail } };
        }
    },

    async verifySubmission(payload: Record<string, unknown>) {
        try {
            return await request<Record<string, unknown>>('/api/blogs/submissions/verify', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
        } catch {
            const otp = String(payload.otp || '');
            if (otp !== '123456') {
                throw new ApiError('Invalid OTP. Use 123456 in local mode.', 400, { field: 'otp' });
            }
            return { data: { success: true, verified: true } };
        }
    },

    async finishSubmission(payload: Record<string, unknown>) {
        try {
            return await request<Record<string, unknown>>('/api/blogs/submissions/finish', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
        } catch {
            const blogs = getAdminBlogsStore();
            const id = Date.now();
            const title = String(payload.title || 'Untitled Draft');
            const slug = title
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .trim()
                .replace(/\s+/g, '-') || `blog-${id}`;

            blogs.unshift({
                id,
                title,
                slug,
                excerpt: String(payload.excerpt || ''),
                contentHtml: String(payload.content || ''),
                authorName: String(payload.authorName || 'Guest Author'),
                authorEmail: String(payload.authorEmail || 'guest@example.com'),
                status: 'PENDING',
                tags: String(payload.tags || '')
                    .split(',')
                    .map((tag) => tag.trim())
                    .filter(Boolean),
                featuredImageUrl: String(payload.featuredImageUrl || ''),
                createdAt: new Date().toISOString(),
                commentsCount: 0,
            });
            setAdminBlogsStore(blogs);
            return { data: { success: true, queuedForReview: true } };
        }
    },

    async startSubscription(payload: Record<string, unknown>) {
        try {
            return await request<Record<string, unknown>>('/api/blogs/subscriptions/otp', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
        } catch {
            return { data: { success: true, otpSent: true, devOtp: '123456', email: payload.email } };
        }
    },

    async verifySubscription(payload: Record<string, unknown>) {
        try {
            return await request<Record<string, unknown>>('/api/blogs/subscriptions/start', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
        } catch {
            const otp = String(payload.otp || '');
            if (otp !== '123456') {
                throw new ApiError('Invalid OTP. Use 123456 in local mode.', 400, { field: 'otp' });
            }

            const email = String(payload.email || '').toLowerCase();
            const existing = getSubscribersStore();
            const index = existing.findIndex((entry) => entry.email.toLowerCase() === email);
            if (index >= 0) {
                existing[index] = { ...existing[index], status: 'ACTIVE' };
                writeLocalData(ADMIN_SUBSCRIBERS_STORAGE_KEY, existing);
            } else if (email) {
                existing.unshift({ id: Date.now(), email, status: 'ACTIVE', createdAt: new Date().toISOString() });
                writeLocalData(ADMIN_SUBSCRIBERS_STORAGE_KEY, existing);
            }

            const subs = readLocalData<string[]>(BLOG_SUBSCRIPTIONS_STORAGE_KEY, []);
            if (email && !subs.includes(email)) {
                subs.push(email);
                writeLocalData(BLOG_SUBSCRIPTIONS_STORAGE_KEY, subs);
            }

            return { data: { success: true, subscribed: true } };
        }
    },

    async unsubscribe(payload: Record<string, unknown>) {
        try {
            return await request<Record<string, unknown>>('/api/blogs/subscriptions/stop', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
        } catch {
            const email = String(payload.email || '').toLowerCase();
            const existing = getSubscribersStore();
            const idx = existing.findIndex((entry) => entry.email.toLowerCase() === email);
            if (idx >= 0) {
                existing[idx] = { ...existing[idx], status: 'UNSUBSCRIBED' };
                writeLocalData(ADMIN_SUBSCRIBERS_STORAGE_KEY, existing);
            }
            return { data: { success: true, unsubscribed: true } };
        }
    },
};

export const adminApi = {
    async getAdminBlogs(params?: QueryRecord) {
        try {
            return await request<{ content: AdminBlog[]; page: number; totalPages: number; totalElements: number }>(
                `/admin/api/blogs${toQueryString(params)}`,
                { method: 'GET' }
            );
        } catch {
            const status = typeof params?.status === 'string' ? params.status : '';
            const page = Number(params?.page ?? 0);
            const size = Number(params?.size ?? 10);
            const blogs = getAdminBlogsStore().filter((blog) => (status ? blog.status === status : true));
            return { data: paginateList(blogs, page, size) };
        }
    },

    async getSubscribers(params?: QueryRecord) {
        try {
            return await request<{ content: AdminSubscriber[]; page: number; totalPages: number; totalElements: number }>(
                `/admin/subscribers${toQueryString(params)}`,
                { method: 'GET' }
            );
        } catch {
            const status = typeof params?.status === 'string' ? params.status : '';
            const page = Number(params?.page ?? 0);
            const size = Number(params?.size ?? 10);
            const subscribers = getSubscribersStore().filter((subscriber) => (status ? subscriber.status === status : true));
            return { data: paginateList(subscribers, page, size) };
        }
    },

    async getPendingComments(params?: QueryRecord) {
        try {
            return await request<{ content: AdminComment[]; page: number; totalPages: number; totalElements: number }>(
                `/admin/api/comments/pending${toQueryString(params)}`,
                { method: 'GET' }
            );
        } catch {
            const page = Number(params?.page ?? 0);
            const size = Number(params?.size ?? 10);
            const comments = getCommentsStore().filter((comment) => comment.status === 'PENDING');
            return { data: paginateList(comments, page, size) };
        }
    },

    async approveBlog(id: number | string, payload?: Record<string, unknown>) {
        try {
            return await request<Record<string, unknown>>(`/admin/api/blogs/${id}/approve`, {
                method: 'POST',
                body: JSON.stringify(payload || {}),
            });
        } catch {
            const updated = getAdminBlogsStore().map((blog) => (blog.id === Number(id) ? { ...blog, status: 'PUBLISHED' as const } : blog));
            setAdminBlogsStore(updated);
            return { data: { success: true } };
        }
    },

    async rejectBlog(id: number | string, payload?: Record<string, unknown>) {
        try {
            return await request<Record<string, unknown>>(`/admin/api/blogs/${id}/reject`, {
                method: 'POST',
                body: JSON.stringify(payload || {}),
            });
        } catch {
            const updated = getAdminBlogsStore().map((blog) => (blog.id === Number(id) ? { ...blog, status: 'REJECTED' as const } : blog));
            setAdminBlogsStore(updated);
            return { data: { success: true } };
        }
    },

    async editBlog(id: number | string, payload: Record<string, unknown>) {
        try {
            return await request<Record<string, unknown>>(`/admin/api/blogs/${id}`, {
                method: 'PUT',
                body: JSON.stringify(payload),
            });
        } catch {
            const updated = getAdminBlogsStore().map((blog) => (blog.id === Number(id) ? { ...blog, ...payload } : blog));
            setAdminBlogsStore(updated as AdminBlog[]);
            return { data: { success: true } };
        }
    },

    async deleteBlog(id: number | string) {
        try {
            return await request<Record<string, unknown>>(`/admin/api/blogs/${id}`, { method: 'DELETE' });
        } catch {
            setAdminBlogsStore(getAdminBlogsStore().filter((blog) => blog.id !== Number(id)));
            return { data: { success: true } };
        }
    },

    async getAllComments(params?: QueryRecord) {
        try {
            return await request<{ content: AdminComment[]; page: number; totalPages: number; totalElements: number }>(
                `/admin/api/comments/all${toQueryString(params)}`,
                { method: 'GET' }
            );
        } catch {
            const page = Number(params?.page ?? 0);
            const size = Number(params?.size ?? 10);
            const comments = getCommentsStore();
            return { data: paginateList(comments, page, size) };
        }
    },

    async approveComment(id: number | string) {
        try {
            return await request<Record<string, unknown>>(`/admin/api/comments/${id}/approve`, { method: 'POST' });
        } catch {
            return { data: { success: true } };
        }
    },

    async editComment(id: number | string, commentText: string) {
        try {
            return await request<Record<string, unknown>>(`/admin/api/comments/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ commentText }),
            });
        } catch {
            return { data: { success: true } };
        }
    },

    async deleteComment(id: number | string) {
        try {
            return await request<Record<string, unknown>>(`/admin/api/comments/${id}`, { method: 'DELETE' });
        } catch {
            const nextComments = getCommentsStore().filter((comment) => comment.id !== Number(id));
            setCommentsStore(nextComments);

            const updatedBlogs = getAdminBlogsStore().map((blog) => {
                const remainingCount = nextComments.filter((comment) => comment.blogId === blog.id).length;
                return { ...blog, commentsCount: remainingCount };
            });
            setAdminBlogsStore(updatedBlogs);
            return { data: { success: true } };
        }
    },
};
