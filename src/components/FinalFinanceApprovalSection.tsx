import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  Calendar, 
  UserCheck, 
  FileText, 
  FileSpreadsheet, 
  Link2, 
  DollarSign, 
  ExternalLink, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  RotateCcw, 
  ArrowRight,
  Sliders,
  AlertTriangle
} from 'lucide-react';
import { Opportunity, StakeholderRole, ResourceMember, AuditLogEntry, FinanceAuditEntry } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { SUPPORTED_CURRENCIES } from './NewOpportunityModal';

interface FinalFinanceApprovalSectionProps {
  opportunity: Opportunity;
  currentRole: StakeholderRole;
  resources?: ResourceMember[];
  comments: string;
  setComments: (c: string) => void;
  onUpdateOpportunity: (updated: Opportunity) => void;
  onRequestReturnToContracts: () => void;
  onSignOffFinalFinance: (commentsText: string) => void;
}

export const FinalFinanceApprovalSection: React.FC<FinalFinanceApprovalSectionProps> = ({
  opportunity,
  currentRole,
  resources = [],
  comments,
  setComments,
  onUpdateOpportunity,
  onRequestReturnToContracts,
  onSignOffFinalFinance,
}) => {
  // 1. Stage 9 Trigger Date & SLA calculations
  const stage9TriggerDate =
    opportunity.finalFinanceApproval?.stage9TriggerDate ||
    (opportunity.currentStage === 'FINAL_FINANCE_APPROVAL'
      ? (opportunity.stageEnteredAt || opportunity.updatedAt || opportunity.createdAt)
      : (opportunity.stageEnteredAt || opportunity.createdAt));

  const slaTriggerToAckDays = opportunity.finalFinanceApproval?.slaTriggerToAckDays ?? 1;
  const stage9TargetSlaDays = opportunity.finalFinanceApproval?.stage9TargetSlaDays ?? 2;

  const nowMs = Date.now();
  const triggerMs = stage9TriggerDate ? new Date(stage9TriggerDate).getTime() : nowMs;
  const elapsedDaysFromTrigger = Math.max(0, Math.floor((nowMs - triggerMs) / (1000 * 60 * 60 * 24)));

  // Auto-default logic: if no manual input in acknowledged date after SLA days, default to Trigger Date + SLA
  const rawAckDate = opportunity.finalFinanceApproval?.acknowledgedStartDate || '';
  const isAutoDefaulted = !rawAckDate && elapsedDaysFromTrigger >= slaTriggerToAckDays;
  const autoDefaultedAckDate = new Date(triggerMs + slaTriggerToAckDays * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  const effectiveAckDate = rawAckDate || (isAutoDefaulted ? autoDefaultedAckDate : '');

  const isAckOverdue = !rawAckDate && elapsedDaysFromTrigger > slaTriggerToAckDays;
  const ackMs = effectiveAckDate ? new Date(effectiveAckDate).getTime() : null;
  const elapsedDaysFromAck = ackMs ? Math.max(0, Math.floor((nowMs - ackMs) / (1000 * 60 * 60 * 24))) : 0;
  const isApprovalOverdue = effectiveAckDate ? elapsedDaysFromAck > stage9TargetSlaDays : false;

  // 2. Finance Team Processor
  const financeProcessor =
    opportunity.finalFinanceApproval?.financeProcessor ||
    opportunity.financeProcessor ||
    '';

  const financeResources = resources.filter(
    (r) =>
      r.department?.toLowerCase().includes('finance') ||
      r.role?.toLowerCase().includes('finance') ||
      r.division?.toLowerCase().includes('finance')
  );

  // 3. Enable / Disable for "Update the Client Contract details"
  const [isUpdateContractEnabled, setIsUpdateContractEnabled] = useState<boolean>(
    opportunity.finalFinanceApproval?.enableContractUpdates || false
  );

  // Contract fields to update if enabled
  const [contractLink, setContractLink] = useState<string>(
    opportunity.contractDetails?.clientContractLink || ''
  );
  const [calcLink, setCalcLink] = useState<string>(
    opportunity.contractDetails?.clientContractPricingCalculatorLink || ''
  );
  const [currency, setCurrency] = useState<string>(
    opportunity.contractDetails?.clientContractPriceCurrency || opportunity.currency || 'USD'
  );
  const [contractPrice, setContractPrice] = useState<number | string>(
    opportunity.contractDetails?.clientContractPriceAmount ?? opportunity.dealValue ?? 0
  );

  // Feedback notifications
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state if opportunity changes externally
  useEffect(() => {
    setContractLink(opportunity.contractDetails?.clientContractLink || '');
    setCalcLink(opportunity.contractDetails?.clientContractPricingCalculatorLink || '');
    setCurrency(
      opportunity.contractDetails?.clientContractPriceCurrency || opportunity.currency || 'USD'
    );
    setContractPrice(
      opportunity.contractDetails?.clientContractPriceAmount ?? opportunity.dealValue ?? 0
    );
    if (opportunity.finalFinanceApproval?.enableContractUpdates !== undefined) {
      setIsUpdateContractEnabled(opportunity.finalFinanceApproval.enableContractUpdates);
    }
  }, [
    opportunity.contractDetails?.clientContractLink,
    opportunity.contractDetails?.clientContractPricingCalculatorLink,
    opportunity.contractDetails?.clientContractPriceCurrency,
    opportunity.contractDetails?.clientContractPriceAmount,
    opportunity.dealValue,
    opportunity.currency,
    opportunity.finalFinanceApproval?.enableContractUpdates,
  ]);

  const numericContractPrice =
    typeof contractPrice === 'number' ? contractPrice : parseFloat(contractPrice) || 0;
  const previousDealValue = opportunity.dealValue || 0;
  const priceVariance = numericContractPrice - previousDealValue;
  const priceVariancePercent =
    previousDealValue > 0 ? (priceVariance / previousDealValue) * 100 : 0;

  // Handlers for SLA & Processor updates
  const handleSetAckDateToday = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    onUpdateOpportunity({
      ...opportunity,
      financeProcessor: financeProcessor || opportunity.financeProcessor,
      finalFinanceApproval: {
        ...opportunity.finalFinanceApproval,
        approved: opportunity.finalFinanceApproval?.approved || false,
        stage9TriggerDate,
        acknowledgedStartDate: todayStr,
        slaTriggerToAckDays,
        stage9TargetSlaDays,
        financeProcessor: financeProcessor || opportunity.financeProcessor,
      },
    });
  };

  const handleAckDateChange = (val: string) => {
    onUpdateOpportunity({
      ...opportunity,
      financeProcessor: financeProcessor || opportunity.financeProcessor,
      finalFinanceApproval: {
        ...opportunity.finalFinanceApproval,
        approved: opportunity.finalFinanceApproval?.approved || false,
        stage9TriggerDate,
        acknowledgedStartDate: val,
        slaTriggerToAckDays,
        stage9TargetSlaDays,
        financeProcessor: financeProcessor || opportunity.financeProcessor,
      },
    });
  };

  const handleProcessorChange = (val: string) => {
    onUpdateOpportunity({
      ...opportunity,
      financeProcessor: val,
      finalFinanceApproval: {
        ...opportunity.finalFinanceApproval,
        approved: opportunity.finalFinanceApproval?.approved || false,
        stage9TriggerDate,
        acknowledgedStartDate: effectiveAckDate,
        slaTriggerToAckDays,
        stage9TargetSlaDays,
        financeProcessor: val,
      },
    });
  };

  // Toggle Enable / Disable Update the Client Contract details
  const handleToggleUpdateContract = (enabled: boolean) => {
    setIsUpdateContractEnabled(enabled);
    onUpdateOpportunity({
      ...opportunity,
      finalFinanceApproval: {
        ...opportunity.finalFinanceApproval,
        approved: opportunity.finalFinanceApproval?.approved || false,
        stage9TriggerDate,
        acknowledgedStartDate: effectiveAckDate,
        slaTriggerToAckDays,
        stage9TargetSlaDays,
        financeProcessor,
        enableContractUpdates: enabled,
      },
    });
  };

  // Save updated Client Contract details, update deal value and log in audit trail
  const handleSaveContractDetails = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const parsedPrice =
      typeof contractPrice === 'number' ? contractPrice : parseFloat(contractPrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setErrorMessage('Please enter a valid positive Client Contract Price (TCV).');
      return;
    }

    const now = new Date().toISOString();
    const actorName =
      financeProcessor ||
      (currentRole === 'FINANCE' ? 'Finance Team Processor' : `${currentRole} Reviewer`);

    const delta = parsedPrice - previousDealValue;
    const isPriceChanged = delta !== 0;

    // 1. AuditLogEntry for opportunity.history
    const historyEntry: AuditLogEntry = {
      id: `hist-stage9-tcv-${Date.now()}`,
      timestamp: now,
      stage: 'FINAL_FINANCE_APPROVAL',
      actorName,
      actorRole: 'FINANCE' as StakeholderRole,
      action: 'Final Finance: Client Contract Details & Deal Value Reconciled',
      comments: `Client Contract Price (TCV) updated to ${formatCurrency(parsedPrice, currency)}${
        isPriceChanged
          ? ` (Previous Deal Value: ${formatCurrency(previousDealValue, opportunity.currency)}, Delta: ${
              delta >= 0 ? '+' : ''
            }${formatCurrency(delta, currency)})`
          : ' (reconfirmed)'
      }. Contract Link: ${contractLink || 'N/A'}, Calculator Link: ${
        calcLink || 'N/A'
      }. Opportunity deal value synchronized.`,
      dealValue: parsedPrice,
      previousDealValue: previousDealValue,
      currency: currency,
      variance: delta,
    };

    // 2. FinanceAuditEntry for opportunity.financeAuditTrail
    const financeAuditEntry: FinanceAuditEntry = {
      id: `audit-stage9-reconcile-${Date.now()}`,
      timestamp: now,
      stage: 'FINAL_FINANCE_APPROVAL',
      stageName: 'Stage 9: Final Finance Approval',
      eventType: 'FINAL_FINANCE_APPROVAL',
      actorName,
      actorRole: 'FINANCE',
      actionLabel: 'Final Finance: Contract Details Reconciled & TCV Locked',
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
      notes: `Finance team reconciled and updated Client Contract details. Contract Link: ${
        contractLink || 'N/A'
      } | Calculator Link: ${calcLink || 'N/A'}. Final binding TCV synchronized to ${formatCurrency(
        parsedPrice,
        currency
      )}.`,
    };

    const updatedOpportunity: Opportunity = {
      ...opportunity,
      dealValue: parsedPrice,
      currency: currency,
      updatedAt: now,
      financeProcessor: financeProcessor || opportunity.financeProcessor,
      contractDetails: {
        ...opportunity.contractDetails,
        clientContractLink: contractLink,
        clientContractFileName: contractLink,
        clientContractPricingCalculatorLink: calcLink,
        clientContractPricingCalculatorFileName: calcLink,
        clientContractPriceCurrency: currency,
        clientContractPriceAmount: parsedPrice,
        clientProposalPriceUpdated: true,
      },
      finalFinanceApproval: {
        ...opportunity.finalFinanceApproval,
        approved: opportunity.finalFinanceApproval?.approved || false,
        stage9TriggerDate,
        acknowledgedStartDate: effectiveAckDate,
        slaTriggerToAckDays,
        stage9TargetSlaDays,
        financeProcessor: financeProcessor || opportunity.financeProcessor,
        finalTcv: parsedPrice,
        finalCurrency: currency,
        enableContractUpdates: isUpdateContractEnabled,
      },
      history: [...(opportunity.history || []), historyEntry],
      financeAuditTrail: [...(opportunity.financeAuditTrail || []), financeAuditEntry],
    };

    onUpdateOpportunity(updatedOpportunity);
    setSuccessToast(
      `✓ Deal Value updated to ${formatCurrency(parsedPrice, currency)} and logged in Audit Trail!`
    );
    setTimeout(() => setSuccessToast(null), 5000);
  };

  return (
    <div className="space-y-4 text-xs">
      {/* 1. Header Context Card */}
      <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
        <div>
          <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-violet-600" />
            Final Finance Sign-Off & Commercial Clearance
          </div>
          <p className="text-slate-600 mt-0.5">
            Finance validates binding contract price, reconciled pricing calculator, acknowledge SLA timeline, and validates commercial clearance prior to DocuSign routing.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2.5 py-1 rounded-lg bg-violet-50 text-violet-800 border border-violet-200 text-[11px] font-bold">
            Final Binding TCV: {formatCurrency(opportunity.dealValue, opportunity.currency)}
          </span>
          {opportunity.contractDetails?.contractNumber && (
            <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-mono font-semibold">
              {opportunity.contractDetails.contractNumber}
            </span>
          )}
        </div>
      </div>

      {/* Previous Return Notice if applicable */}
      {(opportunity.finalFinanceApproval?.returnReason || opportunity.contractDetails?.returnReason) && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start space-x-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-xs text-amber-950">Previous Return Reason Logged:</div>
            <p className="text-[11px] text-amber-900 mt-0.5">
              {opportunity.finalFinanceApproval?.returnReason || opportunity.contractDetails?.returnReason}
            </p>
          </div>
        </div>
      )}

      {/* 2. Stage 9 SLA Governance Grid (3 Columns) */}
      <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200/90 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-violet-600" />
            <span className="font-bold text-slate-900 text-xs">Stage 9 SLA Ingress & Finance Assignment</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            SLA Reference Clock: <span className="font-semibold text-slate-700">{effectiveAckDate ? 'Acknowledged Start Date' : 'Stage Trigger Date'}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Field 1: Stage 9 Trigger Date (Non-editable) */}
          <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="stage9-trigger-date-display" className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                Stage 9 Trigger Date
                <span className="text-slate-400 font-normal">(Non-editable)</span>
              </label>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-600">
                Workflow Ingress
              </span>
            </div>
            <div id="stage9-trigger-date-display" className="flex items-center gap-2 p-1.5 bg-slate-50/80 rounded border border-slate-200 text-slate-800 font-mono text-xs font-semibold">
              <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>{stage9TriggerDate ? stage9TriggerDate.split('T')[0] : 'Pending Ingress'}</span>
              {stage9TriggerDate && (
                <span className="text-[10px] text-slate-500 font-sans font-normal ml-auto">
                  ({formatDate(stage9TriggerDate)})
                </span>
              )}
            </div>
            <span className="text-[9px] text-slate-400 mt-1 block">
              Automatic timestamp recorded upon entering Final Finance Approval stage.
            </span>
          </div>

          {/* Field 2: Acknowledged Start Date */}
          <div className="p-2.5 bg-white rounded-lg border border-violet-200 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="stage9-ack-start-date" className="text-[10px] font-bold text-violet-950 uppercase tracking-wider flex items-center gap-1">
                Acknowledged Start Date
                <span className="text-violet-600 font-semibold">*</span>
              </label>
              <button
                type="button"
                onClick={handleSetAckDateToday}
                className="text-[10px] text-violet-700 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
              >
                <Check className="w-3 h-3" />
                Set Today
              </button>
            </div>
            <input
              id="stage9-ack-start-date"
              type="date"
              value={effectiveAckDate ? effectiveAckDate.split('T')[0] : ''}
              onChange={(e) => handleAckDateChange(e.target.value)}
              className="w-full bg-white border border-violet-300 rounded px-2.5 py-1 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-violet-500 focus:outline-none"
            />
            <div className="flex items-center justify-between text-[9px] text-slate-500 mt-1">
              <span>
                {isAutoDefaulted ? (
                  <strong className="text-amber-600">Auto-defaulted (Trigger + {slaTriggerToAckDays}d SLA)</strong>
                ) : rawAckDate ? (
                  <span className="text-emerald-700 font-semibold">Manually Acknowledged</span>
                ) : (
                  <span>Ack SLA window: <strong>{slaTriggerToAckDays} day</strong></span>
                )}
              </span>
              <span className="text-slate-400">Target SLA: <strong>{stage9TargetSlaDays}d</strong></span>
            </div>
          </div>

          {/* Field 3: Dropdown for Finance Team Processor */}
          <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="stage9-finance-processor-select" className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                Finance Team Processor
                <span className="text-violet-600 font-semibold">*</span>
              </label>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-violet-50 text-violet-700">
                Finance Desk
              </span>
            </div>
            <select
              id="stage9-finance-processor-select"
              value={financeProcessor}
              onChange={(e) => handleProcessorChange(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-violet-500 focus:outline-none"
            >
              <option value="">Select Finance Team Processor...</option>
              {financeResources.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name} ({r.role || 'Finance'})
                </option>
              ))}
              {/* Fallback to non-finance resources if list is empty */}
              {financeResources.length === 0 &&
                resources.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name} ({r.role})
                  </option>
                ))}
              {financeProcessor &&
                !resources.some((r) => r.name === financeProcessor) && (
                  <option value={financeProcessor}>{financeProcessor}</option>
                )}
            </select>
            <span className="text-[9px] text-slate-400 mt-1 block">
              Designated finance officer or deal desk analyst managing commercial clearance.
            </span>
          </div>
        </div>
      </div>

      {/* Stage 9 SLA Notification Banner */}
      <div
        className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs transition-colors ${
          !rawAckDate
            ? isAutoDefaulted
              ? 'bg-amber-50/90 border-amber-300 text-amber-900'
              : isAckOverdue
              ? 'bg-rose-50 border-rose-300 text-rose-900'
              : 'bg-violet-50/80 border-violet-200 text-violet-900'
            : isApprovalOverdue
            ? 'bg-rose-50 border-rose-300 text-rose-900'
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}
      >
        <div className="flex items-center space-x-2">
          {!rawAckDate ? (
            isAutoDefaulted ? (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            ) : isAckOverdue ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <Clock className="w-4 h-4 text-violet-600 shrink-0" />
            )
          ) : isApprovalOverdue ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <div>
            <span className="font-bold">
              {!rawAckDate
                ? isAutoDefaulted
                  ? `Acknowledgment SLA Auto-Defaulted (Trigger + ${slaTriggerToAckDays} day)`
                  : isAckOverdue
                  ? `Acknowledgment Overdue by ${elapsedDaysFromTrigger - slaTriggerToAckDays} day(s)`
                  : `Ingress Pending Acknowledgment (SLA: ${slaTriggerToAckDays} day)`
                : isApprovalOverdue
                ? `Final Finance Approval Target SLA Overdue by ${elapsedDaysFromAck - stage9TargetSlaDays} day(s)`
                : `Final Finance Review Active (Target SLA: ${stage9TargetSlaDays} days)`}
            </span>
            <span className="text-[11px] block opacity-85">
              {!rawAckDate
                ? isAutoDefaulted
                  ? `SLA threshold elapsed. Acknowledged Start Date defaulted to ${effectiveAckDate}. SLA clock active.`
                  : `Triggered on ${stage9TriggerDate ? stage9TriggerDate.split('T')[0] : 'today'}. Acknowledge start date to begin formal finance review.`
                : `Acknowledged: ${effectiveAckDate}. Review days elapsed: ${elapsedDaysFromAck}d of ${stage9TargetSlaDays}d target.`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-white/80 border border-current shadow-2xs">
            {effectiveAckDate ? `Elapsed: ${elapsedDaysFromAck}d / ${stage9TargetSlaDays}d` : `Ingress: ${elapsedDaysFromTrigger}d`}
          </span>
        </div>
      </div>

      {/* 3. Read-Only Contract Document Overview (Always visible) */}
      <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-teal-600" />
            Contractual Document References
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            Origin: Stage 8 Conversion
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-500 block font-semibold mb-0.5">Client Contract Link to File</span>
            {opportunity.contractDetails?.clientContractLink ? (
              <div className="flex items-center justify-between gap-1">
                <span className="font-mono text-slate-800 text-[11px] truncate" title={opportunity.contractDetails.clientContractLink}>
                  {opportunity.contractDetails.clientContractFileName || opportunity.contractDetails.clientContractLink}
                </span>
                {(opportunity.contractDetails.clientContractLink.startsWith('http://') ||
                  opportunity.contractDetails.clientContractLink.startsWith('https://')) && (
                  <a
                    href={opportunity.contractDetails.clientContractLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-teal-700 font-bold hover:underline inline-flex items-center gap-0.5 shrink-0"
                  >
                    <ExternalLink className="w-3 h-3" /> Open
                  </a>
                )}
              </div>
            ) : (
              <span className="text-slate-400 italic text-[11px]">No contract file link recorded</span>
            )}
          </div>

          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-500 block font-semibold mb-0.5">Client Pricing Calculator Link to File</span>
            {opportunity.contractDetails?.clientContractPricingCalculatorLink ? (
              <div className="flex items-center justify-between gap-1">
                <span className="font-mono text-slate-800 text-[11px] truncate" title={opportunity.contractDetails.clientContractPricingCalculatorLink}>
                  {opportunity.contractDetails.clientContractPricingCalculatorFileName || opportunity.contractDetails.clientContractPricingCalculatorLink}
                </span>
                {(opportunity.contractDetails.clientContractPricingCalculatorLink.startsWith('http://') ||
                  opportunity.contractDetails.clientContractPricingCalculatorLink.startsWith('https://')) && (
                  <a
                    href={opportunity.contractDetails.clientContractPricingCalculatorLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-emerald-700 font-bold hover:underline inline-flex items-center gap-0.5 shrink-0"
                  >
                    <ExternalLink className="w-3 h-3" /> Open
                  </a>
                )}
              </div>
            ) : (
              <span className="text-slate-400 italic text-[11px]">No pricing calculator link recorded</span>
            )}
          </div>
        </div>
      </div>

      {/* 4. Enable / Disable for "Update the Client Contract Details" */}
      <div className="p-4 bg-white rounded-xl border border-violet-200/90 shadow-2xs space-y-4">
        {/* Toggle Switch Row */}
        <div className="flex items-center justify-between pb-3 border-b border-violet-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
              <Sliders className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Update Client Contract Details</h4>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  isUpdateContractEnabled
                    ? 'bg-violet-100 text-violet-900 border-violet-300'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {isUpdateContractEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Enable to revise contract file links, pricing calculator link, and update the Client Contract Price (TCV) with audit trail logging.
              </p>
            </div>
          </div>

          {/* Toggle Button */}
          <div className="flex items-center gap-2 shrink-0">
            <label htmlFor="toggle-enable-contract-updates" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
              {isUpdateContractEnabled ? 'Modifications Active' : 'Enable Editing'}
            </label>
            <input
              id="toggle-enable-contract-updates"
              type="checkbox"
              checked={isUpdateContractEnabled}
              onChange={(e) => handleToggleUpdateContract(e.target.checked)}
              className="w-4 h-4 text-violet-600 bg-gray-100 border-gray-300 rounded focus:ring-violet-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Toast Notification */}
        {successToast && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 flex items-center justify-between gap-2 text-xs">
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
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 flex items-center justify-between gap-2 text-xs">
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

        {/* If enabled: Form for links, currency, amount and Save button */}
        {isUpdateContractEnabled ? (
          <div className="space-y-4 pt-1 animate-in fade-in duration-150">
            {/* 2 Link to File Columns (Text input only) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Field A: Client Contract Link to File */}
              <div className="space-y-1.5 bg-slate-50/70 p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="stage9-contract-link-input" className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-teal-600" />
                      <span>Client Contract Link to File</span>
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

                  <div className="relative">
                    <input
                      id="stage9-contract-link-input"
                      type="text"
                      value={contractLink}
                      onChange={(e) => setContractLink(e.target.value)}
                      placeholder="e.g., https://drive.google.com/... or file repository link"
                      className="w-full pl-3 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                    />
                    <Link2 className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 block mt-2">
                  Update link to formal legal contract or Master Services Agreement.
                </span>
              </div>

              {/* Field B: Client Contract Pricing Calculator Link to File */}
              <div className="space-y-1.5 bg-slate-50/70 p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="stage9-calc-link-input" className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
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

                  <div className="relative">
                    <input
                      id="stage9-calc-link-input"
                      type="text"
                      value={calcLink}
                      onChange={(e) => setCalcLink(e.target.value)}
                      placeholder="e.g., https://docs.google.com/spreadsheets/... or file repository link"
                      className="w-full pl-3 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <Link2 className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 block mt-2">
                  Update link to final contractual rate matrix or reconciled margin calculator.
                </span>
              </div>
            </div>

            {/* Field C: Currency and Amount to Update Client Contract Price (TCV) */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <label htmlFor="stage9-contract-price-input" className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Client Contract Price (TCV)</span>
                  <span className="text-emerald-700 font-semibold text-[10px] bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-200">
                    Updates Opportunity Deal Value
                  </span>
                </label>
                <span className="text-[10px] text-slate-500">
                  Reconciled total contract value agreed for final commercial sign-off
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                {/* Currency Selector */}
                <div className="sm:col-span-3">
                  <label htmlFor="stage9-contract-currency-select" className="text-[10px] font-bold text-slate-600 block mb-1 uppercase tracking-wider">
                    Contract Currency
                  </label>
                  <select
                    id="stage9-contract-currency-select"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-violet-500 text-xs shadow-2xs"
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
                  <label htmlFor="stage9-contract-price-input" className="text-[10px] font-bold text-slate-600 block mb-1 uppercase tracking-wider">
                    Client Contract Price Amount (TCV)
                  </label>
                  <input
                    id="stage9-contract-price-input"
                    type="number"
                    step="any"
                    min="0"
                    value={contractPrice}
                    onChange={(e) => setContractPrice(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveContractDetails();
                      }
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-emerald-700 font-extrabold text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-2xs"
                    placeholder="0.00"
                  />
                </div>

                {/* Save Button */}
                <div className="sm:col-span-4">
                  <button
                    id="btn-save-stage9-contract-details"
                    type="button"
                    onClick={() => handleSaveContractDetails()}
                    className="w-full inline-flex items-center justify-center px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Save & Update Deal Value
                  </button>
                </div>
              </div>

              {/* Financial Variance Context */}
              <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-[11px]">Current Deal Value:</span>
                  <span className="font-semibold text-slate-700">
                    {formatCurrency(previousDealValue, opportunity.currency)}
                  </span>
                  <span className="text-slate-400">→</span>
                  <span className="text-slate-500 text-[11px]">New Contract Price:</span>
                  <span className="font-extrabold text-emerald-700">
                    {formatCurrency(numericContractPrice, currency)}
                  </span>
                </div>

                <div>
                  {priceVariance === 0 ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      <Check className="w-3 h-3 text-slate-500" />
                      No variance vs deal value
                    </span>
                  ) : priceVariance > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      <TrendingUp className="w-3 h-3 text-emerald-600" />
                      +{formatCurrency(priceVariance, currency)} (+{priceVariancePercent.toFixed(1)}%)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                      <TrendingDown className="w-3 h-3 text-amber-600" />
                      -{formatCurrency(Math.abs(priceVariance), currency)} ({priceVariancePercent.toFixed(1)}%)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-slate-500 text-center text-xs">
            Contract details modification is currently disabled. Toggle the checkbox above to enable editing for document links and contract price.
          </div>
        )}
      </div>

      {/* 5. Finance Sign-off Remarks */}
      <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1.5">
        <label htmlFor="stage9-finance-comments" className="block text-slate-800 font-bold text-xs">
          Finance Sign-Off Notes / Commercial Endorsement Comments
        </label>
        <textarea
          id="stage9-finance-comments"
          rows={2}
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Commercial validation remarks, revenue recognition baseline, billing milestones verified, or notes for DocuSign routing..."
          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none"
        />
        <span className="text-[10px] text-slate-400 block">
          Comments are permanently recorded in the opportunity timeline and finance audit trail.
        </span>
      </div>

      {/* 6. Action Buttons Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
        {/* Revert Button: Return to Contracts Team for Contract Update/Clarification */}
        <button
          id="btn-return-to-contracts-stage8"
          type="button"
          onClick={onRequestReturnToContracts}
          className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold rounded-lg bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-all cursor-pointer gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
          Return to Contracts Team for Contract Update/Clarification
        </button>

        {/* Sign Off Button: Ready for DocuSign */}
        <button
          id="btn-signoff-final-finance"
          type="button"
          onClick={() => onSignOffFinalFinance(comments)}
          className="inline-flex items-center justify-center px-5 py-2 text-xs font-bold rounded-lg bg-violet-600 text-white hover:bg-violet-700 shadow-xs transition-all cursor-pointer gap-1.5"
        >
          <span>Sign Off Final Finance (Ready for DocuSign)</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </button>
      </div>
    </div>
  );
};
