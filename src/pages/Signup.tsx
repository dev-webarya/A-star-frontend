import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from 'react-hot-toast';
import { useAuth } from "../context/AuthContext.tsx";

const Signup = () => {
  const navigate = useNavigate();
  const { requestOtp, verifyOtp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"form" | "verify">("form");
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string; otp?: string; form?: string }>({});
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const validateForm = () => {
    const validationErrors: { name?: string; email?: string; phone?: string } = {};

    if (!name.trim()) {
      validationErrors.name = "Full name is required.";
    } else if (name.trim().length < 3) {
      validationErrors.name = "Full name should be at least 3 characters.";
    }

    if (!email.trim()) {
      validationErrors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      validationErrors.email = "Please enter a valid email address.";
    }

    if (!phone.trim()) {
      validationErrors.phone = "Mobile number is required.";
    } else if (phone.trim().length !== 10) {
      validationErrors.phone = "Mobile number must be exactly 10 digits.";
      toast.error("Mobile number must be exactly 10 digits.");
    } else if (!/^\d{10}$/.test(phone.trim())) {
      validationErrors.phone = "Enter a valid 10-digit mobile number.";
      toast.error("Please enter digits only for the mobile number.");
    }

    return validationErrors;
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await requestOtp(email.trim(), false);
      if (!result.success) {
        setErrors({ form: result.message || "Unable to send OTP. Please try again." });
        toast.error(result.message || "Unable to send OTP. Please try again.");
      } else {
        setMessage(result.message || "OTP sent. Check your email.");
        toast.success("OTP sent successfully to your email!");
        setStep("verify");
        setResendTimer(300); // 5 minutes
      }
    } catch (error: any) {
      const errorMsg = error?.message || "Failed to send OTP. Please try again.";
      setErrors({ form: errorMsg });
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors: { otp?: string } = {};

    if (!otp.trim()) {
      validationErrors.otp = "OTP is required.";
    } else if (!/^\d{6}$/.test(otp.trim())) {
      validationErrors.otp = "OTP must be a 6-digit number.";
      toast.error("Please enter a valid 6-digit OTP.");
    }

    setErrors(validationErrors);
    setMessage("");

    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const result = await verifyOtp(email.trim(), otp.trim(), name.trim(), phone.trim());
      if (!result.success) {
        const errorMsg = result.message || "OTP verification failed. Please try again.";
        setErrors({ form: errorMsg });
        toast.error(errorMsg);
      } else {
        toast.success("Signup successful! Welcome aboard.");
        navigate("/");
      }
    } catch (error: any) {
      const errorMsg = error?.message || "OTP verification failed. Please try again.";
      setErrors({ form: errorMsg });
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setErrors({});
    setMessage("");
    setIsSubmitting(true);
    try {
      const result = await requestOtp(email.trim(), true);
      if (!result.success) {
        const errorMsg = result.message || "Unable to resend OTP. Please try again.";
        setErrors({ form: errorMsg });
        toast.error(errorMsg);
      } else {
        setMessage(result.message || "OTP resent. Check your email.");
        toast.success("OTP resent successfully!");
        setResendTimer(300); // 5 minutes
      }
    } catch (error: any) {
      const errorMsg = error?.message || "Unable to resend OTP. Please try again.";
      setErrors({ form: errorMsg });
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <h2 className="text-2xl font-bold text-center text-blue-800">Sign Up</h2>
        <p className="text-center text-sm text-gray-600 mb-6">
          Create your account with OTP verification. Use the same email to login after signup.
        </p>

        {errors.form && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 mb-4">{errors.form}</p>}
        {message && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 mb-4">{message}</p>}

        {step === "form" ? (
          <form className="space-y-4" onSubmit={handleSendOtp}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`mt-1 block w-full px-3 py-2 border ${errors.name ? "border-red-500" : "border-gray-300"} rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Enter your full name"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`mt-1 block w-full px-3 py-2 border ${errors.email ? "border-red-500" : "border-gray-300"} rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Enter your email"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Mobile Number
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                maxLength={10}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                className={`mt-1 block w-full px-3 py-2 border ${errors.phone ? "border-red-500" : "border-gray-300"} rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Enter your 10-digit mobile number"
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-800 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
            >
              {isSubmitting ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={handleVerifyOtp}>
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                Verification OTP
              </label>
              <input
                type="text"
                id="otp"
                value={otp}
                maxLength={6}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className={`mt-1 block w-full px-3 py-2 border ${errors.otp ? "border-red-500" : "border-gray-300"} rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Enter the 6-digit code"
              />
              {errors.otp && <p className="text-red-500 text-sm mt-1">{errors.otp}</p>}
            </div>

            <button
              type="button"
              onClick={handleResendOtp}
              disabled={isSubmitting || resendTimer > 0}
              className={`text-sm font-semibold transition-colors ${resendTimer > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-700 hover:text-blue-900 hover:underline'}`}
            >
              {resendTimer > 0 ? `Resend OTP in ${formatTime(resendTimer)}` : 'Resend OTP'}
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-800 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
            >
              {isSubmitting ? 'Verifying OTP...' : 'Verify OTP & Create Account'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('form');
                setOtp('');
                setMessage('');
                setErrors({});
              }}
              className="w-full text-center text-gray-600 underline"
            >
              Change email or mobile
            </button>
          </form>
        )}

        <p className="mt-4 text-sm text-center text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-800 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;