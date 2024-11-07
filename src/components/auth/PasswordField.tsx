import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { validatePassword } from '../../lib/auth';

interface PasswordFieldProps {
  password: string;
  onChange: (value: string) => void;
  showValidation?: boolean;
}

export default function PasswordField({ password, onChange, showValidation = true }: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const validation = validatePassword(password);

  return (
    <div>
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-4 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="Enter password"
          required
          minLength={8}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        >
          {showPassword ? (
            <EyeOff className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
        </button>
      </div>
      
      {showValidation && password && (
        <ul className="mt-2 space-y-1 text-sm text-gray-500 dark:text-gray-400">
          <li className={`flex items-center gap-1 ${password.length >= 8 ? 'text-green-500' : ''}`}>
            • At least 8 characters
          </li>
          <li className={`flex items-center gap-1 ${/[A-Z]/.test(password) ? 'text-green-500' : ''}`}>
            • One uppercase letter
          </li>
          <li className={`flex items-center gap-1 ${/[a-z]/.test(password) ? 'text-green-500' : ''}`}>
            • One lowercase letter
          </li>
          <li className={`flex items-center gap-1 ${/[0-9]/.test(password) ? 'text-green-500' : ''}`}>
            • One number
          </li>
          <li className={`flex items-center gap-1 ${/[!@#$%^&*]/.test(password) ? 'text-green-500' : ''}`}>
            • One special character (!@#$%^&*)
          </li>
        </ul>
      )}
    </div>
  );
}