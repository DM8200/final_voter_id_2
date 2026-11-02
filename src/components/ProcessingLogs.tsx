import React, { useState } from 'react';
import { Terminal, AlertTriangle, AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { ProcessingLog } from '../types/voter';

interface ProcessingLogsProps {
  logs: ProcessingLog[];
}

export const ProcessingLogs: React.FC<ProcessingLogsProps> = ({ logs }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (logs.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-slate-600" />
          <h3 className="font-bold text-sm text-slate-800 font-['Noto_Sans_Gujarati']">
            પ્રક્રિયા લોગ અને ચેતવણી અહેવાલ ({logs.length})
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 font-['Noto_Sans_Gujarati']">
          <span>{isOpen ? 'સંકેલો' : 'વિસ્તૃત કરો'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="px-6 pb-6 pt-2 border-t border-slate-100 max-h-72 overflow-y-auto space-y-2 font-mono text-xs">
          {logs.map((log) => (
            <div
              key={log.id}
              className={`p-2.5 rounded-xl border flex items-start gap-2.5 ${
                log.level === 'error'
                  ? 'bg-red-50/70 border-red-200 text-red-900'
                  : log.level === 'warning'
                  ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {log.level === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                ) : log.level === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                ) : (
                  <Info className="w-4 h-4 text-indigo-600" />
                )}
              </div>
              <div className="flex-1 font-['Noto_Sans_Gujarati']">
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-0.5 font-mono">
                  <span>{new Date(log.timestamp).toLocaleTimeString('gu-IN')}</span>
                  <span>•</span>
                  <span className="font-semibold text-slate-700">{log.pdfFileName}</span>
                  {log.pageNumber && <span>(પેજ {log.pageNumber})</span>}
                </div>
                <div className="text-xs leading-relaxed">{log.message}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
