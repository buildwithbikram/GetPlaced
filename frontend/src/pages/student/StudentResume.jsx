
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'docx',
};

function formatFileSize(bytes) {
  if (!bytes) return 'Unknown size';

  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatDate(date) {
  if (!date) return 'Unknown date';

  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function StudentResume() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [resume, setResume] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [progress, setProgress] = useState(0);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchResume = async () => {
    try {
      const response = await api.get('/resume');
      setResume(response.data.resume || null);
    } catch (err) {
      console.error('Resume fetch error:', err);

      setError(
        err.response?.data?.message ||
          'Unable to load resume information.'
      );
    }
  };

  useEffect(() => {
    const loadResume = async () => {
      await fetchResume();
      setLoading(false);
    };

    loadResume();
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    setError('');
    setSuccess('');

    if (!file) return;

    const extension = file.name.split('.').pop().toLowerCase();

    if (!Object.values(ALLOWED_TYPES).includes(extension)) {
      setError('Only PDF, DOC and DOCX files are allowed.');
      event.target.value = '';
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('Your resume must not exceed 5 MB.');
      event.target.value = '';
      setSelectedFile(null);
      return;
    }

    const expectedType = Object.keys(ALLOWED_TYPES).find(
      (type) => ALLOWED_TYPES[type] === extension
    );

    if (file.type !== expectedType) {
      setError('The selected file has an unsupported file type.');
      event.target.value = '';
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a resume first.');
      return;
    }

    try {
      setUploading(true);
      setProgress(0);
      setError('');
      setSuccess('');

      const formData = new FormData();
      formData.append('resume', selectedFile);

      const response = await api.post('/resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (event) => {
          if (event.total) {
            setProgress(
              Math.round((event.loaded * 100) / event.total)
            );
          }
        },
      });

      setResume(response.data.resume);
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setSuccess(response.data.message);
      setProgress(100);
    } catch (err) {
      console.error('Resume upload error:', err);

      setError(
        err.response?.data?.message ||
          'Unable to upload your resume.'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setError('');

      const response = await api.get('/resume/download');

      window.open(
        response.data.downloadUrl,
        '_blank',
        'noopener,noreferrer'
      );
    } catch (err) {
      console.error('Resume download error:', err);

      setError(
        err.response?.data?.message ||
          'Unable to download your resume.'
      );
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your resume?'
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setError('');
      setSuccess('');

      const response = await api.delete('/resume');

      setResume(null);
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setSuccess(response.data.message);
    } catch (err) {
      console.error('Resume deletion error:', err);

      setError(
        err.response?.data?.message ||
          'Unable to delete your resume.'
      );
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
          <p className="mt-4 text-sm text-gray-500">
            Loading resume information...
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
              Resume Management
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

      <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
        <div className="mb-8">
          <p className="text-sm font-medium text-indigo-600">
            Career documents
          </p>

          <h2 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
            Manage your resume
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Upload and maintain the resume you want recruiters
            to review during placement drives.
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

        {/* Current resume */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900">
              Your Current Resume
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Your latest uploaded resume is stored securely.
            </p>
          </div>

          {resume ? (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-sm">
                    📄
                  </div>

                  <div className="min-w-0">
                    <p className="break-all font-semibold text-gray-900">
                      {resume.originalName}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {resume.format?.toUpperCase()} ·{' '}
                      {formatFileSize(resume.size)}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Uploaded on {formatDate(resume.uploadedAt)}
                    </p>
                  </div>
                </div>

                <span className="w-fit rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
                  Uploaded
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-3 border-t border-indigo-100 pt-5">
                <button
                  onClick={handleDownload}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  ↓ Download Resume
                </button>

                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-xl border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                >
                  {deleting ? 'Deleting...' : 'Delete Resume'}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-5 py-10 text-center">
              <div className="text-4xl">📄</div>

              <h4 className="mt-3 font-semibold text-gray-800">
                No resume uploaded yet
              </h4>

              <p className="mt-1 text-sm text-gray-500">
                Upload your resume to get started.
              </p>
            </div>
          )}
        </section>

        {/* Upload section */}
        <section className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900">
              {resume ? 'Replace Resume' : 'Upload Resume'}
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Select a new resume from your computer.
            </p>
          </div>

          <label
            htmlFor="resume-file"
            className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 px-5 py-10 text-center transition hover:border-indigo-400 hover:bg-indigo-50"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl shadow-sm">
              ↑
            </div>

            <p className="mt-4 font-semibold text-gray-800">
              Click to select your resume
            </p>

            <p className="mt-2 text-xs text-gray-500">
              PDF, DOC or DOCX · Maximum 5 MB
            </p>

            <input
              ref={fileInputRef}
              id="resume-file"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />
          </label>

          {selectedFile && (
            <div className="mt-5 flex flex-col justify-between gap-3 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center">
              <div className="min-w-0">
                <p className="break-all text-sm font-semibold text-gray-800">
                  {selectedFile.name}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  fileInputRef.current.value = '';
                }}
                disabled={uploading}
                className="text-sm font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          )}

          {uploading && (
            <div className="mt-5">
              <div className="mb-2 flex justify-between text-xs font-medium text-gray-600">
                <span>Uploading resume...</span>
                <span>{progress}%</span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading || deleting}
              className="w-full rounded-xl bg-indigo-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {uploading
                ? 'Uploading...'
                : resume
                  ? 'Replace Resume'
                  : 'Upload Resume'}
            </button>
          </div>
        </section>

        {/* Information */}
        <section className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-gray-900">
            Upload Guidelines
          </h3>

          <ul className="mt-4 space-y-3 text-sm text-gray-600">
            <li>✓ Only PDF, DOC and DOCX documents are accepted.</li>
            <li>✓ Maximum file size is 5 MB.</li>
            <li>✓ Your resume is stored in authenticated cloud storage.</li>
            <li>✓ You can replace your resume whenever you need.</li>
            <li>✓ Keep your resume updated before applying for jobs.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}

export default StudentResume;
