import { useState, useCallback, useEffect, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { blogApi, resolveBlogImageUrl } from '../../api/blogApi.ts';
import { Card, Spinner, Button, Pagination, TagBadge } from '../ui/index.tsx';
import { Heart, MessageCircle, Eye, Search, Filter, Calendar, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

type BlogSummary = {
    id: number | string;
    slug: string;
    title: string;
    excerpt: string;
    featuredImageUrl?: string;
    tags?: string[];
    likesCount: number;
    commentsCount: number;
    viewsCount: number;
    publishedAt?: string;
};

type ArchiveEntry = {
    year: number;
    months: Array<{ month: number; count: number }>;
};

type FetchBlogsParams = {
    page?: number;
    size?: number;
    sort?: string;
    search?: string;
    year?: string | number;
    month?: string | number;
};

export const BlogListPage = () => {
    const [blogs, setBlogs] = useState<BlogSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('recent');
    const [year, setYear] = useState('');
    const [month, setMonth] = useState('');
    const [pagination, setPagination] = useState({ page: 0, totalPages: 0, totalElements: 0 });
    const [pageSize, setPageSize] = useState(9);
    const [archive, setArchive] = useState<ArchiveEntry[]>([]);
    const fetchBlogs = useCallback(async (params: FetchBlogsParams = {}) => {
        setLoading(true);
        try {
            const currentSize = params.size !== undefined ? params.size : pageSize;
            const queryParams: FetchBlogsParams = {
                page: params.page || 0,
                size: currentSize,
                sort: params.sort || sort,
            };
            // Only add search if non-empty
            const searchVal = params.search !== undefined ? params.search : search;
            if (searchVal) queryParams.search = searchVal;
            // Only add year/month if set
            const yearVal = params.year !== undefined ? params.year : year;
            const monthVal = params.month !== undefined ? params.month : month;
            if (yearVal) queryParams.year = Number(yearVal);
            if (monthVal) queryParams.month = Number(monthVal);
            const response = await blogApi.getBlogs(queryParams);
            setBlogs(response.data.content as BlogSummary[]);
            setPagination({ page: response.data.page, totalPages: response.data.totalPages, totalElements: response.data.totalElements });
        } catch (err) { console.error('Failed to load blogs', err); }
        finally { setLoading(false); }
    }, [sort, search, pageSize, year, month]);
    const fetchArchive = async () => {
        try {
            const response = await blogApi.getArchive();
            setArchive(response.data as ArchiveEntry[]);
        } catch (err) { console.error('Failed to load archive', err); }
    };
    useEffect(() => { fetchBlogs(); fetchArchive(); }, []);
    const handleSearch = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); fetchBlogs({ search, page: 0 }); };
    const handleSortChange = (nextSort: string) => { setSort(nextSort); fetchBlogs({ sort: nextSort, page: 0 }); };
    const handlePageChange = (page: number) => { fetchBlogs({ page }); };
    const handleYearMonthChange = (nextYear: string, nextMonth: string) => {
        setYear(nextYear); setMonth(nextMonth);
        fetchBlogs({ year: nextYear, month: nextMonth, page: 0 });
    };
    const clearFilters = () => {
        setSearch(''); setSort('recent'); setYear(''); setMonth('');
        fetchBlogs({ search: '', sort: 'recent', year: '', month: '', page: 0 });
    };
    // Build year options from archive
    const years = archive.map((entry) => entry.year);
    const monthsForYear = year ? archive.find((entry) => entry.year === Number(year))?.months?.map((entry) => entry.month) || [] : [];
    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
            <div className="mb-5 flex items-center gap-4 sm:gap-5">
                <Link to="/blog" className="inline-flex items-center gap-2 text-[15px] font-medium text-text-secondary transition-colors hover:text-text-primary">
                    <ArrowLeft className="h-5 w-5" />
                    <span>Back</span>
                </Link>
                <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">All Blogs</h1>
            </div>
            {/* Search & Filters */}
            <div className="bg-bg-secondary border border-border-primary rounded-xl p-4 sm:p-5 mb-6 sm:mb-8 transition-colors duration-200">
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
                        <input type="text" placeholder="Search blogs by title or content..." value={search}
                            onChange={(e) => setSearch(e.target.value)} className="input-clean" style={{ paddingLeft: '2.25rem' }} />
                    </div>
                    <Button type="submit" className="w-full sm:w-auto !bg-[#19788f] hover:!bg-[#166b7f] !text-white">Search</Button>
                </form>
                <div className="flex flex-col gap-3 mt-4">
                    {/* Sort buttons — scrollable on mobile */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                        <Filter className="w-4 h-4 text-text-tertiary shrink-0" />
                        {['recent', 'popular', 'oldest', 'most_commented'].map((s) => (
                            <button key={s} onClick={() => handleSortChange(s)}
                                className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all ${sort === s ? 'bg-[#19788f] text-white' : 'bg-bg-card border border-border-primary text-text-secondary hover:border-text-tertiary'}`}>
                                {s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            </button>
                        ))}
                    </div>
                    {/* Year/Month filter */}
                    <div className="flex flex-wrap items-center gap-2">
                        <Calendar className="w-4 h-4 text-text-tertiary shrink-0" />
                        <select value={year} onChange={(e) => handleYearMonthChange(e.target.value, '')}
                            className="bg-bg-card border border-border-primary rounded-lg px-2 py-1.5 text-sm text-text-primary focus:outline-none cursor-pointer">
                            <option value="">All Years</option>
                            {years.map((entryYear) => <option key={entryYear} value={entryYear}>{entryYear}</option>)}
                        </select>
                        {year && (
                            <select value={month} onChange={(e) => handleYearMonthChange(year, e.target.value)}
                                className="bg-bg-card border border-border-primary rounded-lg px-2 py-1.5 text-sm text-text-primary focus:outline-none cursor-pointer">
                                <option value="">All Months</option>
                                {monthsForYear.map((entryMonth) => (
                                    <option key={entryMonth} value={entryMonth}>{new Date(2000, entryMonth - 1).toLocaleString('default', { month: 'long' })}</option>
                                ))}
                            </select>
                        )}
                        {(search || year || month || sort !== 'recent') && (
                            <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-600 underline">Clear all</button>
                        )}
                    </div>
                </div>
            </div>
            {loading ? <Spinner size="lg" /> : blogs.length === 0 ? (
                <div className="text-center py-16"><p className="text-text-tertiary text-lg">No blogs found</p></div>
            ) : (
                <>
                    <p className="text-text-tertiary text-sm mb-5">{pagination.totalElements} blog(s) found</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {blogs.map((blog) => (
                            <Link to={`/blog/${blog.slug}`} key={blog.id}>
                                <Card hover className="h-full">
                                    {blog.featuredImageUrl && <img src={resolveBlogImageUrl(blog.featuredImageUrl)} alt={blog.title} className="w-full h-44 object-cover rounded-lg mb-4" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                                    <div className="space-y-3">
                                        <h3 className="text-lg font-semibold text-text-primary line-clamp-2">{blog.title}</h3>
                                        <p className="text-text-secondary text-sm line-clamp-2">{blog.excerpt}</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {blog.tags?.slice(0, 3).map((tag: string) => <TagBadge key={tag} tag={tag} />)}
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-text-tertiary pt-3 border-t border-border-secondary">
                                            <div className="flex items-center space-x-3">
                                                <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{blog.likesCount}</span>
                                                <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" />{blog.commentsCount}</span>
                                                <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{blog.viewsCount}</span>
                                            </div>
                                            <span>{blog.publishedAt && format(new Date(blog.publishedAt), 'MMM dd, yyyy')}</span>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                    <Pagination
                        page={pagination.page}
                        totalPages={pagination.totalPages}
                        onPageChange={handlePageChange}
                        pageSize={pageSize}
                        onPageSizeChange={(newSize: number) => { setPageSize(newSize); fetchBlogs({ page: 0, size: newSize }); }}
                        pageSizeOptions={[9, 18, 27, 45]}
                    />
                </>
            )}
        </div>
    );
};
