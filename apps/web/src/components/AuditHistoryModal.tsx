'use client';

import React from 'react';
import { X, History, CheckCircle, XCircle, Clock, ShieldAlert } from 'lucide-react';
import { usePlaygroundStore } from '../store/usePlaygroundStore';

export const AuditHistoryModal: React.FC = () => {
  const { isAuditModalOpen, setIsAuditModalOpen, auditLogs, isLoadingAudit } = usePlaygroundStore();

  if (!isAuditModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-[#13141c] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/70">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">System Audit Trail</h2>
              <p className="text-[11px] text-zinc-400">
                Full chronological ledger of natural language queries, resolved templates, and execution status
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAuditModalOpen(false)}
            className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {isLoadingAudit ? (
            <div className="py-12 text-center text-zinc-500 text-xs">Loading audit logs...</div>
          ) : auditLogs.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs">
              No audit logs recorded yet. Execute queries to see entries in this audit ledger.
            </div>
          ) : (
            auditLogs.map((log) => {
              const isOk = log.success && log.http_status && log.http_status < 400;
              return (
                <div
                  key={log.id}
                  className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-lg text-xs space-y-2 hover:border-zinc-700/80 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-bold font-mono border ${
                          isOk
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {isOk ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span>{log.http_status || 'ERR'}</span>
                      </span>

                      <span className="font-semibold text-zinc-200">
                        {log.matched_endpoint_name || 'Unmatched Query'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-[11px] text-zinc-500 font-mono">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                      <span>({log.execution_time_ms || 0} ms)</span>
                    </div>
                  </div>

                  {/* Query */}
                  <div className="text-zinc-300 bg-zinc-950/60 border border-zinc-800/60 rounded px-2.5 py-1.5 font-mono text-[11px]">
                    "{log.natural_language_query}"
                  </div>

                  {/* URL & User */}
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                    <div className="truncate max-w-lg">
                      <span className="text-zinc-400 font-bold mr-1">{log.resolved_method}</span>
                      <span className="text-zinc-300">{log.resolved_url}</span>
                    </div>
                    <span className="text-zinc-400">User: {log.user_identifier}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-zinc-950/80 border-t border-zinc-800 text-right">
          <button
            onClick={() => setIsAuditModalOpen(false)}
            className="text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-4 py-1.5 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
