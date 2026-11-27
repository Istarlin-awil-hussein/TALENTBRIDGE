import React from 'react';
import { AppRoute } from '../types';

interface FooterProps {
  onNavigate: (route: AppRoute) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const sdgs = [
    {
      code: 'SDG 4',
      title: 'Quality Education',
      desc: 'Supporting professional learning and skills development.',
    },
    {
      code: 'SDG 8',
      title: 'Decent Work & Economic Growth',
      desc: 'Promoting access to decent work and economic opportunities.',
    },
    {
      code: 'SDG 10',
      title: 'Reduced Inequalities',
      desc: 'Reducing barriers to economic participation.',
    },
    {
      code: 'SDG 16',
      title: 'Peace, Justice & Strong Institutions',
      desc: 'Supporting fair and transparent access to employment-related information.',
    },
    {
      code: 'SDG 17',
      title: 'Partnerships for the Goals',
      desc: 'Encouraging collaboration between employers, mentors, training providers and communities.',
    },
  ];

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12">
        {/* SDG Impact Row */}
        <div className="border-b border-slate-800 pb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-medium text-teal-400 mb-1">
                UN Sustainable Development Goals Alignment
              </p>
              <h2 className="font-display text-xl font-semibold text-white">
                Unlocking Displaced Talent: Pathways for Skilled Refugees
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('about')}
              className="text-sm font-medium text-teal-400 hover:text-teal-300 transition-colors self-start md:self-auto whitespace-nowrap shrink-0"
            >
              Read Full Initiative Brief
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {sdgs.map((sdg) => (
              <div
                key={sdg.code}
                className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4"
              >
                <div className="font-mono text-xs font-semibold text-teal-400 mb-1">
                  {sdg.code}
                </div>
                <div className="font-display text-sm font-semibold text-white mb-1.5">
                  {sdg.title}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{sdg.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation & Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="font-display text-xl font-bold text-white">SkillBridge</div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Your Skills. Your Future. Your Opportunity. Connecting displaced professionals with pathways to employment, credential guidance, and mentorship.
            </p>
            <p className="text-xs text-slate-400">
              Contact: partnerships@skillbridge.org
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Platform</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button type="button" onClick={() => onNavigate('home')} className="hover:text-white transition-colors">
                  Home
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('about')} className="hover:text-white transition-colors">
                  About the Initiative
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('opportunities')} className="hover:text-white transition-colors">
                  Find Opportunities
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('credentials')} className="hover:text-white transition-colors">
                  Skills & Credentials
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Support & Tools</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button type="button" onClick={() => onNavigate('readiness')} className="hover:text-white transition-colors">
                  Work & Financial Readiness
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('mentorship')} className="hover:text-white transition-colors">
                  Mentorship & Networks
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('assistant')} className="hover:text-white transition-colors">
                  AI Career Assistant
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('resources')} className="hover:text-white transition-colors">
                  Learning & Resource Centre
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Privacy & Transparency</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              SkillBridge collects only essential professional profile data and never requests refugee identification numbers or sensitive identity documents. The platform does not issue official credential verifications, legal advice, work permits, or banking access.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <span>© {new Date().getFullYear()} SkillBridge. Prototype platform for displaced talent pathways.</span>
          <div className="flex items-center gap-6">
            <button type="button" onClick={() => onNavigate('admin')} className="hover:text-white transition-colors">
              Admin Portal
            </button>
            <button type="button" onClick={() => onNavigate('register')} className="hover:text-white transition-colors">
              Create Account
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
