import { useRef, useEffect } from 'react';

const OTPInput = ({ value, onChange, error, length = 5 }) => {
  const inputRefs = useRef([]);

  useEffect(() => {
    // Auto-focus first input
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index, e) => {
    const newValue = e.target.value.replace(/\D/g, '').slice(0, 1);
    
    if (newValue) {
      const newOTP = value.split('');
      newOTP[index] = newValue;
      const updatedOTP = newOTP.join('').padEnd(length, '');
      onChange(updatedOTP.slice(0, length));

      // Move to next input
      if (index < length - 1 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1].focus();
      }
    } else {
      // Clear current input
      const newOTP = value.split('');
      newOTP[index] = '';
      onChange(newOTP.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pastedData) {
      onChange(pastedData);
      const nextIndex = Math.min(pastedData.length, length - 1);
      if (inputRefs.current[nextIndex]) {
        inputRefs.current[nextIndex].focus();
      }
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        رمز التحقق (OTP)
        <span className="text-red-500 mr-1">*</span>
      </label>
      <div className="flex gap-2 justify-center">
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value[index] || ''}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className={`w-12 h-12 text-center text-lg font-semibold border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
            aria-label={`رمز التحقق رقم ${index + 1}`}
            aria-invalid={error ? 'true' : 'false'}
          />
        ))}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600 text-center" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default OTPInput;

