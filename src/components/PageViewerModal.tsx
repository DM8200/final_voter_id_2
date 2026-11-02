import React, { useEffect, useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, FileText, CheckCircle2 } from 'lucide-react';
import { VoterRecord } from '../types/voter';
import { getPdfBlob, getAllFiles } from '../services/db';
import { getPdfDocument, renderPageToCanvas } from '../services/pdfExtractor';

interface PageViewerModalProps {
  voter: VoterRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PageViewerModal: React.FC<PageViewerModalProps> = ({
  voter,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !voter) return null;

  const [pageImageUrl, setPageImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoomScale, setZoomScale] = useState(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadPage() {
      if (!voter) return;
      setLoading(true);
      setErrorMessage(null);

      try {
        const files = await getAllFiles();
        const fileMeta = files.find((f) => f.originalFileName === voter.pdfFileName);

        if (!fileMeta) {
          throw new Error('મૂળ PDF ફાઇલ મળતી નથી');
        }

        const rawData = await getPdfBlob(fileMeta.id);
        if (!rawData) {
          throw new Error('PDF બાઈનરી ડેટા સંગ્રહિત નથી');
        }

        const rawBytes = rawData instanceof Blob ? await rawData.arrayBuffer() : rawData;
        const pdfDoc = await getPdfDocument(new Uint8Array(rawBytes.slice(0)));
        const { dataUrl } = await renderPageToCanvas(pdfDoc, voter.pdfPageNo, 2.0);

        if (!isCancelled) {
          setPageImageUrl(dataUrl);
        }
      } catch (err: any) {
        console.error('Failed to render page preview:', err);
        if (!isCancelled) {
          setErrorMessage(err.message || 'પેજ લોડ કરવામાં ભૂલ');
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    loadPage();

    return () => {
      isCancelled = true;
    };
  }, [voter]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-4 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-5xl w-full h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/50 text-indigo-200">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm font-['Noto_Sans_Gujarati']">
                મૂળ PDF પેજ પૂર્વાવલોકન (Original PDF Page Viewer)
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {voter.pdfFileName} • પેજ {voter.pdfPageNo} • મતદાર ક્રમ: {voter.serialNo} ({voter.voterName})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoomScale((s) => Math.max(0.6, s - 0.2))}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-slate-300 px-1">{Math.round(zoomScale * 100)}%</span>
            <button
              onClick={() => setZoomScale((s) => Math.min(2.5, s + 0.2))}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Viewer */}
        <div className="flex-1 overflow-auto bg-slate-900/95 p-6 flex items-center justify-center relative">
          {loading ? (
            <div className="text-center text-slate-300">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-['Noto_Sans_Gujarati']">મૂળ PDF પેજ રેન્ડર થઈ રહ્યું છે...</p>
            </div>
          ) : errorMessage ? (
            <div className="text-center text-red-300 p-6 bg-red-950/40 rounded-2xl border border-red-800">
              <p className="text-xs font-['Noto_Sans_Gujarati']">{errorMessage}</p>
            </div>
          ) : pageImageUrl ? (
            <div
              className="transition-transform duration-200 shadow-2xl rounded-lg overflow-hidden border border-slate-700 bg-white"
              style={{ transform: `scale(${zoomScale})`, transformOrigin: 'center center' }}
            >
              <img src={pageImageUrl} alt="Original PDF Page" className="max-w-none w-[700px] h-auto" />
            </div>
          ) : null}
        </div>

        {/* Footer with Card Verification info */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-700 font-['Noto_Sans_Gujarati'] shrink-0">
          <div>
            ચકાસણી કાર્ડ: <strong className="text-indigo-900">ક્રમ {voter.serialNo} - {voter.voterName}</strong> | EPIC: <strong>{voter.epicNo || 'N/A'}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
          >
            બંધ કરો
          </button>
        </div>
      </div>
    </div>
  );
};
