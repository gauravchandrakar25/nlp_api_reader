'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Globe,
  Key,
  Shield,
  Bot,
  ChevronDown,
  ChevronUp,
  Cpu,
  Info,
} from 'lucide-react';
import { usePlaygroundStore } from '../store/usePlaygroundStore';

export const ExecutionDetails: React.FC = () => {
  const { executionResult, error } = usePlaygroundStore();
  const [showHeaders, setShowHeaders] = useState(false);
  const [showParams, setShowParams] = useState(true);

  if (!executionResult && !error) {
    return (
      <div className="p-4 bg-zinc-950/60 border-b border-zinc-800 text-xs text-zinc-500 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Info className="w-3.5 h-3.5 text-zinc-500" />
          <span>Ready for query execution. Type a request or select an endpoint template on the left.</span>
        </div>
      </div>
    );
  }

  if (error && !executionResult) {
    return (
      <div className="p-4 bg-rose-950/20 border-b border-rose-900/40 text-xs text-rose-300 flex items-center space-x-2">
        <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
        <span>Execution Error: {error}</span>
      </div>
    );
  }

  if (!executionResult) return null;

  const isSuccess = executionResult.success && executionResult.httpStatus >= 200 && executionResult.httpStatus < 400;

  return (
    <div className="bg-[#12131a] border-b border-zinc-800 p-4 space-y-3 select-text">
      {/* Top Banner: Status, Method, URL, Latency */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          {/* Status Badge */}
          <span
            className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-bold font-mono border ${
              isSuccess
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}
          >
            {isSuccess ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            <span>{executionResult.httpStatus} {isSuccess ? 'OK' : 'FAILED'}</span>
          </span>

          {/* HTTP Method */}
          <span className="font-mono text-xs font-semibold px-2 py-1 rounded bg-zinc-800 text-zinc-200 border border-zinc-700/60">
            {executionResult.method}
          </span>

          {/* Resolved URL */}
          <div className="flex items-center space-x-1.5 font-mono text-xs text-zinc-300 bg-zinc-900/90 border border-zinc-800 px-2.5 py-1 rounded max-w-xl truncate">
            <Globe className="w-3 h-3 text-zinc-400 flex-shrink-0" />
            <span className="truncate">{executionResult.url}</span>
          </div>
        </div>

        {/* Latency badge */}
        <div className="flex items-center space-x-1 text-xs font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded">
          <Clock className="w-3 h-3 text-amber-400" />
          <span>{executionResult.latencyMs} ms</span>
        </div>
      </div>

      {/* LLM Intent Resolution Banner */}
      {executionResult.matchedTemplate && (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-2.5 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-zinc-300 font-medium">
              <Bot className="w-3.5 h-3.5 text-emerald-400" />
              <span>Matched Template:</span>
              <span className="text-white font-semibold">{executionResult.matchedTemplate.name}</span>
              <span className="text-zinc-400 font-mono text-[11px] bg-zinc-800 px-1.5 py-0.2 rounded">
                {executionResult.matchedTemplate.category}
              </span>
            </div>

            <div className="flex items-center space-x-1 text-emerald-400 text-[11px] font-mono">
              <Cpu className="w-3 h-3" />
              <span>Confidence: {executionResult.matchedTemplate.confidence}%</span>
            </div>
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed pl-5">
            {executionResult.matchedTemplate.reasoning}
          </p>
        </div>
      )}

      {/* Extracted Parameters and Headers Accordion */}
      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
        {/* Toggle Parameters */}
        <button
          onClick={() => setShowParams(!showParams)}
          className="flex items-center space-x-1 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <span className="font-semibold text-[11px] uppercase tracking-wide">
            Injected Parameters ({Object.keys(executionResult.params || {}).length})
          </span>
          {showParams ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {/* Toggle Headers */}
        <button
          onClick={() => setShowHeaders(!showHeaders)}
          className="flex items-center space-x-1 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <span className="font-semibold text-[11px] uppercase tracking-wide">
            Sanitized Headers ({Object.keys(executionResult.headers || {}).length})
          </span>
          {showHeaders ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Injected Parameters List */}
      {showParams && executionResult.params && Object.keys(executionResult.params).length > 0 && (
        <div className="flex flex-wrap gap-1.5 bg-zinc-900/60 border border-zinc-800/80 rounded-md p-2">
          {Object.entries(executionResult.params).map(([key, val]) => (
            <div
              key={key}
              className="flex items-center space-x-1 font-mono text-[11px] bg-zinc-800/90 border border-zinc-700/60 rounded px-2 py-0.5 text-zinc-300"
            >
              <span className="text-zinc-400">{key}:</span>
              <span className="text-emerald-300 font-medium">{String(val)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Sanitized Headers View */}
      {showHeaders && executionResult.headers && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-md p-2.5 font-mono text-[11px] text-zinc-400 space-y-1">
          {Object.entries(executionResult.headers).map(([k, v]) => (
            <div key={k} className="flex items-start space-x-2">
              <span className="text-zinc-400 min-w-[120px]">{k}:</span>
              <span className={k.toLowerCase().includes('auth') ? 'text-amber-400 font-semibold' : 'text-zinc-300'}>
                {v}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
