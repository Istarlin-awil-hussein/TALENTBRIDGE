import React, { useEffect, useState } from 'react';
import { Award, Bookmark, BookOpen, Briefcase, Edit3, PlusCircle, Users, X } from 'lucide-react';
import { apiRequest } from '../api';
import {
  ApplicationRecord,
  AppRoute,
  LearningResource,
  MentorshipRequestRecord,
  Opportunity,
  QualificationItem,
  UserProfile,
} from '../types';

interface DashboardPageProps {
  user: UserProfile | null;
  onUserUpdate: (u: UserProfile) => void;
  onNavigate: (route: AppRoute) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  user,
  onUserUpdate,
  onNavigate,
}) => {
  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [savedJobs, setSavedJobs] = useState<Opportunity[]>([]);
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [mentorshipRequests, setMentorshipRequests] = useState<MentorshipRequestRecord[]>([]);
  const [qualifications, setQualifications] = useState<QualificationItem[]>([]);
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [error, setError] = useState('');

  // Edit profile modal
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editField, setEditField] = useState('');
  const [editEdu, setEditEdu] = useState('');
  const [editSkills, setEditSkills] = useState('');
  const [editExp, setEditExp] = useState('0');
  const [editHeadline, setEditHeadline] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editOptIn, setEditOptIn] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState('');

  // Employer post job modal
  const [showPostJob, setShowPostJob] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [jobOrg, setJobOrg] = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [jobMode, setJobMode] = useState<'Remote' | 'Onsite' | 'Hybrid'>('Remote');
  const [jobType, setJobType] = useState<'Full-time' | 'Part-time' | 'Contract'>('Full-time');
  const [jobField, setJobField] = useState('Software Development');
  const [jobLevel, setJobLevel] = useState<'Entry' | 'Mid' | 'Senior'>('Mid');
  const [jobSkills, setJobSkills] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [jobDeadline, setJobDeadline] = useState('2027-04-15');
  const [postingJob, setPostingJob] = useState(false);
  const [postJobMsg, setPostJobMsg] = useState('');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([
      apiRequest<{ opportunities: Opportunity[] }>('/api/opportunities'),
      apiRequest<{ savedJobs: Opportunity[] }>('/api/saved-jobs'),
      apiRequest<{ applications: ApplicationRecord[] }>('/api/applications'),
      apiRequest<{ requests: MentorshipRequestRecord[] }>('/api/mentorship-requests'),
      apiRequest<{ qualifications: QualificationItem[] }>('/api/qualifications'),
      apiRequest<{ resources: LearningResource[] }>('/api/resources'),
    ])
      .then(([oppRes, savedRes, appRes, mrRes, qualRes, resRes]) => {
        if (cancelled) return;
        setOpportunities(oppRes.opportunities);
        setSavedJobs(savedRes.savedJobs);
        setApplications(appRes.applications);
        setMentorshipRequests(mrRes.requests);
        setQualifications(qualRes.qualifications);
        setResources(resRes.resources);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Unable to load dashboard data.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="font-display text-2xl font-bold text-slate-900">
          Protected Professional Dashboard
        </h1>
        <p className="text-slate-600 text-sm">
          Please sign in or register an account to view your personalized career dashboard, saved opportunities, and credential tracker.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-800 hover:bg-blue-900 rounded-lg"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => onNavigate('register')}
            className="px-5 py-2.5 text-sm font-semibold text-slate-800 border border-slate-300 bg-white rounded-lg"
          >
            Create Account
          </button>
        </div>
      </div>
    );
  }

  // Compute dynamic profile completion
  const checks = [
    Boolean(user.full_name),
    Boolean(user.country),
    Boolean(user.professional_field),
    Boolean(user.education_level),
    user.skills.length >= 2,
    Boolean(user.headline),
    Boolean(user.bio),
    qualifications.length >= 1,
  ];
  const completionPct = Math.round((checks.filter(Boolean).length / checks.length) * 100);

  const recommendedOpps = [...opportunities]
    .sort((a, b) => (b.match_percentage || 0) - (a.match_percentage || 0))
    .slice(0, 3);

  const recommendedResources = resources.slice(0, 3);

  const openEditModal = () => {
    setEditName(user.full_name);
    setEditCountry(user.country);
    setEditField(user.professional_field);
    setEditEdu(user.education_level);
    setEditSkills(user.skills.join(', '));
    setEditExp(String(user.years_experience));
    setEditHeadline(user.headline);
    setEditBio(user.bio);
    setEditOptIn(user.networking_opt_in);
    setProfileFeedback('');
    setEditing(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileFeedback('');
    try {
      const res = await apiRequest<{ user: UserProfile }>('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          full_name: editName,
          country: editCountry,
          professional_field: editField,
          education_level: editEdu,
          skills: editSkills
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          years_experience: Number(editExp) || 0,
          headline: editHeadline,
          bio: editBio,
          networking_opt_in: editOptIn,
        }),
      });
      onUserUpdate(res.user);
      setProfileFeedback('Profile updated successfully.');
      setEditing(false);
    } catch (err: any) {
      setProfileFeedback(err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostingJob(true);
    setPostJobMsg('');
    try {
      await apiRequest('/api/opportunities', {
        method: 'POST',
        body: JSON.stringify({
          title: jobTitle,
          organization: jobOrg,
          location: jobLocation,
          work_mode: jobMode,
          employment_type: jobType,
          field: jobField,
          experience_level: jobLevel,
          required_skills: jobSkills
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          description: jobDesc,
          deadline: jobDeadline,
        }),
      });
      setPostJobMsg('Opportunity submitted for administrator review.');
      setJobTitle('');
      setJobDesc('');
      setJobSkills('');
      setTimeout(() => setShowPostJob(false), 1200);
    } catch (err: any) {
      setPostJobMsg(err.message || 'Unable to submit listing.');
    } finally {
      setPostingJob(false);
    }
  };

  return (
    <div className="bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Welcome Header */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-teal-700 capitalize">
              {user.role.replace('_', ' ')} Workspace · {user.country}
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
              Welcome back, {user.full_name}
            </h1>
            <p className="text-sm text-slate-600">
              {user.headline || `${user.professional_field} · ${user.years_experience} years experience`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {user.role === 'employer' && (
              <button
                type="button"
                onClick={() => {
                  setPostJobMsg('');
                  setShowPostJob(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                Post Opportunity
              </button>
            )}
            <button
              type="button"
              onClick={openEditModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              Edit Profile
            </button>
            <button
              type="button"
              onClick={() => onNavigate('assistant')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-800 hover:bg-blue-900 rounded-lg transition-colors"
            >
              AI Career Assistant
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Top KPI & Profile Progress Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500">Profile Completion</span>
              <span className="font-mono text-sm font-bold text-blue-900 tabular-nums">
                {completionPct}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-teal-600 transition-all duration-300"
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <p className="text-xs text-slate-500">
              {completionPct < 100
                ? 'Add a bio or qualification record to reach 100%.'
                : 'Your professional profile is complete.'}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">Submitted Applications</span>
              <Briefcase className="w-4 h-4 text-blue-800" />
            </div>
            <div className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
              {applications.length}
            </div>
            <button
              type="button"
              onClick={() => onNavigate('opportunities')}
              className="text-xs font-semibold text-blue-800 hover:underline mt-1"
            >
              Browse opportunities →
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">Saved Opportunities</span>
              <Bookmark className="w-4 h-4 text-teal-700" />
            </div>
            <div className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
              {savedJobs.length}
            </div>
            <button
              type="button"
              onClick={() => onNavigate('opportunities')}
              className="text-xs font-semibold text-blue-800 hover:underline mt-1"
            >
              Review saved jobs →
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">Mentorship Requests</span>
              <Users className="w-4 h-4 text-blue-800" />
            </div>
            <div className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
              {mentorshipRequests.length}
            </div>
            <button
              type="button"
              onClick={() => onNavigate('mentorship')}
              className="text-xs font-semibold text-blue-800 hover:underline mt-1"
            >
              Manage mentorship →
            </button>
          </div>
        </div>

        {/* Main Workspace Two-Column */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left 7 cols */}
          <div className="lg:col-span-7 space-y-6">
            {/* Recommended Opportunities */}
            <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-lg font-bold text-slate-900">
                    Recommended Opportunities
                  </h2>
                  <p className="text-xs text-slate-500">
                    Ranked by estimated skill overlap (sample opportunities for exploration)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('opportunities')}
                  className="text-xs font-semibold text-blue-800 hover:underline"
                >
                  View all
                </button>
              </div>

              {loading ? (
                <div className="py-8 text-center text-sm text-slate-500">Loading recommendations...</div>
              ) : recommendedOpps.length === 0 ? (
                <div className="py-6 text-sm text-slate-500">No opportunities available right now.</div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {recommendedOpps.map((opp) => (
                    <div key={opp.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="text-xs text-slate-500">
                          {opp.field} · {opp.location} · {opp.work_mode}
                        </div>
                        <h3 className="font-display text-base font-semibold text-slate-900">
                          {opp.title}
                        </h3>
                        <div className="text-xs text-slate-600">{opp.organization}</div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <div className="font-mono text-base font-bold text-teal-800 tabular-nums">
                            {opp.match_percentage ?? 0}%
                          </div>
                          <div className="text-xs text-slate-500">Est. match</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onNavigate('opportunities')}
                          className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                        >
                          Inspect
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Submitted Applications & Saved Jobs */}
            <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h2 className="font-display text-lg font-bold text-slate-900">
                Submitted Applications & Saved Roles
              </h2>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 mb-2">
                    Applications ({applications.length})
                  </h3>
                  {applications.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      You have not submitted any applications yet.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
                      {applications.map((app) => (
                        <div key={app.id} className="p-3.5 flex items-center justify-between gap-4">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">
                              {app.opportunity_title}
                            </div>
                            <div className="text-xs text-slate-500">
                              {app.organization} · {app.location}
                            </div>
                          </div>
                          <span className="font-mono text-xs font-medium text-blue-800 capitalize">
                            {app.status.replace('_', ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-slate-500 mb-2">
                    Saved Opportunities ({savedJobs.length})
                  </h3>
                  {savedJobs.length === 0 ? (
                    <p className="text-sm text-slate-500">No saved jobs yet.</p>
                  ) : (
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
                      {savedJobs.map((job) => (
                        <div key={job.id} className="p-3.5 flex items-center justify-between gap-4">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{job.title}</div>
                            <div className="text-xs text-slate-500">
                              {job.organization} · Deadline {job.deadline}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => onNavigate('opportunities')}
                            className="text-xs font-semibold text-blue-800 hover:underline"
                          >
                            Apply
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Right 5 cols */}
          <div className="lg:col-span-5 space-y-6">
            {/* Registered Skills & Education */}
            <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-slate-900">
                  Skills & Education Summary
                </h2>
                <button
                  type="button"
                  onClick={() => onNavigate('credentials')}
                  className="text-xs font-semibold text-blue-800 hover:underline"
                >
                  Manage Credentials
                </button>
              </div>
              <div className="text-sm space-y-2">
                <div>
                  <span className="text-slate-500">Field: </span>
                  <span className="font-medium text-slate-900">{user.professional_field}</span>
                </div>
                <div>
                  <span className="text-slate-500">Education: </span>
                  <span className="font-medium text-slate-900">{user.education_level}</span>
                </div>
                <div>
                  <span className="text-slate-500">Experience: </span>
                  <span className="font-medium text-slate-900 tabular-nums">
                    {user.years_experience} years
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Registered Skills:</span>
                  <p className="text-sm font-medium text-slate-800">
                    {user.skills.length ? user.skills.join(' · ') : 'No skills listed yet'}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-teal-700" />
                    Credential entries logged: <strong className="tabular-nums">{qualifications.length}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigate('credentials')}
                    className="text-blue-800 font-semibold hover:underline"
                  >
                    Add record
                  </button>
                </div>
              </div>
            </section>

            {/* Mentorship Status */}
            <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-slate-900">
                  Mentorship Status
                </h2>
                <button
                  type="button"
                  onClick={() => onNavigate('mentorship')}
                  className="text-xs font-semibold text-blue-800 hover:underline"
                >
                  Browse Mentors
                </button>
              </div>
              {mentorshipRequests.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No mentorship requests submitted yet. Browse sample mentors to connect for CV or career guidance.
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {mentorshipRequests.map((mr) => (
                    <div key={mr.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{mr.mentor_name}</div>
                        <div className="text-xs text-slate-500">{mr.mentor_field}</div>
                      </div>
                      <span className="font-mono text-xs font-semibold text-teal-800 capitalize">
                        {mr.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Recommended Learning Resources */}
            <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-slate-900">
                  Recommended Learning
                </h2>
                <button
                  type="button"
                  onClick={() => onNavigate('resources')}
                  className="text-xs font-semibold text-blue-800 hover:underline"
                >
                  Resource Centre
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {recommendedResources.map((res) => (
                  <div key={res.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="text-xs text-teal-700 font-medium">{res.category}</div>
                    <button
                      type="button"
                      onClick={() => onNavigate('resources')}
                      className="text-sm font-semibold text-slate-900 hover:text-blue-800 text-left mt-0.5 flex items-start gap-2"
                    >
                      <BookOpen className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>{res.title}</span>
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="font-display text-lg font-bold text-slate-900">Edit Professional Profile</h2>
              <button
                type="button"
                onClick={() => setEditing(false)}
                aria-label="Close modal"
                className="p-1.5 text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {profileFeedback && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                {profileFeedback}
              </div>
            )}
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Full name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Country of residence</label>
                  <input
                    type="text"
                    required
                    value={editCountry}
                    onChange={(e) => setEditCountry(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Professional field</label>
                  <input
                    type="text"
                    required
                    value={editField}
                    onChange={(e) => setEditField(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Education level</label>
                  <input
                    type="text"
                    required
                    value={editEdu}
                    onChange={(e) => setEditEdu(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Skills (comma-separated)</label>
                  <input
                    type="text"
                    value={editSkills}
                    onChange={(e) => setEditSkills(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Years experience</label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={editExp}
                    onChange={(e) => setEditExp(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Professional headline</label>
                <input
                  type="text"
                  value={editHeadline}
                  onChange={(e) => setEditHeadline(e.target.value)}
                  placeholder="e.g., Cloud Systems Engineer · Open to Remote & Hybrid"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Professional summary</label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Summarize your core experience and career goals..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={editOptIn}
                  onChange={(e) => setEditOptIn(e.target.checked)}
                  className="rounded border-slate-300"
                />
                Allow peers in the Mentorship & Networking directory to view my public headline (email remains private)
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-800 hover:bg-blue-900 rounded-lg"
                >
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employer Post Job Modal */}
      {showPostJob && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="font-display text-lg font-bold text-slate-900">Submit Opportunity Listing</h2>
              <button type="button" onClick={() => setShowPostJob(false)} aria-label="Close">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            {postJobMsg && (
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900">
                {postJobMsg}
              </div>
            )}
            <form onSubmit={handlePostJob} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Job title"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Organization name"
                  value={jobOrg}
                  onChange={(e) => setJobOrg(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
                <input
                  type="text"
                  required
                  placeholder="Location (e.g. Berlin or Remote)"
                  value={jobLocation}
                  onChange={(e) => setJobLocation(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <select
                  value={jobMode}
                  onChange={(e) => setJobMode(e.target.value as any)}
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Onsite">Onsite</option>
                </select>
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value as any)}
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                </select>
                <select
                  value={jobLevel}
                  onChange={(e) => setJobLevel(e.target.value as any)}
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Entry">Entry</option>
                  <option value="Mid">Mid</option>
                  <option value="Senior">Senior</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Professional field"
                  value={jobField}
                  onChange={(e) => setJobField(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
                <input
                  type="date"
                  required
                  value={jobDeadline}
                  onChange={(e) => setJobDeadline(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <input
                type="text"
                required
                placeholder="Required skills (comma-separated)"
                value={jobSkills}
                onChange={(e) => setJobSkills(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
              <textarea
                rows={3}
                required
                placeholder="Role description & inclusive hiring context..."
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPostJob(false)}
                  className="px-4 py-2 text-sm border border-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={postingJob}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-800 hover:bg-blue-900 rounded-lg"
                >
                  {postingJob ? 'Submitting...' : 'Submit for Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
