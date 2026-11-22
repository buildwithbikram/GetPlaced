import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  college: '',
  branch: '',
  cgpa: '',
  graduationYear: '',
  backlogs: 0,
  skills: [],
  projects: [],
  certifications: [],
};

function TagEditor({ title, items, onAdd, onRemove, placeholder }) {
  const [value, setValue] = useState('');

  const handleAdd = () => {
    const cleanedValue = value.trim();

    if (!cleanedValue) return;

    if (
      items.some(
        (item) => item.toLowerCase() === cleanedValue.toLowerCase()
      )
    ) {
      return;
    }

    onAdd(cleanedValue);
    setValue('');
  };

  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold text-gray-800">
        {title}
      </h3>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              handleAdd();
            }
          }}
          placeholder={placeholder}
          className="min-w-0 flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />

        <button
          type="button"
          onClick={handleAdd}
          className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          + Add
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700"
          >
            {item}

            <button
              type="button"
              onClick={() => onRemove(index)}
              aria-label={`Remove ${item}`}
              className="font-bold text-indigo-400 hover:text-red-600"
            >
              ×
            </button>
          </span>
        ))}

        {items.length === 0 && (
          <p className="text-sm text-gray-400">
            Nothing added yet.
          </p>
        )}
      </div>
    </section>
  );
}

function FormField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  min,
  max,
  readOnly = false,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-semibold text-gray-700"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        max={max}
        readOnly={readOnly}
        step={type === 'number' ? 'any' : undefined}
        className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 ${
          readOnly
            ? 'cursor-not-allowed border-gray-100 bg-gray-100 text-gray-500'
            : 'border-gray-200 bg-white'
        }`}
      />
    </div>
  );
}

function StudentProfile() {
  const navigate = useNavigate();
  const { user, token, login } = useAuth();

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await api.get('/profile');
        const profile = response.data.user;

        if (!isMounted) return;

        setForm({
          name: profile.name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          college: profile.college || '',
          branch: profile.branch || '',
          cgpa: profile.cgpa ?? '',
          graduationYear: profile.graduationYear ?? '',
          backlogs: profile.backlogs ?? 0,
          skills: Array.isArray(profile.skills)
            ? profile.skills
            : [],
          projects: Array.isArray(profile.projects)
            ? profile.projects
            : [],
          certifications: Array.isArray(profile.certifications)
            ? profile.certifications
            : [],
        });
      } catch (err) {
        if (!isMounted) return;

        console.error('Profile loading error:', err);

        setError(
          err.response?.data?.message ||
            'Unable to load your profile. Please try again.'
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError('');
    setSuccess('');
  };

  const updateArray = (field, updatedItems) => {
    setForm((previous) => ({
      ...previous,
      [field]: updatedItems,
    }));

    setSuccess('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError('');
    setSuccess('');

    const cgpa = form.cgpa === '' ? undefined : Number(form.cgpa);
    const graduationYear =
      form.graduationYear === ''
        ? undefined
        : Number(form.graduationYear);
    const backlogs = Number(form.backlogs);

    if (cgpa !== undefined && (cgpa < 0 || cgpa > 10)) {
      setError('CGPA must be between 0 and 10.');
      return;
    }

    if (
      graduationYear !== undefined &&
      (!Number.isInteger(graduationYear) ||
        graduationYear < 2000 ||
        graduationYear > 2100)
    ) {
      setError('Please enter a valid graduation year.');
      return;
    }

    if (!Number.isInteger(backlogs) || backlogs < 0) {
      setError('Backlogs cannot be negative.');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        college: form.college.trim(),
        branch: form.branch.trim(),
        cgpa,
        graduationYear,
        backlogs,
        skills: form.skills,
        projects: form.projects,
        certifications: form.certifications,
      };

      const response = await api.put('/profile', payload);
      const updatedUser = response.data.user;

      // Keep the global authentication context in sync.
      if (token && updatedUser) {
        login(token, updatedUser);
      }

      setSuccess(
        response.data.message || 'Profile updated successfully!'
      );
    } catch (err) {
      console.error('Profile update error:', err);

      setError(
        err.response?.data?.message ||
          'Unable to save your profile. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
          <p className="mt-4 text-sm text-gray-500">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5 sm:px-8">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Get<span className="text-indigo-600">Placed</span>
            </h1>

            <p className="mt-1 text-xs text-gray-500">
              Student Profile Management
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/student/dashboard')}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            ← Dashboard
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
        <div className="mb-8">
          <p className="text-sm font-medium text-indigo-600">
            Your account
          </p>

          <h2 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
            Manage your profile
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Keep your academic details and achievements up to date
            so recruiters can understand your background.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal details */}
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                Personal Information
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Your basic contact information.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                label="Full Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your full name"
              />

              <FormField
                label="Email Address"
                name="email"
                value={form.email}
                onChange={handleChange}
                readOnly
              />

              <FormField
                label="Phone Number"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
              />

              <FormField
                label="College / University"
                name="college"
                value={form.college}
                onChange={handleChange}
                placeholder="Enter your college name"
              />
            </div>
          </section>

          {/* Academic details */}
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                Academic Information
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Your education and academic performance.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                label="Branch"
                name="branch"
                value={form.branch}
                onChange={handleChange}
                placeholder="e.g. Computer Science"
              />

              <FormField
                label="CGPA (out of 10)"
                name="cgpa"
                type="number"
                min="0"
                max="10"
                value={form.cgpa}
                onChange={handleChange}
                placeholder="e.g. 8.5"
              />

              <FormField
                label="Graduation Year"
                name="graduationYear"
                type="number"
                min="2000"
                max="2100"
                value={form.graduationYear}
                onChange={handleChange}
                placeholder="e.g. 2027"
              />

              <FormField
                label="Active Backlogs"
                name="backlogs"
                type="number"
                min="0"
                value={form.backlogs}
                onChange={handleChange}
                placeholder="e.g. 0"
              />
            </div>
          </section>

          {/* Skills */}
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                Technical Skills
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Add technologies, programming languages and tools you know.
              </p>
            </div>

            <TagEditor
              title="Your Skills"
              items={form.skills}
              onAdd={(item) =>
                updateArray('skills', [...form.skills, item])
              }
              onRemove={(index) =>
                updateArray(
                  'skills',
                  form.skills.filter((_, i) => i !== index)
                )
              }
              placeholder="e.g. React, JavaScript, MongoDB"
            />
          </section>

          {/* Projects */}
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                Projects
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Add your academic, personal and professional projects.
              </p>
            </div>

            <TagEditor
              title="Your Projects"
              items={form.projects}
              onAdd={(item) =>
                updateArray('projects', [...form.projects, item])
              }
              onRemove={(index) =>
                updateArray(
                  'projects',
                  form.projects.filter((_, i) => i !== index)
                )
              }
              placeholder="e.g. GetPlaced — MERN placement management system"
            />
          </section>

          {/* Certifications */}
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                Certifications
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Add relevant courses and certifications you've completed.
              </p>
            </div>

            <TagEditor
              title="Your Certifications"
              items={form.certifications}
              onAdd={(item) =>
                updateArray('certifications', [
                  ...form.certifications,
                  item,
                ])
              }
              onRemove={(index) =>
                updateArray(
                  'certifications',
                  form.certifications.filter((_, i) => i !== index)
                )
              }
              placeholder="e.g. Meta Front-End Developer Certificate"
            />
          </section>

          {/* Save */}
          <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate('/student/dashboard')}
              className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-indigo-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default StudentProfile;
