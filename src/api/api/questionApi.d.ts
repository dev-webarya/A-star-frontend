/* eslint-disable @typescript-eslint/no-explicit-any */
export function getQuestions(params?: Record<string, any>): Promise<any>;
export function getQuestionById(id: string | number): Promise<any>;
export function getQuestionBySlug(slug: string): Promise<any>;
export function createQuestion(data: Record<string, any>): Promise<any>;
export function updateQuestion(id: string | number, data: Record<string, any>): Promise<any>;
export function deleteQuestion(id: string | number): Promise<any>;
