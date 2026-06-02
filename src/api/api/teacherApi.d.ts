/* eslint-disable @typescript-eslint/no-explicit-any */
export function getPublicTeachers(): Promise<any[]>;
export function getPublicTeacherById(id: string): Promise<any>;
export function getAllTeachersAdmin(params?: Record<string, any>): Promise<any>;
export function getTeacherByIdAdmin(id: string): Promise<any>;
export function createTeacherAdmin(data: Record<string, any>): Promise<any>;
export function updateTeacherAdmin(id: string, data: Record<string, any>): Promise<any>;
export function deleteTeacherAdmin(id: string): Promise<any>;
