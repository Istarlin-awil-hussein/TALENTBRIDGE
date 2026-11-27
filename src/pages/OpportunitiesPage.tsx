import React, { useEffect, useMemo, useState } from 'react';
import { Bookmark, CheckCircle2, Info, Search, X } from 'lucide-react';
import { apiRequest } from '../api';
import { ApplicationRecord, AppRoute, Opportunity, UserProfile } from '../types';

interface OpportunitiesPageProps {
  user: UserProfile | null;
  onNavigate: (route: AppRoute) => void;
}

export const OpportunitiesPage: React.FC<OpportunitiesPageProps> = ({
  user,
  onNavigate,
}) => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [appliedIds, setAppliedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('All');
  const [fieldFilter, setFieldFilter] = useState('All');
  const [workModeFilter, setWorkModeFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [levelFilter, setLevelFilter] = useState('All');
  const [guestSkills, setGuestSkills] = useState('');

  // Apply Modal
  const [applyingOpp, setApplyingOpp] = useState<Opportunity | null>(null);
  const [coverNote, setCoverNote] = useState('');
  const [submittingApp, setSubmittingApp] = useState(false);

  const fetchAll = async (skillsQuery?: string) => {
    setLoading(true);
    setError('');
    try {
      const url = !user && skillsQuery?.trim()
        ? `/api/opportunities?skills=${encodeURIComponent(skillsQuery.trim())}`
        : '/api/opportunities';
      const oppRes = await apiRequest<{ opportunities: Opportunity[] }>(url);
      setOpportunities(oppRes.opportunities);

      if (user) {
        const [savedRes, appRes] = await Promise.all([
          apiRequest<{ savedJobs: Opportunity[] }>('/api/saved-jobs'),
          apiRequest<{ applications: ApplicationRecord[] }>('/api/applications'),
        ]);
        setSavedIds(new Set(savedRes.savedJobs.map((j) => j.id)));
        setAppliedIds(new Set(appRes.applications.map((a) => a.opportunity_id)));
      }
    } catch (err: any) {
      setError(err.message || 'Unable to load opportunities.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [user]);

  const uniqueLocations = useMemo(
    () => ['All', ...Array.from(new Set(opportunities.map((o) => o.location)))],
    [opportunities]
  );
  const uniqueFields = useMemo(
    () => ['All', ...Array.from(new Set(opportunities.map((o) => o.field)))],
    [opportunities]
  );

  const filteredOpps = useMemo(() => {
    return opportunities
      .filter((o) => {
        const q = searchQuery.trim().toLowerCase();
        if (q) {
          const hay = `${o.title} ${o.organization} ${o.description} ${o.required_skills.join(' ')}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        if (locationFilter !== 'All' && o.location !== locationFilter) return false;
        if (fieldFilter !== 'All' && o.field !== fieldFilter) return false;
        if (workModeFilter !== 'All' && o.work_mode !== workModeFilter) return false;
        if (typeFilter !== 'All' && o.employment_type !== typeFilter) return false;
        if (levelFilter !== 'All' && o.experience_level !== levelFilter) return false;
        return true;
      })
      .sort((a, b) => (b.match_percentage || 0) - (a.match_percentage || 0));
  }, [
    opportunities,
    searchQuery,
    locationFilter,
    fieldFilter,
    workModeFilter,
    typeFilter,
    levelFilter,
  ]);

  const toggleSave = async (oppId: number) => {
    if (!user) {
      setFeedback('Sign in or register to save opportunities to your dashboard.');
      return;
    }
    const isSaved = savedIds.has(oppId);
    try {
      if (isSaved) {
        await apiRequest(`/api/saved-jobs/${oppId}`, { method: 'DELETE' });
        const next = new Set(savedIds);
        next.delete(oppId);
        setSavedIds(next);
      } else {
        await apiRequest(`/api/saved-jobs/${oppId}`, { method: 'POST' });
        const next = new Set(savedIds);
        next.add(oppId);
        setSavedIds(next);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to update saved jobs.');
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingOpp || !user) return;
    setSubmittingApp(true);
    setError('');
    try {
      await apiRequest('/api/applications', {
        method: 'POST',
        body: JSON.stringify({
          opportunity_id: applyingOpp.id,
          cover_note: coverNote,
        }),
      });
      const next = new Set(appliedIds);
      next.add(applyingOpp.id);
      setAppliedIds(next);
      setFeedback(`Application submitted for ${applyingOpp.title}.`);
      setApplyingOpp(null);
      setCoverNote('');
    } catch (err: any) {
      setError(err.message || 'Unable to submit application.');
    } finally {
      setSubmittingApp(false);
    }
  };

  return (
    <div className="bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-teal-700 mb-1">
                Employment Opportunities & Skills Matching
              </p>
              <h1 className="font-display text-3xl font-bold text-slate-900">
                Find Opportunities Matched to Your Skills
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                {user
                  ? `Comparing roles against your ${user.skills.length} registered skills (${user.skills.join(', ')}).`
                  : 'Browse clearly labelled sample opportunities across 9 fields, or test skill matching below.'}
              </p>
            </div>
            {!user && (
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={guestSkills}
                  onChange={(e) => setGuestSkills(e.target.value)}
                  placeholder="Test skills: Python, SQL, React..."
                  className="px-3.5 py-2 text-sm border border-slate-300 rounded-lg w-60"
                />
                <button
                  type="button"
                  onClick={() => fetchAll(guestSkills)}
                  className="px-4 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg whitespace-nowrap shrink-0"
                >
                  Calculate Match
                </button>
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-3">
            <Info className="w-4 h-4 text-blue-800 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>Matching & Listing Transparency:</strong> Match percentages are automated estimates comparing registered skills to listed requirements—not hiring decisions or eligibility guarantees. Listings marked <em>Sample Opportunity</em> are demonstration roles created for this prototype unless submitted by a registered employer.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div className="md:col-span-2 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, skill, or organization..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <select
              aria-label="Filter by professional field"
              value={fieldFilter}
              onChange={(e) => setFieldFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
            >
              {uniqueFields.map((f) => (
                <option key={f} value={f}>
                  {f === 'All' ? 'All Fields' : f}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by location"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
            >
              {uniqueLocations.map((l) => (
                <option key={l} value={l}>
                  {l === 'All' ? 'All Locations' : l}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by remote or onsite"
              value={workModeFilter}
              onChange={(e) => setWorkModeFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
            >
              <option value="All">Remote & Onsite</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Onsite">Onsite</option>
            </select>

            <div className="flex gap-2">
              <select
                aria-label="Filter by employment type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="flex-1 px-2.5 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="All">All Types</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
              </select>
              <select
                aria-label="Filter by experience level"
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="flex-1 px-2.5 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="All">All Levels</option>
                <option value="Entry">Entry</option>
                <option value="Mid">Mid</option>
                <option value="Senior">Senior</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="tabular-nums">Showing {filteredOpps.length} of {opportunities.length} opportunities</span>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setLocationFilter('All');
                setFieldFilter('All');
                setWorkModeFilter('All');
                setTypeFilter('All');
                setLevelFilter('All');
              }}
              className="text-blue-800 font-medium hover:underline"
            >
              Reset filters
            </button>
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

        {/* Opportunities List */}
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-sm text-slate-500">
            Loading opportunities...
          </div>
        ) : filteredOpps.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-2">
            <h2 className="font-display text-lg font-semibold text-slate-900">
              No matching opportunities found
            </h2>
            <p className="text-sm text-slate-500">
              Try clearing one or more filters to view additional sample listings.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOpps.map((opp) => {
              const isSaved = savedIds.has(opp.id);
              const isApplied = appliedIds.has(opp.id);
              const matchPct = opp.match_percentage ?? 0;

              return (
                <article
                  key={opp.id}
                  className="bg-white border border-slate-200 rounded-xl p-6 transition-colors hover:border-slate-300"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    <div className="space-y-2.5 flex-1">
                      <div className="text-xs text-slate-500">
                        {opp.field} · {opp.is_sample ? 'Sample Opportunity (Demo)' : 'Employer Listing'} · Deadline{' '}
                        <span className="font-mono tabular-nums">{opp.deadline}</span>
                      </div>
                      <h2 className="font-display text-xl font-bold text-slate-900">
                        {opp.title}
                      </h2>
                      <div className="text-sm font-medium text-slate-800">
                        {opp.organization} · {opp.location} · {opp.work_mode} · {opp.employment_type} · {opp.experience_level} level
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
                        {opp.description}
                      </p>
                      <div className="pt-1 text-xs text-slate-600 space-y-1">
                        <div>
                          <span className="font-semibold text-slate-800">Required skills: </span>
                          {opp.required_skills.join(' · ')}
                        </div>
                        {opp.matched_skills && opp.matched_skills.length > 0 && (
                          <div className="text-teal-800">
                            <span className="font-semibold">Matched from your skills: </span>
                            {opp.matched_skills.join(' · ')}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="lg:w-64 flex flex-col justify-between gap-4 border-t lg:border-t-0 lg:border-l border-slate-200 pt-4 lg:pt-0 lg:pl-6 shrink-0">
                      <div>
                        <div className="flex items-baseline justify-between mb-1">
                          <span className="text-xs font-medium text-slate-500">Estimated Skill Match</span>
                          <span className="font-mono text-xl font-bold text-teal-800 tabular-nums">
                            {matchPct}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-teal-600"
                            style={{ width: `${matchPct}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {isApplied ? (
                          <div className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 text-sm font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg">
                            <CheckCircle2 className="w-4 h-4" />
                            Application Recorded
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (!user) {
                                onNavigate('login');
                                return;
                              }
                              setApplyingOpp(opp);
                            }}
                            className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-blue-800 hover:bg-blue-900 rounded-lg transition-colors"
                          >
                            {user ? 'Apply Now' : 'Sign In to Apply'}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => toggleSave(opp.id)}
                          className={`w-full inline-flex items-center justify-center gap-2 py-2 px-4 text-xs font-semibold rounded-lg border transition-colors ${
                            isSaved
                              ? 'bg-teal-50 border-teal-300 text-teal-900'
                              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                          {isSaved ? 'Saved' : 'Save Job'}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Apply Modal */}
      {applyingOpp && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">
                  Apply to {applyingOpp.title}
                </h2>
                <p className="text-xs text-slate-500">{applyingOpp.organization}</p>
              </div>
              <button
                type="button"
                onClick={() => setApplyingOpp(null)}
                aria-label="Close application modal"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-4">
              <div>
                <label htmlFor="cover-note" className="block text-xs font-medium text-slate-700 mb-1">
                  Brief Cover Note (highlights transferable skills & availability)
                </label>
                <textarea
                  id="cover-note"
                  rows={4}
                  required
                  value={coverNote}
                  onChange={(e) => setCoverNote(e.target.value)}
                  placeholder="Share why your experience aligns with this role..."
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setApplyingOpp(null)}
                  className="px-4 py-2 text-sm border border-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingApp}
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-800 hover:bg-blue-900 rounded-lg"
                >
                  {submittingApp ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
