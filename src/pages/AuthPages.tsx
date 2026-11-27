import React, { useState } from 'react';
import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { apiRequest, setAuthToken } from '../api';
import { AppRoute, UserProfile, UserRole } from '../types';

interface AuthPagesProps {
  mode: 'login' | 'register';
  onNavigate: (route: AppRoute) => void;
  onAuthSuccess: (user: UserProfile, token: string) => void;
}

const PROFESSIONAL_FIELDS = [
  'Information Technology',
  'Software Development',
  'Data Analysis',
  'Digital Marketing',
  'Finance',
  'Healthcare Administration',
  'Project Management',
  'Community Development',
  'Humanitarian and NGO Work',
  'Civil & Infrastructure Engineering',
  'Education & Training',
];

const EDUCATION_LEVELS = [
  'Secondary / High School',
  'Vocational / Technical Diploma',
  "Associate's Degree",
  "Bachelor's Degree",
  "Master's Degree",
  'Doctorate / PhD',
  'Professional Certification Track',
];

export const AuthPages: React.FC<AuthPagesProps> = ({
  mode,
  onNavigate,
  onAuthSuccess,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Registration fields
  const [role, setRole] = useState<Exclude<UserRole, 'admin'>>('job_seeker');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('');
  const [professionalField, setProfessionalField] = useState('Software Development');
  const [educationLevel, setEducationLevel] = useState("Bachelor's Degree");
  const [skillsInput, setSkillsInput] = useState('');
  const [yearsExperience, setYearsExperience] = useState('3');

  const fillSampleProfile = () => {
    const suffix = Math.floor(100 + Math.random() * 900);
    setRole('job_seeker');
    setFullName('Nour Al-Khatib');
    setEmail(`nour.alkhatib.${suffix}@example.com`);
    setPassword('SkillBridge2026!');
    setCountry('Germany');
    setProfessionalField('Software Development');
    setEducationLevel("Bachelor's Degree");
    setSkillsInput('TypeScript, React, Node.js, SQL, Git');
    setYearsExperience('4');
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!loginEmail.trim() || !loginPassword) {
      setError('Please enter both your email address and password.');
      return;
    }
    setLoading(true);
    try {
      const data = await apiRequest<{ token: string; user: UserProfile }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),
      });
      setAuthToken(data.token);
      onAuthSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (fullName.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (country.trim().length < 2) {
      setError('Please enter your country of residence.');
      return;
    }
    if (!skillsInput.trim()) {
      setError('Please list at least one technical or professional skill (comma-separated).');
      return;
    }
    const yearsNum = Number(yearsExperience);
    if (!Number.isFinite(yearsNum) || yearsNum < 0 || yearsNum > 60) {
      setError('Years of professional experience must be between 0 and 60.');
      return;
    }

    setLoading(true);
    try {
      const data = await apiRequest<{ token: string; user: UserProfile }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          password,
          role,
          country: country.trim(),
          professional_field: professionalField,
          education_level: educationLevel,
          skills: skillsInput
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          years_experience: yearsNum,
        }),
      });
      setSuccessMsg('Registration successful. Redirecting to your SkillBridge dashboard...');
      setAuthToken(data.token);
      setTimeout(() => {
        onAuthSuccess(data.user, data.token);
      }, 600);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs">
          {/* Mode Switch Tabs */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
            <div>
              <h1 className="font-display text-2xl font-bold text-slate-900">
                {mode === 'login' ? 'Sign In to SkillBridge' : 'Create Your SkillBridge Account'}
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                {mode === 'login'
                  ? 'Access your dashboard, saved opportunities, credentials, and mentorship requests.'
                  : 'Connect your qualifications and experience to inclusive opportunities and mentors.'}
              </p>
            </div>
          </div>

          <div className="flex gap-2 p-1 bg-slate-100 rounded-lg mb-6">
            <button
              type="button"
              onClick={() => {
                setError('');
                onNavigate('login');
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setError('');
                onNavigate('register');
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === 'register'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Register
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800"
            >
              {error}
            </div>
          )}

          {successMsg && (
            <div
              role="status"
              className="mb-5 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-800"
            >
              {successMsg}
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 mb-1">
                  Email address
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                />
              </div>

              <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-3.5 py-2.5 pr-11 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-800"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 text-sm font-semibold text-white bg-blue-800 hover:bg-blue-900 disabled:opacity-60 rounded-lg transition-colors"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

              <p className="text-xs text-slate-500 text-center pt-2">
                New to SkillBridge?{' '}
                <button
                  type="button"
                  onClick={() => onNavigate('register')}
                  className="text-blue-800 font-semibold hover:underline"
                >
                  Register an account
                </button>
                {' · '}
                <button
                  type="button"
                  onClick={() => onNavigate('admin')}
                  className="text-slate-700 font-medium hover:underline"
                >
                  Administrator Login
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-3">
                <span className="text-xs text-slate-600">
                  Testing the prototype? Pre-fill sample registration fields in one click.
                </span>
                <button
                  type="button"
                  onClick={fillSampleProfile}
                  className="px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 hover:bg-teal-100 rounded-md transition-colors whitespace-nowrap shrink-0"
                >
                  Fill Sample Data
                </button>
              </div>

              {/* Account Type */}
              <div>
                <span className="block text-sm font-medium text-slate-700 mb-2">
                  Account type
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'job_seeker', label: 'Job Seeker', desc: 'Seeking roles & credentials' },
                    { id: 'employer', label: 'Employer', desc: 'Posting inclusive roles' },
                    { id: 'mentor', label: 'Mentor', desc: 'Advising displaced talent' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setRole(opt.id as Exclude<UserRole, 'admin'>)}
                      className={`text-left p-3 rounded-lg border transition-colors ${
                        role === opt.id
                          ? 'border-blue-700 bg-blue-50/70 text-blue-950'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-sm font-semibold">{opt.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reg-name" className="block text-sm font-medium text-slate-700 mb-1">
                    Full name
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g., Layla Hassan"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                </div>
                <div>
                  <label htmlFor="reg-email" className="block text-sm font-medium text-slate-700 mb-1">
                    Email address
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reg-password" className="block text-sm font-medium text-slate-700 mb-1">
                    Password (min. 8 characters)
                  </label>
                  <div className="relative">
                    <input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a strong password"
                      className="w-full px-3.5 py-2.5 pr-11 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-800"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="reg-country" className="block text-sm font-medium text-slate-700 mb-1">
                    Country of residence
                  </label>
                  <input
                    id="reg-country"
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g., Germany, Canada, Jordan"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reg-field" className="block text-sm font-medium text-slate-700 mb-1">
                    Professional field
                  </label>
                  <select
                    id="reg-field"
                    value={professionalField}
                    onChange={(e) => setProfessionalField(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                  >
                    {PROFESSIONAL_FIELDS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="reg-edu" className="block text-sm font-medium text-slate-700 mb-1">
                    Highest education level
                  </label>
                  <select
                    id="reg-edu"
                    value={educationLevel}
                    onChange={(e) => setEducationLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                  >
                    {EDUCATION_LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="reg-skills" className="block text-sm font-medium text-slate-700 mb-1">
                    Skills (comma-separated)
                  </label>
                  <input
                    id="reg-skills"
                    type="text"
                    required
                    value={skillsInput}
                    onChange={(e) => setSkillsInput(e.target.value)}
                    placeholder="e.g., Python, SQL, Project Management, Arabic"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                </div>
                <div>
                  <label htmlFor="reg-exp" className="block text-sm font-medium text-slate-700 mb-1">
                    Years experience
                  </label>
                  <input
                    id="reg-exp"
                    type="number"
                    min={0}
                    max={60}
                    required
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                </div>
              </div>

              {/* Privacy & Minimal Data Collection Notice */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>Privacy Commitment:</strong> SkillBridge collects only essential career profile fields. Never upload or enter refugee identification numbers, passport numbers, or sensitive legal status documents.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 text-sm font-semibold text-white bg-blue-800 hover:bg-blue-900 disabled:opacity-60 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                {loading ? 'Creating account...' : 'Create SkillBridge Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
