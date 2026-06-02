/* eslint-disable @typescript-eslint/no-explicit-any */
export function getActiveClasses(params?: Record<string, any>): Promise<any[]>;
export function getClassById(id: string | number): Promise<any>;
export function enrollInClass(classId: string | number, data: Record<string, any>): Promise<any>;
export function getMyEnrollments(): Promise<any[]>;
export function cancelMyEnrollment(enrollmentId: string | number): Promise<any>;
export function getAllClassesAdmin(params?: { page?: number; size?: number }): Promise<any>;
export function createClassAdmin(data: Record<string, any>): Promise<any>;
export function updateClassAdmin(id: string | number, data: Record<string, any>): Promise<any>;
export function deleteClassAdmin(id: string | number): Promise<any>;
export function getAllEnrollmentsAdmin(params?: { page?: number; size?: number }): Promise<any>;
export function getEnrollmentByIdAdmin(id: string | number): Promise<any>;
export function getClassByIdAdmin(id: string | number): Promise<any>;
export function confirmEnrollmentAdmin(id: string | number): Promise<any>;
export function rejectEnrollmentAdmin(id: string | number, reason: string): Promise<any>;
export function deleteEnrollmentAdmin(id: string | number): Promise<any>;
