'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Copy, Check, FileJson, Maximize2, Minimize2 } from 'lucide-react';

// Dynamically import Monaco Editor to prevent Next.js SSR window errors
const Editor = dynamic(() => import('@monaco-editor/react').then((mod) => mod.default), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#1e1e1e] text-zinc-500 font-mono text-xs">
      <div className="flex items-center space-x-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        <span>Initializing Monaco Code Engine...</span>
      </div>
    </div>
  ),
});

interface MonacoViewerProps {
  value: any;
  height?: string;
  readOnly?: boolean;
}

export const MonacoViewer: React.FC<MonacoViewerProps> = ({
  value,
  height = '100%',
  readOnly = true,
}) => {
  const [copied, setCopied] = useState(false);

  const formattedJson =
    typeof value === 'string'
      ? value
      : value !== undefined && value !== null
      ? JSON.stringify(value, null, 2)
      : '{\n  "message": "Execute a natural language query or pick an endpoint template to inspect response data"\n}';

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineCount = formattedJson.split('\n').length;
  const byteSize = new Blob([formattedJson]).size;
  const formattedSize = byteSize > 1024 ? `${(byteSize / 1024).toFixed(1)} KB` : `${byteSize} B`;

  return (
    <div className="w-full h-full flex flex-col bg-[#1e1e1e] rounded-b-lg border-t border-zinc-800 overflow-hidden">
      {/* Editor Sub-Header Toolbar */}
      <div className="h-9 px-4 bg-[#18181b] border-b border-zinc-800 flex items-center justify-between text-xs select-none">
        <div className="flex items-center space-x-2 text-zinc-400">
          <FileJson className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-mono text-[11px] text-zinc-300">response.json</span>
          <span className="text-zinc-600">•</span>
          <span className="text-[11px] font-mono text-zinc-500">{lineCount} lines</span>
          <span className="text-zinc-600">•</span>
          <span className="text-[11px] font-mono text-zinc-500">{formattedSize}</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/60 rounded px-2 py-0.5 text-[11px] transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Monaco Code Surface */}
      <div className="flex-1 w-full overflow-hidden">
        <Editor
          height={height}
          defaultLanguage="json"
          value={formattedJson}
          theme="vs-dark"
          options={{
            readOnly,
            minimap: { enabled: false },
            fontSize: 12.5,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            renderLineHighlight: 'all',
            padding: { top: 10, bottom: 10 },
          }}
        />
      </div>
    </div>
  );
};
