/**
 * Voter Record Sanitization & Validation Service
 * Ensures data integrity across multimodal extraction and export:
 * - Prevents placeholder artifacts (e.g. '25', 'N/A', '-') from corrupting empty fields
 * - Enforces strict exclusivity for relative fields (fatherName, husbandName, motherName, otherRelative)
 * - Normalizes EPIC IDs (stripping OCR-introduced 8th digit anomalies)
 * - Validates gender consistency against relationship types and naming conventions
 * - Cleans Ward Number field from section address pollution
 */

import { VoterRecord, VerificationStatus } from '../types/voter';

const PLACEHOLDER_TOKENS = new Set([
  '25',
  '25/3',
  'n/a',
  'na',
  '-',
  '--',
  'nil',
  'null',
  'none',
  'undefined',
  '?',
]);

/**
 * Checks if a value is effectively empty or an artificial placeholder token
 */
export function isPlaceholder(val: any): boolean {
  if (val === null || val === undefined) return true;
  const s = String(val).trim().toLowerCase();
  return s === '' || PLACEHOLDER_TOKENS.has(s);
}

/**
 * Normalizes and sanitizes a VoterRecord ensuring strict field-by-field integrity
 */
export function sanitizeVoterRecord(v: Partial<VoterRecord>): VoterRecord {
  const serialNo = String(v.serialNo || '').trim();

  // 1. EPIC normalization & extra-digit fix (e.g. malformed 8-digit suffix)
  let epicNo = String(v.epicNo || '').trim().toUpperCase();
  if (/^[A-Z]{3}\d{8}$/.test(epicNo)) {
    // Modern Gujarat EPIC is strictly 3 letters + 7 digits (10 chars).
    // Border line artifacts often append an 8th digit.
    epicNo = epicNo.substring(0, 10);
  }

  // 2. Voter Name (preserve Gujarati script)
  let voterName = String(v.voterName || '').trim();
  if (isPlaceholder(voterName)) voterName = '';

  // 3. Relation Type & Relative Name
  let relationType = String(v.relationType || '').trim();
  let relativeName = String(v.relativeName || '').trim();
  if (isPlaceholder(relativeName)) relativeName = '';

  // Standardize Gujarati relation type label
  if (relationType.includes('પતિ')) {
    relationType = 'પતિનું નામ';
  } else if (relationType.includes('માતા')) {
    relationType = 'માતાનું નામ';
  } else if (relationType.includes('અન્ય')) {
    relationType = 'અન્ય સંબંધી';
  } else {
    relationType = 'પિતાનું નામ';
  }

  // 4. Strict Exclusivity for Relative Fields (empty/inapplicable MUST be "")
  let fatherName = '';
  let husbandName = '';
  let motherName = '';
  let otherRelative = '';

  if (relationType === 'પતિનું નામ') {
    husbandName = relativeName;
  } else if (relationType === 'માતાનું નામ') {
    motherName = relativeName;
  } else if (relationType === 'અન્ય સંબંધી') {
    otherRelative = relativeName;
  } else {
    fatherName = relativeName;
  }

  // 5. House No & Full Address
  let houseNo = String(v.houseNo || '').trim();
  if (isPlaceholder(houseNo)) houseNo = '';

  let fullAddress = String(v.fullAddress || '').trim();
  if (isPlaceholder(fullAddress)) fullAddress = '';

  // 6. Age
  let age = String(v.age || '').trim();
  if (isPlaceholder(age)) age = '';

  // 7. Gender validation & cross-check (fixes male/female inversion)
  let gender = String(v.gender || '').trim();
  if (relationType === 'પતિનું નામ') {
    // If voter has a husband, gender is female
    gender = 'સ્ત્રી';
  } else if (
    voterName.endsWith('ભાઈ') ||
    voterName.endsWith('કુમાર') ||
    voterName.endsWith('લાલ') ||
    voterName.endsWith('સિંહ') ||
    voterName.endsWith('દાસ') ||
    voterName.endsWith('રાવ') ||
    voterName.endsWith('કાંત')
  ) {
    // Standard Gujarati male name patterns
    gender = 'પુરુષ';
  } else if (
    voterName.endsWith('બેન') ||
    voterName.endsWith('બા') ||
    voterName.endsWith('દેવી') ||
    voterName.endsWith('કુમારી')
  ) {
    gender = 'સ્ત્રી';
  } else if (gender !== 'સ્ત્રી' && gender !== 'પુરુષ') {
    gender = gender.includes('સ્ત્રી') || gender.toLowerCase().includes('female') ? 'સ્ત્રી' : 'પુરુષ';
  }

  // 8. Ward Number: must be clean 1-3 digit number only, never address text or placeholder
  let wardNo = String(v.wardNo || '').trim();
  if (
    isPlaceholder(wardNo) ||
    wardNo.length > 5 ||
    wardNo.includes('શેરી') ||
    wardNo.includes('રૈયા') ||
    wardNo.includes('ક્વાર્ટર') ||
    wardNo.includes('મફતિયાપરા') ||
    !/^\d{1,3}[A-Za-z]?$/.test(wardNo)
  ) {
    wardNo = '';
  }

  // 9. Vibhag & Bhag numbers
  let vibhagNo = String(v.vibhagNo || '').trim();
  if (isPlaceholder(vibhagNo)) vibhagNo = '';

  let vibhagName = String(v.vibhagName || '').trim();
  if (isPlaceholder(vibhagName)) vibhagName = '';

  let bhagNo = String(v.bhagNo || '').trim();
  if (isPlaceholder(bhagNo)) bhagNo = '';

  // 10. Verification Status: must be valid Gujarati status, NEVER '25'
  let verifiedStatus: VerificationStatus = 'ચકાસવાનું';
  if (v.verifiedStatus === 'ચકાસેલ' || v.verifiedStatus === 'ચકાસણી જરૂરી') {
    verifiedStatus = v.verifiedStatus;
  }

  let warnings = String(v.warnings || '').trim();
  if (isPlaceholder(warnings)) warnings = '';

  return {
    id: v.id || `${v.pdfFileName || 'file'}_${v.pdfPageNo || 1}_${serialNo}_${Date.now()}`,
    serialNo,
    epicNo,
    voterName,
    relationType,
    relativeName,
    fatherName,
    husbandName,
    motherName,
    otherRelative,
    houseNo,
    fullAddress,
    age,
    gender,
    vibhagNo,
    vibhagName,
    wardNo,
    bhagNo,
    pdfFileName: v.pdfFileName || '',
    pdfPageNo: Number(v.pdfPageNo) || 1,
    verifiedStatus,
    warnings,
    createdAt: v.createdAt || Date.now(),
    updatedAt: v.updatedAt || Date.now(),
    isDuplicateEpic: v.isDuplicateEpic || false,
    isManuallyEdited: v.isManuallyEdited || false,
  };
}
