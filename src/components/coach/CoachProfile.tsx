// Previous imports remain the same...

export default function CoachProfile() {
  // Previous code remains the same until the return statement...

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/coaches')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Coaches
          </button>
          <button
            onClick={() => navigate(user?.role === 'admin' ? '/' : '/coach-dashboard')}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            Dashboard
          </button>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary"
        >
          Edit Profile
        </button>
      </div>

      {/* Rest of the component remains the same... */}
    </div>
  );
}