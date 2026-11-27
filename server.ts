import 'dotenv/config';
import crypto from 'crypto';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import db, { initDatabase } from './src/server/db.ts';
import {
  AuthenticatedRequest,
  hashPassword,
  optionalAuth,
  requireAdmin,
  requireAuth,
  signToken,
  verifyPassword,
} from './src/server/auth.ts';

initDatabase();

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));

function isValidEmail(email: unknown): email is string {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && email.length <= 160;
}

function isSafeHttpUrl(url: unknown): boolean {
  if (typeof url !== 'string' || !url.trim()) return true;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function parseJsonArray(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function formatUser(row: any) {
  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    role: row.role,
    country: row.country,
    professional_field: row.professional_field,
    education_level: row.education_level,
    skills: parseJsonArray(row.skills),
    years_experience: row.years_experience,
    headline: row.headline || '',
    bio: row.bio || '',
    networking_opt_in: Boolean(row.networking_opt_in),
    created_at: row.created_at,
  };
}

function computeSkillMatch(userSkills: string[], requiredSkills: string[]) {
  if (!requiredSkills.length) {
    return { match_percentage: 0, matched_skills: [] as string[], missing_skills: [] as string[] };
  }
  const normalizedUser = userSkills.map((s) => s.trim().toLowerCase()).filter(Boolean);
  const matched: string[] = [];
  const missing: string[] = [];

  for (const reqSkill of requiredSkills) {
    const reqLower = reqSkill.trim().toLowerCase();
    const isMatch = normalizedUser.some(
      (u) => u === reqLower || (u.length >= 3 && (reqLower.includes(u) || u.includes(reqLower)))
    );
    if (isMatch) {
      matched.push(reqSkill);
    } else {
      missing.push(reqSkill);
    }
  }

  const pct = normalizedUser.length === 0 ? 0 : Math.round((matched.length / requiredSkills.length) * 100);
  return { match_percentage: pct, matched_skills: matched, missing_skills: missing };
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'SkillBridge API' });
});

// Auth: Register
app.post('/api/auth/register', (req, res) => {
  const {
    full_name,
    email,
    password,
    role,
    country,
    professional_field,
    education_level,
    skills,
    years_experience,
  } = req.body || {};

  if (typeof full_name !== 'string' || full_name.trim().length < 2 || full_name.trim().length > 100) {
    return res.status(400).json({ error: 'Full name must be between 2 and 100 characters.' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return res.status(400).json({ error: 'Password must be between 8 and 128 characters.' });
  }
  if (!['job_seeker', 'employer', 'mentor'].includes(role)) {
    return res.status(400).json({ error: 'Account type must be job_seeker, employer, or mentor.' });
  }
  if (typeof country !== 'string' || country.trim().length < 2) {
    return res.status(400).json({ error: 'Please specify your country of residence.' });
  }
  if (typeof professional_field !== 'string' || professional_field.trim().length < 2) {
    return res.status(400).json({ error: 'Please specify your professional field.' });
  }
  if (typeof education_level !== 'string' || education_level.trim().length < 2) {
    return res.status(400).json({ error: 'Please select your highest education level.' });
  }

  const skillsArray: string[] = Array.isArray(skills)
    ? skills.map((s) => String(s).trim()).filter(Boolean).slice(0, 30)
    : typeof skills === 'string'
      ? skills.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 30)
      : [];

  if (skillsArray.length === 0) {
    return res.status(400).json({ error: 'Please enter at least one skill.' });
  }

  const expYears = Number(years_experience);
  if (!Number.isFinite(expYears) || expYears < 0 || expYears > 60) {
    return res.status(400).json({ error: 'Years of experience must be between 0 and 60.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email address already exists.' });
  }

  const passwordHash = hashPassword(password);
  const headline = `${professional_field.trim()} · ${Math.round(expYears)} yrs experience`;

  const result = db
    .prepare(
      `INSERT INTO users (full_name, email, password_hash, role, country, professional_field, education_level, skills, years_experience, headline, bio, networking_opt_in, is_sample)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', 1, 0)`
    )
    .run(
      full_name.trim(),
      cleanEmail,
      passwordHash,
      role,
      country.trim(),
      professional_field.trim(),
      education_level.trim(),
      JSON.stringify(skillsArray),
      Math.round(expYears),
      headline
    );

  const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid) as any;
  const token = signToken({ userId: userRow.id, role: userRow.role, email: userRow.email });

  return res.status(201).json({ token, user: formatUser(userRow) });
});

// Auth: Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!isValidEmail(email) || typeof password !== 'string' || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const userRow = db
    .prepare('SELECT * FROM users WHERE email = ? AND is_sample = 0')
    .get(cleanEmail) as any;

  if (!userRow || !verifyPassword(password, userRow.password_hash)) {
    return res.status(401).json({ error: 'Invalid email address or password.' });
  }

  const token = signToken({ userId: userRow.id, role: userRow.role, email: userRow.email });
  return res.json({ token, user: formatUser(userRow) });
});

// Auth: Current user
app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
  const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) as any;
  if (!userRow) {
    return res.status(404).json({ error: 'User not found.' });
  }
  return res.json({ user: formatUser(userRow) });
});

// Profile: Update
app.put('/api/profile', requireAuth, (req: AuthenticatedRequest, res) => {
  const {
    full_name,
    country,
    professional_field,
    education_level,
    skills,
    years_experience,
    headline,
    bio,
    networking_opt_in,
  } = req.body || {};

  if (typeof full_name !== 'string' || full_name.trim().length < 2 || full_name.trim().length > 100) {
    return res.status(400).json({ error: 'Full name must be between 2 and 100 characters.' });
  }

  const skillsArray: string[] = Array.isArray(skills)
    ? skills.map((s) => String(s).trim()).filter(Boolean).slice(0, 30)
    : typeof skills === 'string'
      ? skills.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 30)
      : [];

  const expYears = Math.max(0, Math.min(60, Math.round(Number(years_experience) || 0)));

  db.prepare(
    `UPDATE users SET
      full_name = ?,
      country = ?,
      professional_field = ?,
      education_level = ?,
      skills = ?,
      years_experience = ?,
      headline = ?,
      bio = ?,
      networking_opt_in = ?
     WHERE id = ?`
  ).run(
    full_name.trim(),
    typeof country === 'string' ? country.trim().slice(0, 80) : '',
    typeof professional_field === 'string' ? professional_field.trim().slice(0, 100) : '',
    typeof education_level === 'string' ? education_level.trim().slice(0, 100) : '',
    JSON.stringify(skillsArray),
    expYears,
    typeof headline === 'string' ? headline.trim().slice(0, 160) : '',
    typeof bio === 'string' ? bio.trim().slice(0, 1000) : '',
    networking_opt_in ? 1 : 0,
    req.user!.id
  );

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) as any;
  return res.json({ user: formatUser(updated) });
});

// Admin Auth Status & First-Run Claim / Login
app.get('/api/admin/status', (_req, res) => {
  const envPasscodeSet = Boolean(process.env.ADMIN_PASSCODE && process.env.ADMIN_PASSCODE.trim().length > 0);
  const claimedRow = db.prepare("SELECT value FROM admin_config WHERE key = 'admin_password_hash'").get() as
    | { value: string }
    | undefined;
  res.json({
    configured: envPasscodeSet || Boolean(claimedRow),
    envPasscodeSet,
  });
});

app.post('/api/admin/claim', (req, res) => {
  const envPasscode = process.env.ADMIN_PASSCODE?.trim();
  if (envPasscode) {
    return res.status(403).json({ error: 'Administrator passcode is already configured via server environment.' });
  }
  const existingHash = db.prepare("SELECT value FROM admin_config WHERE key = 'admin_password_hash'").get();
  if (existingHash) {
    return res.status(403).json({ error: 'Administrator credentials have already been claimed.' });
  }

  const { full_name, email, password } = req.body || {};
  if (typeof full_name !== 'string' || full_name.trim().length < 2) {
    return res.status(400).json({ error: 'Administrator name is required.' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Valid administrator email is required.' });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Administrator password must be at least 8 characters.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const pwHash = hashPassword(password);

  const tx = db.transaction(() => {
    db.prepare("INSERT INTO admin_config (key, value) VALUES ('admin_password_hash', ?)").run(pwHash);
    db.prepare("INSERT INTO admin_config (key, value) VALUES ('admin_email', ?)").run(cleanEmail);

    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail) as { id: number } | undefined;
    if (existingUser) {
      db.prepare("UPDATE users SET role = 'admin', password_hash = ?, full_name = ? WHERE id = ?").run(
        pwHash,
        full_name.trim(),
        existingUser.id
      );
      return existingUser.id;
    } else {
      const info = db
        .prepare(
          `INSERT INTO users (full_name, email, password_hash, role, country, professional_field, education_level, skills, years_experience, headline, bio, networking_opt_in, is_sample)
           VALUES (?, ?, ?, 'admin', 'Global', 'Platform Administration', 'Master''s Degree', '["Platform Governance","Operations"]', 5, 'SkillBridge Platform Administrator', '', 0, 0)`
        )
        .run(full_name.trim(), cleanEmail, pwHash);
      return Number(info.lastInsertRowid);
    }
  });

  const adminId = tx();
  const adminUser = db.prepare('SELECT * FROM users WHERE id = ?').get(adminId) as any;
  const token = signToken({ userId: adminUser.id, role: 'admin', email: adminUser.email });
  return res.status(201).json({ token, user: formatUser(adminUser) });
});

app.post('/api/admin/login', (req, res) => {
  const { passcode, email, password } = req.body || {};
  const envPasscode = process.env.ADMIN_PASSCODE?.trim();

  if (envPasscode) {
    if (typeof passcode !== 'string' || !passcode) {
      return res.status(400).json({ error: 'Administrator passcode is required.' });
    }
    const a = Buffer.from(passcode);
    const b = Buffer.from(envPasscode);
    const match = a.length === b.length && crypto.timingSafeEqual(a, b);
    if (!match) {
      return res.status(401).json({ error: 'Invalid administrator passcode.' });
    }
    let adminUser = db.prepare("SELECT * FROM users WHERE role = 'admin' AND is_sample = 0 LIMIT 1").get() as any;
    if (!adminUser) {
      const info = db
        .prepare(
          `INSERT INTO users (full_name, email, password_hash, role, country, professional_field, education_level, skills, years_experience, headline, bio, networking_opt_in, is_sample)
           VALUES ('Platform Administrator', 'admin@skillbridge.local', ?, 'admin', 'Global', 'Platform Administration', 'Postgraduate', '["Platform Governance"]', 5, 'SkillBridge Administrator', '', 0, 0)`
        )
        .run(hashPassword(envPasscode));
      adminUser = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
    }
    const token = signToken({ userId: adminUser.id, role: 'admin', email: adminUser.email });
    return res.json({ token, user: formatUser(adminUser) });
  }

  const storedHashRow = db.prepare("SELECT value FROM admin_config WHERE key = 'admin_password_hash'").get() as
    | { value: string }
    | undefined;
  const storedEmailRow = db.prepare("SELECT value FROM admin_config WHERE key = 'admin_email'").get() as
    | { value: string }
    | undefined;

  if (!storedHashRow || !storedEmailRow) {
    return res.status(400).json({ error: 'Administrator account has not been initialized yet.' });
  }

  if (!isValidEmail(email) || typeof password !== 'string') {
    return res.status(400).json({ error: 'Administrator email and password are required.' });
  }

  if (email.trim().toLowerCase() !== storedEmailRow.value || !verifyPassword(password, storedHashRow.value)) {
    return res.status(401).json({ error: 'Invalid administrator credentials.' });
  }

  const adminUser = db.prepare('SELECT * FROM users WHERE email = ? AND role = ?').get(storedEmailRow.value, 'admin') as any;
  if (!adminUser) {
    return res.status(401).json({ error: 'Administrator account not found.' });
  }
  const token = signToken({ userId: adminUser.id, role: 'admin', email: adminUser.email });
  return res.json({ token, user: formatUser(adminUser) });
});

// Qualifications & Skills Recognition
app.get('/api/qualifications', requireAuth, (req: AuthenticatedRequest, res) => {
  const rows = db
    .prepare('SELECT * FROM qualifications WHERE user_id = ? ORDER BY created_at DESC, id DESC')
    .all(req.user!.id) as any[];
  res.json({
    qualifications: rows.map((r) => ({
      ...r,
      needs_recognition: Boolean(r.needs_recognition),
    })),
  });
});

app.post('/api/qualifications', requireAuth, (req: AuthenticatedRequest, res) => {
  const {
    type,
    title,
    institution_or_org,
    country_or_proficiency,
    year_range,
    needs_recognition,
    recognition_status,
    notes,
    link_url,
  } = req.body || {};

  if (!['academic', 'certification', 'experience', 'language', 'portfolio'].includes(type)) {
    return res.status(400).json({ error: 'Invalid qualification type.' });
  }
  if (typeof title !== 'string' || title.trim().length < 2 || title.trim().length > 160) {
    return res.status(400).json({ error: 'Title must be between 2 and 160 characters.' });
  }
  if (!isSafeHttpUrl(link_url)) {
    return res.status(400).json({ error: 'Links must start with http:// or https://.' });
  }
  const status = ['not_started', 'in_progress', 'completed'].includes(recognition_status)
    ? recognition_status
    : 'not_started';

  const result = db
    .prepare(
      `INSERT INTO qualifications (user_id, type, title, institution_or_org, country_or_proficiency, year_range, needs_recognition, recognition_status, notes, link_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      req.user!.id,
      type,
      title.trim(),
      typeof institution_or_org === 'string' ? institution_or_org.trim().slice(0, 160) : '',
      typeof country_or_proficiency === 'string' ? country_or_proficiency.trim().slice(0, 120) : '',
      typeof year_range === 'string' ? year_range.trim().slice(0, 60) : '',
      needs_recognition ? 1 : 0,
      status,
      typeof notes === 'string' ? notes.trim().slice(0, 500) : '',
      typeof link_url === 'string' ? link_url.trim().slice(0, 300) : ''
    );

  const row = db.prepare('SELECT * FROM qualifications WHERE id = ?').get(result.lastInsertRowid) as any;
  res.status(201).json({ qualification: { ...row, needs_recognition: Boolean(row.needs_recognition) } });
});

app.patch('/api/qualifications/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const qualId = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM qualifications WHERE id = ? AND user_id = ?').get(qualId, req.user!.id) as any;
  if (!existing) {
    return res.status(404).json({ error: 'Qualification record not found.' });
  }
  const { recognition_status, needs_recognition } = req.body || {};
  const nextStatus = ['not_started', 'in_progress', 'completed'].includes(recognition_status)
    ? recognition_status
    : existing.recognition_status;
  const nextNeeds = typeof needs_recognition === 'boolean' ? (needs_recognition ? 1 : 0) : existing.needs_recognition;

  db.prepare('UPDATE qualifications SET recognition_status = ?, needs_recognition = ? WHERE id = ? AND user_id = ?').run(
    nextStatus,
    nextNeeds,
    qualId,
    req.user!.id
  );

  const updated = db.prepare('SELECT * FROM qualifications WHERE id = ?').get(qualId) as any;
  res.json({ qualification: { ...updated, needs_recognition: Boolean(updated.needs_recognition) } });
});

app.delete('/api/qualifications/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const qualId = Number(req.params.id);
  const info = db.prepare('DELETE FROM qualifications WHERE id = ? AND user_id = ?').run(qualId, req.user!.id);
  if (info.changes === 0) {
    return res.status(404).json({ error: 'Qualification record not found.' });
  }
  res.json({ deleted: true });
});

// Credential Readiness Checklist
app.get('/api/credential-checklist', requireAuth, (req: AuthenticatedRequest, res) => {
  const rows = db
    .prepare('SELECT item_key, status, updated_at FROM credential_checklist WHERE user_id = ?')
    .all(req.user!.id);
  res.json({ items: rows });
});

app.put('/api/credential-checklist', requireAuth, (req: AuthenticatedRequest, res) => {
  const { item_key, status } = req.body || {};
  if (typeof item_key !== 'string' || !item_key.trim() || item_key.length > 80) {
    return res.status(400).json({ error: 'Invalid checklist item key.' });
  }
  if (!['not_started', 'in_progress', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'Status must be not_started, in_progress, or completed.' });
  }

  db.prepare(
    `INSERT INTO credential_checklist (user_id, item_key, status, updated_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(user_id, item_key) DO UPDATE SET status = excluded.status, updated_at = datetime('now')`
  ).run(req.user!.id, item_key.trim(), status);

  res.json({ item_key: item_key.trim(), status });
});

// Work & Financial Readiness Checklist
app.get('/api/readiness', requireAuth, (req: AuthenticatedRequest, res) => {
  const rows = db
    .prepare('SELECT item_key, completed, updated_at FROM readiness_progress WHERE user_id = ?')
    .all(req.user!.id) as any[];
  res.json({
    items: rows.map((r) => ({ ...r, completed: Boolean(r.completed) })),
  });
});

app.put('/api/readiness', requireAuth, (req: AuthenticatedRequest, res) => {
  const { item_key, completed } = req.body || {};
  if (typeof item_key !== 'string' || !item_key.trim() || item_key.length > 80) {
    return res.status(400).json({ error: 'Invalid readiness item key.' });
  }
  const doneInt = completed ? 1 : 0;

  db.prepare(
    `INSERT INTO readiness_progress (user_id, item_key, completed, updated_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(user_id, item_key) DO UPDATE SET completed = excluded.completed, updated_at = datetime('now')`
  ).run(req.user!.id, item_key.trim(), doneInt);

  res.json({ item_key: item_key.trim(), completed: Boolean(doneInt) });
});

// Opportunities & Skills Matching
app.get('/api/opportunities', optionalAuth, (req: AuthenticatedRequest, res) => {
  let userSkills: string[] = [];
  if (req.user) {
    const u = db.prepare('SELECT skills FROM users WHERE id = ?').get(req.user.id) as { skills: string } | undefined;
    if (u) userSkills = parseJsonArray(u.skills);
  } else if (typeof req.query.skills === 'string' && req.query.skills.trim()) {
    userSkills = req.query.skills.split(',').map((s) => s.trim()).filter(Boolean);
  }

  const rows = db
    .prepare("SELECT * FROM opportunities WHERE status = 'published' ORDER BY created_at DESC, id DESC")
    .all() as any[];

  const formatted = rows.map((r) => {
    const reqSkills = parseJsonArray(r.required_skills);
    const match = computeSkillMatch(userSkills, reqSkills);
    return {
      id: r.id,
      title: r.title,
      organization: r.organization,
      location: r.location,
      work_mode: r.work_mode,
      employment_type: r.employment_type,
      field: r.field,
      experience_level: r.experience_level,
      required_skills: reqSkills,
      description: r.description,
      deadline: r.deadline,
      is_sample: Boolean(r.is_sample),
      status: r.status,
      created_at: r.created_at,
      ...match,
    };
  });

  res.json({ opportunities: formatted });
});

app.post('/api/opportunities', requireAuth, (req: AuthenticatedRequest, res) => {
  if (req.user!.role !== 'employer' && req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'Only employers or administrators can publish opportunities.' });
  }

  const {
    title,
    organization,
    location,
    work_mode,
    employment_type,
    field,
    experience_level,
    required_skills,
    description,
    deadline,
  } = req.body || {};

  if (typeof title !== 'string' || title.trim().length < 3) {
    return res.status(400).json({ error: 'Job title is required.' });
  }
  if (typeof organization !== 'string' || organization.trim().length < 2) {
    return res.status(400).json({ error: 'Organization name is required.' });
  }
  if (typeof location !== 'string' || location.trim().length < 2) {
    return res.status(400).json({ error: 'Location is required.' });
  }
  if (!['Remote', 'Onsite', 'Hybrid'].includes(work_mode)) {
    return res.status(400).json({ error: 'Invalid work mode.' });
  }
  if (!['Full-time', 'Part-time', 'Contract'].includes(employment_type)) {
    return res.status(400).json({ error: 'Invalid employment type.' });
  }
  if (!['Entry', 'Mid', 'Senior'].includes(experience_level)) {
    return res.status(400).json({ error: 'Invalid experience level.' });
  }
  if (typeof field !== 'string' || !field.trim()) {
    return res.status(400).json({ error: 'Professional field is required.' });
  }
  if (typeof description !== 'string' || description.trim().length < 15) {
    return res.status(400).json({ error: 'Please provide a clear job description (min 15 characters).' });
  }

  const reqSkillsArr = Array.isArray(required_skills)
    ? required_skills.map((s) => String(s).trim()).filter(Boolean)
    : typeof required_skills === 'string'
      ? required_skills.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

  const status = req.user!.role === 'admin' ? 'published' : 'pending_review';
  const isSample = req.user!.role === 'admin' ? 1 : 0;

  const result = db
    .prepare(
      `INSERT INTO opportunities (title, organization, location, work_mode, employment_type, field, experience_level, required_skills, description, deadline, is_sample, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      title.trim(),
      organization.trim(),
      location.trim(),
      work_mode,
      employment_type,
      field.trim(),
      experience_level,
      JSON.stringify(reqSkillsArr),
      description.trim(),
      typeof deadline === 'string' && deadline.trim() ? deadline.trim() : '2027-04-01',
      isSample,
      status,
      req.user!.id
    );

  const row = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(result.lastInsertRowid) as any;
  res.status(201).json({
    opportunity: {
      ...row,
      required_skills: parseJsonArray(row.required_skills),
      is_sample: Boolean(row.is_sample),
    },
  });
});

// Applications & Saved Jobs
app.get('/api/applications', requireAuth, (req: AuthenticatedRequest, res) => {
  const rows = db
    .prepare(
      `SELECT a.*, o.title as opportunity_title, o.organization, o.location, o.field
       FROM applications a
       JOIN opportunities o ON o.id = a.opportunity_id
       WHERE a.user_id = ?
       ORDER BY a.created_at DESC`
    )
    .all(req.user!.id);
  res.json({ applications: rows });
});

app.post('/api/applications', requireAuth, (req: AuthenticatedRequest, res) => {
  const { opportunity_id, cover_note } = req.body || {};
  const oppId = Number(opportunity_id);
  if (!Number.isInteger(oppId)) {
    return res.status(400).json({ error: 'Valid opportunity ID is required.' });
  }
  const opp = db.prepare("SELECT id FROM opportunities WHERE id = ? AND status = 'published'").get(oppId);
  if (!opp) {
    return res.status(404).json({ error: 'Opportunity not found.' });
  }
  const existing = db
    .prepare('SELECT id FROM applications WHERE user_id = ? AND opportunity_id = ?')
    .get(req.user!.id, oppId);
  if (existing) {
    return res.status(409).json({ error: 'You have already submitted an application for this opportunity.' });
  }

  const result = db
    .prepare('INSERT INTO applications (user_id, opportunity_id, cover_note, status) VALUES (?, ?, ?, ?)')
    .run(req.user!.id, oppId, typeof cover_note === 'string' ? cover_note.trim().slice(0, 2000) : '', 'submitted');

  const row = db
    .prepare(
      `SELECT a.*, o.title as opportunity_title, o.organization, o.location, o.field
       FROM applications a JOIN opportunities o ON o.id = a.opportunity_id WHERE a.id = ?`
    )
    .get(result.lastInsertRowid);
  res.status(201).json({ application: row });
});

app.get('/api/saved-jobs', requireAuth, (req: AuthenticatedRequest, res) => {
  const rows = db
    .prepare(
      `SELECT o.*, s.created_at as saved_at
       FROM saved_jobs s
       JOIN opportunities o ON o.id = s.opportunity_id
       WHERE s.user_id = ?
       ORDER BY s.created_at DESC`
    )
    .all(req.user!.id) as any[];
  res.json({
    savedJobs: rows.map((r) => ({
      ...r,
      required_skills: parseJsonArray(r.required_skills),
      is_sample: Boolean(r.is_sample),
    })),
  });
});

app.post('/api/saved-jobs/:opportunityId', requireAuth, (req: AuthenticatedRequest, res) => {
  const oppId = Number(req.params.opportunityId);
  const opp = db.prepare('SELECT id FROM opportunities WHERE id = ?').get(oppId);
  if (!opp) {
    return res.status(404).json({ error: 'Opportunity not found.' });
  }
  db.prepare('INSERT OR IGNORE INTO saved_jobs (user_id, opportunity_id) VALUES (?, ?)').run(req.user!.id, oppId);
  res.status(201).json({ saved: true, opportunity_id: oppId });
});

app.delete('/api/saved-jobs/:opportunityId', requireAuth, (req: AuthenticatedRequest, res) => {
  const oppId = Number(req.params.opportunityId);
  db.prepare('DELETE FROM saved_jobs WHERE user_id = ? AND opportunity_id = ?').run(req.user!.id, oppId);
  res.json({ saved: false, opportunity_id: oppId });
});

// Mentors & Mentorship Requests
app.get('/api/mentors', (_req, res) => {
  const rows = db.prepare('SELECT * FROM mentors ORDER BY id ASC').all() as any[];
  res.json({
    mentors: rows.map((m) => ({
      ...m,
      skills: parseJsonArray(m.skills),
      is_sample: Boolean(m.is_sample),
    })),
  });
});

app.get('/api/mentorship-requests', requireAuth, (req: AuthenticatedRequest, res) => {
  const rows = db
    .prepare(
      `SELECT mr.*, m.name as mentor_name, m.profession as mentor_profession, m.field as mentor_field
       FROM mentorship_requests mr
       JOIN mentors m ON m.id = mr.mentor_id
       WHERE mr.user_id = ?
       ORDER BY mr.created_at DESC`
    )
    .all(req.user!.id);
  res.json({ requests: rows });
});

app.post('/api/mentorship-requests', requireAuth, (req: AuthenticatedRequest, res) => {
  const { mentor_id, goal, preferred_schedule } = req.body || {};
  const mentorId = Number(mentor_id);
  const mentor = db.prepare('SELECT id FROM mentors WHERE id = ?').get(mentorId);
  if (!mentor) {
    return res.status(404).json({ error: 'Mentor profile not found.' });
  }
  if (typeof goal !== 'string' || goal.trim().length < 10 || goal.trim().length > 1000) {
    return res.status(400).json({ error: 'Please describe your mentorship goal (10–1000 characters).' });
  }

  const result = db
    .prepare(
      'INSERT INTO mentorship_requests (user_id, mentor_id, goal, preferred_schedule, status) VALUES (?, ?, ?, ?, ?)'
    )
    .run(
      req.user!.id,
      mentorId,
      goal.trim(),
      typeof preferred_schedule === 'string' ? preferred_schedule.trim().slice(0, 160) : '',
      'pending'
    );

  const row = db
    .prepare(
      `SELECT mr.*, m.name as mentor_name, m.profession as mentor_profession, m.field as mentor_field
       FROM mentorship_requests mr
       JOIN mentors m ON m.id = mr.mentor_id
       WHERE mr.id = ?`
    )
    .get(result.lastInsertRowid);
  res.status(201).json({ request: row });
});

// Professional Networking Directory (privacy-preserving: excludes emails and non-opted-in users)
app.get('/api/network/peers', optionalAuth, (req: AuthenticatedRequest, res) => {
  const currentUserId = req.user?.id ?? -1;
  const rows = db
    .prepare(
      `SELECT id, full_name, role, country, professional_field, skills, years_experience, headline, bio, is_sample
       FROM users
       WHERE networking_opt_in = 1 AND role != 'admin' AND id != ?
       ORDER BY is_sample ASC, id DESC
       LIMIT 30`
    )
    .all(currentUserId) as any[];

  const connections = req.user
    ? (db
        .prepare('SELECT target_user_id, status FROM network_connections WHERE requester_id = ?')
        .all(req.user.id) as { target_user_id: number; status: 'pending' | 'connected' }[])
    : [];

  const connMap = new Map(connections.map((c) => [c.target_user_id, c.status]));

  res.json({
    peers: rows.map((p) => ({
      ...p,
      skills: parseJsonArray(p.skills),
      is_sample: Boolean(p.is_sample),
      connection_status: connMap.get(p.id) || 'none',
    })),
  });
});

app.post('/api/network/connect', requireAuth, (req: AuthenticatedRequest, res) => {
  const { target_user_id, note } = req.body || {};
  const targetId = Number(target_user_id);
  if (!Number.isInteger(targetId) || targetId === req.user!.id) {
    return res.status(400).json({ error: 'Invalid community member selection.' });
  }
  const target = db
    .prepare('SELECT id FROM users WHERE id = ? AND networking_opt_in = 1')
    .get(targetId);
  if (!target) {
    return res.status(404).json({ error: 'Community member not found or not open to networking.' });
  }

  db.prepare(
    `INSERT OR IGNORE INTO network_connections (requester_id, target_user_id, note, status)
     VALUES (?, ?, ?, 'pending')`
  ).run(req.user!.id, targetId, typeof note === 'string' ? note.trim().slice(0, 300) : '');

  res.status(201).json({ target_user_id: targetId, status: 'pending' });
});

// Learning & Resource Centre
app.get('/api/resources', (_req, res) => {
  const rows = db.prepare('SELECT * FROM resources ORDER BY id ASC').all() as any[];
  res.json({
    resources: rows.map((r) => ({
      ...r,
      is_external: Boolean(r.is_external),
    })),
  });
});

// AI Career Assistant (Server-side Gemini API proxy + transparent Demo Mode when key is unconfigured)
function buildDemoAssistantResponse(message: string, userContext: any): string {
  const lower = message.toLowerCase();
  const field = userContext?.professional_field || 'your professional field';
  const skills = Array.isArray(userContext?.skills) && userContext.skills.length
    ? userContext.skills.join(', ')
    : 'your core technical and operational skills';

  if (lower.includes('cover letter')) {
    return [
      `**Demo Career Coaching Draft (Sample Guidance)**`,
      ``,
      `Here is a structured cover letter outline tailored to **${field}** using ${skills}:`,
      ``,
      `**Opening:** Express focused interest in the role and summarize your ${userContext?.years_experience ?? 3}+ years of applied experience in ${field}.`,
      `**Evidence & Transferable Impact:** Highlight two measurable achievements (e.g., systems delivered, process improvements, or cross-functional projects) without needing local employer names to carry the story—add a brief 1-line descriptor for international organizations.`,
      `**Closing:** Emphasize adaptability across distributed or multilingual teams and readiness for an interview.`,
      ``,
      `*Note: This response was generated in offline Demo Mode because no Gemini API key is active on the server. Review and personalize all details before applying.*`,
    ].join('\n');
  }

  if (lower.includes('interview')) {
    return [
      `**Demo Interview Preparation Guide**`,
      ``,
      `For roles in **${field}**, structure your responses using **Context → Action → Result**:`,
      `1. **Transferable Technical Depth:** Walk through one complex challenge where you applied ${skills}.`,
      `2. **Addressing Displacement Gaps Constructively:** Keep any career transition summary brief (1–2 sentences) and pivot directly to upskilling, volunteer work, or portfolio projects completed since relocating.`,
      `3. **Questions to Ask Employers:** Ask about onboarding support, team communication cadence, and 90-day success milestones.`,
      ``,
      `*Note: Generated in Demo Mode. Configure GEMINI_API_KEY in server secrets for live AI coaching.*`,
    ].join('\n');
  }

  if (lower.includes('cv') || lower.includes('resume') || lower.includes('profile')) {
    return [
      `**Demo CV & Profile Review Suggestions**`,
      ``,
      `To strengthen your profile in **${field}**:`,
      `- **Headline:** Pair your core discipline with measurable focus (e.g., *"${field} Specialist · ${skills.split(',')[0]}"*).`,
      `- **Credential Clarity:** List degrees with the field of study and graduation year, and add a short note if official equivalency is in progress rather than omitting your degree.`,
      `- **Outcome Bullets:** Start bullets with strong action verbs (*Designed, Coordinated, Automated, Analyzed*) followed by scope and impact.`,
      ``,
      `*Note: Generated in Demo Mode. SkillBridge does not verify credentials or guarantee hiring outcomes.*`,
    ].join('\n');
  }

  return [
    `**Demo Career Pathway Coaching (${field})**`,
    ``,
    `Based on your profile (${skills}), here are three practical next steps:`,
    `1. **Translate Transferable Skills:** Map your existing strengths into internationally recognized terminology used in target job descriptions.`,
    `2. **Bridge Local Experience:** Package 1–2 concrete portfolio samples or case studies demonstrating how you solve real problems in ${field}.`,
    `3. **Targeted Readiness:** Check the **Skills & Credentials** and **Work & Financial Readiness** sections to identify whether your target profession is regulated in your host country.`,
    ``,
    `*Note: Currently running in clearly labelled Demo Mode (no active Gemini API key detected on server). SkillBridge AI does not invent job openings, certify credentials, or provide legal advice.*`,
  ].join('\n');
}

app.post('/api/ai/career-assistant', optionalAuth, async (req: AuthenticatedRequest, res) => {
  const { message, history } = req.body || {};
  if (typeof message !== 'string' || message.trim().length < 2 || message.trim().length > 2000) {
    return res.status(400).json({ error: 'Please enter a message between 2 and 2000 characters.' });
  }

  let userContext: any = null;
  if (req.user) {
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id) as any;
    if (row) userContext = formatUser(row);
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const isKeyConfigured = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY' && !apiKey.startsWith('YOUR_'));

  if (!isKeyConfigured) {
    return res.json({
      mode: 'demo',
      reply: buildDemoAssistantResponse(message.trim(), userContext),
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const profileSummary = userContext
      ? `Authenticated user profile:
- Role: ${userContext.role}
- Field: ${userContext.professional_field}
- Country of residence: ${userContext.country}
- Education: ${userContext.education_level}
- Experience: ${userContext.years_experience} years
- Registered skills: ${userContext.skills.join(', ')}`
      : 'User is browsing as a guest (no profile context provided).';

    const recentTurns = Array.isArray(history)
      ? history
          .slice(-6)
          .filter((h: any) => h && (h.role === 'user' || h.role === 'assistant') && typeof h.content === 'string')
          .map((h: any) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content.slice(0, 600)}`)
          .join('\n')
      : '';

    const systemInstruction = `You are the SkillBridge AI Career Assistant supporting skilled refugees and displaced professionals.
Help users with:
- Identifying transferable skills across borders and industries
- Improving professional profiles and CVs
- Drafting tailored cover letters (using placeholders for specific company details)
- Preparing for behavioral and technical interviews
- Understanding career pathways, skill gaps, and structured 30-60-90 day development plans

Strict Guardrails:
1. NEVER invent or claim real active job openings, specific salaries, or hiring outcomes.
2. NEVER claim that SkillBridge verifies academic credentials or issues official recognition.
3. NEVER provide legal, immigration, visa, or regulated banking/tax advice—direct users to official national authorities or licensed legal aid where relevant.
4. Keep responses concise, structured, respectful, and immediately actionable (around 150-300 words unless asked for a detailed cover letter).

${profileSummary}`;

    const fullPrompt = recentTurns ? `${recentTurns}\nUser: ${message.trim()}` : message.trim();

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: fullPrompt,
      config: {
        systemInstruction,
      },
    });

    const replyText = response.text?.trim();
    if (!replyText) {
      return res.status(502).json({ error: 'The AI model returned an empty response. Please try again.' });
    }

    return res.json({
      mode: 'live',
      reply: replyText,
    });
  } catch (err: any) {
    const errMsg = err?.message || 'Failed to generate AI career guidance.';
    return res.status(502).json({
      error: `Gemini API error: ${errMsg}`,
    });
  }
});

// Admin Dashboard Routes
app.get('/api/admin/stats', requireAdmin, (_req, res) => {
  const totalUsers = (db.prepare('SELECT COUNT(*) as cnt FROM users WHERE is_sample = 0').get() as any).cnt;
  const jobSeekers = (db.prepare("SELECT COUNT(*) as cnt FROM users WHERE is_sample = 0 AND role = 'job_seeker'").get() as any).cnt;
  const employers = (db.prepare("SELECT COUNT(*) as cnt FROM users WHERE is_sample = 0 AND role = 'employer'").get() as any).cnt;
  const mentorsCount = (db.prepare('SELECT COUNT(*) as cnt FROM mentors').get() as any).cnt;
  const publishedOpportunities = (db.prepare("SELECT COUNT(*) as cnt FROM opportunities WHERE status = 'published'").get() as any).cnt;
  const pendingOpportunities = (db.prepare("SELECT COUNT(*) as cnt FROM opportunities WHERE status = 'pending_review'").get() as any).cnt;
  const applicationsCount = (db.prepare('SELECT COUNT(*) as cnt FROM applications').get() as any).cnt;
  const mentorshipRequestsCount = (db.prepare('SELECT COUNT(*) as cnt FROM mentorship_requests').get() as any).cnt;

  const oppFields = db
    .prepare("SELECT field, COUNT(*) as count FROM opportunities WHERE status != 'archived' GROUP BY field ORDER BY count DESC")
    .all() as { field: string; count: number }[];

  const userFields = db
    .prepare("SELECT professional_field as field, COUNT(*) as count FROM users WHERE professional_field != '' GROUP BY professional_field ORDER BY count DESC LIMIT 8")
    .all() as { field: string; count: number }[];

  const appProgress = db
    .prepare('SELECT status, COUNT(*) as count FROM applications GROUP BY status')
    .all() as { status: string; count: number }[];

  // Registration trend grouped by date (last 7 days or actual dates)
  const regRows = db
    .prepare(
      `SELECT substr(created_at, 1, 10) as day, COUNT(*) as count
       FROM users
       WHERE is_sample = 0
       GROUP BY day
       ORDER BY day ASC
       LIMIT 10`
    )
    .all() as { day: string; count: number }[];

  const allSkillsRows = db.prepare('SELECT skills FROM users').all() as { skills: string }[];
  const skillSet = new Set<string>();
  for (const r of allSkillsRows) {
    for (const s of parseJsonArray(r.skills)) {
      skillSet.add(s.toLowerCase());
    }
  }

  const recentApps = db
    .prepare(
      `SELECT a.id, o.title, u.full_name, a.created_at
       FROM applications a
       JOIN opportunities o ON o.id = a.opportunity_id
       JOIN users u ON u.id = a.user_id
       ORDER BY a.created_at DESC LIMIT 5`
    )
    .all() as any[];

  const recentMentors = db
    .prepare(
      `SELECT mr.id, m.name as mentor_name, u.full_name, mr.created_at
       FROM mentorship_requests mr
       JOIN mentors m ON m.id = mr.mentor_id
       JOIN users u ON u.id = mr.user_id
       ORDER BY mr.created_at DESC LIMIT 5`
    )
    .all() as any[];

  const recentActivity = [
    ...recentApps.map((a) => ({
      id: `app-${a.id}`,
      type: 'Application',
      summary: `${a.full_name} applied to ${a.title}`,
      timestamp: a.created_at,
    })),
    ...recentMentors.map((m) => ({
      id: `mr-${m.id}`,
      type: 'Mentorship',
      summary: `${m.full_name} requested mentorship with ${m.mentor_name}`,
      timestamp: m.created_at,
    })),
  ]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 8);

  res.json({
    totals: {
      totalUsers,
      jobSeekers,
      employers,
      mentors: mentorsCount,
      publishedOpportunities,
      pendingOpportunities,
      applications: applicationsCount,
      mentorshipRequests: mentorshipRequestsCount,
      skillsCategories: skillSet.size,
    },
    registrationTrends: regRows.length
      ? regRows.map((r) => ({ label: r.day, count: r.count }))
      : [{ label: new Date().toISOString().slice(0, 10), count: totalUsers }],
    professionalFields: userFields,
    opportunityCategories: oppFields,
    applicationProgress: ['submitted', 'under_review', 'interview', 'withdrawn'].map((st) => ({
      status: st,
      count: appProgress.find((p) => p.status === st)?.count || 0,
    })),
    recentActivity,
  });
});

app.get('/api/admin/opportunities', requireAdmin, (_req, res) => {
  const rows = db.prepare('SELECT * FROM opportunities ORDER BY created_at DESC, id DESC').all() as any[];
  res.json({
    opportunities: rows.map((r) => ({
      ...r,
      required_skills: parseJsonArray(r.required_skills),
      is_sample: Boolean(r.is_sample),
    })),
  });
});

app.patch('/api/admin/opportunities/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body || {};
  if (!['published', 'pending_review', 'archived'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }
  const info = db.prepare('UPDATE opportunities SET status = ? WHERE id = ?').run(status, id);
  if (info.changes === 0) {
    return res.status(404).json({ error: 'Opportunity not found.' });
  }
  res.json({ id, status });
});

app.delete('/api/admin/opportunities/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const info = db.prepare('DELETE FROM opportunities WHERE id = ?').run(id);
  if (info.changes === 0) {
    return res.status(404).json({ error: 'Opportunity not found.' });
  }
  res.json({ deleted: true });
});

app.post('/api/admin/resources', requireAdmin, (req, res) => {
  const { title, category, description, content, read_time, external_url } = req.body || {};
  if (typeof title !== 'string' || title.trim().length < 3) {
    return res.status(400).json({ error: 'Resource title is required.' });
  }
  if (typeof category !== 'string' || !category.trim()) {
    return res.status(400).json({ error: 'Category is required.' });
  }
  if (typeof description !== 'string' || description.trim().length < 10) {
    return res.status(400).json({ error: 'Description is required.' });
  }
  if (!isSafeHttpUrl(external_url)) {
    return res.status(400).json({ error: 'External URL must use http:// or https://.' });
  }

  const cleanUrl = typeof external_url === 'string' ? external_url.trim() : '';
  const result = db
    .prepare(
      `INSERT INTO resources (title, category, description, content, read_time, external_url, is_external)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      title.trim(),
      category.trim(),
      description.trim(),
      typeof content === 'string' && content.trim() ? content.trim() : description.trim(),
      typeof read_time === 'string' && read_time.trim() ? read_time.trim() : '5 min read',
      cleanUrl,
      cleanUrl ? 1 : 0
    );

  const row = db.prepare('SELECT * FROM resources WHERE id = ?').get(result.lastInsertRowid) as any;
  res.status(201).json({ resource: { ...row, is_external: Boolean(row.is_external) } });
});

app.delete('/api/admin/resources/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const info = db.prepare('DELETE FROM resources WHERE id = ?').run(id);
  if (info.changes === 0) {
    return res.status(404).json({ error: 'Resource not found.' });
  }
  res.json({ deleted: true });
});

app.get('/api/admin/mentorship-requests', requireAdmin, (_req, res) => {
  const rows = db
    .prepare(
      `SELECT mr.*, m.name as mentor_name, m.profession as mentor_profession, m.field as mentor_field, u.full_name as applicant_name
       FROM mentorship_requests mr
       JOIN mentors m ON m.id = mr.mentor_id
       JOIN users u ON u.id = mr.user_id
       ORDER BY mr.created_at DESC`
    )
    .all();
  res.json({ requests: rows });
});

app.patch('/api/admin/mentorship-requests/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body || {};
  if (!['pending', 'accepted', 'scheduled', 'declined'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }
  const info = db.prepare('UPDATE mentorship_requests SET status = ? WHERE id = ?').run(status, id);
  if (info.changes === 0) {
    return res.status(404).json({ error: 'Mentorship request not found.' });
  }
  res.json({ id, status });
});

async function startServer() {
  const PORT = 3000;
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SkillBridge server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
