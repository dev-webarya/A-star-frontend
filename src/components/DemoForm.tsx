import React, { useState, useEffect } from 'react';
import { Send, Calendar, Clock, Edit3, Check } from 'lucide-react';
import { demoApi } from '../api/demoApi';
import toast from 'react-hot-toast';

interface FormData {
  studentName: string;
  parentName: string;
  grade: string;
  board: string;
  email: string;
  mobileNumber: string;
  preferredDate: string;
  preferredTime: string;
}

interface Grade {
  id: string;
  name: string;
  displayName: string;
}

interface Board {
  id: string;
  name: string;
  displayName: string;
}

interface DemoFormProps {
  onSuccess?: () => void;
}

const DemoForm: React.FC<DemoFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState<FormData>({
    studentName: '',
    parentName: '',
    grade: '',
    board: '',
    email: '',
    mobileNumber: '',
    preferredDate: '',
    preferredTime: ''
  });

  const [grades, setGrades] = useState<Grade[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingGrades, setLoadingGrades] = useState(true);
  const [loadingBoards, setLoadingBoards] = useState(true);
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  // Auto-close success modal after 3 seconds
  useEffect(() => {
    if (isSubmitted) {
      const timer = setTimeout(() => {
        setIsSubmitted(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSubmitted]);

  // Load grades and boards on component mount
  useEffect(() => {
    const loadSettings = async () => {
      // Clear old storage keys to ensure new IDs are picked up
      localStorage.removeItem('icfy_demo_grades');
      localStorage.removeItem('icfy_demo_boards');
      localStorage.removeItem('icfy_demo_grades_v2');
      localStorage.removeItem('icfy_demo_boards_v2');
      localStorage.removeItem('icfy_demo_grades_v3');
      localStorage.removeItem('icfy_demo_boards_v3');

      const fallbackGrades: Grade[] = [
        { id: "69f59c3b7fba777198d8f380", name: "Grade 8", displayName: "Grade 8" },
        { id: "69f59c3b7fba777198d8f381", name: "Grade 9", displayName: "Grade 9" },
        { id: "69f59c3b7fba777198d8f382", name: "Grade 10", displayName: "Grade 10" },
        { id: "69f59c3b7fba777198d8f383", name: "Grade 11", displayName: "Grade 11" },
        { id: "69f59c3b7fba777198d8f384", name: "Grade 12", displayName: "Grade 12" }
      ];
      const fallbackBoards: Board[] = [
        { id: "69f59c3b7fba777198d8f379", name: "AS level and A level", displayName: "AS level and A level" },
        { id: "69f59c3b7fba777198d8f37b", name: "IGCSE", displayName: "IGCSE" }
      ];

      try {
        const [gradesResult, boardsResult] = await Promise.allSettled([
          demoApi.getGrades(),
          demoApi.getBoards()
        ]);

        const gradesData = gradesResult.status === 'fulfilled' && (Array.isArray(gradesResult.value) || (gradesResult.value as any)?.data)
          ? (Array.isArray(gradesResult.value) ? gradesResult.value : (gradesResult.value as any).data).map((g: any) => ({ ...g, displayName: g.displayName || g.name }))
          : fallbackGrades;

        const boardsData = boardsResult.status === 'fulfilled' && (Array.isArray(boardsResult.value) || (boardsResult.value as any)?.data)
          ? (Array.isArray(boardsResult.value) ? boardsResult.value : (boardsResult.value as any).data)
            .map((b: any) => ({ ...b, displayName: b.displayName || b.name }))
          : fallbackBoards;

        setGrades(gradesData);
        setBoards(boardsData);

        if (gradesResult.status === 'rejected' || boardsResult.status === 'rejected') {
          console.warn('Demo form settings loaded with fallback data:', {
            gradesError: gradesResult.status === 'rejected' ? gradesResult.reason : null,
            boardsError: boardsResult.status === 'rejected' ? boardsResult.reason : null
          });
        }
      } catch (error) {
        console.error('Failed to load demo settings:', error);
        setGrades(fallbackGrades);
        setBoards(fallbackBoards);
        toast.error('Failed to load form options. Using local defaults.');
      } finally {
        setLoadingGrades(false);
        setLoadingBoards(false);
      }
    };

    loadSettings();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'email' || name === 'mobileNumber') {
      setIsOtpVerified(false);
      setOtpStep(false);
      setOtp('');
    }
  };

  const handleSendOtp = async () => {
    if (!formData.mobileNumber || formData.mobileNumber.length !== 10) {
      toast.error('Please fill correct 10 digit mobile number');
      return;
    }

    if (!/^\d{10}$/.test(formData.mobileNumber)) {
      toast.error('Please fill correct 10 digit mobile number');
      return;
    }

    if (!formData.email) {
      toast.error('Please enter your email address to receive OTP');
      return;
    }

    setOtpTimer(300); // 5 minutes

    setLoading(true);
    try {
      const response = await demoApi.sendDemoOtp(formData.email);
      console.log('OTP Response:', response);

      // Request succeeded, show OTP field
      setOtpStep(true);
      setIsOtpVerified(false);
      const successMsg = response?.message || '✅ OTP sent successfully! Please check your email.';
      toast.success(successMsg);

      // Start timer
      const timer = setInterval(() => {
        setOtpTimer(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      console.error('OTP send error:', error);
      const errorMsg = error.message || 'Failed to send OTP. Please try again.';
      toast.error(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.mobileNumber || formData.mobileNumber.length !== 10) {
      toast.error('Please fill correct 10 digit mobile number');
      return;
    }

    if (!otpStep) {
      toast.error('Please request an OTP first');
      return;
    }

    if (!otp || otp.length !== 6) {
      toast.error('Please enter the 6-digit OTP sent to your email');
      return;
    }

    setLoading(true);

    try {
      const demoRequest = {
        studentName: formData.studentName,
        parentName: formData.parentName,
        gradeId: String(formData.grade),
        boardId: String(formData.board),
        emailId: formData.email,
        mobileNumber: formData.mobileNumber,
        preferredDate: formData.preferredDate,
        preferredTime: formData.preferredTime,
        otp: otp,
        scheduledAt: `${formData.preferredDate}T${formData.preferredTime}:00`
      };

      console.log('Submitting Demo Schedule (includes OTP verification):', demoRequest);

      await demoApi.scheduleDemo(demoRequest);

      setIsSubmitted(true);
      setOtpStep(false);
      setOtp('');
      toast.success('✅ Demo scheduled successfully!');
      setTimeout(() => onSuccess?.(), 3000);
    } catch (error: any) {
      console.error('Demo scheduling error:', error);
      const errorMsg = error.message || 'Failed to schedule demo. Please check your OTP and try again.';
      toast.error(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="demo-form max-w-md mt-10 mx-auto bg-white rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 relative">
        {isSubmitted && (
          <div className="absolute inset-0 bg-white rounded-2xl flex flex-col items-center justify-center p-8 text-center z-10 animate-in fade-in duration-300">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <Check className="w-10 h-10 text-green-600" strokeWidth={3} />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Thank You!</h3>
            <p className="text-gray-600 font-medium leading-relaxed">Your demo has been scheduled successfully. Our team will contact you shortly.</p>
          </div>
        )}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Schedule Your Free Demo</h3>
          <p className="text-gray-600">Experience our teaching methodology with a personalized demo class</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Student Name *
            </label>
            <input
              type="text"
              name="studentName"
              value={formData.studentName}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Enter student's full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parent Name *
            </label>
            <input
              type="text"
              name="parentName"
              value={formData.parentName}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Enter parent's full name"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grade *
              </label>
              <select
                name="grade"
                value={formData.grade}
                onChange={handleInputChange}
                required
                disabled={loadingGrades || otpStep || isOtpVerified}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:bg-gray-100"
              >
                <option value="">
                  {loadingGrades ? 'Loading grades...' : 'Select Grade'}
                </option>
                {grades.map((grade) => (
                  <option key={grade.id} value={grade.id}>
                    {grade.displayName || grade.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Board *
              </label>
              <select
                name="board"
                value={formData.board}
                onChange={handleInputChange}
                required
                disabled={loadingBoards || otpStep || isOtpVerified}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:bg-gray-100"
              >
                <option value="">
                  {loadingBoards ? 'Loading boards...' : 'Select Board'}
                </option>
                {boards.map((board) => (
                  <option key={board.id} value={board.id}>
                    {board.displayName || board.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Date *
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="preferredDate"
                  value={formData.preferredDate}
                  onChange={handleInputChange}
                  required
                  disabled={otpStep || isOtpVerified}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none ${(otpStep || isOtpVerified) ? 'bg-gray-100' : ''}`}
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Time *
              </label>
              <div className="relative">
                <input
                  type="time"
                  name="preferredTime"
                  value={formData.preferredTime}
                  onChange={handleInputChange}
                  required
                  disabled={otpStep || isOtpVerified}
                  className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none ${(otpStep || isOtpVerified) ? 'bg-gray-100' : ''}`}
                />
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mobile Number *
            </label>
            <input
              type="tel"
              name="mobileNumber"
              value={formData.mobileNumber}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                setFormData(prev => ({ ...prev, mobileNumber: val }));
                setIsOtpVerified(false);
                setOtpStep(false);
              }}
              onBlur={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                if (val.length > 0 && val.length !== 10) {
                  toast.error('Please fill correct 10 digit mobile number');
                }
              }}
              required
              placeholder="Enter 10-digit mobile number"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              maxLength={10}
              disabled={otpStep || isOtpVerified}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email ID *
            </label>
            <div className="flex space-x-2">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={otpStep}
                className={`flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${otpStep ? 'bg-gray-100' : ''}`}
                placeholder="student@email.com"
              />
              {!otpStep && (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send OTP'}
                </button>
              )}
            </div>
          </div>

          {otpStep && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 shadow-inner">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-blue-800">
                    Enter 6-Digit OTP sent to your email *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpStep(false);
                      setOtp('');
                    }}
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" /> Edit Details
                  </button>
                </div>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    if (val.length <= 6) setOtp(val);
                  }}
                  maxLength={6}
                  className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-center text-xl tracking-widest font-bold"
                  placeholder="000000"
                  inputMode="numeric"
                />
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-3">
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-blue-600">
                      {otpTimer > 0 ? (
                        <>Resend available in <span className="font-bold">{formatTime(otpTimer)}</span></>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={loading}
                          className="text-blue-700 font-bold hover:underline disabled:opacity-50 flex items-center gap-1"
                        >
                          <Send size={12} /> Resend OTP
                        </button>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500 pt-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="consent"
                    required
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="consent" className="text-sm text-gray-600">
                    I agree to be contacted via phone, WhatsApp, and email for demo scheduling and course information.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white py-4 rounded-lg font-black text-sm hover:from-blue-700 hover:to-blue-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 uppercase tracking-widest shadow-lg"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Schedule Free Demo</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>

        <div className="mt-6 text-center">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>100% secure & spam-free</span>
          </div>
        </div>
      </div>
  );
};

export default DemoForm;