import React, { useRef, useState } from 'react';
import { Upload, FileUp, FolderUp, Archive, FileText, Trash2, CheckCircle2, AlertCircle, Sparkles, Plus } from 'lucide-react';
import JSZip from 'jszip';
import { PDFFileMeta } from '../types/voter';
import { saveFileMeta, savePdfBlob } from '../services/db';
import { getPdfDocument } from '../services/pdfExtractor';
import { generateAcceptanceSamplePdf, generateSecondSamplePdf } from '../services/samplePdfGenerator';

interface UploadSectionProps {
  files: PDFFileMeta[];
  onFilesUpdated: () => void;
  isProcessing: boolean;
  onStartProcessing: () => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  files,
  onFilesUpdated,
  isProcessing,
  onStartProcessing,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  // Process raw file objects (PDFs or ZIP)
  const processIncomingFiles = async (fileList: File[]) => {
    setLoadingFiles(true);
    setUploadMessage('ફાઇલો વાંચી રહ્યા છીએ...');
    let addedCount = 0;
    let skippedCount = 0;

    for (const file of fileList) {
      try {
        // If file is a ZIP archive, unpack it
        if (file.name.toLowerCase().endsWith('.zip') || file.type.includes('zip')) {
          setUploadMessage(`ZIP ફાઇલ અનપેક કરી રહ્યા છીએ: ${file.name}`);
          const zip = new JSZip();
          const zipData = await zip.loadAsync(file);

          for (const relativePath of Object.keys(zipData.files)) {
            const zipEntry = zipData.files[relativePath];
            if (!zipEntry.dir && zipEntry.name.toLowerCase().endsWith('.pdf') && !zipEntry.name.includes('__MACOSX')) {
              const arrayBuffer = await zipEntry.async('arraybuffer');
              const cleanFileName = zipEntry.name.split('/').pop() || zipEntry.name;
              await registerPdfFile(cleanFileName, arrayBuffer);
              addedCount++;
            }
          }
          continue;
        }

        // Regular PDF file
        if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
          const arrayBuffer = await file.arrayBuffer();
          await registerPdfFile(file.name, arrayBuffer);
          addedCount++;
        } else {
          skippedCount++;
        }
      } catch (err) {
        console.error(`Failed to load file ${file.name}:`, err);
      }
    }

    setLoadingFiles(false);
    setUploadMessage(
      addedCount > 0
        ? `સફળતાપૂર્વક ${addedCount} PDF ફાઇલ ઉમેરવામાં આવી${skippedCount > 0 ? ` (${skippedCount} બિન-PDF ફાઇલ અવગણવામાં આવી)` : ''}`
        : 'કોઈ માન્ય PDF ફાઇલ મળી નથી'
    );
    onFilesUpdated();
    setTimeout(() => setUploadMessage(null), 4000);
  };

  // Register single PDF file in IndexedDB safely without detached ArrayBuffer
  const registerPdfFile = async (fileName: string, buffer: ArrayBuffer) => {
    // Create Blob immediately - Blobs in IndexedDB are never detached
    const blob = new Blob([buffer], { type: 'application/pdf' });
    const fileSize = buffer.byteLength || blob.size;
    const fileId = `pdf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Store in IndexedDB first
    await savePdfBlob(fileId, blob);

    // Inspect total pages using a cloned copy so PDF.js worker doesn't detach anything
    let totalPages = 1;
    try {
      const inspectCopy = new Uint8Array(buffer.slice(0));
      const pdf = await getPdfDocument(inspectCopy);
      totalPages = pdf.numPages;
    } catch (e) {
      console.warn('PDF inspection fallback:', e);
    }

    const fileMeta: PDFFileMeta = {
      id: fileId,
      originalFileName: fileName,
      fileSize: fileSize,
      totalPages: totalPages,
      processedPages: 0,
      status: 'pending',
      voterCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await saveFileMeta(fileMeta);
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processIncomingFiles(Array.from(e.dataTransfer.files));
    }
  };

  // Load Acceptance Test Sample PDF
  const handleLoadSamplePdf = async () => {
    setLoadingFiles(true);
    setUploadMessage('અધિકૃત નમૂના PDF (36 પેજ - 69 રાજકોટ પશ્ચિમ) જનરેટ કરી રહ્યા છીએ...');

    try {
      const samplePdfBytes = await generateAcceptanceSamplePdf();
      const safeBuffer = samplePdfBytes.buffer.slice(
        samplePdfBytes.byteOffset,
        samplePdfBytes.byteOffset + samplePdfBytes.byteLength
      ) as ArrayBuffer;
      await registerPdfFile('2026-EROLLGEN-S06-69-SIR-FinalRoll-Revision1-GUJ-1-WI.pdf', safeBuffer);

      // Also add second sample for testing multi-pdf consolidation
      const secondSampleBytes = await generateSecondSamplePdf();
      const secondSafeBuffer = secondSampleBytes.buffer.slice(
        secondSampleBytes.byteOffset,
        secondSampleBytes.byteOffset + secondSampleBytes.byteLength
      ) as ArrayBuffer;
      await registerPdfFile('2026-EROLLGEN-S06-68-SIR-FinalRoll-Revision1-GUJ-2-WI.pdf', secondSafeBuffer);

      setUploadMessage('બંને નમૂના PDF ફાઇલો સફળતાપૂર્વક લોડ થઈ ગઈ! હવે તમે "પ્રોસેસિંગ શરૂ કરો" દબાવી શકો છો.');
      onFilesUpdated();
    } catch (err: any) {
      console.error('Error generating sample PDF:', err);
      setUploadMessage('નમૂના PDF જનરેટ કરવામાં સમસ્યા આવી');
    } finally {
      setLoadingFiles(false);
      setTimeout(() => setUploadMessage(null), 5000);
    }
  };

  // Load User's Uploaded Demo PDF (WI-8: 585 voters, 27 pages)
  const handleLoadDemoPdf8 = async () => {
    setLoadingFiles(true);
    setUploadMessage('ડેમો PDF (2026-EROLLGEN-S06-69-SIR-FinalRoll-Revision1-GUJ-8-WI.pdf - 585 મતદારો) લોડ કરી રહ્યા છીએ...');

    try {
      const res = await fetch('/assets/aistudio/2026-EROLLGEN-S06-69-SIR-FinalRoll-Revision1-GUJ-8-WI_11e8c3ca.pdf');
      if (!res.ok) throw new Error('Demo PDF file not found');
      const blob = await res.blob();
      const arrayBuffer = await blob.arrayBuffer();
      await registerPdfFile('2026-EROLLGEN-S06-69-SIR-FinalRoll-Revision1-GUJ-8-WI.pdf', arrayBuffer);

      setUploadMessage('ડેમો PDF (WI-8) સફળતાપૂર્વક ઉમેરાઈ ગઈ! હવે "પ્રોસેસિંગ શરૂ કરો" દબાવો.');
      onFilesUpdated();
    } catch (err: any) {
      console.error('Error loading demo PDF WI-8:', err);
      setUploadMessage('ડેમો PDF લોડ કરવામાં સમસ્યા આવી');
    } finally {
      setLoadingFiles(false);
      setTimeout(() => setUploadMessage(null), 5000);
    }
  };

  // Load User's Uploaded Demo PDF (WI-5)
  const handleLoadDemoPdf = async () => {
    setLoadingFiles(true);
    setUploadMessage('ડેમો PDF (2026-EROLLGEN-S06-69-SIR-FinalRoll-Revision1-GUJ-5-WI.pdf) લોડ કરી રહ્યા છીએ...');

    try {
      const res = await fetch('/assets/aistudio/2026-EROLLGEN-S06-69-SIR-FinalRoll-Revision1-GUJ-5-WI_fac08fbc.pdf');
      if (!res.ok) throw new Error('Demo PDF file not found');
      const blob = await res.blob();
      const arrayBuffer = await blob.arrayBuffer();
      await registerPdfFile('2026-EROLLGEN-S06-69-SIR-FinalRoll-Revision1-GUJ-5-WI.pdf', arrayBuffer);

      setUploadMessage('ડેમો PDF ફાઇલ સફળતાપૂર્વક ઉમેરાઈ ગઈ! હવે "પ્રોસેસિંગ શરૂ કરો" દબાવો.');
      onFilesUpdated();
    } catch (err: any) {
      console.error('Error loading demo PDF:', err);
      setUploadMessage('ડેમો PDF લોડ કરવામાં સમસ્યા આવી');
    } finally {
      setLoadingFiles(false);
      setTimeout(() => setUploadMessage(null), 5000);
    }
  };

  const pendingFiles = files.filter((f) => f.status === 'pending');
  const completedFiles = files.filter((f) => f.status === 'completed');

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-slate-100 gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 font-['Noto_Sans_Gujarati']">
            <Upload className="w-5 h-5 text-indigo-600" />
            પગલું ૧: મતદાર યાદી PDF ફાઇલો અપલોડ કરો
          </h2>
          <p className="text-sm text-slate-500 font-['Noto_Sans_Gujarati']">
            એકસાથે ૧,૦૦૦+ PDF અથવા ZIP આર્કાઇવ પસંદ કરો • બધી ફાઇલોનો ડેટા એક જ માસ્ટર એક્સેલમાં જોડાશે
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Load User's Latest Demo PDF WI-8 Button */}
          <button
            onClick={handleLoadDemoPdf8}
            disabled={loadingFiles || isProcessing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-all hover:shadow hover:scale-[1.01] active:scale-[0.99] font-['Noto_Sans_Gujarati']"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>ડેમો PDF લોડ કરો (WI-8 : 585 મતદારો)</span>
          </button>

          {/* Load User's WI-5 Demo PDF Button */}
          <button
            onClick={handleLoadDemoPdf}
            disabled={loadingFiles || isProcessing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-semibold text-xs shadow-sm transition-all hover:shadow hover:scale-[1.01] active:scale-[0.99] font-['Noto_Sans_Gujarati']"
          >
            <span>ડેમો WI-5</span>
          </button>

          {/* 1-Click Load Sample Test Button */}
          <button
            onClick={handleLoadSamplePdf}
            disabled={loadingFiles || isProcessing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold text-xs shadow-sm transition-all hover:shadow hover:scale-[1.01] active:scale-[0.99] font-['Noto_Sans_Gujarati']"
          >
            <span>નમૂના ફાઇલ (36 પેજ)</span>
          </button>
        </div>
      </div>

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept=".pdf"
        className="hidden"
        onChange={(e) => e.target.files && processIncomingFiles(Array.from(e.target.files))}
      />
      <input
        type="file"
        ref={folderInputRef}
        // @ts-ignore
        webkitdirectory="true"
        // @ts-ignore
        directory="true"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && processIncomingFiles(Array.from(e.target.files))}
      />
      <input
        type="file"
        ref={zipInputRef}
        accept=".zip,application/zip"
        className="hidden"
        onChange={(e) => e.target.files && processIncomingFiles(Array.from(e.target.files))}
      />

      {/* Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`mt-4 border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/60 scale-[1.005]'
            : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50'
        }`}
      >
        <div className="max-w-md mx-auto flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3">
            <FileUp className="w-7 h-7" />
          </div>

          <p className="text-base font-semibold text-slate-800 font-['Noto_Sans_Gujarati']">
            અહીં PDF ફાઇલો ડ્રેગ અને ડ્રોપ કરો
          </p>
          <p className="text-xs text-slate-500 mt-1 mb-5 font-['Noto_Sans_Gujarati']">
            ૧૦૦૦+ મતદાર યાદી ફાઇલો, સિંગલ PDFs અથવા ZIP ફોલ્ડર પસંદ કરો
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loadingFiles || isProcessing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-sm transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>PDF ફાઇલો પસંદ કરો</span>
            </button>

            <button
              type="button"
              onClick={() => zipInputRef.current?.click()}
              disabled={loadingFiles || isProcessing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs shadow-sm transition-all"
            >
              <Archive className="w-4 h-4" />
              <span>ZIP આર્કાઇવ અપલોડ કરો</span>
            </button>

            <button
              type="button"
              onClick={() => folderInputRef.current?.click()}
              disabled={loadingFiles || isProcessing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-medium text-xs shadow-sm transition-all"
            >
              <FolderUp className="w-4 h-4" />
              <span>આખું ફોલ્ડર પસંદ કરો</span>
            </button>
          </div>
        </div>
      </div>

      {/* Upload Notification Message */}
      {uploadMessage && (
        <div className="mt-4 p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs flex items-center gap-2 font-['Noto_Sans_Gujarati'] animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>{uploadMessage}</span>
        </div>
      )}

      {/* Uploaded Files Summary Bar */}
      {files.length > 0 && (
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-100/70 p-3.5 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-700 font-['Noto_Sans_Gujarati']">
                કુલ પસંદ કરેલ ફાઇલો: <strong className="text-indigo-600">{files.length}</strong>
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-600 font-['Noto_Sans_Gujarati']">
                કુલ પેજ: <strong>{files.reduce((a, b) => a + (b.totalPages || 0), 0)}</strong>
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-600 font-['Noto_Sans_Gujarati']">
                પૂર્ણ ફાઇલો: <strong className="text-emerald-600">{completedFiles.length}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {pendingFiles.length > 0 && !isProcessing && (
                <button
                  onClick={onStartProcessing}
                  className="w-full sm:w-auto px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 font-['Noto_Sans_Gujarati']"
                >
                  <span>પ્રોસેસિંગ શરૂ કરો ({pendingFiles.length} ફાઇલો)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
