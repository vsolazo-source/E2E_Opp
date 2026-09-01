import { Opportunity } from '../types';

/**
 * Standard Division Shortcode Mapping
 */
export const DIVISION_CODES: Record<string, string> = {
  // Configured Division options
  'Financial Services & FinTech': 'FSF',
  'Financial Services & FinTech Division': 'FSF',
  'Enterprise Cloud & Infrastructure': 'ECI',
  'Enterprise Cloud & Infrastructure Division': 'ECI',
  'Digital Applications & AI Solutions': 'DAI',
  'Digital Applications & AI Solutions Division': 'DAI',
  'Digital Applications & AI': 'DAI',
  'Healthcare & Public Sector': 'HPS',
  'Healthcare, Life Sciences & Public Sector': 'HPS',
  'Healthcare, Life Sciences & Public Sector Division': 'HPS',
  'Global Advisory & Consulting': 'GAC',
  'Global Advisory & Management Consulting': 'GAC',
  'Global Advisory & Management Consulting Division': 'GAC',
  'Managed Operations & Cybersecurity': 'MOC',
  'Managed Operations & Cybersecurity Division': 'MOC',
  'Strategic Enterprise Accounts': 'SEA',
  'Strategic Enterprise Accounts Division': 'SEA',
  'Technology, Media & Telecom': 'TMT',
  'Retail, Manufacturing & Consumer': 'RMC',
  'Energy, Utilities & Critical Infra': 'EUC',
  'General Operations': 'GEN',
  'General Operations Division': 'GEN',
};

/**
 * Standard Business Unit Shortcode Mapping
 */
export const BU_CODES: Record<string, string> = {
  // Enum Keys
  'CLOUD_INFRA': 'CI',
  'DIGITAL_APP': 'DA',
  'ENTERPRISE_AI': 'AI',
  'MANAGED_SERVICES': 'MS',
  'CYBERSECURITY': 'SEC',

  // Full Labels
  'Cloud & Infrastructure': 'CI',
  'Cloud & Infrastructure Services': 'CI',
  'Digital & Enterprise Apps': 'DA',
  'Digital Applications': 'DA',
  'Digital Applications & Solutions': 'DA',
  'Enterprise AI & Data Solutions': 'AI',
  'Enterprise AI Solutions': 'AI',
  'Enterprise AI': 'AI',
  'Managed Services & Security': 'MS',
  'Managed Services': 'MS',
  'Cybersecurity & Governance': 'SEC',
  'Cybersecurity': 'SEC',

  // Other internal departments if selected as BU
  'Sales & Commercial': 'SALES',
  'Solutions Architecture & Pre-Sales': 'SA',
  'Legal & Contracts': 'LEGAL',
  'Finance & Accounting': 'FIN',
  'PMO & Project Delivery': 'PMO',
  'Finance & Billing': 'BILL',
};

/**
 * Extracts or derives a clean 2-4 letter uppercase Division code.
 */
export function getDivisionCode(division?: string): string {
  if (!division || typeof division !== 'string') {
    return 'GEN';
  }

  const trimmed = division.trim();
  if (DIVISION_CODES[trimmed]) {
    return DIVISION_CODES[trimmed];
  }

  // Check case-insensitive exact matches
  const lower = trimmed.toLowerCase();
  for (const [key, val] of Object.entries(DIVISION_CODES)) {
    if (key.toLowerCase() === lower) {
      return val;
    }
  }

  // If already an uppercase acronym (e.g., 'FSF', 'APAC', 'GEN')
  if (/^[A-Z0-9]{2,5}$/.test(trimmed)) {
    return trimmed;
  }

  // Derive acronym from significant words (ignoring common connectors)
  const stopWords = new Set(['and', '&', 'of', 'the', 'for', 'in', 'to', 'division', 'group', 'services']);
  const words = trimmed
    .split(/[\s_-]+/)
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, ''))
    .filter((w) => w.length > 0 && !stopWords.has(w.toLowerCase()));

  if (words.length >= 2) {
    const acronym = words.map((w) => w[0].toUpperCase()).join('').slice(0, 4);
    if (acronym.length >= 2) return acronym;
  }

  // Fallback to first 3 alphanumeric characters uppercase
  const cleaned = trimmed.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return cleaned.slice(0, 3) || 'GEN';
}

/**
 * Extracts or derives a clean 2-4 letter uppercase Business Unit code.
 */
export function getBusinessUnitCode(businessUnit?: string): string {
  if (!businessUnit || typeof businessUnit !== 'string') {
    return 'BU';
  }

  const trimmed = businessUnit.trim();
  if (BU_CODES[trimmed]) {
    return BU_CODES[trimmed];
  }

  // Check case-insensitive exact matches
  const lower = trimmed.toLowerCase();
  for (const [key, val] of Object.entries(BU_CODES)) {
    if (key.toLowerCase() === lower) {
      return val;
    }
  }

  // If already an uppercase acronym (e.g., 'CI', 'DA', 'AI', 'MS', 'SEC')
  if (/^[A-Z0-9]{2,5}$/.test(trimmed)) {
    return trimmed;
  }

  // Derive from words
  const stopWords = new Set(['and', '&', 'of', 'the', 'for', 'in', 'to', 'services', 'unit']);
  const words = trimmed
    .split(/[\s_-]+/)
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, ''))
    .filter((w) => w.length > 0 && !stopWords.has(w.toLowerCase()));

  if (words.length >= 2) {
    const acronym = words.map((w) => w[0].toUpperCase()).join('').slice(0, 4);
    if (acronym.length >= 2) return acronym;
  }

  const cleaned = trimmed.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return cleaned.slice(0, 3) || 'BU';
}

/**
 * Calculates the next three-digit sequential number for a given calendar year.
 * The sequential number resets annually and starts at 001 for each year.
 */
export function getNextSequentialNumber(
  year: number,
  existingOpportunities: Array<{ trackingCode?: string; createdAt?: string }> = []
): number {
  let maxSeq = 0;

  const targetYearStr = String(year);

  for (const opp of existingOpportunities) {
    const code = opp.trackingCode;
    if (!code) continue;

    // Pattern 1: Standard DIV-BU-OPP-YYYY-NNN (e.g. FSF-CI-OPP-2026-001)
    const matchStandard = code.match(/^[A-Z0-9]+-[A-Z0-9]+-OPP-(\d{4})-(\d+)/i);
    if (matchStandard) {
      const oppYear = Number(matchStandard[1]);
      const oppSeq = Number(matchStandard[2]);
      if (oppYear === year && !isNaN(oppSeq) && oppSeq > maxSeq) {
        maxSeq = oppSeq;
      }
      continue;
    }

    // Pattern 2: Legacy OPP-YYYY-NNNN or ANY-YYYY-NNN
    const matchLegacy = code.match(/OPP-(\d{4})-(\d+)/i) || code.match(/-(\d{4})-(\d+)/);
    if (matchLegacy) {
      const oppYear = Number(matchLegacy[1]);
      const oppSeq = Number(matchLegacy[2]);
      if (oppYear === year && !isNaN(oppSeq) && oppSeq > maxSeq) {
        maxSeq = oppSeq;
      }
      continue;
    }

    // Check if created in target year and has trailing numeric sequence
    if (opp.createdAt) {
      const createdYear = new Date(opp.createdAt).getFullYear();
      if (createdYear === year) {
        const trailingDigits = code.match(/(\d+)$/);
        if (trailingDigits) {
          const num = Number(trailingDigits[1]);
          if (!isNaN(num) && num > maxSeq && num < 100000) {
            maxSeq = num;
          }
        }
      }
    }
  }

  return maxSeq + 1;
}

/**
 * Formats full opportunity code string: DIV-BU-OPP-YYYY-NNN
 */
export function formatOpportunityCode(
  division: string | undefined,
  businessUnit: string | undefined,
  year: number | string,
  seqNumber: number
): string {
  const div = getDivisionCode(division);
  const bu = getBusinessUnitCode(businessUnit);
  const yyyy = String(year);
  const nnn = String(seqNumber).padStart(3, '0');
  return `${div}-${bu}-OPP-${yyyy}-${nnn}`;
}

/**
 * Generates a brand new Opportunity tracking code adhering to DIV-BU-OPP-YYYY-NNN.
 */
export function generateOpportunityCode(params: {
  division?: string;
  businessUnit?: string;
  createdAt?: string | Date;
  existingOpportunities?: Array<{ trackingCode?: string; createdAt?: string }>;
}): string {
  const date = params.createdAt ? new Date(params.createdAt) : new Date();
  const year = isNaN(date.getFullYear()) ? new Date().getFullYear() : date.getFullYear();
  const seqNumber = getNextSequentialNumber(year, params.existingOpportunities || []);
  return formatOpportunityCode(params.division, params.businessUnit, year, seqNumber);
}

/**
 * Previews the next Opportunity code for UI forms without committing it.
 */
export function previewOpportunityCode(
  division?: string,
  businessUnit?: string,
  existingOpportunities?: Array<{ trackingCode?: string; createdAt?: string }>,
  date: Date = new Date()
): string {
  const year = date.getFullYear();
  const seqNumber = getNextSequentialNumber(year, existingOpportunities || []);
  return formatOpportunityCode(division, businessUnit, year, seqNumber);
}
