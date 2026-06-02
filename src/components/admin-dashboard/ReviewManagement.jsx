import React, { useState, useEffect } from 'react';
import { Star, Trash2, Check, X, AlertCircle, Eye, ChevronLeft, ChevronRight, Filter, User, BookOpen, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAllReviewsAdmin, approveReview, rejectReview, deleteReview } from '../../api/api/reviewApi';

export default function ReviewManagement() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  const [viewModal, setViewModal] = useState(null);
  const [pagination, setPagination] = useState({ page: 0, size: 100, totalPages: 0, totalElements: 0 });

  // Fetch reviews from API
  useEffect(() => {
    fetchReviews();
  }, [selectedStatus, pagination.page]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        size: pagination.size,
      };
      if (selectedStatus !== 'all') {
        params.status = selectedStatus.toUpperCase();
      }

      const response = await getAllReviewsAdmin(params);
      const content = response?.content || (Array.isArray(response) ? response : []);
      setReviews(content);
      setPagination(prev => ({
        ...prev,
        totalPages: response?.totalPages || (Array.isArray(response) ? 1 : 0),
        totalElements: response?.totalElements || content.length,
      }));
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error(error?.message || 'Failed to load reviews from server');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reviewId) => {
    if (!window.confirm('Approve this review for publication?')) return;
    setActionLoading(reviewId);
    try {
      await approveReview(reviewId);
      fetchReviews();
      if (viewModal?.id === reviewId) setViewModal(null);
      toast.success('Review approved successfully');
    } catch (error) {
      toast.error(error?.message || 'Failed to approve review');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (reviewId) => {
    const reason = window.prompt('Enter reason for rejection:');
    if (reason === null) return;

    setActionLoading(reviewId);
    try {
      await rejectReview(reviewId, reason);
      fetchReviews();
      if (viewModal?.id === reviewId) setViewModal(null);
      toast.success('Review rejected');
    } catch (error) {
      toast.error(error?.message || 'Failed to reject review');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Permanently delete this review?')) return;

    setActionLoading(reviewId);
    try {
      await deleteReview(reviewId);
      fetchReviews();
      if (viewModal?.id === reviewId) setViewModal(null);
      toast.success('Review deleted');
    } catch (error) {
      toast.error(error?.message || 'Failed to delete review');
    } finally {
      setActionLoading(null);
    }
  };

  const renderStars = (rating) => (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={14}
          className={`${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200 fill-gray-200'}`}
        />
      ))}
    </div>
  );

  const getStatusStyle = (status) => {
    switch (status?.toUpperCase()) {
      case 'PUBLISHED': return 'bg-green-100 text-green-700 border-green-200';
      case 'REJECTED': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  };

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      {/* Header Section */}
      <div className="bg-white border-b-2 border-blue-900 rounded-xl p-4 md:p-6">
        <h2 className="text-xl md:text-2xl font-bold text-blue-900">Student Review Moderation</h2>
        <p className="text-gray-500 text-xs md:text-sm mt-1">Approve, reject, or delete student reviews from the public website</p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-md p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
          <Filter size={18} />
          <span>Filter by Status:</span>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {['all', 'pending', 'published', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => { setSelectedStatus(status); setPagination(p => ({ ...p, page: 0 })); }}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border-2 ${selectedStatus === status
                  ? 'bg-blue-900 text-white border-blue-900 shadow-md'
                  : 'bg-white text-gray-600 border-gray-100 hover:border-blue-200'
                }`}
            >
              {status.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-blue-900">
            <div className="w-10 h-10 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-semibold italic">Fetching reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <AlertCircle size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">No reviews found for this status.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Student & Class</th>
                  <th className="px-4 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Review Content</th>
                  <th className="px-4 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Ratings</th>
                  <th className="px-4 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-4 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reviews.map((review) => (
                  <tr key={review.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-4">
                      <div className="text-sm font-bold text-blue-900">{review.studentName}</div>
                      <div className="text-[10px] text-gray-500 font-medium flex items-center gap-1 mt-1 uppercase tracking-tight">
                        <BookOpen size={10} /> {review.gradeOrClass}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{new Date(review.submittedAt || review.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-xs text-gray-600 line-clamp-2 italic leading-relaxed max-w-xs">
                        "{review.reviewText}"
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-gray-400 uppercase w-12">Overall</span>
                          {renderStars(review.overallRating)}
                        </div>
                        <div className="flex items-center gap-2 opacity-60">
                          <span className="text-[9px] font-bold text-gray-400 uppercase w-12">Teaching</span>
                          {renderStars(review.teachingQuality)}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black border uppercase shadow-sm ${getStatusStyle(review.status)}`}>
                        {review.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setViewModal(review)}
                          className="p-2 rounded-full text-blue-600 hover:bg-blue-100 transition-colors"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>

                        {review.status?.toUpperCase() === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApprove(review.id)}
                              disabled={actionLoading === review.id}
                              className="p-2 rounded-full text-green-600 hover:bg-green-100 transition-colors"
                              title="Approve"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={() => handleReject(review.id)}
                              disabled={actionLoading === review.id}
                              className="p-2 rounded-full text-orange-600 hover:bg-orange-100 transition-colors"
                              title="Reject"
                            >
                              <X size={18} />
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => handleDelete(review.id)}
                          disabled={actionLoading === review.id}
                          className="p-2 rounded-full text-red-500 hover:bg-red-100 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="px-4 py-4 bg-gray-50 border-t flex items-center justify-between flex-wrap gap-4">
            <span className="text-xs font-bold text-gray-500">
              Showing page {pagination.page + 1} of {pagination.totalPages} ({pagination.totalElements} reviews)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page === 0}
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                className="p-1.5 rounded-lg border bg-white disabled:opacity-30 hover:bg-gray-100 transition"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                disabled={pagination.page === pagination.totalPages - 1}
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                className="p-1.5 rounded-lg border bg-white disabled:opacity-30 hover:bg-gray-100 transition"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Modal */}
      {viewModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-linear-to-r from-blue-900 to-indigo-900 text-white p-5 md:p-6 shrink-0">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl md:text-2xl font-black tracking-tight">{viewModal.studentName}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs md:text-sm text-blue-200 font-medium">
                    <span className="flex items-center gap-1.5"><User size={14} /> Parent: {viewModal.parentName || 'N/A'}</span>
                    <span className="flex items-center gap-1.5"><BookOpen size={14} /> Grade: {viewModal.gradeOrClass}</span>
                    <span className="flex items-center gap-1.5"><Mail size={14} /> {viewModal.email || 'N/A'}</span>
                  </div>
                </div>
                <button onClick={() => setViewModal(null)} className="text-white/70 hover:text-white transition p-1">
                  <X size={28} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar">
              <div className="space-y-8">
                {/* Review Text */}
                <div className="bg-blue-50/50 rounded-2xl p-5 md:p-6 border border-blue-100 relative">
                  <span className="absolute -top-3 left-6 bg-blue-900 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Student Message</span>
                  <p className="text-gray-700 italic text-base md:text-lg leading-relaxed font-medium">
                    "{viewModal.reviewText}"
                  </p>
                </div>

                {/* Ratings Grid */}
                <div>
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-5 flex items-center gap-3">
                    Detailed Performance Ratings
                    <div className="h-px bg-gray-100 flex-1"></div>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4">
                    {[
                      { label: 'Teaching Quality', value: viewModal.teachingQuality },
                      { label: 'Personal Attention', value: viewModal.personalAttention },
                      { label: 'Test System', value: viewModal.testSystem },
                      { label: 'Overall Experience', value: viewModal.overallExperience },
                      { label: 'Concept Clarity', value: viewModal.conceptClarity },
                      { label: 'Doubt Solving', value: viewModal.doubtSolving },
                      { label: 'Study Material', value: viewModal.studyMaterial },
                      { label: 'Confidence Boost', value: viewModal.improvementInConfidence },
                      { label: 'Structured Planning', value: viewModal.structuredPlanning },
                      { label: 'Exam Practice', value: viewModal.examOrientedPractice },
                      { label: 'Reinforcement', value: viewModal.reinforcementClasses },
                      { label: 'Overall Satisfaction', value: viewModal.overallSatisfaction },
                      { label: 'Batch Advantage', value: viewModal.batchSizeAdvantage },
                      { label: 'Indiv. Monitoring', value: viewModal.individualMonitoring },
                      { label: 'Teacher Experience', value: viewModal.teacherExperience },
                      { label: 'Result Improvement', value: viewModal.resultImprovement },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1 border-b border-gray-50 group hover:border-blue-100 transition-colors">
                        <span className="text-xs font-bold text-gray-500 group-hover:text-blue-900 transition-colors">{item.label}</span>
                        {renderStars(item.value)}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Meta Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Overall Score</p>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-black text-blue-900">{viewModal.overallRating}/5</span>
                      {renderStars(viewModal.overallRating)}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Status Tracking</p>
                    <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black border uppercase shadow-sm ${getStatusStyle(viewModal.status)}`}>
                      {viewModal.status}
                    </span>
                    {viewModal.rejectionReason && (
                      <p className="text-[10px] text-red-500 mt-1 font-bold italic">Reason: {viewModal.rejectionReason}</p>
                    )}
                    {viewModal.submittedAt && (
                      <p className="text-[10px] text-gray-500 mt-1 font-medium">Submitted: {new Date(viewModal.submittedAt).toLocaleDateString()}</p>
                    )}
                    {viewModal.publishedAt && (
                      <p className="text-[10px] text-green-600 mt-0.5 font-medium">Published: {new Date(viewModal.publishedAt).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 md:p-6 bg-gray-50 border-t shrink-0 flex flex-wrap items-center justify-center sm:justify-end gap-3">
              <button
                onClick={() => setViewModal(null)}
                className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-all text-sm active:scale-95"
              >
                Close View
              </button>

              {viewModal.status?.toUpperCase() === 'PENDING' && (
                <>
                  <button
                    onClick={() => handleReject(viewModal.id)}
                    className="px-6 py-2.5 rounded-xl font-bold text-white bg-orange-600 hover:bg-orange-700 transition-all text-sm shadow-md active:scale-95 flex items-center gap-2"
                  >
                    <X size={16} strokeWidth={3} /> Reject Review
                  </button>
                  <button
                    onClick={() => handleApprove(viewModal.id)}
                    className="px-6 py-2.5 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 transition-all text-sm shadow-md active:scale-95 flex items-center gap-2"
                  >
                    <Check size={16} strokeWidth={3} /> Approve & Publish
                  </button>
                </>
              )}

              <button
                onClick={() => handleDelete(viewModal.id)}
                className="px-6 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-all text-sm shadow-md active:scale-95 flex items-center gap-2"
              >
                <Trash2 size={16} strokeWidth={2} /> Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
