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

const allowedTransitions = {
    applied: ['under-review', 'rejected'],
    'under-review': ['shortlisted', 'rejected'],
    shortlisted: ['rejected'],
    rejected: [],
    withdrawn: [],
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

const formatDate = (date, includeTime = false) => {
    if (!date) return 'Not available';

    return new Date(date).toLocaleString(
        'en-IN',
        includeTime
            ? {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }
            : {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            }
    );
};

function AdminApplicationDetails() {
    const { applicationId } = useParams();
    const navigate = useNavigate();

    const [application, setApplication] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [downloading, setDownloading] = useState(false);
    const [resumeError, setResumeError] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [statusNote, setStatusNote] = useState('');
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [statusUpdateMessage, setStatusUpdateMessage] = useState('');
    const [statusUpdateError, setStatusUpdateError] = useState('');

    useEffect(() => {
        const fetchApplication = async () => {
            try {
                setLoading(true);
                setError('');

                const response = await api.get(
                    `/applications/admin/${applicationId}`
                );

                setApplication(response.data.application);
            } catch (err) {
                console.error('Admin application details error:', err);

                setError(
                    err.response?.data?.message ||
                    'Unable to load applicant details.'
                );
            } finally {
                setLoading(false);
            }
        };

        fetchApplication();
    }, [applicationId]);

    const handleResumeDownload = async () => {
        try {
            setDownloading(true);
            setResumeError('');

            const response = await api.get(
                `/applications/admin/${applicationId}/resume/download`
            );

            // The signed Cloudinary URL triggers an attachment download.
            window.location.assign(response.data.downloadUrl);
        } catch (err) {
            console.error('Applicant resume download error:', err);

            setResumeError(
                err.response?.data?.message ||
                'Unable to download this applicant’s resume.'
            );
        } finally {
            setDownloading(false);
        }
    };

    const handleStatusUpdate = async () => {
        if (!selectedStatus || updatingStatus) return;

        if (statusNote.trim().length > 500) {
            setStatusUpdateError('Note cannot exceed 500 characters.');
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to change the application status to ${formatStatus(selectedStatus)}?`
        );

        if (!confirmed) return;

        try {
            setUpdatingStatus(true);
            setStatusUpdateError('');
            setStatusUpdateMessage('');

            const response = await api.patch(
                `/applications/admin/${applicationId}/status`,
                {
                    status: selectedStatus,
                    note: statusNote.trim(),
                }
            );

            setApplication(response.data.application);
            setSelectedStatus('');
            setStatusNote('');

            setStatusUpdateMessage(
                response.data.message || 'Application status updated successfully.'
            );
        } catch (err) {
            console.error('Application status update error:', err);

            setStatusUpdateError(
                err.response?.data?.message ||
                'Unable to update application status.'
            );

            // Refresh the application if another request changed its status.
            if (err.response?.status === 409) {
                try {
                    const refreshResponse = await api.get(
                        `/applications/admin/${applicationId}`
                    );

                    setApplication(refreshResponse.data.application);
                } catch (refreshError) {
                    console.error(
                        'Application refresh error:',
                        refreshError
                    );
                }
            }
        } finally {
            setUpdatingStatus(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">
                Loading applicant details...
            </div>
        );
    }

    if (error || !application) {
        return (
            <div className="min-h-screen bg-gray-50 px-5 py-20 text-center">
                <p className="text-red-600">
                    {error || 'Application not found.'}
                </p>

                <button
                    onClick={() => navigate(-1)}
                    className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white"
                >
                    Go Back
                </button>
            </div>
        );
    }

    const student = application.student || {};
    const job = application.job || {};
    const company = job.company || {};
    const resume = student.resume || {};
    const availableStatuses = allowedTransitions[application.status] || [];

    const sections = [
        {
            title: 'Personal Information',
            items: [
                ['Full Name', student.name],
                ['Email Address', student.email],
                ['Phone Number', student.phone],
                ['College', student.college],
            ],
        },
        {
            title: 'Academic Information',
            items: [
                ['Branch', student.branch],
                ['CGPA', student.cgpa],
                ['Graduation Year', student.graduationYear],
                ['Active Backlogs', student.backlogs],
            ],
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">

                <button
                    onClick={() =>
                        navigate(`/admin/jobs/${job._id}/applicants`)
                    }
                    className="mb-5 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                >
                    ← Back to Applicants
                </button>

                {/* Header */}
                <div className="rounded-2xl bg-linear-to-r from-indigo-600 to-violet-600 p-6 text-white shadow-lg sm:p-8">
                    <p className="text-sm font-medium text-indigo-100">
                        Admin / Applicant Details
                    </p>

                    <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                            <h1 className="text-2xl font-bold sm:text-3xl">
                                {student.name || 'Unknown Student'}
                            </h1>

                            <p className="mt-2 text-sm text-indigo-100">
                                {student.email || 'No email available'}
                            </p>
                        </div>

                        <span
                            className={`inline-flex w-fit rounded-full px-4 py-2 text-sm font-semibold ${statusStyles[application.status] ||
                                'bg-gray-100 text-gray-700'
                                }`}
                        >
                            {formatStatus(application.status)}
                        </span>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl bg-white/15 p-4">
                            <p className="text-xs text-indigo-100">
                                Applied On
                            </p>
                            <p className="mt-2 text-sm font-semibold">
                                {formatDate(application.appliedAt)}
                            </p>
                        </div>

                        <div className="rounded-xl bg-white/15 p-4">
                            <p className="text-xs text-indigo-100">
                                CGPA
                            </p>
                            <p className="mt-2 text-xl font-bold">
                                {student.cgpa ?? 'N/A'}
                            </p>
                        </div>

                        <div className="rounded-xl bg-white/15 p-4">
                            <p className="text-xs text-indigo-100">
                                Branch
                            </p>
                            <p className="mt-2 text-sm font-semibold">
                                {student.branch || 'Not available'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Personal and academic information */}
                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    {sections.map((section) => (
                        <section
                            key={section.title}
                            className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
                        >
                            <h2 className="text-lg font-bold text-gray-900">
                                {section.title}
                            </h2>

                            <div className="mt-5 space-y-4">
                                {section.items.map(([label, value]) => (
                                    <div
                                        key={label}
                                        className="flex flex-col gap-1 border-b border-gray-100 pb-3 last:border-0 last:pb-0 sm:flex-row sm:justify-between"
                                    >
                                        <span className="text-sm text-gray-500">
                                            {label}
                                        </span>

                                        <span className="text-sm font-semibold text-gray-800 sm:text-right">
                                            {value ?? 'Not available'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>

                {/* Job information */}
                <section className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900">
                        Applied Job Details
                    </h2>

                    <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {[
                            ['Job Title', job.title],
                            ['Company', company.name],
                            ['Industry', company.industry],
                            ['Location', job.location],
                            ['Job Type', job.jobType],
                            [
                                'Package',
                                job.packageLPA != null
                                    ? `${job.packageLPA} LPA`
                                    : null,
                            ],
                            ['Job Deadline', formatDate(job.applicationDeadline)],
                        ].map(([label, value]) => (
                            <div key={label}>
                                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                    {label}
                                </p>
                                <p className="mt-2 text-sm font-semibold text-gray-800">
                                    {value ?? 'Not available'}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Skills */}
                <section className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900">
                        Skills
                    </h2>

                    {student.skills?.length > 0 ? (
                        <div className="mt-5 flex flex-wrap gap-2">
                            {student.skills.map((skill, index) => (
                                <span
                                    key={`${skill}-${index}`}
                                    className="rounded-lg bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="mt-4 text-sm text-gray-500">
                            No skills added.
                        </p>
                    )}
                </section>

                {/* Projects */}
                <section className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900">
                        Projects
                    </h2>

                    {student.projects?.length > 0 ? (
                        <div className="mt-5 space-y-3">
                            {student.projects.map((project, index) => (
                                <div
                                    key={`${project}-${index}`}
                                    className="rounded-xl bg-gray-50 p-4 text-sm text-gray-700"
                                >
                                    {project}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="mt-4 text-sm text-gray-500">
                            No projects added.
                        </p>
                    )}
                </section>

                {/* Certifications */}
                <section className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900">
                        Certifications
                    </h2>

                    {student.certifications?.length > 0 ? (
                        <div className="mt-5 flex flex-wrap gap-2">
                            {student.certifications.map((certification, index) => (
                                <span
                                    key={`${certification}-${index}`}
                                    className="rounded-lg bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700"
                                >
                                    {certification}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="mt-4 text-sm text-gray-500">
                            No certifications added.
                        </p>
                    )}
                </section>

                {/* Resume */}
                <section className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900">
                        Student Resume
                    </h2>

                    {resume.originalName ? (
                        <div className="mt-5 flex flex-col justify-between gap-4 rounded-xl bg-gray-50 p-4 sm:flex-row sm:items-center">
                            <div>
                                <p className="font-semibold text-gray-800">
                                    {resume.originalName}
                                </p>

                                <p className="mt-1 text-xs text-gray-500">
                                    {resume.format?.toUpperCase()} •{' '}
                                    {resume.size
                                        ? `${(resume.size / (1024 * 1024)).toFixed(2)} MB`
                                        : 'Size unavailable'}
                                </p>

                                <p className="mt-1 text-xs text-gray-400">
                                    Uploaded: {formatDate(resume.uploadedAt)}
                                </p>
                            </div>

                            <button
                                onClick={handleResumeDownload}
                                disabled={downloading}
                                className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {downloading ? 'Preparing...' : 'Download Resume'}
                            </button>
                        </div>
                    ) : (
                        <p className="mt-4 text-sm text-gray-500">
                            This student has not uploaded a resume.
                        </p>
                    )}

                    {resumeError && (
                        <p className="mt-3 text-sm text-red-600">
                            {resumeError}
                        </p>
                    )}
                </section>

                {/* Application Status Management */}
                <section className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">
                            Manage Application Status
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Update this applicant's recruitment progress.
                        </p>
                    </div>

                    <div className="mt-5 rounded-xl bg-gray-50 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                            Current Status
                        </p>

                        <span
                            className={`mt-2 inline-flex rounded-full px-3 py-1.5 text-sm font-semibold ${statusStyles[application.status] ||
                                'bg-gray-100 text-gray-700'
                                }`}
                        >
                            {formatStatus(application.status)}
                        </span>
                    </div>

                    {availableStatuses.length > 0 ? (
                        <div className="mt-5 space-y-4">
                            <div>
                                <label
                                    htmlFor="applicationStatus"
                                    className="mb-2 block text-sm font-semibold text-gray-700"
                                >
                                    Select New Status
                                </label>

                                <select
                                    id="applicationStatus"
                                    value={selectedStatus}
                                    onChange={(e) => {
                                        setSelectedStatus(e.target.value);
                                        setStatusUpdateError('');
                                        setStatusUpdateMessage('');
                                    }}
                                    disabled={updatingStatus}
                                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                                >
                                    <option value="">Choose a status</option>

                                    {availableStatuses.map((status) => (
                                        <option key={status} value={status}>
                                            {formatStatus(status)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor="statusNote"
                                    className="mb-2 block text-sm font-semibold text-gray-700"
                                >
                                    Admin Note <span className="font-normal text-gray-400">(Optional)</span>
                                </label>

                                <textarea
                                    id="statusNote"
                                    value={statusNote}
                                    onChange={(e) => setStatusNote(e.target.value)}
                                    maxLength={500}
                                    rows={3}
                                    disabled={updatingStatus}
                                    placeholder="Example: Candidate selected for the technical interview."
                                    className="w-full resize-y rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                                />

                                <p className="mt-1 text-right text-xs text-gray-400">
                                    {statusNote.length}/500 characters
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleStatusUpdate}
                                disabled={!selectedStatus || updatingStatus}
                                className="w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                            >
                                {updatingStatus ? 'Updating Status...' : 'Update Application Status'}
                            </button>
                        </div>
                    ) : (
                        <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
                            <p className="text-sm font-medium text-gray-700">
                                No further status changes are available.
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                                This application has reached a final status.
                            </p>
                        </div>
                    )}

                    {statusUpdateMessage && (
                        <p className="mt-4 rounded-xl bg-green-50 p-3 text-sm font-medium text-green-700">
                            {statusUpdateMessage}
                        </p>
                    )}

                    {statusUpdateError && (
                        <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">
                            {statusUpdateError}
                        </p>
                    )}
                </section>  
                 
                {/* Status history */}
                <section className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900">
                        Application Status History
                    </h2>

                    {application.statusHistory?.length > 0 ? (
                        <div className="mt-6 space-y-5">
                            {[...application.statusHistory]
                                .reverse()
                                .map((entry, index) => (
                                    <div
                                        key={`${entry.changedAt}-${index}`}
                                        className="relative border-l-2 border-indigo-100 pb-1 pl-5 last:border-transparent"
                                    >
                                        <span className="absolute -left-1.75 top-1 h-3 w-3 rounded-full bg-indigo-500 ring-4 ring-indigo-50" />

                                        <div className="flex flex-wrap items-center gap-2">
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[entry.status] ||
                                                    'bg-gray-100 text-gray-600'
                                                    }`}
                                            >
                                                {formatStatus(entry.status)}
                                            </span>

                                            <span className="text-xs text-gray-400">
                                                {formatDate(entry.changedAt, true)}
                                            </span>
                                        </div>

                                        {entry.note && (
                                            <p className="mt-2 text-sm text-gray-600">
                                                {entry.note}
                                            </p>
                                        )}

                                        {entry.changedBy && (
                                            <p className="mt-1 text-xs text-gray-400">
                                                Updated by {entry.changedBy.name || 'Unknown user'}
                                                {entry.changedBy.role
                                                    ? ` (${entry.changedBy.role})`
                                                    : ''}
                                            </p>
                                        )}
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <p className="mt-4 text-sm text-gray-500">
                            No status history available.
                        </p>
                    )}
                </section>

                <div className="mt-8 flex justify-end">
                    <button
                        onClick={() =>
                            navigate(`/admin/jobs/${job._id}/applicants`)
                        }
                        className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                    >
                        Back to Applicants
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AdminApplicationDetails;
