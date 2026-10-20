'use client';

import React, { useEffect } from 'react';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { QueryInput } from '../components/QueryInput';
import { ExecutionDetails } from '../components/ExecutionDetails';
import { MonacoViewer } from '../components/MonacoViewer';
import { AuditHistoryModal } from '../components/AuditHistoryModal';
import { usePlaygroundStore } from '../store/usePlaygroundStore';

export default function PlaygroundPage() {
  const { fetchEndpoints, executionResult } = usePlaygroundStore();

  useEffect(() => {
    fetchEndpoints();
  }, [fetchEndpoints]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0c0d12]">
      {/* Top Navigation */}
      <Header />

      {/* Main Studio Viewport */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Pre-Configured Endpoints Sidebar */}
        <Sidebar />

        {/* Center / Right Workbench Area */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#101118]">
          {/* Natural Language Prompt & Quick Chips Bar */}
          <QueryInput />

          {/* Execution Telemetry (Status, Latency, Matched Template, Injected Params) */}
          <ExecutionDetails />

          {/* Monaco Editor Display Window for JSON Responses */}
          <div className="flex-1 overflow-hidden relative">
            <MonacoViewer value={executionResult?.data} />
          </div>
        </main>
      </div>

      {/* Audit History Modal */}
      <AuditHistoryModal />
    </div>
  );
}
