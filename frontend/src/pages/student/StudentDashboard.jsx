import { useAuth } from '../../context/AuthContext';

function StudentDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              GetPlaced
            </h1>

            <p className="text-sm text-gray-500">
              Student Dashboard
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome, {user?.name} 👋
          </h2>

          <p className="mt-2 text-gray-600">
            You are logged in to your GetPlaced student account.
          </p>

          <div className="mt-6 space-y-2 text-sm text-gray-700">
            <p>
              <strong>Email:</strong> {user?.email}
            </p>

            <p>
              <strong>Role:</strong> {user?.role}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default StudentDashboard;