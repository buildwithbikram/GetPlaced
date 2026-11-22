
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

function StudentJobs() {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [jobType, setJobType] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await api.get('/jobs');
        setJobs(response.data.jobs || []);
      } catch (err) {
        console.error('Jobs loading error:', err);

        setError(
          err.response?.data?.message ||
            'Unable to load job opportunities.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const companies = useMemo(() => {
    const uniqueCompanies = new Map();

    jobs.forEach((job) => {
      if (job.company?._id) {
        uniqueCompanies.set(job.company._id, job.company.name);
      }
    });

    return Array.from(uniqueCompanies, ([id, name]) => ({
      id,
      name,
    }));
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    const query = search.toLowerCase().trim();

    return jobs.filter((job) => {
      const matchesSearch = [
        job.title,
        job.company?.name,
        job.location,
        ...(job.requiredSkills || []),
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));

      const matchesType =
        jobType === 'all' || job.jobType === jobType;

      const matchesCompany =
        companyFilter === 'all' ||
        job.company?._id === companyFilter;

      return matchesSearch && matchesType && matchesCompany;
    });
  }, [jobs, search, jobType, companyFilter]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Get<span className="text-indigo-600">Placed</span>
            </h1>

            <p className="mt-1 text-xs text-gray-500">
              Placement Opportunities
            </p>
          </div>

          <button
            onClick={() => navigate('/student/dashboard')}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700"
          >
            ← Dashboard
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <div>
          <p className="text-sm font-semibold text-indigo-600">
            Find your next opportunity
          </p>

          <h2 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
            Browse Jobs
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Discover placement opportunities matching your career goals.
          </p>
        </div>

        <section className="mt-7 grid gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:grid-cols-3">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search job, company, skill..."
            className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />

          <select
            value={jobType}
            onChange={(event) => setJobType(event.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
          >
            <option value="all">All job types</option>
            {[...new Set(jobs.map((job) => job.jobType).filter(Boolean))].map(
              (type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              )
            )}
          </select>

          <select
            value={companyFilter}
            onChange={(event) => setCompanyFilter(event.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
          >
            <option value="all">All companies</option>

            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </section>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-sm text-gray-500">
            Loading opportunities...
          </div>
        ) : (
          <>
            <div className="mb-5 mt-7 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {filteredJobs.length} opportunities found
              </p>

              <button
                onClick={() => {
                  setSearch('');
                  setJobType('all');
                  setCompanyFilter('all');
                }}
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Clear filters
              </button>
            </div>

            {filteredJobs.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center">
                <div className="text-4xl">💼</div>

                <h3 className="mt-3 font-semibold text-gray-800">
                  No matching jobs found
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Try changing your search or filters.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredJobs.map((job) => (
                  <article
                    key={job._id}
                    className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-xl">
                        💼
                      </div>

                      <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
                        Open
                      </span>
                    </div>

                    <h3 className="mt-5 text-lg font-bold text-gray-900">
                      {job.title}
                    </h3>

                    <p className="mt-1 text-sm font-medium text-indigo-600">
                      {job.company?.name || 'Company'}
                    </p>

                    <div className="mt-5 space-y-2 text-sm text-gray-500">
                      <p>📍 {job.location || 'Location not specified'}</p>
                      <p>◷ {job.jobType}</p>
                      <p>
                        ₹{' '}
                        {job.packageLPA != null
                          ? `${job.packageLPA} LPA`
                          : 'Package not specified'}
                      </p>
                      <p>
                        Deadline: {formatDate(job.applicationDeadline)}
                      </p>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {(job.requiredSkills || []).slice(0, 3).map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => navigate(`/student/jobs/${job._id}`)}
                      className="mt-auto rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                    >
                      View Job Details →
                    </button>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default StudentJobs;
