/* eslint-disable @typescript-eslint/no-explicit-any */
export function getApprovedTestimonials(): Promise<any[]>;
export function getApprovedTestimonialsByTeacher(teacherId: string): Promise<any[]>;
export function getPrimaryTestimonial(): Promise<any>;
export function submitTestimonial(data: Record<string, any>): Promise<any>;
export function getAllTestimonials(params?: Record<string, any>): Promise<any>;
export function createTestimonialAdmin(data: Record<string, any>): Promise<any>;
export function approveTestimonial(id: string | number): Promise<any>;
export function rejectTestimonial(id: string | number): Promise<any>;
export function updateTestimonial(id: string | number, data: Record<string, any>): Promise<any>;
export function setPrimaryTestimonial(id: string | number): Promise<any>;
export function deleteTestimonial(id: string | number): Promise<any>;
export function exportTestimonialsToCSV(): Promise<any>;
export function exportTestimonials(): Promise<any>;
