import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser with 20MB limit for high-res bill images
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Initialize GoogleGenAI server-side with User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

function formatINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0';
  return `₹${Math.round(Number(amount)).toLocaleString('en-IN')}`;
}

// API: Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// API: AI Medical Bill Analyzer
app.post('/api/gemini/analyze-bill', async (req, res) => {
  try {
    const { imageBase64, mimeType, filename } = req.body;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid image/document data in request body.',
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        success: false,
        error: 'GEMINI_API_KEY is not configured on the server. Please check the Secrets panel in AI Studio.',
      });
    }

    // Determine resolved MIME type
    let resolvedMimeType = (mimeType || '').toLowerCase();
    if (imageBase64.startsWith('data:')) {
      const match = imageBase64.match(/^data:([^;]+);base64,/i);
      if (match && match[1]) {
        resolvedMimeType = match[1].toLowerCase();
      }
    }
    if (resolvedMimeType === 'image/jpg') resolvedMimeType = 'image/jpeg';
    if (!resolvedMimeType) resolvedMimeType = 'image/jpeg';

    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!ALLOWED_MIME_TYPES.includes(resolvedMimeType)) {
      return res.status(400).json({
        success: false,
        error: `Unsupported file format (${resolvedMimeType}). Supported formats are JPG, JPEG, PNG, and PDF.`,
      });
    }

    // Clean base64 string
    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/i, '').trim();
    if (!cleanBase64) {
      return res.status(400).json({
        success: false,
        error: 'Corrupted or empty file data. Please re-upload your medical bill.',
      });
    }

    // File size check: approx limit 20MB
    const approxBytes = (cleanBase64.length * 3) / 4;
    if (approxBytes > 20 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: 'File size exceeds 20MB limit. Please upload a smaller or compressed document.',
      });
    }

    const systemPrompt = `You are an expert AI Medical Bill & Receipt Auditor specializing in Indian healthcare invoices, pharmacy cash memos, diagnostic lab receipts, doctor OPD slips, and hospital bills.

YOUR OBJECTIVE:
Accurately read and extract itemized line items, provider/pharmacy details, billing dates, patient name (if visible), and financial totals from the provided medical bill or receipt.

MANDATORY EXTRACTION RULES:
1. ACCURACY & ZERO HALLUCINATION:
   - Never invent or fabricate any missing details.
   - If a field is not visible, missing, or unreadable on the document, use null.
   - For vendorName, billDate, invoiceNumber, patientName, taxAmount, discountAmount, unitPrice: return null if not present or unreadable.
2. PATIENT PRIVACY:
   - Extract patientName ONLY if clearly written on the bill. If absent, return null.
   - Never extract or store sensitive government IDs (Aadhaar, PAN) or complete home addresses.
3. ITEMIZATION & LINE ITEMS:
   - Extract each distinct medicine, laboratory test, doctor consultation, or hospital service as an individual line item.
   - For each item, provide:
     * description: Name of medicine, test, or service (e.g. "Glycomet 500mg SR", "Complete Blood Count", "Cardiology OPD").
     * quantity: Number of units (default to 1 if not stated).
     * unitPrice: Price per unit in INR if shown, otherwise null.
     * amount: Total amount for this line item in INR.
4. DO NOT TREAT TOTALS AS LINE ITEMS:
   - NEVER add subtotal, tax/GST, discount, or invoice total as an individual line item in lineItems.
5. FINANCIAL TOTALS:
   - subtotal: Subtotal before tax/discount in INR, or null if not broken down.
   - taxAmount: Total GST/taxes in INR (CGST + SGST), or null if not separated.
   - discountAmount: Total discount in INR, or null if none.
   - totalAmount: Final payable bill/invoice total in INR.
6. DOCUMENT VALIDITY & READABILITY:
   - If the image is blurry, illegible, cut off, or too degraded to extract with confidence, set isReadable: false and explain why in confidenceNotes.
   - If the image is NOT a medical receipt/bill at all (e.g. restaurant food bill, travel ticket, random photo), set isMedicalBill: false and explain why in confidenceNotes.
7. CATEGORIES:
   - Choose strictly one of: "Medicines", "Doctor Consultation", "Laboratory Tests", "Hospitalization", "Other".`;

    const requestPayload = {
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: resolvedMimeType,
              data: cleanBase64,
            },
          },
          {
            text: 'Carefully inspect this healthcare bill or medical receipt. Extract the provider/pharmacy name, invoice date, bill number, patient name (if visible), itemized medicines/services with quantity and amounts, taxes, discounts, and the final bill total. Validate all calculations.',
          },
        ],
      },
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isMedicalBill: {
              type: Type.BOOLEAN,
              description: 'True if the document is a healthcare, pharmacy, lab, clinic, or hospital receipt/bill.',
            },
            isReadable: {
              type: Type.BOOLEAN,
              description: 'True if text and amounts are legible enough to extract accurately, false if blurry or unreadable.',
            },
            vendorName: {
              type: Type.STRING,
              description: 'Name of the pharmacy, hospital, clinic, diagnostic lab, or doctor, or null if missing.',
            },
            billDate: {
              type: Type.STRING,
              description: 'Date of invoice in YYYY-MM-DD format if discernable, or as written, or null if missing.',
            },
            invoiceNumber: {
              type: Type.STRING,
              description: 'Invoice, memo, or receipt number, or null if not visible.',
            },
            patientName: {
              type: Type.STRING,
              description: 'Patient name if visible and stated on receipt, or null.',
            },
            category: {
              type: Type.STRING,
              description: 'Primary healthcare category: Medicines, Doctor Consultation, Laboratory Tests, Hospitalization, or Other.',
            },
            lineItems: {
              type: Type.ARRAY,
              description: 'Itemized list of medicines, diagnostic tests, consultations, or hospital services. Do not include invoice total.',
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING, description: 'Name of medicine, test, or service' },
                  quantity: { type: Type.NUMBER, description: 'Quantity purchased or 1' },
                  unitPrice: { type: Type.NUMBER, description: 'Unit price in INR if given, otherwise null' },
                  amount: { type: Type.NUMBER, description: 'Total amount for this line item in INR' },
                },
                required: ['description', 'amount'],
              },
            },
            subtotal: {
              type: Type.NUMBER,
              description: 'Subtotal before tax/discount in INR, or null if not broken down.',
            },
            taxAmount: {
              type: Type.NUMBER,
              description: 'GST or tax amount in INR, or null if not stated.',
            },
            discountAmount: {
              type: Type.NUMBER,
              description: 'Discount amount in INR, or null if none.',
            },
            totalAmount: {
              type: Type.NUMBER,
              description: 'Final bill total amount payable in INR.',
            },
            confidenceNotes: {
              type: Type.STRING,
              description: 'Auditor notes on extraction verification, readability, or reasons if invalid.',
            },
          },
          required: ['isMedicalBill', 'isReadable', 'category', 'lineItems', 'totalAmount', 'confidenceNotes'],
        },
      },
    };

    let response: any;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        ...requestPayload,
      });
    } catch (primaryErr: any) {
      console.warn('Primary model gemini-3.8-flash failed, trying fallback gemini-flash-latest:', primaryErr?.message || primaryErr);
      response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        ...requestPayload,
      });
    }

    const text = response.text || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(text);
    } catch {
      return res.status(500).json({
        success: false,
        error: 'Failed to parse AI model response as structured JSON. Please retry.',
        raw: text,
      });
    }

    // Validate that document is a medical bill
    if (parsedData.isMedicalBill === false) {
      return res.status(422).json({
        success: false,
        error:
          parsedData.confidenceNotes ||
          'The uploaded document does not appear to be a medical bill, pharmacy receipt, or healthcare invoice. Please upload a valid medical receipt.',
        data: parsedData,
      });
    }

    // Validate readability
    if (parsedData.isReadable === false) {
      return res.status(422).json({
        success: false,
        error:
          parsedData.confidenceNotes ||
          'The uploaded bill is blurry, illegible, or unreadable. Please upload a clearer photograph or PDF.',
        data: parsedData,
      });
    }

    // Verify mathematical consistency
    const rawItems = Array.isArray(parsedData.lineItems) ? parsedData.lineItems : [];
    const itemsSum = rawItems.reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0);
    const totalAmount = Number(parsedData.totalAmount) || itemsSum || 0;
    const tax = Number(parsedData.taxAmount) || 0;
    const discount = Number(parsedData.discountAmount) || 0;

    const discrepancy = Math.abs(itemsSum - totalAmount);
    // Allow discrepancy if tax or discount was added/subtracted
    const isMathConsistent =
      discrepancy < 1.0 ||
      Math.abs(itemsSum + tax - discount - totalAmount) < 1.0;

    return res.json({
      success: true,
      data: {
        ...parsedData,
        lineItems: rawItems,
        itemsSum: Math.round(itemsSum * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
        isMathConsistent,
        discrepancy: Math.round(discrepancy * 100) / 100,
        filename,
      },
    });
  } catch (error: any) {
    console.error('Error analyzing bill with Gemini:', error);

    let rawErrorMessage = error?.message || 'An unexpected error occurred while analyzing the medical bill.';
    if (typeof rawErrorMessage === 'string' && rawErrorMessage.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(rawErrorMessage.trim());
        if (parsed?.error?.message) {
          rawErrorMessage = parsed.error.message;
        }
      } catch {}
    }

    const isApiKeyError =
      rawErrorMessage.includes('API key') ||
      rawErrorMessage.includes('403') ||
      rawErrorMessage.includes('PERMISSION_DENIED') ||
      rawErrorMessage.includes('API_KEY_INVALID');
    const isRateLimitError =
      rawErrorMessage.includes('429') ||
      rawErrorMessage.includes('RESOURCE_EXHAUSTED') ||
      rawErrorMessage.includes('high demand') ||
      rawErrorMessage.includes('UNAVAILABLE') ||
      rawErrorMessage.includes('503');

    let userFacingMessage = rawErrorMessage;
    let statusCode = 500;

    if (isApiKeyError) {
      statusCode = 503;
      userFacingMessage =
        'Gemini API authentication failed. Please verify that your GEMINI_API_KEY is configured in the AI Studio Settings > Secrets panel.';
    } else if (isRateLimitError) {
      statusCode = 429;
      userFacingMessage =
        'The AI model is experiencing high demand or temporary quota limits. Please wait a few seconds before retrying.';
    } else if (rawErrorMessage.includes('timeout') || rawErrorMessage.includes('ECONNRESET')) {
      statusCode = 504;
      userFacingMessage =
        'The request to the Gemini API timed out. Please check your network connection and retry.';
    }

    return res.status(statusCode).json({
      success: false,
      error: userFacingMessage,
    });
  }
});

// API: AI Financial Assistant (MediPaisa Financial Assistant)
app.post('/api/gemini/copilot', async (req, res) => {
  console.log('[COPILOT REQUEST RECEIVED]', req.body?.question);
  try {
    const { question, history = [], context } = req.body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ error: 'Question is required and cannot be empty.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'MISSING_API_KEY',
        message:
          'GEMINI_API_KEY is not configured on the server. Please configure your Gemini API key in the AI Studio Settings > Secrets panel.',
      });
    }

    const {
      expenses = [],
      monthlyBudget = 15000,
      currentMonthTotal = 0,
      previousMonthTotal = 0,
      monthOverMonthChangePercent = 0,
      budgetRemaining = 0,
      budgetUtilizationPercent = 0,
      budgetStatus = 'safe',
      categoryTotals = {},
      previousCategoryTotals = {},
      categoryChanges = {},
      categoryPercentages = {},
      topExpense = null,
      topCategory = '',
      totalTrackedSpend = 0,
      totalRecordCount = 0,
      isSampleData = false,
      monthlyTrends = [],
    } = context || {};

    const systemInstruction = `You are "MediPaisa Financial Assistant", the dedicated healthcare financial planning assistant for Indian users, families, and students.

YOUR IDENTITY & ROLE:
- Name: MediPaisa Financial Assistant.
- Role: Help Indian users track, understand, and plan their family healthcare spending and monthly medical budgets.
- Tone: Empathetic, simple, encouraging, transparent, and financially grounded. Explain financial terms in plain, accessible English.
- Currency: Always use the Indian Rupee symbol (₹) and Indian numbering system (e.g., ₹1,250, ₹15,000, ₹1,50,000).

CORE FINANCIAL RESPONSIBILITIES:
1. Explain healthcare spending clearly and break down calculations step-by-step.
2. Analyze monthly expenses and compare current spending against the monthly budget.
3. Identify top spending categories and highlight which categories or expenses increased or decreased.
4. Provide practical savings suggestions tailored to Indian healthcare realities:
   - Chronic maintenance medicine savings via PMBJP (Pradhan Mantri Bhartiya Janaushadhi Pariyojana) generic medicines (potential 50%–80% savings on standard hypertension, diabetes, and cholesterol prescriptions like Metformin, Telmisartan, Atorvastatin).
   - Indian Income Tax Section 80D tax planning (deductions for family health insurance & up to ₹5,000 for preventative health checkups).
   - Bundled diagnostic health checkup packages vs. individual test bookings.
   - Hospital OPD follow-up policy awareness (many private clinics offer complimentary 7-day follow-ups).
   - Maintaining a dedicated liquid healthcare emergency buffer of 3 to 6 months of expenses (or ₹1.5L to ₹3L).
5. If calculating future monthly estimates or projections, CLEARLY label them as estimates or predictions, not guaranteed outcomes (e.g., "Estimate/Projection: At your current daily run-rate of ₹X/day, projected spend is ₹Y").

REAL USER DATA INTEGRATION (STRICT RULES):
- You MUST answer questions using the exact numbers and records provided in USER FINANCIAL CONTEXT below.
- NEVER invent, hallucinate, or fabricate transactions, amounts, budgets, or historical records.
- If data is empty or unavailable (e.g., no expenses recorded this month or zero records), state clearly: "You currently have no recorded expenses in your ledger. Please add your medical bills or use the AI Bill Scanner to record your expenses first."
- When asked "What is my total healthcare spending this month?", quote the exact current month total (₹${Number(currentMonthTotal).toLocaleString('en-IN')}).
- When asked "What is my biggest expense category?", state the exact highest category and its amount.
- When asked "How much of my budget remains?", state the exact remaining amount and utilization rate.
- When asked "Compare this month with last month" or "Which expenses increased?", use the provided comparison data accurately.

FINANCIAL SAFETY & COMPLIANCE (CRITICAL MANDATES):
- NEVER provide medical diagnoses, clinical advice, drug dosage modifications, or recommend stopping or changing prescribed medications. Always advise consulting a qualified doctor.
- Do NOT make unsupported or specific pharmacy-brand price claims without qualification.
- NEVER ask for bank PINs, OTPs, CVVs, netbanking passwords, or account numbers.
- Do NOT claim that you or MediPaisa can connect to or access the user's bank account.
- Protect user privacy; never share user expense details externally.

USER FINANCIAL CONTEXT:
- Monthly Budget: ₹${Number(monthlyBudget).toLocaleString('en-IN')}
- Current Month Healthcare Spend: ₹${Number(currentMonthTotal).toLocaleString('en-IN')}
- Previous Month Healthcare Spend: ₹${Number(previousMonthTotal).toLocaleString('en-IN')}
- Month-over-Month Change: ${monthOverMonthChangePercent}%
- Remaining Budget Cushion: ₹${Number(budgetRemaining).toLocaleString('en-IN')}
- Budget Utilization: ${budgetUtilizationPercent}% (${budgetStatus})
- Top Expense Category: ${topCategory || 'N/A'}
- Current Category Breakdown: ${JSON.stringify(categoryTotals)}
- Previous Month Category Breakdown: ${JSON.stringify(previousCategoryTotals)}
- Category Changes (Current vs Previous): ${JSON.stringify(categoryChanges)}
- Category Percentages: ${JSON.stringify(categoryPercentages)}
- Total All-Time Tracked Spend: ₹${Number(totalTrackedSpend).toLocaleString('en-IN')} (${totalRecordCount} expenses)
- Data Source: ${isSampleData ? 'Demo/Sample Indian Family Records' : 'User Personal Records'}
- Recent Expense Items: ${JSON.stringify(
        expenses.slice(0, 10).map((e: any) => ({
          name: e.name,
          amount: e.amount,
          category: e.category,
          date: e.date,
          vendor: e.vendor || 'N/A',
        }))
      )}
- 6-Month Monthly Totals: ${JSON.stringify(monthlyTrends)}`;

    const contents: any[] = [];

    // Add prior conversation history (last 8 turns)
    if (Array.isArray(history) && history.length > 0) {
      for (const msg of history.slice(-8)) {
        if (msg.role && msg.content && typeof msg.content === 'string') {
          contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
          });
        }
      }
    }

    // Add current user prompt
    contents.push({
      role: 'user',
      parts: [{ text: question.trim() }],
    });

    let reply = '';
    let responseSource: 'live_gemini' | 'rule_engine' = 'live_gemini';
    let responseModel = 'gemini-3.8-flash';
    let apiDebugReason = '';

    const withTimeout = (promise: Promise<any>, ms = 8000) => {
      return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('GEMINI_TIMEOUT')), ms)),
      ]);
    };

    try {
      const response: any = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
        }),
        8000
      );
      reply = response.text || '';
      responseSource = 'live_gemini';
      responseModel = 'gemini-3.8-flash';
    } catch (primaryErr: any) {
      console.error('[PRIMARY_ERROR]:', primaryErr?.message || primaryErr);
      try {
        const fallbackResponse: any = await withTimeout(
          ai.models.generateContent({
            model: 'gemini-flash-latest',
            contents,
            config: {
              systemInstruction,
            },
          }),
          5000
        );
        reply = fallbackResponse.text || '';
        responseSource = 'live_gemini';
        responseModel = 'gemini-flash-latest';
      } catch (fallbackErr: any) {
        console.error('[FALLBACK_ERROR]:', fallbackErr?.message || fallbackErr);
        responseSource = 'rule_engine';
        responseModel = 'ledger-rule-engine';
        apiDebugReason = primaryErr?.message || fallbackErr?.message || 'High demand or timeout';
        
        // Intelligent grounded response based on actual data
        const qLower = question.toLowerCase();
        const formattedCurrent = `₹${Number(currentMonthTotal).toLocaleString('en-IN')}`;
        const formattedBudget = `₹${Number(monthlyBudget).toLocaleString('en-IN')}`;
        const formattedRemaining = `₹${Number(budgetRemaining).toLocaleString('en-IN')}`;
        const formattedPrev = `₹${Number(previousMonthTotal).toLocaleString('en-IN')}`;

        if (totalRecordCount === 0 || expenses.length === 0) {
          reply = `Namaste! Based on your current records, you have not entered any healthcare expenses yet.

To get started:
• Use the **AI Bill Scanner** tab to scan an Indian pharmacy or hospital bill, or
• Click **+ Add Expense** to record your medical fees.

Once you record your bills, I can analyze your spending patterns, track your budget, and calculate savings opportunities!`;
        } else if (qLower.includes('total') || qLower.includes('spending') || qLower.includes('spent') || qLower.includes('summary')) {
          reply = `### Monthly Healthcare Spending Summary

Based on your actual recorded transactions:
• **Total Healthcare Spend This Month:** ${formattedCurrent}
• **Allocated Monthly Budget:** ${formattedBudget}
• **Remaining Budget Cushion:** ${formattedRemaining} (${budgetUtilizationPercent}% utilized)
• **Top Spending Category:** **${topCategory || 'Medicines'}** (${formatINR(categoryTotals[topCategory] || 0)})

**Category-Wise Breakdown:**
${Object.entries(categoryTotals)
  .filter(([_, amt]: any) => amt > 0)
  .map(([cat, amt]: any) => `• **${cat}:** ${formatINR(amt)} (${categoryPercentages[cat] || 0}%)`)
  .join('\n')}

**Financial Insight:**
Your current daily spend rate is approx **₹${Math.round(currentMonthTotal / Math.max(1, new Date().getDate()))}/day**. 
*Estimate/Projection based on current run rate: not a guaranteed outcome.*`;
        } else if (qLower.includes('budget') || qLower.includes('remain') || qLower.includes('limit')) {
          reply = `### Healthcare Budget Utilization Review

• **Monthly Budget Cap:** ${formattedBudget}
• **Current Utilization:** ${formattedCurrent} (${budgetUtilizationPercent}%)
• **Remaining Cushion:** ${formattedRemaining}
• **Budget Health Status:** **${
            budgetUtilizationPercent >= 100
              ? 'Exceeded Budget Cap ⚠️'
              : budgetUtilizationPercent >= 80
              ? 'Warning Threshold (>80%) ⚠️'
              : 'On Track & Healthy ✅'
          }**

${
  budgetRemaining > 0
    ? `You have ${formattedRemaining} available for the rest of this month. Recommended daily ceiling: approx **₹${Math.round(
        budgetRemaining / Math.max(1, 30 - new Date().getDate())
      )}/day**.`
    : `Your spending has exceeded the monthly cap by **₹${Math.abs(monthlyBudget - currentMonthTotal).toLocaleString(
        'en-IN'
      )}**. Discretionary or non-urgent outpatient checkups should be planned carefully.`
}`;
        } else if (qLower.includes('increase') || qLower.includes('compare') || qLower.includes('last month')) {
          const changedEntries = Object.entries(categoryChanges)
            .filter(([_, v]: any) => v.diff !== 0)
            .map(([cat, v]: any) => `• **${cat}:** ${formatINR(v.current)} vs ${formatINR(v.previous)} last month (${v.diff >= 0 ? '+' : ''}${formatINR(v.diff)} • ${v.percentChange}%)`);

          reply = `### Month-over-Month Healthcare Spend Comparison

• **This Month (${new Date().toLocaleDateString('en-IN', { month: 'short' })}):** ${formattedCurrent}
• **Last Month:** ${formattedPrev}
• **Overall Trajectory:** ${
            monthOverMonthChangePercent > 0
              ? `Increased by +${monthOverMonthChangePercent}%`
              : monthOverMonthChangePercent < 0
              ? `Decreased by ${monthOverMonthChangePercent}%`
              : 'Flat (0% change)'
          }

**Category Shifts:**
${changedEntries.length > 0 ? changedEntries.join('\n') : '• All categories are currently identical to last month.'}

**Key Finding:**
${topCategory ? `Your highest single cost driver continues to be **${topCategory}** (${formatINR(categoryTotals[topCategory] || 0)}).` : ''}`;
        } else if (qLower.includes('save') || qLower.includes('saving') || qLower.includes('opportunity') || qLower.includes('generic') || qLower.includes('tax') || qLower.includes('80d')) {
          reply = `### Practical Healthcare Savings Opportunities

1. **PMBJP Jan Aushadhi Generic Alternatives:**
   Your family spent **${formatINR(categoryTotals.Medicines || 0)}** on medicines this month. Pradhan Mantri Bhartiya Janaushadhi Pariyojana outlets offer generic maintenance drugs (Metformin, Telmisartan, Atorvastatin, Calcium) at **50%–80% lower cost** than branded equivalents. Ask your doctor if generic equivalents are appropriate for your prescriptions.

2. **Section 80D Income Tax Claims:**
   Under Indian tax regulations, preventive health checkups up to **₹5,000** for self/family qualify for tax deductions within Section 80D. You have **${formatINR(categoryTotals['Laboratory Tests'] || 0)}** in diagnostic tests that may qualify.

3. **OPD Follow-Up Windows:**
   Most hospital clinics (Max, Fortis, Apollo) offer a complimentary **7-day follow-up consultation window**. Always schedule diagnostic tests within this window to avoid duplicate consultation fees.

4. **Emergency Health Buffer:**
   Maintain a liquid reserve of **${formattedBudget} × 3 to 6 months** (or minimum ₹1.5 Lakhs) in high-liquidity funds to prevent emergency hospitalizations from disrupting family savings.`;
        } else {
          reply = `Namaste! Here is a financial summary of your current healthcare spending:

• **This Month's Medical Spend:** ${formattedCurrent} of **${formattedBudget}** budget (${budgetUtilizationPercent}% utilized)
• **Remaining Cushion:** ${formattedRemaining}
• **Top Cost Category:** **${topCategory || 'Medicines'}** (${formatINR(categoryTotals[topCategory] || 0)})
• **All-Time Records Audited:** ${totalRecordCount} medical bills (${formatINR(totalTrackedSpend)})

You can ask me to:
1. **Analyze My Expenses** (detailed breakdown)
2. **Check My Budget** (utilization pacing & limits)
3. **Find Saving Opportunities** (generic medicines & Section 80D)
4. **Compare This Month vs Last Month** (identify cost increases)`;
        }
      }
    }

    if (!reply) {
      reply = 'I apologize, but I could not formulate a response. Please try again.';
    }

    return res.json({
      success: true,
      answer: reply,
      source: responseSource,
      model: responseModel,
      rateLimitExceeded: apiDebugReason.includes('RESOURCE_EXHAUSTED') || apiDebugReason.includes('429'),
    });
  } catch (error: any) {
    console.error('Error in MediPaisa Financial Assistant API:', error);

    const errorMessage = error?.message || 'An error occurred while generating a response.';
    const isApiKeyError =
      errorMessage.includes('API key') ||
      errorMessage.includes('403') ||
      errorMessage.includes('PERMISSION_DENIED');

    return res.status(500).json({
      error: isApiKeyError ? 'API_KEY_ERROR' : 'API_ERROR',
      message: errorMessage,
    });
  }
});

// Configure Vite middleware in dev or serve static build in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MediPaisa AI] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
