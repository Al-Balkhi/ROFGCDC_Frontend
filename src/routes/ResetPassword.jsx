import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../services/api';
import FormInput from '../components/FormInput';
import OTPInput from '../components/OTPInput';
import { useToast } from '../components/ToastContainer';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  
  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    
    if (!email.trim()) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'البريد الإلكتروني غير صحيح';
    }
    
    if (!otp || otp.length !== 5) {
      newErrors.otp = 'يجب إدخال رمز التحقق (5 أرقام)';
    }
    
    if (!newPassword) {
      newErrors.newPassword = 'كلمة المرور الجديدة مطلوبة';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'تأكيد كلمة المرور مطلوب';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'كلمات المرور غير متطابقة';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      await authAPI.confirmPasswordReset(email, otp, newPassword);
      addToast('تم إعادة تعيين كلمة المرور بنجاح', 'success');
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'فشل إعادة تعيين كلمة المرور';
      addToast(errorMessage, 'error');
      
      if (error.response?.data?.otp) {
        setErrors({ otp: error.response.data.otp[0] });
      } else if (error.response?.data?.new_password) {
        setErrors({ newPassword: error.response.data.new_password[0] });
      } else {
        setErrors({ general: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          إعادة تعيين كلمة المرور
        </h1>
        
        <form onSubmit={handleSubmit}>
          <FormInput
            label="البريد الإلكتروني"
            type="email"
            name="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((prev) => ({ ...prev, email: '' }));
            }}
            error={errors.email}
            placeholder="أدخل بريدك الإلكتروني"
            required
            autoComplete="email"
          />

          <OTPInput
            value={otp}
            onChange={setOtp}
            error={errors.otp}
          />

          <FormInput
            label="كلمة المرور الجديدة"
            type="password"
            name="newPassword"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setErrors((prev) => ({ ...prev, newPassword: '' }));
            }}
            error={errors.newPassword}
            placeholder="أدخل كلمة المرور الجديدة"
            required
            autoComplete="new-password"
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
            autoComplete="new-password"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'جاري إعادة التعيين...' : 'إعادة تعيين كلمة المرور'}
          </button>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              العودة إلى تسجيل الدخول
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;

