export type UserRole = 'job_seeker' | 'employer' | 'mentor' | 'admin';

export interface UserProfile {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
  country: string;
  professional_field: string;
  education_level: string;
  skills: string[];
  years_experience: number;
  headline: string;
  bio: string;
  networking_opt_in: boolean;
  created_at: string;
}

export type QualificationType = 'academic' | 'certification' | 'experience' | 'language' | 'portfolio';
export type ChecklistStatus = 'not_started' | 'in_progress' | 'completed';

export interface QualificationItem {
  id: number;
  user_id: number;
  type: QualificationType;
  title: string;
  institution_or_org: string;
  country_or_proficiency: string;
  year_range: string;
  needs_recognition: boolean;
  recognition_status: ChecklistStatus;
  notes: string;
  link_url: string;
  created_at: string;
}

export interface Opportunity {
  id: number;
  title: string;
  organization: string;
  location: string;
  work_mode: 'Remote' | 'Onsite' | 'Hybrid';
  employment_type: 'Full-time' | 'Part-time' | 'Contract';
  field: string;
  experience_level: 'Entry' | 'Mid' | 'Senior';
  required_skills: string[];
  description: string;
  deadline: string;
  is_sample: boolean;
  status: 'published' | 'pending_review' | 'archived';
  created_at: string;
  match_percentage?: number;
  matched_skills?: string[];
  missing_skills?: string[];
}

export interface ApplicationRecord {
  id: number;
  user_id: number;
  opportunity_id: number;
  cover_note: string;
  status: 'submitted' | 'under_review' | 'interview' | 'withdrawn';
  created_at: string;
  opportunity_title?: string;
  organization?: string;
  location?: string;
  field?: string;
}

export interface Mentor {
  id: number;
  name: string;
  profession: string;
  field: string;
  experience_years: number;
  bio: string;
  skills: string[];
  availability: string;
  avatar_url: string;
  is_sample: boolean;
}

export interface MentorshipRequestRecord {
  id: number;
  user_id: number;
  mentor_id: number;
  goal: string;
  preferred_schedule: string;
  status: 'pending' | 'accepted' | 'scheduled' | 'declined';
  created_at: string;
  mentor_name?: string;
  mentor_profession?: string;
  mentor_field?: string;
  applicant_name?: string;
}

export interface PeerProfile {
  id: number;
  full_name: string;
  role: UserRole;
  country: string;
  professional_field: string;
  skills: string[];
  years_experience: number;
  headline: string;
  bio: string;
  is_sample: boolean;
  connection_status?: 'none' | 'pending' | 'connected';
}

export interface LearningResource {
  id: number;
  title: string;
  category: string;
  description: string;
  content: string;
  read_time: string;
  external_url: string;
  is_external: boolean;
  created_at: string;
}

export interface AdminStats {
  totals: {
    totalUsers: number;
    jobSeekers: number;
    employers: number;
    mentors: number;
    publishedOpportunities: number;
    pendingOpportunities: number;
    applications: number;
    mentorshipRequests: number;
    skillsCategories: number;
  };
  registrationTrends: { label: string; count: number }[];
  professionalFields: { field: string; count: number }[];
  opportunityCategories: { field: string; count: number }[];
  applicationProgress: { status: string; count: number }[];
  recentActivity: { id: string; type: string; summary: string; timestamp: string }[];
}

export type AppRoute =
  | 'home'
  | 'about'
  | 'opportunities'
  | 'credentials'
  | 'readiness'
  | 'mentorship'
  | 'assistant'
  | 'resources'
  | 'login'
  | 'register'
  | 'dashboard'
  | 'admin';
