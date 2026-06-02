import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Quote, Loader2 } from 'lucide-react';
import * as reviewApi from '../api/api/reviewApi';
import toast from 'react-hot-toast';

const ratingLabels = {
    teachingQuality: "Teaching Quality",
    personalAttention: "Personal Attention",
    testSystem: "Test System",
    overallExperience: "Overall Experience",
    conceptClarity: "Concept Clarity",
    doubtSolving: "Doubt Solving",
    studyMaterial: "Study Material",
    improvementInConfidence: "Improvement in Confidence",
    structuredPlanning: "Structured Planning",
    examOrientedPractice: "Exam-Oriented Practice",
    reinforcementClasses: "Reinforcement Classes",
    overallSatisfaction: "Overall Satisfaction",
    batchSizeAdvantage: "Batch Size Advantage",
    individualMonitoring: "Individual Monitoring",
    teacherExperience: "Teacher Experience",
    resultImprovement: "Result Improvement"
};

const Reviews = () => {
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [avgRating, setAvgRating] = useState(0);

    useEffect(() => {
        fetchReviews();
    }, [page]);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const data = await reviewApi.getPublishedReviews({ page, size: 9 });
            const content = Array.isArray(data) ? data : (data.content || []);
            setReviews(content);
            setTotalPages(data.totalPages || (Array.isArray(data) ? 1 : 0));
            setTotalElements(data.totalElements || content.length);
            setAvgRating(
                content.length > 0
                    ? Math.round((content.reduce((s: number, r: any) => s + (r.overallRating || 0), 0) / content.length) * 10) / 10
                    : 0
            );
        } catch (error: any) {
            console.error('Failed to fetch reviews:', error);
            toast.error(error?.message || 'Failed to load reviews');
        } finally {
            setLoading(false);
        }
    };

    const getRatingsArray = (review: any) => {
        return Object.entries(ratingLabels).map(([key, label]) => ({
            label,
            score: review[key] || 0
        })).filter(r => r.score > 0);
    };

    return (
        <div className="min-h-screen bg-[#fcfcfc] font-sans overflow-x-hidden">
            {/* Header Section */}
            <section className="pt-24 pb-8 px-4 text-center max-w-7xl mx-auto">
                <h1 className="text-5xl md:text-7xl font-black text-[#1e3a8a] mb-6 leading-tight tracking-tight">
                    Student Reviews
                </h1>
                <p className="text-xl text-gray-500 max-w-3xl mx-auto font-medium mb-12">
                    Hear what our students have to say about their learning experience with A Star Classes
                </p>

                {/* Stats Banner */}
                {!loading && totalElements > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto mb-10">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <p className="text-2xl sm:text-3xl font-black text-[#1e3a8a]">{totalElements}</p>
                            <p className="text-sm font-bold text-gray-500 mt-1">Total Reviews</p>
                        </div>
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-2 justify-center">
                                <span className="text-2xl sm:text-3xl font-black text-[#f59e0b]">{avgRating}</span>
                                <Star size={22} fill="#f59e0b" className="text-amber-500" />
                            </div>
                            <p className="text-sm font-bold text-gray-500 mt-1">Average Rating</p>
                        </div>
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <p className="text-2xl sm:text-3xl font-black text-green-600">{totalPages}</p>
                            <p className="text-sm font-bold text-gray-500 mt-1">Pages</p>
                        </div>
                    </div>
                )}

                {/* Main Action Box */}
                <div className="bg-[#f8f9fb] rounded-2xl md:rounded-[40px] p-8 md:p-10 max-w-4xl mx-auto shadow-sm border border-gray-100 mb-12">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <button 
                            onClick={() => document.getElementById('reviews-grid')?.scrollIntoView({ behavior: 'smooth' })}
                            className="w-full sm:w-auto px-12 py-5 bg-[#1e3a8a] text-white rounded-2xl md:rounded-[24px] font-black text-xl hover:bg-[#162d6b] transition-all shadow-2xl shadow-blue-900/20 active:scale-95"
                        >
                            Explore Reviews
                        </button>
                        <Link
                            to="/write-review"
                            className="w-full sm:w-auto px-12 py-5 bg-[#f59e0b] text-white rounded-2xl md:rounded-[24px] font-black text-xl hover:bg-[#d97706] transition-all shadow-2xl shadow-amber-500/20 active:scale-95"
                        >
                            Write a Review
                        </Link>
                    </div>
                </div>

                {/* Reviews Grid */}
                <div id="reviews-grid" className="max-w-[1400px] mx-auto px-4 pb-24">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-12 h-12 text-[#1e3a8a] animate-spin mb-4" />
                            <p className="text-xl font-bold text-gray-400">Loading reviews...</p>
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="text-center py-20 bg-gray-50 rounded-2xl md:rounded-[40px] border-2 border-dashed border-gray-200">
                            <p className="text-2xl font-bold text-gray-400">No reviews found yet.</p>
                            <Link to="/write-review" className="inline-block mt-6 px-8 py-4 bg-[#f59e0b] text-white rounded-[24px] font-bold text-lg hover:bg-[#d97706] transition-all">
                                Be the first to review
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                {reviews.map((review, index) => (
                                    <div key={review.id || index} className="bg-white rounded-2xl md:rounded-[40px] border border-gray-100 shadow-2xl shadow-gray-200/50 flex flex-col h-full overflow-hidden group hover:border-blue-100 transition-colors">
                                        {/* Card Content Top */}
                                        <div className="p-4 sm:p-6 md:p-10 pb-6 text-left">
                                            <h3 className="text-2xl font-black text-[#1e3a8a] mb-1">{review.studentName}</h3>
                                            <p className="text-[#5c7cbd] font-bold text-sm mb-6 tracking-wide uppercase">{review.gradeOrClass}</p>
                                            <div className="relative">
                                                <Quote className="absolute -top-2 -left-2 w-8 h-8 text-blue-50 opacity-50" />
                                                <p className="text-gray-600 text-[17px] font-medium leading-relaxed relative z-10 italic">
                                                    "{review.reviewText}"
                                                </p>
                                            </div>
                                        </div>

                                        {/* Ratings Section */}
                                        <div className="mx-4 md:mx-6 mb-4 p-4 md:p-7 bg-[#f8f9fb] rounded-2xl md:rounded-[32px] border border-gray-50 flex-1">
                                            <h4 className="text-[11px] font-black text-[#999] tracking-[0.15em] uppercase mb-6 flex items-center gap-3">
                                                DETAILED RATINGS <div className="flex-1 h-px bg-gray-200"></div>
                                            </h4>
                                            <div className="space-y-4">
                                                {getRatingsArray(review).map((rating, idx) => (
                                                    <div key={idx} className="grid grid-cols-[1fr_auto] items-center gap-2 group/item">
                                                        <span className="text-[#444] text-[15px] font-black leading-tight group-hover/item:text-[#1e3a8a] transition-colors text-left">
                                                            {rating.label}:
                                                        </span>
                                                        <div className="flex gap-0.5">
                                                            {[1, 2, 3, 4, 5].map(s => (
                                                                <Star 
                                                                    key={s} 
                                                                    size={14} 
                                                                    fill={s <= rating.score ? "#f59e0b" : "none"} 
                                                                    className={s <= rating.score ? "text-amber-500" : "text-gray-200"} 
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Footer Section */}
                                        <div className="px-4 sm:px-6 md:px-10 pb-6 md:pb-10 pt-4 text-left">
                                            <div className="h-px bg-gray-100 mb-8 w-full"></div>
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-[#1e3a8a] text-lg font-black">Overall Rating:</span>
                                                <div className="flex gap-1">
                                                    {[1, 2, 3, 4, 5].map(s => (
                                                        <Star 
                                                            key={s} 
                                                            size={20} 
                                                            fill={s <= (review.overallRating || 5) ? "#f59e0b" : "none"} 
                                                            className={s <= (review.overallRating || 5) ? "text-amber-500" : "text-gray-200"} 
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-gray-400 text-sm font-bold tracking-tight">
                                                {new Date(review.submittedAt || review.publishedAt || review.createdAt).toLocaleDateString('en-US', {
                                                    month: 'long',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="mt-16 flex justify-center gap-4">
                                    <button 
                                        disabled={page === 0}
                                        onClick={() => setPage(p => p - 1)}
                                        className="px-6 py-3 bg-white border border-gray-200 rounded-xl font-bold text-[#1e3a8a] hover:bg-gray-50 disabled:opacity-50 transition-all"
                                    >
                                        Previous
                                    </button>
                                    <span className="flex items-center px-6 font-bold text-gray-500">
                                        Page {page + 1} of {totalPages}
                                    </span>
                                    <button 
                                        disabled={page === totalPages - 1}
                                        onClick={() => setPage(p => p + 1)}
                                        className="px-6 py-3 bg-white border border-gray-200 rounded-xl font-bold text-[#1e3a8a] hover:bg-gray-50 disabled:opacity-50 transition-all"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>
        </div>
    );
};

export default Reviews;
