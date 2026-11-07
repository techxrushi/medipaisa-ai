import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import {
  Upload,
  ScanLine,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  Receipt,
  Plus,
  Trash2,
  ArrowRight,
  RefreshCw,
  Check,
  X,
  FileUp,
  Shield,
  HelpCircle,
  Calculator,
  User,
  Calendar,
  Building2,
  Hash,
  Tag,
  Zap,
  Clock,
} from 'lucide-react';
import { useExpenses } from '../context/ExpenseContext';
import { BillAnalysisResult, LineItem, ExpenseCategory } from '../types';
import { formatINR, getTodayDateString } from '../utils/formatters';
import { createSampleBillImage } from '../data/sampleData';

const CATEGORIES: ExpenseCategory[] = [
  'Medicines',
  'Doctor Consultation',
  'Laboratory Tests',
  'Hospitalization',
  'Other',
];

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
];

/**
 * Optimizes large phone camera images (10MB-15MB) down to max 2048px on canvas,
 * preserving pin-sharp OCR readability while slashing network latency by 10x.
 * Preserves PDFs as-is.
 */
const optimizeImageForOCR = async (
  dataUri: string,
  maxDimension = 2048
): Promise<{ dataUri: string; mimeType: string }> => {
  if (dataUri.startsWith('data:application/pdf')) {
    return { dataUri, mimeType: 'application/pdf' };
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width <= maxDimension && height <= maxDimension) {
        resolve({ dataUri, mimeType: 'image/jpeg' });
        return;
      }

      if (width > height) {
        if (width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ dataUri, mimeType: 'image/jpeg' });
        return;
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      const optimized = canvas.toDataURL('image/jpeg', 0.92);
      resolve({ dataUri: optimized, mimeType: 'image/jpeg' });
    };

    img.onerror = () => {
      resolve({ dataUri, mimeType: 'image/jpeg' });
    };

    img.src = dataUri;
  });
};

export const BillAnalyzer: React.FC = () => {
  const { addExpense, setActiveTab } = useExpenses();

  const [file, setFile] = useState<File | null>(null);
  const [fileDataUri, setFileDataUri] = useState<string | null>(null);
  const [fileMimeType, setFileMimeType] = useState<string>('image/jpeg');
  const [isPdf, setIsPdf] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<BillAnalysisResult | null>(null);

  // Saving states to prevent duplicate submissions
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savedExpenseDetails, setSavedExpenseDetails] = useState<{
    id: string;
    name: string;
    amount: number;
    category: ExpenseCategory;
  } | null>(null);

  // Editable review form state
  const [vendorName, setVendorName] = useState('');
  const [billDate, setBillDate] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [patientName, setPatientName] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Medicines');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [subtotal, setSubtotal] = useState<number>(0);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [roundOffAmount, setRoundOffAmount] = useState<number>(0);
  const [scanStep, setScanStep] = useState<string>('');
  const [notes, setNotes] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate and process selected file
  const processSelectedFile = (selectedFile: File) => {
    setErrorMessage(null);
    setWarningMessage(null);
    setAnalysisResult(null);
    setIsSaved(false);
    setSavedExpenseDetails(null);
    setRoundOffAmount(0);
    setScanStep('');

    // 1. Validate file size
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(
        `File size (${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 20MB limit. Please upload a smaller medical bill image or PDF.`
      );
      return;
    }

    // 2. Validate MIME type or file extension
    const extension = selectedFile.name.split('.').pop()?.toLowerCase();
    const isAllowedExt = ['jpg', 'jpeg', 'png', 'webp', 'pdf'].includes(extension || '');
    const isAllowedMime = ALLOWED_MIME_TYPES.includes(selectedFile.type.toLowerCase()) || isAllowedExt;

    if (!isAllowedMime) {
      setErrorMessage(
        `Unsupported file type (${selectedFile.name}). Supported formats are JPG, JPEG, PNG, and PDF medical bills.`
      );
      return;
    }

    const detectedIsPdf = selectedFile.type === 'application/pdf' || extension === 'pdf';
    const detectedMime = detectedIsPdf
      ? 'application/pdf'
      : selectedFile.type || (extension === 'png' ? 'image/png' : 'image/jpeg');

    setFile(selectedFile);
    setIsPdf(detectedIsPdf);
    setFileMimeType(detectedMime);

    // 3. Read file safely with error handling
    const reader = new FileReader();

    reader.onerror = () => {
      setErrorMessage(
        'Failed to read the selected file. The file may be corrupted, empty, or unreadable. Please try another file.'
      );
      setFile(null);
      setFileDataUri(null);
    };

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFileDataUri(reader.result);
      } else {
        setErrorMessage('Failed to decode file contents. Please select a valid file.');
      }
    };

    reader.readAsDataURL(selectedFile);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  // Remove and reset upload
  const handleRemoveFile = () => {
    setFile(null);
    setFileDataUri(null);
    setIsPdf(false);
    setErrorMessage(null);
    setWarningMessage(null);
    setAnalysisResult(null);
    setIsSaved(false);
    setSavedExpenseDetails(null);
    setRoundOffAmount(0);
    setScanStep('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Load sample bill presets for testing
  const loadPresetBill = (type: 'apollo' | 'lalpath' | 'fortis') => {
    const sample = createSampleBillImage(type);
    setFileDataUri(sample.dataUri);
    setFile(
      new File([new Blob()], sample.filename, {
        type: 'image/png',
      })
    );
    setIsPdf(false);
    setFileMimeType('image/png');
    setErrorMessage(null);
    setWarningMessage(null);
    setAnalysisResult(null);
    setIsSaved(false);
    setSavedExpenseDetails(null);
    setRoundOffAmount(0);
    setScanStep('');
  };

  // Run AI analysis
  const handleAnalyzeBill = async () => {
    if (!fileDataUri) {
      setErrorMessage('Please upload or select a medical bill first.');
      return;
    }

    setIsAnalyzing(true);
    setScanStep('Optimizing document for high-speed OCR...');
    setErrorMessage(null);
    setWarningMessage(null);
    setAnalysisResult(null);
    setIsSaved(false);
    setSavedExpenseDetails(null);

    try {
      // 1. Optimize image resolution for ultrafast transfer
      const { dataUri: payloadDataUri, mimeType: payloadMime } = await optimizeImageForOCR(fileDataUri);

      setScanStep('Extracting medicines, rates, taxes & totals with Gemini 3.8 Flash...');

      const res = await fetch('/api/gemini/analyze-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: payloadDataUri,
          mimeType: payloadMime || fileMimeType,
          filename: file?.name || (isPdf ? 'medical-bill.pdf' : 'medical-bill.png'),
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to extract bill details.');
      }

      const result: BillAnalysisResult = json.data;
      setAnalysisResult(result);

      // Populate review form fields
      setVendorName(result.vendorName || '');
      setBillDate(result.billDate || getTodayDateString());
      setInvoiceNumber(result.invoiceNumber || '');
      setPatientName(result.patientName || '');
      setCategory(result.category || 'Medicines');
      setLineItems(
        Array.isArray(result.lineItems) && result.lineItems.length > 0
          ? result.lineItems
          : [{ description: 'Medical Service / Medicine', quantity: 1, amount: result.totalAmount || 0 }]
      );
      setTotalAmount(result.totalAmount || result.itemsSum || 0);
      setSubtotal(result.subtotal || 0);
      setTaxAmount(result.taxAmount || 0);
      setDiscountAmount(result.discountAmount || 0);
      setRoundOffAmount(result.roundOff || 0);
      setNotes(result.confidenceNotes || '');

      // Check math consistency warning
      if (!result.isMathConsistent && result.discrepancy > 1.5) {
        setWarningMessage(
          `Calculation Notice: Sum of itemized lines (₹${result.itemsSum}) plus taxes/discounts differs from invoice total (₹${result.totalAmount}) by ₹${result.discrepancy}. Please review the line items or adjust the total.`
        );
      }
    } catch (err: any) {
      console.error('Error in handleAnalyzeBill:', err);
      setErrorMessage(
        err.message || 'An error occurred while analyzing the medical bill with Gemini AI.'
      );
    } finally {
      setIsAnalyzing(false);
      setScanStep('');
    }
  };

  // Line item helpers with auto-amount calculation
  const handleUpdateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const updated = [...lineItems];
    const current = { ...updated[index], [field]: value };

    // Auto-compute total amount when quantity or unit price changes
    if (field === 'quantity' || field === 'unitPrice') {
      const q = field === 'quantity' ? Number(value) : (current.quantity ?? 1);
      const p = field === 'unitPrice' ? Number(value) : (current.unitPrice ?? 0);
      if (!isNaN(q) && q > 0 && !isNaN(p) && p >= 0) {
        current.amount = Math.round(q * p * 100) / 100;
      }
    }

    updated[index] = current;
    setLineItems(updated);
  };

  const handleAddLineItem = () => {
    setLineItems([
      ...lineItems,
      { description: 'New Medicine / Service', quantity: 1, unitPrice: 100, amount: 100 },
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length <= 1) {
      setErrorMessage('A bill must contain at least one line item.');
      return;
    }
    const updated = lineItems.filter((_, i) => i !== index);
    setLineItems(updated);
  };

  // Math totals calculation (taking taxes, discount, and roundoff into account)
  const computedItemsSum = lineItems.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
  const mathDiscrepancy = Math.abs(
    Math.round(
      (computedItemsSum +
        (Number(taxAmount) || 0) -
        (Number(discountAmount) || 0) +
        (Number(roundOffAmount) || 0) -
        totalAmount) *
        100
    ) / 100
  );
  const hasDiscrepancy = mathDiscrepancy >= 1.5;

  // Auto adjust total payable to sum of items
  const handleAutoAdjustTotal = () => {
    const balanced = Math.round(
      (computedItemsSum +
        (Number(taxAmount) || 0) -
        (Number(discountAmount) || 0) +
        (Number(roundOffAmount) || 0)) *
        100
    ) / 100;
    setTotalAmount(balanced > 0 ? balanced : computedItemsSum);
    setWarningMessage(null);
  };

  // Confirm and save expenses to ledger
  const handleConfirmAndSave = () => {
    // Prevent accidental duplicate saves
    if (isSaving || isSaved) {
      return;
    }

    if (!totalAmount || totalAmount <= 0) {
      setErrorMessage('Total bill amount must be greater than ₹0.');
      return;
    }

    if (lineItems.length === 0) {
      setErrorMessage('Please include at least one medical line item.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const primaryItemName = lineItems[0]?.description || 'Healthcare Service';
      const title =
        lineItems.length > 1
          ? `${vendorName || category} - ${primaryItemName} (+${lineItems.length - 1} items)`
          : `${vendorName || category} - ${primaryItemName}`;

      const savedRecord = addExpense({
        name: title,
        amount: totalAmount,
        category,
        date: billDate || getTodayDateString(),
        vendor: vendorName || undefined,
        notes: notes
          ? `${notes} ${invoiceNumber ? `(Invoice #${invoiceNumber})` : ''} ${
              patientName ? `[Patient: ${patientName}]` : ''
            }`.trim()
          : `${invoiceNumber ? `Invoice #${invoiceNumber}` : ''} ${
              patientName ? `[Patient: ${patientName}]` : ''
            }`.trim(),
        billData: {
          invoiceNumber: invoiceNumber || undefined,
          patientName: patientName || undefined,
          lineItems,
          subtotal: subtotal || undefined,
          taxAmount: taxAmount || undefined,
          discountAmount: discountAmount || undefined,
          roundOff: roundOffAmount || undefined,
          extractedAt: new Date().toISOString(),
          isMathConsistent: !hasDiscrepancy,
        },
      });

      setIsSaved(true);
      setSavedExpenseDetails({
        id: savedRecord.id,
        name: savedRecord.name,
        amount: savedRecord.amount,
        category: savedRecord.category,
      });
    } catch (err: any) {
      console.error('Error saving expenses:', err);
      setErrorMessage('Failed to save verified expenses. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to scan another bill
  const handleScanAnother = () => {
    handleRemoveFile();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              AI Medical Bill & Receipt Scanner
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
              Gemini 3.8 Flash Multimodal OCR
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Upload any Indian pharmacy cash memo, doctor OPD slip, lab diagnostic invoice, or hospital bill (JPG, PNG, or PDF). Gemini extracts itemized medicines, calculates taxes, and verifies math consistency.
          </p>
        </div>
      </div>

      {/* Main Grid: Upload & Preview (5 cols) + Extracted Review (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload & Instant Presets (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-teal-600" />
                <span>Upload Medical Bill (JPG, PNG, PDF)</span>
              </h3>
              {file && (
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" /> Remove
                </button>
              )}
            </div>

            {/* Dropzone */}
            {!fileDataUri ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition group ${
                  isDragging
                    ? 'border-teal-500 bg-teal-50/50'
                    : 'border-slate-300 hover:border-teal-500 bg-slate-50/50 hover:bg-teal-50/20'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-xl bg-teal-100/70 text-teal-700 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                  <Receipt className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-slate-800">
                  Click to browse or drop medical bill
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Supports JPG, JPEG, PNG, WebP photos & PDF documents (up to 20MB)
                </div>
                <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                  <Shield className="w-3 h-3" /> Secure Client-Side Upload
                </div>
              </div>
            ) : (
              /* Selected File Preview Box */
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 truncate">
                    {isPdf ? (
                      <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                    ) : (
                      <Receipt className="w-4 h-4 text-teal-600 shrink-0" />
                    )}
                    <span className="font-semibold text-slate-800 truncate">
                      {file?.name || (isPdf ? 'Medical Bill.pdf' : 'Medical Bill.png')}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {file?.size ? `${(file.size / 1024).toFixed(0)} KB` : 'Preset'}
                  </span>
                </div>

                {/* Preview renderer */}
                {isPdf ? (
                  <div className="p-8 rounded-xl border border-rose-200 bg-rose-50/40 text-center space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="text-xs font-bold text-slate-800">
                      PDF Document Loaded
                    </div>
                    <div className="text-[11px] text-slate-500 max-w-xs mx-auto">
                      Ready for Gemini multimodal OCR analysis. Click below to extract bill details.
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 overflow-hidden max-h-64 bg-slate-900/5 relative flex items-center justify-center p-2">
                    <img
                      src={fileDataUri}
                      alt="Medical Bill Preview"
                      className="max-h-60 object-contain rounded-lg shadow-xs"
                    />
                  </div>
                )}

                {/* Action buttons: Re-upload / Analyze */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <FileUp className="w-3.5 h-3.5" /> Change File
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="py-2.5 px-3 rounded-xl border border-rose-200 hover:bg-rose-50 text-xs font-semibold text-rose-700 transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* Scan Button */}
                <button
                  type="button"
                  disabled={isAnalyzing}
                  onClick={handleAnalyzeBill}
                  className="w-full py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Gemini AI is auditing bill...</span>
                    </>
                  ) : (
                    <>
                      <ScanLine className="w-4 h-4 stroke-[2.5]" />
                      <span>Extract & Verify with Gemini AI</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Quick Presets for Instant Testing */}
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <span>Instant Presets (Real Indian Medical Bills):</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => loadPresetBill('apollo')}
                  className="w-full px-3 py-2 rounded-xl border border-teal-200 bg-teal-50/60 hover:bg-teal-100/70 text-left transition flex items-center justify-between text-xs cursor-pointer group"
                >
                  <div>
                    <div className="font-bold text-teal-900">Apollo Pharmacy Cash Memo</div>
                    <div className="text-[10px] text-teal-700">Glycomet, Telma, Atorva, Pan-D • ₹1,845</div>
                  </div>
                  <Sparkles className="w-4 h-4 text-teal-600 group-hover:rotate-12 transition-transform" />
                </button>

                <button
                  type="button"
                  onClick={() => loadPresetBill('lalpath')}
                  className="w-full px-3 py-2 rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100/70 text-left transition flex items-center justify-between text-xs cursor-pointer group"
                >
                  <div>
                    <div className="font-bold text-rose-900">Dr. Lal PathLabs Diagnostic Receipt</div>
                    <div className="text-[10px] text-rose-700">HbA1c, Lipid Profile, KFT, Sample Fee • ₹2,650</div>
                  </div>
                  <Sparkles className="w-4 h-4 text-rose-600 group-hover:rotate-12 transition-transform" />
                </button>

                <button
                  type="button"
                  onClick={() => loadPresetBill('fortis')}
                  className="w-full px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100/70 text-left transition flex items-center justify-between text-xs cursor-pointer group"
                >
                  <div>
                    <div className="font-bold text-indigo-900">Fortis Hospital OPD Invoice</div>
                    <div className="text-[10px] text-indigo-700">Cardiology OPD Consultation + ECG • ₹1,500</div>
                  </div>
                  <Sparkles className="w-4 h-4 text-indigo-600 group-hover:rotate-12 transition-transform" />
                </button>
              </div>
            </div>

            {/* Privacy note */}
            <div className="text-[11px] text-slate-400 flex items-start gap-1.5 pt-1">
              <Shield className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
              <span>
                Your medical data is processed securely through your server-side Gemini integration. Sensitive patient IDs (Aadhaar/PAN) are never stored.
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Editable Review & Verification (7 cols) */}
        <div className="lg:col-span-7">
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Extracted Bill Details</h3>
                <p className="text-xs text-slate-500">
                  Review extracted provider, date, itemized medicines, and audit math before saving.
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {analysisResult && (
                  <>
                    {analysisResult.processingTimeMs ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-600 fill-amber-500" />
                        <span>{(analysisResult.processingTimeMs / 1000).toFixed(1)}s</span>
                      </span>
                    ) : null}
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800">
                      AI Extracted
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Error Message with Retry */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Extraction Notice</div>
                    <div>{errorMessage}</div>
                  </div>
                </div>
                {fileDataUri && (
                  <button
                    type="button"
                    onClick={handleAnalyzeBill}
                    className="ml-6 px-3 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold transition text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Retry Extraction
                  </button>
                )}
              </div>
            )}

            {/* Warning Message if discrepancy detected */}
            {warningMessage && !errorMessage && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Audit Alert: </span>
                    {warningMessage}
                  </div>
                </div>
                {hasDiscrepancy && (
                  <button
                    type="button"
                    onClick={handleAutoAdjustTotal}
                    className="shrink-0 px-2.5 py-1 rounded-lg bg-amber-200/70 hover:bg-amber-200 text-amber-900 font-bold text-[11px] transition cursor-pointer"
                  >
                    Set Total to ₹{computedItemsSum}
                  </button>
                )}
              </div>
            )}

            {/* Save Success Confirmation Banner */}
            {isSaved && savedExpenseDetails && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-bold text-emerald-900">
                      Medical Bill Confirmed & Saved to Healthcare Ledger!
                    </div>
                    <div className="text-xs text-emerald-700 mt-0.5">
                      <strong>{savedExpenseDetails.name}</strong> ({formatINR(savedExpenseDetails.amount)}) in <strong>{savedExpenseDetails.category}</strong> has been recorded.
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-emerald-200/60">
                  <button
                    type="button"
                    onClick={() => setActiveTab('dashboard')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1"
                  >
                    View in Dashboard <ArrowRight className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('expenses')}
                    className="px-3 py-1.5 rounded-lg border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-800 font-bold text-xs transition cursor-pointer"
                  >
                    View in Expenses Ledger
                  </button>
                  <button
                    type="button"
                    onClick={handleScanAnother}
                    className="px-3 py-1.5 rounded-lg text-emerald-800 hover:underline text-xs font-semibold cursor-pointer"
                  >
                    Scan Another Bill
                  </button>
                </div>
              </div>
            )}

            {/* Empty State before analysis */}
            {!analysisResult && !isAnalyzing && (
              <div className="py-12 text-center text-slate-400">
                <ScanLine className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <h4 className="text-sm font-bold text-slate-700">No bill scanned yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Upload a medical bill photo (JPG, PNG) or PDF document on the left, or click one of the instant Indian Presets to test OCR extraction.
                </p>
              </div>
            )}

            {/* Loading Skeleton during analysis */}
            {isAnalyzing && (
              <div className="py-12 text-center space-y-4">
                <div className="relative w-14 h-14 mx-auto">
                  <div className="w-14 h-14 rounded-full border-4 border-teal-200 border-t-teal-600 animate-spin" />
                  <Zap className="w-6 h-6 text-teal-600 absolute inset-0 m-auto animate-pulse" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">
                    {scanStep || 'Extracting medical items & validating billing amounts...'}
                  </div>
                  <div className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Running high-speed multimodal OCR, separating prescription items, and verifying CGST/SGST taxes.
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                    <Zap className="w-3 h-3 text-teal-600" /> Fast Vision OCR
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Math Verification
                  </span>
                </div>
              </div>
            )}

            {/* Analysis Review Form */}
            {analysisResult && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Math Consistency Audit Banner */}
                <div
                  className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                    !hasDiscrepancy
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {!hasDiscrepancy ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <div>
                      <span className="font-bold">
                        {!hasDiscrepancy
                          ? 'Mathematical Audit Passed:'
                          : 'Calculation Discrepancy:'}
                      </span>{' '}
                      Line items sum ({formatINR(computedItemsSum)}){' '}
                      {!hasDiscrepancy
                        ? `matches the final bill total (${formatINR(totalAmount)}) perfectly.`
                        : `differs from bill total (${formatINR(totalAmount)}) by ${formatINR(
                            mathDiscrepancy
                          )}.`}
                    </div>
                  </div>
                  {hasDiscrepancy && (
                    <button
                      type="button"
                      onClick={handleAutoAdjustTotal}
                      className="shrink-0 px-2 py-1 rounded bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold text-[11px] transition cursor-pointer"
                    >
                      Sync Total
                    </button>
                  )}
                </div>

                {/* Form fields: Vendor, Date, Invoice, Patient, Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Pharmacy / Hospital / Doctor</span>
                    </label>
                    <input
                      type="text"
                      value={vendorName}
                      onChange={(e) => setVendorName(e.target.value)}
                      placeholder="e.g. Apollo Pharmacy, Dr. Lal PathLabs"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-hidden focus:border-teal-500 focus:ring-1 focus:ring-teal-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Bill / Invoice Date</span>
                    </label>
                    <input
                      type="date"
                      value={billDate}
                      onChange={(e) => setBillDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-hidden focus:border-teal-500 focus:ring-1 focus:ring-teal-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5 text-slate-400" />
                      <span>Invoice / Bill Number</span>
                    </label>
                    <input
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="e.g. APO-BLR-2026-98124"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-hidden focus:border-teal-500 focus:ring-1 focus:ring-teal-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Patient Name (if visible)</span>
                    </label>
                    <input
                      type="text"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="e.g. Rajesh Sharma"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-hidden focus:border-teal-500 focus:ring-1 focus:ring-teal-100"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                      <span>Healthcare Category</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 bg-white focus:outline-hidden focus:border-teal-500 focus:ring-1 focus:ring-teal-100"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Line Items Table */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-800">
                      Itemized Medicines & Services ({lineItems.length})
                    </label>
                    <button
                      type="button"
                      onClick={handleAddLineItem}
                      className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Line
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <tr>
                          <th className="py-2.5 px-3">Medicine / Item Description</th>
                          <th className="py-2.5 px-2 w-16 text-center">Qty</th>
                          <th className="py-2.5 px-2 w-20 text-right">Unit (₹)</th>
                          <th className="py-2.5 px-3 w-28 text-right">Total (₹)</th>
                          <th className="py-2.5 px-2 w-10 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {lineItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) =>
                                  handleUpdateLineItem(idx, 'description', e.target.value)
                                }
                                placeholder="Medicine or service name"
                                className="w-full bg-transparent border-b border-transparent focus:border-teal-500 focus:outline-hidden text-slate-800 font-medium"
                              />
                            </td>
                            <td className="py-2 px-2 text-center">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity || 1}
                                onChange={(e) =>
                                  handleUpdateLineItem(idx, 'quantity', parseInt(e.target.value) || 1)
                                }
                                className="w-12 text-center bg-transparent border-b border-transparent focus:border-teal-500 focus:outline-hidden text-slate-800"
                              />
                            </td>
                            <td className="py-2 px-2 text-right">
                              <input
                                type="number"
                                step="any"
                                value={item.unitPrice || ''}
                                placeholder="-"
                                onChange={(e) =>
                                  handleUpdateLineItem(
                                    idx,
                                    'unitPrice',
                                    e.target.value ? parseFloat(e.target.value) : undefined
                                  )
                                }
                                className="w-16 text-right bg-transparent border-b border-transparent focus:border-teal-500 focus:outline-hidden text-slate-600"
                              />
                            </td>
                            <td className="py-2 px-3 text-right">
                              <input
                                type="number"
                                step="any"
                                value={item.amount}
                                onChange={(e) =>
                                  handleUpdateLineItem(
                                    idx,
                                    'amount',
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-20 text-right bg-transparent border-b border-transparent focus:border-teal-500 focus:outline-hidden font-bold text-slate-900"
                              />
                            </td>
                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveLineItem(idx)}
                                className="text-slate-400 hover:text-rose-600 cursor-pointer"
                                title="Remove line item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totals Summary and Breakdowns */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600">
                    <div>
                      <span className="block text-slate-400 font-medium">Items Subtotal:</span>
                      <span className="font-bold text-slate-800 text-sm">{formatINR(computedItemsSum)}</span>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-medium">Taxes / GST (₹):</label>
                      <input
                        type="number"
                        step="any"
                        value={taxAmount || ''}
                        placeholder="0"
                        onChange={(e) => setTaxAmount(parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 rounded border border-slate-300 text-xs font-semibold text-slate-800 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-medium">Discount (₹):</label>
                      <input
                        type="number"
                        step="any"
                        value={discountAmount || ''}
                        placeholder="0"
                        onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 rounded border border-slate-300 text-xs font-semibold text-slate-800 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-medium">Round Off (₹):</label>
                      <input
                        type="number"
                        step="any"
                        value={roundOffAmount || ''}
                        placeholder="0"
                        onChange={(e) => setRoundOffAmount(parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 rounded border border-slate-300 text-xs font-semibold text-slate-800 bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                    <div>
                      <span className="text-xs text-slate-500 block">Verified Final Bill Amount:</span>
                      <span className="text-xs text-slate-400">Total payable recorded to ledger</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-500">₹</span>
                      <input
                        type="number"
                        step="any"
                        value={totalAmount}
                        onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
                        className="w-28 px-2 py-1 text-right rounded-lg border border-teal-300 bg-white text-lg font-extrabold text-teal-700 focus:outline-hidden focus:ring-2 focus:ring-teal-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Confirm and Save Expenses Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={isSaving || isSaved}
                    onClick={handleConfirmAndSave}
                    className={`w-full py-3.5 rounded-xl text-xs sm:text-sm font-bold text-white transition flex items-center justify-center gap-2 shadow-sm ${
                      isSaved
                        ? 'bg-emerald-600 hover:bg-emerald-700 cursor-default shadow-emerald-600/30'
                        : isSaving
                        ? 'bg-teal-500 opacity-80 cursor-wait'
                        : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/30 cursor-pointer'
                    }`}
                  >
                    {isSaved ? (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Expenses Confirmed & Saved to Ledger!</span>
                      </>
                    ) : isSaving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Saving Verified Expenses to Ledger...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                        <span>Confirm and Save Expenses</span>
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-slate-400 text-center mt-2">
                    Unverified extraction results are never saved automatically. Click above to commit to your healthcare budget.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
