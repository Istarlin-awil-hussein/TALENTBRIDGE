# SkillBridge — Unlocking Displaced Talent

**Tagline:** Your Skills. Your Future. Your Opportunity.

SkillBridge is a full-stack web application built for the initiative *"Unlocking Displaced Talent: Pathways for Skilled Refugees"*, aligning with UN Sustainable Development Goals **4, 8, 10, 16, and 17**.

---

## Problem Statement

Millions of refugees and displaced professionals hold university degrees, technical certifications, and years of specialized work experience. Yet systemic barriers—unrecognized foreign credentials, unclear work authorization and financial onboarding rules, and a lack of local professional networks—frequently lead to "brain waste" and underemployment.

## Solution

SkillBridge integrates three core tracks into one accessible, privacy-first platform:

1. **Track 1 — Credential Recognition & Skills Validation:** Structured portfolio of academic degrees, certifications, work history, languages, and public portfolio links with recognition status tracking (*Not started*, *In progress*, *Completed*) and clear distinction between self-reported records and independent official verification.
2. **Track 2 — Legal, Regulatory & Financial Access:** Work & Financial Readiness educational guides covering contracts, invoicing, payment readiness, and remote work, paired with an interactive checklist and transparent legal/banking disclaimers.
3. **Track 3 — Local Experience & Professional Networks:** Skills-matched sample opportunities with transparent match percentages, mentor browsing and request tracking, peer networking, and a Gemini-powered AI Career Assistant.

---

## Main Features

- **Landing & Initiative Presentation (`Home` & `About`)**: Explains the brain waste challenge, 3 barriers, 3 solution tracks, illustrative examples, and UN SDG alignment.
- **Role-Based Authentication**: Registration and login for **Job Seekers**, **Employers**, **Mentors**, and **Administrators** using `scrypt` password hashing and HMAC-SHA256 Bearer tokens. Never collects refugee ID numbers or sensitive status documents.
- **Personalized User Dashboard**: Profile completion tracker, recommended opportunities, saved jobs, submitted applications, mentorship status, and inline profile editing.
- **Skills & Credentials Workspace**: CRUD management for qualifications, certifications, work history, languages, and portfolio links plus a persistent readiness checklist.
- **Job Opportunities & Skills Matching**: Multi-criteria filtering (location, field, remote/onsite, full-time/part-time, experience level), skill overlap percentages, job saving, and application submission.
- **Work & Financial Readiness**: Educational modules, country orientation pointers, and persistent interactive checklist.
- **Mentorship & Peer Network**: Browse sample mentors, filter by profession, submit mentorship requests, and connect with opted-in community peers.
- **AI Career Assistant**: Server-side Gemini (`gemini-4-hydrogen`) coaching for CV bullets, transferable skills, cover letters, and interview prep, with a clearly labelled Demo Mode when no API key is configured.
- **Learning & Resource Centre**: Searchable guides across 9 categories with original articles and clearly identified external links.
- **Administrator Console**: Role-protected analytics dashboard with charts, opportunity moderation, resource publishing, and mentorship request management.

---

## Technology Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide Icons
- **Backend:** Node.js, Express, `tsx`
- **Database:** SQLite (`better-sqlite3`) with WAL mode and parameterized queries
- **AI Integration:** `@google/genai` (`gemini-4-hydrogen`) via server-side proxy

---

## Installation Instructions

1. Clone the repository:
   ```bash
   git clone <your-github-repo-url>
   cd skillbridge
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and configure environment variables:
   ```bash
   cp .env.example .env
   ```
4. Start the development server (runs Express + Vite middleware on port 3000):
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000` in your browser.

---

## Environment Variables

| Variable | Required | Description |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Optional (Recommended) | Server-side Google Gemini API key for live AI Career Assistant responses. If omitted, the assistant runs in a clearly labelled Demo Mode. |
| `APP_URL` | Optional | Public URL of the deployed application. |
| `ADMIN_PASSCODE` | Optional | Optional server-side administrator passcode. If omitted, an administrator can initialize credentials once via the Admin Portal UI. |
| `SESSION_SECRET` | Optional | Secret key used to sign authentication tokens (defaults to an ephemeral per-boot random 256-bit key). |

---

## Database Configuration

SkillBridge uses **SQLite** via `better-sqlite3`, automatically initializing `skillbridge.db` on first startup in the project root with tables for:
- `users`, `admin_config`
- `qualifications`, `credential_checklist`, `readiness_progress`
- `opportunities`, `applications`, `saved_jobs`
- `mentors`, `mentorship_requests`, `network_connections`
- `resources`

Sample opportunities, sample mentor profiles, and learning resources are seeded automatically and clearly labelled as demonstrations.

---

## Deployment Instructions (GitHub & Netlify / Node Hosting)

### GitHub Version Control
```bash
git init
git add .
git commit -m "Initial SkillBridge full-stack release"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Production Build & Full-Stack Hosting
Because SkillBridge includes an Express API backend, SQLite persistence, and a server-side Gemini proxy:
1. Build the frontend bundle:
   ```bash
   npm run build
   ```
2. Start the production server:
   ```bash
   NODE_ENV=production npm start
   ```
3. **Netlify Deployment Note:** Netlify serves static builds (`dist/`) natively and supports backend APIs via Netlify Functions. A `netlify.toml` configuration is included for static frontend builds; to run the full Express + SQLite + Gemini API server without refactoring into serverless functions, deploy to a Node-capable host (such as Cloud Run, Render, Railway, or Fly.io) or connect the frontend build to Netlify Functions.

---

## Future Improvements

- Employer verification workflow and organization profiles.
- Multilingual UI localization (Arabic, Ukrainian, French, Spanish, German).
- Direct integration with accredited ENIC-NARIC / UNESCO Qualifications Passport APIs where publicly available.
- Live calendar scheduling and video mentoring integrations.
