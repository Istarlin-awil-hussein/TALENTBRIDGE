import React from 'react';
import { ArrowRight } from 'lucide-react';
import { AppRoute } from '../types';
import { SafeImage } from '../components/SafeImage';

interface AboutPageProps {
  onNavigate: (route: AppRoute) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  return (
    <div className="bg-slate-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-xl p-8 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <p className="text-sm font-semibold text-teal-700">
              Project Presentation · Unlocking Displaced Talent: Pathways for Skilled Refugees
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight" style={{ textWrap: 'balance' }}>
              Addressing Brain Waste Among Skilled Displaced Professionals
            </h1>
            <p className="text-slate-600 leading-relaxed">
              Across host nations, thousands of engineers, clinicians, educators, finance specialists, and project managers who have been displaced by conflict or crisis are locked out of their professions. Even when local economies face severe talent shortages, systemic friction prevents skilled refugees from applying their capabilities.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('register')}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-800 hover:bg-blue-900 rounded-lg transition-colors"
              >
                Create a Profile
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('opportunities')}
                className="px-5 py-2.5 text-sm font-semibold text-slate-800 border border-slate-300 bg-white hover:bg-slate-50 rounded-lg transition-colors"
              >
                Browse Sample Opportunities
              </button>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="rounded-xl overflow-hidden border border-slate-200 aspect-[4/3]">
              <SafeImage
                src="/src/assets/images/about_pathway_1795763251812.jpg"
                alt="Mentor and professional reviewing project blueprints"
                className="w-full h-full object-cover"
                fallbackLabel="SkillBridge Collaboration"
              />
            </div>
          </div>
        </div>

        {/* Three Barriers */}
        <section className="space-y-6">
          <div>
            <p className="text-sm font-semibold text-teal-700 mb-1">The Core Challenge</p>
            <h2 className="font-display text-2xl font-bold text-slate-900">
              Three Interlocking Barriers to Economic Inclusion
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-2">
              <div className="font-mono text-xs font-semibold text-blue-800">Barrier 01</div>
              <h3 className="font-display text-lg font-bold text-slate-900">Unrecognized Credentials</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Degrees and licenses earned abroad are often poorly understood by host employers, and displaced professionals may lack certified transcripts or clear guidance on national recognition agencies.
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-2">
              <div className="font-mono text-xs font-semibold text-blue-800">Barrier 02</div>
              <h3 className="font-display text-lg font-bold text-slate-900">Legal & Financial Friction</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Navigating employment documentation, contract clauses, cross-border invoicing, and payment readiness creates uncertainty for both candidates and prospective employers.
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-2">
              <div className="font-mono text-xs font-semibold text-blue-800">Barrier 03</div>
              <h3 className="font-display text-lg font-bold text-slate-900">Lack of Local Networks</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Hiring heavily favors local referrals and familiar employer names, leaving qualified newcomers isolated from mentors, industry norms, and peer communities.
              </p>
            </div>
          </div>
        </section>

        {/* Three Hackathon Solution Tracks */}
        <section className="bg-white border border-slate-200 rounded-xl p-8 space-y-6">
          <div>
            <p className="text-sm font-semibold text-teal-700 mb-1">Solution Architecture</p>
            <h2 className="font-display text-2xl font-bold text-slate-900">
              How SkillBridge Addresses All Three Tracks
            </h2>
          </div>
          <div className="divide-y divide-slate-200">
            <div className="py-5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              <div className="lg:col-span-4">
                <div className="font-mono text-xs font-semibold text-teal-700 mb-1">TRACK 1</div>
                <h3 className="font-display text-lg font-bold text-slate-900">
                  Credential Recognition & Skills Validation
                </h3>
              </div>
              <div className="lg:col-span-8 text-sm text-slate-600 leading-relaxed space-y-2">
                <p>
                  SkillBridge provides a structured <strong>Skills & Credentials</strong> workspace where candidates organize academic degrees, professional certifications, work history, language fluency, and public portfolio links. Users flag qualifications needing recognition and track readiness statuses (<em>Not started</em>, <em>In progress</em>, <em>Completed</em>) alongside transparent guidance distinguishing self-reported profiles from official verification bodies.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('credentials')}
                  className="text-blue-800 font-semibold hover:underline"
                >
                  Open Skills & Credentials Workspace →
                </button>
              </div>
            </div>

            <div className="py-5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              <div className="lg:col-span-4">
                <div className="font-mono text-xs font-semibold text-teal-700 mb-1">TRACK 2</div>
                <h3 className="font-display text-lg font-bold text-slate-900">
                  Legal, Regulatory & Financial Access
                </h3>
              </div>
              <div className="lg:col-span-8 text-sm text-slate-600 leading-relaxed space-y-2">
                <p>
                  Through the <strong>Work & Financial Readiness</strong> hub and <strong>Learning Centre</strong>, SkillBridge offers clear educational guides on employment documentation, contract terms, invoicing, financial literacy, and remote work setup—paired with an interactive readiness checklist and explicit disclaimers that the platform does not provide legal advice or banking authorization.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('readiness')}
                  className="text-blue-800 font-semibold hover:underline"
                >
                  Open Work & Financial Readiness →
                </button>
              </div>
            </div>

            <div className="py-5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              <div className="lg:col-span-4">
                <div className="font-mono text-xs font-semibold text-teal-700 mb-1">TRACK 3</div>
                <h3 className="font-display text-lg font-bold text-slate-900">
                  Local Experience & Professional Networks
                </h3>
              </div>
              <div className="lg:col-span-8 text-sm text-slate-600 leading-relaxed space-y-2">
                <p>
                  SkillBridge connects talent directly to <strong>Skills-Matched Opportunities</strong> (with transparent skill-overlap percentages), a <strong>Mentorship & Peer Network</strong> directory with request tracking, and an <strong>AI Career Assistant</strong> powered by Gemini to translate international experience into host-market CVs, cover letters, and interview strategies.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('mentorship')}
                  className="text-blue-800 font-semibold hover:underline"
                >
                  Explore Mentorship & Networks →
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Beneficiaries & Expected Impact */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            <h2 className="font-display text-xl font-bold text-slate-900">Intended Beneficiaries</h2>
            <ul className="space-y-2 text-sm text-slate-600 leading-relaxed">
              <li><strong>Skilled Refugees & Displaced Professionals:</strong> Specialists seeking dignified career continuity in technology, healthcare, engineering, finance, and community operations.</li>
              <li><strong>Inclusive Employers:</strong> Organizations seeking qualified talent and clearer visibility into international skills.</li>
              <li><strong>Volunteer Mentors & NGOs:</strong> Industry leaders and partner communities guiding workforce integration.</li>
            </ul>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            <h2 className="font-display text-xl font-bold text-slate-900">Expected Social & Economic Impact</h2>
            <ul className="space-y-2 text-sm text-slate-600 leading-relaxed">
              <li><strong>Reduced Underemployment:</strong> Accelerates discovery of roles aligned with prior training and transferable skills.</li>
              <li><strong>Privacy-First Dignity:</strong> Operates without collecting refugee identification numbers or sensitive status documents.</li>
              <li><strong>Host-Economy Resilience:</strong> Helps fill skilled labor gaps while advancing UN SDGs 4, 8, 10, 16, and 17.</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
};
