import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, ExternalLink, Search, X } from 'lucide-react';
import { apiRequest } from '../api';
import { LearningResource } from '../types';

const CATEGORIES = [
  'All',
  'CV and Resume Writing',
  'Interview Preparation',
  'Digital Skills',
  'Professional Communication',
  'Entrepreneurship',
  'Remote Work',
  'Credential Recognition',
  'Financial Literacy',
  'Career Development',
];

export const ResourcesPage: React.FC = () => {
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeArticle, setActiveArticle] = useState<LearningResource | null>(null);

  useEffect(() => {
    apiRequest<{ resources: LearningResource[] }>('/api/resources')
      .then((res) => setResources(res.resources))
      .catch((err) => setError(err.message || 'Unable to load learning resources.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return resources.filter((r) => {
      if (category !== 'All' && r.category !== category) return false;
      if (q) {
        return (
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [resources, search, category]);

  return (
    <div className="bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-4">
          <div>
            <p className="text-sm font-semibold text-teal-700 mb-1">
              SDG 4 · Open Career Learning & Guides
            </p>
            <h1 className="font-display text-3xl font-bold text-slate-900">
              Learning & Resource Centre
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Original career guides across nine core disciplines, plus clearly identified external public resources.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 pt-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search learning guides by topic or keyword..."
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <select
              aria-label="Filter by resource category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-4 py-2.5 text-sm border border-slate-300 rounded-lg bg-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All 9 Categories' : c}
                </option>
              ))}
            </select>
          </div>

          {/* Horizontal scrollable category bar on desktop */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  category === c
                    ? 'bg-blue-800 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-sm text-slate-500">
            Loading resources...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-sm text-slate-500">
            No learning materials matched your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((res) => (
              <article
                key={res.id}
                className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="text-xs text-slate-500">
                    {res.category} · {res.read_time}
                    {res.is_external ? ' · External Resource' : ' · Original Guide'}
                  </div>
                  <h2 className="font-display text-lg font-bold text-slate-900">
                    {res.title}
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed">{res.description}</p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveArticle(res)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Read Guide
                  </button>
                  {res.is_external && res.external_url && (
                    <a
                      href={res.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-800 hover:underline"
                    >
                      Visit External Site <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Article Reader Modal */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="text-xs font-medium text-teal-700">
                  {activeArticle.category} · {activeArticle.read_time}
                </div>
                <h2 className="font-display text-xl font-bold text-slate-900 mt-1">
                  {activeArticle.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                aria-label="Close guide"
                className="p-1 text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {activeArticle.content}
            </div>

            {activeArticle.is_external && activeArticle.external_url && (
              <div className="pt-4 border-t border-slate-200">
                <a
                  href={activeArticle.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-800 hover:bg-blue-900 rounded-lg"
                >
                  Open External Resource <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
