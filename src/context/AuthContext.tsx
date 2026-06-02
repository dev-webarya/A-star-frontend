import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import toast from 'react-hot-toast';
import { clearActiveApiBaseUrl } from '../api/runtimeApiBase.ts';
import { adminLogin as apiAdminLogin, loginWithPassword as apiUserLogin, requestUserOTP, verifyUserOTP, logout as apiLogout } from '../api/api/authApi.js';
import { getMe } from '../api/api/accountApi.js';

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
        const init = async () => {
            try {
                const storedUser = localStorage.getItem(USER_STORAGE_KEY);
                const storedRole = localStorage.getItem(ROLE_STORAGE_KEY) as User['role'] | null;
                const token = localStorage.getItem(TOKEN_STORAGE_KEY);

                if (storedUser && storedRole && token) {
                    try {
                        const account = await getMe();
                        if (account) {
                            const verifiedUser: User = {
                                id: account.id,
                                fullName: account.name || account.fullName,
                                email: account.email,
                                role: storedRole,
                            };
                            setUser(verifiedUser);
                            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(verifiedUser));
                            return;
                        }
                    } catch {
                        // Server error — keep localStorage data, don't force logout
                        const parsed = JSON.parse(storedUser) as Omit<User, 'role'>;
                        setUser({ ...parsed, role: storedRole });
                        return;
                    }
                }
            } catch {
                localStorage.removeItem(USER_STORAGE_KEY);
                localStorage.removeItem(TOKEN_STORAGE_KEY);
                localStorage.removeItem(ROLE_STORAGE_KEY);
            } finally {
                setIsLoading(false);
            }
        };
        init();
    }, []);

    const login = async (email: string, password: string): Promise<AuthResult> => {
        try {
            // Try admin login first if it looks like an admin email or just try both
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
            } catch {
                // If admin login fails, try user login
                console.log('Admin login failed, trying user login...');
                const result = await apiUserLogin(email, password);
                if (result.token) {
                    const studentUser: User = {
                        id: result.user?.id || 'user-id',
                        fullName: result.user?.name || result.user?.fullName || 'Student',
                        email: result.user?.email || email,
                        role: 'student',
                    };
                    setUser(studentUser);
                    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(studentUser));
                    localStorage.setItem(ROLE_STORAGE_KEY, 'student');
                    return { success: true, isAdmin: false };
                }
            }
            return { success: false, message: 'Invalid credentials' };
        } catch (error: any) {
            console.error('Login failed:', error);
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
        toast.success('Logged out successfully. See you again!');
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
