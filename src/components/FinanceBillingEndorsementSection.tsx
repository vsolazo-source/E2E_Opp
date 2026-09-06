import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Receipt,
  Calendar,
  Clock,
  User,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileText,
  Check,
  X,
  ArrowRight,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Opportunity, StakeholderRole, ResourceMember, WorkflowStage } from '../types';
import { formatDate, formatCurrency } from '../utils/formatters';

interface FinanceBillingEndorsementSectionProps {
  opportunity: Opportunity;
  currentRole: StakeholderRole;
  currentUserName?: string;
  resources?: ResourceMember[];
  comments: string;
  setComments: (c: string) => void;
  onUpdateOpportunity: (updated: Opportunity) => void;
  onAdvanceStage: (
    nextStage: WorkflowStage,
    actionName: string,
    comments?: string,
    extraUpdates?: Partial<Opportunity>
  ) => void;
}

export const FinanceBillingEndorsementSection: React.FC<FinanceBillingEndorsementSectionProps> = ({
  opportunity,
  currentRole,
  currentUserName,
  resources = [],
  comments,
  setComments,
  onUpdateOpportunity,
  onAdvanceStage,
}) => {
  const billing = opportunity.billingRecord;
  const oppTracking = opportunity.trackingCode || opportunity.id || 'OPP-001';

  // 1. Stage 14 Trigger Date: Non-editable, automatically recorded upon entering stage
  const stage14TriggerDate = useMemo(() => {
    return (
      billing?.stage14TriggerDate ||
      (opportunity.currentStage === 'FINANCE_BILLING_ENDORSEMENT' ? opportunity.stageEnteredAt : opportunity.updatedAt) ||
      new Date().toISOString().split('T')[0]
    );
  }, [billing?.stage14TriggerDate, opportunity.stageEnteredAt, opportunity.updatedAt, opportunity.currentStage]);

  // SLA window between Trigger Date and Acknowledged Start Date (default: 2 days)
  const slaTriggerToAckDays = billing?.slaTriggerToAckDays ?? 2;
  const stage14TargetSlaDays = billing?.stage14TargetSlaDays ?? 3;

  const nowMs = Date.now();
  const triggerMs = useMemo(() => (stage14TriggerDate ? new Date(stage14TriggerDate).getTime() : nowMs), [stage14TriggerDate, nowMs]);
  const elapsedDaysFromTrigger = Math.max(0, Math.floor((nowMs - triggerMs) / (1000 * 60 * 60 * 24)));

  // Auto-default logic: if no manual input in acknowledged date after SLA days, default to Trigger Date + SLA
  const rawAckDate = billing?.acknowledgedStartDate || '';
  const isAutoDefaulted = !rawAckDate && elapsedDaysFromTrigger >= slaTriggerToAckDays;
  const autoDefaultedAckDate = useMemo(() => {
    return new Date(triggerMs + slaTriggerToAckDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  }, [triggerMs, slaTriggerToAckDays]);
  const effectiveAckDate = rawAckDate || (isAutoDefaulted ? autoDefaultedAckDate : '');

  const effectiveStartMs = useMemo(() => {
    return effectiveAckDate ? new Date(effectiveAckDate).getTime() : triggerMs;
  }, [effectiveAckDate, triggerMs]);

  const targetCompletionDate = useMemo(() => {
    const d = new Date(effectiveStartMs + stage14TargetSlaDays * 24 * 60 * 60 * 1000);
    return d.toISOString().split('T')[0];
  }, [effectiveStartMs, stage14TargetSlaDays]);

  const elapsedDaysFromAck = Math.max(0, Math.floor((nowMs - effectiveStartMs) / (1000 * 60 * 60 * 24)));
  const remainingDays = stage14TargetSlaDays - elapsedDaysFromAck;
  const isOverdue = remainingDays < 0;

  // Handlers for Acknowledged Start Date
  const handleSetAckDateToday = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    onUpdateOpportunity({
      ...opportunity,
      billingRecord: {
        ...opportunity.billingRecord,
        paymentStatus: opportunity.billingRecord?.paymentStatus || 'ISSUED',
        stage14TriggerDate,
        acknowledgedStartDate: todayStr,
        slaTriggerToAckDays,
        stage14TargetSlaDays,
      },
    });
  };

  const handleAckDateChange = (val: string) => {
    onUpdateOpportunity({
      ...opportunity,
      billingRecord: {
        ...opportunity.billingRecord,
        paymentStatus: opportunity.billingRecord?.paymentStatus || 'ISSUED',
        stage14TriggerDate,
        acknowledgedStartDate: val,
        slaTriggerToAckDays,
        stage14TargetSlaDays,
      },
    });
  };

  // 2. Finance Processor: Dropdown referenced to resource directory + defaults
  const financeProcessorOptions = useMemo(() => {
    const defaultList = [
      'David Cho (Finance Controller)',
      'Elena Rostova (VP Finance)',
      'Maria Santos (Senior Billing Specialist)',
      'Mark Reyes (Finance Operations)',
      'Finance Accounts Receivable Desk',
    ];
    const fromDirectory = resources
      .filter((r) =>
        r.department?.toLowerCase().includes('finan') ||
        r.role?.toLowerCase().includes('finan') ||
        r.department?.toLowerCase().includes('account')
      )
      .map((r) => `${r.name} (${r.role || r.department})`);

    const combined = Array.from(new Set([...fromDirectory, ...defaultList]));
    return combined;
  }, [resources]);

  const currentFinanceProcessor =
    billing?.financeProcessor ||
    opportunity.financeProcessor ||
    opportunity.finalFinanceApproval?.financeProcessor ||
    'David Cho (Finance Controller)';

  const [financeProcessor, setFinanceProcessor] = useState(currentFinanceProcessor);

  const handleFinanceProcessorChange = (val: string) => {
    setFinanceProcessor(val);
    onUpdateOpportunity({
      ...opportunity,
      financeProcessor: val,
      billingRecord: {
        ...opportunity.billingRecord,
        paymentStatus: opportunity.billingRecord?.paymentStatus || 'ISSUED',
        financeProcessor: val,
        stage14TriggerDate,
        acknowledgedStartDate: effectiveAckDate || stage14TriggerDate,
        slaTriggerToAckDays,
        stage14TargetSlaDays,
      },
    });
  };

  // 3. Invoice & Billing Fields
  const defaultInvoiceNumber = oppTracking.includes('-OPP-')
    ? oppTracking.replace('-OPP-', '-INV-')
    : `INV-${new Date().getFullYear()}-${oppTracking.replace(/^OPP-/, '')}`;

  const [invoiceNumber, setInvoiceNumber] = useState(billing?.invoiceNumber || defaultInvoiceNumber);
  const [totalAmount, setTotalAmount] = useState<number>(billing?.totalAmount || opportunity.dealValue);
  const [paymentStatus, setPaymentStatus] = useState<
    'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE'
  >(billing?.paymentStatus || 'ISSUED');
  const [paymentDueDate, setPaymentDueDate] = useState<string>(
    billing?.paymentDueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endorsementNotes, setEndorsementNotes] = useState(billing?.endorsementNotes || '');

  // 4. Return to BU for CWC Remediation Modal State
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [returnError, setReturnError] = useState('');

  const handleOpenReturnModal = () => {
    setReturnReason('');
    setReturnError('');
    setIsReturnModalOpen(true);
  };

  const handleConfirmReturnToStage13 = () => {
    const trimmed = returnReason.trim();
    if (!trimmed) {
      setReturnError('A detailed reason is required to return to BU for CWC Remediation.');
      return;
    }

    const now = new Date().toISOString();
    const returnAudit = {
      id: `hist-cwc-return-${Date.now()}`,
      timestamp: now,
      stage: 'FINANCE_BILLING_ENDORSEMENT' as const,
      actorName: currentUserName || financeProcessor || 'Finance Controller',
      actorRole: currentRole,
      action: 'Returned to BU for CWC Remediation',
      notes: trimmed,
    };

    const extraUpdates: Partial<Opportunity> = {
      cwcRecord: {
        ...opportunity.cwcRecord,
        isAcceptedByClient: false,
        returnReason: trimmed,
      },
      billingRecord: {
        ...opportunity.billingRecord,
        paymentStatus: 'DRAFT',
        returnReason: trimmed,
        returnCount: (opportunity.billingRecord?.returnCount || 0) + 1,
        stage14TriggerDate,
        acknowledgedStartDate: effectiveAckDate || stage14TriggerDate,
        financeProcessor,
      },
      history: [...(opportunity.history || []), returnAudit],
    };

    setIsReturnModalOpen(false);
    onAdvanceStage(
      'CWC_DELIVERY',
      'Returned to BU for CWC Remediation',
      `Returned from Stage 14 (Finance Endorsement & Billing) for CWC Remediation. Reason: ${trimmed}`,
      extraUpdates
    );
  };

  // 5. Confirm Collection & Advance to Deal Closed (Stage 15)
  const handleConfirmBillingCollection = () => {
    const now = new Date().toISOString();
    const extraUpdates: Partial<Opportunity> = {
      financeProcessor,
      billingRecord: {
        ...opportunity.billingRecord,
        invoiceNumber,
        totalAmount,
        invoiceAmount: totalAmount,
        paymentStatus: 'PAID',
        paymentDueDate,
        confirmedByFinanceDate: now,
        endorsementNotes: endorsementNotes || comments,
        stage14TriggerDate,
        acknowledgedStartDate: effectiveAckDate || stage14TriggerDate,
        slaTriggerToAckDays,
        stage14TargetSlaDays,
        financeProcessor,
      },
    };

    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    onAdvanceStage(
      'DEAL_CLOSED',
      'Payment Collected & Deal Closed',
      comments || `Invoice ${invoiceNumber} marked as PAID. Full billing collection verified by ${financeProcessor}. Deal successfully closed.`,
      extraUpdates
    );
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Top Banner: Stage Overview & AR SLA Status */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-xl p-4 text-white border border-slate-700 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm sm:text-base text-white">Stage 14: Finance Endorsement & Billing</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Accounts Receivable (AR)
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Invoice generation, payment governance, and commercial billing reconciliation.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-center">
            {/* Revert Button: Return to BU for CWC Remediation */}
            <button
              type="button"
              onClick={handleOpenReturnModal}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Return to BU for CWC Remediation</span>
            </button>
          </div>
        </div>

        {/* SLA Status Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 border-t border-slate-700/80 text-[11px]">
          {/* Acknowledgement SLA Window */}
          <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700">
            <div className="flex items-center justify-between font-semibold">
              <span className="text-slate-300 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Acknowledgement Window</span>
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  effectiveAckDate
                    ? isAutoDefaulted
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-cyan-500/20 text-cyan-300'
                }`}
              >
                {effectiveAckDate
                  ? isAutoDefaulted
                    ? 'Auto-Defaulted'
                    : 'Acknowledged ✅'
                  : `${slaTriggerToAckDays}d SLA Active`}
              </span>
            </div>
            <div className="text-slate-400 text-[10px] mt-1">
              {effectiveAckDate ? (
                <span>
                  Active start: <strong>{formatDate(effectiveAckDate)}</strong>
                </span>
              ) : (
                <span>Awaiting acknowledgment (within {slaTriggerToAckDays}-day SLA)</span>
              )}
            </div>
          </div>

          {/* Stage 14 SLA Duration */}
          <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700">
            <div className="flex items-center justify-between font-semibold">
              <span className="text-slate-300 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Billing SLA Target</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-slate-300">
                {stage14TargetSlaDays} Days Standard
              </span>
            </div>
            <div className="text-slate-400 text-[10px] mt-1">
              Target completion: <strong>{formatDate(targetCompletionDate)}</strong>
            </div>
          </div>

          {/* Real-time SLA Countdown */}
          <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700">
            <div className="flex items-center justify-between font-semibold">
              <span className="text-slate-300 flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>AR Clock Status</span>
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  isOverdue
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : remainingDays <= 1
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}
              >
                {isOverdue ? `SLA Overdue (${Math.abs(remainingDays)}d)` : `${remainingDays} Days Remaining`}
              </span>
            </div>
            <div className="text-slate-400 text-[10px] mt-1">
              {elapsedDaysFromAck} days elapsed since reference start date
            </div>
          </div>
        </div>
      </div>

      {/* Main Form Box */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3.5 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Finance Invoice Generation & Billing Governance</h4>
              <p className="text-[10px] text-slate-500">
                Track Acknowledged Start Date, assign Finance Processor, and reconcile payment collection.
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Stage 14 Governance
          </span>
        </div>

        {/* SLA Governance Grid: 3 columns patterned after previous stages */}
        <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200/90 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-slate-900 text-xs">Stage 14 SLA Ingress & Governance</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">
              SLA Reference Clock:{' '}
              <span className="font-semibold text-slate-700">
                {effectiveAckDate ? 'Acknowledged Start Date' : 'Stage Trigger Date'}
              </span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Field 1: Stage 14 Trigger Date (Non-editable) */}
            <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="stage14-trigger-date-display"
                  className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1"
                >
                  Stage 14 Trigger Date
                  <span className="text-slate-400 font-normal">(Non-editable)</span>
                </label>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-600">
                  Workflow Ingress
                </span>
              </div>
              <div
                id="stage14-trigger-date-display"
                className="flex items-center gap-2 p-1.5 bg-slate-50/80 rounded border border-slate-200 text-slate-800 font-mono text-xs font-semibold"
              >
                <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{stage14TriggerDate ? stage14TriggerDate.split('T')[0] : 'Pending Ingress'}</span>
                {stage14TriggerDate && (
                  <span className="text-[10px] text-slate-500 font-sans font-normal ml-auto">
                    ({formatDate(stage14TriggerDate)})
                  </span>
                )}
              </div>
              <span className="text-[9px] text-slate-400 mt-1 block">
                Automatic timestamp recorded upon entering Finance Endorsement & Billing.
              </span>
            </div>

            {/* Field 2: Acknowledged Start Date */}
            <div className="p-2.5 bg-white rounded-lg border border-emerald-200 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="stage14-ack-start-date"
                  className="text-[10px] font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1"
                >
                  Acknowledged Start Date
                  <span className="text-emerald-600 font-semibold">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleSetAckDateToday}
                  className="text-[10px] text-emerald-700 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                >
                  <Check className="w-3 h-3" />
                  Set Today
                </button>
              </div>
              <input
                id="stage14-ack-start-date"
                type="date"
                value={effectiveAckDate ? effectiveAckDate.split('T')[0] : ''}
                onChange={(e) => handleAckDateChange(e.target.value)}
                className="w-full bg-white border border-emerald-300 rounded px-2.5 py-1 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <div className="flex items-center justify-between text-[9px] text-slate-500 mt-1">
                <span>
                  {isAutoDefaulted ? (
                    <strong className="text-amber-600">Auto-defaulted (+{slaTriggerToAckDays}d SLA)</strong>
                  ) : rawAckDate ? (
                    <span className="text-emerald-700 font-semibold">Manually Acknowledged</span>
                  ) : (
                    <span>
                      Ack SLA: <strong>{slaTriggerToAckDays} day</strong>
                    </span>
                  )}
                </span>
                <span className="text-slate-400">
                  Target SLA: <strong>{stage14TargetSlaDays}d</strong>
                </span>
              </div>
            </div>

            {/* Field 3: Finance Processor Dropdown */}
            <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="stage14-finance-processor-select"
                  className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1"
                >
                  <User className="w-3 h-3 text-emerald-600" />
                  Finance Processor
                  <span className="text-emerald-600 font-semibold">*</span>
                </label>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700">
                  Finance Team
                </span>
              </div>
              <select
                id="stage14-finance-processor-select"
                value={financeProcessor}
                onChange={(e) => handleFinanceProcessorChange(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="">Select Finance Processor...</option>
                {financeProcessorOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
                {financeProcessor && !financeProcessorOptions.includes(financeProcessor) && (
                  <option value={financeProcessor}>{financeProcessor}</option>
                )}
              </select>
              <span className="text-[9px] text-slate-400 mt-1 block">
                Designated Finance AR specialist handling endorsement.
              </span>
            </div>
          </div>
        </div>

        {/* Invoice Reference, Amount, Due Date & Payment Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Invoice Reference #</label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => {
                setInvoiceNumber(e.target.value);
                onUpdateOpportunity({
                  ...opportunity,
                  billingRecord: {
                    ...opportunity.billingRecord,
                    invoiceNumber: e.target.value,
                    paymentStatus,
                    stage14TriggerDate,
                    acknowledgedStartDate: effectiveAckDate || stage14TriggerDate,
                    financeProcessor,
                  },
                });
              }}
              placeholder="e.g. INV-2026-001"
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Invoice Amount ($)</label>
            <input
              type="number"
              value={totalAmount}
              onChange={(e) => {
                const val = Number(e.target.value);
                setTotalAmount(val);
                onUpdateOpportunity({
                  ...opportunity,
                  billingRecord: {
                    ...opportunity.billingRecord,
                    totalAmount: val,
                    invoiceAmount: val,
                    paymentStatus,
                    stage14TriggerDate,
                    acknowledgedStartDate: effectiveAckDate || stage14TriggerDate,
                    financeProcessor,
                  },
                });
              }}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-emerald-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Payment Due Date</label>
            <input
              type="date"
              value={paymentDueDate}
              onChange={(e) => {
                setPaymentDueDate(e.target.value);
                onUpdateOpportunity({
                  ...opportunity,
                  billingRecord: {
                    ...opportunity.billingRecord,
                    paymentDueDate: e.target.value,
                    paymentStatus,
                    stage14TriggerDate,
                    acknowledgedStartDate: effectiveAckDate || stage14TriggerDate,
                    financeProcessor,
                  },
                });
              }}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Payment Status</label>
            <select
              value={paymentStatus}
              onChange={(e: any) => {
                const val = e.target.value;
                setPaymentStatus(val);
                onUpdateOpportunity({
                  ...opportunity,
                  billingRecord: {
                    ...opportunity.billingRecord,
                    paymentStatus: val,
                    stage14TriggerDate,
                    acknowledgedStartDate: effectiveAckDate || stage14TriggerDate,
                    financeProcessor,
                  },
                });
              }}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="ISSUED">📨 Invoice Issued (Pending)</option>
              <option value="PAID">✅ Paid / Collected</option>
              <option value="PARTIALLY_PAID">💳 Partially Paid</option>
              <option value="OVERDUE">⚠️ Overdue</option>
              <option value="DRAFT">📝 Draft</option>
            </select>
          </div>
        </div>

        {/* Endorsement Notes */}
        <div>
          <label className="block text-slate-700 font-semibold mb-1">
            Finance Endorsement & Billing Remarks
          </label>
          <textarea
            rows={2}
            value={endorsementNotes}
            onChange={(e) => {
              setEndorsementNotes(e.target.value);
              onUpdateOpportunity({
                ...opportunity,
                billingRecord: {
                  ...opportunity.billingRecord,
                  endorsementNotes: e.target.value,
                  paymentStatus,
                  stage14TriggerDate,
                  acknowledgedStartDate: effectiveAckDate || stage14TriggerDate,
                  financeProcessor,
                },
              });
            }}
            placeholder="Add invoice transmission details, client AR confirmation, or reconciliation notes..."
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center space-x-2 text-slate-500 text-[11px]">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>
              Total Invoice: <strong className="text-slate-800 font-mono">{formatCurrency(totalAmount, opportunity.currency)}</strong>
            </span>
          </div>

          <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleOpenReturnModal}
              className="px-3.5 py-2 rounded-lg bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 font-bold text-xs flex items-center space-x-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
              <span>Return to BU for CWC Remediation</span>
            </button>

            <button
              type="button"
              onClick={handleConfirmBillingCollection}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm hover:shadow transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm Full Payment Collection & Close Deal 🎉</span>
            </button>
          </div>
        </div>
      </div>

      {/* Return to BU for CWC Remediation Modal */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-amber-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Return to BU for CWC Remediation</h3>
                  <p className="text-[11px] text-slate-500">
                    Revert workflow to Stage 13 (CWC) for deliverables or sign-off remediation.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReturnModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Returning this opportunity will reopen <strong>Stage 13: Certificate of Work Completion</strong>. Please provide a clear explanation so the PMO and Business Unit can take remedial action.
                </p>
              </div>

              <div>
                <label className="block text-slate-800 font-bold text-xs mb-1">
                  Reason for Return / Remediation Instructions <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={4}
                  value={returnReason}
                  onChange={(e) => {
                    setReturnReason(e.target.value);
                    if (returnError) setReturnError('');
                  }}
                  placeholder="e.g. Client sign-off signature missing on Appendix B; deliverable milestone 3 acceptance criteria incomplete; requires corrected acceptance document before Finance can endorse for billing."
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none ${
                    returnError
                      ? 'border-rose-400 ring-2 ring-rose-200'
                      : 'border-slate-300 focus:ring-2 focus:ring-amber-500'
                  }`}
                />
                {returnError && <span className="text-[11px] text-rose-600 block mt-1">{returnError}</span>}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsReturnModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReturnToStage13}
                className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm hover:shadow flex items-center space-x-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Confirm Return to Stage 13</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
