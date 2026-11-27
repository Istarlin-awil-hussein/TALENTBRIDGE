import React, { useEffect, useState } from 'react';
import { BarChart3, CheckCircle, Eye, EyeOff, Lock, Plus, Shield, Trash2 } from 'lucide-react';
import { apiRequest, setAuthToken } from '../api';
import {
  AdminStats,
  LearningResource,
  MentorshipRequestRecord,
  Opportunity,
  UserProfile,
} from '../types';

interface AdminDashboardPageProps {
  user: UserProfile | null;
  onAuthSuccess: (user: UserProfile, token: string) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  user,
  onAuthSuccess,
}) => {
  // Admin Auth State
  const [adminStatus, setAdminStatus] = useState<{
    configured: boolean;
    envPasscodeSet: boolean;
  } | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showPw, setShowPw] = useState(false);

  const [claimName, setClaimName] = useState('Platform Administrator');
  const [claimEmail, setClaimEmail] = useState('');
  const [claimPassword, setClaimPassword] = useState('');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [envPasscode, setEnvPasscode] = useState('');

  // Admin Console Data
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [mentorshipReqs, setMentorshipReqs] = useState<MentorshipRequestRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'opportunities' | 'resources' | 'mentorship'>('overview');
  const [loadingData, setLoadingData] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  // Add Opportunity Form
  const [oppTitle, setOppTitle] = useState('');
  const [oppOrg, setOppOrg] = useState('');
  const [oppLoc, setOppLoc] = useState('');
  const [oppMode, setOppMode] = useState<'Remote' | 'Onsite' | 'Hybrid'>('Remote');
  const [oppType, setOppType] = useState<'Full-time' | 'Part-time' | 'Contract'>('Full-time');
  const [oppField, setOppField] = useState('Software Development');
  const [oppLevel, setOppLevel] = useState<'Entry' | 'Mid' | 'Senior'>('Mid');
  const [oppSkills, setOppSkills] = useState('');
  const [oppDesc, setOppDesc] = useState('');
  const [oppDeadline, setOppDeadline] = useState('2027-04-30');

  // Add Resource Form
  const [resTitle, setResTitle] = useState('');
  const [resCat, setResCat] = useState('CV and Resume Writing');
  const [resDesc, setResDesc] = useState('');
  const [resContent, setResContent] = useState('');
  const [resUrl, setResUrl] = useState('');

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) {
      apiRequest<{ configured: boolean; envPasscodeSet: boolean }>('/api/admin/status')
        .then(setAdminStatus)
        .catch(() => setAdminStatus({ configured: false, envPasscodeSet: false }));
      return;
    }

    loadAdminData();
  }, [isAdmin]);

  const loadAdminData = async () => {
    setLoadingData(true);
    setActionError('');
    try {
      const [st, op, rs, mr] = await Promise.all([
        apiRequest<AdminStats>('/api/admin/stats'),
        apiRequest<{ opportunities: Opportunity[] }>('/api/admin/opportunities'),
        apiRequest<{ resources: LearningResource[] }>('/api/resources'),
        apiRequest<{ requests: MentorshipRequestRecord[] }>('/api/admin/mentorship-requests'),
      ]);
      setStats(st);
      setOpportunities(op.opportunities);
      setResources(rs.resources);
      setMentorshipReqs(mr.requests);
    } catch (err: any) {
      setActionError(err.message || 'Unable to load administrator data.');
    } finally {
      setLoadingData(false);
    }
  };

  const handleClaimAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await apiRequest<{ token: string; user: UserProfile }>('/api/admin/claim', {
        method: 'POST',
        body: JSON.stringify({
          full_name: claimName,
          email: claimEmail,
          password: claimPassword,
        }),
      });
      setAuthToken(res.token);
      onAuthSuccess(res.user, res.token);
    } catch (err: any) {
      setAuthError(err.message || 'Failed to initialize administrator.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await apiRequest<{ token: string; user: UserProfile }>('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify(
          adminStatus?.envPasscodeSet
            ? { passcode: envPasscode }
            : { email: loginEmail, password: loginPassword }
        ),
      });
      setAuthToken(res.token);
      onAuthSuccess(res.user, res.token);
    } catch (err: any) {
      setAuthError(err.message || 'Administrator sign in failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleOppStatus = async (id: number, status: 'published' | 'archived') => {
    try {
      await apiRequest(`/api/admin/opportunities/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setActionMsg(`Opportunity updated to ${status}.`);
      loadAdminData();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleDeleteOpp = async (id: number) => {
    try {
      await apiRequest(`/api/admin/opportunities/${id}`, { method: 'DELETE' });
      setActionMsg('Opportunity removed.');
      loadAdminData();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleCreateOpp = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    try {
      await apiRequest('/api/opportunities', {
        method: 'POST',
        body: JSON.stringify({
          title: oppTitle,
          organization: oppOrg,
          location: oppLoc,
          work_mode: oppMode,
          employment_type: oppType,
          field: oppField,
          experience_level: oppLevel,
          required_skills: oppSkills.split(',').map((s) => s.trim()).filter(Boolean),
          description: oppDesc,
          deadline: oppDeadline,
        }),
      });
      setOppTitle('');
      setOppOrg('');
      setOppLoc('');
      setOppSkills('');
      setOppDesc('');
      setActionMsg('Opportunity published.');
      loadAdminData();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    try {
      await apiRequest('/api/admin/resources', {
        method: 'POST',
        body: JSON.stringify({
          title: resTitle,
          category: resCat,
          description: resDesc,
          content: resContent,
          external_url: resUrl,
        }),
      });
      setResTitle('');
      setResDesc('');
      setResContent('');
      setResUrl('');
      setActionMsg('Learning resource added.');
      loadAdminData();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleDeleteResource = async (id: number) => {
    try {
      await apiRequest(`/api/admin/resources/${id}`, { method: 'DELETE' });
      setActionMsg('Resource deleted.');
      loadAdminData();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleMentorshipStatus = async (
    id: number,
    status: 'pending' | 'accepted' | 'scheduled' | 'declined'
  ) => {
    try {
      await apiRequest(`/api/admin/mentorship-requests/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setActionMsg(`Mentorship request marked as ${status}.`);
      loadAdminData();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  // Non-admin gate
  if (!isAdmin) {
    return (
      <div className="bg-slate-50 py-14 px-4">
        <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-slate-900 text-white">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-slate-900">
                Administrator Access
              </h1>
              <p className="text-xs text-slate-500">
                Role-protected governance console
              </p>
            </div>
          </div>

          {user && user.role !== 'admin' && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
              You are currently signed in as <strong>{user.email}</strong> ({user.role.replace('_', ' ')}). Administrator privileges are required to view this dashboard.
            </div>
          )}

          {authError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
              {authError}
            </div>
          )}

          {!adminStatus ? (
            <p className="text-sm text-slate-500">Checking administrator configuration...</p>
          ) : !adminStatus.configured ? (
            <form onSubmit={handleClaimAdmin} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                No administrator credentials are configured yet. Complete this one-time setup to claim the platform administrator account.
              </p>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Administrator Name</label>
                <input
                  type="text"
                  required
                  value={claimName}
                  onChange={(e) => setClaimName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Administrator Email</label>
                <input
                  type="email"
                  required
                  value={claimEmail}
                  onChange={(e) => setClaimEmail(e.target.value)}
                  placeholder="admin@organization.org"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Password (min. 8 characters)</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={claimPassword}
                    onChange={(e) => setClaimPassword(e.target.value)}
                    className="w-full px-3.5 py-2 pr-10 text-sm border border-slate-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
              >
                {authLoading ? 'Initializing...' : 'Initialize Administrator Account'}
              </button>
            </form>
          ) : adminStatus.envPasscodeSet ? (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Server Administrator Passcode
                </label>
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={envPasscode}
                  onChange={(e) => setEnvPasscode(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                {authLoading ? 'Verifying...' : 'Sign In as Administrator'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Administrator Email</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-3.5 py-2 pr-10 text-sm border border-slate-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                {authLoading ? 'Signing in...' : 'Sign In to Admin Console'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  const maxReg = Math.max(1, ...(stats?.registrationTrends.map((r) => r.count) || [1]));
  const maxField = Math.max(1, ...(stats?.professionalFields.map((f) => f.count) || [1]));
  const maxOppCat = Math.max(1, ...(stats?.opportunityCategories.map((c) => c.count) || [1]));
  const maxAppProg = Math.max(1, ...(stats?.applicationProgress.map((a) => a.count) || [1]));

  return (
    <div className="bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header & Sub-tabs */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-teal-700">
              Administrator Governance Console
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
              SkillBridge Platform Operations
            </h1>
          </div>
          <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-lg">
            {[
              { id: 'overview', label: 'Analytics & Activity' },
              { id: 'opportunities', label: `Opportunities (${opportunities.length})` },
              { id: 'resources', label: `Resources (${resources.length})` },
              { id: 'mentorship', label: `Mentorship (${mentorshipReqs.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {actionError && (
          <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
            {actionError}
          </div>
        )}
        {actionMsg && (
          <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-800">
            {actionMsg}
          </div>
        )}

        {loadingData || !stats ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-sm text-slate-500">
            Loading platform analytics...
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Registered Users', value: stats.totals.totalUsers },
                    { label: 'Job Seekers', value: stats.totals.jobSeekers },
                    { label: 'Employers', value: stats.totals.employers },
                    { label: 'Published Opportunities', value: stats.totals.publishedOpportunities },
                    { label: 'Submitted Applications', value: stats.totals.applications },
                    { label: 'Mentorship Requests', value: stats.totals.mentorshipRequests },
                    { label: 'Distinct Skill Categories', value: stats.totals.skillsCategories },
                    { label: 'Pending Review Listings', value: stats.totals.pendingOpportunities },
                  ].map((kpi) => (
                    <div key={kpi.label} className="bg-white border border-slate-200 rounded-xl p-4">
                      <div className="text-xs text-slate-500 mb-1">{kpi.label}</div>
                      <div className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                        {kpi.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 4 Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Chart 1: Registration Trends */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="font-display text-base font-bold text-slate-900">
                        User Registration Trends
                      </h2>
                      <BarChart3 className="w-4 h-4 text-blue-800" />
                    </div>
                    <div className="h-44 flex items-end gap-3 pt-4 border-b border-slate-200 pb-2">
                      {stats.registrationTrends.map((pt) => {
                        const heightPct = Math.max(10, Math.round((pt.count / maxReg) * 100));
                        return (
                          <div key={pt.label} className="flex-1 flex flex-col items-center gap-1.5">
                            <span className="font-mono text-xs text-slate-700 tabular-nums">
                              {pt.count}
                            </span>
                            <div
                              className="w-full max-w-[40px] bg-blue-800 rounded-t"
                              style={{ height: `${heightPct}%` }}
                            />
                            <span className="font-mono text-[10px] text-slate-500 truncate max-w-full">
                              {pt.label.slice(5)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Chart 2: Professional Fields */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                    <h2 className="font-display text-base font-bold text-slate-900">
                      Registered User Professional Fields
                    </h2>
                    <div className="space-y-3">
                      {stats.professionalFields.map((row) => (
                        <div key={row.field} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-700 font-medium">{row.field}</span>
                            <span className="font-mono text-slate-600 tabular-nums">{row.count}</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-teal-600"
                              style={{ width: `${Math.round((row.count / maxField) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Chart 3: Opportunity Categories */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                    <h2 className="font-display text-base font-bold text-slate-900">
                      Opportunity Categories
                    </h2>
                    <div className="space-y-2.5">
                      {stats.opportunityCategories.map((cat) => (
                        <div key={cat.field} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-700 font-medium">{cat.field}</span>
                            <span className="font-mono text-slate-600 tabular-nums">{cat.count}</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-700"
                              style={{ width: `${Math.round((cat.count / maxOppCat) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Chart 4: Application Progress */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                    <h2 className="font-display text-base font-bold text-slate-900">
                      Application Progress Breakdown
                    </h2>
                    <div className="space-y-3">
                      {stats.applicationProgress.map((ap) => (
                        <div key={ap.status} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-700 font-medium capitalize">
                              {ap.status.replace('_', ' ')}
                            </span>
                            <span className="font-mono text-slate-600 tabular-nums">{ap.count}</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-slate-800"
                              style={{ width: `${Math.round((ap.count / maxAppProg) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recent Platform Activity */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
                  <h2 className="font-display text-base font-bold text-slate-900">
                    Recent Platform Activity
                  </h2>
                  {stats.recentActivity.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No recent applications or mentorship requests logged yet.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {stats.recentActivity.map((act) => (
                        <div key={act.id} className="py-2.5 flex items-center justify-between gap-4 text-sm">
                          <div>
                            <span className="font-mono text-xs text-teal-800 mr-2">{act.type}</span>
                            <span className="text-slate-800">{act.summary}</span>
                          </div>
                          <span className="font-mono text-xs text-slate-400 shrink-0">
                            {act.timestamp.slice(0, 16).replace('T', ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'opportunities' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4 h-fit">
                  <h2 className="font-display text-lg font-bold text-slate-900">
                    Publish New Opportunity
                  </h2>
                  <form onSubmit={handleCreateOpp} className="space-y-3">
                    <input
                      type="text"
                      required
                      placeholder="Job title"
                      value={oppTitle}
                      onChange={(e) => setOppTitle(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Organization"
                      value={oppOrg}
                      onChange={(e) => setOppOrg(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Location"
                        value={oppLoc}
                        onChange={(e) => setOppLoc(e.target.value)}
                        className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Field"
                        value={oppField}
                        onChange={(e) => setOppField(e.target.value)}
                        className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={oppMode}
                        onChange={(e) => setOppMode(e.target.value as any)}
                        className="px-2 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="Remote">Remote</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="Onsite">Onsite</option>
                      </select>
                      <select
                        value={oppType}
                        onChange={(e) => setOppType(e.target.value as any)}
                        className="px-2 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Contract">Contract</option>
                      </select>
                      <select
                        value={oppLevel}
                        onChange={(e) => setOppLevel(e.target.value as any)}
                        className="px-2 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="Entry">Entry</option>
                        <option value="Mid">Mid</option>
                        <option value="Senior">Senior</option>
                      </select>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Required skills (comma-separated)"
                      value={oppSkills}
                      onChange={(e) => setOppSkills(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                    <input
                      type="date"
                      required
                      value={oppDeadline}
                      onChange={(e) => setOppDeadline(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                    <textarea
                      rows={3}
                      required
                      placeholder="Description..."
                      value={oppDesc}
                      onChange={(e) => setOppDesc(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                    <button
                      type="submit"
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold text-white bg-blue-800 hover:bg-blue-900 rounded-lg"
                    >
                      <Plus className="w-4 h-4" />
                      Publish Opportunity
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <h2 className="font-display text-lg font-bold text-slate-900">
                    Manage Opportunities & Employer Submissions
                  </h2>
                  <div className="divide-y divide-slate-200">
                    {opportunities.map((opp) => (
                      <div key={opp.id} className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="text-xs text-slate-500">
                            {opp.field} · Status: <strong className="text-slate-800">{opp.status}</strong>
                          </div>
                          <div className="text-sm font-bold text-slate-900">{opp.title}</div>
                          <div className="text-xs text-slate-600">{opp.organization} · {opp.location}</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {opp.status !== 'published' && (
                            <button
                              type="button"
                              onClick={() => handleOppStatus(opp.id, 'published')}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Approve
                            </button>
                          )}
                          {opp.status === 'published' && (
                            <button
                              type="button"
                              onClick={() => handleOppStatus(opp.id, 'archived')}
                              className="px-2.5 py-1.5 text-xs font-medium text-slate-700 border border-slate-300 rounded-md"
                            >
                              Archive
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteOpp(opp.id)}
                            aria-label="Delete opportunity"
                            className="p-1.5 text-slate-400 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'resources' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4 h-fit">
                  <h2 className="font-display text-lg font-bold text-slate-900">
                    Add Learning Resource
                  </h2>
                  <form onSubmit={handleCreateResource} className="space-y-3">
                    <input
                      type="text"
                      required
                      placeholder="Resource title"
                      value={resTitle}
                      onChange={(e) => setResTitle(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                    <select
                      value={resCat}
                      onChange={(e) => setResCat(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                    >
                      {[
                        'CV and Resume Writing',
                        'Interview Preparation',
                        'Digital Skills',
                        'Professional Communication',
                        'Entrepreneurship',
                        'Remote Work',
                        'Credential Recognition',
                        'Financial Literacy',
                        'Career Development',
                      ].map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      required
                      placeholder="Short description"
                      value={resDesc}
                      onChange={(e) => setResDesc(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                    <textarea
                      rows={4}
                      placeholder="Full article content..."
                      value={resContent}
                      onChange={(e) => setResContent(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                    <input
                      type="url"
                      placeholder="External URL (optional)"
                      value={resUrl}
                      onChange={(e) => setResUrl(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-blue-800 hover:bg-blue-900 rounded-lg"
                    >
                      Add Resource
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <h2 className="font-display text-lg font-bold text-slate-900">
                    Manage Learning Centre Materials
                  </h2>
                  <div className="divide-y divide-slate-200">
                    {resources.map((r) => (
                      <div key={r.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs text-teal-800">{r.category}</div>
                          <div className="text-sm font-bold text-slate-900">{r.title}</div>
                          <div className="text-xs text-slate-600">{r.description}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteResource(r.id)}
                          aria-label="Delete resource"
                          className="p-1.5 text-slate-400 hover:text-red-700 shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'mentorship' && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <h2 className="font-display text-lg font-bold text-slate-900">
                  Manage Mentorship Requests
                </h2>
                {mentorshipReqs.length === 0 ? (
                  <p className="text-sm text-slate-500">No mentorship requests recorded yet.</p>
                ) : (
                  <div className="divide-y divide-slate-200">
                    {mentorshipReqs.map((mr) => (
                      <div key={mr.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="text-xs text-slate-500">
                            Applicant: <strong>{mr.applicant_name}</strong> → Mentor: <strong>{mr.mentor_name}</strong> ({mr.mentor_field})
                          </div>
                          <p className="text-sm text-slate-800 mt-1">{mr.goal}</p>
                        </div>
                        <select
                          aria-label="Update mentorship status"
                          value={mr.status}
                          onChange={(e) => handleMentorshipStatus(mr.id, e.target.value as any)}
                          className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white shrink-0"
                        >
                          <option value="pending">Pending</option>
                          <option value="accepted">Accepted</option>
                          <option value="scheduled">Scheduled</option>
                          <option value="declined">Declined</option>
                        </select>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
