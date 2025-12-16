import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import FormInput from '../components/FormInput';
import { useToast } from '../components/ToastContainer';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('البريد الإلكتروني مطلوب');
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('البريد الإلكتروني غير صحيح');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await authAPI.requestPasswordReset(email);
      setSuccess(true);
      addToast('تم إرسال رمز التحقق إلى بريدك الإلكتروني', 'success');
      
      // Navigate to reset password page after a short delay
      setTimeout(() => {
        navigate('/reset-password', { state: { email } });
      }, 2000);
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'فشل إرسال رمز التحقق';
      setError(errorMessage);
      addToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          نسيت كلمة المرور؟
        </h1>
        
        {success ? (
          <div className="text-center">
            <div className="text-green-600 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-600 mb-4">
              تم إرسال رمز التحقق إلى بريدك الإلكتروني
            </p>
            <p className="text-sm text-gray-500">
              سيتم توجيهك إلى صفحة إعادة تعيين كلمة المرور...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="text-gray-600 mb-4 text-center">
              أدخل بريدك الإلكتروني وسنرسل لك رمز التحقق لإعادة تعيين كلمة المرور
            </p>

            <FormInput
              label="البريد الإلكتروني"
              type="email"
              name="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              error={error}
              placeholder="أدخل بريدك الإلكتروني"
              required
              autoComplete="email"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'جاري الإرسال...' : 'إرسال رمز التحقق'}
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
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;

