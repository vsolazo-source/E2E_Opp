import React, { useState, useEffect } from 'react';
import {
  Mail,
  Sparkles,
  Calendar,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Send,
  Building,
  User,
  DollarSign,
  Briefcase,
  ShieldCheck,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Opportunity, StakeholderRole, ResourceMember, WorkflowStage } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

interface WinNotificationSectionProps {
  opportunity: Opportunity;
  currentRole: StakeholderRole;
  resources?: ResourceMember[];
  comments: string;
  setComments: (c: string) => void;
  onUpdateOpportunity: (updated: Opportunity) => void;
  onAdvanceToParallelExecution: (actionName: string, extraUpdates: Partial<Opportunity>) => void;
}

export const WinNotificationSection: React.FC<WinNotificationSectionProps> = ({
  opportunity,
  currentRole,
  resources = [],
  comments,
  setComments,
  onUpdateOpportunity,
  onAdvanceToParallelExecution,
}) => {
  // 1. Stage 11 Trigger Date
  // Date when workflow entered Stage 11 (Non-editable workflow ingress)
  const stage11TriggerDate =
    opportunity.winNotification?.stage11TriggerDate ||
    (opportunity.currentStage === 'WIN_NOTIFICATION'
      ? (opportunity.stageEnteredAt || opportunity.updatedAt || opportunity.createdAt)
      : (opportunity.stageEnteredAt || opportunity.createdAt));

  // SLA between trigger date and acknowledged start date (default 1 day)
  const slaTriggerToAckDays = opportunity.winNotification?.slaTriggerToAckDays ?? 1;
  const stage11TargetSlaDays = opportunity.winNotification?.stage11TargetSlaDays ?? 1;

  const nowMs = Date.now();
  const triggerMs = stage11TriggerDate ? new Date(stage11TriggerDate).getTime() : nowMs;
  const elapsedDaysFromTrigger = Math.max(0, Math.floor((nowMs - triggerMs) / (1000 * 60 * 60 * 24)));

  // Auto-default logic:
  // "after SLA and no input in acknowledged date, Acknowledged Start date will be default to the Trigger date+SLA"
  const rawAckDate = opportunity.winNotification?.acknowledgedStartDate || '';
  const isAutoDefaulted = !rawAckDate && elapsedDaysFromTrigger >= slaTriggerToAckDays;
  const autoDefaultedAckDate = new Date(triggerMs + slaTriggerToAckDays * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  const effectiveAckDate = rawAckDate || (isAutoDefaulted ? autoDefaultedAckDate : '');

  const isAckOverdue = !rawAckDate && elapsedDaysFromTrigger > slaTriggerToAckDays;
  const ackMs = effectiveAckDate ? new Date(effectiveAckDate).getTime() : null;
  const elapsedDaysFromAck = ackMs ? Math.max(0, Math.floor((nowMs - ackMs) / (1000 * 60 * 60 * 24))) : 0;
  const isSlaTargetOverdue = effectiveAckDate ? elapsedDaysFromAck > stage11TargetSlaDays : false;

  // Contracts Specialist assignment
  const contractsSpecialist =
    opportunity.winNotification?.contractsSpecialist ||
    opportunity.docusignDetails?.contractsSpecialist ||
    opportunity.contractDetails?.contractsSpecialist ||
    opportunity.contractsProcessor ||
    'Sarah Jenkins';

  const contractsResources = resources.filter(
    (r) =>
      r.department?.toLowerCase().includes('contract') ||
      r.department?.toLowerCase().includes('legal') ||
      r.role?.toLowerCase().includes('contract') ||
      r.role?.toLowerCase().includes('legal')
  );

  // Email draft state
  const defaultSubject = `🎉 DEAL WIN: ${opportunity.clientName} - ${opportunity.title} [${formatCurrency(opportunity.dealValue, opportunity.currency)}]`;
  const defaultBody = `Dear Enterprise Team,\n\nWe are excited to announce an official contract WIN with ${opportunity.clientName} for ${opportunity.title}!\n\n• Total Contract Value (TCV): ${formatCurrency(opportunity.dealValue, opportunity.currency)}\n• Sales Lead: ${opportunity.salesLead}\n• Business Unit: ${opportunity.businessUnit}\n• Contracts Specialist: ${contractsSpecialist}\n\nParallel onboarding tracks are now active:\n1. Finance Operations is allocating budget and billing codes.\n2. PMO is initiating delivery sprint kickoff and technical environment setup.\n\nCongratulations to everyone involved!`;

  const emailSubject = opportunity.winNotification?.emailSubject || defaultSubject;
  const emailBody = opportunity.winNotification?.emailBody || defaultBody;

  // AI draft state
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Auto-sync defaulted ack date if not saved yet
  useEffect(() => {
    if (isAutoDefaulted && !opportunity.winNotification?.acknowledgedStartDate) {
      onUpdateOpportunity({
        ...opportunity,
        winNotification: {
          ...opportunity.winNotification,
          isReleased: opportunity.winNotification?.isReleased ?? false,
          stage11TriggerDate,
          acknowledgedStartDate: autoDefaultedAckDate,
          slaTriggerToAckDays,
          stage11TargetSlaDays,
          contractsSpecialist,
        }
      });
    }
  }, [isAutoDefaulted, autoDefaultedAckDate, stage11TriggerDate, slaTriggerToAckDays, stage11TargetSlaDays, contractsSpecialist]);

  const handleSetTodayAckDate = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    onUpdateOpportunity({
      ...opportunity,
      winNotification: {
        ...opportunity.winNotification,
        isReleased: opportunity.winNotification?.isReleased ?? false,
        stage11TriggerDate,
        acknowledgedStartDate: todayStr,
        slaTriggerToAckDays,
        stage11TargetSlaDays,
        contractsSpecialist,
      }
    });
  };

  const handleAckDateChange = (val: string) => {
    onUpdateOpportunity({
      ...opportunity,
      winNotification: {
        ...opportunity.winNotification,
        isReleased: opportunity.winNotification?.isReleased ?? false,
        stage11TriggerDate,
        acknowledgedStartDate: val,
        slaTriggerToAckDays,
        stage11TargetSlaDays,
        contractsSpecialist,
      }
    });
  };

  const handleSlaDaysChange = (days: number) => {
    onUpdateOpportunity({
      ...opportunity,
      winNotification: {
        ...opportunity.winNotification,
        isReleased: opportunity.winNotification?.isReleased ?? false,
        stage11TriggerDate,
        slaTriggerToAckDays: days,
        stage11TargetSlaDays,
        contractsSpecialist,
      }
    });
  };

  const handleSpecialistChange = (spec: string) => {
    onUpdateOpportunity({
      ...opportunity,
      winNotification: {
        ...opportunity.winNotification,
        isReleased: opportunity.winNotification?.isReleased ?? false,
        contractsSpecialist: spec,
        stage11TriggerDate,
        acknowledgedStartDate: effectiveAckDate,
      }
    });
  };

  const handleGenerateAiWinEmail = async () => {
    setIsAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/gemini/draft-win-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunity }),
      });
      const data = await res.json();
      
      onUpdateOpportunity({
        ...opportunity,
        winNotification: {
          ...opportunity.winNotification,
          isReleased: opportunity.winNotification?.isReleased ?? false,
          emailSubject: data.subject || `🎉 WIN ANNOUNCEMENT: ${opportunity.clientName} - ${opportunity.title}`,
          emailBody: data.body || `Dear Team,\n\nWe are delighted to announce that ${opportunity.clientName} has signed the ${opportunity.title} contract for ${formatCurrency(opportunity.dealValue, opportunity.currency)}!`,
          stage11TriggerDate,
          acknowledgedStartDate: effectiveAckDate,
        },
      });
    } catch (err: any) {
      console.error(err);
      setAiError('Failed to generate with AI. Using smart template.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleBroadcastWin = () => {
    confetti({
      particleCount: 140,
      spread: 80,
      origin: { y: 0.6 },
    });

    const oppTracking = opportunity.trackingCode || opportunity.id || 'OPP-001';
    const extraUpdates: Partial<Opportunity> = {
      winNotification: {
        ...opportunity.winNotification,
        isReleased: true,
        releasedAt: new Date().toISOString(),
        releasedBy: contractsSpecialist || 'Contracts & Legal Team',
        stage11TriggerDate,
        acknowledgedStartDate: effectiveAckDate,
        slaTriggerToAckDays,
        stage11TargetSlaDays,
        contractsSpecialist,
        emailSubject,
        emailBody,
        recipients: [
          'all-company@enterprise.com',
          'executive-leadership@enterprise.com',
          'finance-ops@enterprise.com',
          'pmo-delivery@enterprise.com',
          opportunity.salesLead ? `${opportunity.salesLead.toLowerCase().replace(/\s+/g, '.')}@enterprise.com` : 'sales@enterprise.com'
        ],
      },
      // Initialize parallel finance & pmo structures
      parallelFinance: {
        ...opportunity.parallelFinance,
        budgetCode:
          opportunity.parallelFinance?.budgetCode ||
          (oppTracking.includes('-OPP-')
            ? oppTracking.replace('-OPP-', '-BC-')
            : `BC-${oppTracking.replace(/^OPP-/, '')}`),
        contractCode:
          opportunity.parallelFinance?.contractCode ||
          (oppTracking.includes('-OPP-')
            ? oppTracking.replace('-OPP-', '-CTR-')
            : `CTR-${oppTracking.replace(/^OPP-/, '')}`),
        tcv: opportunity.dealValue,
        contractStartDate: new Date().toISOString().split('T')[0],
        contractEndDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        isConfigured: true,
      },
      parallelPmo: {
        ...opportunity.parallelPmo,
        isKickoffCompleted: true,
        projectManager: opportunity.parallelPmo?.projectManager || 'Samantha Reynolds, PMP',
        progressPercentage: 20,
        deliveryHealth: 'ON_TRACK' as const,
        milestones: [
          { id: 'm1', title: 'Architecture Blueprint & Environment Setup', targetDate: '2026-09-15', status: 'IN_PROGRESS' },
          { id: 'm2', title: 'Core Implementation & UAT Ingestion', targetDate: '2026-10-30', status: 'PENDING' },
          { id: 'm3', title: 'Final Production Deployment & CWC Handover', targetDate: '2026-12-15', status: 'PENDING' },
        ],
      },
    };

    onAdvanceToParallelExecution(
      'WIN Notification Released & Parallel Phase Kickoff',
      extraUpdates
    );
  };

  return (
    <div className="space-y-4 text-xs">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-sm">Official Enterprise WIN Notification Broadcast</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
              Stage 11
            </span>
          </div>
          <span className="text-[11px] text-slate-600 block mt-0.5">
            Contracts team dispatches company-wide WIN email announcement, triggering parallel Finance & PMO execution.
          </span>
        </div>

        <button
          onClick={handleGenerateAiWinEmail}
          disabled={isAiLoading}
          className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white hover:bg-amber-100 text-amber-800 border border-amber-300 font-semibold shadow-2xs transition-all shrink-0 text-xs"
        >
          <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-600 animate-pulse" />
          {isAiLoading ? 'Drafting Announcement...' : 'AI WIN Email Composer'}
        </button>
      </div>

      {aiError && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{aiError}</span>
        </div>
      )}

      {/* SECTION 1: GOVERNANCE, TRIGGER DATE & ACKNOWLEDGED START DATE */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="font-bold text-slate-900 text-xs uppercase tracking-wide">
              Stage Governance & SLA Tracking
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500 font-medium">Trigger → Ack SLA:</span>
            <div className="inline-flex items-center rounded bg-slate-100 border border-slate-200 p-0.5">
              {[1, 2, 3].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleSlaDaysChange(d)}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${
                    slaTriggerToAckDays === d
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Date fields grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* FIELD 1: STAGE 11 TRIGGER DATE (NON-EDITABLE) */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-slate-600 font-semibold text-[11px] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Stage 11 Trigger Date
              </label>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-200 text-slate-700 tracking-wider">
                NON-EDITABLE
              </span>
            </div>

            <div className="px-2.5 py-1.5 bg-slate-100/90 border border-slate-200 rounded font-mono text-xs text-slate-800 font-medium flex items-center justify-between">
              <span>{formatDate(stage11TriggerDate)}</span>
              <span className="text-[10px] text-slate-400 font-sans">Workflow Ingress</span>
            </div>
            <p className="text-[10px] text-slate-500">
              Timestamp recorded when contract routing was marked completed in Stage 10.
            </p>
          </div>

          {/* FIELD 2: ACKNOWLEDGED START DATE (MAIN REFERENCE OF SLA) */}
          <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-amber-900 font-semibold text-[11px] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Acknowledged Start Date
              </label>
              {isAutoDefaulted ? (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-200 text-amber-900">
                  Auto-defaulted (+{slaTriggerToAckDays}d SLA)
                </span>
              ) : rawAckDate ? (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                  Manually Set
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-200 text-slate-700">
                  Awaiting Input
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={effectiveAckDate}
                onChange={(e) => handleAckDateChange(e.target.value)}
                className="w-full px-2.5 py-1 bg-white border border-amber-300 rounded font-mono text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={handleSetTodayAckDate}
                className="px-2 py-1 text-[10px] font-bold bg-white hover:bg-amber-100 text-amber-800 border border-amber-300 rounded whitespace-nowrap"
                title="Acknowledge start date as today"
              >
                Today
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              Main reference point for the stage completion SLA clock.
            </p>
          </div>

          {/* FIELD 3: CONTRACTS SPECIALIST */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-slate-600 font-semibold text-[11px] flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                Contracts Specialist
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Release Lead</span>
            </div>

            {contractsResources.length > 0 ? (
              <select
                value={contractsSpecialist}
                onChange={(e) => handleSpecialistChange(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="Sarah Jenkins">Sarah Jenkins (Contracts Specialist)</option>
                {contractsResources.map((res) => (
                  <option key={res.id} value={res.name}>
                    {res.name} ({res.role})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={contractsSpecialist}
                onChange={(e) => handleSpecialistChange(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-medium text-slate-800"
                placeholder="Contracts Specialist name..."
              />
            )}
            <p className="text-[10px] text-slate-500">
              Lead author and broadcaster for this enterprise notification.
            </p>
          </div>
        </div>

        {/* SLA STATUS BANNER */}
        <div
          className={`p-2.5 rounded-lg border flex items-center justify-between text-xs ${
            isSlaTargetOverdue
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : isAutoDefaulted
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : effectiveAckDate
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : isAckOverdue
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {isSlaTargetOverdue ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : isAutoDefaulted ? (
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
            ) : effectiveAckDate ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <Clock className="w-4 h-4 text-blue-600 shrink-0" />
            )}

            <div>
              <span className="font-bold">
                {isSlaTargetOverdue
                  ? `WIN Broadcast SLA Exceeded (${elapsedDaysFromAck} days elapsed vs ${stage11TargetSlaDays}d SLA target)`
                  : isAutoDefaulted
                  ? `Acknowledged Start Date auto-defaulted to Trigger Date + ${slaTriggerToAckDays}d SLA.`
                  : effectiveAckDate
                  ? `Stage active since ${formatDate(effectiveAckDate)}. Target SLA: ${stage11TargetSlaDays} business day.`
                  : `Ingress SLA Active: Please acknowledge work start within ${slaTriggerToAckDays} day (${elapsedDaysFromTrigger}d elapsed).`}
              </span>
              <span className="block text-[11px] opacity-80 mt-0.5">
                {effectiveAckDate
                  ? `Active SLA anchor: ${formatDate(effectiveAckDate)}. Broadcast target: Release today.`
                  : `After ${slaTriggerToAckDays} day(s) without manual input, Acknowledged Start Date defaults to ${formatDate(autoDefaultedAckDate)}.`}
              </span>
            </div>
          </div>

          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
              isSlaTargetOverdue
                ? 'bg-rose-200 text-rose-900'
                : isAutoDefaulted
                ? 'bg-amber-200 text-amber-900'
                : effectiveAckDate
                ? 'bg-emerald-200 text-emerald-900'
                : 'bg-blue-200 text-blue-900'
            }`}
          >
            {isSlaTargetOverdue
              ? 'SLA Overdue'
              : isAutoDefaulted
              ? 'Auto-Defaulted'
              : effectiveAckDate
              ? 'SLA Active'
              : 'Pending Ack'}
          </span>
        </div>
      </div>

      {/* SECTION 2: DEAL HIGHLIGHTS & DISTRIBUTION LIST */}
      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-slate-500" />
            Broadcast Key Metrics & Recipient Distribution
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            Company-Wide Distribution
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2 bg-white rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-400 block font-medium">Client Name</span>
            <span className="font-bold text-slate-900 truncate block">{opportunity.clientName}</span>
          </div>
          <div className="p-2 bg-white rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-400 block font-medium">Total Contract Value (TCV)</span>
            <span className="font-bold text-emerald-700">{formatCurrency(opportunity.dealValue, opportunity.currency)}</span>
          </div>
          <div className="p-2 bg-white rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-400 block font-medium">Sales Account Lead</span>
            <span className="font-semibold text-slate-800 truncate block">{opportunity.salesLead}</span>
          </div>
          <div className="p-2 bg-white rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-400 block font-medium">Business Unit</span>
            <span className="font-semibold text-slate-800 truncate block">{opportunity.businessUnit}</span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="text-slate-500 font-medium mr-1">Broadcast To:</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-medium font-mono text-[10px]">
            all-company@enterprise.com
          </span>
          <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-medium font-mono text-[10px]">
            executive-leadership@enterprise.com
          </span>
          <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-medium font-mono text-[10px]">
            finance-ops@enterprise.com
          </span>
          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium font-mono text-[10px]">
            pmo-delivery@enterprise.com
          </span>
        </div>
      </div>

      {/* SECTION 3: EMAIL BROADCAST COMPOSER */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-amber-600" />
            Announcement Email Message Composition
          </span>
          <span className="text-[10px] text-slate-400">Editable before broadcast</span>
        </div>

        <div>
          <label className="block text-slate-700 font-medium mb-1 text-xs">Email Subject Line</label>
          <input
            type="text"
            value={emailSubject}
            onChange={(e) =>
              onUpdateOpportunity({
                ...opportunity,
                winNotification: {
                  ...opportunity.winNotification,
                  isReleased: opportunity.winNotification?.isReleased ?? false,
                  emailSubject: e.target.value,
                  stage11TriggerDate,
                  acknowledgedStartDate: effectiveAckDate,
                },
              })
            }
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
            placeholder="Subject line..."
          />
        </div>

        <div>
          <label className="block text-slate-700 font-medium mb-1 text-xs">Email Broadcast Body</label>
          <textarea
            rows={7}
            value={emailBody}
            onChange={(e) =>
              onUpdateOpportunity({
                ...opportunity,
                winNotification: {
                  ...opportunity.winNotification,
                  isReleased: opportunity.winNotification?.isReleased ?? false,
                  emailBody: e.target.value,
                  stage11TriggerDate,
                  acknowledgedStartDate: effectiveAckDate,
                },
              })
            }
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono leading-relaxed text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
            placeholder="Email announcement message body..."
          />
        </div>
      </div>

      {/* SECTION 4: ACTIONS BAR */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-slate-500 text-xs flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>
            Broadcasting will advance to <strong>Stage 12: Parallel Execution</strong> (Finance Budget Allocation & PMO Sprint Kickoff).
          </span>
        </div>

        <button
          type="button"
          onClick={handleBroadcastWin}
          className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 text-xs font-bold rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-sm transition-all transform active:scale-98 cursor-pointer"
        >
          <Mail className="w-4 h-4 mr-1.5" />
          Broadcast WIN Notification Email 🎉
        </button>
      </div>
    </div>
  );
};
