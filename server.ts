import express from 'express';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Body parser with 50mb limit for PDF page images / batch data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Server-side Gemini AI setup
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Structured schema for voter extraction
const VoterCardSchema = {
  type: Type.OBJECT,
  properties: {
    serialNo: {
      type: Type.STRING,
      description: 'Original voter serial number printed on card (e.g. "1", "2", "30")',
    },
    epicNo: {
      type: Type.STRING,
      description: 'Original EPIC / voter ID number (e.g. "WMI1234567" or "GJ/03/020/123456"). Preserve letters and digits.',
    },
    voterName: {
      type: Type.STRING,
      description: 'Voter full name in original Gujarati script (e.g. "રમેશભાઈ પટેલ"). Do NOT translate to English.',
    },
    relationType: {
      type: Type.STRING,
      description: 'Relationship label printed in Gujarati: "પિતાનું નામ", "પતિનું નામ", "માતાનું નામ", or "અન્ય સંબંધી"',
    },
    relativeName: {
      type: Type.STRING,
      description: 'Name of the relative in Gujarati script',
    },
    fatherName: {
      type: Type.STRING,
      description: 'Populate if relative is explicitly father, in Gujarati script',
    },
    husbandName: {
      type: Type.STRING,
      description: 'Populate if relative is explicitly husband, in Gujarati script',
    },
    motherName: {
      type: Type.STRING,
      description: 'Populate if relative is explicitly mother, in Gujarati script',
    },
    otherRelative: {
      type: Type.STRING,
      description: 'Populate if relation is other relative, in Gujarati script',
    },
    houseNo: {
      type: Type.STRING,
      description: 'Complete house / flat / room / plot number and building / society name as printed after label (e.g. "12/A", "S.602", "ધીરજનગર શેરી નં. 1", "સર્વે નંબર એસ-401 એટલાન્ટિસ હિલ્સ", "પ્લોટ -426,સ્લમ ક્વાર્ટર", "મોમાઈ નગર ૩"). Preserve full text, NEVER truncate digits or Gujarati words.',
    },
    fullAddress: {
      type: Type.STRING,
      description: 'Complete combined address of the voter combining house/flat details with the section locality / street / area name (e.g. "12/A, ૧-સ્લમ ક્વાર્ટર્સ શેરી-૧, રૈયાધાર, રૈયા રોડ, રૈયા-40, રાજકોટ")',
    },
    age: {
      type: Type.STRING,
      description: 'Stated age on card (e.g. "45")',
    },
    gender: {
      type: Type.STRING,
      description: 'Explicit gender in Gujarati: "પુરુષ" or "સ્ત્રી"',
    },
    warnings: {
      type: Type.STRING,
      description: 'Any Gujarati warning flags if field is blurry or missing (e.g. "ઓળખપત્ર નંબર અસ્પષ્ટ છે")',
    },
  },
  required: ['serialNo', 'voterName', 'gender'],
};

const PageExtractionSchema = {
  type: Type.OBJECT,
  properties: {
    isVoterPage: {
      type: Type.BOOLEAN,
      description: 'True if page contains individual voter ID cards (grids/boxes). False if title page, summary statistics, or map.',
    },
    pageTypeGujarati: {
      type: Type.STRING,
      description: 'Description of page type in Gujarati (e.g. "મતદાર કાર્ડ પેજ", "મુખપૃષ્ઠ / સારાંશ", "નકશો / મતદાન મથક")',
    },
    vibhagNo: {
      type: Type.STRING,
      description: 'Assembly Constituency / Vibhag number from heading (e.g. "69")',
    },
    vibhagName: {
      type: Type.STRING,
      description: 'Assembly Constituency name in Gujarati script (e.g. "રાજકોટ પશ્ચિમ")',
    },
    bhagNo: {
      type: Type.STRING,
      description: 'Bhag number from heading (e.g. "1")',
    },
    wardNo: {
      type: Type.STRING,
      description: 'Explicit Ward number ONLY if clearly identified, otherwise empty string',
    },
    sectionName: {
      type: Type.STRING,
      description: 'Section name / locality / street printed in page header: "વિભાગનો નંબર અને નામ" (e.g. "૧-સ્લમ ક્વાર્ટર્સ શેરી-૧, રૈયાધાર, રૈયા રોડ, રૈયા-40, રાજકોટ")',
    },
    voters: {
      type: Type.ARRAY,
      items: VoterCardSchema,
      description: 'List of all voter cards found on this page in sequence',
    },
    pageWarnings: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Warnings in Gujarati about this page reading',
    },
  },
  required: ['isVoterPage', 'voters'],
};

// API Endpoint: Extract voter records from rendered page image using Gemini 3.8 Flash
app.post('/api/extract-page', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/png', pdfFileName, pageNumber, inheritedMetadata } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    if (!ai) {
      // Return helpful response if no API key configured in environment
      return res.status(503).json({
        error: 'Gemini API is not configured. Please verify GEMINI_API_KEY.',
        isFallbackAvailable: true,
      });
    }

    const promptText = `
You are an expert Gujarati electoral roll (મતદાર યાદી) data extraction engine.
Analyze this image of Page ${pageNumber} from PDF "${pdfFileName}".

CRITICAL INSTRUCTIONS:
1. Examine the page header:
   - Identify "વિધાનસભા મત વિભાગનો નંબર અને નામ :" e.g. "69 - રાજકોટ પશ્ચિમ" -> vibhagNo: "69", vibhagName: "રાજકોટ પશ્ચિમ"
   - Identify "ભાગ નંબર :" e.g. "9" or "8" or "5" or "1" -> bhagNo
   - Identify "વિભાગનો નંબર અને નામ :" e.g. "1-ઇન્દ્રિનગર મફતિયાપરા શેરી નં. 11, રૈયાધાર, રૈયા-38" -> sectionName
   - Identify "વોર્ડ નંબર :" ONLY if explicitly printed with a ward number. Otherwise leave wardNo as an empty string (""). NEVER copy the section address into wardNo!
   ${inheritedMetadata?.vibhagNo ? `If heading is absent or incomplete on this page, inherit vibhagNo="${inheritedMetadata.vibhagNo}", vibhagName="${inheritedMetadata.vibhagName}", bhagNo="${inheritedMetadata.bhagNo}".` : ''}

2. Determine if this page contains individual voter cards:
   - Page 1 has roll summary / statistics (isVoterPage: false, voters: []).
   - Page 2 has polling station map / boundary details / photo views (isVoterPage: false, voters: []).
   - Supplementary header pages (e.g. "ઘટક - 1 : વધારા યાદી - 1" or blank supplement pages with NO voter cards) MUST have isVoterPage: false, voters: [].
   - Last page has summary table (isVoterPage: false, voters: []).
   - If there are NO rectangular voter card boxes printed on this page, return isVoterPage: false and voters: []. NEVER generate fake voters!

3. If this is a voter card page:
   - DYNAMIC CARD COUNT: Look at the 3-column grid. Voter cards only exist where there is a distinct card box with photo placeholder ("ફોટો ઉપલબ્ધ"), serial number, EPIC number, and voter details.
   - PARTIAL PAGES: Extract ONLY the actual cards visible. Do NOT duplicate cards or generate cards for empty spaces!
   - EXACT SERIAL NUMBER (serialNo):
     * Extract the EXACT printed serial number in the top-left of each card (e.g. "1", "2", ... "61", ... "314", ... "583", "584", "585").
     * Keep serial numbers strictly in their printed sequence.
   - EXACT EPIC NUMBER (epicNo):
     * Extract the EXACT alphanumeric EPIC code in the top-right of each card (e.g. "WQT2797751", "JVT1986926", "WQT4437687", "GJ/04/019/225021", etc.).
     * Standard modern EPIC is exactly 3 capital letters + 7 digits. Do NOT append extra border marks or digits!
     * Every real voter has a distinct EPIC. NEVER duplicate or copy an EPIC from one card to another!
   - VOTER NAME (voterName):
     * Extract the voter's full name in original GUJARATI SCRIPT (e.g. "પદ્માબેન વાઘરી", "ધૈર્ય મનીષભાઈ ઠક્કર"). NEVER translate to English!
   - RELATIONSHIP & EXCLUSIVITY:
     * If card specifies "પિતાનું નામ", set relationType: "પિતાનું નામ", relativeName: father's name, fatherName: father's name, husbandName: "", motherName: "", otherRelative: "".
     * If card specifies "પતિનું નામ", set relationType: "પતિનું નામ", relativeName: husband's name, husbandName: husband's name, fatherName: "", motherName: "", otherRelative: "".
     * If card specifies "માતાનું નામ", set relationType: "માતાનું નામ", relativeName: mother's name, motherName: mother's name, fatherName: "", husbandName: "", otherRelative: "".
     * If card specifies "અન્ય", set relationType: "અન્ય સંબંધી", relativeName: other's name, otherRelative: other's name, fatherName: "", husbandName: "", motherName: "".
   - HOUSE NUMBER & FULL ADDRESS:
     * houseNo: Extract the complete house/flat/plot number printed after "ઘર નંબર :" label. If no house number is printed, return an empty string (""). NEVER use "25" or any placeholder!
     * fullAddress: Combine the voter's house number with the page's section/street header (e.g. "1, 1-ઇન્દ્રિનગર મફતિયાપરા શેરી નં. 11, રૈયાધાર, રૈયા-38").
   - AGE & GENDER:
     * age: Stated age (e.g. "44", "20").
     * gender: "પુરુષ" or "સ્ત્રી". If relation is "પતિનું નામ", the voter is female ("સ્ત્રી"). If voter name ends with male suffixes (ભાઈ, કુમાર, લાલ, સિંહ), verify they are "પુરુષ".
   - CRITICAL RULE ON EMPTY / INAPPLICABLE FIELDS:
     * When any field is empty, missing, or inapplicable, ALWAYS return an empty string ("").
     * NEVER, under any circumstances, output "25", "25/3", "N/A", "-", or any placeholder for empty fields!
`;

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    // Timeout after 90 seconds to allow full high-density page analysis without premature aborts
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini request timeout after 90s')), 90000)
    );

    const geminiPromise = ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: cleanBase64,
            },
          },
          {
            text: promptText,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: PageExtractionSchema,
      },
    });

    const response = await Promise.race([geminiPromise, timeoutPromise]);
    const responseText = response.text || '{}';
    const parsedData = JSON.parse(responseText);

    return res.json({
      success: true,
      data: parsedData,
      rawTokens: response.usageMetadata?.totalTokenCount,
    });
  } catch (error: any) {
    console.warn('Page extraction warning in /api/extract-page:', error?.message || error);
    return res.status(200).json({
      success: false,
      error: error.message || 'Page extraction failed',
      isFallbackAvailable: true,
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    geminiConfigured: !!ai,
    timestamp: new Date().toISOString(),
  });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
