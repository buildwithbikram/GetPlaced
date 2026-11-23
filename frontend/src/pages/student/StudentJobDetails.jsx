import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';

function StudentJobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [eligibility, setEligibility] = useState(null);
  const [error, setError] = useState('');
  const [application, setApplication] = useState(null);
  const [applying, setApplying] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState('');

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await api.get(`/jobs/${id}`);
        setJob(response.data.job);
      } catch (err) {
        console.error('Job details error:', err);

        setError(
          err.response?.data?.message ||
          'Unable to load job details.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
    fetchExistingApplication();
  }, [id]);

  const fetchExistingApplication = async () => {
    try {
      const firstResponse = await api.get(
        '/applications/my-applications',
        {
          params: {
            page: 1,
            limit: 50,
          },
        }
      );

      const firstData = firstResponse.data;

      let applications = firstData.applications || [];

      let existingApplication = applications.find(
        (item) => item.job?._id === id
      );

      // Search additional pages if necessary.
      for (
        let page = 2;
        !existingApplication && page <= firstData.totalPages;
        page++
      ) {
        const response = await api.get(
          '/applications/my-applications',
          {
            params: {
              page,
              limit: 50,
            },
          }
        );

        applications = response.data.applications || [];

        existingApplication = applications.find(
          (item) => item.job?._id === id
        );
      }

      setApplication(existingApplication || null);

    } catch (err) {
      console.error(
        'Existing application check error:',
        err
      );
    }
  };

  const checkEligibility = async () => {
    try {
      setChecking(true);
      setError('');
      setEligibility(null);

      const response = await api.post(
        `/eligibility/${id}/eligibility`
      );

      setEligibility(response.data);
    } catch (err) {
      console.error('Eligibility check error:', err);

      setError(
        err.response?.data?.message ||
        'Unable to check eligibility. Please try again.'
      );
    } finally {
      setChecking(false);
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">
        Loading job details...
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className="min-h-screen bg-gray-50 px-5 py-20 text-center">
        <p className="text-red-600">{error}</p>

        <button
          onClick={() => navigate('/student/jobs')}
          className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white"
        >
          Back to Jobs
        </button>
      </div>
    );
  }

  if (!job) return null;

  const company = job.company || {};

  const handleApply = async () => {
    if (!eligibility?.canApply || application || applying) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to apply for ${job.title} at ${company.name || 'this company'}?`
    );

    if (!confirmed) return;

    try {
      setApplying(true);
      setError('');
      setApplicationMessage('');

      const response = await api.post(
        `/applications/${id}`
      );

      setApplication(response.data.application);

      setApplicationMessage(
        response.data.message ||
        'Job application submitted successfully.'
      );

    } catch (err) {
      console.error('Job application error:', err);

      setError(
        err.response?.data?.message ||
        'Unable to submit your application. Please try again.'
      );

      // Refresh application state if the backend reports
      // that this student has already applied.
      if (err.response?.status === 409) {
        await fetchExistingApplication();
      }

    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <h1 className="text-xl font-bold text-gray-900">
            Get<span className="text-indigo-600">Placed</span>
          </h1>

          <button
            onClick={() => navigate('/student/jobs')}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700"
          >
            ← Browse Jobs
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        <section className="rounded-2xl bg-linear-to-r from-indigo-700 to-violet-600 p-7 text-white sm:p-9">
          <p className="text-sm font-medium text-indigo-100">
            {company.name || 'Placement opportunity'}
          </p>

          <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
            {job.title}
          </h2>

          <div className="mt-5 flex flex-wrap gap-3 text-sm text-indigo-100">
            <span>📍 {job.location || 'Location not specified'}</span>
            <span>· {job.jobType}</span>
            <span>
              · {job.packageLPA != null
                ? `${job.packageLPA} LPA`
                : 'Package not specified'}
            </span>
          </div>
        </section>

        <div className="mt-7 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900">
                Job Description
              </h3>

              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-gray-600">
                {job.description}
              </p>
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900">
                Eligibility Requirements
              </h3>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">Minimum CGPA</p>
                  <p className="mt-2 text-xl font-bold text-gray-900">
                    {job.minimumCgpa}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">Maximum Backlogs</p>
                  <p className="mt-2 text-xl font-bold text-gray-900">
                    {job.maximumBacklogs ?? 'Not specified'}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4 sm:col-span-2">
                  <p className="text-xs text-gray-500">
                    Eligible Branches
                  </p>

                  <p className="mt-2 text-sm font-semibold text-gray-800">
                    {job.eligibleBranches?.length
                      ? job.eligibleBranches.join(', ')
                      : 'All branches'}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4 sm:col-span-2">
                  <p className="text-xs text-gray-500">
                    Eligible Graduation Years
                  </p>

                  <p className="mt-2 text-sm font-semibold text-gray-800">
                    {job.eligibleGraduationYears?.length
                      ? job.eligibleGraduationYears.join(', ')
                      : 'All graduation years'}
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Required Skills
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {(job.requiredSkills || []).length > 0 ? (
                    job.requiredSkills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">
                      No specific skills listed.
                    </p>
                  )}
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="font-bold text-gray-900">
                Application Information
              </h3>

              <div className="mt-5 space-y-4 text-sm">
                <div>
                  <p className="text-gray-500">Application deadline</p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {formatDate(job.applicationDeadline)}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">Company</p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {company.name || 'Company'}
                  </p>
                </div>

                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    Company website ↗
                  </a>
                )}
              </div>

              <button
                onClick={checkEligibility}
                disabled={checking}
                className="mt-7 w-full rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {checking
                  ? 'Checking eligibility...'
                  : 'Check My Eligibility'}
              </button>

              <p className="mt-3 text-center text-xs text-gray-400">
                We'll compare this job's criteria with your saved profile.
              </p>
            </section>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {eligibility && (
              <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-gray-900">
                    Eligibility Result
                  </h3>

                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${eligibility.canApply
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                      }`}
                  >
                    {eligibility.canApply
                      ? 'Eligible'
                      : 'Not eligible'}
                  </span>
                </div>

                <p className="mt-3 text-sm text-gray-600">
                  {eligibility.canApply
                    ? 'Great! Your profile meets the requirements and this opportunity is open for applications.'
                    : 'Your profile does not currently meet all application conditions.'}
                </p>

                {eligibility.reasons?.length > 0 && (
                  <div className="mt-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Eligibility checks
                    </p>

                    <ul className="mt-3 space-y-2">
                      {eligibility.reasons.map((reason, index) => (
                        <li
                          key={index}
                          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
                        >
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {eligibility.missingSkills?.length > 0 && (
                  <div className="mt-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Skills to develop
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {eligibility.missingSkills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {eligibility.availabilityReasons?.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {eligibility.availabilityReasons.map(
                      (reason, index) => (
                        <li
                          key={index}
                          className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700"
                        >
                          {reason}
                        </li>
                      )
                    )}
                  </ul>
                )}

                {application ? (
                  <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">

                    <p className="font-semibold text-green-800">
                      You have already applied for this job.
                    </p>

                    <p className="mt-1 text-sm text-green-700">
                      Current status: {application.status}
                    </p>

                    <button
                      onClick={() => navigate('/student/applications')}
                      className="mt-4 w-full rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
                    >
                      View My Applications
                    </button>

                  </div>

                ) : eligibility.canApply ? (

                  <div className="mt-5">

                    <div className="rounded-xl bg-green-50 p-3 text-sm text-green-700">
                      Congratulations! You meet the eligibility requirements.
                      You can now apply for this opportunity.
                    </div>

                    <button
                      onClick={handleApply}
                      disabled={applying}
                      className="mt-4 w-full rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {applying ? 'Submitting Application...' : 'Apply Now'}
                    </button>

                  </div>

                ) : null}

                {applicationMessage && (
                  <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
                    {applicationMessage}
                  </div>
                )}
              </section>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}

export default StudentJobDetails;
