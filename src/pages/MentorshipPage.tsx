import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, CheckCircle2, UserPlus, Users, X } from 'lucide-react';
import { apiRequest } from '../api';
import { SafeImage } from '../components/SafeImage';
import {
  AppRoute,
  Mentor,
  MentorshipRequestRecord,
  PeerProfile,
  UserProfile,
} from '../types';

interface MentorshipPageProps {
  user: UserProfile | null;
  onNavigate: (route: AppRoute) => void;
}

export const MentorshipPage: React.FC<MentorshipPageProps> = ({ user, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'mentors' | 'network' | 'requests'>('mentors');
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [requests, setRequests] = useState<MentorshipRequestRecord[]>([]);
  const [peers, setPeers] = useState<PeerProfile[]>([]);
  const [fieldFilter, setFieldFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  // Selected mentor modal
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [goalText, setGoalText] = useState('');
  const [preferredSchedule, setPreferredSchedule] = useState('');
  const [submittingReq, setSubmittingReq] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiRequest<{ mentors: Mentor[] }>('/api/mentors'),
      apiRequest<{ peers: PeerProfile[] }>('/api/network/peers'),
      user
        ? apiRequest<{ requests: MentorshipRequestRecord[] }>('/api/mentorship-requests')
        : Promise.resolve({ requests: [] }),
    ])
      .then(([mRes, pRes, rRes]) => {
        setMentors(mRes.mentors);
        setPeers(pRes.peers);
        setRequests(rRes.requests);
      })
      .catch((err) => setError(err.message || 'Unable to load mentorship directory.'))
      .finally(() => setLoading(false));
  }, [user]);

  const fields = useMemo(
    () => ['All', ...Array.from(new Set(mentors.map((m) => m.field)))],
    [mentors]
  );

  const filteredMentors = useMemo(
    () => mentors.filter((m) => fieldFilter === 'All' || m.field === fieldFilter),
    [mentors, fieldFilter]
  );

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMentor || !user) return;
    setSubmittingReq(true);
    setError('');
    try {
      const res = await apiRequest<{ request: MentorshipRequestRecord }>(
        '/api/mentorship-requests',
        {
          method: 'POST',
          body: JSON.stringify({
            mentor_id: selectedMentor.id,
            goal: goalText,
            preferred_schedule: preferredSchedule,
          }),
        }
      );
      setRequests([res.request, ...requests]);
      setFeedback(`Mentorship request sent to ${selectedMentor.name}.`);
      setSelectedMentor(null);
      setGoalText('');
      setPreferredSchedule('');
      setActiveTab('requests');
    } catch (err: any) {
      setError(err.message || 'Failed to submit mentorship request.');
    } finally {
      setSubmittingReq(false);
    }
  };

  const handleConnectPeer = async (peerId: number) => {
    if (!user) {
      onNavigate('login');
      return;
    }
    try {
      await apiRequest('/api/network/connect', {
        method: 'POST',
        body: JSON.stringify({ target_user_id: peerId }),
      });
      setPeers(
        peers.map((p) => (p.id === peerId ? { ...p, connection_status: 'pending' } : p))
      );
      setFeedback('Connection request sent.');
    } catch (err: any) {
      setError(err.message || 'Unable to send connection request.');
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
                Track 3 · Local Experience & Professional Networks
              </p>
              <h1 className="font-display text-3xl font-bold text-slate-900">
                Mentorship & Professional Networks
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Browse clearly labelled sample mentor demonstrations, request career guidance, and connect with peer professionals.
              </p>
            </div>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
              <button
                type="button"
                onClick={() => setActiveTab('mentors')}
                className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  activeTab === 'mentors'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sample Mentors
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('network')}
                className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  activeTab === 'network'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Peer Network
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('requests')}
                className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  activeTab === 'requests'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                My Requests ({requests.length})
              </button>
            </div>
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

        {activeTab === 'mentors' && (
          <>
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <span className="text-xs text-slate-600">
                All mentor profiles below are <strong>sample demonstrations</strong> illustrating mentorship matching across fields.
              </span>
              <select
                aria-label="Filter mentors by profession"
                value={fieldFilter}
                onChange={(e) => setFieldFilter(e.target.value)}
                className="px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                {fields.map((f) => (
                  <option key={f} value={f}>
                    {f === 'All' ? 'All Professions' : f}
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-sm text-slate-500">
                Loading mentors...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMentors.map((mentor) => (
                  <div
                    key={mentor.id}
                    className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-3.5">
                        <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                          {mentor.avatar_url ? (
                            <SafeImage
                              src={mentor.avatar_url}
                              alt={mentor.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-blue-900 text-white font-display font-bold text-lg">
                              {mentor.name
                                .split(' ')
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join('')}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-xs text-teal-800 font-medium">
                            {mentor.field} · Sample Mentor
                          </div>
                          <h2 className="font-display text-base font-bold text-slate-900">
                            {mentor.name}
                          </h2>
                          <div className="text-xs text-slate-600">{mentor.profession}</div>
                        </div>
                      </div>

                      <div className="text-xs text-slate-500 flex items-center gap-3">
                        <span className="tabular-nums">{mentor.experience_years} yrs experience</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {mentor.availability}
                        </span>
                      </div>

                      <p className="text-sm text-slate-600 leading-relaxed">{mentor.bio}</p>

                      <div className="text-xs text-slate-500">
                        Focus areas: {mentor.skills.join(' · ')}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!user) {
                          onNavigate('login');
                          return;
                        }
                        setSelectedMentor(mentor);
                      }}
                      className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-blue-800 hover:bg-blue-900 rounded-lg transition-colors"
                    >
                      {user ? 'View Profile & Request' : 'Sign In to Request Mentorship'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'network' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-teal-700" />
                <p className="text-sm text-slate-700">
                  Connect with fellow professionals who opted into community networking. Personal emails and sensitive details are never exposed.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {peers.map((peer) => (
                <div
                  key={peer.id}
                  className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="text-xs text-slate-500">
                      {peer.professional_field} · {peer.country} ·{' '}
                      <span className="tabular-nums">{peer.years_experience} yrs exp</span>
                    </div>
                    <h3 className="font-display text-base font-bold text-slate-900">
                      {peer.full_name}
                    </h3>
                    <p className="text-xs font-medium text-teal-800">{peer.headline}</p>
                    {peer.bio && <p className="text-xs text-slate-600 leading-relaxed">{peer.bio}</p>}
                    <div className="text-xs text-slate-500 pt-1">
                      Skills: {peer.skills.join(' · ')}
                    </div>
                  </div>

                  {peer.connection_status === 'connected' || peer.connection_status === 'pending' ? (
                    <div className="inline-flex items-center justify-center gap-1.5 py-2 px-4 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 rounded-lg">
                      <CheckCircle2 className="w-4 h-4" />
                      Connection {peer.connection_status}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleConnectPeer(peer.id)}
                      className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                      Connect
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="font-display text-lg font-bold text-slate-900">
              Your Mentorship Requests
            </h2>
            {!user ? (
              <div className="py-6 text-sm text-slate-600">
                Please{' '}
                <button
                  type="button"
                  onClick={() => onNavigate('login')}
                  className="text-blue-800 font-semibold hover:underline"
                >
                  sign in
                </button>{' '}
                to view and manage your mentorship requests.
              </div>
            ) : requests.length === 0 ? (
              <p className="text-sm text-slate-500">
                You have not submitted any mentorship requests yet. Browse the Sample Mentors tab to start.
              </p>
            ) : (
              <div className="divide-y divide-slate-200">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="text-xs text-slate-500">
                        {req.mentor_field} · Preferred: {req.preferred_schedule || 'Flexible'}
                      </div>
                      <h3 className="font-display text-base font-bold text-slate-900">
                        {req.mentor_name} — {req.mentor_profession}
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">{req.goal}</p>
                    </div>
                    <span className="font-mono text-xs font-semibold text-teal-800 capitalize shrink-0">
                      Status: {req.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mentor Request Modal */}
      {selectedMentor && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <div className="text-xs text-teal-700 font-medium">Sample Mentor Profile</div>
                <h2 className="font-display text-lg font-bold text-slate-900">
                  Request Mentorship with {selectedMentor.name}
                </h2>
                <p className="text-xs text-slate-500">
                  {selectedMentor.profession} · {selectedMentor.availability}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMentor(null)}
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  What would you like guidance on? (CV review, interview prep, credential pathways)
                </label>
                <textarea
                  rows={3}
                  required
                  minLength={10}
                  value={goalText}
                  onChange={(e) => setGoalText(e.target.value)}
                  placeholder="Describe your background and what you hope to cover in a 30-minute session..."
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Preferred schedule / time zone
                </label>
                <input
                  type="text"
                  value={preferredSchedule}
                  onChange={(e) => setPreferredSchedule(e.target.value)}
                  placeholder="e.g., Tuesdays after 17:00 CET"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMentor(null)}
                  className="px-4 py-2 text-sm border border-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReq}
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-800 hover:bg-blue-900 rounded-lg"
                >
                  {submittingReq ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
