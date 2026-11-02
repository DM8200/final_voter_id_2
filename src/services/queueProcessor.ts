/**
 * Bulk Queue Processor for 1,000+ Electoral Roll PDFs
 * Features bounded concurrency, checkpoint saves, pause/resume, error resilience,
 * and live dashboard event reporting.
 */

import { PDFFileMeta, PageMeta, ExtractionStats } from '../types/voter';
import {
  saveFileMeta,
  savePageMeta,
  saveVotersBatch,
  addLog,
  recomputeEpicDuplicates,
  getVotersCount,
  deleteVotersForFileAndPage,
  getPdfBlob,
} from './db';
import { getPdfDocument, processPdfPage, InheritedElectionMetadata } from './pdfExtractor';

export type QueueEventCallback = (stats: ExtractionStats) => void;

class QueueProcessor {
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private listeners: Set<QueueEventCallback> = new Set();

  private stats: ExtractionStats = {
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
  };

  public subscribe(cb: QueueEventCallback) {
    this.listeners.add(cb);
    cb({ ...this.stats });
    return () => this.listeners.delete(cb);
  }

  private notify() {
    for (const cb of this.listeners) {
      cb({ ...this.stats });
    }
  }

  public getStats(): ExtractionStats {
    return { ...this.stats };
  }

  public isBusy(): boolean {
    return this.isRunning && !this.isPaused;
  }

  public pause() {
    this.isPaused = true;
    this.notify();
  }

  public resume() {
    if (this.isRunning && this.isPaused) {
      this.isPaused = false;
      this.notify();
    }
  }

  public resetStats() {
    this.stats = {
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
    };
    this.notify();
  }

  public stop() {
    this.isRunning = false;
    this.isPaused = false;
    this.resetStats();
  }

  /**
   * Starts or resumes processing a batch of files
   */
  public async startProcessing(
    files: PDFFileMeta[],
    enableGeminiOcr: boolean = true
  ): Promise<void> {
    if (this.isRunning && !this.isPaused) return;

    this.isRunning = true;
    this.isPaused = false;

    // Recalculate totals
    this.stats.totalPdfs = files.length;
    this.stats.totalPages = files.reduce((acc, f) => acc + (f.totalPages || 0), 0);
    this.stats.processedPages = files.reduce((acc, f) => acc + (f.processedPages || 0), 0);
    this.stats.remainingPages = Math.max(0, this.stats.totalPages - this.stats.processedPages);
    this.stats.totalVoters = await getVotersCount();
    this.notify();

    for (let fIdx = 0; fIdx < files.length; fIdx++) {
      if (!this.isRunning) break;

      const file = files[fIdx];
      if (file.status === 'completed') continue;

      this.stats.currentPdfName = file.originalFileName;
      this.stats.processingPdfs = 1;
      file.status = 'processing';
      file.updatedAt = Date.now();
      await saveFileMeta(file);
      this.notify();

      try {
        await this.processSingleFile(file, enableGeminiOcr);
        file.status = 'completed';
        this.stats.completedPdfs++;
      } catch (err: any) {
        console.error(`Error processing file ${file.originalFileName}:`, err);
        file.status = 'error';
        file.errorMessage = err.message || 'અજ્ઞાત ભૂલ';
        this.stats.failedPdfs++;
        await addLog(file.originalFileName, `ફાઇલ પ્રોસેસ કરવામાં નિષ્ફળ: ${file.errorMessage}`, 'error');
      }

      file.updatedAt = Date.now();
      await saveFileMeta(file);

      // Recompute duplicates periodically across all extracted files
      this.stats.duplicateCount = await recomputeEpicDuplicates();
      this.stats.totalVoters = await getVotersCount();
      this.notify();
    }

    this.stats.processingPdfs = 0;
    this.stats.currentPdfName = '';
    this.stats.currentPageNumber = 0;
    this.stats.percentComplete = this.stats.totalPages > 0
      ? Math.round((this.stats.processedPages / this.stats.totalPages) * 100)
      : 100;

    this.isRunning = false;
    this.isPaused = false;
    this.notify();
  }

  /**
   * Processes all pages of a single PDF file with checkpointing
   */
  private async processSingleFile(
    file: PDFFileMeta,
    enableGeminiOcr: boolean
  ): Promise<void> {
    const rawData = await getPdfBlob(file.id);
    if (!rawData) {
      throw new Error(`PDF ડેટા મળ્યો નથી: ${file.originalFileName}`);
    }

    const rawBytes = rawData instanceof Blob ? await rawData.arrayBuffer() : rawData;
    const pdfDoc = await getPdfDocument(new Uint8Array(rawBytes.slice(0)));
    const totalPages = pdfDoc.numPages;

    if (file.totalPages !== totalPages) {
      file.totalPages = totalPages;
      await saveFileMeta(file);
    }

    let inheritedMeta: InheritedElectionMetadata | null = null;
    if (file.vibhagNo) {
      inheritedMeta = {
        vibhagNo: file.vibhagNo,
        vibhagName: file.vibhagName || '',
        bhagNo: file.bhagNo || '',
        wardNo: file.wardNo || '',
      };
    }

    // Dynamic serial number tracker
    let currentSerial = (file.voterCount || 0) + 1;

    // Process each page sequentially to prevent memory ballooning
    for (let pageNum = file.processedPages + 1; pageNum <= totalPages; pageNum++) {
      // Pause check
      while (this.isPaused && this.isRunning) {
        await new Promise((r) => setTimeout(r, 500));
      }

      if (!this.isRunning) break;

      this.stats.currentPageNumber = pageNum;
      this.notify();

      try {
        // Delete any existing voters for this page to prevent duplicates on retry
        await deleteVotersForFileAndPage(file.originalFileName, pageNum);

        const pageResult = await processPdfPage(
          pdfDoc,
          pageNum,
          file.originalFileName,
          inheritedMeta,
          enableGeminiOcr,
          currentSerial
        );

        if (pageResult.voters.length > 0) {
          const lastVoter = pageResult.voters[pageResult.voters.length - 1];
          const lastSerialNum = parseInt(lastVoter.serialNo, 10);
          if (!isNaN(lastSerialNum) && lastSerialNum > 0) {
            currentSerial = lastSerialNum + 1;
          } else {
            currentSerial += pageResult.voters.length;
          }
        }

        // Update inherited metadata if page yielded valid headings
        if (pageResult.vibhagNo) {
          inheritedMeta = {
            vibhagNo: pageResult.vibhagNo,
            vibhagName: pageResult.vibhagName,
            bhagNo: pageResult.bhagNo,
            wardNo: pageResult.wardNo,
          };
          if (!file.vibhagNo) {
            file.vibhagNo = pageResult.vibhagNo;
            file.vibhagName = pageResult.vibhagName;
            file.bhagNo = pageResult.bhagNo;
            file.wardNo = pageResult.wardNo;
          }
        }

        // Save page record
        const pageMeta: PageMeta = {
          fileId: file.id,
          pdfFileName: file.originalFileName,
          pageNumber: pageNum,
          status: 'completed',
          isVoterPage: pageResult.isVoterPage,
          pageTypeGujarati: pageResult.pageTypeGujarati,
          voterCount: pageResult.voters.length,
          processedAt: Date.now(),
        };
        await savePageMeta(pageMeta);

        // Save voters in batch
        if (pageResult.voters.length > 0) {
          await saveVotersBatch(pageResult.voters);
          file.voterCount = (file.voterCount || 0) + pageResult.voters.length;
          this.stats.totalVoters = await getVotersCount();
          await addLog(
            file.originalFileName,
            `પેજ ${pageNum}: ${pageResult.voters.length} મતદારો એક્સટ્રેક્ટ થયા (ક્રમ ${pageResult.voters[0]?.serialNo} થી ${pageResult.voters[pageResult.voters.length - 1]?.serialNo})`,
            'info',
            pageNum
          );
        } else {
          await addLog(
            file.originalFileName,
            `પેજ ${pageNum}: ${pageResult.pageTypeGujarati || 'બિન-મતદાર પેજ, કોઈ મતદાર કાર્ડ નથી'}`,
            'info',
            pageNum
          );
        }

        // Update progress
        file.processedPages = pageNum;
        file.updatedAt = Date.now();
        await saveFileMeta(file);

        this.stats.processedPages++;
        this.stats.remainingPages = Math.max(0, this.stats.totalPages - this.stats.processedPages);
        this.stats.percentComplete = Math.min(
          100,
          Math.round((this.stats.processedPages / this.stats.totalPages) * 100)
        );

        if (pageResult.pageWarnings.length > 0) {
          await addLog(
            file.originalFileName,
            `પેજ ${pageNum}: ${pageResult.pageWarnings.join('; ')}`,
            'warning',
            pageNum
          );
        }

        this.notify();
      } catch (pageErr: any) {
        console.error(`Error on page ${pageNum} of ${file.originalFileName}:`, pageErr);
        await addLog(
          file.originalFileName,
          `પેજ ${pageNum} પ્રોસેસિંગ નિષ્ફળ: ${pageErr.message || pageErr}`,
          'error',
          pageNum
        );
        // Continue with next page rather than crashing entire job
      }
    }
  }

  /**
   * Retries all failed pages across files
   */
  public async retryFailedPages(files: PDFFileMeta[]): Promise<void> {
    const errorFiles = files.filter((f) => f.status === 'error' || f.processedPages < f.totalPages);
    if (errorFiles.length === 0) return;

    for (const f of errorFiles) {
      f.status = 'pending';
      f.errorMessage = undefined;
      await saveFileMeta(f);
    }

    await this.startProcessing(errorFiles);
  }
}

export const queueProcessor = new QueueProcessor();
