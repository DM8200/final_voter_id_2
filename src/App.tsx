import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { UploadSection } from './components/UploadSection';
import { DashboardStats } from './components/DashboardStats';
import { MasterTable } from './components/MasterTable';
import { ExportSection } from './components/ExportSection';
import { ManualEditModal } from './components/ManualEditModal';
import { PageViewerModal } from './components/PageViewerModal';
import { ProcessingLogs } from './components/ProcessingLogs';
import {
  getAllFiles,
  getAllVoters,
  getAllLogs,
  updateVoter,
  clearAllProjectData,
} from './services/db';
import { queueProcessor } from './services/queueProcessor';
import { PDFFileMeta, VoterRecord, ProcessingLog, ExtractionStats } from './types/voter';
import { AlertCircle, Trash2, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [files, setFiles] = useState<PDFFileMeta[]>([]);
  const [voters, setVoters] = useState<VoterRecord[]>([]);
  const [logs, setLogs] = useState<ProcessingLog[]>([]);
  const [stats, setStats] = useState<ExtractionStats>(queueProcessor.getStats());

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [enableGemini, setEnableGemini] = useState(true);
  const [geminiReady, setGeminiReady] = useState(true);

  // Modals state
  const [editingVoter, setEditingVoter] = useState<VoterRecord | null>(null);
  const [viewingPageVoter, setViewingPageVoter] = useState<VoterRecord | null>(null);
  const [showNewProjectConfirm, setShowNewProjectConfirm] = useState(false);

  // Refresh data from IndexedDB
  const reloadData = useCallback(async () => {
    try {
      const [f, v, l] = await Promise.all([
        getAllFiles(),
        getAllVoters(),
        getAllLogs(),
      ]);
      setFiles(f);
      setVoters(v);
      setLogs(l);
    } catch (err) {
      console.error('Failed to load database state:', err);
    }
  }, []);

  // Initial load & health check
  useEffect(() => {
    reloadData();

    // Check backend health
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.status === 'ok') {
          setGeminiReady(data.geminiConfigured);
        }
      })
      .catch((err) => console.warn('Backend health check error:', err));

    // Subscribe to queue changes
    const unsubscribe = queueProcessor.subscribe((newStats) => {
      setStats(newStats);
      setIsProcessing(queueProcessor.isBusy());
    });

    return () => {
      unsubscribe();
    };
  }, [reloadData]);

  // Periodic voter data refresh when processing is active
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isProcessing) {
      interval = setInterval(() => {
        reloadData();
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isProcessing, reloadData]);

  // Queue Controls
  const handleStartProcessing = async () => {
    setIsProcessing(true);
    setIsPaused(false);
    await queueProcessor.startProcessing(files, enableGemini);
    await reloadData();
    setIsProcessing(false);
  };

  const handlePauseProcessing = () => {
    queueProcessor.pause();
    setIsPaused(true);
  };

  const handleResumeProcessing = () => {
    queueProcessor.resume();
    setIsPaused(false);
  };

  const handleRetryFailed = async () => {
    setIsProcessing(true);
    setIsPaused(false);
    await queueProcessor.retryFailedPages(files);
    await reloadData();
    setIsProcessing(false);
  };

  // Voter update handler (from table or modal)
  const handleUpdateVoter = async (updated: VoterRecord) => {
    await updateVoter(updated);
    setVoters((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
  };

  // Clear Project Data & reset all states to fresh
  const handleConfirmNewProject = async () => {
    queueProcessor.stop();
    await clearAllProjectData();
    setShowNewProjectConfirm(false);
    setFiles([]);
    setVoters([]);
    setLogs([]);
    setStats({
      totalPdfs: 0,
      completedPdfs: 0,
      processingPdfs: 0,
      failedPdfs: 0,
      totalPages: 0,
      processedPages: 0,
      remainingPages: 0,
      totalVoters: 0,
      reviewRequiredCount: 0,
      duplicateCount: 0,
      currentPdfName: '',
      currentPageNumber: 0,
      percentComplete: 0,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-16">
      {/* Top Application Header */}
      <Header
        totalVoters={voters.length}
        totalFiles={files.length}
        onNewProject={() => setShowNewProjectConfirm(true)}
        isProcessing={isProcessing}
        geminiReady={geminiReady}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Step 1: Upload PDFs & ZIP */}
        <UploadSection
          files={files}
          onFilesUpdated={reloadData}
          isProcessing={isProcessing}
          onStartProcessing={handleStartProcessing}
        />

        {/* Live Processing Queue Dashboard (visible once files exist) */}
        {files.length > 0 && (
          <DashboardStats
            stats={stats}
            isProcessing={isProcessing}
            isPaused={isPaused}
            onStart={handleStartProcessing}
            onPause={handlePauseProcessing}
            onResume={handleResumeProcessing}
            onRetryFailed={handleRetryFailed}
            enableGemini={enableGemini}
            setEnableGemini={setEnableGemini}
          />
        )}

        {/* Step 2: Consolidated Master Excel Download (Prominent) */}
        {voters.length > 0 && (
          <ExportSection
            voters={voters}
            logs={logs}
            isProcessing={isProcessing}
          />
        )}

        {/* Step 3: Master Data Preview with Search, Filters and Inline Editing */}
        {voters.length > 0 && (
          <MasterTable
            voters={voters}
            onUpdateVoter={handleUpdateVoter}
            onEditVoter={(v) => setEditingVoter(v)}
            onViewPage={(v) => setViewingPageVoter(v)}
          />
        )}

        {/* Processing Logs & Diagnostics */}
        <ProcessingLogs logs={logs} />
      </main>

      {/* Manual Edit Modal */}
      <ManualEditModal
        voter={editingVoter}
        isOpen={!!editingVoter}
        onClose={() => setEditingVoter(null)}
        onSave={handleUpdateVoter}
      />

      {/* Page Viewer Modal */}
      <PageViewerModal
        voter={viewingPageVoter}
        isOpen={!!viewingPageVoter}
        onClose={() => setViewingPageVoter(null)}
      />

      {/* Confirmation Modal for New Project */}
      {showNewProjectConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 font-['Noto_Sans_Gujarati']">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-800">નવો પ્રોજેક્ટ શરૂ કરવો છે?</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              આ ક્રિયાથી હાલની બધી જ અપલોડ કરેલ PDF ફાઇલો, પ્રોસેસ થયેલ મતદારો અને લોગ્સ કાયમ માટે સાફ થઈ જશે. શું તમે ખરેખર આગળ વધવા માંગો છો?
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowNewProjectConfirm(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                રદ કરો
              </button>
              <button
                onClick={handleConfirmNewProject}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20"
              >
                હા, બધો જૂનો ડેટા સાફ કરો
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
