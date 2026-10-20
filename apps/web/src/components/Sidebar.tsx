'use client';

import React from 'react';
import { Search, Lock, ShieldCheck, AlertCircle, Layers, ChevronRight, Zap } from 'lucide-react';
import { usePlaygroundStore } from '../store/usePlaygroundStore';
import { EndpointTemplate } from '../types';

export const Sidebar: React.FC = () => {
  const {
    endpoints,
    selectedEndpoint,
    setSelectedEndpoint,
    searchFilter,
    setSearchFilter,
    isLoadingEndpoints,
  } = usePlaygroundStore();

  const filteredEndpoints = endpoints.filter((ep) => {
    const q = searchFilter.toLowerCase();
    return (
      ep.name.toLowerCase().includes(q) ||
      ep.path_template.toLowerCase().includes(q) ||
      ep.category.toLowerCase().includes(q) ||
      ep.description.toLowerCase().includes(q) ||
      (ep.provider?.name && ep.provider.name.toLowerCase().includes(q))
    );
  });

  // Group by category
  const categories = Array.from(new Set(filteredEndpoints.map((ep) => ep.category)));

  const getMethodBadgeClass = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'POST':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'PUT':
      case 'PATCH':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'DELETE':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30';
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'read_only':
        return (
          <span className="flex items-center text-[10px] text-emerald-400/80">
            <ShieldCheck className="w-3 h-3 mr-0.5 inline" />
            Read Only
          </span>
        );
      case 'idempotent_write':
        return (
          <span className="flex items-center text-[10px] text-amber-400/80">
            <AlertCircle className="w-3 h-3 mr-0.5 inline" />
            Idempotent
          </span>
        );
      case 'destructive':
        return (
          <span className="flex items-center text-[10px] text-rose-400/80">
            <AlertCircle className="w-3 h-3 mr-0.5 inline" />
            Destructive
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <aside className="w-80 h-full border-r border-zinc-800 bg-[#111218] flex flex-col flex-shrink-0">
      {/* Sidebar Header & Search */}
      <div className="p-3 border-b border-zinc-800/80 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            <Layers className="w-3.5 h-3.5 text-zinc-400" />
            <span>Pre-Approved Endpoints</span>
          </div>
          <span className="text-[11px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">
            {filteredEndpoints.length} total
          </span>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search API templates..."
            className="w-full bg-zinc-900/90 border border-zinc-800 text-xs rounded-md pl-8 pr-3 py-1.5 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all"
          />
        </div>
      </div>

      {/* Endpoints List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {isLoadingEndpoints ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-lg bg-zinc-900/60 animate-pulse border border-zinc-800/50" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-10 px-4 text-zinc-500 text-xs">
            No pre-approved endpoints found matching "{searchFilter}"
          </div>
        ) : (
          categories.map((category) => (
            <div key={category} className="space-y-1">
              <div className="px-2 py-1 text-[11px] font-medium text-zinc-400 tracking-wide uppercase flex items-center justify-between">
                <span>{category}</span>
              </div>

              <div className="space-y-1">
                {filteredEndpoints
                  .filter((ep) => ep.category === category)
                  .map((ep) => {
                    const isSelected = selectedEndpoint?.id === ep.id;
                    return (
                      <button
                        key={ep.id}
                        onClick={() => setSelectedEndpoint(ep)}
                        className={`w-full text-left p-2.5 rounded-lg border transition-all text-xs group ${
                          isSelected
                            ? 'bg-zinc-800/90 border-emerald-500/40 shadow-sm shadow-emerald-950/20'
                            : 'bg-zinc-900/40 border-zinc-800/60 hover:bg-zinc-800/50 hover:border-zinc-700/60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className={`px-1.5 py-0.5 rounded border text-[10px] font-bold font-mono ${getMethodBadgeClass(
                              ep.http_method
                            )}`}
                          >
                            {ep.http_method}
                          </span>
                          {getRiskBadge(ep.risk_level)}
                        </div>

                        <div className="font-medium text-zinc-200 group-hover:text-white transition-colors line-clamp-1">
                          {ep.name}
                        </div>

                        <div className="font-mono text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                          {ep.path_template}
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-zinc-800/40 text-[10px] text-zinc-500">
                          <span className="truncate">{ep.provider?.name || 'External API'}</span>
                          <span className="flex items-center space-x-0.5 text-zinc-400 group-hover:text-emerald-400 transition-colors">
                            <span>Test</span>
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Sidebar Footer Security Note */}
      <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/40 text-[11px] text-zinc-400 flex items-center space-x-2">
        <Lock className="w-3.5 h-3.5 text-emerald-400/80 flex-shrink-0" />
        <span className="leading-tight">All endpoints mapped to whitelisted templates with zero secret leaks.</span>
      </div>
    </aside>
  );
};
