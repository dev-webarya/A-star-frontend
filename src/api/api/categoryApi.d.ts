/* eslint-disable @typescript-eslint/no-explicit-any */
export function getCategories(): Promise<any[]>;
export function getCategoryById(id: string): Promise<any>;
export function getCategoryBySlug(slug: string): Promise<any>;
export function createCategory(name: string): Promise<any>;
export function updateCategory(id: string, name: string): Promise<any>;
export function deleteCategory(id: string): Promise<any>;
