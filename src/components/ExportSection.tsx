import React, { useState } from 'react';
import { Download, FileSpreadsheet, CheckCircle2, AlertTriangle, ShieldCheck, Sparkles } from 'lucide-react';
import { VoterRecord, ProcessingLog } from '../types/voter';
import { exportMasterVoterExcel, triggerExcelDownload } from '../services/excelExport';

interface ExportSectionProps {
  voters: VoterRecord[];
  logs: ProcessingLog[];
  isProcessing: boolean;
}

export const ExportSection: React.FC<ExportSectionProps> = ({
  voters,
  logs,
  isProcessing,
}) => {
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleDownload = async () => {
    if (voters.length === 0) return;
    setExporting(true);
    setExportSuccess(false);

    try {
      const blob = await exportMasterVoterExcel(voters, logs, 'મતદાર_માસ્ટર_ડેટા.xlsx');
      triggerExcelDownload(blob, 'મતદાર_માસ્ટર_ડેટા.xlsx');
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 5000);
    } catch (err) {
      console.error('Failed to export Excel workbook:', err);
      alert('એક્સેલ ફાઇલ બનાવવામાં ભૂલ આવી. કૃપા કરીને ફરી પ્રયાસ કરો.');
    } finally {
      setExporting(false);
    }
  };

  const verifiedCount = voters.filter((v) => v.verifiedStatus === 'ચકાસેલ').length;
  const warningCount = voters.filter((v) => v.warnings && v.warnings.trim().length > 0).length;

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-indigo-700/40 mb-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Info */}
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold mb-3 font-['Noto_Sans_Gujarati']">
            <Sparkles className="w-3.5 h-3.5" />
            <span>સંકલિત માસ્ટર વર્કશીટ • ૨૧ અધિકૃત ગુજરાતી કૉલમ્સ (પૂર્ણ સરનામાં સહિત)</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight font-['Noto_Sans_Gujarati']">
            સંકલિત માસ્ટર એક્સેલ શીટ ડાઉનલોડ કરો
          </h2>
          <p className="text-sm text-slate-300 mt-2 font-['Noto_Sans_Gujarati'] leading-relaxed">
            બધા જ ૧,૦૦૦+ પીડીએફમાંથી એક્સટ્રેક્ટ થયેલા તમામ મતદાર રેકોર્ડ્સ એક જ અધિકૃત શીટ{' '}
            <strong className="text-amber-400">"મતદાર માસ્ટર ડેટા"</strong> માં યુનિકોડ ગુજરાતી ટેક્સ્ટ, ફ્રીઝ કરેલ હેડર અને ફિલ્ટર્સ સાથે નિકાસ થશે.
          </p>

          {/* Quick Metrics of Export */}
          <div className="flex flex-wrap items-center gap-4 mt-4 text-xs font-['Noto_Sans_Gujarati']">
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <span className="text-slate-400">કુલ રેકોર્ડ્સ:</span>
              <strong className="text-amber-400 font-bold">{voters.length.toLocaleString()}</strong>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <span className="text-slate-400">માનવ ચકાસેલ:</span>
              <strong className="text-emerald-400 font-bold">{verifiedCount.toLocaleString()}</strong>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <span className="text-slate-400">ચેતવણી સહિત:</span>
              <strong className="text-amber-300 font-bold">{warningCount.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col items-center sm:items-end w-full lg:w-auto">
          <button
            onClick={handleDownload}
            disabled={voters.length === 0 || exporting}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-base shadow-lg shadow-emerald-900/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-['Noto_Sans_Gujarati']"
          >
            {exporting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>એક્સેલ ફાઇલ બની રહી છે...</span>
              </>
            ) : (
              <>
                <Download className="w-6 h-6" />
                <span>માસ્ટર એક્સેલ ડાઉનલોડ કરો (.xlsx)</span>
              </>
            )}
          </button>

          {exportSuccess && (
            <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1.5 font-['Noto_Sans_Gujarati'] animate-fadeIn">
              <CheckCircle2 className="w-4 h-4" />
              <span>એક્સેલ ફાઇલ સફળતાપૂર્વક ડાઉનલોડ થઈ ગઈ!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
