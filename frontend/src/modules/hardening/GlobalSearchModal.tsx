import React, { useState, useEffect } from 'react';
import { Search, X, Layers, Filter, ExternalLink } from 'lucide-react';
import apiClient from '../../core/api/client';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<string>('ALL');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<string>('PostgresTSVector');

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      const entityTypes = selectedEntity === 'ALL' ? null : [selectedEntity];
      apiClient.post('/hardening/search', {
        query,
        entity_types: entityTypes,
        limit: 20
      })
      .then((res: any) => {
        setResults(res.data?.results || []);
        setProvider(res.data?.provider || 'PostgresTSVector');
        setLoading(false);
      })
      .catch(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [query, selectedEntity]);

  if (!isOpen) return null;

  const entityPills = ['ALL', 'Facility', 'Supplier', 'Product', 'ActivityData', 'EmissionFactor', 'Calculation', 'Disclosure', 'ReductionInitiative'];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-start justify-center pt-20 p-4 z-50">
      <div className="glass-panel max-w-2xl w-full rounded-2xl border border-slate-700 shadow-2xl overflow-hidden space-y-4 p-5 bg-slate-950/90">
        {/* SEARCH INPUT BAR */}
        <div className="flex items-center gap-3 bg-slate-900 px-4 py-3 rounded-xl border border-slate-800 focus-within:border-emerald-500 transition-all">
          <Search className="w-5 h-5 text-emerald-400 shrink-0" />
          <input
            type="text"
            placeholder="Global Search across Facilities, Suppliers, PCFs, Activity Data, Disclosures..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-slate-100 text-sm font-medium focus:outline-none placeholder-slate-500"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-500 hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          )}
          <button onClick={onClose} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold">
            ESC
          </button>
        </div>

        {/* ENTITY TYPE FILTER PILLS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {entityPills.map((pill) => (
            <button
              key={pill}
              onClick={() => setSelectedEntity(pill)}
              className={`px-3 py-1 rounded-full font-semibold transition-all whitespace-nowrap ${
                selectedEntity === pill
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {pill}
            </button>
          ))}
        </div>

        {/* SEARCH RESULTS FEED */}
        <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
          {loading && (
            <div className="p-8 text-center text-slate-500 text-xs">Searching global TSVector index...</div>
          )}

          {!loading && results.length > 0 && results.map((res) => (
            <div key={`${res.entity_type}-${res.id}`} className="p-3 bg-slate-900/80 hover:bg-slate-900 rounded-xl border border-slate-800/80 flex items-center justify-between gap-3 transition-all">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100 text-sm">{res.title}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-emerald-400 border border-slate-700 font-mono">
                    {res.entity_type}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{res.snippet}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-500 shrink-0" />
            </div>
          ))}

          {!loading && query && results.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-xs">
              No matching records found for "{query}".
            </div>
          )}
        </div>

        {/* PROVIDER FOOTER */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span>Search Engine Indexer: <strong className="text-emerald-400">{provider}</strong></span>
          <span>{results.length} results returned</span>
        </div>
      </div>
    </div>
  );
};
