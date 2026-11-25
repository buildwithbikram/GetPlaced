import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';

const statusStyles = {
  applied: 'bg-blue-100 text-blue-700',
  'under-review': 'bg-amber-100 text-amber-700',
  shortlisted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  withdrawn: 'bg-gray-100 text-gray-600',
};

const formatStatus = (status) => {
  const labels = {
    applied: 'Applied',
    'under-review': 'Under Review',
    shortlisted: 'Shortlisted',
    rejected: 'Rejected',
    withdrawn: 'Withdrawn',
  };

  return labels[status] || status;
};

function AdminApplicants() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalApplications, setTotalApplications] = useState(0);

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get(
        `/applications/admin/jobs/${jobId}/applicants`,
        {
          params: {
            page,
            limit: 10,
            ...(status ? { status } : {}),
          },
        }
      );

      const data = response.data;

      setJob(data.job);
      setApplications(data.applications || []);
      setTotalPages(data.totalPages || 1);
      setTotalApplications(data.totalApplications || 0);
    } catch (err) {
      console.error('Admin applicants error:', err);

      setError(
        err.response?.data?.message ||
        'Unable to load applicants. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, [jobId, page, status]);

  const handleStatusFilter = (newStatus) => {
    setStatus(newStatus);
    setPage(1);
  };

  const formatDate = (date) => {
    if (!date) return 'Not available';

    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading && !job) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">
        Loading applicants...
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className="min-h-screen bg-gray-50 px-5 py-20 text-center">
        <p className="text-red-600">{error}</p>

        <button
          onClick={() => navigate(-1)}
          className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="mb-5 text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            ← Back
          </button>

          <div className="rounded-2xl bg-linear-to-r from-indigo-600 to-violet-600 p-6 text-white shadow-lg sm:p-8">
            <p className="text-sm font-medium text-indigo-100">
              Admin / Applicant Management
            </p>

            <h1 className="mt-3 text-2xl font-bold sm:text-3xl">
              {job?.title || 'Job Applicants'}
            </h1>

            <p className="mt-2 text-sm text-indigo-100">
              {job?.company?.name || 'Company'}
              {job?.location ? ` • ${job.location}` : ''}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <div className="rounded-xl bg-white/15 px-4 py-3">
                <p className="text-xs text-indigo-100">
                  Applicants
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {totalApplications}
                </p>
              </div>

              <div className="rounded-xl bg-white/15 px-4 py-3">
                <p className="text-xs text-indigo-100">
                  Current Page
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {page} / {totalPages}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Applicant list */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">

          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Applicants
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Review students who applied for this opportunity.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={status}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">All Applicants</option>
                <option value="applied">Applied</option>
                <option value="under-review">Under Review</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="rejected">Rejected</option>
                <option value="withdrawn">Withdrawn</option>
              </select>

              <button
                onClick={fetchApplicants}
                disabled={loading}
                className="rounded-xl bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-sm text-gray-500">
              Loading applicants...
            </div>
          ) : applications.length === 0 ? (
            <div className="rounded-xl bg-gray-50 px-5 py-14 text-center">
              <div className="text-4xl">📋</div>

              <h3 className="mt-4 text-lg font-semibold text-gray-800">
                No applicants found
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                {status
                  ? `There are no applicants with the status "${formatStatus(status)}".`
                  : 'No students have applied for this job yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-212.5 text-left">
                <thead>
                  <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-4 font-semibold">
                      Student
                    </th>
                    <th className="px-4 py-4 font-semibold">
                      Academic Details
                    </th>
                    <th className="px-4 py-4 font-semibold">
                      Applied On
                    </th>
                    <th className="px-4 py-4 font-semibold">
                      Status
                    </th>
                    <th className="px-4 py-4 font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {applications.map((application) => {
                    const student = application.student || {};

                    return (
                      <tr
                        key={application._id}
                        className="transition hover:bg-gray-50"
                      >
                        <td className="px-4 py-5">
                          <p className="font-semibold text-gray-900">
                            {student.name || 'Unknown Student'}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            {student.email || 'No email'}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            {student.phone || 'No phone number'}
                          </p>
                        </td>

                        <td className="px-4 py-5">
                          <p className="text-sm font-medium text-gray-800">
                            {student.branch || 'Branch not available'}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            CGPA: {student.cgpa ?? 'N/A'}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            Backlogs: {student.backlogs ?? 'N/A'}
                          </p>
                        </td>

                        <td className="px-4 py-5 text-sm text-gray-600">
                          {formatDate(application.appliedAt)}
                        </td>

                        <td className="px-4 py-5">
                          <span
                            className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${
                              statusStyles[application.status] ||
                              'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {formatStatus(application.status)}
                          </span>
                        </td>

                        <td className="px-4 py-5">
                          <button
                            onClick={() =>
                              navigate(
                                `/admin/applications/${application._id}`
                              )
                            }
                            className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && totalApplications > 0 && (
            <div className="mt-6 flex flex-col justify-between gap-4 border-t border-gray-100 pt-5 sm:flex-row sm:items-center">
              <p className="text-sm text-gray-500">
                Showing page {page} of {totalPages}
                {' '}• {totalApplications} applicants
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => setPage((current) => current - 1)}
                  disabled={page <= 1 || loading}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <button
                  onClick={() => setPage((current) => current + 1)}
                  disabled={page >= totalPages || loading}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminApplicants;
