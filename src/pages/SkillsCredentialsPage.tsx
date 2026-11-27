import React, { useEffect, useState } from 'react';
import { ExternalLink, Info, Plus, Trash2 } from 'lucide-react';
import { apiRequest } from '../api';
import {
  AppRoute,
  ChecklistStatus,
  QualificationItem,
  QualificationType,
  UserProfile,
} from '../types';

interface SkillsCredentialsPageProps {
  user: UserProfile | null;
  onUserUpdate: (u: UserProfile) => void;
  onNavigate: (route: AppRoute) => void;
}

const READINESS_STEPS = [
  {
    key: 'distinguish_regulated',
    title: 'Identify whether your profession is regulated or non-regulated',
    guidance:
      'Regulated fields (medicine, civil engineering, law, teaching) require formal national licensing. Non-regulated roles (software, data, marketing) prioritize demonstrable skills.',
  },
  {
    key: 'inventory_documents',
    title: 'Gather academic certificates, syllabi, or alternative proof',
    guidance:
      'Collect degree diplomas, transcripts, employer reference letters, or digital work samples. If originals were lost, note alternative verification pathways like the UNESCO Qualifications Passport.',
  },
  {
    key: 'certified_translations',
    title: 'Prepare concise English or host-language translations',
    guidance:
      'Keep translated summaries of degree titles, course durations, and job responsibilities ready for recognition centers and employers.',
  },
  {
    key: 'national_agency_lookup',
    title: 'Locate your host country recognition agency (e.g., ENIC-NARIC / ZAB / WES)',
    guidance:
      'Check official government recognition portals for exact fee waivers, processing timelines, and refugee credential programs.',
  },
  {
    key: 'portfolio_validation',
    title: 'Link verifiable public work samples or project case studies',
    guidance:
      'Independent code repositories, design portfolios, or anonymized project summaries help employers evaluate capability directly.',
  },
];

const STATUS_LABELS: Record<ChecklistStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  completed: 'Completed',
};

export const SkillsCredentialsPage: React.FC<SkillsCredentialsPageProps> = ({
  user,
  onUserUpdate,
  onNavigate,
}) => {
  const [qualifications, setQualifications] = useState<QualificationItem[]>([]);
  const [checklist, setChecklist] = useState<Record<string, ChecklistStatus>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  // Skills quick editor
  const [newSkill, setNewSkill] = useState('');
  const [savingSkill, setSavingSkill] = useState(false);

  // Add qualification form
  const [type, setType] = useState<QualificationType>('academic');
  const [title, setTitle] = useState('');
  const [institution, setInstitution] = useState('');
  const [countryOrProf, setCountryOrProf] = useState('');
  const [yearRange, setYearRange] = useState('');
  const [needsRecognition, setNeedsRecognition] = useState(false);
  const [recognitionStatus, setRecognitionStatus] = useState<ChecklistStatus>('not_started');
  const [linkUrl, setLinkUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      apiRequest<{ qualifications: QualificationItem[] }>('/api/qualifications'),
      apiRequest<{ items: { item_key: string; status: ChecklistStatus }[] }>('/api/credential-checklist'),
    ])
      .then(([qRes, cRes]) => {
        setQualifications(qRes.qualifications);
        const map: Record<string, ChecklistStatus> = {};
        for (const item of cRes.items) {
          map[item.item_key] = item.status;
        }
        setChecklist(map);
      })
      .catch((err) => setError(err.message || 'Failed to load credential records.'))
      .finally(() => setLoading(false));
  }, [user]);

  const handleAddQualification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Please sign in or register to save qualification records persistently.');
      return;
    }
    setError('');
    setFeedback('');
    setSubmitting(true);
    try {
      const res = await apiRequest<{ qualification: QualificationItem }>('/api/qualifications', {
        method: 'POST',
        body: JSON.stringify({
          type,
          title,
          institution_or_org: institution,
          country_or_proficiency: countryOrProf,
          year_range: yearRange,
          needs_recognition: needsRecognition,
          recognition_status: recognitionStatus,
          link_url: linkUrl,
          notes,
        }),
      });
      setQualifications([res.qualification, ...qualifications]);
      setTitle('');
      setInstitution('');
      setCountryOrProf('');
      setYearRange('');
      setLinkUrl('');
      setNotes('');
      setNeedsRecognition(false);
      setFeedback('Credential record saved.');
    } catch (err: any) {
      setError(err.message || 'Unable to save record.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateQualStatus = async (id: number, status: ChecklistStatus) => {
    try {
      const res = await apiRequest<{ qualification: QualificationItem }>(`/api/qualifications/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ recognition_status: status }),
      });
      setQualifications(qualifications.map((q) => (q.id === id ? res.qualification : q)));
    } catch (err: any) {
      setError(err.message || 'Unable to update status.');
    }
  };

  const handleDeleteQualification = async (id: number) => {
    try {
      await apiRequest(`/api/qualifications/${id}`, { method: 'DELETE' });
      setQualifications(qualifications.filter((q) => q.id !== id));
    } catch (err: any) {
      setError(err.message || 'Unable to delete record.');
    }
  };

  const handleChecklistChange = async (itemKey: string, status: ChecklistStatus) => {
    setChecklist((prev) => ({ ...prev, [itemKey]: status }));
    if (!user) return;
    try {
      await apiRequest('/api/credential-checklist', {
        method: 'PUT',
        body: JSON.stringify({ item_key: itemKey, status }),
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save checklist status.');
    }
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newSkill.trim()) return;
    const updatedSkills = Array.from(new Set([...user.skills, newSkill.trim()]));
    setSavingSkill(true);
    try {
      const res = await apiRequest<{ user: UserProfile }>('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          ...user,
          skills: updatedSkills,
        }),
      });
      onUserUpdate(res.user);
      setNewSkill('');
    } catch (err: any) {
      setError(err.message || 'Failed to add skill.');
    } finally {
      setSavingSkill(false);
    }
  };

  const handleRemoveSkill = async (skillToRemove: string) => {
    if (!user) return;
    const updatedSkills = user.skills.filter((s) => s !== skillToRemove);
    try {
      const res = await apiRequest<{ user: UserProfile }>('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          ...user,
          skills: updatedSkills,
        }),
      });
      onUserUpdate(res.user);
    } catch (err: any) {
      setError(err.message || 'Failed to remove skill.');
    }
  };

  const completedCount = READINESS_STEPS.filter((s) => checklist[s.key] === 'completed').length;

  return (
    <div className="bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header & Verification Disclaimer */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-teal-700 mb-1">
                Track 1 · Credential Recognition & Skills Validation
              </p>
              <h1 className="font-display text-3xl font-bold text-slate-900">
                Skills & Credentials Workspace
              </h1>
              <p className="text-sm text-slate-600 mt-1 max-w-3xl">
                Organize your academic degrees, professional certifications, work history, languages, and portfolio links, and track formal recognition milestones.
              </p>
            </div>
            {!user && (
              <button
                type="button"
                onClick={() => onNavigate('register')}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-800 hover:bg-blue-900 rounded-lg whitespace-nowrap shrink-0 self-start"
              >
                Register to Save Records
              </button>
            )}
          </div>

          <div className="p-4 rounded-lg bg-blue-50/70 border border-blue-200 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-800 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-700 leading-relaxed">
              <strong>Important Transparency Notice:</strong> SkillBridge does not officially verify, accredit, or certify academic degrees or professional licenses. All entries recorded here are <strong>self-reported user information</strong>, clearly distinguished from independent evaluations conducted by accredited national recognition bodies (such as ENIC-NARIC, ZAB, WES, or state licensing boards).
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
            {error}
          </div>
        )}
        {feedback && (
          <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-800">
            {feedback}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left 7 cols: Form + Recorded Qualifications */}
          <div className="lg:col-span-7 space-y-6">
            {/* Registered Technical & Professional Skills */}
            <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h2 className="font-display text-lg font-bold text-slate-900">
                Technical & Professional Skills
              </h2>
              {user ? (
                <>
                  <form onSubmit={handleAddSkill} className="flex gap-2">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Add a skill (e.g., AutoCAD, Python, Financial Auditing)"
                      className="flex-1 px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                    <button
                      type="submit"
                      disabled={savingSkill}
                      className="px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg whitespace-nowrap shrink-0"
                    >
                      Add Skill
                    </button>
                  </form>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {user.skills.length === 0 ? (
                      <span className="text-sm text-slate-500">No skills added yet.</span>
                    ) : (
                      user.skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-800 bg-slate-100 border border-slate-200 rounded-md"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill)}
                            aria-label={`Remove ${skill}`}
                            className="text-slate-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-600">
                  Sign in to add and sync your technical skills for job matching.
                </p>
              )}
            </section>

            {/* Add Qualification / Experience / Language / Portfolio */}
            <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h2 className="font-display text-lg font-bold text-slate-900">
                Add Credential, Experience, Language, or Portfolio Link
              </h2>
              <form onSubmit={handleAddQualification} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Record Type</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as QualificationType)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="academic">Academic Qualification</option>
                      <option value="certification">Professional Certification</option>
                      <option value="experience">Previous Work Experience</option>
                      <option value="language">Language Ability</option>
                      <option value="portfolio">Portfolio Link / Work Sample</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Title / Degree / Role / Language
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., BSc Civil Engineering, AWS Architect, Arabic"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Institution / Employer
                    </label>
                    <input
                      type="text"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      placeholder="University or organization"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Country or Proficiency
                    </label>
                    <input
                      type="text"
                      value={countryOrProf}
                      onChange={(e) => setCountryOrProf(e.target.value)}
                      placeholder="e.g., Syria / C1 Fluent"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Year / Dates</label>
                    <input
                      type="text"
                      value={yearRange}
                      onChange={(e) => setYearRange(e.target.value)}
                      placeholder="e.g., 2016–2020"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Portfolio or Reference URL (optional)
                    </label>
                    <input
                      type="url"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://github.com/..."
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Recognition Status
                    </label>
                    <select
                      value={recognitionStatus}
                      onChange={(e) => setRecognitionStatus(e.target.value as ChecklistStatus)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="not_started">Not started</option>
                      <option value="in_progress">In progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={needsRecognition}
                    onChange={(e) => setNeedsRecognition(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  Flag this qualification as requiring formal host-country recognition or equivalency
                </label>

                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes on missing transcripts, equivalency agency, or key deliverables..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />

                <button
                  type="submit"
                  disabled={submitting || !user}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-800 hover:bg-blue-900 disabled:opacity-50 rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                  {submitting ? 'Saving...' : 'Save Self-Reported Record'}
                </button>
              </form>
            </section>

            {/* Recorded Items List */}
            <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h2 className="font-display text-lg font-bold text-slate-900">
                Your Recorded Credentials & History (Self-Reported)
              </h2>
              {!user ? (
                <p className="text-sm text-slate-500">Sign in to view and manage your saved credential records.</p>
              ) : loading ? (
                <p className="text-sm text-slate-500">Loading your records...</p>
              ) : qualifications.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No records added yet. Use the form above to record your academic qualifications, experience, or portfolio links.
                </p>
              ) : (
                <div className="divide-y divide-slate-200">
                  {qualifications.map((item) => (
                    <div key={item.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div>
                          <div className="text-xs text-slate-500 capitalize">
                            {item.type} · Self-reported {item.needs_recognition ? '· Recognition required' : ''}
                          </div>
                          <h3 className="font-display text-base font-bold text-slate-900">
                            {item.title}
                          </h3>
                          <div className="text-xs text-slate-600">
                            {[item.institution_or_org, item.country_or_proficiency, item.year_range]
                              .filter(Boolean)
                              .join(' · ')}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            aria-label="Recognition status"
                            value={item.recognition_status}
                            onChange={(e) =>
                              handleUpdateQualStatus(item.id, e.target.value as ChecklistStatus)
                            }
                            className="px-2.5 py-1.5 text-xs font-medium border border-slate-300 rounded-md bg-white"
                          >
                            <option value="not_started">Not started</option>
                            <option value="in_progress">In progress</option>
                            <option value="completed">Completed</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleDeleteQualification(item.id)}
                            aria-label="Delete record"
                            className="p-1.5 text-slate-400 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {item.notes && <p className="text-xs text-slate-600">{item.notes}</p>}
                      {item.link_url && (
                        <a
                          href={item.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-800 hover:underline"
                        >
                          Open portfolio link <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right 5 cols: Credential Readiness Checklist & Guidance */}
          <div className="lg:col-span-5 space-y-6">
            <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-lg font-bold text-slate-900">
                    Credential Readiness Checklist
                  </h2>
                  <p className="text-xs text-slate-500">
                    Track each step across Not started, In progress, and Completed
                  </p>
                </div>
                <span className="font-mono text-sm font-bold text-teal-800 tabular-nums">
                  {completedCount}/{READINESS_STEPS.length}
                </span>
              </div>

              <div className="divide-y divide-slate-200">
                {READINESS_STEPS.map((step) => {
                  const status: ChecklistStatus = checklist[step.key] || 'not_started';
                  return (
                    <div key={step.key} className="py-4 first:pt-0 last:pb-0 space-y-2.5">
                      <div className="font-display text-sm font-semibold text-slate-900">
                        {step.title}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{step.guidance}</p>
                      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                        {(['not_started', 'in_progress', 'completed'] as ChecklistStatus[]).map(
                          (st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleChecklistChange(step.key, st)}
                              className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                                status === st
                                  ? st === 'completed'
                                    ? 'bg-teal-700 text-white'
                                    : st === 'in_progress'
                                      ? 'bg-blue-800 text-white'
                                      : 'bg-white text-slate-900 shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              {STATUS_LABELS[st]}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
              <h2 className="font-display text-base font-bold text-slate-900">
                Official Recognition Reference Portals
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                For official credential assessment, consult accredited public authorities rather than unverified third parties:
              </p>
              <ul className="space-y-2 text-xs">
                <li>
                  <a
                    href="https://www.enic-naric.net/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-800 font-semibold hover:underline"
                  >
                    ENIC-NARIC Network (Europe & Partner States) <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.unesco.org/en/higher-education/qualifications-passport"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-800 font-semibold hover:underline"
                  >
                    UNESCO Qualifications Passport (External UN Portal) <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.anerkennung-in-deutschland.de/html/en/index.php"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-800 font-semibold hover:underline"
                  >
                    Recognition in Germany (Federal Portal) <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
