import { useEffect, useState } from 'react';
import api from '../../services/api';

const initialFormData = {
  name: '',
  description: '',
  website: '',
  industry: '',
  location: '',
};

const formatDate = (date) => {
  if (!date) return 'Not available';

  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

function AdminCompanies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Fetch companies whenever filters or pagination change.
  useEffect(() => {
    let isMounted = true;

    const fetchCompanies = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await api.get('/companies/admin/all', {
          params: {
            search,
            status: statusFilter,
            page,
            limit: 8,
          },
        });

        if (!isMounted) return;

        setCompanies(response.data.companies || []);
        setTotalCompanies(response.data.totalCompanies || 0);
        setTotalPages(Math.max(1, response.data.totalPages || 1));
      } catch (err) {
        console.error('Admin companies fetch error:', err);

        if (isMounted) {
          setError(
            err.response?.data?.message ||
              'Unable to load companies.'
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCompanies();

    return () => {
      isMounted = false;
    };
  }, [search, statusFilter, page, refreshKey]);

  const handleSearch = (e) => {
    e.preventDefault();

    const nextSearch = searchInput.trim();

    setPage(1);

    if (nextSearch === search) {
      setRefreshKey((current) => current + 1);
    } else {
      setSearch(nextSearch);
    }
  };

  const openCreateModal = () => {
    setEditingCompany(null);
    setFormData(initialFormData);
    setFormError('');
    setSuccessMessage('');
    setModalOpen(true);
  };

  const openEditModal = (company) => {
    setEditingCompany(company);

    setFormData({
      name: company.name || '',
      description: company.description || '',
      website: company.website || '',
      industry: company.industry || '',
      location: company.location || '',
    });

    setFormError('');
    setSuccessMessage('');
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingCompany(null);
    setFormData(initialFormData);
    setFormError('');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setFormError('Company name is required.');
      return;
    }

    try {
      setSaving(true);
      setFormError('');
      setError('');
      setSuccessMessage('');

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        website: formData.website.trim(),
        industry: formData.industry.trim(),
        location: formData.location.trim(),
      };

      if (editingCompany) {
        const response = await api.put(
          `/companies/${editingCompany._id}`,
          payload
        );

        setSuccessMessage(
          response.data.message || 'Company updated successfully.'
        );
      } else {
        const response = await api.post('/companies', payload);

        setSuccessMessage(
          response.data.message || 'Company created successfully.'
        );
      }

      setModalOpen(false);
      setEditingCompany(null);
      setFormData(initialFormData);
      setPage(1);
      setRefreshKey((current) => current + 1);
    } catch (err) {
      console.error('Company save error:', err);

      setFormError(
        err.response?.data?.message ||
          'Unable to save company details.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (company) => {
    const nextStatus = !company.isActive;

    const confirmed = window.confirm(
      `Are you sure you want to ${
        nextStatus ? 'activate' : 'deactivate'
      } ${company.name}?`
    );

    if (!confirmed) return;

    try {
      setError('');
      setSuccessMessage('');

      const response = await api.patch(
        `/companies/${company._id}/status`,
        {
          isActive: nextStatus,
        }
      );

      setSuccessMessage(
        response.data.message ||
          'Company status updated successfully.'
      );

      setRefreshKey((current) => current + 1);
    } catch (err) {
      console.error('Company status update error:', err);

      setError(
        err.response?.data?.message ||
          'Unable to update company status.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Page Header */}
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-indigo-600">
              Admin / Management
            </p>

            <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
              Company Management
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Manage registered companies and their availability.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            + Add Company
          </button>
        </div>

        {/* Statistics */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Companies Matching Filter
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {totalCompanies}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Current Page
            </p>

            <p className="mt-2 text-3xl font-bold text-indigo-600">
              {page} / {totalPages}
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <section className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <form
            onSubmit={handleSearch}
            className="flex flex-col gap-4 lg:flex-row"
          >
            <div className="flex-1">
              <label
                htmlFor="companySearch"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Search Companies
              </label>

              <input
                id="companySearch"
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name, industry or location..."
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="w-full lg:w-52">
              <label
                htmlFor="companyStatus"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Company Status
              </label>

              <select
                id="companyStatus"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="all">All Companies</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                Search
              </button>

              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setSearch('');
                  setStatusFilter('all');
                  setPage(1);
                  setRefreshKey((current) => current + 1);
                }}
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
              >
                Reset
              </button>
            </div>
          </form>
        </section>

        {/* Messages */}
        {successMessage && (
          <div className="mb-5 rounded-xl bg-green-50 p-4 text-sm font-medium text-green-700">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Company Listing */}
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Registered Companies
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Showing {companies.length} of {totalCompanies} companies
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-sm text-gray-500">
              Loading companies...
            </div>
          ) : companies.length === 0 ? (
            <div className="rounded-xl bg-gray-50 px-5 py-16 text-center">
              <p className="text-base font-semibold text-gray-700">
                No companies found
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Try changing your search or status filter.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {companies.map((company) => (
                <div
                  key={company._id}
                  className="rounded-xl border border-gray-100 p-5 transition hover:border-indigo-100 hover:shadow-sm"
                >
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">

                    {/* Company Information */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-bold text-gray-900">
                          {company.name}
                        </h3>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            company.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {company.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                            Industry
                          </p>

                          <p className="mt-1 text-sm font-medium text-gray-700">
                            {company.industry || 'Not specified'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                            Location
                          </p>

                          <p className="mt-1 text-sm font-medium text-gray-700">
                            {company.location || 'Not specified'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                            Created On
                          </p>

                          <p className="mt-1 text-sm font-medium text-gray-700">
                            {formatDate(company.createdAt)}
                          </p>
                        </div>
                      </div>

                      {company.description && (
                        <p className="mt-4 line-clamp-2 text-sm leading-6 text-gray-500">
                          {company.description}
                        </p>
                      )}

                      {company.website && (
                        <a
                          href={
                            /^https?:\/\//i.test(company.website)
                              ? company.website
                              : `https://${company.website}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-block break-all text-sm font-medium text-indigo-600 hover:text-indigo-800"
                        >
                          {company.website}
                        </a>
                      )}
                    </div>

                    {/* Company Actions */}
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <button
                        type="button"
                        onClick={() => openEditModal(company)}
                        className="rounded-lg border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleStatus(company)}
                        className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                          company.isActive
                            ? 'border border-red-200 text-red-600 hover:bg-red-50'
                            : 'border border-green-200 text-green-700 hover:bg-green-50'
                        }`}
                      >
                        {company.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalCompanies > 0 && (
            <div className="mt-7 flex flex-col justify-between gap-4 border-t border-gray-100 pt-5 sm:flex-row sm:items-center">
              <p className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => current - 1)}
                  disabled={page <= 1}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() => setPage((current) => current + 1)}
                  disabled={page >= totalPages}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Create / Edit Company Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-auto w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingCompany ? 'Edit Company' : 'Add New Company'}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Enter the company information below.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close modal"
                className="rounded-lg px-3 py-2 text-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid gap-5 sm:grid-cols-2">

                <div className="sm:col-span-2">
                  <label
                    htmlFor="companyName"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Company Name *
                  </label>

                  <input
                    id="companyName"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="e.g. Microsoft"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="companyIndustry"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Industry
                  </label>

                  <input
                    id="companyIndustry"
                    name="industry"
                    type="text"
                    value={formData.industry}
                    onChange={handleFormChange}
                    placeholder="e.g. Information Technology"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="companyLocation"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Location
                  </label>

                  <input
                    id="companyLocation"
                    name="location"
                    type="text"
                    value={formData.location}
                    onChange={handleFormChange}
                    placeholder="e.g. Bengaluru, India"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="companyWebsite"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Website
                  </label>

                  <input
                    id="companyWebsite"
                    name="website"
                    type="text"
                    value={formData.website}
                    onChange={handleFormChange}
                    placeholder="https://www.example.com"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="companyDescription"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Description
                  </label>

                  <textarea
                    id="companyDescription"
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleFormChange}
                    placeholder="Write a short description of the company..."
                    className="w-full resize-y rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {formError && (
                <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                  {formError}
                </p>
              )}

              <div className="mt-7 flex flex-col-reverse justify-end gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? 'Saving...'
                    : editingCompany
                      ? 'Save Changes'
                      : 'Create Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCompanies;