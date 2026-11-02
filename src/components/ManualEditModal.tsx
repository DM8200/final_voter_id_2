import React, { useState } from 'react';
import { X, Save, CheckCircle, AlertTriangle, ShieldCheck, User } from 'lucide-react';
import { VoterRecord, VerificationStatus } from '../types/voter';
import { sanitizeVoterRecord } from '../services/voterSanitizer';

interface ManualEditModalProps {
  voter: VoterRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: VoterRecord) => void;
}

export const ManualEditModal: React.FC<ManualEditModalProps> = ({
  voter,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen || !voter) return null;

  const [formData, setFormData] = useState<VoterRecord>({ ...voter });

  const handleChange = (field: keyof VoterRecord, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // Sync relation fields if relation type changed
      if (field === 'relationType' || field === 'relativeName') {
        const relType = field === 'relationType' ? value : updated.relationType;
        const relName = field === 'relativeName' ? value : updated.relativeName;
        if (relType === 'પિતાનું નામ') {
          updated.fatherName = relName;
          updated.husbandName = '';
        } else if (relType === 'પતિનું નામ') {
          updated.husbandName = relName;
          updated.fatherName = '';
        } else if (relType === 'માતાનું નામ') {
          updated.motherName = relName;
        } else if (relType === 'અન્ય સંબંધી') {
          updated.otherRelative = relName;
        }
      }
      return updated;
    });
  };

  const handleSave = () => {
    const cleaned = sanitizeVoterRecord({
      ...formData,
      isManuallyEdited: true,
      updatedAt: Date.now(),
    });
    onSave(cleaned);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/50 text-indigo-200">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base font-['Noto_Sans_Gujarati']">
                મતદાર વિગત સુધારો (Manual Correction)
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {formData.pdfFileName} • પેજ નં: {formData.pdfPageNo} • ક્રમ: {formData.serialNo}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto font-['Noto_Sans_Gujarati'] text-xs">
          {/* Status Bar */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <span className="font-semibold text-slate-700">ચકાસણી સ્થિતિ (Verification Status):</span>
            <div className="flex items-center gap-2">
              {(['ચકાસવાનું', 'ચકાસેલ', 'ચકાસણી જરૂરી'] as VerificationStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleChange('verifiedStatus', st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    formData.verifiedStatus === st
                      ? st === 'ચકાસેલ'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : st === 'ચકાસણી જરૂરી'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'bg-amber-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. ક્રમ નંબર */}
            <div>
              <label className="block text-slate-600 font-semibold mb-1">૧. ક્રમ નંબર (Serial No)</label>
              <input
                type="text"
                value={formData.serialNo}
                onChange={(e) => handleChange('serialNo', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* 2. ઓળખપત્ર નંબર (EPIC) */}
            <div>
              <label className="block text-slate-600 font-semibold mb-1">૨. ઓળખપત્ર નંબર (EPIC No)</label>
              <input
                type="text"
                value={formData.epicNo}
                onChange={(e) => handleChange('epicNo', e.target.value)}
                placeholder="દા.ત. WMI1002341"
                className="w-full px-3 py-2 font-mono font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-indigo-900"
              />
            </div>

            {/* 3. મતદારનું નામ */}
            <div className="sm:col-span-2">
              <label className="block text-slate-600 font-semibold mb-1">૩. મતદારનું નામ (Voter Full Name in Gujarati)</label>
              <input
                type="text"
                value={formData.voterName}
                onChange={(e) => handleChange('voterName', e.target.value)}
                className="w-full px-3 py-2 font-semibold text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* 4. સંબંધનો પ્રકાર */}
            <div>
              <label className="block text-slate-600 font-semibold mb-1">૪. સંબંધનો પ્રકાર</label>
              <select
                value={formData.relationType}
                onChange={(e) => handleChange('relationType', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="પિતાનું નામ">પિતાનું નામ</option>
                <option value="પતિનું નામ">પતિનું નામ</option>
                <option value="માતાનું નામ">માતાનું નામ</option>
                <option value="અન્ય સંબંધી">અન્ય સંબંધી</option>
              </select>
            </div>

            {/* 5. સંબંધીનું નામ */}
            <div>
              <label className="block text-slate-600 font-semibold mb-1">૫. સંબંધીનું નામ</label>
              <input
                type="text"
                value={formData.relativeName}
                onChange={(e) => handleChange('relativeName', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* 10. ઘર / મકાન નંબર */}
            <div>
              <label className="block text-slate-600 font-semibold mb-1">૧૦. ઘર / મકાન નંબર</label>
              <input
                type="text"
                value={formData.houseNo}
                onChange={(e) => handleChange('houseNo', e.target.value)}
                placeholder="દા.ત. 12/A, S.602, ધીરજનગર શેરી નં. 1"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* 11. ઉંમર */}
            <div>
              <label className="block text-slate-600 font-semibold mb-1">૧૧. ઉંમર (Age)</label>
              <input
                type="text"
                value={formData.age}
                onChange={(e) => handleChange('age', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* 12. જાતિ */}
            <div>
              <label className="block text-slate-600 font-semibold mb-1">૧૨. જાતિ (Gender)</label>
              <select
                value={formData.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="પુરુષ">પુરુષ</option>
                <option value="સ્ત્રી">સ્ત્રી</option>
                <option value="અન્ય">અન્ય</option>
              </select>
            </div>

            {/* 13. વિભાગ નંબર */}
            <div>
              <label className="block text-slate-600 font-semibold mb-1">૧૩. વિભાગ નંબર</label>
              <input
                type="text"
                value={formData.vibhagNo}
                onChange={(e) => handleChange('vibhagNo', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* 14. વિભાગનું નામ */}
            <div>
              <label className="block text-slate-600 font-semibold mb-1">૧૪. વિભાગનું નામ</label>
              <input
                type="text"
                value={formData.vibhagName}
                onChange={(e) => handleChange('vibhagName', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* 15. વોર્ડ નંબર */}
            <div>
              <label className="block text-slate-600 font-semibold mb-1">૧૫. વોર્ડ નંબર (Ward No)</label>
              <input
                type="text"
                value={formData.wardNo}
                onChange={(e) => handleChange('wardNo', e.target.value)}
                placeholder="માત્ર જો સ્પષ્ટ હોય"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* 16. ભાગ નંબર */}
            <div>
              <label className="block text-slate-600 font-semibold mb-1">૧૬. ભાગ નંબર (Bhag No)</label>
              <input
                type="text"
                value={formData.bhagNo}
                onChange={(e) => handleChange('bhagNo', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* 20. સ્થિતિ / ચેતવણીઓ */}
            <div className="sm:col-span-2">
              <label className="block text-slate-600 font-semibold mb-1">૨૦. સ્થિતિ / ચેતવણીઓ (Warnings)</label>
              <input
                type="text"
                value={formData.warnings}
                onChange={(e) => handleChange('warnings', e.target.value)}
                placeholder="ચેતવણીઓ ગુજરાતીમાં"
                className="w-full px-3 py-2 border border-amber-300 bg-amber-50/50 rounded-xl text-amber-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            {/* 21. પૂર્ણ સરનામું */}
            <div className="sm:col-span-2">
              <label className="block text-slate-600 font-semibold mb-1">૨૧. પૂર્ણ સરનામું (Full Address)</label>
              <input
                type="text"
                value={formData.fullAddress || ''}
                onChange={(e) => handleChange('fullAddress', e.target.value)}
                placeholder="દા.ત. 12/A, ૧-સ્લમ ક્વાર્ટર્સ શેરી-૧, રૈયાધાર, રૈયા રોડ, રૈયા-40, રાજકોટ"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 font-medium text-xs transition-colors"
          >
            રદ કરો (Cancel)
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all font-['Noto_Sans_Gujarati']"
          >
            <Save className="w-4 h-4" />
            <span>સુધારો સેવ કરો (Save Changes)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
