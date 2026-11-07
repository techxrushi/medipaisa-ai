export type ExpenseCategory =
  | 'Medicines'
  | 'Doctor Consultation'
  | 'Laboratory Tests'
  | 'Hospitalization'
  | 'Other';

export interface LineItem {
  description: string;
  quantity?: number;
  unitPrice?: number;
  amount: number;
}

export interface Expense {
  id: string;
  name: string;
  amount: number; // in INR
  category: ExpenseCategory;
  date: string; // YYYY-MM-DD
  vendor?: string;
  notes?: string;
  isSample?: boolean;
  billData?: {
    invoiceNumber?: string;
    patientName?: string;
    lineItems?: LineItem[];
    subtotal?: number;
    taxAmount?: number;
    discountAmount?: number;
    extractedAt?: string;
    isMathConsistent?: boolean;
  };
}

export interface BudgetConfig {
  monthlyBudget: number; // in INR
  emergencyCorpusTarget: number; // in INR
  alertThresholdPercent: number; // e.g. 80
}

export interface BillAnalysisResult {
  isMedicalBill: boolean;
  isReadable?: boolean;
  vendorName: string | null;
  billDate: string | null;
  invoiceNumber: string | null;
  patientName?: string | null;
  category: ExpenseCategory;
  lineItems: LineItem[];
  subtotal: number | null;
  taxAmount: number | null;
  discountAmount: number | null;
  totalAmount: number;
  confidenceNotes: string;
  itemsSum: number;
  isMathConsistent: boolean;
  discrepancy: number;
  filename?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  source?: 'live_gemini' | 'rule_engine' | 'initial_sync';
  model?: string;
}
