
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';

function StudentCompanyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError('');

        const [companyResponse, jobsResponse] = await Promise.all([
          api.get(`/companies/${id}`),
          api.get('/jobs'),
        ]);

        const companyData = companyResponse.data.company;
        const allJobs = jobsResponse.data.jobs || [];

        setCompany(companyData);

        setJobs(
          allJobs.filter(
            (job) =>
              job.company?._id === companyData._id ||
              job.company === companyData._id
          )
        );
      } catch (err) {
        console.error('Company details error:', err);

        setError(
          err.response?.data?.message ||
            'Unable to load company details.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">
        Loading company details...
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-gray-50 px-5 py-20 text-center">
        <p className="text-red-600">
          {error || 'Company not found.'}
        </p>

        <button
          onClick={() => navigate('/student/companies')}
          className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white"
        >
          Back to Companies
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <h1 className="text-xl font-bold text-gray-900">
            Get<span className="text-indigo-600">Placed</span>
          </h1>

          <button
            onClick={() => navigate('/student/companies')}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700"
          >
            ← Companies
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        <section className="rounded-2xl bg-gradient-to-r from-indigo-700 to-violet-600 p-7 text-white sm:p-9">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/15 text-3xl">
            🏢
          </div>

          <h2 className="mt-5 text-3xl font-bold">
            {company.name}
          </h2>

          <p className="mt-2 text-sm text-indigo-100">
            {company.industry || 'Industry not specified'}
            {company.location ? ` · ${company.location}` : ''}
          </p>

          <p className="mt-5 max-w-2xl text-sm leading-7 text-indigo-100">
            {company.description || 'No company description available.'}
          </p>

          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
            >
              Visit Company Website ↗
            </a>
          )}
        </section>

        <section className="mt-9">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Available Opportunities
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Open jobs from {company.name}.
              </p>
            </div>

            <span className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700">
              {jobs.length} jobs
            </span>
          </div>

          {jobs.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-gray-100 bg-white p-10 text-center">
              <p className="text-3xl">💼</p>

              <p className="mt-3 font-semibold text-gray-800">
                No open opportunities currently
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Check again later for new openings.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {jobs.map((job) => (
                <article
                  key={job._id}
                  className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
                >
                  <h4 className="text-lg font-bold text-gray-900">
                    {job.title}
                  </h4>

                  <p className="mt-2 text-sm text-gray-500">
                    {job.location || 'Location not specified'} ·{' '}
                    {job.jobType}
                  </p>

                  <p className="mt-3 text-sm font-semibold text-indigo-600">
                    {job.packageLPA != null
                      ? `${job.packageLPA} LPA`
                      : 'Package not specified'}
                  </p>

                  <button
                    onClick={() =>
                      navigate(`/student/jobs/${job._id}`)
                    }
                    className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    View Job Details →
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default StudentCompanyDetails;
