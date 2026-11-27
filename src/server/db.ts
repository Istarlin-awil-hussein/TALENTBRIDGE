import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'skillbridge.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('job_seeker', 'employer', 'mentor', 'admin')),
      country TEXT NOT NULL DEFAULT '',
      professional_field TEXT NOT NULL DEFAULT '',
      education_level TEXT NOT NULL DEFAULT '',
      skills TEXT NOT NULL DEFAULT '[]',
      years_experience INTEGER NOT NULL DEFAULT 0,
      headline TEXT NOT NULL DEFAULT '',
      bio TEXT NOT NULL DEFAULT '',
      networking_opt_in INTEGER NOT NULL DEFAULT 1,
      is_sample INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admin_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS qualifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('academic', 'certification', 'experience', 'language', 'portfolio')),
      title TEXT NOT NULL,
      institution_or_org TEXT NOT NULL DEFAULT '',
      country_or_proficiency TEXT NOT NULL DEFAULT '',
      year_range TEXT NOT NULL DEFAULT '',
      needs_recognition INTEGER NOT NULL DEFAULT 0,
      recognition_status TEXT NOT NULL DEFAULT 'not_started' CHECK(recognition_status IN ('not_started', 'in_progress', 'completed')),
      notes TEXT NOT NULL DEFAULT '',
      link_url TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS credential_checklist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      item_key TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'not_started' CHECK(status IN ('not_started', 'in_progress', 'completed')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, item_key),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS readiness_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      item_key TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, item_key),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS opportunities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      organization TEXT NOT NULL,
      location TEXT NOT NULL,
      work_mode TEXT NOT NULL CHECK(work_mode IN ('Remote', 'Onsite', 'Hybrid')),
      employment_type TEXT NOT NULL CHECK(employment_type IN ('Full-time', 'Part-time', 'Contract')),
      field TEXT NOT NULL,
      experience_level TEXT NOT NULL CHECK(experience_level IN ('Entry', 'Mid', 'Senior')),
      required_skills TEXT NOT NULL DEFAULT '[]',
      description TEXT NOT NULL,
      deadline TEXT NOT NULL,
      is_sample INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'published' CHECK(status IN ('published', 'pending_review', 'archived')),
      created_by INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      opportunity_id INTEGER NOT NULL,
      cover_note TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'submitted' CHECK(status IN ('submitted', 'under_review', 'interview', 'withdrawn')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, opportunity_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS saved_jobs (
      user_id INTEGER NOT NULL,
      opportunity_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, opportunity_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS mentors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      profession TEXT NOT NULL,
      field TEXT NOT NULL,
      experience_years INTEGER NOT NULL,
      bio TEXT NOT NULL,
      skills TEXT NOT NULL DEFAULT '[]',
      availability TEXT NOT NULL,
      avatar_url TEXT NOT NULL DEFAULT '',
      is_sample INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS mentorship_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      mentor_id INTEGER NOT NULL,
      goal TEXT NOT NULL,
      preferred_schedule TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'scheduled', 'declined')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (mentor_id) REFERENCES mentors(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS network_connections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requester_id INTEGER NOT NULL,
      target_user_id INTEGER NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'connected')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(requester_id, target_user_id),
      FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      content TEXT NOT NULL,
      read_time TEXT NOT NULL DEFAULT '5 min read',
      external_url TEXT NOT NULL DEFAULT '',
      is_external INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  seedOpportunities();
  seedMentors();
  seedResources();
  seedSamplePeers();
}

function seedOpportunities() {
  const count = (db.prepare('SELECT COUNT(*) as cnt FROM opportunities').get() as { cnt: number }).cnt;
  if (count > 0) return;

  const insert = db.prepare(`
    INSERT INTO opportunities (title, organization, location, work_mode, employment_type, field, experience_level, required_skills, description, deadline, is_sample, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'published')
  `);

  const sampleOpps = [
    [
      'Cloud Support & Infrastructure Specialist',
      'NorthStar Civic Cloud (Sample Employer)',
      'Berlin, Germany',
      'Hybrid',
      'Full-time',
      'Information Technology',
      'Mid',
      JSON.stringify(['Linux', 'AWS', 'Networking', 'Docker', 'Troubleshooting', 'Python']),
      'Support distributed public-sector cloud deployments, automate routine infrastructure checks, and collaborate with international engineering teams. Flexible documentation support for international qualification equivalency.',
      '2027-02-15'
    ],
    [
      'Full-Stack TypeScript Engineer',
      'BridgeWorks Digital Lab (Sample Employer)',
      'Remote (Europe / MENA)',
      'Remote',
      'Full-time',
      'Software Development',
      'Mid',
      JSON.stringify(['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'REST APIs', 'Git']),
      'Build accessible web applications for civic and education partners. Asynchronous remote culture designed for multilingual engineers transitioning across borders.',
      '2027-02-28'
    ],
    [
      'Humanitarian Monitoring & Data Analyst',
      'ReliefMetrics Network (Sample Employer)',
      'Amman, Jordan',
      'Hybrid',
      'Full-time',
      'Data Analysis',
      'Mid',
      JSON.stringify(['SQL', 'Python', 'Power BI', 'Excel', 'Data Visualization', 'Statistics']),
      'Analyze program reach, clean multi-regional survey datasets, and produce weekly impact dashboards for community health and education initiatives.',
      '2027-03-10'
    ],
    [
      'Multilingual Digital Growth Coordinator',
      'Horizon Fair Trade Collective (Sample Employer)',
      'Remote (Global)',
      'Remote',
      'Part-time',
      'Digital Marketing',
      'Entry',
      JSON.stringify(['SEO', 'Content Strategy', 'Google Analytics', 'Social Media', 'Copywriting']),
      'Plan multilingual digital campaigns supporting artisan and small-business exporters. Structured onboarding and weekly mentorship included.',
      '2027-02-20'
    ],
    [
      'Financial Operations & Compliance Associate',
      'ClearLedger Advisory (Sample Employer)',
      'London, United Kingdom',
      'Onsite',
      'Full-time',
      'Finance',
      'Mid',
      JSON.stringify(['Accounting', 'Financial Modeling', 'Excel', 'IFRS', 'Auditing', 'Reconciliation']),
      'Assist cross-border nonprofit and SME clients with monthly reconciliations, grant compliance reporting, and financial forecasting.',
      '2027-03-05'
    ],
    [
      'Clinic Operations & Health Records Coordinator',
      'MedAccess Community Health (Sample Employer)',
      'Toronto, Canada',
      'Onsite',
      'Full-time',
      'Healthcare Administration',
      'Mid',
      JSON.stringify(['Healthcare Administration', 'Patient Scheduling', 'EHR Systems', 'Compliance', 'Care Coordination']),
      'Coordinate clinic intake workflows, bilingual patient scheduling, and quality reporting. Ideal pathway role for displaced medical and health administration professionals.',
      '2027-03-18'
    ],
    [
      'Technical Project Manager — Infrastructure & Solar',
      'SunGrid Resilience Partners (Sample Employer)',
      'Nairobi, Kenya',
      'Hybrid',
      'Full-time',
      'Project Management',
      'Senior',
      JSON.stringify(['Project Management', 'Agile', 'Budgeting', 'Stakeholder Management', 'Risk Assessment', 'MS Project']),
      'Lead multidisciplinary engineering and community deployment timelines for micro-grid energy installations across East Africa.',
      '2027-03-25'
    ],
    [
      'Community Integration & Livelihoods Officer',
      'CivicHarbor Foundation (Sample Employer)',
      'Munich, Germany',
      'Onsite',
      'Full-time',
      'Community Development',
      'Entry',
      JSON.stringify(['Community Outreach', 'Program Facilitation', 'Case Management', 'Workshop Design', 'Cross-Cultural Communication']),
      'Facilitate local employer roundtables, peer career circles, and community onboarding workshops for newly arrived skilled professionals.',
      '2027-02-25'
    ],
    [
      'Grants & Field Operations Coordinator',
      'Global Solidarity Initiative (Sample Employer)',
      'Remote (UTC-5 to UTC+3)',
      'Remote',
      'Contract',
      'Humanitarian and NGO Work',
      'Mid',
      JSON.stringify(['Grant Writing', 'MEAL', 'Donor Reporting', 'Project Coordination', 'Budget Tracking']),
      'Coordinate donor reporting, partner sub-grants, and field evaluation workflows for education and workforce resilience grants.',
      '2027-03-12'
    ]
  ];

  const tx = db.transaction(() => {
    for (const row of sampleOpps) {
      insert.run(...row);
    }
  });
  tx();
}

function seedMentors() {
  const count = (db.prepare('SELECT COUNT(*) as cnt FROM mentors').get() as { cnt: number }).cnt;
  if (count > 0) return;

  const insert = db.prepare(`
    INSERT INTO mentors (name, profession, field, experience_years, bio, skills, availability, avatar_url, is_sample)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  const sampleMentors = [
    [
      'Nadia Al-Mansoor',
      'Principal Cloud & Software Architect',
      'Software Development',
      12,
      'Sample Mentor Profile: Leads distributed engineering teams across Europe. Guides displaced software engineers on system design interviews, GitHub portfolio framing, and European engineering hiring practices.',
      JSON.stringify(['System Architecture', 'TypeScript', 'Cloud Infrastructure', 'Technical Interviews', 'Career Transition']),
      'Tue & Thu · 17:00–19:00 CET',
      '/src/assets/images/avatar_mentor_1_1795763251883.jpg'
    ],
    [
      'Dr. Samuel Ochieng',
      'Director of Healthcare Systems & Programs',
      'Healthcare Administration',
      15,
      'Sample Mentor Profile: Former hospital operations director supporting internationally trained doctors, nurses, and health administrators in navigating non-clinical leadership and bridging pathways.',
      JSON.stringify(['Healthcare Administration', 'Credential Bridging', 'Public Health', 'Program Leadership', 'Stakeholder Communication']),
      'Wed & Sat · 14:00–17:00 EAT',
      '/src/assets/images/avatar_mentor_2_1795763252134.jpg'
    ],
    [
      'Elena Kowalski',
      'Senior Finance & Cross-Border Compliance Advisor',
      'Finance',
      11,
      'Sample Mentor Profile: Chartered accountant advising skilled newcomers on IFRS equivalency, remote consulting contracts, invoicing standards, and corporate finance career positioning.',
      JSON.stringify(['IFRS Accounting', 'Financial Analysis', 'Contract Readiness', 'Invoicing', 'Interview Coaching']),
      'Mon & Thu · 18:00–20:00 GMT',
      '/src/assets/images/avatar_mentor_3_1795763252981.jpg'
    ],
    [
      'Tariq Haddad',
      'Lead Data & Analytics Manager',
      'Data Analysis',
      9,
      'Sample Mentor Profile: Helps engineers and researchers translate academic quantitative backgrounds into applied business intelligence, SQL, and humanitarian data science roles.',
      JSON.stringify(['SQL', 'Python', 'Power BI', 'Portfolio Storytelling', 'Data Strategy']),
      'Fri · 15:00–18:00 CET',
      ''
    ],
    [
      'Claire Beaumont',
      'Humanitarian Program & Project Management Mentor',
      'Project Management',
      14,
      'Sample Mentor Profile: Experienced NGO operations lead mentoring professionals on PMP/PRINCE2 credential mapping, donor reporting language, and international project management.',
      JSON.stringify(['Project Management', 'Agile & Waterfall', 'Grant Reporting', 'Risk Management', 'CV Translation']),
      'Tue · 16:00–18:30 CET',
      ''
    ],
    [
      'Rami Darwish',
      'Digital Marketing & Remote Growth Strategist',
      'Digital Marketing',
      8,
      'Sample Mentor Profile: Supports bilingual communicators and marketers in building freelance client pipelines, remote-ready digital portfolios, and transparent service agreements.',
      JSON.stringify(['SEO', 'Content Strategy', 'Remote Consulting', 'Personal Branding', 'Client Proposals']),
      'Thu & Sat · 11:00–13:00 UTC',
      ''
    ]
  ];

  const tx = db.transaction(() => {
    for (const row of sampleMentors) {
      insert.run(...row);
    }
  });
  tx();
}

function seedResources() {
  const count = (db.prepare('SELECT COUNT(*) as cnt FROM resources').get() as { cnt: number }).cnt;
  if (count > 0) return;

  const insert = db.prepare(`
    INSERT INTO resources (title, category, description, content, read_time, external_url, is_external)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const sampleResources = [
    [
      'Translating International Experience into an Outcome-Driven CV',
      'CV and Resume Writing',
      'How to reframe university degrees, regional employers, and project achievements for ATS systems and international hiring managers.',
      `Many skilled displaced professionals undersell their work because job titles and company names vary across countries. Start every bullet with a measurable outcome, add brief context for unfamiliar employers (e.g., "Regional telecommunications provider serving 1.2M subscribers"), and group technical proficiencies cleanly at the top.\n\nChecklist:\n1. Use a clean single-column layout without photos or sensitive personal status details.\n2. Replace generic duties with concrete metrics: systems maintained, budgets managed, teams led.\n3. Match terminology from target job descriptions while remaining 100% truthful about your experience.`,
      '6 min read',
      '',
      0
    ],
    [
      'Structured Interview Answers Using the Context-Action-Result Framework',
      'Interview Preparation',
      'Prepare confident answers to behavioral and technical questions, including how to address employment gaps constructively.',
      `Employers evaluate both technical competence and how clearly you communicate decisions under pressure. When discussing career interruptions caused by displacement, keep the explanation concise and forward-looking: highlight any volunteer work, self-directed study, or language acquisition completed during that period.\n\nPractice three core stories:\n- A complex technical or operational problem you diagnosed.\n- A time you collaborated across teams or cultures.\n- A project delivered under tight resource constraints.`,
      '7 min read',
      '',
      0
    ],
    [
      'Core Digital Collaboration & Cloud Productivity Toolkit',
      'Digital Skills',
      'Practical guide to Git workflows, cloud document governance, asynchronous project boards, and cybersecurity hygiene.',
      `Modern distributed teams rely on shared digital workflows as much as domain expertise. Ensure familiarity with version control (Git/GitHub), structured ticketing tools (Jira, Linear, Trello), shared cloud suites, and two-factor authentication.\n\nTip: Create a small public portfolio repository or case-study document showing how you organize documentation, data tables, or project plans.`,
      '5 min read',
      '',
      0
    ],
    [
      'Cross-Cultural Professional Communication & Async Etiquette',
      'Professional Communication',
      'Navigate direct vs. high-context workplace norms, concise status updates, and professional outreach emails.',
      `Workplace communication styles differ markedly across regions. In international and remote teams, clarity and predictability build immediate trust:\n\n- Summarize key takeaways in the first two sentences of an email.\n- Confirm deadlines with explicit time zones (e.g., "16:00 CET / 14:00 UTC").\n- Ask clarifying questions early rather than guessing ambiguous requirements.`,
      '5 min read',
      '',
      0
    ],
    [
      'Launching Consulting & Micro-Service Offerings Safely',
      'Entrepreneurship',
      'Foundations for packaging specialist expertise into scoped freelance proposals, pricing models, and client deliverables.',
      `Independent consulting can provide an accessible bridge while formal credential recognition is underway. Define a narrow, high-value service (such as CAD drafting, bilingual market research, QA testing, or bookkeeping), prepare a 1-page scope-of-work template, and verify local business registration rules before invoicing.`,
      '8 min read',
      '',
      0
    ],
    [
      'Setting Up a Reliable Remote Work Environment & Routine',
      'Remote Work',
      'Essential practices for time-zone coordination, stable video collaboration, data privacy, and distributed team visibility.',
      `Remote employers look for candidates who are self-directed and communicative. Document your availability window in UTC, test microphone and network stability ahead of interviews, and use brief end-of-day written summaries to keep managers informed without micromanagement.`,
      '4 min read',
      '',
      0
    ],
    [
      'Understanding Academic Credential Recognition & Equivalency Pathways',
      'Credential Recognition',
      'Step-by-step orientation on ENIC-NARIC centers, statement of comparability, and alternative skills documentation when transcripts are missing.',
      `Credential recognition depends on whether your profession is regulated (e.g., medicine, civil engineering, law) or non-regulated (e.g., software engineering, data analysis, marketing).\n\n1. For non-regulated fields, employers rarely require formal government equivalency—clear degree translations and project portfolios carry strong weight.\n2. For regulated professions, identify the national competent authority early and gather syllabi, course lists, or professional association letters.\n3. Note: SkillBridge provides educational guidance only and does not issue official credential evaluations.`,
      '9 min read',
      '',
      0
    ],
    [
      'UNESCO Qualifications Passport (External Resource)',
      'Credential Recognition',
      'External UN initiative providing standardized assessment methodology for refugees with incomplete academic documentation.',
      `External Resource Overview: The UNESCO Qualifications Passport for Refugees and Vulnerable Migrants (UQP) helps assess academic qualifications even when full paper transcripts cannot be retrieved.\n\nVisit the official UNESCO portal to check participating host countries and current intake windows.`,
      'External guide',
      'https://www.unesco.org/en/higher-education/qualifications-passport',
      1
    ],
    [
      'Understanding Employment Contracts, Payslips & Invoicing Basics',
      'Financial Literacy',
      'Learn how gross vs. net pay, tax withholding, contractor invoices, and cross-border payment fees work in practice.',
      `Before signing an employment agreement or freelance contract, review four core items: compensation currency and schedule, notice period, intellectual property clauses, and whether taxes/social contributions are withheld by the employer or filed independently.\n\nDisclaimer: This guide is educational only and does not constitute legal, tax, or banking advice.`,
      '7 min read',
      '',
      0
    ],
    [
      'Building a 90-Day Career Transition Plan in a New Host Market',
      'Career Development',
      'Balance short-term income stability with targeted upskilling, networking outreach, and credential milestones.',
      `Divide your transition into three 30-day horizons:\n- Days 1–30: Audit transferable skills, localize your CV, and identify whether your target role is regulated.\n- Days 31–60: Complete two portfolio samples, connect with 3–5 industry peers or mentors, and apply selectively using tailored cover notes.\n- Days 61–90: Refine interview stories from feedback and track credential or language milestones.`,
      '6 min read',
      '',
      0
    ],
    [
      'UNHCR Displaced Talent & Complementary Labour Pathways (External Resource)',
      'Career Development',
      'External UNHCR information hub detailing global complementary pathways and skilled mobility initiatives.',
      `External Resource Overview: UNHCR collaborates with governments, employers, and civil society partners to expand labour mobility pathways for displaced talent.\n\nUse the official link below to inspect country eligibility and partner organizations.`,
      'External guide',
      'https://www.unhcr.org/what-we-do/build-better-futures/long-term-solutions/complementary-pathways-admission-third-countries',
      1
    ]
  ];

  const tx = db.transaction(() => {
    for (const row of sampleResources) {
      insert.run(...row);
    }
  });
  tx();
}

function seedSamplePeers() {
  const count = (db.prepare('SELECT COUNT(*) as cnt FROM users WHERE is_sample = 1').get() as { cnt: number }).cnt;
  if (count > 0) return;

  const insert = db.prepare(`
    INSERT INTO users (full_name, email, password_hash, role, country, professional_field, education_level, skills, years_experience, headline, bio, networking_opt_in, is_sample)
    VALUES (?, ?, 'SAMPLE_NON_LOGIN_PROFILE', ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
  `);

  const peers = [
    [
      'Layla Hassan (Sample Profile)',
      'sample.layla@example.invalid',
      'job_seeker',
      'Germany',
      'Software Development',
      "Bachelor's Degree in Computer Engineering",
      JSON.stringify(['React', 'TypeScript', 'Node.js', 'PostgreSQL']),
      5,
      'Full-Stack Developer transitioning into European civic tech',
      'Sample community profile demonstrating peer networking. 5 years building enterprise web portals.'
    ],
    [
      'Yusuf Demir (Sample Profile)',
      'sample.yusuf@example.invalid',
      'job_seeker',
      'Canada',
      'Project Management',
      "Master's Degree in Civil & Infrastructure Engineering",
      JSON.stringify(['Project Management', 'Budgeting', 'Risk Assessment', 'AutoCAD']),
      8,
      'Infrastructure Project Lead · Sustainable Energy & Urban Systems',
      'Sample community profile. Seeking peer collaboration on Canadian engineering licensing steps.'
    ],
    [
      'Mariam Tadesse (Sample Profile)',
      'sample.mariam@example.invalid',
      'job_seeker',
      'United Kingdom',
      'Data Analysis',
      "Bachelor's Degree in Statistics",
      JSON.stringify(['SQL', 'Python', 'Power BI', 'Excel']),
      4,
      'Public Health & Operations Data Analyst',
      'Sample community profile focused on humanitarian analytics and healthcare reporting.'
    ]
  ];

  const tx = db.transaction(() => {
    for (const row of peers) {
      insert.run(...row);
    }
  });
  tx();
}

export default db;
