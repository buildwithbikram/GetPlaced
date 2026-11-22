import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const navigationItems = [
  { label: 'Dashboard', icon: '▦', active: true },
  { label: 'My Profile', icon: '◉', comingSoon: false },
  { label: 'Resume', icon: '▣', comingSoon: false },
  { label: 'Browse Jobs', icon: '⌕', comingSoon: true },
  { label: 'My Applications', icon: '▤', comingSoon: true },
  { label: 'Notifications', icon: '♧', comingSoon: true },
];

function unwrapProfile(response) {
  const body = response?.data;

  return (
    body?.profile ??
    body?.data?.profile ??
    body?.data?.user ??
    body?.user ??
    body?.data ??
    body
  );
}

function unwrapApplications(response) {
  const body = response?.data;

  const result =
    body?.applications ??
    body?.data?.applications ??
    body?.data ??
    body;

  return Array.isArray(result) ? result : [];
}

function calculateProfileCompletion(profile) {
  if (!profile) return 0;

  const checks = [
    Boolean(profile.name),
    Boolean(profile.email),
    Boolean(profile.phone),
    Boolean(profile.branch),
    Boolean(profile.college),
    profile.cgpa !== undefined && profile.cgpa !== null,
    profile.graduationYear !== undefined &&
    profile.graduationYear !== null,
    Array.isArray(profile.skills) && profile.skills.length > 0,
    Array.isArray(profile.projects) && profile.projects.length > 0,
    Array.isArray(profile.certifications) &&
    profile.certifications.length > 0,
  ];

  const completed = checks.filter(Boolean).length;

  return Math.round((completed / checks.length) * 100);
}

function formatDate(date) {
  if (!date) return 'Date unavailable';

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Date unavailable';
  }

  return parsedDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getStatusStyle(status) {
  const styles = {
    applied: 'bg-blue-100 text-blue-700',
    'under-review': 'bg-yellow-100 text-yellow-700',
    shortlisted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    withdrawn: 'bg-gray-100 text-gray-600',
  };

  return styles[status] || 'bg-gray-100 text-gray-600';
}

function StatCard({ title, value, description, icon, color }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {title}
          </p>

          <h3 className="mt-3 text-3xl font-bold text-gray-900">
            {value}
          </h3>

          <p className="mt-2 text-xs text-gray-500">
            {description}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${color}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError('');

        const [profileResponse, applicationsResponse] =
          await Promise.all([
            api.get('/profile'),
            api.get('/applications/my-applications'),
          ]);

        if (!isMounted) return;

        setProfile(unwrapProfile(profileResponse));
        setApplications(unwrapApplications(applicationsResponse));
      } catch (err) {
        if (!isMounted) return;

        console.error('Dashboard loading error:', err);

        setError(
          err.response?.data?.message ||
          'Unable to load dashboard data. Please try again.'
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const totalApplications = applications.length;

  const underReview = applications.filter(
    (application) => application.status === 'under-review'
  ).length;

  const shortlisted = applications.filter(
    (application) => application.status === 'shortlisted'
  ).length;

  const rejected = applications.filter(
    (application) => application.status === 'rejected'
  ).length;

  const profileCompletion = calculateProfileCompletion(profile);

  const recentApplications = [...applications]
    .sort(
      (a, b) =>
        new Date(b.appliedAt || 0) - new Date(a.appliedAt || 0)
    )
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      {/* Sidebar */}
      <aside className="flex w-full flex-col bg-slate-950 text-white lg:min-h-screen lg:w-64 lg:shrink-0">
        <div className="border-b border-white/10 px-6 py-6">
          <h1 className="text-2xl font-bold tracking-tight">
            Get<span className="text-indigo-400">Placed</span>
          </h1>

          <p className="mt-1 text-xs text-slate-400">
            Your placement companion
          </p>
        </div>

        <div className="px-4 py-6">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Workspace
          </p>

          <nav className="space-y-1">
            {navigationItems.map((item) => (
              <button
                key={item.label}
                type="button"
                disabled={item.comingSoon}
                onClick={() => {
                  if (item.label === 'My Profile') {
                    navigate('/student/profile');
                  }
                  if (item.label === 'Resume') {
                    navigate('/student/resume');
                  }
                }}
                title={
                  item.comingSoon
                    ? 'This section will be available in an upcoming milestone.'
                    : item.label
                }
                className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-medium transition ${item.active
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50'
                  }`}
              >
                <span className="flex items-center gap-3">
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </span>

                {item.comingSoon && (
                  <span className="text-[10px] text-slate-500">
                    Soon
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto border-t border-white/10 p-4">
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500 font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || 'S'}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {user?.name || 'Student'}
              </p>

              <p className="text-xs capitalize text-slate-400">
                {user?.role || 'Student'}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full rounded-xl px-3 py-3 text-left text-sm font-medium text-red-300 transition hover:bg-red-500/10"
          >
            ↪ Log out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="min-w-0 flex-1">
        <header className="border-b border-gray-200 bg-white px-5 py-5 sm:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Student Workspace
              </p>

              <h2 className="mt-1 text-xl font-bold text-gray-900">
                Dashboard
              </h2>
            </div>

            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-gray-800">
                {user?.name}
              </p>

              <p className="text-xs text-gray-500">
                {user?.email}
              </p>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
          {/* Welcome section */}
          <section className="rounded-2xl bg-linear-to-r from-indigo-700 to-violet-600 p-6 text-white shadow-sm sm:p-8">
            <p className="text-sm font-medium text-indigo-100">
              Welcome back!
            </p>

            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
              Hello, {user?.name?.split(' ')[0] || 'Student'} 👋
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-indigo-100">
              Keep your profile updated, explore opportunities,
              and stay on track with your placement journey.
            </p>
          </section>

          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-700">
                {error}
              </p>

              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-sm font-semibold text-red-800 underline"
              >
                Reload dashboard
              </button>
            </div>
          )}

          {loading ? (
            <div className="py-20 text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />

              <p className="mt-4 text-sm text-gray-500">
                Loading your dashboard...
              </p>
            </div>
          ) : (
            <>
              {/* Statistics */}
              <section className="mt-8">
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-gray-900">
                    Application Overview
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    A quick look at your placement activity.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    title="Total Applications"
                    value={totalApplications}
                    description="Applications submitted"
                    icon="▤"
                    color="bg-blue-50 text-blue-600"
                  />

                  <StatCard
                    title="Under Review"
                    value={underReview}
                    description="Being reviewed by recruiters"
                    icon="◷"
                    color="bg-yellow-50 text-yellow-600"
                  />

                  <StatCard
                    title="Shortlisted"
                    value={shortlisted}
                    description="Moved to the next stage"
                    icon="✓"
                    color="bg-green-50 text-green-600"
                  />

                  <StatCard
                    title="Rejected"
                    value={rejected}
                    description="Applications not selected"
                    icon="×"
                    color="bg-red-50 text-red-600"
                  />
                </div>
              </section>

              {/* Profile completion */}
              <section className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Profile Completion
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      Complete your profile to help recruiters
                      understand your skills and background.
                    </p>
                  </div>

                  <p className="text-2xl font-bold text-indigo-600">
                    {profileCompletion}%
                  </p>
                </div>

                <div className="mt-5 h-3 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>

                <p className="mt-3 text-xs text-gray-500">
                  {profileCompletion === 100
                    ? 'Great work! Your profile looks complete.'
                    : 'Add your missing details to improve your profile.'}
                </p>
              </section>

              {/* Recent applications */}
              <section className="mt-8 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Recent Applications
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      Your latest job application activity.
                    </p>
                  </div>

                  <span className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700">
                    {totalApplications} total
                  </span>
                </div>

                {recentApplications.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <div className="text-4xl">📄</div>

                    <h3 className="mt-3 font-semibold text-gray-800">
                      No applications yet
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      Your submitted applications will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-150 text-left">
                      <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                        <tr>
                          <th className="px-6 py-4 font-semibold">
                            Job / Company
                          </th>

                          <th className="px-6 py-4 font-semibold">
                            Applied On
                          </th>

                          <th className="px-6 py-4 font-semibold">
                            Status
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-100">
                        {recentApplications.map((application) => {
                          const job = application.job || {};
                          const company = job.company || {};

                          const companyName =
                            typeof company === 'string'
                              ? 'Company'
                              : company.name || 'Company';

                          return (
                            <tr
                              key={application._id}
                              className="transition hover:bg-gray-50"
                            >
                              <td className="px-6 py-4">
                                <p className="font-semibold text-gray-800">
                                  {job.title || 'Job title unavailable'}
                                </p>

                                <p className="mt-1 text-xs text-gray-500">
                                  {companyName}
                                </p>
                              </td>

                              <td className="px-6 py-4 text-sm text-gray-600">
                                {formatDate(application.appliedAt)}
                              </td>

                              <td className="px-6 py-4">
                                <span
                                  className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${getStatusStyle(application.status)}`}
                                >
                                  {application.status?.replace('-', ' ') ||
                                    'Unknown'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default StudentDashboard;
