import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Edit2,
  Eye,
  FileSpreadsheet,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { VoterRecord, MASTER_EXCEL_COLUMNS, VerificationStatus } from '../types/voter';

interface MasterTableProps {
  voters: VoterRecord[];
  onUpdateVoter: (updated: VoterRecord) => void;
  onEditVoter: (voter: VoterRecord) => void;
  onViewPage: (voter: VoterRecord) => void;
}

export const MasterTable: React.FC<MasterTableProps> = ({
  voters,
  onUpdateVoter,
  onEditVoter,
  onViewPage,
}) => {
  // Filters & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [vibhagFilter, setVibhagFilter] = useState<string>('ALL');
  const [bhagFilter, setBhagFilter] = useState<string>('ALL');
  const [fileFilter, setFileFilter] = useState<string>('ALL');
  const [onlyWarnings, setOnlyWarnings] = useState<boolean>(false);
  const [onlyDuplicates, setOnlyDuplicates] = useState<boolean>(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Unique filter lists
  const vibhagOptions = useMemo(() => {
    const set = new Set<string>();
    voters.forEach((v) => {
      if (v.vibhagNo) set.add(`${v.vibhagNo} - ${v.vibhagName || ''}`);
    });
    return Array.from(set);
  }, [voters]);

  const bhagOptions = useMemo(() => {
    const set = new Set<string>();
    voters.forEach((v) => {
      if (v.bhagNo) set.add(v.bhagNo);
    });
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }, [voters]);

  const fileOptions = useMemo(() => {
    const set = new Set<string>();
    voters.forEach((v) => {
      if (v.pdfFileName) set.add(v.pdfFileName);
    });
    return Array.from(set);
  }, [voters]);

  // Filtering logic
  const filteredVoters = useMemo(() => {
    return voters.filter((v) => {
      // Search by Gujarati name, relative name or EPIC
      if (searchTerm.trim()) {
        const query = searchTerm.trim().toLowerCase();
        const matchName = (v.voterName || '').toLowerCase().includes(query);
        const matchEpic = (v.epicNo || '').toLowerCase().includes(query);
        const matchRelative = (v.relativeName || '').toLowerCase().includes(query);
        const matchHouse = (v.houseNo || '').toLowerCase().includes(query);
        const matchAddress = (v.fullAddress || '').toLowerCase().includes(query);
        if (!matchName && !matchEpic && !matchRelative && !matchHouse && !matchAddress) return false;
      }

      // Verification Status filter
      if (statusFilter !== 'ALL' && v.verifiedStatus !== statusFilter) {
        return false;
      }

      // Vibhag filter
      if (vibhagFilter !== 'ALL') {
        const key = `${v.vibhagNo} - ${v.vibhagName || ''}`;
        if (key !== vibhagFilter) return false;
      }

      // Bhag filter
      if (bhagFilter !== 'ALL' && v.bhagNo !== bhagFilter) {
        return false;
      }

      // File filter
      if (fileFilter !== 'ALL' && v.pdfFileName !== fileFilter) {
        return false;
      }

      // Only warnings
      if (onlyWarnings && (!v.warnings || v.warnings.trim().length === 0)) {
        return false;
      }

      // Only duplicates
      if (onlyDuplicates && !v.isDuplicateEpic) {
        return false;
      }

      return true;
    });
  }, [voters, searchTerm, statusFilter, vibhagFilter, bhagFilter, fileFilter, onlyWarnings, onlyDuplicates]);

  // Sequential Sorting & Pagination calculation
  const sortedFilteredVoters = useMemo(() => {
    return [...filteredVoters].sort((a, b) => {
      if (a.pdfFileName !== b.pdfFileName) {
        return a.pdfFileName.localeCompare(b.pdfFileName, undefined, { numeric: true });
      }
      const numA = parseInt(a.serialNo, 10);
      const numB = parseInt(b.serialNo, 10);
      if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
        return numA - numB;
      }
      const pageA = Number(a.pdfPageNo) || 0;
      const pageB = Number(b.pdfPageNo) || 0;
      if (pageA !== pageB) return pageA - pageB;
      return (a.serialNo || '').localeCompare(b.serialNo || '', undefined, { numeric: true });
    });
  }, [filteredVoters]);

  const totalPages = Math.max(1, Math.ceil(sortedFilteredVoters.length / pageSize));
  const paginatedVoters = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedFilteredVoters.slice(start, start + pageSize);
  }, [sortedFilteredVoters, currentPage, pageSize]);

  // Quick Verification toggle
  const cycleStatus = (voter: VoterRecord) => {
    let nextStatus: VerificationStatus = 'ચકાસેલ';
    if (voter.verifiedStatus === 'ચકાસવાનું') nextStatus = 'ચકાસેલ';
    else if (voter.verifiedStatus === 'ચકાસેલ') nextStatus = 'ચકાસણી જરૂરી';
    else if (voter.verifiedStatus === 'ચકાસણી જરૂરી') nextStatus = 'ચકાસવાનું';

    onUpdateVoter({
      ...voter,
      verifiedStatus: nextStatus,
    });
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setVibhagFilter('ALL');
    setBhagFilter('ALL');
    setFileFilter('ALL');
    setOnlyWarnings(false);
    setOnlyDuplicates(false);
    setCurrentPage(1);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col gap-4 pb-5 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 font-['Noto_Sans_Gujarati']">
              <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
              માસ્ટર મતદાર ડેટા પૂર્વાવલોકન (Master Data Preview)
            </h2>
            <p className="text-xs text-slate-500 font-['Noto_Sans_Gujarati']">
              કુલ <strong className="text-indigo-600">{voters.length}</strong> માંથી{' '}
              <strong className="text-slate-800">{filteredVoters.length}</strong> રેકોર્ડ્સ દર્શાવાયેલ છે
            </p>
          </div>

          {/* Quick Badges Filter */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setOnlyWarnings(!onlyWarnings);
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                onlyWarnings
                  ? 'bg-amber-100 text-amber-900 border-amber-300 ring-2 ring-amber-400/20'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              } font-['Noto_Sans_Gujarati']`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>ચેતવણી વાળા રેકોર્ડ્સ</span>
            </button>

            <button
              onClick={() => {
                setOnlyDuplicates(!onlyDuplicates);
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                onlyDuplicates
                  ? 'bg-purple-100 text-purple-900 border-purple-300 ring-2 ring-purple-400/20'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              } font-['Noto_Sans_Gujarati']`}
            >
              <AlertCircle className="w-3.5 h-3.5 text-purple-600" />
              <span>સંભવિત ડુપ્લિકેટ EPIC</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="મતદારનું નામ, સંબંધી, EPIC નં., મકાન નં. શોધો..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-['Noto_Sans_Gujarati']"
            />
          </div>

          {/* Vibhag Filter */}
          <div>
            <select
              value={vibhagFilter}
              onChange={(e) => {
                setVibhagFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-['Noto_Sans_Gujarati']"
            >
              <option value="ALL">બધા વિભાગ (All Vibhag)</option>
              {vibhagOptions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Bhag Filter */}
          <div>
            <select
              value={bhagFilter}
              onChange={(e) => {
                setBhagFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-['Noto_Sans_Gujarati']"
            >
              <option value="ALL">બધા ભાગ (All Bhag)</option>
              {bhagOptions.map((b) => (
                <option key={b} value={b}>
                  ભાગ નંબર: {b}
                </option>
              ))}
            </select>
          </div>

          {/* Verification Status Filter */}
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-['Noto_Sans_Gujarati']"
            >
              <option value="ALL">બધી સ્થિતિ (Status)</option>
              <option value="ચકાસવાનું">ચકાસવાનું (Pending)</option>
              <option value="ચકાસેલ">ચકાસેલ (Verified)</option>
              <option value="ચકાસણી જરૂરી">ચકાસણી જરૂરી (Review Needed)</option>
            </select>

            {(searchTerm || statusFilter !== 'ALL' || vibhagFilter !== 'ALL' || bhagFilter !== 'ALL' || onlyWarnings || onlyDuplicates) && (
              <button
                onClick={resetFilters}
                title="ફિલ્ટર્સ સાફ કરો"
                className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 shadow-inner">
        <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
          {/* Exact 20 Gujarati Column Headers */}
          <thead>
            <tr className="bg-slate-900 text-white font-['Noto_Sans_Gujarati'] divide-x divide-slate-800">
              <th className="py-3 px-3 w-16 text-center font-bold">ક્રિયા</th>
              <th className="py-3 px-3 text-center font-bold">1. {MASTER_EXCEL_COLUMNS[0]}</th>
              <th className="py-3 px-3 text-center font-bold">2. {MASTER_EXCEL_COLUMNS[1]}</th>
              <th className="py-3 px-4 font-bold min-w-[180px]">3. {MASTER_EXCEL_COLUMNS[2]}</th>
              <th className="py-3 px-3 font-bold">4. {MASTER_EXCEL_COLUMNS[3]}</th>
              <th className="py-3 px-4 font-bold min-w-[180px]">5. {MASTER_EXCEL_COLUMNS[4]}</th>
              <th className="py-3 px-3 font-bold">6. {MASTER_EXCEL_COLUMNS[5]}</th>
              <th className="py-3 px-3 font-bold">7. {MASTER_EXCEL_COLUMNS[6]}</th>
              <th className="py-3 px-3 font-bold">8. {MASTER_EXCEL_COLUMNS[7]}</th>
              <th className="py-3 px-3 font-bold">9. {MASTER_EXCEL_COLUMNS[8]}</th>
              <th className="py-3 px-3 text-center font-bold">10. {MASTER_EXCEL_COLUMNS[9]}</th>
              <th className="py-3 px-2 text-center font-bold">11. {MASTER_EXCEL_COLUMNS[10]}</th>
              <th className="py-3 px-2 text-center font-bold">12. {MASTER_EXCEL_COLUMNS[11]}</th>
              <th className="py-3 px-3 text-center font-bold">13. {MASTER_EXCEL_COLUMNS[12]}</th>
              <th className="py-3 px-3 font-bold">14. {MASTER_EXCEL_COLUMNS[13]}</th>
              <th className="py-3 px-2 text-center font-bold">15. {MASTER_EXCEL_COLUMNS[14]}</th>
              <th className="py-3 px-2 text-center font-bold">16. {MASTER_EXCEL_COLUMNS[15]}</th>
              <th className="py-3 px-3 font-bold max-w-[200px] truncate">17. {MASTER_EXCEL_COLUMNS[16]}</th>
              <th className="py-3 px-2 text-center font-bold">18. {MASTER_EXCEL_COLUMNS[17]}</th>
              <th className="py-3 px-3 text-center font-bold">19. {MASTER_EXCEL_COLUMNS[18]}</th>
              <th className="py-3 px-4 font-bold min-w-[180px]">20. {MASTER_EXCEL_COLUMNS[19]}</th>
              <th className="py-3 px-4 font-bold min-w-[220px]">21. {MASTER_EXCEL_COLUMNS[20]}</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 font-['Noto_Sans_Gujarati']">
            {paginatedVoters.length === 0 ? (
              <tr>
                <td colSpan={22} className="py-12 text-center text-slate-400">
                  કોઈ મતદાર રેકોર્ડ મળ્યો નથી
                </td>
              </tr>
            ) : (
              paginatedVoters.map((v) => {
                const hasWarning = v.warnings && v.warnings.trim().length > 0;
                return (
                  <tr
                    key={v.id}
                    className={`hover:bg-indigo-50/40 transition-colors ${
                      hasWarning ? 'bg-amber-50/30' : 'bg-white'
                    }`}
                  >
                    {/* Action Column: Edit & Page Preview */}
                    <td className="py-2 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onEditVoter(v)}
                          title="રેકોર્ડ સુધારો (Edit Record)"
                          className="p-1 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-indigo-100/60 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onViewPage(v)}
                          title="મૂળ PDF પેજ જુઓ (Inspect PDF Page)"
                          className="p-1 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-indigo-100/60 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* 1. ક્રમ નંબર */}
                    <td className="py-2.5 px-3 text-center font-mono font-medium text-slate-700">
                      {v.serialNo}
                    </td>

                    {/* 2. ઓળખપત્ર નંબર (EPIC) */}
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-indigo-900">
                      {v.epicNo || <span className="text-red-500 italic">ઉપલબ્ધ નથી</span>}
                    </td>

                    {/* 3. મતદારનું નામ */}
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      {v.voterName || <span className="text-red-500 italic">વાંચવામાં મુશ્કેલી</span>}
                    </td>

                    {/* 4. સંબંધનો પ્રકાર */}
                    <td className="py-2.5 px-3 text-slate-600">{v.relationType || '-'}</td>

                    {/* 5. સંબંધીનું નામ */}
                    <td className="py-2.5 px-4 text-slate-800">{v.relativeName || '-'}</td>

                    {/* 6. પિતાનું નામ */}
                    <td className="py-2.5 px-3 text-slate-700">{v.fatherName || '-'}</td>

                    {/* 7. પતિનું નામ */}
                    <td className="py-2.5 px-3 text-slate-700">{v.husbandName || '-'}</td>

                    {/* 8. માતાનું નામ */}
                    <td className="py-2.5 px-3 text-slate-700">{v.motherName || '-'}</td>

                    {/* 9. અન્ય સંબંધી */}
                    <td className="py-2.5 px-3 text-slate-700">{v.otherRelative || '-'}</td>

                    {/* 10. ઘર / મકાન નંબર */}
                    <td className="py-2.5 px-3 text-center text-slate-800">{v.houseNo || '-'}</td>

                    {/* 11. ઉંમર */}
                    <td className="py-2.5 px-2 text-center font-medium text-slate-800">{v.age || '-'}</td>

                    {/* 12. જાતિ */}
                    <td className="py-2.5 px-2 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          v.gender === 'પુરુષ'
                            ? 'bg-blue-100 text-blue-800'
                            : v.gender === 'સ્ત્રી'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {v.gender || '-'}
                      </span>
                    </td>

                    {/* 13. વિભાગ નંબર */}
                    <td className="py-2.5 px-3 text-center font-semibold text-slate-800">{v.vibhagNo || '-'}</td>

                    {/* 14. વિભાગનું નામ */}
                    <td className="py-2.5 px-3 text-slate-800">{v.vibhagName || '-'}</td>

                    {/* 15. વોર્ડ નંબર */}
                    <td className="py-2.5 px-2 text-center text-slate-600">{v.wardNo || '-'}</td>

                    {/* 16. ભાગ નંબર */}
                    <td className="py-2.5 px-2 text-center font-semibold text-slate-800">{v.bhagNo || '-'}</td>

                    {/* 17. PDF ફાઇલનું નામ */}
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 max-w-[200px] truncate" title={v.pdfFileName}>
                      {v.pdfFileName}
                    </td>

                    {/* 18. PDF પેજ નંબર */}
                    <td className="py-2.5 px-2 text-center font-mono font-medium text-slate-700">{v.pdfPageNo}</td>

                    {/* 19. ચકાસાયેલ (Interactive Toggle) */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => cycleStatus(v)}
                        title="સ્થિતિ બદલવા ક્લિક કરો"
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95 ${
                          v.verifiedStatus === 'ચકાસેલ'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : v.verifiedStatus === 'ચકાસણી જરૂરી'
                            ? 'bg-red-100 text-red-800 border border-red-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {v.verifiedStatus}
                      </button>
                    </td>

                    {/* 20. સ્થિતિ / ચેતવણીઓ */}
                    <td className="py-2.5 px-4">
                      {v.warnings ? (
                        <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {v.warnings}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>

                    {/* 21. પૂર્ણ સરનામું */}
                    <td className="py-2.5 px-4 text-slate-700 min-w-[200px] max-w-[300px] truncate" title={v.fullAddress}>
                      {v.fullAddress || '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span>પેજ દીઠ રેકોર્ડ્સ:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={250}>250</option>
          </select>
          <span>
            (કુલ <strong>{filteredVoters.length}</strong> રેકોર્ડ્સ)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span>
            પેજ <strong>{currentPage}</strong> / <strong>{totalPages}</strong>
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
