/* eslint-disable @typescript-eslint/no-explicit-any */
export function getContactSubjects(): Promise<any[]>;
export function submitContactForm(data: Record<string, any>): Promise<any>;
export function getAdminMessages(params?: { page?: number; size?: number }): Promise<any>;
export function updateMessageStatusAdmin(id: string | number, status: string): Promise<any>;
export function deleteMessageAdmin(id: string | number): Promise<any>;
export function getAdminSubjects(): Promise<any[]>;
export function getAdminSubjectById(id: string | number): Promise<any>;
export function createSubjectAdmin(data: Record<string, any>): Promise<any>;
export function updateSubjectAdmin(id: string | number, data: Record<string, any>): Promise<any>;
export function deleteSubjectAdmin(id: string | number): Promise<any>;
export function getContactSettingsAdmin(): Promise<any>;
export function updateContactSettingsAdmin(data: Record<string, any>): Promise<any>;
export function getContactSettingsPublic(): Promise<any>;
