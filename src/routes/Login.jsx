import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import FormInput from '../components/FormInput';
import { useToast } from '../components/ToastContainer';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { addToast } = useToast();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صحيح';
    }
    
    if (!formData.password) {
      newErrors.password = 'كلمة المرور مطلوبة';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    setLoading(true);
    const result = await login(formData.email, formData.password);
    setLoading(false);

    if (result.success) {
      addToast('تم تسجيل الدخول بنجاح', 'success');

      if (!result.user.is_active) {
        navigate('/activate');
      } else {
        if (result.user.role === 'admin') navigate('/dashboard/admin');
        else if (result.user.role === 'planner') navigate('/dashboard/planner');
        else navigate('/dashboard/admin');
      }
    } else {
      addToast(result.error || 'فشل تسجيل الدخول', 'error');

      if (result.error?.includes('initial setup')) {
        navigate('/activate', { state: { email: formData.email } });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          تسجيل الدخول
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <FormInput
            label="البريد الإلكتروني"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="أدخل بريدك الإلكتروني"
            required
            autoComplete="email"
          />

          <FormInput
            label="كلمة المرور"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            placeholder="أدخل كلمة المرور"
            required
            autoComplete="current-password"
          />

          {/* رابط نسيت كلمة المرور */}
          <div className="text-left">
            <Link
              to="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              نسيت كلمة المرور؟
            </Link>
          </div>

          {/* زر تسجيل الدخول */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>

          {/* رابط تسجيل الدخول لأول مرة - تحت الزر وفي المنتصف */}
          <div className="text-center mt-3">
            <Link
              to="/activate"
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              تسجيل الدخول لأول مرة؟
            </Link>
          </div>

        </form>
      </div>
    </div>
  );
};

export default Login;
