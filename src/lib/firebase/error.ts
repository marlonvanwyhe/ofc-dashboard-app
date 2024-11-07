import toast from 'react-hot-toast';

interface FirebaseError {
  code?: string;
  message?: string;
}

export const handleError = (message: string, error?: FirebaseError | unknown) => {
  const err = error as FirebaseError;
  
  // Log error for debugging
  console.error(message, err);

  // Handle specific Firebase error codes
  if (err?.code) {
    switch (err.code) {
      case 'unavailable':
        toast.error('Connection lost. Working in offline mode...');
        break;
      case 'permission-denied':
        toast.error('You don\'t have permission to perform this action');
        break;
      case 'unauthenticated':
        toast.error('Please sign in to continue');
        break;
      case 'resource-exhausted':
        toast.error('Service temporarily unavailable. Please try again later');
        break;
      default:
        toast.error(message);
    }
  } else {
    toast.error(message);
  }
};