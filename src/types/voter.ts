/**
 * Types and schema for Gujarati Electoral Roll Extraction
 * Exactly 21 Gujarati Columns in the Master Worksheet 'મતદાર માસ્ટર ડેટા'
 */

export interface VoterRecord {
  id: string; // Unique internal uuid
  serialNo: string; // 1. ક્રમ નંબર (original card serial number)
  epicNo: string; // 2. ઓળખપત્ર નંબર (EPIC No)
  voterName: string; // 3. મતદારનું નામ (Gujarati script)
  relationType: string; // 4. સંબંધનો પ્રકાર (પિતાનું નામ, પતિનું નામ, etc.)
  relativeName: string; // 5. સંબંધીનું નામ (Gujarati script)
  fatherName: string; // 6. પિતાનું નામ
  husbandName: string; // 7. પતિનું નામ
  motherName: string; // 8. માતાનું નામ
  otherRelative: string; // 9. અન્ય સંબંધી
  houseNo: string; // 10. ઘર / મકાન નંબર (Complete text after label)
  fullAddress: string; // 11. પૂર્ણ સરનામું (Combined house + locality/street/section)
  age: string; // 12. ઉંમર
  gender: string; // 13. જાતિ (પુરુષ / સ્ત્રી)
  vibhagNo: string; // 14. વિભાગ નંબર
  vibhagName: string; // 15. વિભાગનું નામ (Gujarati)
  wardNo: string; // 16. વોર્ડ નંબર
  bhagNo: string; // 17. ભાગ નંબર
  pdfFileName: string; // 18. PDF ફાઇલનું નામ (original filename)
  pdfPageNo: number; // 19. PDF પેજ નંબર (1-based)
  verifiedStatus: VerificationStatus; // 20. ચકાસાયેલ ('ચકાસવાનું' | 'ચકાસેલ' | 'ચકાસણી જરૂરી')
  warnings: string; // 21. સ્થિતિ / ચેતવણીઓ (Gujarati warnings)
  
  // Internal metadata (never exported in the 21 columns)
  createdAt: number;
  updatedAt: number;
  isDuplicateEpic?: boolean;
  isManuallyEdited?: boolean;
}

export type VerificationStatus = 'ચકાસવાનું' | 'ચકાસેલ' | 'ચકાસણી જરૂરી';

export interface PDFFileMeta {
  id: string;
  originalFileName: string;
  fileSize: number;
  totalPages: number;
  processedPages: number;
  status: 'pending' | 'processing' | 'completed' | 'paused' | 'error';
  voterCount: number;
  vibhagNo?: string;
  vibhagName?: string;
  bhagNo?: string;
  wardNo?: string;
  sectionName?: string;
  errorMessage?: string;
  createdAt: number;
  updatedAt: number;
}

export interface PageMeta {
  fileId: string;
  pdfFileName: string;
  pageNumber: number;
  status: 'pending' | 'processing' | 'completed' | 'skipped' | 'failed';
  isVoterPage: boolean;
  pageTypeGujarati?: string;
  voterCount: number;
  error?: string;
  processedAt?: number;
}

export interface ProcessingLog {
  id: string;
  timestamp: number;
  pdfFileName: string;
  pageNumber?: number;
  level: 'info' | 'warning' | 'error';
  message: string;
}

export interface ExtractionStats {
  totalPdfs: number;
  completedPdfs: number;
  processingPdfs: number;
  failedPdfs: number;
  totalPages: number;
  processedPages: number;
  remainingPages: number;
  totalVoters: number;
  reviewRequiredCount: number;
  duplicateCount: number;
  currentPdfName: string;
  currentPageNumber: number;
  percentComplete: number;
}

// Exactly 21 Gujarati Column Headers (1-20 canonical standard + 21 complete address)
export const MASTER_EXCEL_COLUMNS = [
  'ક્રમ નંબર', // 1
  'ઓળખપત્ર નંબર', // 2
  'મતદારનું નામ', // 3
  'સંબંધનો પ્રકાર', // 4
  'સંબંધીનું નામ', // 5
  'પિતાનું નામ', // 6
  'પતિનું નામ', // 7
  'માતાનું નામ', // 8
  'અન્ય સંબંધી', // 9
  'ઘર / મકાન નંબર', // 10
  'ઉંમર', // 11
  'જાતિ', // 12
  'વિભાગ નંબર', // 13
  'વિભાગનું નામ', // 14
  'વોર્ડ નંબર', // 15
  'ભાગ નંબર', // 16
  'PDF ફાઇલનું નામ', // 17
  'PDF પેજ નંબર', // 18
  'ચકાસાયેલ', // 19
  'સ્થિતિ / ચેતવણીઓ', // 20
  'પૂર્ણ સરનામું', // 21
] as const;

export const GUJARATI_WARNINGS = {
  MISSING_EPIC: 'ઓળખપત્ર નંબર ઉપલબ્ધ નથી',
  UNCLEAR_EPIC: 'ઓળખપત્ર નંબર અસ્પષ્ટ છે',
  NAME_DIFFICULT: 'મતદારનું નામ વાંચવામાં મુશ્કેલી',
  MISSING_SERIAL: 'ક્રમ નંબર ઉપલબ્ધ નથી',
  MISSING_VIBHAG: 'વિભાગની વિગતો ઉપલબ્ધ નથી',
  INHERITED_VIBHAG: 'વિભાગની વિગતો અગાઉના પેજ પરથી લેવામાં આવી છે',
  MISSING_BHAG: 'ભાગ નંબર મળ્યો નથી',
  MISSING_WARD: 'વોર્ડ નંબર મળ્યો નથી',
  INCOMPLETE_ADDRESS: 'સરનામું અપૂર્ણ છે',
  DUPLICATE_EPIC: 'સંભવિત ડુપ્લિકેટ ઓળખપત્ર નંબર',
  PARTIAL_DATA: 'આંશિક માહિતી જ કાઢી શકાય છે',
  PAGE_ERROR: 'પેજ વાંચવામાં ભૂલ આવી',
  REVIEW_NEEDED: 'ચકાસણી જરૂરી',
};
