
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

function StudentCompanies() {
  const navigate = useNavigate();

  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await api.get('/companies');
        setCompanies(response.data.companies || []);
      } catch (err) {
        console.error('Companies loading error:', err);
        setError(
          err.response?.data?.message ||
            'Unable to load companies.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  const filteredCompanies = useMemo(() => {
    const query = search.toLowerCase().trim();

    return companies.filter((company) =>
      [
        company.name,
        company.industry,
        company.location,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [companies, search]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Get<span className="text-indigo-600">Placed</span>
            </h1>
            <p className="mt-1 text-xs text-gray-500">
              Company Directory
            </p>
          </div>

          <button
            onClick={() => navigate('/student/dashboard')}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            ← Dashboard
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <div>
          <p className="text-sm font-semibold text-indigo-600">
            Explore employers
          </p>

          <h2 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
            Discover Companies
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Explore companies participating in your placement
            opportunities.
          </p>
        </div>

        <div className="mt-7">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search company, industry or location..."
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-sm text-gray-500">
            Loading companies...
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-gray-100 bg-white px-6 py-16 text-center">
            <div className="text-4xl">🏢</div>
            <h3 className="mt-3 font-semibold text-gray-800">
              No companies found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Try another search term.
            </p>
          </div>
        ) : (
          <>
            <p className="mt-6 text-sm text-gray-500">
              {filteredCompanies.length} companies found
            </p>

            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCompanies.map((company) => (
                <article
                  key={company._id}
                  className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-2xl">
                    🏢
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-gray-900">
                    {company.name}
                  </h3>

                  <p className="mt-1 text-sm text-indigo-600">
                    {company.industry || 'Industry not specified'}
                  </p>

                  <p className="mt-3 min-h-12 text-sm leading-6 text-gray-500">
                    {company.description
                      ? `${company.description.slice(0, 110)}${company.description.length > 110 ? '...' : ''}`
                      : 'Explore opportunities from this company.'}
                  </p>

                  <p className="mt-3 text-xs text-gray-500">
                    📍 {company.location || 'Location not specified'}
                  </p>

                  <button
                    onClick={() =>
                      navigate(`/student/companies/${company._id}`)
                    }
                    className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                  >
                    View Company →
                  </button>
                </article>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default StudentCompanies;
