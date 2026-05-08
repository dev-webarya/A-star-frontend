import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { clearActiveApiBaseUrl } from '../api/runtimeApiBase.ts';
import { adminLogin as apiAdminLogin, requestUserOTP, verifyUserOTP, logout as apiLogout } from '../api/api/authApi.js';

type User = {
    id: string;
    adminId?: string;
    fullName: string;
    email: string;
    phone?: string;
    role: 'admin' | 'student';
};

type AuthResult = {
    success: boolean;
    message?: string;
    isAdmin?: boolean;
};

type AuthContextValue = {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isAdmin: boolean;
    login: (email: string, password: string) => Promise<AuthResult>;
    signup: (fullName: string, email: string, phone: string, password: string) => AuthResult;
    logout: () => void;
    requestOtp: (email: string, isResend?: boolean) => Promise<{ success: boolean; message: string }>;
    verifyOtp: (email: string, otp: string, name?: string, mobile?: string) => Promise<AuthResult>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const USER_STORAGE_KEY = 'icfy_user';
const TOKEN_STORAGE_KEY = 'icfy_token';
const ROLE_STORAGE_KEY = 'icfy_role';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem(USER_STORAGE_KEY);
            const storedRole = localStorage.getItem(ROLE_STORAGE_KEY) as User['role'] | null;
            if (storedUser && storedRole) {
                const parsed = JSON.parse(storedUser) as Omit<User, 'role'>;
                setUser({ ...parsed, role: storedRole });
            }
        } catch {
            localStorage.removeItem(USER_STORAGE_KEY);
            localStorage.removeItem(TOKEN_STORAGE_KEY);
            localStorage.removeItem(ROLE_STORAGE_KEY);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const login = async (email: string, password: string): Promise<AuthResult> => {
        try {
            const result = await apiAdminLogin(email, password);
            if (result.token) {
                const adminUser: User = {
                    id: result.user?.id || 'admin-id',
                    fullName: result.user?.name || 'Administrator',
                    email: result.email || email,
                    role: 'admin',
                };
                setUser(adminUser);
                localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(adminUser));
                localStorage.setItem(ROLE_STORAGE_KEY, 'admin');
                return { success: true, isAdmin: true };
            }
            return { success: false, message: 'Invalid credentials' };
        } catch (error: any) {
            console.error('Admin login failed:', error);
            return { 
                success: false, 
                message: error.message || error.error || 'Invalid email or password' 
            };
        }
    };

    const requestOtp = async (email: string, isResend: boolean = false) => {
        try {
            const result = await requestUserOTP(email, isResend);
            return { success: true, message: result.message || 'OTP sent successfully' };
        } catch (error: any) {
            return { success: false, message: error.message || 'Failed to send OTP' };
        }
    };

    const verifyOtp = async (email: string, otp: string, name?: string, mobile?: string): Promise<AuthResult> => {
        try {
            const result = await verifyUserOTP({ email, otp, name, mobile });
            if (result.token) {
                const studentUser: User = {
                    id: result.user.id,
                    fullName: result.user.name,
                    email: result.user.email,
                    role: 'student',
                };
                setUser(studentUser);
                localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(studentUser));
                localStorage.setItem(ROLE_STORAGE_KEY, 'student');
                return { success: true, isAdmin: false };
            }
            return { success: false, message: 'Invalid OTP' };
        } catch (error: any) {
            return { success: false, message: error.message || 'Verification failed' };
        }
    };

    const signup = (_fullName: string, _email: string, _phone: string, _password: string): AuthResult => {
        return { success: false, message: 'Please use OTP login' };
    };

    const logout = () => {
        apiLogout();
        setUser(null);
        localStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(ROLE_STORAGE_KEY);
        localStorage.removeItem('adminAuth');
        clearActiveApiBaseUrl();
    };

    const value = useMemo<AuthContextValue>(() => ({
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        isAdmin: user?.role === 'admin',
        login,
        signup,
        logout,
        requestOtp,
        verifyOtp,
    }), [user, isLoading]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
