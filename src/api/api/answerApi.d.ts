/* eslint-disable @typescript-eslint/no-explicit-any */
export function getApprovedAnswersByQuestion(questionId: string | number): Promise<any[]>;
export function submitAnswer(data: Record<string, any>): Promise<any>;
export function submitAnswerPublic(data: Record<string, any>): Promise<any>;
export function getMediaSignature(): Promise<any>;
export function getAdminAnswers(params?: Record<string, any>): Promise<any>;
export function approveAnswer(id: string | number): Promise<any>;
export function rejectAnswer(id: string | number, reason: string): Promise<any>;
export function deleteAnswer(id: string | number): Promise<any>;
