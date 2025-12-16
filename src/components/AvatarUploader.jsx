import { useState } from 'react';

const AvatarUploader = ({ value, onChange, error, label = 'الصورة الشخصية' }) => {
  const [preview, setPreview] = useState(value);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Call onChange with file
      onChange(file);
    }
  };

  const getImageUrl = () => {
    if (preview) {
      if (typeof preview === 'string' && preview.startsWith('http')) {
        return preview;
      }
      if (typeof preview === 'string' && preview.startsWith('data:')) {
        return preview;
      }
      if (typeof preview === 'string') {
        const baseURL = import.meta.env.VITE_BASE_API_URL || 'http://localhost:8000';
        return `${baseURL}${preview}`;
      }
    }
    return null;
  };

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="flex items-center gap-4">
        {getImageUrl() ? (
          <img
            src={getImageUrl()}
            alt="Preview"
            className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}
        <div>
          <label htmlFor="avatar-upload" className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            اختر صورة
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                handleFileChange(e);
              }
            }}
            className="hidden"
            id="avatar-upload"
          />
        </div>
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default AvatarUploader;

