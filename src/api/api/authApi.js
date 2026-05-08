import api from './api';

/**
 * User Journey (OTP Login)
 */

// Step 1: Request OTP
export const requestUserOTP = async (email, isResend = false) => {
  try {
    const response = await api.post('/api/auth/start', { email, isResend });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Step 2: Verify OTP & Get Token
export const verifyUserOTP = async (data) => {
  try {
    // data: { email, otp, name (opt), mobile (opt) }
    const response = await api.post('/api/auth/verify', data);
    if (response.data.token) {
      localStorage.setItem('icfy_token', response.data.token);
      localStorage.setItem('icfy_user', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Admin Journey (Email/Password)
 */

// Admin Login
export const adminLogin = async (email, password) => {
  try {
    const response = await api.post('/api/admin/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('icfy_token', response.data.token);
      localStorage.setItem('icfy_role', 'admin');
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Admin Login OTP (Request)
export const requestAdminLoginOTP = async (email) => {
  try {
    const response = await api.post('/api/admin/auth/login-otp/request', { email });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Admin Login OTP (Verify)
export const verifyAdminLoginOTP = async (data) => {
  try {
    // data: { email, otp }
    const response = await api.post('/api/admin/auth/login-otp/verify', data);
    if (response.data.token) {
      localStorage.setItem('icfy_token', response.data.token);
      localStorage.setItem('icfy_role', 'admin');
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Admin Forgot Password (Request OTP)
export const adminForgotPassword = async (email) => {
  try {
    const response = await api.post('/api/admin/auth/forgot-password', { email });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Admin Reset Password
export const adminResetPassword = async (data) => {
  try {
    // data: { email, otp, newPassword }
    const response = await api.post('/api/admin/auth/reset-password', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const logout = () => {
  localStorage.removeItem('icfy_token');
  localStorage.removeItem('icfy_user');
  localStorage.removeItem('icfy_role');
  localStorage.removeItem('adminAuth');
};
