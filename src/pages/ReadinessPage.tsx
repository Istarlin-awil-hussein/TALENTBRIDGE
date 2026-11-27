import React, { useEffect, useState } from 'react';
import { CheckSquare, Info, Square } from 'lucide-react';
import { apiRequest } from '../api';
import { AppRoute, UserProfile } from '../types';

interface ReadinessPageProps {
  user: UserProfile | null;
  onNavigate: (route: AppRoute) => void;
}

const READINESS_MODULES = [
  {
    title: 'Understanding Work Authorization',
    summary:
      'Clarify the difference between asylum/protection status, open labor market access, employer-sponsored permits, and self-employment permissions before accepting offers.',
  },
  {
    title: 'Employment Documentation',
    summary:
      'Organize permitted tax identifiers, social insurance registration letters, and proof of address required by payroll teams during onboarding.',
  },
  {
    title: 'Professional Contracts',
    summary:
      'Review probation periods, notice requirements, intellectual property ownership, non-compete scope, and termination clauses prior to signing.',
  },
  {
    title: 'Invoicing & Freelance Scope',
    summary:
      'Include sequential invoice numbers, legal service descriptions, payment terms (Net 15/30), currency, and tax registration details on contractor invoices.',
  },
  {
    title: 'Financial Literacy & Budgeting',
    summary:
      'Separate gross salary from net take-home pay after income tax, pension, and health contributions; plan 3-month transition buffers.',
  },
  {
    title: 'Payment Readiness',
    summary:
      'Verify IBAN/local bank account rules, international wire fee structures, and whether cross-border remote employers use Employer-of-Record (EoR) partners.',
  },
  {
    title: 'Remote Work Readiness',
    summary:
      'Establish stable connectivity, UTC time-zone scheduling habits, written async updates, and data-security hygiene for distributed teams.',
  },
  {
    title: 'Understanding Employer Requirements',
    summary:
      'Learn what HR teams verify during onboarding—right-to-work checks, background references, and clear explanation of international work history.',
  },
];

const CHECKLIST_ITEMS = [
  {
    key: 'verify_work_scope',
    label: 'Confirmed my current residence permit allows salaried employment or freelance contracting',
  },
  {
    key: 'tax_registration',
    label: 'Located where to obtain a local tax identification number and social security record',
  },
  {
    key: 'contract_checklist',
    label: 'Reviewed standard employment contract elements (gross pay, notice period, IP, leave)',
  },
  {
    key: 'invoice_template',
    label: 'Prepared a compliant sample invoice template for remote or freelance consulting',
  },
  {
    key: 'payment_channel',
    label: 'Verified basic banking / payment account documentation requirements in my host country',
  },
  {
    key: 'remote_setup',
    label: 'Tested audio, video, calendar time-zone settings, and professional email signature',
  },
];

const COUNTRY_GUIDANCE: Record<
  string,
  { authority: string; notes: string; officialPortal: string }
> = {
  Germany: {
    authority: 'Federal Employment Agency (Bundesagentur für Arbeit) & Make it in Germany',
    notes:
      'Employment rights depend on residence title type; once permitted, standard onboarding requires a Steuer-ID (tax ID), health insurance enrollment, and a SEPA bank account.',
    officialPortal: 'https://www.make-it-in-germany.com/en/',
  },
  'United Kingdom': {
    authority: 'GOV.UK Right to Work & HMRC',
    notes:
      'Employers perform statutory online Right to Work share-code checks. Salaried employees receive a National Insurance Number and PAYE tax deductions.',
    officialPortal: 'https://www.gov.uk/prove-right-to-work',
  },
  Canada: {
    authority: 'IRCC & Service Canada (SIN)',
    notes:
      'Authorized workers apply for a Social Insurance Number (SIN) from Service Canada prior to starting payroll employment and verify provincial licensing for regulated trades.',
    officialPortal: 'https://www.canada.ca/en/employment-social-development/services/sin.html',
  },
  Jordan: {
    authority: 'Ministry of Labour (Jordan) & UNHCR Jordan Help',
    notes:
      'Work permit eligibility varies by sector and nationality; consult official Ministry of Labour and UNHCR livelihoods offices for current sector regulations.',
    officialPortal: 'https://help.unhcr.org/jordan/en/',
  },
  Kenya: {
    authority: 'Department of Refugee Services (DRS) & Kenya Revenue Authority',
    notes:
      'Under Kenya’s Refugee Act framework, work and business registration guidance is coordinated through DRS and county authorities.',
    officialPortal: 'https://help.unhcr.org/kenya/',
  },
};

export const ReadinessPage: React.FC<ReadinessPageProps> = ({ user, onNavigate }) => {
  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>({});
  const [selectedCountry, setSelectedCountry] = useState<string>('Germany');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    apiRequest<{ items: { item_key: string; completed: boolean }[] }>('/api/readiness')
      .then((res) => {
        const map: Record<string, boolean> = {};
        for (const item of res.items) {
          map[item.item_key] = item.completed;
        }
        setCompletedMap(map);
      })
      .catch((err) => setError(err.message || 'Unable to load readiness progress.'));
  }, [user]);

  const toggleItem = async (key: string) => {
    const nextVal = !completedMap[key];
    setCompletedMap((prev) => ({ ...prev, [key]: nextVal }));
    if (!user) return;
    try {
      await apiRequest('/api/readiness', {
        method: 'PUT',
        body: JSON.stringify({ item_key: key, completed: nextVal }),
      });
    } catch (err: any) {
      setError(err.message || 'Unable to save checklist state.');
    }
  };

  const completedCount = CHECKLIST_ITEMS.filter((i) => completedMap[i.key]).length;
  const countryInfo = COUNTRY_GUIDANCE[selectedCountry];

  return (
    <div className="bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header + Legal/Financial Disclaimer */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-teal-700 mb-1">
                Track 2 · Legal, Regulatory & Financial Access
              </p>
              <h1 className="font-display text-3xl font-bold text-slate-900">
                Work & Financial Readiness
              </h1>
              <p className="text-sm text-slate-600 mt-1 max-w-3xl">
                Practical educational guidance on work authorization concepts, contracts, invoicing, financial literacy, and remote work preparedness.
              </p>
            </div>
            {!user && (
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-800 hover:bg-blue-900 rounded-lg whitespace-nowrap shrink-0 self-start"
              >
                Sign In to Save Checklist
              </button>
            )}
          </div>

          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-950 leading-relaxed">
              <strong>Important Notice:</strong> SkillBridge provides general educational information only. The platform <strong>does not provide legal advice, authorize employment, issue work permits, or guarantee banking access</strong>. Always confirm regulations with official host-country authorities or licensed legal aid organizations.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Educational Modules (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h2 className="font-display text-xl font-bold text-slate-900">
                Core Readiness Guides
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {READINESS_MODULES.map((mod) => (
                  <div
                    key={mod.title}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5"
                  >
                    <h3 className="font-display text-sm font-bold text-slate-900">
                      {mod.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{mod.summary}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Country-Specific Orientation */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-bold text-slate-900">
                    Country-Specific Orientation Pointers
                  </h2>
                  <p className="text-xs text-slate-500">
                    General public-authority references where verified links are available
                  </p>
                </div>
                <select
                  aria-label="Select country guidance"
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  {Object.keys(COUNTRY_GUIDANCE).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {countryInfo && (
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-sm">
                  <div className="font-semibold text-slate-900">{countryInfo.authority}</div>
                  <p className="text-xs text-slate-600 leading-relaxed">{countryInfo.notes}</p>
                  <a
                    href={countryInfo.officialPortal}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs font-semibold text-blue-800 hover:underline"
                  >
                    Visit Official Public Portal →
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Checklist (5 cols) */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 sticky top-28">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-lg font-bold text-slate-900">
                    Interactive Readiness Checklist
                  </h2>
                  <p className="text-xs text-slate-500">
                    Mark steps completed as you prepare for local or remote roles
                  </p>
                </div>
                <span className="font-mono text-sm font-bold text-teal-800 tabular-nums">
                  {completedCount}/{CHECKLIST_ITEMS.length}
                </span>
              </div>

              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-600 transition-all duration-200"
                  style={{
                    width: `${Math.round((completedCount / CHECKLIST_ITEMS.length) * 100)}%`,
                  }}
                />
              </div>

              <div className="divide-y divide-slate-200">
                {CHECKLIST_ITEMS.map((item) => {
                  const checked = Boolean(completedMap[item.key]);
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => toggleItem(item.key)}
                      className="w-full py-3.5 text-left flex items-start gap-3 hover:bg-slate-50 rounded-lg px-2 transition-colors"
                    >
                      {checked ? (
                        <CheckSquare className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                      )}
                      <span
                        className={`text-sm leading-snug ${
                          checked ? 'text-slate-500 line-through' : 'text-slate-800'
                        }`}
                      >
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {!user && (
                <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">
                  Checklist ticks are previewed locally until you sign in to save permanently.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
