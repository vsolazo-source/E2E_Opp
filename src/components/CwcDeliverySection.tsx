import React, { useState, useMemo, useEffect } from 'react';
import {
  Award,
  Calendar,
  Clock,
  User,
  FileText,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Check,
  ArrowRight,
  PlusCircle,
  History,
  ShieldCheck,
  Info,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Opportunity, StakeholderRole, ResourceMember, SlaExtensionEntry } from '../types';
import { formatDate } from '../utils/formatters';

interface CwcDeliverySectionProps {
  opportunity: Opportunity;
  currentRole: StakeholderRole;
  currentUserName?: string;
  resources?: ResourceMember[];
  comments: string;
  setComments: (c: string) => void;
  onUpdateOpportunity: (updated: Opportunity) => void;
  onAdvanceToBilling: (actionName: string, comments: string, extraUpdates?: Partial<Opportunity>) => void;
}

export const CwcDeliverySection: React.FC<CwcDeliverySectionProps> = ({
  opportunity,
  currentRole,
  currentUserName,
  resources = [],
  comments,
  setComments,
  onUpdateOpportunity,
  onAdvanceToBilling,
}) => {
  const cwc = opportunity.cwcRecord;

  // 1. Stage 13 Trigger Date: Non-editable, automatically recorded when entering stage
  const stage13TriggerDate = useMemo(() => {
    return (
      cwc?.stage13TriggerDate ||
      (opportunity.currentStage === 'CWC_DELIVERY' ? opportunity.stageEnteredAt : opportunity.updatedAt) ||
      new Date().toISOString().split('T')[0]
    );
  }, [cwc?.stage13TriggerDate, opportunity.stageEnteredAt, opportunity.updatedAt, opportunity.currentStage]);

  // SLA window between Trigger Date and Acknowledged Start Date (default: 2 days)
  const acknowledgementSlaDays = cwc?.acknowledgementSlaDays || 2;
  const originalSlaDays = cwc?.originalSlaDays || 5;
  const extendedSlaDays = cwc?.extendedSlaDays || 0;
  const totalSlaDays = originalSlaDays + extendedSlaDays;
  const slaExtendedCount = cwc?.slaExtendedCount || 0;
  const slaExtensionHistory = cwc?.slaExtensionHistory || [];

  const nowMs = Date.now();
  const triggerMs = useMemo(() => (stage13TriggerDate ? new Date(stage13TriggerDate).getTime() : nowMs), [stage13TriggerDate, nowMs]);
  const elapsedDaysFromTrigger = Math.max(0, Math.floor((nowMs - triggerMs) / (1000 * 60 * 60 * 24)));

  // Auto-default logic: if no manual input in acknowledged date after SLA days, default to Trigger Date + SLA
  const rawAckDate = cwc?.acknowledgedStartDate || '';
  const isAutoDefaulted = !rawAckDate && elapsedDaysFromTrigger >= acknowledgementSlaDays;
  const autoDefaultedAckDate = useMemo(() => {
    return new Date(triggerMs + acknowledgementSlaDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  }, [triggerMs, acknowledgementSlaDays]);
  const effectiveAckDate = rawAckDate || (isAutoDefaulted ? autoDefaultedAckDate : '');

  const effectiveStartMs = useMemo(() => {
    return effectiveAckDate ? new Date(effectiveAckDate).getTime() : triggerMs;
  }, [effectiveAckDate, triggerMs]);

  const targetCompletionDate = useMemo(() => {
    const d = new Date(effectiveStartMs + totalSlaDays * 24 * 60 * 60 * 1000);
    return d.toISOString().split('T')[0];
  }, [effectiveStartMs, totalSlaDays]);

  const elapsedDaysFromAck = Math.max(0, Math.floor((nowMs - effectiveStartMs) / (1000 * 60 * 60 * 24)));
  const remainingDays = totalSlaDays - elapsedDaysFromAck;
  const isOverdue = remainingDays < 0;

  // Handle manual update or acknowledgment of start date
  const handleSetAckDateToday = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    onUpdateOpportunity({
      ...opportunity,
      cwcRecord: {
        ...opportunity.cwcRecord,
        stage13TriggerDate,
        acknowledgedStartDate: todayStr,
        acknowledgementSlaDays,
        isAcceptedByClient: !!opportunity.cwcRecord?.isAcceptedByClient,
      },
    });
  };

  const handleAckDateChange = (val: string) => {
    onUpdateOpportunity({
      ...opportunity,
      cwcRecord: {
        ...opportunity.cwcRecord,
        stage13TriggerDate,
        acknowledgedStartDate: val,
        acknowledgementSlaDays,
        isAcceptedByClient: !!opportunity.cwcRecord?.isAcceptedByClient,
      },
    });
  };

  // 4. CWC Form Fields
  const oppTracking = opportunity.trackingCode || opportunity.id || 'OPP-001';
  const defaultCwcNumber = oppTracking.includes('-OPP-')
    ? oppTracking.replace('-OPP-', '-CWC-')
    : `CWC-${new Date().getFullYear()}-${oppTracking.replace(/^OPP-/, '')}`;

  const [cwcNumber, setCwcNumber] = useState(cwc?.cwcNumber || defaultCwcNumber);
  const [cwcRoutedBy, setCwcRoutedBy] = useState(
    cwc?.cwcRoutedBy ||
    cwc?.pmoLeadSigner ||
    opportunity.parallelPmo?.projectManager ||
    opportunity.parallelPmo?.businessUnitOwner ||
    'Samantha Reynolds, PMP'
  );
  const [acceptanceRemarks, setAcceptanceRemarks] = useState(
    cwc?.acceptanceRemarks || 'All deliverables tested, deployed, and validated against SOW specifications.'
  );

  // Candidate options for CWC Routed By from Admin Resource Directory
  const cwcRoutedByOptions = useMemo(() => {
    const list = resources.map((r) => `${r.name} (${r.role || r.department})`);
    const defaults = [
      'Samantha Reynolds, PMP (Lead PM / Delivery)',
      'David Kim, CSM (Senior Agile Project Manager)',
      'Elena Cruz, PMP (Technical Delivery Manager)',
      'Sarah Jenkins (Senior Contracts Specialist)',
      'Marcus Sterling (Principal Enterprise AE)',
      'Carlos Vance (Director, Enterprise AI & Cloud)',
      'Arthur Pendelton (EVP, Enterprise Services)',
    ];
    return Array.from(new Set([...list, ...defaults]));
  }, [resources]);

  // 5. Extend SLA Modal State
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [extendDaysInput, setExtendDaysInput] = useState<number>(3);
  const [extendReasonInput, setExtendReasonInput] = useState<string>('');
  const [extendValidationError, setExtendValidationError] = useState<string>('');
  const [showExtensionHistory, setShowExtensionHistory] = useState(false);

  const handleOpenExtendModal = () => {
    setExtendDaysInput(3);
    setExtendReasonInput('');
    setExtendValidationError('');
    setIsExtendModalOpen(true);
  };

  const handleConfirmExtendSla = () => {
    if (!extendReasonInput.trim()) {
      setExtendValidationError('A specific reason or note is required to extend the SLA for audit compliance.');
      return;
    }

    if (!extendDaysInput || extendDaysInput <= 0) {
      setExtendValidationError('Please specify a positive number of days to extend.');
      return;
    }

    const now = new Date().toISOString();
    const newExtendedDays = extendedSlaDays + extendDaysInput;
    const newTotalSla = originalSlaDays + newExtendedDays;
    const newCount = slaExtendedCount + 1;

    const extensionEntry: SlaExtensionEntry = {
      id: `sla-ext-${Date.now()}`,
      timestamp: now,
      daysAdded: extendDaysInput,
      reason: extendReasonInput.trim(),
      extendedBy: currentUserName || (currentRole === 'PMO' ? 'PMO Lead' : currentRole),
      originalSlaDays,
      newTotalSlaDays: newTotalSla,
    };

    const historyAudit = {
      id: `hist-sla-ext-${Date.now()}`,
      timestamp: now,
      stage: 'CWC_DELIVERY' as const,
      actorName: currentUserName || 'PMO / Delivery Lead',
      actorRole: currentRole,
      action: `CWC SLA Extended (+${extendDaysInput} Days)`,
      notes: `SLA extended from ${totalSlaDays} days to ${newTotalSla} days (Original: ${originalSlaDays} days, Cumulative Extended: +${newExtendedDays} days across ${newCount} extensions). Reason: ${extendReasonInput.trim()}`,
    };

    onUpdateOpportunity({
      ...opportunity,
      cwcRecord: {
        ...opportunity.cwcRecord,
        stage13TriggerDate: cwc?.stage13TriggerDate || stage13TriggerDate,
        acknowledgedStartDate: effectiveAckDate || stage13TriggerDate,
        acknowledgementSlaDays,
        originalSlaDays,
        extendedSlaDays: newExtendedDays,
        slaExtendedCount: newCount,
        slaExtensionHistory: [...slaExtensionHistory, extensionEntry],
        isAcceptedByClient: !!opportunity.cwcRecord?.isAcceptedByClient,
      },
      history: [...(opportunity.history || []), historyAudit],
    });

    setIsExtendModalOpen(false);
    confetti({ particleCount: 25, spread: 40, origin: { y: 0.6 } });
  };

  // 6. Complete CWC and Endorse to Finance for Billing
  const handleCompleteCwc = () => {
    const now = new Date().toISOString();
    const extraUpdates: Partial<Opportunity> = {
      cwcRecord: {
        ...opportunity.cwcRecord,
        cwcNumber,
        cwcRoutedBy,
        pmoLeadSigner: cwcRoutedBy,
        issuedDate: now.split('T')[0],
        stage13TriggerDate: cwc?.stage13TriggerDate || stage13TriggerDate,
        acknowledgedStartDate: effectiveAckDate || stage13TriggerDate,
        acknowledgementSlaDays,
        originalSlaDays,
        extendedSlaDays,
        slaExtendedCount,
        slaExtensionHistory,
        clientApproverName: opportunity.clientContactName,
        acceptanceRemarks,
        isAcceptedByClient: true,
      },
      billingRecord: {
        ...opportunity.billingRecord,
        invoiceNumber:
          opportunity.billingRecord?.invoiceNumber ||
          (oppTracking.includes('-OPP-')
            ? oppTracking.replace('-OPP-', '-INV-')
            : `INV-${new Date().getFullYear()}-${oppTracking.replace(/^OPP-/, '')}`),
        invoiceAmount: opportunity.dealValue,
        totalAmount: opportunity.dealValue,
        invoiceDate: now.split('T')[0],
        paymentDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        paymentStatus: 'ISSUED',
        stage14TriggerDate: now.split('T')[0],
        slaTriggerToAckDays: 2,
        stage14TargetSlaDays: 3,
        financeProcessor: opportunity.financeProcessor || opportunity.finalFinanceApproval?.financeProcessor || 'David Cho (Finance Controller)',
      },
    };

    onAdvanceToBilling(
      'CWC Signed Off, Endorsing to Finance Team for Billing',
      comments || 'CWC signed off by PMO and Client. Endorsing to Finance team for invoice generation & billing.',
      extraUpdates
    );
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Top Banner: SLA Overview & Key Metrics */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-xl p-4 text-white border border-slate-700 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Stage 13 • Delivery Sign-off
              </span>
              <span className="text-slate-400 text-xs font-mono">
                Triggered: {formatDate(stage13TriggerDate)}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white mt-1 flex items-center space-x-2">
              <Award className="w-4 h-4 text-teal-400" />
              <span>Certificate of Work Completion (CWC) Stage</span>
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleOpenExtendModal}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 flex items-center space-x-1.5 transition-all shadow-xs"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Extend SLA</span>
              {slaExtendedCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-400/30 text-amber-200 text-[10px] ml-1">
                  +{extendedSlaDays}d ({slaExtendedCount}x)
                </span>
              )}
            </button>
          </div>
        </div>

        {/* SLA Status Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 border-t border-slate-700/80 text-[11px]">
          {/* Acknowledgement SLA Indicator */}
          <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700">
            <div className="flex items-center justify-between font-semibold">
              <span className="text-slate-300 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-teal-400" />
                <span>Acknowledgement Window</span>
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                effectiveAckDate
                  ? isAutoDefaulted
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-cyan-500/20 text-cyan-300'
              }`}>
                {effectiveAckDate
                  ? isAutoDefaulted
                    ? 'Auto-Defaulted'
                    : 'Acknowledged ✅'
                  : `${acknowledgementSlaDays}d SLA Active`}
              </span>
            </div>
            <div className="text-slate-400 text-[10px] mt-1">
              {effectiveAckDate ? (
                <span>Active start: <strong>{formatDate(effectiveAckDate)}</strong></span>
              ) : (
                <span>Awaiting acknowledgment (within {acknowledgementSlaDays}-day SLA)</span>
              )}
            </div>
          </div>

          {/* Stage SLA & Extension Info */}
          <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700">
            <div className="flex items-center justify-between font-semibold">
              <span className="text-slate-300 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Stage SLA Duration</span>
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                extendedSlaDays > 0 ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-700 text-slate-300'
              }`}>
                {totalSlaDays} Days Total
              </span>
            </div>
            <div className="text-slate-400 text-[10px] mt-1 flex items-center justify-between">
              <span>Orig: {originalSlaDays}d {extendedSlaDays > 0 && `• Ext: +${extendedSlaDays}d`}</span>
              {slaExtendedCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowExtensionHistory(!showExtensionHistory)}
                  className="text-amber-400 hover:text-amber-300 underline font-medium text-[10px]"
                >
                  {showExtensionHistory ? 'Hide Audit' : `Audit (${slaExtendedCount})`}
                </button>
              )}
            </div>
          </div>

          {/* Countdown & Due Date */}
          <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700">
            <div className="flex items-center justify-between font-semibold">
              <span className="text-slate-300">Target Completion</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                isOverdue
                  ? 'bg-rose-500/20 text-rose-300'
                  : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                {isOverdue ? `${Math.abs(remainingDays)}d Overdue` : `${remainingDays}d Remaining`}
              </span>
            </div>
            <div className="text-slate-400 text-[10px] mt-1">
              Due Date: <strong className="text-slate-200">{formatDate(targetCompletionDate)}</strong>
            </div>
          </div>
        </div>

        {/* Extension Audit History Dropdown Panel */}
        {showExtensionHistory && slaExtensionHistory.length > 0 && (
          <div className="bg-slate-800/95 rounded-lg p-3 border border-amber-500/30 space-y-2 mt-2">
            <div className="flex items-center justify-between text-amber-300 font-bold text-xs">
              <span className="flex items-center space-x-1.5">
                <History className="w-3.5 h-3.5" />
                <span>SLA Extension Audit Trail (Count: {slaExtendedCount})</span>
              </span>
              <button
                type="button"
                onClick={() => setShowExtensionHistory(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {slaExtensionHistory.map((item, idx) => (
                <div key={item.id || idx} className="p-2 bg-slate-900/90 rounded border border-slate-700 text-[10px]">
                  <div className="flex items-center justify-between font-semibold text-slate-200">
                    <span className="text-amber-400">
                      #{idx + 1}: +{item.daysAdded} Days (New Total: {item.newTotalSlaDays}d)
                    </span>
                    <span className="text-slate-400">{formatDate(item.timestamp)}</span>
                  </div>
                  <div className="text-slate-300 mt-0.5">
                    <strong>Reason:</strong> {item.reason}
                  </div>
                  <div className="text-slate-400 text-[9px] mt-0.5">
                    Extended by: {item.extendedBy} • Base SLA: {item.originalSlaDays}d
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Remediation Alert Banner (if returned from Stage 14 Finance) */}
      {(cwc?.returnReason || opportunity.billingRecord?.returnReason) && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start space-x-3 shadow-2xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-xs text-amber-950 flex items-center gap-1.5">
              <span>Returned from Stage 14 (Finance Endorsement) for CWC Remediation</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-200 text-amber-900">
                Action Required
              </span>
            </div>
            <p className="text-[11px] text-amber-900 bg-amber-100/70 p-2 rounded-lg border border-amber-200/80 font-medium">
              "{cwc?.returnReason || opportunity.billingRecord?.returnReason}"
            </p>
            <p className="text-[10px] text-amber-700">
              Please remedy deliverables or client sign-off remarks, and re-endorse to Finance when completed.
            </p>
          </div>
        </div>
      )}

      {/* Main Form Box */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3.5 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">CWC Verification & Governance Details</h4>
              <p className="text-[10px] text-slate-500">
                Triggered automatically after parallel execution; coordinates client sign-off and billing endorsement.
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
            PMO & BU Endorsement
          </span>
        </div>

        {/* SLA Governance Grid: 3 columns patterned after previous stages */}
        <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200/90 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-teal-600" />
              <span className="font-bold text-slate-900 text-xs">Stage 13 SLA Ingress & Governance</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">
              SLA Reference Clock: <span className="font-semibold text-slate-700">{effectiveAckDate ? 'Acknowledged Start Date' : 'Stage Trigger Date'}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Field 1: Stage 13 Trigger Date (Non-editable) */}
            <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="stage13-trigger-date-display" className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  Stage 13 Trigger Date
                  <span className="text-slate-400 font-normal">(Non-editable)</span>
                </label>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-600">
                  Workflow Ingress
                </span>
              </div>
              <div id="stage13-trigger-date-display" className="flex items-center gap-2 p-1.5 bg-slate-50/80 rounded border border-slate-200 text-slate-800 font-mono text-xs font-semibold">
                <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{stage13TriggerDate ? stage13TriggerDate.split('T')[0] : 'Pending Ingress'}</span>
                {stage13TriggerDate && (
                  <span className="text-[10px] text-slate-500 font-sans font-normal ml-auto">
                    ({formatDate(stage13TriggerDate)})
                  </span>
                )}
              </div>
              <span className="text-[9px] text-slate-400 mt-1 block">
                Automatic timestamp recorded upon entering Stage 13 (CWC).
              </span>
            </div>

            {/* Field 2: Acknowledged Start Date */}
            <div className="p-2.5 bg-white rounded-lg border border-teal-200 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="stage13-ack-start-date" className="text-[10px] font-bold text-teal-950 uppercase tracking-wider flex items-center gap-1">
                  Acknowledged Start Date
                  <span className="text-teal-600 font-semibold">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleSetAckDateToday}
                  className="text-[10px] text-teal-700 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                >
                  <Check className="w-3 h-3" />
                  Set Today
                </button>
              </div>
              <input
                id="stage13-ack-start-date"
                type="date"
                value={effectiveAckDate ? effectiveAckDate.split('T')[0] : ''}
                onChange={(e) => handleAckDateChange(e.target.value)}
                className="w-full bg-white border border-teal-300 rounded px-2.5 py-1 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
              <div className="flex items-center justify-between text-[9px] text-slate-500 mt-1">
                <span>
                  {isAutoDefaulted ? (
                    <strong className="text-amber-600">Auto-defaulted (+{acknowledgementSlaDays}d SLA)</strong>
                  ) : rawAckDate ? (
                    <span className="text-emerald-700 font-semibold">Manually Acknowledged</span>
                  ) : (
                    <span>Ack SLA: <strong>{acknowledgementSlaDays} day</strong></span>
                  )}
                </span>
                <span className="text-slate-400">Target SLA: <strong>{totalSlaDays}d</strong></span>
              </div>
            </div>

            {/* Field 3: CWC Routed By Dropdown */}
            <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="stage13-cwc-routed-by-select" className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <User className="w-3 h-3 text-teal-600" />
                  CWC Routed By
                  <span className="text-purple-600 font-semibold">*</span>
                </label>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-50 text-purple-700">
                  Resource Directory
                </span>
              </div>
              <select
                id="stage13-cwc-routed-by-select"
                value={cwcRoutedBy}
                onChange={(e) => {
                  setCwcRoutedBy(e.target.value);
                  onUpdateOpportunity({
                    ...opportunity,
                    cwcRecord: {
                      ...opportunity.cwcRecord,
                      cwcRoutedBy: e.target.value,
                      pmoLeadSigner: e.target.value,
                      isAcceptedByClient: !!opportunity.cwcRecord?.isAcceptedByClient,
                    },
                  });
                }}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                <option value="">Select Resource from Directory...</option>
                {cwcRoutedByOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
                {cwcRoutedBy && !cwcRoutedByOptions.includes(cwcRoutedBy) && (
                  <option value={cwcRoutedBy}>{cwcRoutedBy}</option>
                )}
              </select>
              <span className="text-[9px] text-slate-400 mt-1 block">
                Lead signer routing CWC to client & Finance.
              </span>
            </div>
          </div>
        </div>

        {/* CWC Reference & Client Approver Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* CWC Reference # */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">CWC Reference #</label>
            <input
              type="text"
              value={cwcNumber}
              onChange={(e) => {
                setCwcNumber(e.target.value);
                onUpdateOpportunity({
                  ...opportunity,
                  cwcRecord: {
                    ...opportunity.cwcRecord,
                    cwcNumber: e.target.value,
                    isAcceptedByClient: !!opportunity.cwcRecord?.isAcceptedByClient,
                  },
                });
              }}
              placeholder="e.g. CWC-2026-001"
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          {/* Client Approver Name */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Client Approver / Authority</label>
            <input
              type="text"
              value={opportunity.clientContactName || 'Client Authority'}
              readOnly
              className="w-full px-3 py-1.5 bg-slate-100 border border-slate-300 rounded-lg text-xs font-medium text-slate-600 select-none cursor-not-allowed"
            />
          </div>
        </div>

        {/* Client Acceptance Verification Remarks */}
        <div>
          <label className="block text-slate-700 font-semibold mb-1">
            Client Acceptance Verification Remarks
          </label>
          <textarea
            rows={2}
            value={acceptanceRemarks}
            onChange={(e) => {
              setAcceptanceRemarks(e.target.value);
              onUpdateOpportunity({
                ...opportunity,
                cwcRecord: {
                  ...opportunity.cwcRecord,
                  acceptanceRemarks: e.target.value,
                  isAcceptedByClient: !!opportunity.cwcRecord?.isAcceptedByClient,
                },
              });
            }}
            placeholder="Final user acceptance testing complete and accepted by client sponsor..."
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Action Strip: Extend SLA & Updated Complete Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2">
        <div className="flex items-center space-x-2 text-[11px] text-slate-500">
          <Info className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          <span>
            Signing generates the official Certificate of Work Completion and prepares accounts receivable endorsement.
          </span>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={handleOpenExtendModal}
            className="px-3.5 py-2 text-xs font-bold rounded-lg border border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-900 shadow-xs transition-all flex items-center space-x-1.5"
          >
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            <span>Extend SLA</span>
          </button>

          <button
            type="button"
            onClick={handleCompleteCwc}
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-all"
          >
            <span>CWC Signed Off, Endorsing to Finance Team for Billing</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* EXTEND SLA MODAL DIALOG                                                   */}
      {/* ========================================================================= */}
      {isExtendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Extend CWC Signatory SLA</h4>
                  <p className="text-[10px] text-slate-500 font-normal">
                    Audit-compliant SLA extension for pending external signatories
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExtendModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Audit Status Counters */}
            <div className="grid grid-cols-3 gap-2 bg-amber-50/80 p-3 rounded-xl border border-amber-200 text-center">
              <div>
                <span className="text-slate-500 block text-[10px]">Original SLA</span>
                <span className="font-bold text-slate-800 text-xs">{originalSlaDays} Days</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Current Extended</span>
                <span className="font-bold text-amber-800 text-xs">+{extendedSlaDays} Days</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">New Total SLA</span>
                <span className="font-bold text-teal-800 text-xs">
                  {originalSlaDays + extendedSlaDays + (Number(extendDaysInput) || 0)} Days
                </span>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-3">
              {/* Days to extend */}
              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1">
                  Additional SLA Days to Add
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={extendDaysInput}
                    onChange={(e) => setExtendDaysInput(Math.max(1, Number(e.target.value) || 1))}
                    className="w-24 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <div className="flex items-center space-x-1.5">
                    {[1, 2, 3, 5, 7, 14].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setExtendDaysInput(chip)}
                        className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                          extendDaysInput === chip
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        +{chip}d
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Required Comment / Note */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 font-bold text-xs">
                    Required Extension Reason / Notes <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-rose-600 font-medium">Mandatory for Audit</span>
                </div>
                <textarea
                  rows={3}
                  value={extendReasonInput}
                  onChange={(e) => {
                    setExtendReasonInput(e.target.value);
                    if (extendValidationError) setExtendValidationError('');
                  }}
                  placeholder="e.g. Client VP of Operations and Legal Counsel are currently in overseas travel; awaiting final executive countersignature on the digital CWC certificate."
                  className={`w-full px-3 py-2 bg-white border rounded-lg text-xs focus:ring-2 focus:outline-none ${
                    extendValidationError ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-300 focus:ring-amber-500'
                  }`}
                />
                {extendValidationError && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{extendValidationError}</span>
                  </p>
                )}
                <span className="text-[10px] text-slate-500 block mt-1">
                  This note will be permanently logged in the audit trail with the author, timestamp, and cumulative extended days count from the original SLA.
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsExtendModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmExtendSla}
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-all flex items-center space-x-1.5"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Confirm SLA Extension</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
