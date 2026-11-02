import React from 'react';
import { Database, FileSpreadsheet, Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';

interface HeaderProps {
  totalVoters: number;
  totalFiles: number;
  onNewProject: () => void;
  isProcessing: boolean;
  geminiReady: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  totalVoters,
  totalFiles,
  onNewProject,
  isProcessing,
  geminiReady,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-600 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20 ring-2 ring-amber-400/30">
              <FileSpreadsheet className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white font-['Noto_Sans_Gujarati']">
                  ગુજરાતી મતદાર યાદી ડેટા એક્સટ્રેક્ટર
                </h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ૧૦૦૦+ PDF સપોર્ટ
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-['Noto_Sans_Gujarati']">
                Electoral Roll PDF to Consolidated Master Excel Sheet (.xlsx) • વિધાનસભા મત વિભાગ અને ભાગ ડેટા
              </p>
            </div>
          </div>

          {/* Status Badges & New Project Action */}
          <div className="flex items-center space-x-4">
            {/* Gemini AI status */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="text-slate-300">Gemini 3.1 Flash Lite OCR:</span>
              <span className="font-semibold text-emerald-400">સક્રિય</span>
            </div>

            {/* Total Extracted Records */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-xs">
              <Database className="w-4 h-4 text-indigo-400" />
              <span className="text-indigo-200">કુલ મતદારો:</span>
              <span className="font-bold text-amber-300 text-sm">{totalVoters.toLocaleString()}</span>
            </div>

            {/* New Project / Reset Fresh Button */}
            <button
              onClick={onNewProject}
              disabled={isProcessing}
              title="બધો ડેટા સાફ કરી એપને એકદમ નવી (Fresh) કરો"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed font-['Noto_Sans_Gujarati']"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span>નવો પ્રોજેક્ટ</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
