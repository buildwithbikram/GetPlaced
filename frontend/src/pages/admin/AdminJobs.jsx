import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const initialForm = {
  title: '',
  description: '',
  company: '',
  location: '',
  jobType: 'full-time',
  packageLPA: '',
  minimumCgpa: '',
  maximumBacklogs: '0',
  eligibleBranches: '',
  eligibleGraduationYears: '',
  requiredSkills: '',
  applicationDeadline: '',
  status: 'open'
};

const formatDate = date => {
  if (!date) return 'Not specified';

  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const getDateInputValue = date => {
  if (!date) return '';

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return '';

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
  const day = String(parsedDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const formatJobType = type => {
  const labels = {
    internship: 'Internship',
    'full-time': 'Full-time',
    'part-time': 'Part-time'
  };

  return labels[type] || type;
};

const AdminJobs = () => {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState([]);

  const [loading, setLoading] = useState(true);
  const [companiesLoading, setCompaniesLoading] = useState(true);

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [jobTypeFilter, setJobTypeFilter] = useState('all');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);

  const [refreshKey, setRefreshKey] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [updatingJobId, setUpdatingJobId] = useState(null);

  // Fetch all companies for the job form.
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setCompaniesLoading(true);

        const response = await api.get('/companies');

        setCompanies(response.data.companies || []);
      } catch (err) {
        console.error('Fetch companies error:', err);
        setError('Unable to load companies for the job form.');
      } finally {
        setCompaniesLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  // Fetch jobs with search, filters and pagination.
  useEffect(() => {
    let isMounted = true;

    const fetchJobs = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await api.get('/jobs/admin/all', {
          params: {
            search,
            status: statusFilter,
            jobType: jobTypeFilter,
            page,
            limit: 8
          }
        });

        if (!isMounted) return;

        setJobs(response.data.jobs || []);
        setTotalJobs(response.data.totalJobs || 0);
        setTotalPages(response.data.totalPages || 1);
      } catch (err) {
        if (!isMounted) return;

        setError(
          err.response?.data?.message ||
          'Unable to load jobs. Please try again.'
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchJobs();

    return () => {
      isMounted = false;
    };
  }, [search, statusFilter, jobTypeFilter, page, refreshKey]);

  const handleSearch = event => {
    event.preventDefault();

    setPage(1);
    setSearch(searchInput.trim());
  };

  const openCreateModal = () => {
    setEditingJob(null);
    setForm(initialForm);
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = job => {
    setEditingJob(job);

    setForm({
      title: job.title || '',
      description: job.description || '',
      company: job.company?._id || '',
      location: job.location || '',
      jobType: job.jobType || 'full-time',
      packageLPA: job.packageLPA ?? '',
      minimumCgpa: String(job.minimumCgpa ?? ''),
      maximumBacklogs: String(job.maximumBacklogs ?? 0),
      eligibleBranches: (job.eligibleBranches || []).join(', '),
      eligibleGraduationYears: (
        job.eligibleGraduationYears || []
      ).join(', '),
      requiredSkills: (job.requiredSkills || []).join(', '),
      applicationDeadline: getDateInputValue(
        job.applicationDeadline
      ),
      status: job.status || 'open'
    });

    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingJob(null);
    setForm(initialForm);
    setFormError('');
  };

  const handleFormChange = event => {
    const { name, value } = event.target;

    setForm(previous => ({
      ...previous,
      [name]: value
    }));
  };

  const parseStringArray = value =>
    value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);

  const handleSubmit = async event => {
    event.preventDefault();

    if (saving) return;

    setFormError('');

    if (!form.title.trim() || !form.description.trim()) {
      setFormError('Job title and description are required.');
      return;
    }

    if (!form.company) {
      setFormError('Please select a company.');
      return;
    }

    if (!form.minimumCgpa.trim() || !form.applicationDeadline) {
      setFormError('Minimum CGPA and application deadline are required.');
      return;
    }

    const minimumCgpa = Number(form.minimumCgpa);
    const maximumBacklogs = Number(form.maximumBacklogs);

    const packageLPA =
      form.packageLPA.trim() === ''
        ? null
        : Number(form.packageLPA);

    if (
      !Number.isFinite(minimumCgpa) ||
      minimumCgpa < 0 ||
      minimumCgpa > 10
    ) {
      setFormError('Minimum CGPA must be between 0 and 10.');
      return;
    }

    if (
      !Number.isInteger(maximumBacklogs) ||
      maximumBacklogs < 0
    ) {
      setFormError('Maximum backlogs must be a non-negative integer.');
      return;
    }

    if (
      packageLPA !== null &&
      (!Number.isFinite(packageLPA) || packageLPA < 0)
    ) {
      setFormError('Package must be a non-negative number.');
      return;
    }

    const graduationYears = parseStringArray(
      form.eligibleGraduationYears
    ).map(Number);

    if (
      graduationYears.some(
        year =>
          !Number.isInteger(year) ||
          year < 2000 ||
          year > 2100
      )
    ) {
      setFormError('Please enter valid graduation years.');
      return;
    }

    // Store the selected date at the end of that local calendar day.
    const deadline = new Date(
      `${form.applicationDeadline}T23:59:59`
    );

    if (
      Number.isNaN(deadline.getTime()) ||
      deadline <= new Date()
    ) {
      setFormError('Application deadline must be in the future.');
      return;
    }

    const jobData = {
      title: form.title.trim(),
      description: form.description.trim(),
      company: form.company,
      location: form.location.trim(),
      jobType: form.jobType,
      packageLPA,
      minimumCgpa,
      maximumBacklogs,
      eligibleBranches: parseStringArray(form.eligibleBranches),
      eligibleGraduationYears: graduationYears,
      requiredSkills: parseStringArray(form.requiredSkills),
      applicationDeadline: deadline.toISOString(),
      status: form.status
    };

    try {
      setSaving(true);

      let response;

      if (editingJob) {
        response = await api.put(
          `/jobs/${editingJob._id}`,
          jobData
        );
      } else {
        response = await api.post('/jobs', jobData);
      }

      setSuccessMessage(
        response.data.message ||
        (editingJob
          ? 'Job updated successfully.'
          : 'Job created successfully.')
      );

      setShowModal(false);
      setEditingJob(null);
      setForm(initialForm);

      setPage(1);
      setRefreshKey(previous => previous + 1);
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
        err.response?.data?.errors?.join(', ') ||
        'Unable to save job. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async job => {
    if (updatingJobId) return;

    const isCurrentlyOpen = job.status === 'open';
    const nextStatus = isCurrentlyOpen ? 'closed' : 'open';

    if (
      nextStatus === 'open' &&
      new Date(job.applicationDeadline) <= new Date()
    ) {
      setError(
        'This job has expired. Edit its application deadline before reopening it.'
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to ${nextStatus === 'open' ? 'reopen' : 'close'} "${job.title}"?`
    );

    if (!confirmed) return;

    try {
      setUpdatingJobId(job._id);
      setError('');
      setSuccessMessage('');

    const response = await api.patch(
        `/jobs/${job._id}/status`,
        { status: nextStatus }
    );

      setSuccessMessage(
        response.data.message ||
        `Job ${nextStatus === 'open' ? 'reopened' : 'closed'} successfully.`
      );

      setRefreshKey(previous => previous + 1);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to update job status.'
      );
    } finally {
      setUpdatingJobId(null);
    }
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setStatusFilter('all');
    setJobTypeFilter('all');
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">

        {/* Page heading */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="mb-2 text-sm font-semibold text-indigo-600">
              ADMINISTRATION
            </p>

            <h1 className="text-3xl font-bold text-slate-900">
              Job Management
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Create, manage and monitor company job listings.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            + Create New Job
          </button>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>
            <button
              onClick={() => setError('')}
              className="font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <span>{successMessage}</span>
            <button
              onClick={() => setSuccessMessage('')}
              className="font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Statistics */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Total jobs matching current filters
          </p>
          <p className="mt-1 text-3xl font-bold text-slate-900">
            {totalJobs}
          </p>
        </div>

        {/* Search and filters */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <form
            onSubmit={handleSearch}
            className="mb-5 flex flex-col gap-3 sm:flex-row"
          >
            <input
              type="text"
              value={searchInput}
              onChange={event => setSearchInput(event.target.value)}
              placeholder="Search by job title, company or location..."
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />

            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Search
            </button>
          </form>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              value={statusFilter}
              onChange={event => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
            >
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={jobTypeFilter}
              onChange={event => {
                setJobTypeFilter(event.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
            >
              <option value="all">All job types</option>
              <option value="internship">Internship</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
            </select>

            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Clear filters
            </button>
          </div>
        </div>

        {/* Job listing */}
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white py-20 text-center">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
            <p className="mt-4 text-sm text-slate-500">
              Loading jobs...
            </p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-16 text-center">
            <h3 className="text-lg font-semibold text-slate-800">
              No jobs found
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Try changing your search or filters, or create a new job.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {jobs.map(job => {
              const isExpired =
                new Date(job.applicationDeadline) <= new Date();

              return (
                <div
                  key={job._id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
                >
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {job.title}
                      </h2>

                      <p className="mt-1 text-sm font-medium text-indigo-600">
                        {job.company?.name || 'Company unavailable'}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        job.status === 'open'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {job.status === 'open' ? 'Open' : 'Closed'}
                    </span>
                  </div>

                  <div className="mb-4 flex flex-wrap gap-2">
                    <span className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700">
                      {formatJobType(job.jobType)}
                    </span>

                    <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-slate-600">
                      {job.location || 'Location not specified'}
                    </span>

                    {job.packageLPA !== null &&
                      job.packageLPA !== undefined && (
                        <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                          {job.packageLPA} LPA
                        </span>
                      )}
                  </div>

                  <p className="mb-4 line-clamp-2 text-sm leading-6 text-slate-600">
                    {job.description}
                  </p>

                  <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4">
                    <div>
                      <p className="text-xs text-slate-500">
                        Minimum CGPA
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {job.minimumCgpa}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Maximum backlogs
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {job.maximumBacklogs}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Application deadline
                      </p>
                      <p className={`mt-1 text-sm font-semibold ${
                        isExpired ? 'text-red-600' : 'text-slate-800'
                      }`}>
                        {formatDate(job.applicationDeadline)}
                        {isExpired ? ' (Expired)' : ''}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Eligible branches
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {job.eligibleBranches?.length
                          ? job.eligibleBranches.join(', ')
                          : 'All branches'}
                      </p>
                    </div>
                  </div>

                  {job.requiredSkills?.length > 0 && (
                    <div className="mt-4">
                      <p className="mb-2 text-xs font-semibold text-slate-500">
                        REQUIRED SKILLS
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {job.requiredSkills.map(skill => (
                          <span
                            key={skill}
                            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-600"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                    <button
                      onClick={() => openEditModal(job)}
                      className="rounded-lg bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
                    >
                      Edit Job
                    </button>

                    <button
                      onClick={() => handleToggleStatus(job)}
                      disabled={updatingJobId === job._id}
                      className={`rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        job.status === 'open'
                          ? 'bg-red-50 text-red-700 hover:bg-red-100'
                          : 'bg-green-50 text-green-700 hover:bg-green-100'
                      }`}
                    >
                      {updatingJobId === job._id
                        ? 'Updating...'
                        : job.status === 'open'
                          ? 'Close Job'
                          : 'Reopen Job'}
                    </button>

                    <button
                      onClick={() =>
                        navigate(`/admin/jobs/${job._id}/applicants`)
                      }
                      className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                    >
                      View Applicants
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && jobs.length > 0 && (
          <div className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-slate-500">
              Page {page} of {totalPages} · {totalJobs} jobs
            </p>

            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(previous => previous - 1)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <button
                disabled={page >= totalPages}
                onClick={() => setPage(previous => previous + 1)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 sm:items-center">
          <div className="my-6 w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingJob ? 'Edit Job' : 'Create New Job'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter job details and student eligibility criteria.
                </p>
              </div>

              <button
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg px-3 py-2 text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {formError && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Job Title *
                  </label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleFormChange}
                    required
                    maxLength={150}
                    placeholder="e.g. Software Engineer"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Company *
                  </label>
                  <select
                    name="company"
                    value={form.company}
                    onChange={handleFormChange}
                    required
                    disabled={companiesLoading}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  >
                    <option value="">
                      {companiesLoading
                        ? 'Loading companies...'
                        : 'Select a company'}
                    </option>

                    {companies.map(company => (
                      <option key={company._id} value={company._id}>
                        {company.name}
                      </option>
                    ))}
                  </select>

                  {!companiesLoading && companies.length === 0 && (
                    <p className="mt-2 text-xs text-red-600">
                      No active companies found. Add or activate a company first.
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Job Type *
                  </label>
                  <select
                    name="jobType"
                    value={form.jobType}
                    onChange={handleFormChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  >
                    <option value="internship">Internship</option>
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Location
                  </label>
                  <input
                    name="location"
                    value={form.location}
                    onChange={handleFormChange}
                    placeholder="e.g. Bangalore"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Package (LPA)
                  </label>
                  <input
                    name="packageLPA"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.packageLPA}
                    onChange={handleFormChange}
                    placeholder="e.g. 8"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Minimum CGPA *
                  </label>
                  <input
                    name="minimumCgpa"
                    type="number"
                    min="0"
                    max="10"
                    step="0.01"
                    value={form.minimumCgpa}
                    onChange={handleFormChange}
                    required
                    placeholder="e.g. 7.5"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Maximum Backlogs *
                  </label>
                  <input
                    name="maximumBacklogs"
                    type="number"
                    min="0"
                    step="1"
                    value={form.maximumBacklogs}
                    onChange={handleFormChange}
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Application Deadline *
                  </label>
                  <input
                    name="applicationDeadline"
                    type="date"
                    value={form.applicationDeadline}
                    onChange={handleFormChange}
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Job Status
                  </label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleFormChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  >
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Job Description *
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleFormChange}
                    required
                    rows={4}
                    placeholder="Describe the role, responsibilities and requirements..."
                    className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Eligible Branches
                  </label>
                  <input
                    name="eligibleBranches"
                    value={form.eligibleBranches}
                    onChange={handleFormChange}
                    placeholder="CSE, IT, ECE"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Separate branches with commas. Leave blank for all branches.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Eligible Graduation Years
                  </label>
                  <input
                    name="eligibleGraduationYears"
                    value={form.eligibleGraduationYears}
                    onChange={handleFormChange}
                    placeholder="2026, 2027"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Separate years with commas.
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Required Skills
                  </label>
                  <input
                    name="requiredSkills"
                    value={form.requiredSkills}
                    onChange={handleFormChange}
                    placeholder="JavaScript, React, Node.js"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Separate skills with commas.
                  </p>
                </div>
              </div>

              <div className="mt-7 flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-5 sm:flex-row">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || companiesLoading || companies.length === 0}
                  className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? 'Saving...'
                    : editingJob
                      ? 'Save Changes'
                      : 'Create Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminJobs;
