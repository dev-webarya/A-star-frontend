import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';

const Login = () => {
  const navigate = useNavigate();
  const { login, requestOtp, verifyOtp } = useAuth();
  const [useOtpLogin, setUseOtpLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; otp?: string; form?: string }>({});
  const [message, setMessage] = useState('');

  const validateEmail = (value: string) => {
    if (!value.trim()) return 'Email is required.';
    if (!/\S+@\S+\.\S+/.test(value.trim())) return 'Please enter a valid email address.';
    return undefined;
  };

  const handlePasswordLogin = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    const validationErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      validationErrors.email = 'Email or username is required.';
    }

    if (!password) {
      validationErrors.password = 'Password is required.';
    } else if (password.length < 6) {
      validationErrors.password = 'Password must be at least 6 characters.';
    }

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    const result = await login(email.trim(), password);
    setIsSubmitting(false);

    if (!result.success) {
      setErrors({ form: result.message || 'Login failed. Please try again.' });
      return;
    }

    navigate(result.isAdmin ? '/admin-dashboard' : '/');
  };

  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    const emailError = validateEmail(email);
    const validationErrors: { email?: string } = {};

    if (emailError) {
      validationErrors.email = emailError;
    }

    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    const result = await requestOtp(email.trim(), false);
    setIsSubmitting(false);

    if (!result.success) {
      setErrors({ form: result.message || 'Unable to send OTP. Please try again.' });
      return;
    }

    setMessage(result.message || 'OTP sent. Check your email.');
    setOtpStep(true);
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    const validationErrors: { otp?: string } = {};

    if (!otp.trim()) {
      validationErrors.otp = 'OTP is required.';
    } else if (!/^\d{6}$/.test(otp.trim())) {
      validationErrors.otp = 'OTP must be a 6-digit number.';
    }

    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    const result = await verifyOtp(email.trim(), otp.trim());
    setIsSubmitting(false);

    if (!result.success) {
      setErrors({ form: result.message || 'OTP verification failed. Please try again.' });
      return;
    }

    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-blue-800">Login</h2>
          <button
            type="button"
            onClick={() => {
              setUseOtpLogin((prev) => !prev);
              setErrors({});
              setMessage('');
              setOtpStep(false);
              setOtp('');
            }}
            className="text-sm text-blue-700 hover:underline"
          >
            {/* {useOtpLogin ? 'Use password login' : 'Use OTP login'} */}
            {useOtpLogin ? 'Use password login' : ''}
          </button>
        </div>

        {errors.form && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 mb-4">{errors.form}</p>}
        {message && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 mb-4">{message}</p>}

        {useOtpLogin ? (
          <form className="space-y-4" onSubmit={otpStep ? handleVerifyOtp : handleSendOtp}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`mt-1 block w-full px-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Enter your email"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            {otpStep && (
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                  OTP Code
                </label>
                <input
                  type="text"
                  id="otp"
                  value={otp}
                  maxLength={6}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className={`mt-1 block w-full px-3 py-2 border ${errors.otp ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="Enter the 6-digit OTP"
                />
                {errors.otp && <p className="text-red-500 text-sm mt-1">{errors.otp}</p>}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-800 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
            >
              {isSubmitting ? (otpStep ? 'Verifying OTP...' : 'Sending OTP...') : otpStep ? 'Verify OTP' : 'Send OTP'}
            </button>

            {otpStep && (
              <button
                type="button"
                onClick={() => {
                  setOtpStep(false);
                  setOtp('');
                  setErrors({});
                  setMessage('');
                }}
                className="w-full text-center text-gray-600 underline"
              >
                Change email
              </button>
            )}
          </form>
        )
          :
          (
            <form className="mt-6 space-y-4" onSubmit={handlePasswordLogin}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email or Username
                </label>
                <input
                  type="text"
                  id="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`mt-1 block w-full px-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="Enter your email or username"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`mt-1 block w-full px-3 py-2 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="Enter your password"
                />
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-800 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
              >
                {isSubmitting ? 'Logging in...' : 'Login'}
              </button>
              <div className="text-right">
                <Link to="/reset-password" className="text-sm text-blue-700 hover:underline">
                  Forgot Password?
                </Link>
              </div>
            </form>
          )}

        <p className="mt-4 text-sm text-center text-gray-600">
          Don't have an account?{' '}
          <Link to="/signup" className="text-blue-800 hover:underline">
            Sign Up
          </Link>
        </p>
        <p className="mt-3 text-center text-xs text-gray-500">
          OTP login works for student accounts. Password login is for admin access.
        </p>
      </div>
    </div>
  );
};

export default Login;