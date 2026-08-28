import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Link2, 
  DollarSign, 
  Check, 
  ExternalLink, 
  Save, 
  AlertCircle, 
  Sparkles, 
  Calculator, 
  TrendingUp, 
  Clock, 
  ShieldCheck, 
  Lock, 
  Unlock,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { Opportunity, WorkflowStage, StakeholderRole, AuditLogEntry } from '../types';
import { formatCurrency } from '../utils/formatters';
import { SUPPORTED_CURRENCIES } from './NewOpportunityModal';

interface ClientProposalUpdatePanelProps {
  opportunity: Opportunity;
  stage: 'SALES_PROPOSAL_REVIEW' | 'CONTRACTS_PROPOSAL_REVIEW' | 'INITIAL_FINANCE_APPROVAL';
  currentRole: StakeholderRole;
  onUpdateOpportunity: (updated: Opportunity) => void;
}

export const ClientProposalUpdatePanel: React.FC<ClientProposalUpdatePanelProps> = ({
  opportunity,
  stage,
  currentRole,
  onUpdateOpportunity,
}) => {
  const [isEnabled, setIsEnabled] = useState(false);

  // Form states initialized from opportunity
  const [proposalLink, setProposalLink] = useState(
    opportunity.solutionProposal?.clientProposalLink || opportunity.solutionProposal?.solutionDocName || ''
  );
  const [calcLink, setCalcLink] = useState(
    opportunity.solutionProposal?.pricingCalculatorLink || ''
  );
  const [currency, setCurrency] = useState(opportunity.currency || 'PHP');
  const [dealValue, setDealValue] = useState<number | string>(opportunity.dealValue || 0);

  // Stage 5 specific states for Internal Cost
  const [internalCostCurrency, setInternalCostCurrency] = useState(
    opportunity.solutionProposal?.ibsiInternalCurrency || opportunity.currency || 'PHP'
  );
  const [internalCost, setInternalCost] = useState<number | string>(
    opportunity.solutionProposal?.ibsiInternalCost ??
    ((opportunity.solutionProposal?.estimatedDeliveryCost || 0) + (opportunity.solutionProposal?.vendorProcurement?.vendorQuoteAmount || 0)) ??
    0
  );

  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Keep in sync if opportunity changes externally
  useEffect(() => {
    setProposalLink(
      opportunity.solutionProposal?.clientProposalLink || opportunity.solutionProposal?.solutionDocName || ''
    );
    setCalcLink(opportunity.solutionProposal?.pricingCalculatorLink || '');
    setCurrency(opportunity.currency || 'USD');
    setDealValue(opportunity.dealValue || 0);
    setInternalCostCurrency(
      opportunity.solutionProposal?.ibsiInternalCurrency || opportunity.currency || 'USD'
    );
    setInternalCost(
      opportunity.solutionProposal?.ibsiInternalCost ??
      ((opportunity.solutionProposal?.estimatedDeliveryCost || 0) + (opportunity.solutionProposal?.vendorProcurement?.vendorQuoteAmount || 0)) ??
      0
    );
  }, [
    opportunity.dealValue,
    opportunity.currency,
    opportunity.solutionProposal?.clientProposalLink,
    opportunity.solutionProposal?.solutionDocName,
    opportunity.solutionProposal?.pricingCalculatorLink,
    opportunity.solutionProposal?.ibsiInternalCost,
  ]);

  // Stage styling and metadata
  const config = {
    SALES_PROPOSAL_REVIEW: {
      theme: 'indigo',
      badgeBg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      activeBorder: 'border-indigo-300 ring-indigo-500/20',
      btnBg: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      amountLabel: 'Client Proposal Price (TCV)',
      amountSubtitle: 'Proposed contract amount presented to client',
      defaultActorRole: 'SALES' as StakeholderRole,
      defaultActorName: opportunity.salesLead || 'Sales Executive',
      auditAction: 'Client Proposal Details & Proposal Price (TCV) Updated',
      panelTitle: 'Sales Proposal Review — Client Proposal Details & Pricing',
    },
    CONTRACTS_PROPOSAL_REVIEW: {
      theme: 'amber',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
      activeBorder: 'border-amber-300 ring-amber-500/20',
      btnBg: 'bg-amber-600 hover:bg-amber-700 text-white',
      amountLabel: 'Proposed Deal Value (TCV)',
      amountSubtitle: 'Contractual total commercial deal valuation',
      defaultActorRole: 'CONTRACTS' as StakeholderRole,
      defaultActorName: opportunity.contractsProcessor || 'Contracts Specialist',
      auditAction: 'Client Proposal Details & Proposed Deal Value (TCV) Updated',
      panelTitle: 'Contracts Review — Client Proposal Details & Deal Value',
    },
    INITIAL_FINANCE_APPROVAL: {
      theme: 'purple',
      badgeBg: 'bg-purple-50 text-purple-800 border-purple-200',
      activeBorder: 'border-purple-300 ring-purple-500/20',
      btnBg: 'bg-purple-600 hover:bg-purple-700 text-white',
      amountLabel: 'Proposed Deal Value (TCV)',
      amountSubtitle: 'Total client proposal price for margin calculation',
      defaultActorRole: 'FINANCE' as StakeholderRole,
      defaultActorName: opportunity.financeProcessor || 'Finance / Deal Desk',
      auditAction: 'Client Proposal Details, TCV & Cost Model Updated',
      panelTitle: 'Finance Approval — Client Proposal Details, TCV & Margin Economics',
    },
  }[stage];

  // Auto-calculated economics for Stage 5
  const numericTcv = typeof dealValue === 'number' ? dealValue : parseFloat(dealValue) || 0;
  const numericCost = typeof internalCost === 'number' ? internalCost : parseFloat(internalCost) || 0;
  const computedGrossProfit = numericTcv - numericCost;
  const computedGrossMarginPercent = numericTcv > 0 ? (computedGrossProfit / numericTcv) * 100 : 0;

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const parsedTcv = typeof dealValue === 'number' ? dealValue : parseFloat(dealValue);
    if (isNaN(parsedTcv) || parsedTcv < 0) {
      setErrorMessage('Please enter a valid positive Deal Value (TCV).');
      return;
    }

    let parsedCost = numericCost;
    if (stage === 'INITIAL_FINANCE_APPROVAL') {
      parsedCost = typeof internalCost === 'number' ? internalCost : parseFloat(internalCost);
      if (isNaN(parsedCost) || parsedCost < 0) {
        setErrorMessage('Please enter a valid positive Internal / Delivery Cost.');
        return;
      }
    }

    const now = new Date().toISOString();
    const previousDealValue = opportunity.dealValue || 0;
    const valueDelta = parsedTcv - previousDealValue;
    const actorName =
      currentRole === 'ALL'
        ? config.defaultActorName
        : `${currentRole} Lead (${config.defaultActorName})`;
    const actorRole = currentRole === 'ALL' ? config.defaultActorRole : currentRole;

    // Construct detailed comments
    let comments = '';
    if (stage === 'INITIAL_FINANCE_APPROVAL') {
      comments = `Finance updated Proposed Deal Value (TCV) to ${formatCurrency(parsedTcv, currency)} and Est. Internal Cost to ${formatCurrency(parsedCost, internalCostCurrency)} (${computedGrossMarginPercent.toFixed(1)}% Gross Margin). Proposal Link: ${proposalLink || 'Provided in Document Center'}, Calculator Link: ${calcLink || 'Provided in Document Center'}.`;
    } else if (stage === 'CONTRACTS_PROPOSAL_REVIEW') {
      comments = `Contracts Team updated Proposed Deal Value (TCV) to ${formatCurrency(parsedTcv, currency)} (Delta: ${valueDelta >= 0 ? '+' : ''}${formatCurrency(valueDelta, currency)}). Proposal Link: ${proposalLink || 'Provided in Document Center'}, Calculator Link: ${calcLink || 'Provided in Document Center'}.`;
    } else {
      comments = `Sales updated Client Proposal Price (TCV) to ${formatCurrency(parsedTcv, currency)} (Delta: ${valueDelta >= 0 ? '+' : ''}${formatCurrency(valueDelta, currency)}). Proposal Link: ${proposalLink || 'Provided in Document Center'}, Calculator Link: ${calcLink || 'Provided in Document Center'}.`;
    }

    const auditEntry: AuditLogEntry = {
      id: `hist-upd-${Date.now()}`,
      timestamp: now,
      stage,
      actorName,
      actorRole,
      action: config.auditAction,
      comments,
      dealValue: parsedTcv,
      previousDealValue,
      currency,
      variance: valueDelta,
      internalCost: stage === 'INITIAL_FINANCE_APPROVAL' ? parsedCost : undefined,
      marginPercent: stage === 'INITIAL_FINANCE_APPROVAL' ? computedGrossMarginPercent : undefined,
    };

    const updatedOpportunity: Opportunity = {
      ...opportunity,
      dealValue: parsedTcv,
      currency,
      updatedAt: now,
      solutionProposal: {
        ...opportunity.solutionProposal,
        clientProposalLink: proposalLink,
        solutionDocName: proposalLink || opportunity.solutionProposal?.solutionDocName,
        pricingCalculatorLink: calcLink,
        ...(stage === 'INITIAL_FINANCE_APPROVAL'
          ? {
              ibsiInternalCost: parsedCost,
              ibsiInternalCurrency: internalCostCurrency,
            }
          : {}),
      },
      ...(stage === 'INITIAL_FINANCE_APPROVAL'
        ? {
            initialFinanceReviewData: {
              ...opportunity.initialFinanceReviewData,
              approvedMarginPercent: computedGrossMarginPercent,
            },
          }
        : {}),
      history: [...(opportunity.history || []), auditEntry],
    };

    onUpdateOpportunity(updatedOpportunity);
    setSaveSuccessMsg(
      `✓ Client Proposal details updated! Deal Value set to ${formatCurrency(parsedTcv, currency)} and logged in Audit Trail.`
    );
    setTimeout(() => setSaveSuccessMsg(null), 5000);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all text-xs">
      {/* Control Header & Enable/Disable Toggle */}
      <div className="p-3.5 bg-slate-50/90 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center space-x-2.5">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
              isEnabled
                ? stage === 'SALES_PROPOSAL_REVIEW'
                  ? 'bg-indigo-600 text-white'
                  : stage === 'CONTRACTS_PROPOSAL_REVIEW'
                  ? 'bg-amber-600 text-white'
                  : 'bg-purple-600 text-white'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            {stage === 'INITIAL_FINANCE_APPROVAL' ? (
              <Calculator className="w-4 h-4" />
            ) : stage === 'CONTRACTS_PROPOSAL_REVIEW' ? (
              <ShieldCheck className="w-4 h-4" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-xs">{config.panelTitle}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${config.badgeBg}`}>
                {stage === 'SALES_PROPOSAL_REVIEW' ? 'Sales Stage 3' : stage === 'CONTRACTS_PROPOSAL_REVIEW' ? 'Contracts Stage 4' : 'Finance Stage 5'}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 block">
              Manage client proposal link, pricing calculator sheet link, and update deal commercial values.
            </span>
          </div>
        </div>

        {/* Enable / Disable Toggle Switch */}
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className="text-xs font-semibold text-slate-700">
              Update Client Proposal details:
            </span>
            <div className="relative">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => {
                  setIsEnabled(e.target.checked);
                  setErrorMessage(null);
                  if (e.target.checked) {
                    setSaveSuccessMsg(null);
                  }
                }}
                className="sr-only"
              />
              <div
                className={`w-11 h-6 rounded-full transition-colors duration-200 ease-in-out p-0.5 ${
                  isEnabled
                    ? stage === 'SALES_PROPOSAL_REVIEW'
                      ? 'bg-indigo-600'
                      : stage === 'CONTRACTS_PROPOSAL_REVIEW'
                      ? 'bg-amber-600'
                      : 'bg-purple-600'
                    : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out flex items-center justify-center ${
                    isEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                >
                  {isEnabled ? (
                    <Unlock className="w-3 h-3 text-slate-700" />
                  ) : (
                    <Lock className="w-3 h-3 text-slate-400" />
                  )}
                </div>
              </div>
            </div>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                isEnabled
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-200 text-slate-600 border border-slate-300'
              }`}
            >
              {isEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        </div>
      </div>

      {/* Success / Error Notification Messages */}
      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-50 border-b border-emerald-200 text-emerald-900 flex items-center justify-between gap-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{saveSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-1.5 py-0.5 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-50 border-b border-rose-200 text-rose-900 flex items-center justify-between gap-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-700 hover:text-rose-900 text-xs font-bold px-1.5 py-0.5 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Form Body (Only editable/active when enabled) */}
      <div className={`p-4 space-y-4 ${isEnabled ? 'bg-white' : 'bg-slate-50/50 opacity-80'}`}>
        {!isEnabled ? (
          /* READ-ONLY SUMMARY PREVIEW WHEN DISABLED */
          <div className="space-y-3">
            <div className="flex items-center justify-between text-slate-500">
              <span>Read-only overview. Enable the toggle switch above to edit proposal file links and deal values.</span>
              <span className="text-[11px] font-mono text-slate-400">Current Deal Value: {formatCurrency(opportunity.dealValue, opportunity.currency)}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Client Proposal File Link</span>
                <div className="font-semibold text-slate-800 truncate mt-0.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  {proposalLink ? (
                    proposalLink.startsWith('http://') || proposalLink.startsWith('https://') ? (
                      <a href={proposalLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                        <span className="truncate">{proposalLink}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="truncate">{proposalLink}</span>
                    )
                  ) : (
                    <span className="text-slate-400 italic font-normal">No link specified</span>
                  )}
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Pricing Calculator File Link</span>
                <div className="font-semibold text-slate-800 truncate mt-0.5 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  {calcLink ? (
                    calcLink.startsWith('http://') || calcLink.startsWith('https://') ? (
                      <a href={calcLink} target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:underline flex items-center gap-1">
                        <span className="truncate">{calcLink}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="truncate">{calcLink}</span>
                    )
                  ) : (
                    <span className="text-slate-400 italic font-normal">No link specified</span>
                  )}
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">{config.amountLabel}</span>
                <div className="font-extrabold text-emerald-700 text-sm mt-0.5">
                  {formatCurrency(opportunity.dealValue, opportunity.currency)}
                </div>
                {stage === 'INITIAL_FINANCE_APPROVAL' && (
                  <div className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-between">
                    <span>Est. Cost: {formatCurrency(opportunity.solutionProposal?.ibsiInternalCost, opportunity.solutionProposal?.ibsiInternalCurrency || opportunity.currency)}</span>
                    <span className="font-bold text-purple-700">({computedGrossMarginPercent.toFixed(1)}% Margin)</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ACTIVE EDITING FORM WHEN ENABLED */
          <form onSubmit={handleSave} className="space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Field 1: Client Proposal Link to File */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Client Proposal Link to File</span>
                  </label>
                  {proposalLink && (proposalLink.startsWith('http://') || proposalLink.startsWith('https://')) && (
                    <a
                      href={proposalLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-blue-600 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Open Link</span>
                    </a>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={proposalLink}
                    onChange={(e) => setProposalLink(e.target.value)}
                    placeholder="https://sharepoint.com/proposal.pdf or https://docs.google.com/..."
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-400"
                  />
                  <FileText className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                </div>
                <span className="text-[10px] text-slate-500 block">
                  Enter web link to client proposal (e.g., SharePoint, Google Docs, OneDrive, Confluence).
                </span>
              </div>

              {/* Field 2: Client Proposal Pricing Calculator Link to File */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Client Proposal Pricing Calculator Link to File</span>
                  </label>
                  {calcLink && (calcLink.startsWith('http://') || calcLink.startsWith('https://')) && (
                    <a
                      href={calcLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-emerald-700 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Open Calculator</span>
                    </a>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={calcLink}
                    onChange={(e) => setCalcLink(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/... or https://excel.cloud/..."
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder-slate-400"
                  />
                  <Link2 className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                </div>
                <span className="text-[10px] text-slate-500 block">
                  Enter web link to pricing model, bill of materials, or financial calculator sheet.
                </span>
              </div>
            </div>

            {/* Field 3: Currency and Amount for Proposed Deal Value (TCV) */}
            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/90 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200 pb-2">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-900 text-xs">{config.amountLabel}</span>
                </div>
                <span className="text-[11px] text-slate-500">
                  {config.amountSubtitle}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Currency Dropdown */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">
                    TCV Currency <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
                  >
                    {SUPPORTED_CURRENCIES.map((curr) => (
                      <option key={curr.code} value={curr.code}>
                        {curr.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount Numeric Input */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700 block">
                      {config.amountLabel} Amount <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] font-extrabold text-emerald-700">
                      {formatCurrency(numericTcv, currency)}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={dealValue}
                      onChange={(e) => setDealValue(e.target.value)}
                      placeholder="e.g., 850000"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Stage 5 Specific: Est. Internal / Delivery Cost + Live Gross Profit and Margin Calculation */}
            {stage === 'INITIAL_FINANCE_APPROVAL' && (
              <div className="p-3.5 bg-purple-50/60 rounded-xl border border-purple-200/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-purple-200/60 pb-2">
                  <div className="flex items-center space-x-2">
                    <Calculator className="w-4 h-4 text-purple-600" />
                    <span className="font-bold text-slate-900 text-xs">
                      Internal Delivery Cost & Gross Margin Model
                    </span>
                  </div>
                  <span className="text-[11px] text-purple-800 font-semibold">
                    Auto-computed margin economics
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Internal Cost Currency */}
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">
                      Internal Cost Currency <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={internalCostCurrency}
                      onChange={(e) => setInternalCostCurrency(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none text-xs"
                    >
                      {SUPPORTED_CURRENCIES.map((curr) => (
                        <option key={curr.code} value={curr.code}>
                          {curr.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Internal Cost Amount */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-slate-700 block">
                        Est. Internal / Delivery Cost <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[11px] font-bold text-purple-800">
                        {formatCurrency(numericCost, internalCostCurrency)}
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={internalCost}
                        onChange={(e) => setInternalCost(e.target.value)}
                        placeholder="e.g., 480000"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Auto-computed Economics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-2.5 bg-white rounded-lg border border-purple-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">
                        Est. Gross Profit ($)
                      </span>
                      <span
                        className={`text-sm font-extrabold ${
                          computedGrossProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {formatCurrency(computedGrossProfit, currency)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-mono">
                        TCV - Cost
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-purple-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">
                        Gross Margin (%)
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-extrabold ${
                            computedGrossMarginPercent >= 35
                              ? 'text-emerald-700'
                              : computedGrossMarginPercent >= 20
                              ? 'text-amber-700'
                              : 'text-rose-600'
                          }`}
                        >
                          {computedGrossMarginPercent.toFixed(1)}%
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            computedGrossMarginPercent >= 35
                              ? 'bg-emerald-100 text-emerald-800'
                              : computedGrossMarginPercent >= 20
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {computedGrossMarginPercent >= 35
                            ? 'Healthy'
                            : computedGrossMarginPercent >= 20
                            ? 'Standard'
                            : 'Low Alert'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-mono">
                        Target ≥ 35%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Bar with Save Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-200">
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  Saving will update the Deal Value of the modal and log an entry in the Opportunity Audit Trail.
                </span>
              </div>

              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsEnabled(false);
                    setErrorMessage(null);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className={`inline-flex items-center justify-center px-4 py-2 text-xs font-bold rounded-lg ${config.btnBg} shadow-xs transition-all cursor-pointer gap-1.5`}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>
                    {stage === 'INITIAL_FINANCE_APPROVAL'
                      ? 'Save Proposal Details & Margin Economics'
                      : 'Save Client Proposal Details'}
                  </span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
