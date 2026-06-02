import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { blogApi, resolveBlogImageUrl } from '../../api/blogApi.ts';
import { Card, Spinner, TagBadge } from '../ui/index.tsx';
import { Clock, Heart, MessageCircle, Eye, ArrowRight, Feather, Mail } from 'lucide-react';
import { format } from 'date-fns';

type BlogSummary = {
    id: number | string;
    slug?: string;
    title: string;
    excerpt: string;
    featuredImageUrl?: string;
    tags?: string[];
    likesCount: number;
    commentsCount: number;
    viewsCount: number;
    publishedAt?: string;
};

export const HomePage = () => {
    const [blogs, setBlogs] = useState<BlogSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadBlogs = async () => {
            try {
                const response = await blogApi.getBlogs({ size: 6, sort: 'popular' });
                setBlogs(response.data.content as BlogSummary[]);
            } catch (err) {
                setBlogs([]);
            } finally {
                setLoading(false);
            }
        };
        loadBlogs();
    }, []);

    return (
        <div className="overflow-x-hidden bg-white">
            {/* Hero */}
            <section className="bg-bg-primary border-b border-border-primary">
                <div className="mx-auto max-w-6xl px-6 pb-16 pt-10 text-center md:pb-20 md:pt-14">
                    <h1 className="animate-slide-down text-[2rem] font-extrabold tracking-[-0.03em] text-text-primary md:text-[2.5rem] lg:text-[3.2rem]">
                        A Star Classes
                    </h1>
                    <p className="mx-auto mb-7 mt-3 max-w-2xl animate-slide-up text-[0.95rem] leading-relaxed text-text-secondary md:text-base">
                        Insights on education, exam preparation, and learning strategies
                    </p>
                    <div className="animate-fade-in flex flex-wrap justify-center gap-3">
                        <Link to="/blog/all">
                            <button className="btn-primary !min-h-[2.65rem] !min-w-[8.85rem] !px-3.5 !py-1.5 !text-sm">
                                Explore Articles
                                <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                        </Link>
                        <Link to="/blog/submit">
                            <button className="btn-secondary !min-h-[2.65rem] !min-w-[8.85rem] !px-3.5 !py-1.5 !text-sm">
                                <Feather className="h-3.5 w-3.5" />
                                Write Article
                            </button>
                        </Link>
                        <Link to="/blog/subscribe">
                            <button className="btn-outline !min-h-[2.65rem] !min-w-[8rem] !px-3.5 !py-1.5 !text-sm">
                                <Mail className="h-3.5 w-3.5" />
                                Subscribe
                            </button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Popular Blogs */}
            <section className="bg-white">
                <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
                    <div className="mb-10 flex items-center justify-between">
                        <h2 className="text-4xl font-extrabold tracking-[-0.03em] text-text-primary">Popular Blogs</h2>
                        <Link to="/blog/all" className="flex items-center gap-2 text-sm font-semibold text-[#187596] transition-colors hover:text-text-primary">
                            View all <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {loading ? (
                        <Spinner size="lg" />
                    ) : blogs.length === 0 ? (
                        <div className="rounded-[2rem] border border-dashed border-border-primary bg-bg-secondary px-6 py-20 text-center">
                            <p className="text-lg text-text-secondary">No blogs yet. <Link to="/blog/submit" className="font-semibold text-text-primary underline underline-offset-4">Submit the first one</Link>.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-3">
                            {blogs.map((blog) => (
                                blog.slug ? (
                                    <Link to={`/blog/${blog.slug}`} key={blog.id}>
                                        <Card hover className="h-full rounded-[1.75rem] border border-border-secondary p-0 shadow-[0_18px_50px_rgba(9,22,49,0.08)] transition-transform hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(9,22,49,0.12)]">
                                            {blog.featuredImageUrl && (
                                                <img src={resolveBlogImageUrl(blog.featuredImageUrl)} alt={blog.title} className="h-52 w-full rounded-t-[1.75rem] object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                            )}
                                            <div className="space-y-4 p-6">
                                                <h3 className="line-clamp-2 text-xl font-extrabold tracking-[-0.03em] text-text-primary">{blog.title}</h3>
                                                <p className="line-clamp-3 text-sm leading-6 text-text-secondary">{blog.excerpt}</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {blog.tags?.slice(0, 3).map((tag: string) => <TagBadge key={tag} tag={tag} />)}
                                                </div>
                                                <div className="flex items-center justify-between border-t border-border-secondary pt-4 text-xs text-text-tertiary">
                                                    <div className="flex items-center space-x-3">
                                                        <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{blog.likesCount}</span>
                                                        <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" />{blog.commentsCount}</span>
                                                        <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{blog.viewsCount}</span>
                                                    </div>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {blog.publishedAt && format(new Date(blog.publishedAt), 'MMM dd')}
                                                    </span>
                                                </div>
                                            </div>
                                        </Card>
                                    </Link>
                                ) : (
                                    <div key={blog.id}>
                                        <Card className="h-full rounded-[1.75rem] border border-border-secondary p-0 opacity-90 shadow-[0_18px_50px_rgba(9,22,49,0.08)]">
                                            {blog.featuredImageUrl && (
                                                <img src={resolveBlogImageUrl(blog.featuredImageUrl)} alt={blog.title} className="h-52 w-full rounded-t-[1.75rem] object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                            )}
                                            <div className="space-y-4 p-6">
                                                <h3 className="line-clamp-2 text-xl font-extrabold tracking-[-0.03em] text-text-primary">{blog.title}</h3>
                                                <p className="line-clamp-3 text-sm leading-6 text-text-secondary">{blog.excerpt}</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {blog.tags?.slice(0, 3).map((tag: string) => <TagBadge key={tag} tag={tag} />)}
                                                </div>
                                                <div className="flex items-center justify-between border-t border-border-secondary pt-4 text-xs text-text-tertiary">
                                                    <div className="flex items-center space-x-3">
                                                        <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{blog.likesCount}</span>
                                                        <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" />{blog.commentsCount}</span>
                                                        <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{blog.viewsCount}</span>
                                                    </div>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {blog.publishedAt && format(new Date(blog.publishedAt), 'MMM dd')}
                                                    </span>
                                                </div>
                                            </div>
                                        </Card>
                                    </div>
                                )
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};
