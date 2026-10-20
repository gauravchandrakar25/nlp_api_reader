'use client';

import React, { KeyboardEvent } from 'react';
import { Send, Sparkles, Loader2, Play, Terminal } from 'lucide-react';
import { usePlaygroundStore } from '../store/usePlaygroundStore';

const QUICK_PROMPTS = [
  'Find customer by email alice@acme.corp',
  'Show all active subscriptions',
  'Get all paid invoices for cus_123',
  'Get contact info for 50192',
  'List all deals in contractsent stage',
  'Find user profile for usr_884920',
  'Revoke all sessions for user usr_884920',
];

export const QueryInput: React.FC = () => {
  const {
    query,
    setQuery,
    executeNaturalLanguage,
    isExecuting,
    selectedEndpoint,
  } = usePlaygroundStore();

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      executeNaturalLanguage();
    }
  };

  const handleChipClick = (promptText: string) => {
    setQuery(promptText);
    executeNaturalLanguage(promptText);
  };

  return (
    <div className="p-4 border-b border-zinc-800 bg-[#0f1016] space-y-3">
      {/* Context info bar */}
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-medium text-zinc-300">Natural Language Intent Router</span>
          <span className="text-zinc-600">•</span>
          <span className="text-[11px] text-zinc-400">
            Translates non-technical requests into authenticated HTTP requests
          </span>
        </div>

        {selectedEndpoint && (
          <div className="hidden sm:flex items-center space-x-1.5 text-[11px] text-zinc-400">
            <Terminal className="w-3 h-3 text-zinc-400" />
            <span>Target:</span>
            <span className="font-mono text-zinc-300 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">
              {selectedEndpoint.http_method} {selectedEndpoint.path_template}
            </span>
          </div>
        )}
      </div>

      {/* Main Chat-like Input Bar */}
      <div className="relative flex items-center">
        <div className="absolute left-3.5 flex items-center pointer-events-none text-zinc-500">
          <Sparkles className="w-4 h-4 text-emerald-400" />
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isExecuting}
          placeholder="Ask in plain English: 'Find customer by email alice@acme.corp' or 'Show all active subscriptions'..."
          className="w-full bg-zinc-900/90 border border-zinc-700/70 hover:border-zinc-600 focus:border-emerald-500/80 rounded-xl pl-10 pr-28 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-inner transition-all disabled:opacity-50"
        />

        <div className="absolute right-2 flex items-center space-x-1">
          <button
            onClick={() => executeNaturalLanguage()}
            disabled={isExecuting || !query.trim()}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-medium text-xs px-3.5 py-2 rounded-lg transition-all shadow-md shadow-emerald-950/40 disabled:shadow-none"
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Routing...</span>
              </>
            ) : (
              <>
                <span>Execute</span>
                <Send className="w-3 h-3" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Prompt Suggestion Chips */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 flex-shrink-0">
          Try query:
        </span>
        <div className="flex items-center space-x-1.5 flex-nowrap">
          {QUICK_PROMPTS.map((promptText, idx) => (
            <button
              key={idx}
              onClick={() => handleChipClick(promptText)}
              disabled={isExecuting}
              className="flex-shrink-0 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 text-[11px] px-2.5 py-1 rounded-full transition-all"
            >
              {promptText}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
