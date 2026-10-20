import { create } from 'zustand';
import { EndpointTemplate, ExecutionResult, AuditRecord } from '../types';

interface PlaygroundState {
  // Natural Language Query
  query: string;
  isExecuting: boolean;

  // Templates & Navigation
  endpoints: EndpointTemplate[];
  selectedEndpoint: EndpointTemplate | null;
  searchFilter: string;
  isLoadingEndpoints: boolean;

  // Response & Inspection
  executionResult: ExecutionResult | null;
  error: string | null;

  // Audit Logs
  auditLogs: AuditRecord[];
  isAuditModalOpen: boolean;
  isLoadingAudit: boolean;

  // Actions
  setQuery: (query: string) => void;
  setSelectedEndpoint: (endpoint: EndpointTemplate | null) => void;
  setSearchFilter: (filter: string) => void;
  setIsAuditModalOpen: (open: boolean) => void;
  clearResult: () => void;

  fetchEndpoints: () => Promise<void>;
  executeNaturalLanguage: (overrideQuery?: string) => Promise<void>;
  executeSelectedEndpointDirectly: () => Promise<void>;
  fetchAuditHistory: () => Promise<void>;
}

export const usePlaygroundStore = create<PlaygroundState>((set, get) => ({
  query: 'Find customer by email alice@acme.corp',
  isExecuting: false,
  endpoints: [],
  selectedEndpoint: null,
  searchFilter: '',
  isLoadingEndpoints: false,
  executionResult: null,
  error: null,
  auditLogs: [],
  isAuditModalOpen: false,
  isLoadingAudit: false,

  setQuery: (query: string) => set({ query }),

  setSelectedEndpoint: (endpoint: EndpointTemplate | null) => {
    set({ selectedEndpoint: endpoint });
    if (endpoint && endpoint.sample_queries.length > 0) {
      set({ query: endpoint.sample_queries[0] });
    }
  },

  setSearchFilter: (searchFilter: string) => set({ searchFilter }),

  setIsAuditModalOpen: (isAuditModalOpen: boolean) => set({ isAuditModalOpen }),

  clearResult: () => set({ executionResult: null, error: null }),

  fetchEndpoints: async () => {
    set({ isLoadingEndpoints: true });
    try {
      const res = await fetch('/api/endpoints');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        set({
          endpoints: json.data,
          selectedEndpoint: json.data[0] || null,
          isLoadingEndpoints: false,
        });
      }
    } catch (err: any) {
      console.warn('[PlaygroundStore] Failed to fetch endpoints from backend:', err.message);
      set({ isLoadingEndpoints: false });
    }
  },

  executeNaturalLanguage: async (overrideQuery?: string) => {
    const q = overrideQuery !== undefined ? overrideQuery : get().query;
    if (!q.trim()) return;

    set({ isExecuting: true, error: null });

    try {
      const res = await fetch('/api/execute-nl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: q.trim(),
          userIdentifier: 'pm_session_workspace',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        set({
          isExecuting: false,
          error: data.error || 'Failed to match or execute API query',
          executionResult: data.suggestedEndpoints
            ? {
                success: false,
                httpStatus: res.status,
                latencyMs: 45,
                url: 'unresolved',
                method: 'GET',
                headers: {},
                params: {},
                data: {
                  error: data.error,
                  reasoning: data.reasoning,
                  suggestions: data.suggestedEndpoints,
                },
                matchedTemplate: {
                  id: 'unmatched',
                  name: 'No Match Found',
                  category: 'Error',
                  riskLevel: 'read_only',
                  confidence: data.confidence || 0,
                  reasoning: data.reasoning || 'Could not find a matching template.',
                },
              }
            : null,
        });
        return;
      }

      set({
        executionResult: data,
        isExecuting: false,
        error: null,
      });

      // Update selectedEndpoint to match what the LLM selected
      if (data.matchedTemplate?.id) {
        const found = get().endpoints.find((ep) => ep.id === data.matchedTemplate.id);
        if (found) {
          set({ selectedEndpoint: found });
        }
      }
    } catch (err: any) {
      set({
        isExecuting: false,
        error: err.message || 'Network error connecting to API gateway',
      });
    }
  },

  executeSelectedEndpointDirectly: async () => {
    const selected = get().selectedEndpoint;
    if (!selected) return;

    set({ isExecuting: true, error: null });

    try {
      const res = await fetch('/api/execute-nl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: get().query || selected.sample_queries[0] || selected.name,
          endpointId: selected.id,
          userIdentifier: 'pm_session_workspace',
        }),
      });

      const data = await res.json();

      set({
        executionResult: data,
        isExecuting: false,
        error: res.ok ? null : data.error || 'Execution failed',
      });
    } catch (err: any) {
      set({
        isExecuting: false,
        error: err.message,
      });
    }
  },

  fetchAuditHistory: async () => {
    set({ isLoadingAudit: true });
    try {
      const res = await fetch('/api/audit-logs?limit=30');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        set({ auditLogs: json.data, isLoadingAudit: false });
      }
    } catch (err: any) {
      console.warn('[PlaygroundStore] Failed to fetch audit history:', err.message);
      set({ isLoadingAudit: false });
    }
  },
}));
