import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const Header = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getAvatarUrl = () => {
    if (user?.image_profile) {
      // If it's already a full URL, return it
      if (user.image_profile.startsWith('http')) {
        return user.image_profile;
      }
      // Otherwise, construct the full URL
      const baseURL = import.meta.env.VITE_BASE_API_URL || 'http://localhost:8000';
      return `${baseURL}${user.image_profile.startsWith('/') ? '' : '/'}${user.image_profile}`;
    }
    return null;
  };

  const getInitials = () => {
    if (user?.username) {
      return user.username.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <header className="bg-white shadow-md h-16 flex items-center justify-between px-4 md:px-6 sticky top-0 z-40">
      {/* Left side - Menu button (mobile) */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="فتح القائمة"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Right side - Profile dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="قائمة المستخدم"
          aria-expanded={dropdownOpen}
        >
          {getAvatarUrl() ? (
            <img
              src={getAvatarUrl()}
              alt={user?.username || 'المستخدم'}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
              {getInitials()}
            </div>
          )}
          <span className="hidden md:block text-sm font-medium text-gray-700">
            {user?.username || user?.email || 'المستخدم'}
          </span>
          <svg
            className={`w-4 h-4 text-gray-600 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {dropdownOpen && (
          <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
            <button
              onClick={() => {
                setDropdownOpen(false);
                navigate('/profile');
              }}
              className="w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none"
            >
              تعديل الملف الشخصي
            </button>
            <button
              onClick={() => {
                setDropdownOpen(false);
                handleLogout();
              }}
              className="w-full text-right px-4 py-2 text-sm text-red-600 hover:bg-gray-100 focus:outline-none"
            >
              تسجيل الخروج
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

