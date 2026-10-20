'use client';

import React from 'react';
import { Shield, History, Activity, Database, KeyRound, Sparkles } from 'lucide-react';
import { usePlaygroundStore } from '../store/usePlaygroundStore';

export const Header: React.FC = () => {
  const { isAuditModalOpen, setIsAuditModalOpen, fetchAuditHistory } = usePlaygroundStore();

  const handleOpenAudit = () => {
    fetchAuditHistory();
    setIsAuditModalOpen(true);
  };

  return (
    <header className="h-14 border-b border-zinc-800 bg-zinc-950/70 backdrop-blur-md px-5 flex items-center justify-between z-20">
      {/* Brand & Title */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-md shadow-emerald-900/30">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-sm tracking-tight text-white">REA Gateway</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
              Zero-Frontend-Secrets
            </span>
          </div>
          <p className="text-[11px] text-zinc-400">Natural Language API Playground for Product & Ops</p>
        </div>
      </div>

      {/* Security & Status Pill */}
      <div className="flex items-center space-x-4">
        <div className="hidden md:flex items-center space-x-2 text-xs text-zinc-400 bg-zinc-900/90 border border-zinc-800 rounded-full px-3 py-1">
          <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
          <span>PostgreSQL pgcrypto Active</span>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>

        {/* Audit Log Trigger */}
        <button
          onClick={handleOpenAudit}
          className="flex items-center space-x-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 rounded-md px-3 py-1.5 transition-colors shadow-sm"
        >
          <History className="w-3.5 h-3.5 text-zinc-400" />
          <span>Audit Trail</span>
        </button>
      </div>
    </header>
  );
};
