import React, { useEffect, useState } from 'react';
import { apiRequest, setAuthToken } from './api';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { AboutPage } from './pages/AboutPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AuthPages } from './pages/AuthPages';
import { CareerAssistantPage } from './pages/CareerAssistantPage';
import { DashboardPage } from './pages/DashboardPage';
import { LandingPage } from './pages/LandingPage';
import { MentorshipPage } from './pages/MentorshipPage';
import { OpportunitiesPage } from './pages/OpportunitiesPage';
import { ReadinessPage } from './pages/ReadinessPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { SkillsCredentialsPage } from './pages/SkillsCredentialsPage';
import { AppRoute, Opportunity, UserProfile } from './types';

export default function App() {
  const [route, setRoute] = useState<AppRoute>('home');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [featuredOpportunities, setFeaturedOpportunities] = useState<Opportunity[]>([]);

  useEffect(() => {
    apiRequest<{ opportunities: Opportunity[] }>('/api/opportunities')
      .then((res) => setFeaturedOpportunities(res.opportunities))
      .catch(() => {});
  }, []);

  const navigate = (nextRoute: AppRoute) => {
    setRoute(nextRoute);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthSuccess = (authenticatedUser: UserProfile, token: string) => {
    setAuthToken(token);
    setUser(authenticatedUser);
    navigate(authenticatedUser.role === 'admin' ? 'admin' : 'dashboard');
  };

  const handleLogout = () => {
    setAuthToken(null);
    setUser(null);
    navigate('home');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar
        currentRoute={route}
        onNavigate={navigate}
        user={user}
        onLogout={handleLogout}
      />

      <main className="flex-1">
        {route === 'home' && (
          <LandingPage
            onNavigate={navigate}
            featuredOpportunities={featuredOpportunities}
          />
        )}
        {route === 'about' && <AboutPage onNavigate={navigate} />}
        {route === 'opportunities' && (
          <OpportunitiesPage user={user} onNavigate={navigate} />
        )}
        {route === 'credentials' && (
          <SkillsCredentialsPage
            user={user}
            onUserUpdate={setUser}
            onNavigate={navigate}
          />
        )}
        {route === 'readiness' && (
          <ReadinessPage user={user} onNavigate={navigate} />
        )}
        {route === 'mentorship' && (
          <MentorshipPage user={user} onNavigate={navigate} />
        )}
        {route === 'assistant' && <CareerAssistantPage user={user} />}
        {route === 'resources' && <ResourcesPage />}
        {(route === 'login' || route === 'register') && (
          <AuthPages
            mode={route}
            onNavigate={navigate}
            onAuthSuccess={handleAuthSuccess}
          />
        )}
        {route === 'dashboard' && (
          <DashboardPage
            user={user}
            onUserUpdate={setUser}
            onNavigate={navigate}
          />
        )}
        {route === 'admin' && (
          <AdminDashboardPage
            user={user}
            onAuthSuccess={handleAuthSuccess}
          />
        )}
      </main>

      <Footer onNavigate={navigate} />
    </div>
  );
}
