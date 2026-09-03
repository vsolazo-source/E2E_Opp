import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Link2, 
  DollarSign, 
  ExternalLink, 
  Check, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { Opportunity, StakeholderRole, AuditLogEntry, FinanceAuditEntry } from '../types';
import { formatCurrency } from '../utils/formatters';
import { SUPPORTED_CURRENCIES } from './NewOpportunityModal';

interface ConvertedProposalToContractSectionProps {
  opportunity: Opportunity;
  currentRole: StakeholderRole;
  onUpdateOpportunity: (updated: Opportunity) => void;
}

export const ConvertedProposalToContractSection: React.FC<ConvertedProposalToContractSectionProps> = ({
  opportunity,
  currentRole,
  onUpdateOpportunity,
}) => {
  // Input states initialized from opportunity.contractDetails or opportunity defaults
  const [contractLink, setContractLink] = useState(
    opportunity.contractDetails?.clientContractLink || ''
  );

  const [calcLink, setCalcLink] = useState(
    opportunity.contractDetails?.clientContractPricingCalculatorLink || ''
  );

  const [currency, setCurrency] = useState(
    opportunity.contractDetails?.clientContractPriceCurrency || opportunity.currency || 'USD'
  );
  
  const [contractPrice, setContractPrice] = useState<number | string>(
    opportunity.contractDetails?.clientContractPriceAmount ?? opportunity.dealValue ?? 0
  );

  // Notification / error feedback
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Keep state in sync if opportunity props change from outside
  useEffect(() => {
    setContractLink(opportunity.contractDetails?.clientContractLink || '');
    setCalcLink(opportunity.contractDetails?.clientContractPricingCalculatorLink || '');
    setCurrency(opportunity.contractDetails?.clientContractPriceCurrency || opportunity.currency || 'USD');
    setContractPrice(
      opportunity.contractDetails?.clientContractPriceAmount ?? opportunity.dealValue ?? 0
    );
  }, [
    opportunity.contractDetails?.clientContractLink,
    opportunity.contractDetails?.clientContractPricingCalculatorLink,
    opportunity.contractDetails?.clientContractPriceCurrency,
    opportunity.contractDetails?.clientContractPriceAmount,
    opportunity.dealValue,
    opportunity.currency,
  ]);

  const numericContractPrice = typeof contractPrice === 'number' ? contractPrice : (parseFloat(contractPrice) || 0);
  const previousDealValue = opportunity.dealValue || 0;
  const priceVariance = numericContractPrice - previousDealValue;
  const priceVariancePercent = previousDealValue > 0 ? (priceVariance / previousDealValue) * 100 : 0;

  // Save / Apply Client Contract Price & Log Audit Trail
  const handleApplyAndUpdateDealValue = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const parsedPrice = typeof contractPrice === 'number' ? contractPrice : parseFloat(contractPrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setErrorMessage('Please enter a valid positive Client Contract Price (TCV).');
      return;
    }

    const now = new Date().toISOString();
    const actorName =
      opportunity.contractDetails?.contractsSpecialist ||
      (currentRole === 'CONTRACTS' ? 'Contracts Specialist' : `${currentRole} Specialist`);

    const delta = parsedPrice - previousDealValue;
    const isPriceChanged = delta !== 0;

    // 1. Construct AuditLogEntry for opportunity.history
    const historyEntry: AuditLogEntry = {
      id: `hist-stage8-contract-${Date.now()}`,
      timestamp: now,
      stage: 'CONTRACT_CONVERSION',
      actorName,
      actorRole: 'CONTRACTS' as StakeholderRole,
      action: 'Converted Proposal to Contract: Client Contract Price (TCV) Updated',
      comments: `Client Contract Price (TCV) set to ${formatCurrency(parsedPrice, currency)}${
        isPriceChanged ? ` (Previous Deal Value: ${formatCurrency(previousDealValue, opportunity.currency)}, Delta: ${delta >= 0 ? '+' : ''}${formatCurrency(delta, currency)})` : ' (reconfirmed)'
      }. Contract Link: ${contractLink || 'Provided'}, Calculator: ${calcLink || 'Provided'}. Opportunity deal value updated.`,
      dealValue: parsedPrice,
      previousDealValue: previousDealValue,
      currency: currency,
      variance: delta,
    };

    // 2. Construct FinanceAuditEntry for opportunity.financeAuditTrail
    const financeAuditEntry: FinanceAuditEntry = {
      id: `audit-stage8-${Date.now()}`,
      timestamp: now,
      stage: 'CONTRACT_CONVERSION',
      stageName: 'Stage 8: Contract & Agreement Conversion',
      eventType: 'CONTRACT_CONVERSION',
      actorName,
      actorRole: 'CONTRACTS',
      actionLabel: 'Converted Proposal to Contract: Final Contracted TCV Locked',
      amount: parsedPrice,
      previousAmount: previousDealValue,
      variance: delta,
      variancePercent: previousDealValue > 0 ? (delta / previousDealValue) * 100 : 0,
      currency: currency,
      internalCost: opportunity.solutionProposal?.ibsiInternalCost,
      internalCurrency: opportunity.solutionProposal?.ibsiInternalCurrency || currency,
      marginPercent:
        opportunity.solutionProposal?.ibsiInternalCost && parsedPrice > 0
          ? ((parsedPrice - opportunity.solutionProposal.ibsiInternalCost) / parsedPrice) * 100
          : undefined,
      notes: `Proposal converted to binding contract. Client Contract Price (TCV) updated to ${formatCurrency(parsedPrice, currency)}. Deal value synchronized.${contractLink ? ` Contract Link: ${contractLink}` : ''}${calcLink ? ` | Calculator: ${calcLink}` : ''}`,
    };

    const existingHistory = opportunity.history || [];
    const existingFinanceAudit = opportunity.financeAuditTrail || [];

    const updatedOpportunity: Opportunity = {
      ...opportunity,
      dealValue: parsedPrice,
      currency: currency,
      updatedAt: now,
      contractDetails: {
        ...opportunity.contractDetails,
        clientContractLink: contractLink,
        clientContractFileName: contractLink,
        clientContractPricingCalculatorLink: calcLink,
        clientContractPricingCalculatorFileName: calcLink,
        clientContractPriceCurrency: currency,
        clientContractPriceAmount: parsedPrice,
        clientProposalPriceUpdated: true,
        uploadedAt: now,
      },
      history: [...existingHistory, historyEntry],
      financeAuditTrail: [...existingFinanceAudit, financeAuditEntry],
    };

    onUpdateOpportunity(updatedOpportunity);
    setSuccessToast(
      `✓ Deal Value updated to ${formatCurrency(parsedPrice, currency)} and logged in Audit Trail!`
    );
    setTimeout(() => setSuccessToast(null), 5000);
  };

  return (
    <div id="converted-proposal-to-contract-section" className="p-4 bg-white rounded-xl border border-teal-200/90 shadow-2xs space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-teal-100">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Converted Proposal to Contract</h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                Documentation & TCV Reconciliation
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Link converted legal agreements, pricing calculators, and synchronize the final Client Contract Price (TCV).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
            Current Deal Value: <strong className="text-emerald-700">{formatCurrency(opportunity.dealValue, opportunity.currency)}</strong>
          </span>
        </div>
      </div>

      {/* Toast Notification */}
      {successToast && (
        <div id="contract-section-toast-success" className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold px-1.5 py-0.5 cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div id="contract-section-toast-error" className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-700 hover:text-rose-900 font-bold px-1.5 py-0.5 cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Grid: 2 Link to File Columns (Text input only, upload button removed) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Field 1: Client Contract Link to File */}
        <div className="space-y-1.5 bg-slate-50/70 p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="client-contract-file-input" className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-teal-600" />
                <span>Client Contract Link to File</span>
                <span className="text-rose-500">*</span>
              </label>

              {contractLink && (contractLink.startsWith('http://') || contractLink.startsWith('https://')) && (
                <a
                  href={contractLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-teal-700 font-bold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3" /> Open Link
                </a>
              )}
            </div>

            {/* Text Input for Link to File */}
            <div className="relative">
              <input
                id="client-contract-file-input"
                type="text"
                value={contractLink}
                onChange={(e) => {
                  const val = e.target.value;
                  setContractLink(val);
                  onUpdateOpportunity({
                    ...opportunity,
                    contractDetails: {
                      ...opportunity.contractDetails,
                      clientContractLink: val,
                      clientContractFileName: val,
                    },
                  });
                }}
                placeholder="e.g., https://drive.google.com/... or file repository link"
                className="w-full pl-3 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
              <Link2 className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          <span className="text-[10px] text-slate-400 block mt-2">
            Link to formal legal contract, executed Master Services Agreement (MSA), or Statement of Work.
          </span>
        </div>

        {/* Field 2: Client Contract Pricing Calculator Link to File */}
        <div className="space-y-1.5 bg-slate-50/70 p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="client-contract-calc-input" className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Client Contract Pricing Calculator Link to File</span>
              </label>

              {calcLink && (calcLink.startsWith('http://') || calcLink.startsWith('https://')) && (
                <a
                  href={calcLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-emerald-700 font-bold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3" /> Open Calculator
                </a>
              )}
            </div>

            {/* Text Input for Link to File */}
            <div className="relative">
              <input
                id="client-contract-calc-input"
                type="text"
                value={calcLink}
                onChange={(e) => {
                  const val = e.target.value;
                  setCalcLink(val);
                  onUpdateOpportunity({
                    ...opportunity,
                    contractDetails: {
                      ...opportunity.contractDetails,
                      clientContractPricingCalculatorLink: val,
                      clientContractPricingCalculatorFileName: val,
                    },
                  });
                }}
                placeholder="e.g., https://docs.google.com/spreadsheets/... or file repository link"
                className="w-full pl-3 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <Link2 className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          <span className="text-[10px] text-slate-400 block mt-2">
            Link to final contractual rate matrix, bill of materials (BOM), or reconciled margin calculator.
          </span>
        </div>
      </div>

      {/* Field 3: Set of Currency and Amount to Update Client Proposal Price (TCV), named Client Contract Price (TCV) */}
      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <label htmlFor="client-contract-price-input" className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Client Contract Price (TCV)</span>
            <span className="text-emerald-700 font-semibold text-[10px] bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-200">
              Updates Opportunity Deal Value & Proposal Price
            </span>
          </label>
          <span className="text-[10px] text-slate-500">
            Binding total contract value negotiated & converted for signing
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          {/* Currency Selector */}
          <div className="sm:col-span-3">
            <label htmlFor="client-contract-currency-select" className="text-[10px] font-bold text-slate-600 block mb-1 uppercase tracking-wider">
              Contract Currency
            </label>
            <select
              id="client-contract-currency-select"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 text-xs shadow-2xs"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Amount Input */}
          <div className="sm:col-span-5">
            <label htmlFor="client-contract-price-input" className="text-[10px] font-bold text-slate-600 block mb-1 uppercase tracking-wider">
              Client Contract Price Amount (TCV)
            </label>
            <div className="relative">
              <input
                id="client-contract-price-input"
                type="number"
                step="any"
                min="0"
                value={contractPrice}
                onChange={(e) => setContractPrice(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleApplyAndUpdateDealValue();
                  }
                }}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-emerald-700 font-extrabold text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-2xs"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Action Button: Apply & Update Deal Value with Audit Trail */}
          <div className="sm:col-span-4">
            <button
              id="btn-apply-contract-price"
              type="button"
              onClick={() => handleApplyAndUpdateDealValue()}
              className="w-full inline-flex items-center justify-center px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Update Deal Value & Log Audit
            </button>
          </div>
        </div>

        {/* Financial Variance & Comparison Context */}
        <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[11px]">Previous Deal Value:</span>
            <span className="font-semibold text-slate-700">
              {formatCurrency(previousDealValue, opportunity.currency)}
            </span>
            <span className="text-slate-400">→</span>
            <span className="text-slate-500 text-[11px]">New Contract TCV:</span>
            <span className="font-extrabold text-emerald-700">
              {formatCurrency(numericContractPrice, currency)}
            </span>
          </div>

          <div>
            {priceVariance === 0 ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                <Check className="w-3 h-3 text-slate-500" />
                No variance vs previous deal value
              </span>
            ) : priceVariance > 0 ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                <TrendingUp className="w-3 h-3 text-emerald-600" />
                +{formatCurrency(priceVariance, currency)} (+{priceVariancePercent.toFixed(1)}% vs previous)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                <TrendingDown className="w-3 h-3 text-amber-600" />
                -{formatCurrency(Math.abs(priceVariance), currency)} ({priceVariancePercent.toFixed(1)}% vs previous)
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
