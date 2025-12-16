import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import FormInput from '../components/FormInput';
import AvatarUploader from '../components/AvatarUploader';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useToast } from '../components/ToastContainer';

const Profile = () => {
  const navigate = useNavigate();
  const { user, setProfile } = useAuthStore();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'password'
  
  const [profileData, setProfileData] = useState({
    username: '',
    phone: '',
    image_profile: null,
  });
  
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_new_password: '',
  });
  
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || '',
        phone: user.phone || '',
        image_profile: user.image_profile || null,
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (file) => {
    setProfileData((prev) => ({ ...prev, image_profile: file }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateProfile = () => {
    const newErrors = {};
    if (!profileData.username.trim()) {
      newErrors.username = 'اسم المستخدم مطلوب';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors = {};
    if (!passwordData.old_password) {
      newErrors.old_password = 'كلمة المرور الحالية مطلوبة';
    }
    if (!passwordData.new_password) {
      newErrors.new_password = 'كلمة المرور الجديدة مطلوبة';
    } else if (passwordData.new_password.length < 8) {
      newErrors.new_password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
    }
    if (!passwordData.confirm_new_password) {
      newErrors.confirm_new_password = 'تأكيد كلمة المرور مطلوب';
    } else if (passwordData.new_password !== passwordData.confirm_new_password) {
      newErrors.confirm_new_password = 'كلمات المرور غير متطابقة';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!validateProfile()) return;

    setLoading(true);
    try {
      const submitData = new FormData();
      submitData.append('username', profileData.username);
      submitData.append('phone', profileData.phone || '');
      if (profileData.image_profile instanceof File) {
        submitData.append('image_profile', profileData.image_profile);
      }

      const response = await profileAPI.updateProfile(submitData);
      setProfile(response.data);
      addToast('تم تحديث الملف الشخصي بنجاح', 'success');
    } catch (error) {
      const errorData = error.response?.data || {};
      setErrors(errorData);
      addToast('فشل تحديث الملف الشخصي', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;

    setLoading(true);
    try {
      await profileAPI.changePassword(
        passwordData.old_password,
        passwordData.new_password,
        passwordData.confirm_new_password
      );
      addToast('تم تغيير كلمة المرور بنجاح', 'success');
      setPasswordData({
        old_password: '',
        new_password: '',
        confirm_new_password: '',
      });
      setErrors({});
    } catch (error) {
      const errorData = error.response?.data || {};
      setErrors(errorData);
      addToast('فشل تغيير كلمة المرور', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header onMenuClick={() => {}} />
      <main className="flex-1 p-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            رجوع
          </button>
          <h1 className="text-2xl font-bold text-gray-800 mb-6">الملف الشخصي</h1>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex gap-4 px-6">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`py-4 px-2 border-b-2 font-medium text-sm ${
                    activeTab === 'profile'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  المعلومات الشخصية
                </button>
                <button
                  onClick={() => setActiveTab('password')}
                  className={`py-4 px-2 border-b-2 font-medium text-sm ${
                    activeTab === 'password'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  تغيير كلمة المرور
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'profile' ? (
                <form onSubmit={handleUpdateProfile}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      البريد الإلكتروني
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                    />
                    <p className="mt-1 text-xs text-gray-500">لا يمكن تغيير البريد الإلكتروني</p>
                  </div>

                  <AvatarUploader
                    value={profileData.image_profile}
                    onChange={handleImageChange}
                    error={errors.image_profile}
                  />

                  <FormInput
                    label="اسم المستخدم"
                    type="text"
                    name="username"
                    value={profileData.username}
                    onChange={handleProfileChange}
                    error={errors.username}
                    required
                  />

                  <FormInput
                    label="رقم الهاتف"
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    error={errors.phone}
                  />

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleChangePassword}>
                  <FormInput
                    label="كلمة المرور الحالية"
                    type="password"
                    name="old_password"
                    value={passwordData.old_password}
                    onChange={handlePasswordChange}
                    error={errors.old_password}
                    required
                    autoComplete="current-password"
                  />

                  <FormInput
                    label="كلمة المرور الجديدة"
                    type="password"
                    name="new_password"
                    value={passwordData.new_password}
                    onChange={handlePasswordChange}
                    error={errors.new_password}
                    required
                    autoComplete="new-password"
                  />

                  <FormInput
                    label="تأكيد كلمة المرور الجديدة"
                    type="password"
                    name="confirm_new_password"
                    value={passwordData.confirm_new_password}
                    onChange={handlePasswordChange}
                    error={errors.confirm_new_password}
                    required
                    autoComplete="new-password"
                  />

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;

