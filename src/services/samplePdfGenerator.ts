/**
 * Realistic Sample Gujarati Electoral Roll PDF Generator
 * Matches the official CEO Gujarat / Election Commission format:
 * - 36 Pages
 * - Header: "Assembly Constituency: 69 - Rajkot West" & "Part No: 1"
 * - Visual Canvas Layer: Authentic Gujarati script typography
 * - Page 1: Roll Summary (no individual voter cards)
 * - Page 2: Polling Station Map & Details (no individual voter cards)
 * - Page 3: 30 individual voter cards (Serial 1 through 30)
 * - Pages 4-36: Continuation voter pages
 *
 * NOTE: PDF standard fonts (Helvetica) only support WinAnsi (ASCII/Latin-1).
 * To avoid WinAnsi encoding errors while providing authentic Gujarati visuals,
 * Gujarati text is rendered via HTML5 Canvas and embedded as high-resolution PNG.
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface SampleVoterInfo {
  serialNo: string;
  epicNo: string;
  voterName: string;
  relationType: string;
  relativeName: string;
  fatherName: string;
  husbandName: string;
  motherName: string;
  otherRelative: string;
  houseNo: string;
  fullAddress?: string;
  age: string;
  gender: string;
  vibhagNo: string;
  vibhagName: string;
  wardNo: string;
  bhagNo: string;
  warnings?: string;
}

// 30 Sample authentic Gujarati voters for Page 3
export const SAMPLE_PAGE_3_VOTERS: SampleVoterInfo[] = [
  {
    serialNo: '1',
    epicNo: 'WMI1002341',
    voterName: 'રમેશભાઈ પટેલ',
    relationType: 'પિતાનું નામ',
    relativeName: 'કેશવજીભાઈ પટેલ',
    fatherName: 'કેશવજીભાઈ પટેલ',
    husbandName: '',
    motherName: '',
    otherRelative: '',
    houseNo: '12/A',
    fullAddress: '12/A, ૧-સ્લમ ક્વાર્ટર્સ શેરી-૧, રૈયાધાર, રૈયા રોડ, રૈયા-40, રાજકોટ',
    age: '46',
    gender: 'પુરુષ',
    vibhagNo: '69',
    vibhagName: 'રાજકોટ પશ્ચિમ',
    wardNo: '',
    bhagNo: '1',
  },
  {
    serialNo: '2',
    epicNo: 'WMI1002342',
    voterName: 'શારદાબેન પટેલ',
    relationType: 'પતિનું નામ',
    relativeName: 'રમેશભાઈ પટેલ',
    fatherName: '',
    husbandName: 'રમેશભાઈ પટેલ',
    motherName: '',
    otherRelative: '',
    houseNo: 'S.602',
    fullAddress: 'S.602, ૧-સ્લમ ક્વાર્ટર્સ શેરી-૧, રૈયાધાર, રૈયા રોડ, રૈયા-40, રાજકોટ',
    age: '42',
    gender: 'સ્ત્રી',
    vibhagNo: '69',
    vibhagName: 'રાજકોટ પશ્ચિમ',
    wardNo: '',
    bhagNo: '1',
  },
  {
    serialNo: '3',
    epicNo: 'WMI1002343',
    voterName: 'વિપુલભાઈ પટેલ',
    relationType: 'પિતાનું નામ',
    relativeName: 'રમેશભાઈ પટેલ',
    fatherName: 'રમેશભાઈ પટેલ',
    husbandName: '',
    motherName: '',
    otherRelative: '',
    houseNo: 'ધીરજનગર શેરી નં. 1',
    fullAddress: 'ધીરજનગર શેરી નં. 1, રૈયાધાર, રૈયા રોડ, રાજકોટ',
    age: '22',
    gender: 'પુરુષ',
    vibhagNo: '69',
    vibhagName: 'રાજકોટ પશ્ચિમ',
    wardNo: '',
    bhagNo: '1',
  },
  {
    serialNo: '4',
    epicNo: 'WMI1002344',
    voterName: 'હરેશભાઈ મહેતા',
    relationType: 'પિતાનું નામ',
    relativeName: 'નવનીતલાલ મહેતા',
    fatherName: 'નવનીતલાલ મહેતા',
    husbandName: '',
    motherName: '',
    otherRelative: '',
    houseNo: 'સર્વે નંબર એસ-401 એટલાન્ટિસ હિલ્સ',
    fullAddress: 'સર્વે નંબર એસ-401 એટલાન્ટિસ હિલ્સ, ૨-સત્યમ પાર્ક શેરી નં-૨, રૈયાધાર, રૈયા રોડ, રાજકોટ',
    age: '53',
    gender: 'પુરુષ',
    vibhagNo: '69',
    vibhagName: 'રાજકોટ પશ્ચિમ',
    wardNo: '',
    bhagNo: '1',
  },
  {
    serialNo: '5',
    epicNo: 'WMI1002345',
    voterName: 'જાગૃતિબેન મહેતા',
    relationType: 'પતિનું નામ',
    relativeName: 'હરેશભાઈ મહેતા',
    fatherName: '',
    husbandName: 'હરેશભાઈ મહેતા',
    motherName: '',
    otherRelative: '',
    houseNo: 'પ્લોટ -426,સ્લમ ક્વાર્ટર',
    fullAddress: 'પ્લોટ -426,સ્લમ ક્વાર્ટર, ૧-સ્લમ ક્વાર્ટર્સ શેરી-૧, રૈયાધાર, રૈયા રોડ, રૈયા-40, રાજકોટ',
    age: '49',
    gender: 'સ્ત્રી',
    vibhagNo: '69',
    vibhagName: 'રાજકોટ પશ્ચિમ',
    wardNo: '',
    bhagNo: '1',
  },
  {
    serialNo: '6',
    epicNo: 'WMI1002346',
    voterName: 'ભાવેશભાઈ સોલંકી',
    relationType: 'પિતાનું નામ',
    relativeName: 'જયંતિભાઈ સોલંકી',
    fatherName: 'જયંતિભાઈ સોલંકી',
    husbandName: '',
    motherName: '',
    otherRelative: '',
    houseNo: 'મોમાઈ નગર ૩',
    fullAddress: 'મોમાઈ નગર ૩, ૧-સ્લમ ક્વાર્ટર્સ શેરી-૧, રૈયાધાર, રૈયા રોડ, રૈયા-40, રાજકોટ',
    age: '38',
    gender: 'પુરુષ',
    vibhagNo: '69',
    vibhagName: 'રાજકોટ પશ્ચિમ',
    wardNo: '',
    bhagNo: '1',
  },
  {
    serialNo: '7',
    epicNo: 'WMI1002347',
    voterName: 'મીનાબેન સોલંકી',
    relationType: 'પતિનું નામ',
    relativeName: 'ભાવેશભાઈ સોલંકી',
    fatherName: '',
    husbandName: 'ભાવેશભાઈ સોલંકી',
    motherName: '',
    otherRelative: '',
    houseNo: '15-B',
    fullAddress: '15-B, ૧-સ્લમ ક્વાર્ટર્સ શેરી-૧, રૈયાધાર, રૈયા રોડ, રૈયા-40, રાજકોટ',
    age: '35',
    gender: 'સ્ત્રી',
    vibhagNo: '69',
    vibhagName: 'રાજકોટ પશ્ચિમ',
    wardNo: '',
    bhagNo: '1',
  },
  {
    serialNo: '8',
    epicNo: 'WMI1002348',
    voterName: 'કિશોરભાઈ વાઘેલા',
    relationType: 'પિતાનું નામ',
    relativeName: 'ધનજીભાઈ વાઘેલા',
    fatherName: 'ધનજીભાઈ વાઘેલા',
    husbandName: '',
    motherName: '',
    otherRelative: '',
    houseNo: '18',
    age: '61',
    gender: 'પુરુષ',
    vibhagNo: '69',
    vibhagName: 'રાજકોટ પશ્ચિમ',
    wardNo: '',
    bhagNo: '1',
  },
  {
    serialNo: '9',
    epicNo: 'WMI1002349',
    voterName: 'ગીતાબેન વાઘેલા',
    relationType: 'પતિનું નામ',
    relativeName: 'કિશોરભાઈ વાઘેલા',
    fatherName: '',
    husbandName: 'કિશોરભાઈ વાઘેલા',
    motherName: '',
    otherRelative: '',
    houseNo: '18',
    age: '57',
    gender: 'સ્ત્રી',
    vibhagNo: '69',
    vibhagName: 'રાજકોટ પશ્ચિમ',
    wardNo: '',
    bhagNo: '1',
  },
  {
    serialNo: '10',
    epicNo: 'WMI1002350',
    voterName: 'ચિરાગભાઈ વાઘેલા',
    relationType: 'પિતાનું નામ',
    relativeName: 'કિશોરભાઈ વાઘેલા',
    fatherName: 'કિશોરભાઈ વાઘેલા',
    husbandName: '',
    motherName: '',
    otherRelative: '',
    houseNo: '18',
    age: '30',
    gender: 'પુરુષ',
    vibhagNo: '69',
    vibhagName: 'રાજકોટ પશ્ચિમ',
    wardNo: '',
    bhagNo: '1',
  },
  {
    serialNo: '11',
    epicNo: 'WMI1002351',
    voterName: 'અજયભાઈ જોષી',
    relationType: 'પિતાનું નામ',
    relativeName: 'શાંતિલાલ જોષી',
    fatherName: 'શાંતિલાલ જોષી',
    husbandName: '',
    motherName: '',
    otherRelative: '',
    houseNo: '21',
    age: '44',
    gender: 'પુરુષ',
    vibhagNo: '69',
    vibhagName: 'રાજકોટ પશ્ચિમ',
    wardNo: '',
    bhagNo: '1',
  },
  {
    serialNo: '12',
    epicNo: 'WMI1002352',
    voterName: 'પૂજાબેન જોષી',
    relationType: 'પતિનું નામ',
    relativeName: 'અજયભાઈ જોષી',
    fatherName: '',
    husbandName: 'અજયભાઈ જોષી',
    motherName: '',
    otherRelative: '',
    houseNo: '21',
    age: '40',
    gender: 'સ્ત્રી',
    vibhagNo: '69',
    vibhagName: 'રાજકોટ પશ્ચિમ',
    wardNo: '',
    bhagNo: '1',
  },
  {
    serialNo: '13',
    epicNo: 'WMI1002353',
    voterName: 'મનોજકુમાર શાહ',
    relationType: 'પિતાનું નામ',
    relativeName: 'પ્રવીણચંદ્ર શાહ',
    fatherName: 'પ્રવીણચંદ્ર શાહ',
    husbandName: '',
    motherName: '',
    otherRelative: '',
    houseNo: '25/3',
    age: '50',
    gender: 'પુરુષ',
    vibhagNo: '69',
    vibhagName: 'રાજકોટ પશ્ચિમ',
    wardNo: '',
    bhagNo: '1',
  },
  {
    serialNo: '14',
    epicNo: 'WMI1002354',
    voterName: 'નયનાબેન શાહ',
    relationType: 'પતિનું નામ',
    relativeName: 'મનોજકુમાર શાહ',
    fatherName: '',
    husbandName: 'મનોજકુમાર શાહ',
    motherName: '',
    otherRelative: '',
    houseNo: '25/3',
    age: '47',
    gender: 'સ્ત્રી',
    vibhagNo: '69',
    vibhagName: 'રાજકોટ પશ્ચિમ',
    wardNo: '',
    bhagNo: '1',
  },
  {
    serialNo: '15',
    epicNo: '', // Test 8: Missing EPIC
    voterName: 'દિનેશભાઈ રાઠોડ',
    relationType: 'પિતાનું નામ',
    relativeName: 'ભીખાભાઈ રાઠોડ',
    fatherName: 'ભીખાભાઈ રાઠોડ',
    husbandName: '',
    motherName: '',
    otherRelative: '',
    houseNo: '29',
    age: '39',
    gender: 'પુરુષ',
    vibhagNo: '69',
    vibhagName: 'રાજકોટ પશ્ચિમ',
    wardNo: '',
    bhagNo: '1',
    warnings: 'ઓળખપત્ર નંબર ઉપલબ્ધ નથી',
  },
  {
    serialNo: '16',
    epicNo: 'WMI1002356',
    voterName: 'જ્યોત્સનાબેન રાઠોડ',
    relationType: 'પતિનું નામ',
    relativeName: 'દિનેશભાઈ રાઠોડ',
    fatherName: '',
    husbandName: 'દિનેશભાઈ રાઠોડ',
    motherName: '',
    otherRelative: '',
    houseNo: '29',
    age: '36',
    gender: 'સ્ત્રી',
    vibhagNo: '69',
    vibhagName: 'રાજકોટ પશ્ચિમ',
    wardNo: '',
    bhagNo: '1',
  },
  {
    serialNo: '17',
    epicNo: 'WMI1002357',
    voterName: 'કલ્પેશભાઈ ત્રિવેદી',
    relationType: 'પિતાનું નામ',
    relativeName: 'મનસુખલાલ ત્રિવેદી',
    fatherName: 'મનસુખલાલ ત્રિવેદી',
    husbandName: '',
    motherName: '',
    otherRelative: '',
    houseNo: '32',
    age: '41',
    gender: 'પુરુષ',
    vibhagNo: '69',
    vibhagName: 'રાજકોટ પશ્ચિમ',
    wardNo: '',
    bhagNo: '1',
  },
  {
    serialNo: '18',
    epicNo: 'WMI1002358',
    voterName: 'રેખાબેન ત્રિવેદી',
    relationType: 'પતિનું નામ',
    relativeName: 'કલ્પેશભાઈ ત્રિવેદી',
    fatherName: '',
    husbandName: 'કલ્પેશભાઈ ત્રિવેદી',
    motherName: '',
    otherRelative: '',
    houseNo: '32',
    age: '38',
    gender: 'સ્ત્રી',
    vibhagNo: '69',
    vibhagName: 'રાજકોટ પશ્ચિમ',
    wardNo: '',
    bhagNo: '1',
  },
  {
    serialNo: '19',
    epicNo: 'WMI1002359',
    voterName: 'સંજયભાઈ પરમાર',
    relationType: 'પિતાનું નામ',
    relativeName: 'ગોવિંદભાઈ પરમાર',
    fatherName: 'ગોવિંદભાઈ પરમાર',
    husbandName: '',
    motherName: '',
    otherRelative: '',
    houseNo: '36',
    age: '34',
    gender: 'પુરુષ',
    vibhagNo: '69',
    vibhagName: 'રાજકોટ પશ્ચિમ',
    wardNo: '',
    bhagNo: '1',
  },
  {
    serialNo: '20',
    epicNo: 'WMI1002360',
    voterName: 'આશાબેન પરમાર',
    relationType: 'પતિનું નામ',
    relativeName: 'સંજયભાઈ પરમાર',
    fatherName: '',
    husbandName: 'સંજયભાઈ પરમાર',
    motherName: '',
    otherRelative: '',
    houseNo: '36',
    age: '31',
    gender: 'સ્ત્રી',
    vibhagNo: '69',
    vibhagName: 'રાજકોટ પશ્ચિમ',
    wardNo: '',
    bhagNo: '1',
  },
  {
    serialNo: '21',
    epicNo: 'WMI1002361',
    voterName: 'જયેશભાઈ ગોહિલ',
    relationType: 'પિતાનું નામ',
    relativeName: 'રામજીભાઈ ગોહિલ',
    fatherName: 'રામજીભાઈ ગોહિલ',
    husbandName: '',
    motherName: '',
    otherRelative: '',
    houseNo: '40',
    age: '48',
    gender: 'પુરુષ',
    vibhagNo: '69',
    vibhagName: 'રાજકોટ પશ્ચિમ',
    wardNo: '',
    bhagNo: '1',
  },
  {
    serialNo: '22',
    epicNo: 'WMI1002362',
    voterName: 'અલ્પાબેન ગોહિલ',
    relationType: 'પતિનું નામ',
    relativeName: 'જયેશભાઈ ગોહિલ',
    fatherName: '',
    husbandName: 'જયેશભાઈ ગોહિલ',
    motherName: '',
    otherRelative: '',
    houseNo: '40',
    age: '45',
    gender: 'સ્ત્રી',
    vibhagNo: '69',
    vibhagName: 'રાજકોટ પશ્ચિમ',
    wardNo: '',
    bhagNo: '1',
  },
  {
    serialNo: '23',
    epicNo: 'WMI1002363',
    voterName: 'પાર્થભાઈ ગોહિલ',
    relationType: 'પિતાનું નામ',
    relativeName: 'જયેશભાઈ ગોહિલ',
    fatherName: 'જયેશભાઈ ગોહિલ',
    husbandName: '',
    motherName: '',
    otherRelative: '',
    houseNo: '40',
    age: '21',
    gender: 'પુરુષ',
    vibhagNo: '69',
    vibhagName: 'રાજકોટ પશ્ચિમ',
    wardNo: '',
    bhagNo: '1',
  },
  {
    serialNo: '24',
    epicNo: 'WMI1002364',
    voterName: 'મુકેશભાઈ દવે',
    relationType: 'પિતાનું નામ',
    relativeName: 'ગિરીશભાઈ દવે',
    fatherName: 'ગિરીશભાઈ દવે',
    husbandName: '',
    motherName: '',
    otherRelative: '',
    houseNo: '45',
    age: '55',
    gender: 'પુરુષ',
    vibhagNo: '69',
    vibhagName: 'રાજકોટ પશ્ચિમ',
    wardNo: '',
    bhagNo: '1',
  },
  {
    serialNo: '25',
    epicNo: 'WMI1002365',
    voterName: 'વંદનાબેન દવે',
    relationType: 'પતિનું નામ',
    relativeName: 'મુકેશભાઈ દવે',
    fatherName: '',
    husbandName: 'મુકેશભાઈ દવે',
    motherName: '',
    otherRelative: '',
    houseNo: '45',
    age: '52',
    gender: 'સ્ત્રી',
    vibhagNo: '69',
    vibhagName: 'રાજકોટ પશ્ચિમ',
    wardNo: '',
    bhagNo: '1',
  },
  {
    serialNo: '26',
    epicNo: 'WMI1002366',
    voterName: 'નરેશભાઈ ચૌહાણ',
    relationType: 'પિતાનું નામ',
    relativeName: 'કાળુભાઈ ચૌહાણ',
    fatherName: 'કાળુભાઈ ચૌહાણ',
    husbandName: '',
    motherName: '',
    otherRelative: '',
    houseNo: '48/1',
    age: '37',
    gender: 'પુરુષ',
    vibhagNo: '69',
    vibhagName: 'રાજકોટ પશ્ચિમ',
    wardNo: '',
    bhagNo: '1',
  },
  {
    serialNo: '27',
    epicNo: 'WMI1002367',
    voterName: 'ભાવનાબેન ચૌહાણ',
    relationType: 'પતિનું નામ',
    relativeName: 'નરેશભાઈ ચૌહાણ',
    fatherName: '',
    husbandName: 'નરેશભાઈ ચૌહાણ',
    motherName: '',
    otherRelative: '',
    houseNo: '48/1',
    age: '33',
    gender: 'સ્ત્રી',
    vibhagNo: '69',
    vibhagName: 'રાજકોટ પશ્ચિમ',
    wardNo: '',
    bhagNo: '1',
  },
  {
    serialNo: '28',
    epicNo: 'WMI1002368',
    voterName: 'કૃણાલભાઈ જોષી',
    relationType: 'માતાનું નામ',
    relativeName: 'શાંતાબેન જોષી',
    fatherName: '',
    husbandName: '',
    motherName: 'શાંતાબેન જોષી',
    otherRelative: '',
    houseNo: '52',
    age: '24',
    gender: 'પુરુષ',
    vibhagNo: '69',
    vibhagName: 'રાજકોટ પશ્ચિમ',
    wardNo: '',
    bhagNo: '1',
  },
  {
    serialNo: '29',
    epicNo: 'WMI1002369',
    voterName: 'અનિલભાઈ મકવાણા',
    relationType: 'પિતાનું નામ',
    relativeName: 'મગનભાઈ મકવાણા',
    fatherName: 'મગનભાઈ મકવાણા',
    husbandName: '',
    motherName: '',
    otherRelative: '',
    houseNo: '55',
    age: '43',
    gender: 'પુરુષ',
    vibhagNo: '69',
    vibhagName: 'રાજકોટ પશ્ચિમ',
    wardNo: '',
    bhagNo: '1',
  },
  {
    serialNo: '30',
    epicNo: 'WMI1002370',
    voterName: 'મીનાક્ષીબેન મકવાણા',
    relationType: 'પતિનું નામ',
    relativeName: 'અનિલભાઈ મકવાણા',
    fatherName: '',
    husbandName: 'અનિલભાઈ મકવાણા',
    motherName: '',
    otherRelative: '',
    houseNo: '55',
    age: '40',
    gender: 'સ્ત્રી',
    vibhagNo: '69',
    vibhagName: 'રાજકોટ પશ્ચિમ',
    wardNo: '',
    bhagNo: '1',
  },
];

/**
 * Converts HTML5 Canvas to Uint8Array PNG bytes
 */
function canvasToPngBytes(canvas: HTMLCanvasElement): Uint8Array {
  const dataUrl = canvas.toDataURL('image/png');
  const base64 = dataUrl.split(',')[1];
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Creates visual canvas for voter card pages with authentic Gujarati typography
 * Supports dynamic voter count (e.g. 1, 23, 27, 30 cards)
 */
function createVoterPageCanvas(
  pageNumber: number,
  voters: SampleVoterInfo[],
  cardCount: number = 30,
  startingSerial: number = (pageNumber - 3) * 30 + 1
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const w = 1190;
  const h = 1684;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  // Outer border
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 3;
  ctx.strokeRect(30, 30, w - 60, h - 60);

  // Header Banner
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(30, 30, w - 60, 65);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px "Noto Sans Gujarati", sans-serif';
  ctx.fillText('વિધાનસભા મત વિભાગનો નંબર અને નામ : 69 - રાજકોટ પશ્ચિમ', 50, 70);
  ctx.fillText('ભાગ નંબર : 1', w - 200, 70);

  // Section heading & Subtitle
  ctx.fillStyle = '#0f172a';
  ctx.font = '14px "Noto Sans Gujarati", sans-serif';
  ctx.fillText('વિભાગનો નંબર અને નામ : ૧-સ્લમ ક્વાર્ટર્સ શેરી-૧, રૈયાધાર, રૈયા રોડ, રૈયા-40, રાજકોટ', 50, 115);
  ctx.fillText(`મતદાર યાદી ૨૦૨૬ - પેજ ${pageNumber} (મતદારોની યાદી - ${cardCount} કાર્ડ્સ)`, 50, 133);

  // Draw voter card boxes (up to 30 slots: 3 columns x 10 rows)
  const cols = 3;
  const rows = 10;
  const startX = 45;
  const startY = 142;
  const cardW = (w - 90) / cols - 10;
  const cardH = (h - 190) / rows - 6;

  let drawnCount = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (drawnCount >= cardCount) {
        // Leave remaining grid slots empty white so visual detector identifies exact count
        continue;
      }

      const serial = startingSerial + drawnCount;
      const voter = voters[drawnCount % voters.length];
      const epic = voter.epicNo || `WMI10${serial.toString().padStart(4, '0')}`;

      const x = startX + c * (cardW + 10);
      const y = startY + r * (cardH + 6);

      // Card box
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, cardW, cardH);

      // Card Header (Serial + EPIC)
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(x + 1, y + 1, cardW - 2, 28);
      ctx.strokeStyle = '#cbd5e1';
      ctx.strokeRect(x + 1, y + 1, cardW - 2, 28);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 15px "Noto Sans Gujarati", sans-serif';
      ctx.fillText(`ક્રમ: ${serial}`, x + 8, y + 20);

      ctx.fillStyle = '#1e3a8a';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(epic, x + 110, y + 20);

      // Photo Box Placeholder
      ctx.strokeStyle = '#cbd5e1';
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(x + cardW - 75, y + 36, 68, 85);
      ctx.strokeRect(x + cardW - 75, y + 36, 68, 85);

      ctx.fillStyle = '#64748b';
      ctx.font = '11px "Noto Sans Gujarati", sans-serif';
      ctx.fillText('ફોટો', x + cardW - 55, y + 75);
      ctx.fillText('ઉપલબ્ધ છે', x + cardW - 68, y + 92);

      // Voter Details Text
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 13px "Noto Sans Gujarati", sans-serif';
      ctx.fillText(`મતદાર: ${voter.voterName}`, x + 8, y + 54);

      ctx.font = '12px "Noto Sans Gujarati", sans-serif';
      ctx.fillStyle = '#334155';
      ctx.fillText(`${voter.relationType}: ${voter.relativeName}`, x + 8, y + 76);
      ctx.fillText(`ઘર નં: ${voter.houseNo}`, x + 8, y + 98);
      ctx.fillText(`ઉંમર: ${voter.age}    જાતિ: ${voter.gender}`, x + 8, y + 120);

      drawnCount++;
    }
  }

  // Footer
  ctx.fillStyle = '#64748b';
  ctx.font = '13px "Noto Sans Gujarati", sans-serif';
  ctx.fillText(`પેજ ${pageNumber} / 36  •  વિધાનસભા મત વિભાગ: 69 - રાજકોટ પશ્ચિમ  •  ભાગ નંબર : 1`, w / 2 - 200, h - 35);

  return canvas;
}

/**
 * Creates visual canvas for Page 1 (Roll Summary)
 */
function createPage1Canvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 1190;
  canvas.height = 1684;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 1190, 1684);

  ctx.strokeStyle = '#1e3a8a';
  ctx.lineWidth = 4;
  ctx.strokeRect(30, 30, 1130, 1624);

  ctx.fillStyle = '#1e3a8a';
  ctx.font = 'bold 28px "Noto Sans Gujarati", sans-serif';
  ctx.fillText('ભારતનું ચૂંટણી પંચ - મતદાર યાદી ૨૦૨૬', 320, 120);

  ctx.font = 'bold 22px "Noto Sans Gujarati", sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('વિધાનસભા મત વિભાગનો નંબર અને નામ : 69 - રાજકોટ પશ્ચિમ', 150, 200);
  ctx.fillText('ભાગ નંબર : 1', 850, 200);

  ctx.fillStyle = '#475569';
  ctx.font = '18px "Noto Sans Gujarati", sans-serif';
  ctx.fillText('મુખપૃષ્ઠ - મતદાર સંક્ષિપ્ત વિગત (SUMMARY OF ELECTORAL ROLL)', 310, 260);

  // Summary Table Box
  ctx.strokeStyle = '#94a3b8';
  ctx.strokeRect(150, 320, 890, 380);

  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(151, 321, 888, 50);
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 18px "Noto Sans Gujarati", sans-serif';
  ctx.fillText('ઘટકવાર મતદાર વિગત', 480, 355);

  ctx.font = '16px "Noto Sans Gujarati", sans-serif';
  ctx.fillText('કુલ મતદારોની સંખ્યા: ૧૦૨૦ (Total Voters: 1020)', 200, 430);
  ctx.fillText('પુરુષ મતદારો: ૫૨૪ (Male Voters: 524)', 200, 480);
  ctx.fillText('સ્ત્રી મતદારો: ૪૯૬ (Female Voters: 496)', 200, 530);
  ctx.fillText('ત્રીજી જાતિ મતદારો: ૦ (Third Gender: 0)', 200, 580);

  ctx.fillStyle = '#b91c1c';
  ctx.font = 'bold 15px "Noto Sans Gujarati", sans-serif';
  ctx.fillText('નોંધ: આ પેજ પર મતદાર સંક્ષિપ્ત આંકડાકીય વિગત છે. વ્યક્તિગત મતદાર કાર્ડ નથી.', 200, 650);

  return canvas;
}

/**
 * Creates visual canvas for Page 2 (Map & Polling Station Details)
 */
function createPage2Canvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 1190;
  canvas.height = 1684;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 1190, 1684);

  ctx.strokeStyle = '#1e3a8a';
  ctx.lineWidth = 4;
  ctx.strokeRect(30, 30, 1130, 1624);

  ctx.fillStyle = '#1e3a8a';
  ctx.font = 'bold 24px "Noto Sans Gujarati", sans-serif';
  ctx.fillText('મતદાન મથક વિગત અને નકશો (POLLING STATION LOCATION & MAP)', 230, 100);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px "Noto Sans Gujarati", sans-serif';
  ctx.fillText('વિધાનસભા મત વિભાગનો નંબર અને નામ : 69 - રાજકોટ પશ્ચિમ', 100, 160);
  ctx.fillText('ભાગ નંબર : 1', 850, 160);

  // Map Box Area
  ctx.strokeStyle = '#64748b';
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(100, 200, 990, 600);
  ctx.strokeRect(100, 200, 990, 600);

  ctx.fillStyle = '#475569';
  ctx.font = 'bold 20px "Noto Sans Gujarati", sans-serif';
  ctx.fillText('[મતદાન મથક નકશો અને સીમારેખા આકૃતિ / MAP AREA]', 340, 500);

  ctx.fillStyle = '#1e293b';
  ctx.font = '16px "Noto Sans Gujarati", sans-serif';
  ctx.fillText('મતદાન મથકનું નામ: રાજકોટ મ્યુનિસિપલ પ્રાથમિક શાળા નં. ૨૮, શેરી નં. ૪, રાજકોટ', 120, 850);
  ctx.fillText('સ્થાન: પશ્ચિમ વિભાગ, રાજકોટ મહાનગરપાલિકા', 120, 890);

  ctx.fillStyle = '#b91c1c';
  ctx.font = 'bold 15px "Noto Sans Gujarati", sans-serif';
  ctx.fillText('નોંધ: આ પેજ પર માત્ર મતદાન મથક અને નકશો છે. વ્યક્તિગત મતદાર કાર્ડ નથી.', 120, 950);

  return canvas;
}

/**
 * Creates visual canvas for Page 36 (Final Roll Summary Table - 0 voter cards)
 */
function createPage36Canvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 1190;
  canvas.height = 1684;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 1190, 1684);

  ctx.strokeStyle = '#1e3a8a';
  ctx.lineWidth = 4;
  ctx.strokeRect(30, 30, 1130, 1624);

  ctx.fillStyle = '#1e3a8a';
  ctx.font = 'bold 26px "Noto Sans Gujarati", sans-serif';
  ctx.fillText('ભારતનું ચૂંટણી પંચ - મતદાર યાદી ૨૦૨૬ (આખરી સારાંશ)', 290, 120);

  ctx.font = 'bold 20px "Noto Sans Gujarati", sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('વિધાનસભા મત વિભાગનો નંબર અને નામ : 69 - રાજકોટ પશ્ચિમ', 150, 190);
  ctx.fillText('ભાગ નંબર : 1', 850, 190);

  ctx.fillStyle = '#475569';
  ctx.font = '18px "Noto Sans Gujarati", sans-serif';
  ctx.fillText('પેજ ૩૬: આખરી સંક્ષિપ્ત વિગત (SUMMARY OF ELECTORAL ROLL - FINAL)', 250, 250);

  // Summary Table Box
  ctx.strokeStyle = '#94a3b8';
  ctx.strokeRect(150, 320, 890, 420);

  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(151, 321, 888, 50);
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 18px "Noto Sans Gujarati", sans-serif';
  ctx.fillText('ઘટકવાર મતદાર વિગત (Roll Summary Table)', 440, 355);

  ctx.font = '16px "Noto Sans Gujarati", sans-serif';
  ctx.fillText('કુલ મતદારોની સંખ્યા: ૮૯૩ (Total Voters: 893)', 200, 430);
  ctx.fillText('પુરુષ મતદારો: ૪૬૦ (Male Voters: 460)', 200, 490);
  ctx.fillText('સ્ત્રી મતદારો: ૪૩૩ (Female Voters: 433)', 200, 550);
  ctx.fillText('ત્રીજી જાતિ મતદારો: ૦ (Third Gender: 0)', 200, 610);
  ctx.fillText('આખરી ક્રમ નંબર: ૧ થી ૮૯૩ (Serial Range: 1 to 893)', 200, 670);

  ctx.fillStyle = '#b91c1c';
  ctx.font = 'bold 15px "Noto Sans Gujarati", sans-serif';
  ctx.fillText('નોંધ: આ પેજ પર મતદાર સંક્ષિપ્ત આંકડાકીય વિગત છે. વ્યક્તિગત મતદાર કાર્ડ નથી.', 200, 780);

  return canvas;
}

/**
 * Creates the exact 36-page PDF document specified in user prompt
 * File: 2026-EROLLGEN-S06-69-SIR-FinalRoll-Revision1-GUJ-1-WI.pdf
 * Dynamic voter counts per page:
 * - Page 1: summary (0 cards)
 * - Page 2: map (0 cards)
 * - Pages 3 to 30: 30 cards each (840 cards)
 * - Page 31: 1 card (serial 841)
 * - Page 32: 23 cards (serials 842-864)
 * - Page 33: 2 cards (serials 865-866)
 * - Page 34: 0 cards (supplementary notice)
 * - Page 35: 27 cards (serials 867-893)
 * - Page 36: summary table (0 cards)
 * Total: 893 voters
 */
export async function generateAcceptanceSamplePdf(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Pre-render canvases for Pages 1, 2, and 36
  const p1Canvas = createPage1Canvas();
  const p1PngBytes = canvasToPngBytes(p1Canvas);
  const p1Image = await pdfDoc.embedPng(p1PngBytes);

  const p2Canvas = createPage2Canvas();
  const p2PngBytes = canvasToPngBytes(p2Canvas);
  const p2Image = await pdfDoc.embedPng(p2PngBytes);

  const p36Canvas = createPage36Canvas();
  const p36PngBytes = canvasToPngBytes(p36Canvas);
  const p36Image = await pdfDoc.embedPng(p36PngBytes);

  // Render 36 pages
  let currentSerial = 1;
  for (let pageIdx = 1; pageIdx <= 36; pageIdx++) {
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    if (pageIdx === 1) {
      page.drawImage(p1Image, { x: 0, y: 0, width, height });
      page.drawText('ELECTION COMMISSION OF INDIA - ELECTORAL ROLL 2026', {
        x: 60,
        y: height - 50,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      });
      page.drawText('Assembly Constituency: 69 - Rajkot West', {
        x: 60,
        y: height - 70,
        size: 9,
        font: font,
      });
      page.drawText('Part No: 1', {
        x: 400,
        y: height - 70,
        size: 9,
        font: font,
      });
      page.drawText('SUMMARY OF ELECTORAL ROLL (Total Voters: 893)', {
        x: 60,
        y: height - 100,
        size: 9,
        font: regularFont,
      });
      continue;
    }

    if (pageIdx === 2) {
      page.drawImage(p2Image, { x: 0, y: 0, width, height });
      page.drawText('POLLING STATION LOCATION & MAP AREA', {
        x: 60,
        y: height - 50,
        size: 10,
        font: font,
      });
      page.drawText('Assembly Constituency: 69 - Rajkot West', {
        x: 60,
        y: height - 70,
        size: 9,
        font: font,
      });
      page.drawText('Part No: 1', {
        x: 400,
        y: height - 70,
        size: 9,
        font: font,
      });
      continue;
    }

    if (pageIdx === 36) {
      // Page 36: Final summary table
      page.drawImage(p36Image, { x: 0, y: 0, width, height });
      page.drawText('Assembly Constituency: 69 - Rajkot West', {
        x: 30,
        y: height - 35,
        size: 8,
        font: font,
      });
      page.drawText('Part No: 1', {
        x: width - 110,
        y: height - 35,
        size: 8,
        font: font,
      });
      page.drawText('SUMMARY OF ELECTORAL ROLL - FINAL (Total Voters: 893)', {
        x: 60,
        y: height - 60,
        size: 8,
        font: regularFont,
      });
      continue;
    }

    // Determine dynamic voter count for pageIdx
    let cardCount = 30;
    if (pageIdx <= 30) {
      cardCount = 30;
    } else if (pageIdx === 31) {
      cardCount = 1; // 1 voter card
    } else if (pageIdx === 32) {
      cardCount = 23; // 23 voter cards
    } else if (pageIdx === 33) {
      cardCount = 2; // 2 voter cards
    } else if (pageIdx === 34) {
      cardCount = 0; // 0 cards (supplementary notice)
    } else if (pageIdx === 35) {
      cardCount = 27; // Exactly 27 cards (serials 867 to 893)
    }

    const voterCanvas = createVoterPageCanvas(pageIdx, SAMPLE_PAGE_3_VOTERS, cardCount, currentSerial);
    currentSerial += cardCount;

    const voterPngBytes = canvasToPngBytes(voterCanvas);
    const voterImage = await pdfDoc.embedPng(voterPngBytes);

    // Draw visual image
    page.drawImage(voterImage, { x: 0, y: 0, width, height });

    // Embed WinAnsi-safe text layer for text extractors
    page.drawText('Assembly Constituency: 69 - Rajkot West', {
      x: 30,
      y: height - 35,
      size: 8,
      font: font,
    });
    page.drawText('Part No: 1', {
      x: width - 110,
      y: height - 35,
      size: 8,
      font: font,
    });
    page.drawText(`Page ${pageIdx} of 36`, {
      x: width / 2 - 25,
      y: 15,
      size: 7,
      font: regularFont,
    });
  }

  return await pdfDoc.save();
}

/**
 * Creates a second sample PDF to test multi-PDF aggregation (Test 7)
 * File: 2026-EROLLGEN-S06-68-SIR-FinalRoll-Revision1-GUJ-2-WI.pdf
 * Vibhag: 68 - રાજકોટ પૂર્વ, Bhag: 2, 5 pages
 */
export async function generateSecondSamplePdf(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (let pageIdx = 1; pageIdx <= 5; pageIdx++) {
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    // Create Canvas for Rajkot East
    const canvas = document.createElement('canvas');
    canvas.width = 1190;
    canvas.height = 1684;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1190, 1684);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.strokeRect(30, 30, 1130, 1624);

    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(30, 30, 1130, 65);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px "Noto Sans Gujarati", sans-serif';
    ctx.fillText('વિધાનસભા મત વિભાગનો નંબર અને નામ : 68 - રાજકોટ પૂર્વ', 50, 70);
    ctx.fillText('ભાગ નંબર : 2', 950, 70);

    if (pageIdx === 1) {
      ctx.fillStyle = '#0f172a';
      ctx.font = '18px "Noto Sans Gujarati", sans-serif';
      ctx.fillText('મુખપૃષ્ઠ - મતદાર સંક્ષિપ્ત વિગત (SUMMARY OF ELECTORAL ROLL)', 300, 200);
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.font = '16px "Noto Sans Gujarati", sans-serif';
      ctx.fillText(`મતદાર કાર્ડ પેજ ${pageIdx} (૬૮ - રાજકોટ પૂર્વ, ભાગ ૨)`, 50, 130);
    }

    const pngBytes = canvasToPngBytes(canvas);
    const embeddedImg = await pdfDoc.embedPng(pngBytes);
    page.drawImage(embeddedImg, { x: 0, y: 0, width, height });

    // Safe WinAnsi Latin text layer
    page.drawText('Assembly Constituency: 68 - Rajkot East', {
      x: 30,
      y: height - 35,
      size: 8,
      font: font,
    });
    page.drawText('Part No: 2', {
      x: width - 110,
      y: height - 35,
      size: 8,
      font: font,
    });
  }

  return await pdfDoc.save();
}
