import { useState, useEffect } from 'react';
import { blogApi, adminApi, getIsLocalMode } from '../../api/blogApi';
import { CheckCircle, XCircle, Edit3, Eye, X, ArrowLeft, Save, AlertTriangle, Trash2, MessageSquare } from 'lucide-react';
import React from 'react';

const Card = ({ className = '', children, onClick }) => (
    <div className={`bg-white rounded-xl shadow border border-gray-200 ${className}`} onClick={onClick}>{children}</div>
);
const Badge = ({ variant = 'info', children }) => {
    const colors = { success: 'bg-green-100 text-green-800', warning: 'bg-yellow-100 text-yellow-800', danger: 'bg-red-100 text-red-800', info: 'bg-blue-100 text-blue-800', error: 'bg-red-100 text-red-800' };
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[variant] || 'bg-gray-100 text-gray-700'}`}>{children}</span>;
};
const Spinner = ({ size = 'md' }) => (
    <svg className={`animate-spin ${size === 'lg' ? 'w-10 h-10' : 'w-5 h-5'} text-blue-700 inline`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
);
const TextArea = ({ label, placeholder, value, onChange, rows = 4 }) => (
    <div>
        {label && <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
        <textarea className="w-full border border-gray-300 rounded-xl p-3 text-sm text-gray-800 outline-none focus:border-blue-500 transition-colors resize-none" placeholder={placeholder} value={value} onChange={onChange} rows={rows} />
    </div>
);
const Input = ({ value, onChange, placeholder }) => (
    <input type="text" className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-500 transition-colors" value={value} onChange={onChange} placeholder={placeholder} />
);
const Pagination = ({ page, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    return (
        <div className="mt-6 flex items-center justify-between">
            <button onClick={() => onPageChange(page - 1)} disabled={page === 0} className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50">Previous</button>
            <span className="text-sm text-gray-600">Page {page + 1} of {totalPages}</span>
            <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages - 1} className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50">Next</button>
        </div>
    );
};
const TagBadge = ({ tag }) => (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{tag}</span>
);
const ContentEditor = ({ initialContent, onChange }) => {
    const [val, setVal] = React.useState(initialContent || '');
    return (
        <textarea className="w-full border border-gray-300 rounded-xl p-3 text-sm text-gray-800 outline-none focus:border-blue-500 transition-colors resize-y min-h-[300px]"
            value={val} onChange={(e) => { setVal(e.target.value); onChange(e.target.value); }}
            placeholder="Write blog content here (HTML supported)..." />
    );
};
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const BlogModerationPage = ({ onBack }) => {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [pagination, setPagination] = useState({ page: 0, totalPages: 0, totalElements: 0 });
    const [pageSize, setPageSize] = useState(10);
    const [viewBlog, setViewBlog] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [rejectModal, setRejectModal] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [deleteConfirmBlog, setDeleteConfirmBlog] = useState(null);
    const [comments, setComments] = useState([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [commentsModal, setCommentsModal] = useState(null); // blog object for standalone comments modal

    const fetchBlogs = async (params = {}) => {
        setLoading(true);
        try {
            const currentSize = params.size !== undefined ? params.size : pageSize;
            const r = await adminApi.getAdminBlogs({ status: params.status !== undefined ? params.status : statusFilter, page: params.page || 0, size: currentSize });
            setBlogs(r.data.content);
            setPagination({ page: r.data.page, totalPages: r.data.totalPages, totalElements: r.data.totalElements });
        } catch (err) { toast.error('Failed to load blogs'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchBlogs(); }, []);

    const handleStatusFilter = (s) => { setStatusFilter(s); fetchBlogs({ status: s, page: 0 }); };

    const handleDeleteBlog = async (id) => {
        setActionLoading(true);
        try {
            await adminApi.deleteBlog(id);
            toast.success('Blog deleted');
            setDeleteConfirmBlog(null);
            setViewBlog(null);
            fetchBlogs();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
        finally { setActionLoading(false); }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            await adminApi.deleteComment(commentId);
            setComments(prev => prev.filter(c => c.id !== commentId));
            toast.success('Comment deleted');
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete comment'); }
    };
    const fetchComments = async (blogId) => {
        setCommentsLoading(true);
        try {
            const r = await blogApi.getComments(blogId, { page: 0, size: 50 });
            setComments(r.data?.content || []);
        } catch (err) { setComments([]); }
        finally { setCommentsLoading(false); }
    };
    const handleApprove = async (id) => {
        setActionLoading(true);
        try { await adminApi.approveBlog(id, { adminId: 'admin' }); toast.success('Blog approved successfully!'); fetchBlogs(); setViewBlog(null); setIsEditing(false); }
        catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
        finally { setActionLoading(false); }
    };
    const handleReject = async () => {
        if (!rejectReason.trim()) { toast.error('Reason required'); return; }
        setActionLoading(true);
        try { await adminApi.rejectBlog(rejectModal.id, { reason: rejectReason }); toast.success('Blog rejected'); setRejectModal(null); setRejectReason(''); fetchBlogs(); setViewBlog(null); setIsEditing(false); }
        catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
        finally { setActionLoading(false); }
    };
    const handleSaveEdit = async () => {
        setActionLoading(true);
        try {
            await adminApi.editBlog(viewBlog.id, {
                title: editForm.title, excerpt: editForm.excerpt, contentHtml: editForm.contentHtml,
                tags: typeof editForm.tags === 'string' ? editForm.tags.split(',').map(t => t.trim()) : editForm.tags,
                featuredImageUrl: editForm.featuredImageUrl,
            });
            toast.success('Changes saved!');
            setViewBlog(prev => ({ ...prev, ...editForm, tags: typeof editForm.tags === 'string' ? editForm.tags.split(',').map(t => t.trim()) : editForm.tags }));
            setIsEditing(false);
            fetchBlogs();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
        finally { setActionLoading(false); }
    };
    const openCommentsModal = (blog, e) => {
        e.stopPropagation();
        setCommentsModal(blog);
        setComments([]);
        fetchComments(blog.id);
    };

    const openView = (blog) => {
        setViewBlog(blog);
        setIsEditing(false);
        setComments([]);
        fetchComments(blog.id);
        setEditForm({
            title: blog.title, excerpt: blog.excerpt,
            contentHtml: blog.contentHtml || blog.content || '',
            tags: blog.tags?.join(', ') || '',
            featuredImageUrl: blog.featuredImageUrl || ''
        });
    };
    const toggleEdit = () => {
        if (!isEditing) {
            setEditForm({
                title: viewBlog.title, excerpt: viewBlog.excerpt,
                contentHtml: viewBlog.contentHtml || viewBlog.content || '',
                tags: viewBlog.tags?.join(', ') || '',
                featuredImageUrl: viewBlog.featuredImageUrl || ''
            });
        }
        setIsEditing(!isEditing);
    };
    const statusBadge = (status) => {
        const map = { PUBLISHED: 'success', PENDING: 'warning', REJECTED: 'danger', DRAFT: 'info' };
        return <Badge variant={map[status] || 'info'}>{status}</Badge>;
    };
    // Full-page blog view/edit
    if (viewBlog) {
        return (
            <div className="min-h-screen bg-bg-primary">
                {/* Sticky top bar */}
                <div className="sticky top-0 z-20 bg-bg-card/90 backdrop-blur-lg border-b border-border-primary shadow-sm">
                    <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
                        <button onClick={() => { setViewBlog(null); setIsEditing(false); }}
                            className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors">
                            <ArrowLeft className="w-4 h-4" /> Back to list
                        </button>
                        <div className="flex items-center gap-2">
                            {statusBadge(viewBlog.status)}
                            <div className="flex items-center bg-bg-tertiary rounded-lg p-0.5 ml-2">
                                <button onClick={() => setIsEditing(false)}
                                    className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${!isEditing ? 'bg-bg-card text-text-primary shadow-sm' : 'text-text-tertiary hover:text-text-secondary'}`}>
                                    <Eye className="w-3.5 h-3.5" /> View
                                </button>
                                <button onClick={toggleEdit}
                                    className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${isEditing ? 'bg-bg-card text-text-primary shadow-sm' : 'text-text-tertiary hover:text-text-secondary'}`}>
                                    <Edit3 className="w-3.5 h-3.5" /> Edit
                                </button>
                            </div>
                            {isEditing && (
                                <button onClick={handleSaveEdit} disabled={actionLoading}
                                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-text-primary text-bg-primary hover:opacity-90 transition-all disabled:opacity-50">
                                    <Save className="w-3.5 h-3.5" /> {actionLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                            )}
                            <button onClick={() => setDeleteConfirmBlog(viewBlog)} disabled={actionLoading}
                                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600 transition-all disabled:opacity-50">
                                <Trash2 className="w-3.5 h-3.5" /> Delete Blog
                            </button>
                        </div>
                    </div>
                </div>
                <div className="max-w-3xl mx-auto px-6 py-10">
                    {isEditing ? (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1.5">Featured Image</label>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <Input value={editForm.featuredImageUrl} onChange={(e) => setEditForm({ ...editForm, featuredImageUrl: e.target.value })} placeholder="https://images.unsplash.com/..." />
                                    </div>
                                    <label className="shrink-0 cursor-pointer">
                                        <div className="px-4 py-2 bg-blue-900 text-white text-xs font-bold rounded-lg hover:bg-blue-800 transition shadow-sm">
                                            Upload File
                                        </div>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        setEditForm({ ...editForm, featuredImageUrl: reader.result });
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
                                {editForm.featuredImageUrl && (
                                    <div className="relative mt-3">
                                        <img src={editForm.featuredImageUrl} alt="Preview" className="w-full h-48 object-cover rounded-xl border border-border-secondary" />
                                        <button 
                                            onClick={() => setEditForm({ ...editForm, featuredImageUrl: '' })}
                                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full shadow-lg"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1.5">Title</label>
                                <input type="text" value={editForm.title}
                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                    className="w-full text-3xl font-bold text-text-primary bg-transparent border-b-2 border-border-primary focus:border-text-primary outline-none pb-2 transition-colors"
                                    placeholder="Blog title..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1.5">Excerpt</label>
                                <textarea value={editForm.excerpt}
                                    onChange={(e) => setEditForm({ ...editForm, excerpt: e.target.value })}
                                    className="w-full text-lg text-text-secondary bg-transparent border border-border-primary rounded-lg p-3 outline-none focus:border-text-tertiary transition-colors resize-none"
                                    rows={2} placeholder="Brief summary..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1.5">Tags (comma separated)</label>
                                <Input value={editForm.tags} onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })} placeholder="react, tutorial, web-dev" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1.5">Content</label>
                                <ContentEditor
                                    initialContent={editForm.contentHtml}
                                    onChange={(html) => setEditForm(prev => ({ ...prev, contentHtml: html }))}
                                />
                            </div>
                        </div>
                    ) : (
                        <>
                            {viewBlog.featuredImageUrl && (
                                <img src={viewBlog.featuredImageUrl} alt={viewBlog.title}
                                    className="w-full h-64 md:h-80 object-cover rounded-xl mb-8 border border-border-secondary" />
                            )}
                            <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-4 leading-tight">{viewBlog.title}</h1>
                            <p className="text-text-secondary text-lg mb-6 leading-relaxed italic">{viewBlog.excerpt}</p>
                            <div className="flex flex-wrap items-center gap-4 text-text-tertiary text-sm mb-6 pb-6 border-b border-border-secondary">
                                <span className="flex items-center gap-1.5">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                    <strong className="text-text-secondary">{viewBlog.authorName}</strong>
                                </span>
                                <span>{viewBlog.authorEmail}</span>
                                {viewBlog.createdAt && !isNaN(new Date(viewBlog.createdAt)) && (
                                    <span className="flex items-center gap-1.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                        {format(new Date(viewBlog.createdAt), 'MMMM dd, yyyy')}
                                    </span>
                                )}
                            </div>
                            {viewBlog.tags?.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-8">
                                    {viewBlog.tags.map(tag => <TagBadge key={tag} tag={tag} />)}
                                </div>
                            )}
                            <div className="blog-content mb-10"
                                ref={(el) => {
                                    if (!el) return;
                                    el.querySelectorAll('img').forEach(img => {
                                        img.onerror = function () {
                                            this.remove();
                                        };
                                    });
                                }}
                                dangerouslySetInnerHTML={{ __html: viewBlog.contentHtml || viewBlog.content || '' }} />
                        </>
                    )}
                    {/* Comments Section */}
                    <div className="mt-10 pt-8 border-t border-border-secondary">
                        <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-4 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" /> Comments
                        </h3>
                        {commentsLoading ? (
                            <p className="text-text-tertiary text-sm">Loading comments...</p>
                        ) : comments.length === 0 ? (
                            <p className="text-text-tertiary text-sm">No comments found.</p>
                        ) : (
                            <div className="space-y-3">
                                {comments.map(c => (
                                    <div key={c.id} className="flex items-start justify-between gap-3 p-3 rounded-xl bg-bg-tertiary border border-border-primary">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-text-secondary mb-0.5">{c.name || 'Anonymous'}</p>
                                            <p className="text-sm text-text-primary">{c.commentText}</p>
                                            {c.createdAt && !isNaN(new Date(c.createdAt)) && (
                                                <p className="text-xs text-text-tertiary mt-1">{format(new Date(c.createdAt), 'MMM dd, yyyy')}</p>
                                            )}
                                        </div>
                                        <button onClick={() => handleDeleteComment(c.id)}
                                            className="shrink-0 p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-all" title="Delete comment">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {viewBlog.status === 'PENDING' && (
                        <div className="mt-10 pt-8 border-t border-border-secondary">
                            <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-4">Moderation Actions</h3>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button onClick={() => handleApprove(viewBlog.id)} disabled={actionLoading}
                                    className="group flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-50 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-emerald-700 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98]">
                                    <CheckCircle className="w-5 h-5 transition-transform group-hover:scale-110" />
                                    {actionLoading ? 'Approving...' : 'Approve & Publish'}
                                </button>
                                <button onClick={() => { setRejectModal(viewBlog); setRejectReason(''); }} disabled={actionLoading}
                                    className="group flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-50 bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25 hover:from-red-600 hover:to-red-700 hover:shadow-red-500/40 hover:scale-[1.02] active:scale-[0.98]">
                                    <XCircle className="w-5 h-5 transition-transform group-hover:scale-110" />
                                    Reject Blog
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                {rejectModal && (
                    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setRejectModal(null)}>
                        <div className="bg-bg-card rounded-2xl border border-border-primary shadow-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-text-primary">Reject Blog</h2>
                                    <p className="text-xs text-text-tertiary">{rejectModal.title}</p>
                                </div>
                            </div>
                            <TextArea label="Reason for rejection *" placeholder="Explain why this blog is being rejected..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={4} />
                            <div className="flex gap-2 mt-5">
                                <button onClick={() => setRejectModal(null)}
                                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-border-primary text-text-secondary hover:bg-bg-hover transition-colors">
                                    Cancel
                                </button>
                                <button onClick={handleReject} disabled={actionLoading}
                                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50">
                                    {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {deleteConfirmBlog && (
                    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setDeleteConfirmBlog(null)}>
                        <div className="bg-bg-card rounded-2xl border border-border-primary shadow-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                                    <Trash2 className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-text-primary">Delete Blog</h2>
                                    <p className="text-xs text-text-tertiary">{deleteConfirmBlog.title}</p>
                                </div>
                            </div>
                            <p className="text-sm text-text-secondary mb-5">This action is permanent and cannot be undone. All comments on this blog will also be deleted.</p>
                            <div className="flex gap-2">
                                <button onClick={() => setDeleteConfirmBlog(null)}
                                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-border-primary text-text-secondary hover:bg-bg-hover transition-colors">
                                    Cancel
                                </button>
                                <button onClick={() => handleDeleteBlog(deleteConfirmBlog.id)} disabled={actionLoading}
                                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50">
                                    {actionLoading ? 'Deleting...' : 'Yes, Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
    // Blog list view
    return (
        <div className="max-w-6xl mx-auto px-6 py-10">
            <div className="mb-8">
                {onBack && (
                    <button onClick={onBack}
                        className="flex items-center gap-1.5 text-sm font-semibold mb-4 hover:opacity-75 transition text-blue-900">
                        <ArrowLeft className="w-4 h-4" /> Back to Blog Dashboard
                    </button>
                )}
                <h1 className="text-3xl font-bold text-text-primary mb-1">
                    Blog Moderation
                </h1>
                <p className="text-gray-500 text-sm">Review, approve, and manage blog submissions</p>
            </div>
            <div className="flex flex-wrap gap-2 mb-6">
                {['', 'PENDING', 'PUBLISHED', 'REJECTED', 'DRAFT'].map((s) => (
                    <button key={s} onClick={() => handleStatusFilter(s)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${statusFilter === s ? 'bg-text-primary text-bg-primary' : 'border border-border-primary text-text-secondary hover:border-text-secondary'}`}
                        style={statusFilter === s ? { backgroundColor: '#1e3a8a', color: 'white' } : {}}>
                        {s || 'All'}
                    </button>
                ))}
            </div>
            {loading ? <div className="py-20 text-center"><Spinner size="lg" /></div> : blogs.length === 0 ? (
                <Card><p className="text-center text-text-tertiary py-8">No blogs found</p></Card>
            ) : (
                <div className="space-y-4">
                    {blogs.map((blog) => (
                        <Card key={blog.id} className="cursor-pointer hover:border-text-tertiary transition-colors" onClick={() => openView(blog)}>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-text-primary truncate">{blog.title}</h3>
                                        {statusBadge(blog.status)}
                                    </div>
                                    <p className="text-text-secondary text-sm truncate">{blog.excerpt}</p>
                                    <div className="flex items-center gap-3 mt-1.5 text-xs text-text-tertiary">
                                        <span>By {blog.authorName}</span>
                                        {blog.createdAt && !isNaN(new Date(blog.createdAt)) && (
                                            <span>{format(new Date(blog.createdAt), 'MMM dd, yyyy')}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                                    <button onClick={() => openView(blog)}
                                        className="p-2 rounded-lg border border-border-primary text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-all" title="View">
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => { openView(blog); setIsEditing(true); }}
                                        className="p-2 rounded-lg border border-border-primary text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-all" title="Edit">
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    {blog.status === 'PENDING' && (
                                        <>
                                            <button onClick={() => handleApprove(blog.id)}
                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-all">
                                                <CheckCircle className="w-3.5 h-3.5" /> Approve
                                            </button>
                                            <button onClick={() => { setRejectModal(blog); setRejectReason(''); }}
                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-all">
                                                <XCircle className="w-3.5 h-3.5" /> Reject
                                            </button>
                                        </>
                                    )}
                                    {blog.commentsCount > 0 && (
                                        <button onClick={(e) => openCommentsModal(blog, e)}
                                            className="relative p-2 rounded-lg border border-blue-200 text-blue-500 hover:bg-blue-50 transition-all" title="View comments">
                                            <MessageSquare className="w-4 h-4" />
                                            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
                                                {blog.commentsCount}
                                            </span>
                                        </button>
                                    )}
                                    <button onClick={() => setDeleteConfirmBlog(blog)}
                                        className="p-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-all" title="Delete blog">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ))}

                    <Pagination
                        page={pagination.page}
                        totalPages={pagination.totalPages}
                        onPageChange={(p) => fetchBlogs({ page: p })}
                        pageSize={pageSize}
                        onPageSizeChange={(newSize) => { setPageSize(newSize); fetchBlogs({ page: 0, size: newSize }); }}
                    />
                </div>
            )}
            {rejectModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setRejectModal(null)}>
                    <div className="bg-bg-card rounded-2xl border border-border-primary shadow-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-text-primary">Reject Blog</h2>
                                <p className="text-xs text-text-tertiary">{rejectModal.title}</p>
                            </div>
                        </div>
                        <TextArea label="Reason for rejection *" placeholder="Explain why this blog is being rejected..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={4} />
                        <div className="flex gap-2 mt-5">
                            <button onClick={() => setRejectModal(null)}
                                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-border-primary text-text-secondary hover:bg-bg-hover transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleReject} disabled={actionLoading}
                                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50">
                                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Standalone Comments Modal */}
            {commentsModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setCommentsModal(null)}>
                    <div className="bg-bg-card rounded-2xl border border-border-primary shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="flex items-start justify-between px-5 py-4 border-b border-border-primary shrink-0">
                            <div className="min-w-0 pr-3">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <MessageSquare className="w-4 h-4 shrink-0 text-blue-900" />
                                    <h2 className="text-sm font-bold text-text-primary truncate">Comments</h2>
                                </div>
                                <p className="text-xs text-text-tertiary truncate">{commentsModal.title}</p>
                            </div>
                            <button onClick={() => setCommentsModal(null)} className="p-1.5 rounded-lg hover:bg-bg-hover transition text-text-tertiary shrink-0">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        {/* Body */}
                        <div className="overflow-y-auto flex-1 px-5 py-4">
                            {commentsLoading ? (
                                <p className="text-text-tertiary text-sm py-8 text-center">Loading comments...</p>
                            ) : comments.length === 0 ? (
                                <p className="text-text-tertiary text-sm py-8 text-center">No comments found.</p>
                            ) : (
                                <div className="space-y-3">
                                    {comments.map(c => (
                                        <div key={c.id} className="flex items-start justify-between gap-3 p-3 rounded-xl bg-bg-tertiary border border-border-primary">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    <p className="text-xs font-semibold text-text-secondary">{c.name || 'Anonymous'}</p>
                                                    {c.status && (
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${c.status === 'VISIBLE' ? 'bg-green-100 text-green-700' :
                                                                c.status === 'HIDDEN' ? 'bg-gray-100 text-gray-500' :
                                                                    'bg-yellow-100 text-yellow-700'
                                                            }`}>{c.status}</span>
                                                    )}
                                                    {c.createdAt && !isNaN(new Date(c.createdAt)) && (
                                                        <span className="text-[10px] text-text-tertiary">{format(new Date(c.createdAt), 'MMM dd, yyyy')}</span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-text-primary">{c.commentText}</p>
                                            </div>
                                            <button onClick={() => handleDeleteComment(c.id)}
                                                className="shrink-0 p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition" title="Delete comment">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {deleteConfirmBlog && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setDeleteConfirmBlog(null)}>
                    <div className="bg-bg-card rounded-2xl border border-border-primary shadow-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                                <Trash2 className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-text-primary">Delete Blog</h2>
                                <p className="text-xs text-text-tertiary">{deleteConfirmBlog.title}</p>
                            </div>
                        </div>
                        <p className="text-sm text-text-secondary mb-5">This action is permanent and cannot be undone. All comments on this blog will also be deleted.</p>
                        <div className="flex gap-2">
                            <button onClick={() => setDeleteConfirmBlog(null)}
                                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-border-primary text-text-secondary hover:bg-bg-hover transition-colors">
                                Cancel
                            </button>
                            <button onClick={() => handleDeleteBlog(deleteConfirmBlog.id)} disabled={actionLoading}
                                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50">
                                {actionLoading ? 'Deleting...' : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
