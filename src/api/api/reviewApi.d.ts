/* eslint-disable @typescript-eslint/no-explicit-any */
export function sendReviewOtp(email: string): Promise<any>;
export function verifyReviewOtp(email: string, otp: string, name: string, mobile: string): Promise<any>;
export function getPublishedReviews(params?: { page?: number; size?: number }): Promise<any>;
export function getReviewById(id: string | number): Promise<any>;
export function submitReview(data: Record<string, any>): Promise<any>;
export function getMyReviews(params?: { page?: number; size?: number }): Promise<any>;
export function getAdminReviewById(id: string | number): Promise<any>;
export function getAllReviewsAdmin(params?: { page?: number; size?: number }): Promise<any>;
export function approveReview(id: string | number): Promise<any>;
export function rejectReview(id: string | number, reason: string): Promise<any>;
export function deleteReview(id: string | number): Promise<any>;
