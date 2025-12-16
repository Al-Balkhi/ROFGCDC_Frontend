import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI, profileAPI } from '../services/api';
import FormInput from '../components/FormInput';
import OTPInput from '../components/OTPInput';
import useAuthStore from '../store/authStore';
import { useToast } from '../components/ToastContainer';

const Activate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setProfile } = useAuthStore();
  const { addToast } = useToast();
  
  const [step, setStep] = useState(1); 
  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // -------------------------------
  // طلب رمز التفعيل
  // -------------------------------
  const handleRequestOTP = async (e) => {
    if (e) e.preventDefault();
    
    if (!email.trim()) {
      setErrors({ email: 'البريد الإلكتروني مطلوب' });
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrors({ email: 'البريد الإلكتروني غير صحيح' });
      return;
    }

    setLoading(true);
    try {
      await authAPI.requestInitialSetupOTP(email);
      addToast('تم إرسال رمز التحقق إلى بريدك الإلكتروني', 'success');
      setStep(2);
      setErrors({});
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'فشل إرسال رمز التحقق';
      addToast(errorMessage, 'error');
      setErrors({ email: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------
  // التحقق من صحة الخانات
  // -------------------------------
  const validateConfirm = () => {
    const newErrors = {};
    
    if (!otp || otp.length !== 5) newErrors.otp = 'يجب إدخال رمز التحقق (5 أرقام)';
    if (!password) newErrors.password = 'كلمة المرور مطلوبة';
    else if (password.length < 8) newErrors.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
    if (!confirmPassword) newErrors.confirmPassword = 'تأكيد كلمة المرور مطلوب';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'كلمات المرور غير متطابقة';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // -------------------------------
  // تأكيد التفعيل
  // -------------------------------
  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!validateConfirm()) return;

    setLoading(true);
    try {
      await authAPI.confirmInitialSetup(email, otp, password, confirmPassword);
      addToast('تم تفعيل الحساب بنجاح', 'success');

      // تسجيل الدخول تلقائياً
      await authAPI.login(email, password);

      // جلب المعلومات
      const profileResponse = await profileAPI.getProfile();
      setProfile(profileResponse.data);

      // توجيه حسب الدور
      const role = profileResponse.data.role;
      if (role === 'admin') navigate('/dashboard/admin');
      else if (role === 'planner') navigate('/dashboard/planner');
      else navigate('/dashboard/admin');
      
    } catch (error) {
      const msg = error.response?.data?.detail || 'فشل تفعيل الحساب';
      addToast(msg, 'error');

      if (error.response?.data?.otp) {
        setErrors({ otp: error.response.data.otp[0] });
      } else if (error.response?.data?.password) {
        setErrors({ password: error.response.data.password[0] });
      } else {
        setErrors({ general: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          تفعيل الحساب
        </h1>
        
        {step === 1 ? (
          <form onSubmit={handleRequestOTP}>
            <FormInput
              label="البريد الإلكتروني"
              type="email"
              name="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors({});
              }}
              error={errors.email}
              placeholder="أدخل بريدك الإلكتروني"
              required
              disabled={loading}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'جاري الإرسال...' : 'إرسال رمز التحقق'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleConfirm}>
            
            <p className="text-sm text-gray-600 mb-3">
              تم إرسال رمز التحقق إلى: <strong>{email}</strong>
            </p>

            <OTPInput value={otp} onChange={setOtp} error={errors.otp} />

            <p
              onClick={handleRequestOTP}
              className="text-xs text-blue-600 cursor-pointer hover:underline mb-3 mt-1"
            >
              لم يصلك الرمز؟ اطلب رمزاً جديداً
            </p>

            <FormInput
              label="كلمة المرور الجديدة"
              type="password"
              name="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((prev) => ({ ...prev, password: '' }));
              }}
              error={errors.password}
              placeholder="أدخل كلمة المرور الجديدة"
              required
            />

            <FormInput
              label="تأكيد كلمة المرور"
              type="password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrors((prev) => ({ ...prev, confirmPassword: '' }));
              }}
              error={errors.confirmPassword}
              placeholder="أعد إدخال كلمة المرور"
              required
            />

            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
              >
                رجوع
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'جاري التفعيل...' : 'تفعيل الحساب'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Activate;
