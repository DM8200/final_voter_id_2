import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Users,
  Copy,
  Layers,
  Cpu,
  Sparkles,
} from 'lucide-react';
import { ExtractionStats } from '../types/voter';

interface DashboardStatsProps {
  stats: ExtractionStats;
  isProcessing: boolean;
  isPaused: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onRetryFailed: () => void;
  enableGemini: boolean;
  setEnableGemini: (val: boolean) => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  stats,
  isProcessing,
  isPaused,
  onStart,
  onPause,
  onResume,
  onRetryFailed,
  enableGemini,
  setEnableGemini,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
      {/* Header & Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-5 border-b border-slate-100 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-800 font-['Noto_Sans_Gujarati']">
              લાઇવ પ્રોસેસિંગ ડેશબોર્ડ (Live Processing Queue)
            </h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isProcessing && !isPaused
                  ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                  : isPaused
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {isProcessing && !isPaused ? 'ચાલુ છે (Running)' : isPaused ? 'વિરામ (Paused)' : 'તૈયાર (Idle)'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-['Noto_Sans_Gujarati']">
            ૧૦૦૦+ ફાઇલોની સલામત કતાર (Queue) • સ્વચાલિત ચેકપોઇન્ટ સેવ • બ્રાઉઝર રિફ્રેશ રિકવરી
          </p>
        </div>

        {/* Live Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Gemini Multimodal Switch */}
          <button
            type="button"
            onClick={() => setEnableGemini(!enableGemini)}
            title="Gemini AI Multimodal Visual OCR સક્રિય / નિષ્ક્રિય કરો"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
              enableGemini
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${enableGemini ? 'text-amber-600' : 'text-slate-400'}`} />
            <span className="font-['Noto_Sans_Gujarati']">Gemini OCR: {enableGemini ? 'ચાલુ' : 'બંધ'}</span>
          </button>

          {/* Action Buttons */}
          {!isProcessing ? (
            <button
              onClick={onStart}
              disabled={stats.totalPdfs === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed font-['Noto_Sans_Gujarati']"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>શરૂ કરો (Start)</span>
            </button>
          ) : isPaused ? (
            <button
              onClick={onResume}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all font-['Noto_Sans_Gujarati']"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>ફરી શરૂ કરો (Resume)</span>
            </button>
          ) : (
            <button
              onClick={onPause}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-all font-['Noto_Sans_Gujarati']"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>રોકો / વિરામ (Pause)</span>
            </button>
          )}

          {stats.failedPdfs > 0 && (
            <button
              onClick={onRetryFailed}
              disabled={isProcessing && !isPaused}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold shadow-sm transition-all font-['Noto_Sans_Gujarati']"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>નિષ્ફળ પેજ ફરીથી પ્રોસેસ કરો</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar & Current File Tracking */}
      <div className="mt-5 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs mb-2 gap-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <Cpu className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="font-semibold text-slate-700 font-['Noto_Sans_Gujarati']">હાલની ફાઇલ:</span>
            <span className="font-mono text-slate-900 truncate max-w-xs sm:max-w-md font-medium" title={stats.currentPdfName}>
              {stats.currentPdfName || 'કોઈ ફાઇલ પ્રક્રિયામાં નથી'}
            </span>
            {stats.currentPageNumber > 0 && (
              <span className="shrink-0 px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-semibold text-[11px] font-['Noto_Sans_Gujarati']">
                પેજ નં: {stats.currentPageNumber}
              </span>
            )}
          </div>
          <div className="font-bold text-slate-800 shrink-0 font-['Noto_Sans_Gujarati']">
            પ્રગતિ: <span className="text-indigo-600 text-sm">{stats.percentComplete}%</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-500 via-indigo-600 to-emerald-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${Math.max(2, stats.percentComplete)}%` }}
          />
        </div>
      </div>

      {/* 13 Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Total PDFs */}
        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-['Noto_Sans_Gujarati']">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>કુલ PDF ફાઇલો</span>
          </div>
          <div className="text-xl font-bold text-slate-800 mt-1">{stats.totalPdfs}</div>
        </div>

        {/* 2. Completed PDFs */}
        <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
          <div className="flex items-center gap-1.5 text-emerald-700 text-[11px] font-['Noto_Sans_Gujarati']">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>પૂર્ણ PDF</span>
          </div>
          <div className="text-xl font-bold text-emerald-700 mt-1">{stats.completedPdfs}</div>
        </div>

        {/* 3. Processing PDFs */}
        <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
          <div className="flex items-center gap-1.5 text-indigo-700 text-[11px] font-['Noto_Sans_Gujarati']">
            <Clock className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
            <span>પ્રક્રિયામાં PDF</span>
          </div>
          <div className="text-xl font-bold text-indigo-700 mt-1">{stats.processingPdfs}</div>
        </div>

        {/* 4. Failed PDFs */}
        <div className="bg-red-50/50 p-3 rounded-xl border border-red-100">
          <div className="flex items-center gap-1.5 text-red-700 text-[11px] font-['Noto_Sans_Gujarati']">
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            <span>નિષ્ફળ PDF</span>
          </div>
          <div className="text-xl font-bold text-red-700 mt-1">{stats.failedPdfs}</div>
        </div>

        {/* 5. Total Pages Discovered */}
        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-['Noto_Sans_Gujarati']">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>કુલ પેજ સંખ્યા</span>
          </div>
          <div className="text-xl font-bold text-slate-800 mt-1">{stats.totalPages}</div>
        </div>

        {/* 6. Pages Processed & Remaining */}
        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-['Noto_Sans_Gujarati']">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>પેજ પૂર્ણ / બાકી</span>
          </div>
          <div className="text-xl font-bold text-slate-800 mt-1">
            <span className="text-emerald-600">{stats.processedPages}</span>
            <span className="text-slate-400 text-sm"> / {stats.remainingPages}</span>
          </div>
        </div>

        {/* 7. Total Voter Records Extracted */}
        <div className="bg-indigo-50/80 p-3 rounded-xl border border-indigo-200 col-span-2">
          <div className="flex items-center gap-1.5 text-indigo-900 text-[11px] font-['Noto_Sans_Gujarati'] font-semibold">
            <Users className="w-4 h-4 text-indigo-600" />
            <span>કુલ એક્સટ્રેક્ટ થયેલ મતદારો (Total Voters)</span>
          </div>
          <div className="text-2xl font-black text-indigo-700 mt-1">
            {stats.totalVoters.toLocaleString()} <span className="text-xs font-normal text-indigo-500">રેકોર્ડ્સ</span>
          </div>
        </div>

        {/* 8. Review Required Count */}
        <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200 col-span-2">
          <div className="flex items-center gap-1.5 text-amber-900 text-[11px] font-['Noto_Sans_Gujarati'] font-semibold">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>ચકાસણી જરૂરી રેકોર્ડ્સ (Need Review)</span>
          </div>
          <div className="text-2xl font-black text-amber-700 mt-1">
            {stats.reviewRequiredCount}{' '}
            <span className="text-xs font-normal text-amber-600 font-['Noto_Sans_Gujarati']">કાર્ડ્સ</span>
          </div>
        </div>

        {/* 9. Possible Duplicate Records */}
        <div className="bg-purple-50/60 p-3 rounded-xl border border-purple-200 col-span-2">
          <div className="flex items-center gap-1.5 text-purple-900 text-[11px] font-['Noto_Sans_Gujarati'] font-semibold">
            <Copy className="w-4 h-4 text-purple-600" />
            <span>સંભવિત ડુપ્લિકેટ EPIC (Duplicate EPIC)</span>
          </div>
          <div className="text-2xl font-black text-purple-700 mt-1">
            {stats.duplicateCount}{' '}
            <span className="text-xs font-normal text-purple-600 font-['Noto_Sans_Gujarati']">મતદારો</span>
          </div>
        </div>
      </div>
    </div>
  );
};
