/* eslint-disable @typescript-eslint/no-explicit-any */
export function requestUserOTP(email: string, isResend?: boolean): Promise<any>;
export function verifyUserOTP(data: Record<string, any>): Promise<any>;
export function loginWithPassword(email: string, password: string): Promise<any>;
export function userForgotPassword(email: string): Promise<any>;
export function userResetPassword(data: Record<string, any>): Promise<any>;
export function adminLogin(email: string, password: string): Promise<any>;
export function requestAdminLoginOTP(email: string): Promise<any>;
export function verifyAdminLoginOTP(data: Record<string, any>): Promise<any>;
export function adminForgotPassword(email: string): Promise<any>;
export function adminResetPassword(data: Record<string, any>): Promise<any>;
export function logout(): void;
