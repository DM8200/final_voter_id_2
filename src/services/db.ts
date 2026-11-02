/**
 * IndexedDB Persistence Service for Gujarati Electoral Roll Processor
 * Supports 1,000+ files and 50,000+ records safely without exceeding RAM.
 */

import { VoterRecord, PDFFileMeta, PageMeta, ProcessingLog } from '../types/voter';
import { sanitizeVoterRecord } from './voterSanitizer';

const DB_NAME = 'GujaratiVoterDB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

export function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Files store
      if (!db.objectStoreNames.contains('files')) {
        const fileStore = db.createObjectStore('files', { keyPath: 'id' });
        fileStore.createIndex('originalFileName', 'originalFileName', { unique: false });
        fileStore.createIndex('status', 'status', { unique: false });
      }

      // Pages store
      if (!db.objectStoreNames.contains('pages')) {
        const pageStore = db.createObjectStore('pages', { keyPath: ['fileId', 'pageNumber'] });
        pageStore.createIndex('fileId', 'fileId', { unique: false });
        pageStore.createIndex('status', 'status', { unique: false });
      }

      // Voters store
      if (!db.objectStoreNames.contains('voters')) {
        const voterStore = db.createObjectStore('voters', { keyPath: 'id' });
        voterStore.createIndex('epicNo', 'epicNo', { unique: false });
        voterStore.createIndex('pdfFileName', 'pdfFileName', { unique: false });
        voterStore.createIndex('verifiedStatus', 'verifiedStatus', { unique: false });
        voterStore.createIndex('vibhagNo', 'vibhagNo', { unique: false });
        voterStore.createIndex('fileId_pageNo', ['fileId', 'pdfPageNo'], { unique: false });
      }

      // PDF Binary Blobs for page inspection
      if (!db.objectStoreNames.contains('pdfBlobs')) {
        db.createObjectStore('pdfBlobs', { keyPath: 'id' });
      }

      // Logs store
      if (!db.objectStoreNames.contains('logs')) {
        const logStore = db.createObjectStore('logs', { keyPath: 'id' });
        logStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

// File operations
export async function saveFileMeta(file: PDFFileMeta): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite');
    tx.objectStore('files').put(file);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllFiles(): Promise<PDFFileMeta[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readonly');
    const req = tx.objectStore('files').getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function getFileMeta(fileId: string): Promise<PDFFileMeta | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readonly');
    const req = tx.objectStore('files').get(fileId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

// PDF Blob operations
export async function savePdfBlob(id: string, data: Blob | ArrayBuffer | Uint8Array): Promise<void> {
  const db = await getDB();
  const blob = data instanceof Blob ? data : new Blob([data as BlobPart], { type: 'application/pdf' });
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pdfBlobs', 'readwrite');
    tx.objectStore('pdfBlobs').put({ id, data: blob });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPdfBlob(id: string): Promise<Blob | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pdfBlobs', 'readonly');
    const req = tx.objectStore('pdfBlobs').get(id);
    req.onsuccess = () => {
      const result = req.result ? req.result.data : null;
      if (result instanceof Blob) {
        resolve(result);
      } else if (result) {
        resolve(new Blob([result], { type: 'application/pdf' }));
      } else {
        resolve(null);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

// Page operations
export async function savePageMeta(page: PageMeta): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pages', 'readwrite');
    tx.objectStore('pages').put(page);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPagesForFile(fileId: string): Promise<PageMeta[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pages', 'readonly');
    const idx = tx.objectStore('pages').index('fileId');
    const req = idx.getAll(fileId);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

// Voter operations
export async function saveVotersBatch(voters: VoterRecord[]): Promise<void> {
  if (voters.length === 0) return;
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('voters', 'readwrite');
    const store = tx.objectStore('voters');
    for (const voter of voters) {
      store.put(sanitizeVoterRecord(voter));
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function updateVoter(voter: VoterRecord): Promise<void> {
  const db = await getDB();
  const clean = sanitizeVoterRecord(voter);
  return new Promise((resolve, reject) => {
    const tx = db.transaction('voters', 'readwrite');
    tx.objectStore('voters').put({
      ...clean,
      updatedAt: Date.now(),
      isManuallyEdited: true,
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllVoters(): Promise<VoterRecord[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('voters', 'readonly');
    const req = tx.objectStore('voters').getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function getVotersCount(): Promise<number> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('voters', 'readonly');
    const req = tx.objectStore('voters').count();
    req.onsuccess = () => resolve(req.result || 0);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteVotersForFileAndPage(fileName: string, pageNumber: number): Promise<void> {
  const db = await getDB();
  const all = await getAllVoters();
  const toDelete = all.filter(v => v.pdfFileName === fileName && v.pdfPageNo === pageNumber);
  
  if (toDelete.length === 0) return;

  return new Promise((resolve, reject) => {
    const tx = db.transaction('voters', 'readwrite');
    const store = tx.objectStore('voters');
    for (const v of toDelete) {
      store.delete(v.id);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Check and mark duplicate EPICs across the entire database
export async function recomputeEpicDuplicates(): Promise<number> {
  const db = await getDB();
  const voters = await getAllVoters();
  const epicMap = new Map<string, VoterRecord[]>();

  for (const v of voters) {
    const cleanEpic = (v.epicNo || '').trim().toUpperCase();
    if (cleanEpic && cleanEpic !== 'UNKNOWN' && cleanEpic.length >= 5) {
      const list = epicMap.get(cleanEpic) || [];
      list.push(v);
      epicMap.set(cleanEpic, list);
    }
  }

  let duplicateCount = 0;
  const updates: VoterRecord[] = [];

  for (const [_, list] of epicMap) {
    if (list.length > 1) {
      duplicateCount += list.length;
      for (const v of list) {
        if (!v.isDuplicateEpic || !v.warnings.includes('સંભવિત ડુપ્લિકેટ ઓળખપત્ર નંબર')) {
          const warnings = v.warnings
            ? `${v.warnings}; સંભવિત ડુપ્લિકેટ ઓળખપત્ર નંબર`
            : 'સંભવિત ડુપ્લિકેટ ઓળખપત્ર નંબર';
          updates.push({
            ...v,
            isDuplicateEpic: true,
            warnings: warnings,
          });
        }
      }
    }
  }

  if (updates.length > 0) {
    await saveVotersBatch(updates);
  }

  return duplicateCount;
}

// Log operations
export async function addLog(pdfFileName: string, message: string, level: 'info' | 'warning' | 'error' = 'info', pageNumber?: number): Promise<void> {
  const db = await getDB();
  const logItem: ProcessingLog = {
    id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    pdfFileName,
    pageNumber,
    level,
    message,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction('logs', 'readwrite');
    tx.objectStore('logs').put(logItem);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllLogs(): Promise<ProcessingLog[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('logs', 'readonly');
    const req = tx.objectStore('logs').getAll();
    req.onsuccess = () => {
      const logs = req.result || [];
      logs.sort((a, b) => b.timestamp - a.timestamp);
      resolve(logs);
    };
    req.onerror = () => reject(req.error);
  });
}

// Clear all database data (New Project)
export async function clearAllProjectData(): Promise<void> {
  const db = await getDB();
  const storeNames = ['files', 'pages', 'voters', 'pdfBlobs', 'logs'];
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeNames, 'readwrite');
    for (const name of storeNames) {
      tx.objectStore(name).clear();
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
