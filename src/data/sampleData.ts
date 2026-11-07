import { Expense, BudgetConfig } from '../types';

export const INITIAL_BUDGET_CONFIG: BudgetConfig = {
  monthlyBudget: 15000, // ₹15,000 / month
  emergencyCorpusTarget: 150000, // ₹1.5 Lakhs
  alertThresholdPercent: 80, // 80% threshold
};

// Generates dynamic dates relative to current year/month so the demo always looks fresh and active!
const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth(); // 0-indexed

function getDate(monthOffset: number, day: number): string {
  const d = new Date(currentYear, currentMonth + monthOffset, day);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export const SAMPLE_EXPENSES: Expense[] = [
  // Current month expenses
  {
    id: 'smp-01',
    name: 'Diabetic & Hypertension Monthly Rx',
    amount: 2450,
    category: 'Medicines',
    date: getDate(0, 3),
    vendor: 'Apollo Pharmacy, Indiranagar',
    notes: 'Father: Metformin 500mg, Telmisartan 40mg, Atorvastatin 10mg (30 days pack)',
    isSample: true,
    billData: {
      invoiceNumber: 'APO-2026-9921',
      lineItems: [
        { description: 'Glycomet 500 SR (Metformin)', quantity: 2, amount: 480 },
        { description: 'Telma 40 (Telmisartan)', quantity: 2, amount: 640 },
        { description: 'Atorva 10 (Atorvastatin)', quantity: 1, amount: 430 },
        { description: 'Shelcal 500 (Calcium + Vit D3)', quantity: 3, amount: 900 },
      ],
      isMathConsistent: true,
    },
  },
  {
    id: 'smp-02',
    name: 'Paediatrician Consultation & Vaccine',
    amount: 1800,
    category: 'Doctor Consultation',
    date: getDate(0, 5),
    vendor: 'Cloudnine Hospital',
    notes: 'Child routine growth review and flu shot administration by Dr. Ritu Sharma',
    isSample: true,
  },
  {
    id: 'smp-03',
    name: 'Comprehensive Diabetic Health Package',
    amount: 3200,
    category: 'Laboratory Tests',
    date: getDate(0, 7),
    vendor: 'Dr. Lal PathLabs',
    notes: 'Fasting Blood Sugar, HbA1c, Complete Lipid Profile, Serum Creatinine',
    isSample: true,
    billData: {
      invoiceNumber: 'LAL-DEL-8834',
      lineItems: [
        { description: 'HbA1c Glycosylated Hemoglobin', quantity: 1, amount: 650 },
        { description: 'Lipid Profile Comprehensive', quantity: 1, amount: 950 },
        { description: 'Renal Function Profile', quantity: 1, amount: 800 },
        { description: 'Complete Blood Count (CBC)', quantity: 1, amount: 450 },
        { description: 'Home Collection Convenience Fee', quantity: 1, amount: 350 },
      ],
      isMathConsistent: true,
    },
  },
  {
    id: 'smp-04',
    name: 'Mother Orthopedic Consultation & Knee X-Ray',
    amount: 1650,
    category: 'Doctor Consultation',
    date: getDate(0, 10),
    vendor: 'Max Super Speciality Hospital',
    notes: 'Senior consultant orthopedics OPD visit + bilateral knee digital X-ray',
    isSample: true,
  },
  {
    id: 'smp-05',
    name: 'Physiotherapy Sessions (Package of 5)',
    amount: 2500,
    category: 'Other',
    date: getDate(0, 14),
    vendor: 'RehabCare Clinic',
    notes: 'Post-arthritic knee strengthening exercises for mother',
    isSample: true,
  },
  {
    id: 'smp-06',
    name: 'Asthma Inhaler & Allergy Nasal Spray',
    amount: 1150,
    category: 'Medicines',
    date: getDate(0, 18),
    vendor: 'MedPlus Pharmacy',
    notes: 'Forsonide 200 Rotacaps + Flomist Nasal Spray refill for winter allergy',
    isSample: true,
  },

  // Previous month expenses (Month -1)
  {
    id: 'smp-07',
    name: 'Monthly Chronic Medicine Refill',
    amount: 2850,
    category: 'Medicines',
    date: getDate(-1, 2),
    vendor: 'Apollo Pharmacy',
    notes: 'Parents monthly cardio-diabetic maintenance meds',
    isSample: true,
  },
  {
    id: 'smp-08',
    name: 'Dental Scaling & Root Canal Treatment',
    amount: 4500,
    category: 'Other',
    date: getDate(-1, 12),
    vendor: 'Clove Dental',
    notes: 'Scaling and single sitting RCT with temporary crown',
    isSample: true,
  },
  {
    id: 'smp-09',
    name: 'Thyroid & Vitamin D3 Lab Panel',
    amount: 1950,
    category: 'Laboratory Tests',
    date: getDate(-1, 18),
    vendor: 'Metropolis Healthcare',
    notes: 'TSH, Free T3/T4, 25-OH Vitamin D',
    isSample: true,
  },
  {
    id: 'smp-10',
    name: 'Dermatologist OPD Visit & Topical Ointments',
    amount: 1400,
    category: 'Doctor Consultation',
    date: getDate(-1, 25),
    vendor: 'Dr. Anand Skin Clinic',
    notes: 'Consultation fee ₹800 + medicated cream ₹600',
    isSample: true,
  },

  // 2 Months Ago (Month -2)
  {
    id: 'smp-11',
    name: 'Daycare Cataract Checkup & Eye Drops',
    amount: 3200,
    category: 'Hospitalization',
    date: getDate(-2, 8),
    vendor: 'Shroff Eye Centre',
    notes: 'Pre-operative evaluation, intraocular pressure measurement & dilation drops',
    isSample: true,
  },
  {
    id: 'smp-12',
    name: 'Monthly Maintenance Medicines',
    amount: 2700,
    category: 'Medicines',
    date: getDate(-2, 4),
    vendor: 'Apollo Pharmacy',
    notes: 'Monthly regular cardiac & diabetic prescriptions',
    isSample: true,
  },
  {
    id: 'smp-13',
    name: 'ENT Specialist Consultation for Sinusitis',
    amount: 1200,
    category: 'Doctor Consultation',
    date: getDate(-2, 19),
    vendor: 'Fortis Memorial Research Institute',
    notes: 'Nasal endoscopy & consultation',
    isSample: true,
  },
];

// High fidelity sample bill image generator (creates clean receipt images as PNG data URI for OCR testing)
export function createSampleBillImage(type: 'apollo' | 'lalpath' | 'fortis'): {
  filename: string;
  dataUri: string;
  vendor: string;
  amount: number;
} {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 800;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return {
      filename: 'sample-bill.png',
      dataUri: '',
      vendor: 'Sample Medical Pharmacy',
      amount: 1845,
    };
  }

  // Draw receipt paper background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 600, 800);

  // Border & receipt header band
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, 580, 780);

  if (type === 'apollo') {
    // Header
    ctx.fillStyle = '#0f766e';
    ctx.fillRect(20, 20, 560, 70);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('APOLLO PHARMACY INDIA', 40, 55);
    ctx.font = '12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('GSTIN: 07AAACA1234F1Z8 | Retail Tax Invoice / Cash Memo', 40, 75);

    // Bill Details
    ctx.fillStyle = '#1e293b';
    ctx.font = '13px monospace';
    ctx.fillText('Bill No: APO-BLR-2026-98124', 40, 120);
    ctx.fillText('Date: 2026-11-04  14:32 IST', 40, 140);
    ctx.fillText('Patient: Sharma Family (Dr. R. Mehta)', 40, 160);
    ctx.fillText('------------------------------------------------------------', 40, 180);

    // Table Header
    ctx.font = 'bold 13px monospace';
    ctx.fillText('ITEM DESCRIPTION            QTY    RATE (₹)   AMOUNT (₹)', 40, 205);
    ctx.fillText('------------------------------------------------------------', 40, 220);

    // Items
    ctx.font = '13px monospace';
    ctx.fillText('1. GLYCOMET 500MG SR (15s)   2      240.00      480.00', 40, 250);
    ctx.fillText('2. TELMA 40MG TABLETS (15s)  2      320.00      640.00', 40, 280);
    ctx.fillText('3. ATORVA 10MG TAB (10s)     1      430.00      430.00', 40, 310);
    ctx.fillText('4. PAN-D CAPSULES (15s)      1      295.00      295.00', 40, 340);

    ctx.fillText('------------------------------------------------------------', 40, 380);
    ctx.fillText('SUBTOTAL:                                     1,845.00', 40, 410);
    ctx.fillText('CGST (6%):                                      110.70', 40, 435);
    ctx.fillText('SGST (6%):                                      110.70', 40, 460);
    ctx.fillText('DISCOUNT (Privilege Card 12%):                - 221.40', 40, 485);
    ctx.fillText('------------------------------------------------------------', 40, 510);

    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#0f766e';
    ctx.fillText('NET PAYABLE TOTAL:                         ₹ 1,845.00', 40, 545);

    ctx.font = '12px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Payment Mode: UPI (Google Pay) - Ref: UPI/908234120', 40, 600);
    ctx.fillText('Thank you for choosing Apollo Pharmacy. Get well soon!', 40, 630);
    ctx.fillText('Note: Save this invoice for Income Tax Sec 80D claims.', 40, 650);

    return {
      filename: 'apollo-pharmacy-rx-bill.png',
      dataUri: canvas.toDataURL('image/png'),
      vendor: 'Apollo Pharmacy',
      amount: 1845,
    };
  } else if (type === 'lalpath') {
    // Dr Lal PathLabs
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(20, 20, 560, 70);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('DR. LAL PATHLABS LTD', 40, 55);
    ctx.font = '12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Diagnostic Report & Payment Receipt | NABL Accredited Lab', 40, 75);

    ctx.fillStyle = '#1e293b';
    ctx.font = '13px monospace';
    ctx.fillText('Receipt No: LAL-DEL-2026-44102', 40, 120);
    ctx.fillText('Date: 2026-11-05  08:15 IST', 40, 140);
    ctx.fillText('Patient Name: Rajesh Sharma (Male, 54 Yrs)', 40, 160);
    ctx.fillText('Referred By: Dr. P. Gupta (MD Med)', 40, 180);
    ctx.fillText('------------------------------------------------------------', 40, 200);

    ctx.font = 'bold 13px monospace';
    ctx.fillText('TEST INVESTIGATION                  QTY        AMOUNT (₹)', 40, 225);
    ctx.fillText('------------------------------------------------------------', 40, 245);

    ctx.font = '13px monospace';
    ctx.fillText('1. HBA1C (GLYCOSYLATED HEMOGLOBIN)    1            650.00', 40, 275);
    ctx.fillText('2. LIPID PROFILE EXTENDED             1            950.00', 40, 305);
    ctx.fillText('3. KIDNEY FUNCTION TEST (KFT)         1            750.00', 40, 335);
    ctx.fillText('4. HOME BLOOD SAMPLE COLLECTION       1            300.00', 40, 365);

    ctx.fillText('------------------------------------------------------------', 40, 400);
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#b91c1c';
    ctx.fillText('TOTAL AMOUNT PAID:                         ₹ 2,650.00', 40, 435);

    ctx.font = '12px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Status: PAID via RuPay Debit Card (*4492)', 40, 500);
    ctx.fillText('Reports will be available online within 12 hours.', 40, 525);
    ctx.fillText('Tax Exemption: Eligible under Preventive Checkup Sec 80D.', 40, 550);

    return {
      filename: 'drlal-pathlabs-diagnostic-bill.png',
      dataUri: canvas.toDataURL('image/png'),
      vendor: 'Dr. Lal PathLabs',
      amount: 2650,
    };
  } else {
    // Fortis Hospital
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(20, 20, 560, 70);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('FORTIS HEALTHCARE LIMITED', 40, 55);
    ctx.font = '12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Outpatient Department (OPD) Consultation & Billing Invoice', 40, 75);

    ctx.fillStyle = '#1e293b';
    ctx.font = '13px monospace';
    ctx.fillText('Invoice: FHL-GGN-2026-1189', 40, 120);
    ctx.fillText('Date: 2026-11-06  11:10 IST', 40, 140);
    ctx.fillText('Consultant: Dr. A. K. Verma, MD (Cardiology)', 40, 160);
    ctx.fillText('Patient UHID: 10098234 - Sunita Sharma', 40, 180);
    ctx.fillText('------------------------------------------------------------', 40, 200);

    ctx.font = 'bold 13px monospace';
    ctx.fillText('SERVICE / CONSULTATION DESCRIPTION             AMOUNT (₹)', 40, 225);
    ctx.fillText('------------------------------------------------------------', 40, 245);

    ctx.font = '13px monospace';
    ctx.fillText('1. SENIOR CARDIOLOGY OPD CONSULTATION              1,200.00', 40, 275);
    ctx.fillText('2. 12-LEAD COMPUTERIZED ELECTROCARDIOGRAM (ECG)      300.00', 40, 305);

    ctx.fillText('------------------------------------------------------------', 40, 360);
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#1e3a8a';
    ctx.fillText('TOTAL OPD CHARGES:                         ₹ 1,500.00', 40, 400);

    ctx.font = '12px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Complimentary follow-up valid for 7 days with this slip.', 40, 480);
    ctx.fillText('Hospital Pharmacy & Diagnostics ground floor, Wing B.', 40, 505);

    return {
      filename: 'fortis-hospital-opd-bill.png',
      dataUri: canvas.toDataURL('image/png'),
      vendor: 'Fortis Healthcare',
      amount: 1500,
    };
  }
}
