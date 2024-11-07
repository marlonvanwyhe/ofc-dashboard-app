import React, { useState } from 'react';
import { Lock, AlertCircle } from 'lucide-react';
import { updatePassword } from '../../lib/auth';
import toast from 'react-hot-toast';

interface PasswordManagementProps {
  userId: string;
  userEmail: string;
  onClose: () => void;
}

export default function PasswordManagement({ userId, userEmail, onClose }: PasswordManagementProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePasswordReset = async () => {
    setError(null);
    setLoading(true);

    try {
      await updatePassword(userId, '');
      toast.success('Password reset email has been sent');
      onClose();
    } catch (error: any) {
      console.error('Password reset error:', error);
      setError(error.message || 'Failed to send password reset email');
      
      if (error.message.includes('sign in again')) {
        toast.error('Please sign in again to continue');
        // Redirect to login or handle re-authentication
      } else {
        toast.error(error.message || 'Failed to send password reset email');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
            <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-bold">Reset Password</h3>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Send password reset email to {userEmail}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handlePasswordReset}
            disabled={loading}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending Reset Email...
              </>
            ) : (
              'Send Reset Email'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}