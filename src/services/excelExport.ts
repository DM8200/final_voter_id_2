/**
 * ExcelJS Export Service for Gujarati Electoral Roll Master Sheet
 * Generates genuine .xlsx with exact 20 Gujarati column headers,
 * Gujarati Unicode preservation, freeze panes, autofilter, and diagnostics sheet.
 */

import ExcelJS from 'exceljs';
import { VoterRecord, ProcessingLog, MASTER_EXCEL_COLUMNS } from '../types/voter';
import { sanitizeVoterRecord } from './voterSanitizer';

export async function exportMasterVoterExcel(
  voters: VoterRecord[],
  logs: ProcessingLog[] = [],
  customFileName?: string
): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Gujarati Electoral Roll Processor';
  workbook.created = new Date();

  // 1. Primary Sheet: મતદાર માસ્ટર ડેટા
  const masterSheet = workbook.addWorksheet('મતદાર માસ્ટર ડેટા', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
  });

  // Setup exact 21 columns (1-20 canonical standard + 21 fullAddress)
  masterSheet.columns = [
    { header: MASTER_EXCEL_COLUMNS[0], key: 'serialNo', width: 12 }, // 1. ક્રમ નંબર
    { header: MASTER_EXCEL_COLUMNS[1], key: 'epicNo', width: 18 }, // 2. ઓળખપત્ર નંબર
    { header: MASTER_EXCEL_COLUMNS[2], key: 'voterName', width: 26 }, // 3. મતદારનું નામ
    { header: MASTER_EXCEL_COLUMNS[3], key: 'relationType', width: 16 }, // 4. સંબંધનો પ્રકાર
    { header: MASTER_EXCEL_COLUMNS[4], key: 'relativeName', width: 26 }, // 5. સંબંધીનું નામ
    { header: MASTER_EXCEL_COLUMNS[5], key: 'fatherName', width: 26 }, // 6. પિતાનું નામ
    { header: MASTER_EXCEL_COLUMNS[6], key: 'husbandName', width: 26 }, // 7. પતિનું નામ
    { header: MASTER_EXCEL_COLUMNS[7], key: 'motherName', width: 22 }, // 8. માતાનું નામ
    { header: MASTER_EXCEL_COLUMNS[8], key: 'otherRelative', width: 22 }, // 9. અન્ય સંબંધી
    { header: MASTER_EXCEL_COLUMNS[9], key: 'houseNo', width: 22 }, // 10. ઘર / મકાન નંબર
    { header: MASTER_EXCEL_COLUMNS[10], key: 'age', width: 10 }, // 11. ઉંમર
    { header: MASTER_EXCEL_COLUMNS[11], key: 'gender', width: 12 }, // 12. જાતિ
    { header: MASTER_EXCEL_COLUMNS[12], key: 'vibhagNo', width: 14 }, // 13. વિભાગ નંબર
    { header: MASTER_EXCEL_COLUMNS[13], key: 'vibhagName', width: 24 }, // 14. વિભાગનું નામ
    { header: MASTER_EXCEL_COLUMNS[14], key: 'wardNo', width: 14 }, // 15. વોર્ડ નંબર
    { header: MASTER_EXCEL_COLUMNS[15], key: 'bhagNo', width: 14 }, // 16. ભાગ નંબર
    { header: MASTER_EXCEL_COLUMNS[16], key: 'pdfFileName', width: 34 }, // 17. PDF ફાઇલનું નામ
    { header: MASTER_EXCEL_COLUMNS[17], key: 'pdfPageNo', width: 14 }, // 18. PDF પેજ નંબર
    { header: MASTER_EXCEL_COLUMNS[18], key: 'verifiedStatus', width: 16 }, // 19. ચકાસાયેલ
    { header: MASTER_EXCEL_COLUMNS[19], key: 'warnings', width: 36 }, // 20. સ્થિતિ / ચેતવણીઓ
    { header: MASTER_EXCEL_COLUMNS[20], key: 'fullAddress', width: 38 }, // 21. પૂર્ણ સરનામું
  ];

  // Header styling (navy blue background, white bold text)
  const headerRow = masterSheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' }, // Deep Blue / Indigo
    };
    cell.font = {
      name: 'Noto Sans Gujarati',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF94A3B8' } },
      left: { style: 'thin', color: { argb: 'FF94A3B8' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      right: { style: 'thin', color: { argb: 'FF94A3B8' } },
    };
  });

  // Enable AutoFilter on row 1 across all 21 columns
  masterSheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: 21 },
  };

  // Sort voters strictly in sequential order before exporting
  const sortedVoters = [...voters].sort((a, b) => {
    // 1. Group by PDF file
    if (a.pdfFileName !== b.pdfFileName) {
      return a.pdfFileName.localeCompare(b.pdfFileName, undefined, { numeric: true });
    }
    // 2. Sort by printed Serial Number as integer
    const numA = parseInt(a.serialNo, 10);
    const numB = parseInt(b.serialNo, 10);
    if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
      return numA - numB;
    }
    // 3. Fallback to PDF page number
    const pageA = Number(a.pdfPageNo) || 0;
    const pageB = Number(b.pdfPageNo) || 0;
    if (pageA !== pageB) return pageA - pageB;
    return (a.serialNo || '').localeCompare(b.serialNo || '', undefined, { numeric: true });
  });

  // Add all voter rows in exact sequence with strict sanitization
  for (let i = 0; i < sortedVoters.length; i++) {
    const v = sanitizeVoterRecord(sortedVoters[i]);
    const row = masterSheet.addRow({
      serialNo: v.serialNo || '',
      epicNo: v.epicNo || '',
      voterName: v.voterName || '',
      relationType: v.relationType || '',
      relativeName: v.relativeName || '',
      fatherName: v.fatherName || '',
      husbandName: v.husbandName || '',
      motherName: v.motherName || '',
      otherRelative: v.otherRelative || '',
      houseNo: v.houseNo || '',
      age: v.age ? Number(v.age) || v.age : '',
      gender: v.gender || '',
      vibhagNo: v.vibhagNo || '',
      vibhagName: v.vibhagName || '',
      wardNo: v.wardNo || '',
      bhagNo: v.bhagNo || '',
      pdfFileName: v.pdfFileName || '',
      pdfPageNo: Number(v.pdfPageNo) || 1,
      verifiedStatus: v.verifiedStatus || 'ચકાસવાનું',
      warnings: v.warnings || '',
      fullAddress: v.fullAddress || '',
    });

    row.height = 22;

    // Apply font and alignment
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = {
        name: 'Noto Sans Gujarati',
        size: 10,
      };
      
      // Formatting specific columns (21 columns)
      if (colNumber === 2) {
        // EPIC as explicit text format to preserve leading zeroes
        cell.numFmt = '@';
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (
        colNumber === 1 || // serialNo
        colNumber === 11 || // age
        colNumber === 12 || // gender
        colNumber === 13 || // vibhagNo
        colNumber === 15 || // wardNo
        colNumber === 16 || // bhagNo
        colNumber === 18 || // pdfPageNo
        colNumber === 19 // verifiedStatus
      ) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }

      // Highlight rows with warnings or unverified status
      if (v.warnings && v.warnings.trim().length > 0) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFBEB' }, // subtle amber warning tint
        };
      }
    });
  }

  // 2. Optional Diagnostic Sheet: પ્રક્રિયા અહેવાલ
  if (logs.length > 0) {
    const logSheet = workbook.addWorksheet('પ્રક્રિયા અહેવાલ');
    logSheet.columns = [
      { header: 'તારીખ અને સમય', key: 'time', width: 22 },
      { header: 'સ્તર', key: 'level', width: 12 },
      { header: 'PDF ફાઇલનું નામ', key: 'file', width: 34 },
      { header: 'પેજ નંબર', key: 'page', width: 12 },
      { header: 'વિગત / સંદેશ', key: 'message', width: 60 },
    ];

    const logHeader = logSheet.getRow(1);
    logHeader.height = 24;
    logHeader.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF334155' },
      };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    });

    for (const log of logs) {
      logSheet.addRow({
        time: new Date(log.timestamp).toLocaleString('gu-IN'),
        level: log.level === 'error' ? 'ભૂલ' : log.level === 'warning' ? 'ચેતવણી' : 'માહિતી',
        file: log.pdfFileName,
        page: log.pageNumber || '-',
        message: log.message,
      });
    }
  }

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

// Download trigger utility
export function triggerExcelDownload(blob: Blob, fileName: string = 'મતદાર_માસ્ટર_ડેટા.xlsx') {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
