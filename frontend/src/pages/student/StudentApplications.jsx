import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

function StudentApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalApplications, setTotalApplications] = useState(0);
  const [withdrawingId, setWithdrawingId] = useState(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get(
        '/applications/my-applications',
        {
          params: {
            page,
            limit: 10,
          },
        }
      );

      setApplications(response.data.applications || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalApplications(
        response.data.totalApplications || 0
      );

    } catch (err) {
      console.error('Applications fetch error:', err);

      setError(
        err.response?.data?.message ||
          'Unable to load your applications.'
      );

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [page]);

  const formatDate = (date) => {
    if (!date) return 'Not available';

    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const statusStyles = {
    applied: 'bg-blue-100 text-blue-700',
    'under-review': 'bg-amber-100 text-amber-700',
    shortlisted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    withdrawn: 'bg-gray-100 text-gray-600',
  };

  const statusLabels = {
    applied: 'Applied',
    'under-review': 'Under Review',
    shortlisted: 'Shortlisted',
    rejected: 'Rejected',
    withdrawn: 'Withdrawn',
  };

  const handleWithdraw = async (applicationId) => {
    const confirmed = window.confirm(
      'Are you sure you want to withdraw this application? This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      setWithdrawingId(applicationId);
      setError('');
      setSuccess('');

      const response = await api.patch(
        `/applications/${applicationId}/withdraw`
      );

      setApplications((previousApplications) =>
        previousApplications.map((item) =>
          item._id === applicationId
            ? response.data.application
            : item
        )
      );

      setSuccess(
        response.data.message ||
          'Application withdrawn successfully.'
      );

    } catch (err) {
      console.error('Withdraw application error:', err);

      setError(
        err.response?.data?.message ||
          'Unable to withdraw this application.'
      );

    } finally {
      setWithdrawingId(null);
    }
  };

  const canWithdraw = (status) => {
    return ['applied', 'under-review'].includes(status);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">
          Loading your applications...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-5 py-8">

      <div className="mx-auto max-w-6xl">

        {/* Page heading */}
        <div className="mb-8">
          <p className="text-sm font-semibold text-indigo-600">
            Student Dashboard
          </p>

          <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
            My Applications
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Track your placement applications and recruitment progress.
          </p>
        </div>

        {/* Application statistics */}
        <div className="mb-7 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">

          <p className="text-sm text-gray-500">
            Total Applications
          </p>

          <p className="mt-2 text-3xl font-bold text-indigo-600">
            {totalApplications}
          </p>

        </div>

        {/* Error message */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* Empty state */}
        {applications.length === 0 ? (

          <div className="rounded-2xl border border-gray-100 bg-white px-6 py-16 text-center shadow-sm">

            <div className="text-4xl">📄</div>

            <h2 className="mt-4 text-lg font-bold text-gray-900">
              No applications yet
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Once you apply for a job, your application history will appear here.
            </p>

            <button
            onClick={() => {
                navigate('/student/jobs')}
            }
              className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Browse Jobs
            </button>

          </div>

        ) : (

          <div className="space-y-5">

            {applications.map((application) => {
              const job = application.job || {};
              const company = job.company || {};

              return (
                <div
                  key={application._id}
                  className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-md"
                >

                  {/* Job and status */}
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">

                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        {job.title || 'Job no longer available'}
                      </h2>

                      <p className="mt-1 text-sm font-medium text-indigo-600">
                        {company.name || 'Company'}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
                        <span>
                          📍 {job.location || 'Location not specified'}
                        </span>

                        {job.jobType && (
                          <span>· {job.jobType}</span>
                        )}

                        {job.packageLPA != null && (
                          <span>· {job.packageLPA} LPA</span>
                        )}
                      </div>
                    </div>

                    <span
                      className={`w-fit rounded-full px-3 py-2 text-xs font-semibold ${
                        statusStyles[application.status] ||
                        'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {statusLabels[application.status] ||
                        application.status}
                    </span>

                  </div>

                  {/* Application information */}
                  <div className="mt-6 grid gap-4 border-t border-gray-100 pt-5 sm:grid-cols-2">

                    <div>
                      <p className="text-xs text-gray-400">
                        Applied On
                      </p>

                      <p className="mt-1 text-sm font-semibold text-gray-800">
                        {formatDate(application.appliedAt)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400">
                        Application Deadline
                      </p>

                      <p className="mt-1 text-sm font-semibold text-gray-800">
                        {formatDate(job.applicationDeadline)}
                      </p>
                    </div>

                  </div>

                  {/* Status history */}
                  {application.statusHistory?.length > 0 && (
                    <div className="mt-6 border-t border-gray-100 pt-5">

                      <h3 className="text-sm font-bold text-gray-800">
                        Application Timeline
                      </h3>

                      <div className="mt-4 space-y-4">

                        {[...application.statusHistory]
                          .reverse()
                          .map((history, index) => (

                            <div
                              key={`${history.status}-${history.changedAt || index}`}
                              className="flex gap-3"
                            >

                              <div className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-indigo-500" />

                              <div>
                                <p className="text-sm font-semibold text-gray-800">
                                  {statusLabels[history.status] ||
                                    history.status}
                                </p>

                                {history.note && (
                                  <p className="mt-1 text-xs text-gray-500">
                                    {history.note}
                                  </p>
                                )}

                                <p className="mt-1 text-xs text-gray-400">
                                  {formatDate(history.changedAt)}
                                </p>
                              </div>

                            </div>

                          ))}

                      </div>

                    </div>
                  )}

                  {/* Withdraw action */}
                  {canWithdraw(application.status) && (
                    <div className="mt-6 border-t border-gray-100 pt-5">

                      <button
                        onClick={() =>
                          handleWithdraw(application._id)
                        }
                        disabled={
                          withdrawingId === application._id
                        }
                        className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {withdrawingId === application._id
                          ? 'Withdrawing...'
                          : 'Withdraw Application'}
                      </button>

                    </div>
                  )}

                </div>
              );
            })}

          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-4">

            <button
              onClick={() => setPage((previous) => previous - 1)}
              disabled={page === 1}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <span className="text-sm font-medium text-gray-600">
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => setPage((previous) => previous + 1)}
              disabled={page === totalPages}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>

          </div>
        )}

      </div>
    </div>
  );
}

export default StudentApplications;