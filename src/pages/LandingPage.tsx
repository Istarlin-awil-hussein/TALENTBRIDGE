import React from 'react';
import { ArrowRight, BookOpen, Briefcase, Compass, Globe, ShieldCheck, Users } from 'lucide-react';
import { AppRoute, Opportunity } from '../types';
import { SafeImage } from '../components/SafeImage';

interface LandingPageProps {
  onNavigate: (route: AppRoute) => void;
  featuredOpportunities: Opportunity[];
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  featuredOpportunities,
}) => {
  const illustrativeStats = [
    {
      value: '18+',
      label: 'Professional Fields Mapped',
      context: 'Illustrative target taxonomy across IT, healthcare, finance & NGO sectors',
    },
    {
      value: '3 Tracks',
      label: 'Integrated Barrier Solutions',
      context: 'Credentials, Legal/Financial Readiness, and Networks',
    },
    {
      value: '9 Categories',
      label: 'Learning & Career Guides',
      context: 'Original open-access materials for transition readiness',
    },
    {
      value: '5 SDGs',
      label: 'Global Goal Alignment',
      context: 'UN SDGs 4, 8, 10, 16 & 17 embedded in platform design',
    },
  ];

  const howItWorks = [
    {
      step: '01. Build Your Professional Profile',
      desc: 'Document your degrees, work history, technical skills, and languages without submitting sensitive identity numbers.',
    },
    {
      step: '02. Map Credentials & Readiness',
      desc: 'Identify which qualifications require formal recognition and follow step-by-step work and financial readiness checklists.',
    },
    {
      step: '03. Match with Opportunities & Mentors',
      desc: 'Compare your skills against sample employer roles with transparent skill-match percentages and connect with mentors.',
    },
    {
      step: '04. Prepare with AI & Resources',
      desc: 'Use the AI Career Assistant and curated guides to localize your CV, practice interviews, and plan your next 90 days.',
    },
  ];

  const tracks = [
    {
      track: 'Track 1',
      title: 'Credential Recognition & Skills Validation',
      description:
        'Helps displaced professionals record degrees, certifications, work history, and portfolios clearly while navigating national recognition pathways and equivalency centers.',
      actionLabel: 'Open Skills & Credentials',
      route: 'credentials' as AppRoute,
      icon: ShieldCheck,
    },
    {
      track: 'Track 2',
      title: 'Legal, Regulatory & Financial Access',
      description:
        'Demystifies work authorization concepts, employment contracts, contractor invoicing, remote readiness, and financial literacy through interactive checklists.',
      actionLabel: 'Explore Work Readiness',
      route: 'readiness' as AppRoute,
      icon: Globe,
    },
    {
      track: 'Track 3',
      title: 'Local Experience & Professional Networks',
      description:
        'Bridges the local-experience gap through structured mentorship requests, peer networking circles, and skills-matched employer opportunities.',
      actionLabel: 'Connect with Mentors',
      route: 'mentorship' as AppRoute,
      icon: Users,
    },
  ];

  const illustrativeStories = [
    {
      name: 'Amira K. (Illustrative Example)',
      role: 'Civil Infrastructure Engineer · Relocated to Germany',
      before: '7 years managing municipal water systems, but struggled to explain regional credentials to European firms.',
      outcome: 'Used SkillBridge to map her portfolio, start ZAB recognition tracking, and prepare localized interview case studies.',
    },
    {
      name: 'Dawit M. (Illustrative Example)',
      role: 'Data & Operations Analyst · Relocated to the United Kingdom',
      before: 'Strong statistical background overlooked due to unfamiliar employer names and remote contract uncertainty.',
      outcome: 'Completed the invoicing & remote readiness checklist and connected with a senior analytics mentor for CV review.',
    },
    {
      name: 'Sana R. (Illustrative Example)',
      role: 'Healthcare Administration Lead · Relocated to Canada',
      before: 'Experienced clinic coordinator unsure how to transition while medical licensing remained in progress.',
      outcome: 'Identified non-regulated health operations pathways and matched 85% of required skills on community health listings.',
    },
  ];

  const sdgItems = [
    { code: 'SDG 4', title: 'Quality Education', desc: 'Supporting professional learning and skills development.' },
    { code: 'SDG 8', title: 'Decent Work & Economic Growth', desc: 'Promoting access to decent work and economic opportunities.' },
    { code: 'SDG 10', title: 'Reduced Inequalities', desc: 'Reducing barriers to economic participation.' },
    { code: 'SDG 16', title: 'Peace, Justice & Strong Institutions', desc: 'Supporting fair and transparent access to employment-related information.' },
    { code: 'SDG 17', title: 'Partnerships for the Goals', desc: 'Encouraging collaboration between employers, mentors, training providers and communities.' },
  ];

  return (
    <div className="bg-slate-50">
      {/* Hero Section */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-sm font-semibold text-teal-700 mb-3">
                Unlocking Displaced Talent: Pathways for Skilled Refugees
              </p>
              <h1
                className="font-display text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-[1.12] mb-5"
                style={{ textWrap: 'balance' }}
              >
                Unlock Your Potential. Connect Your Skills to Opportunity.
              </h1>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mb-8">
                Your education, experience and talent deserve recognition. SkillBridge helps displaced professionals showcase their abilities, discover opportunities and build meaningful professional connections.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => onNavigate('register')}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-blue-800 hover:bg-blue-900 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('opportunities')}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  Explore Opportunities
                </button>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="h-full min-h-[280px] sm:min-h-[360px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                <SafeImage
                  src="/src/assets/images/hero_skillbridge_1795763250735.jpg"
                  alt="Diverse skilled professionals collaborating around a workspace table with laptops and notebooks"
                  className="w-full h-full object-cover"
                  fallbackLabel="Diverse Professionals Collaborating"
                />
              </div>
            </div>
          </div>

          {/* Illustrative Figures Strip */}
          <div className="mt-12 pt-10 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
              <h2 className="font-display text-sm font-semibold text-slate-900">
                Platform Architecture & Illustrative Scope
              </h2>
              <span className="text-xs text-slate-500">
                Illustrative figures describing prototype scope — not historical placement metrics
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {illustrativeStats.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-5"
                >
                  <div className="font-mono text-2xl font-bold text-blue-900 tabular-nums mb-1">
                    {stat.value}
                  </div>
                  <div className="font-display text-sm font-semibold text-slate-900 mb-1">
                    {stat.label}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{stat.context}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why SkillBridge? */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5">
            <div className="rounded-xl overflow-hidden border border-slate-200 aspect-[4/3] bg-white">
              <SafeImage
                src="/src/assets/images/about_pathway_1795763251812.jpg"
                alt="Career mentor and displaced professional reviewing engineering work and portfolio credentials together"
                className="w-full h-full object-cover"
                fallbackLabel="Credential & Career Mentorship"
              />
            </div>
          </div>
          <div className="lg:col-span-7 space-y-5">
            <p className="text-sm font-semibold text-teal-700">Why SkillBridge?</p>
            <h2 className="font-display text-3xl font-bold text-slate-900 tracking-tight" style={{ textWrap: 'balance' }}>
              Ending Brain Waste Through Structured Pathways
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Millions of displaced professionals hold university degrees, technical certifications, and years of specialized experience—yet face systemic obstacles when rebuilding their careers in host economies.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="font-display text-sm font-semibold text-slate-900 mb-1.5">
                  Unrecognized Qualifications
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Complex equivalency rules and missing records often force qualified specialists into underemployment.
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="font-display text-sm font-semibold text-slate-900 mb-1.5">
                  Authorization & Finance
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Unclear contract norms, invoicing rules, and banking barriers delay formal and remote work access.
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="font-display text-sm font-semibold text-slate-900 mb-1.5">
                  Missing Local Networks
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Without local references or industry mentors, strong candidates struggle to get past initial screening.
                </p>
              </div>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onNavigate('about')}
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-800 hover:text-blue-900 transition-colors"
              >
                Read the full initiative overview
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Our Three Solution Tracks */}
      <section className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <p className="text-sm font-semibold text-teal-700 mb-2">Integrated Platform Architecture</p>
            <h2 className="font-display text-3xl font-bold text-slate-900 tracking-tight" style={{ textWrap: 'balance' }}>
              Our Three Solution Tracks
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {tracks.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.track}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-mono text-xs font-semibold text-teal-800">
                        {item.track}
                      </span>
                      <Icon className="w-5 h-5 text-blue-800" />
                    </div>
                    <h3 className="font-display text-lg font-bold text-slate-900 mb-2.5">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-6">
                      {item.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate(item.route)}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-800 hover:text-blue-900 transition-colors self-start"
                  >
                    {item.actionLabel}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-2xl mb-10">
          <p className="text-sm font-semibold text-teal-700 mb-2">Candidate & Employer Journey</p>
          <h2 className="font-display text-3xl font-bold text-slate-900 tracking-tight">
            How SkillBridge Works
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {howItWorks.map((item) => (
            <div key={item.step} className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="font-display text-base font-bold text-slate-900 mb-2">
                {item.step}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Opportunities */}
      <section className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-sm font-semibold text-teal-700 mb-1">
                Sample Opportunities · Skills-Matched Discovery
              </p>
              <h2 className="font-display text-3xl font-bold text-slate-900 tracking-tight">
                Featured Opportunities
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('opportunities')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-blue-800 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
            >
              View All Opportunities
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredOpportunities.slice(0, 3).map((opp) => (
              <div
                key={opp.id}
                className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="text-xs text-slate-500 mb-2">
                    {opp.field} · {opp.is_sample ? 'Sample Listing' : 'Employer Listing'}
                  </div>
                  <h3 className="font-display text-lg font-bold text-slate-900 mb-1">
                    {opp.title}
                  </h3>
                  <div className="text-sm font-medium text-slate-700 mb-3">
                    {opp.organization}
                  </div>
                  <div className="text-xs text-slate-600 mb-4">
                    {opp.location} · {opp.work_mode} · {opp.employment_type} · {opp.experience_level}
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 mb-4">
                    {opp.description}
                  </p>
                  <div className="text-xs text-slate-500 mb-5">
                    Key skills: {opp.required_skills.slice(0, 4).join(' · ')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('opportunities')}
                  className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Inspect Role & Skill Match
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Illustrative Success Stories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-2xl mb-10">
          <p className="text-sm font-semibold text-teal-700 mb-1">
            Illustrative Pathway Scenarios (Sample Examples)
          </p>
          <h2 className="font-display text-3xl font-bold text-slate-900 tracking-tight">
            How Displaced Talent Uses SkillBridge
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            The profiles below are clearly labelled illustrative scenarios showing how different professions navigate the platform.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {illustrativeStories.map((story) => (
            <div key={story.name} className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
              <div className="font-display text-base font-bold text-slate-900">{story.name}</div>
              <div className="text-xs font-medium text-teal-800">{story.role}</div>
              <div className="pt-2 border-t border-slate-100 space-y-2 text-sm text-slate-600">
                <p>
                  <span className="font-semibold text-slate-800">Challenge: </span>
                  {story.before}
                </p>
                <p>
                  <span className="font-semibold text-slate-800">Pathway: </span>
                  {story.outcome}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Our SDG Impact & Partners */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div>
            <p className="text-sm font-semibold text-teal-400 mb-2">Our SDG Impact</p>
            <h2 className="font-display text-3xl font-bold text-white tracking-tight mb-8">
              Aligned with Five Sustainable Development Goals
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {sdgItems.map((sdg) => (
                <div key={sdg.code} className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                  <div className="font-mono text-xs font-semibold text-teal-400 mb-1">
                    {sdg.code}
                  </div>
                  <div className="font-display text-sm font-bold text-white mb-2">
                    {sdg.title}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{sdg.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-10 border-t border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-3">
              <p className="text-sm font-semibold text-teal-400">Partners and Community</p>
              <h3 className="font-display text-2xl font-bold text-white">
                Built for Employers, Mentors, Training Providers & NGOs
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Sustainable inclusion requires ecosystem collaboration. Employers can register to post inclusive roles, experienced professionals can serve as mentors, and training bodies can share open credential guidance.
              </p>
            </div>
            <div className="lg:col-span-5 flex flex-wrap gap-3 lg:justify-end">
              <button
                type="button"
                onClick={() => onNavigate('register')}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <Briefcase className="w-4 h-4" />
                Join as Employer or Mentor
              </button>
              <button
                type="button"
                onClick={() => onNavigate('assistant')}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-600 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <Compass className="w-4 h-4" />
                Try AI Career Assistant
              </button>
              <button
                type="button"
                onClick={() => onNavigate('resources')}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-slate-200 border border-slate-600 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <BookOpen className="w-4 h-4" />
                Learning Centre
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
