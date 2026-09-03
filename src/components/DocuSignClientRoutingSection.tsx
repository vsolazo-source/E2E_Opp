import React, { useState, useEffect } from 'react';
import {
  FileSignature,
  Clock,
  Calendar,
  UserCheck,
  User,
  Send,
  Mail,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Pause,
  Play,
  ExternalLink,
  Link2,
  FileCheck,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
  FileText
} from 'lucide-react';
import { Opportunity, StakeholderRole, ResourceMember, AuditLogEntry, DocuSignDetails, DocuSignOnHoldEntry } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

interface DocuSignClientRoutingSectionProps {
  opportunity: Opportunity;
  currentRole: StakeholderRole;
  resources?: ResourceMember[];
  comments: string;
  setComments: (c: string) => void;
  onUpdateOpportunity: (updated: Opportunity) => void;
  onAdvanceToWinNotification: (actionName: string, extraUpdates?: Partial<Opportunity>) => void;
}

export const DocuSignClientRoutingSection: React.FC<DocuSignClientRoutingSectionProps> = ({
  opportunity,
  currentRole,
  resources = [],
  comments,
  setComments,
  onUpdateOpportunity,
  onAdvanceToWinNotification,
}) => {
  // 1. Stage 10 Trigger Date & SLA Calculation
  // Supports user's phrasing of "Stage 9 Trigger Date: this is the date the workflow entered the workflow stage"
  const stage10TriggerDate =
    opportunity.docusignDetails?.stage10TriggerDate ||
    opportunity.docusignDetails?.stage9TriggerDate ||
    (opportunity.currentStage === 'DOCUSIGN_CLIENT_ROUTING'
      ? (opportunity.stageEnteredAt || opportunity.updatedAt || opportunity.createdAt)
      : (opportunity.stageEnteredAt || opportunity.createdAt));

  const slaTriggerToAckDays = opportunity.docusignDetails?.slaTriggerToAckDays ?? 1;
  const stage10TargetSlaDays = opportunity.docusignDetails?.stage10TargetSlaDays ?? 4;

  const nowMs = Date.now();
  const triggerMs = stage10TriggerDate ? new Date(stage10TriggerDate).getTime() : nowMs;
  const elapsedDaysFromTrigger = Math.max(0, Math.floor((nowMs - triggerMs) / (1000 * 60 * 60 * 24)));

  // Auto-default logic: if no manual input in acknowledged date after SLA days, default to Trigger Date + SLA
  const rawAckDate = opportunity.docusignDetails?.acknowledgedStartDate || '';
  const isAutoDefaulted = !rawAckDate && elapsedDaysFromTrigger >= slaTriggerToAckDays;
  const autoDefaultedAckDate = new Date(triggerMs + slaTriggerToAckDays * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  const effectiveAckDate = rawAckDate || (isAutoDefaulted ? autoDefaultedAckDate : '');

  const isAckOverdue = !rawAckDate && elapsedDaysFromTrigger > slaTriggerToAckDays;
  const ackMs = effectiveAckDate ? new Date(effectiveAckDate).getTime() : null;
  const elapsedDaysFromAck = ackMs ? Math.max(0, Math.floor((nowMs - ackMs) / (1000 * 60 * 60 * 24))) : 0;
  const isSlaTargetOverdue = effectiveAckDate ? elapsedDaysFromAck > stage10TargetSlaDays : false;

  // 2. Resource Specialists & Sales
  const contractsSpecialist =
    opportunity.docusignDetails?.contractsSpecialist ||
    opportunity.contractDetails?.contractsSpecialist ||
    opportunity.contractsProcessor ||
    '';

  const salesAssigned =
    opportunity.docusignDetails?.salesAssigned ||
    opportunity.salesLead ||
    '';

  const contractsResources = resources.filter(
    (r) =>
      r.department?.toLowerCase().includes('contract') ||
      r.department?.toLowerCase().includes('legal') ||
      r.role?.toLowerCase().includes('contract') ||
      r.role?.toLowerCase().includes('legal')
  );

  const salesResources = resources.filter(
    (r) =>
      r.department?.toLowerCase().includes('sales') ||
      r.department?.toLowerCase().includes('business') ||
      r.role?.toLowerCase().includes('sales') ||
      r.role?.toLowerCase().includes('account')
  );

  // 3. Routing Scenario: (1) CONTRACTS team or (2) CLIENT
  const routingBy = opportunity.docusignDetails?.routingBy || 
    (opportunity.docusignDetails?.routingMode === 'CLIENT_COORDINATION' ? 'CLIENT' : 'CONTRACTS');

  // Sub-channel for Contracts Team: 'DOCUSIGN' or 'EMAIL'
  const contractsRoutingChannel = opportunity.docusignDetails?.contractsRoutingChannel || 'DOCUSIGN';

  // 4. On-Hold Status
  const isOnHold = opportunity.docusignDetails?.isOnHold || opportunity.docusignDetails?.status === 'ON_HOLD';
  const [showOnHoldModal, setShowOnHoldModal] = useState(false);
  const [onHoldReasonInput, setOnHoldReasonInput] = useState('');
  const [onHoldError, setOnHoldError] = useState('');

  // 5. Client Routed (Sales Coordinated) Local State
  const [clientDispatchDate, setClientDispatchDate] = useState(
    opportunity.docusignDetails?.clientDispatchDate || (stage10TriggerDate ? stage10TriggerDate.split('T')[0] : '')
  );
  const [clientExecutionTargetDate, setClientExecutionTargetDate] = useState(
    opportunity.docusignDetails?.clientExecutionTargetDate || ''
  );
  const [clientReturnedDate, setClientReturnedDate] = useState(
    opportunity.docusignDetails?.clientReturnedDate || ''
  );
  const [signedContractPoLink, setSignedContractPoLink] = useState(
    opportunity.docusignDetails?.signedContractPoLink || ''
  );
  const [clientPoNumber, setClientPoNumber] = useState(
    opportunity.docusignDetails?.clientPoNumber || ''
  );
  const [salesRoutingNotes, setSalesRoutingNotes] = useState(
    opportunity.docusignDetails?.salesRoutingNotes || ''
  );

  // 6. Contracts Team Local State
  const [envelopeId, setEnvelopeId] = useState(
    opportunity.docusignDetails?.envelopeId || `ENV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`
  );
  const [clientSignerName, setClientSignerName] = useState(
    opportunity.docusignDetails?.clientSignerName || opportunity.clientContactName || ''
  );
  const [clientSignerEmail, setClientSignerEmail] = useState(
    opportunity.docusignDetails?.clientSignerEmail || opportunity.clientContactEmail || ''
  );
  const [internalSignerName, setInternalSignerName] = useState(
    opportunity.docusignDetails?.internalSignerName || 'EVP Enterprise Solutions'
  );
  const [emailRecipient, setEmailRecipient] = useState(
    opportunity.docusignDetails?.emailRecipient || opportunity.clientContactEmail || ''
  );
  const [emailSubject, setEmailSubject] = useState(
    opportunity.docusignDetails?.emailSubject || `Executable Agreement Pack: ${opportunity.title}`
  );
  const [emailTrackingRef, setEmailTrackingRef] = useState(
    opportunity.docusignDetails?.emailTrackingRef || `TRK-EML-${Date.now().toString().slice(-6)}`
  );

  // Sync when opportunity prop changes
  useEffect(() => {
    if (opportunity.docusignDetails) {
      if (opportunity.docusignDetails.envelopeId) setEnvelopeId(opportunity.docusignDetails.envelopeId);
      if (opportunity.docusignDetails.clientSignerName) setClientSignerName(opportunity.docusignDetails.clientSignerName);
      if (opportunity.docusignDetails.clientSignerEmail) setClientSignerEmail(opportunity.docusignDetails.clientSignerEmail);
      if (opportunity.docusignDetails.internalSignerName) setInternalSignerName(opportunity.docusignDetails.internalSignerName);
      if (opportunity.docusignDetails.emailRecipient) setEmailRecipient(opportunity.docusignDetails.emailRecipient);
      if (opportunity.docusignDetails.emailSubject) setEmailSubject(opportunity.docusignDetails.emailSubject);
      if (opportunity.docusignDetails.emailTrackingRef) setEmailTrackingRef(opportunity.docusignDetails.emailTrackingRef);
      if (opportunity.docusignDetails.signedContractPoLink) setSignedContractPoLink(opportunity.docusignDetails.signedContractPoLink);
      if (opportunity.docusignDetails.clientPoNumber) setClientPoNumber(opportunity.docusignDetails.clientPoNumber);
      if (opportunity.docusignDetails.salesRoutingNotes) setSalesRoutingNotes(opportunity.docusignDetails.salesRoutingNotes);
      if (opportunity.docusignDetails.clientDispatchDate) setClientDispatchDate(opportunity.docusignDetails.clientDispatchDate);
      if (opportunity.docusignDetails.clientExecutionTargetDate) setClientExecutionTargetDate(opportunity.docusignDetails.clientExecutionTargetDate);
      if (opportunity.docusignDetails.clientReturnedDate) setClientReturnedDate(opportunity.docusignDetails.clientReturnedDate);
    }
  }, [opportunity.docusignDetails]);

  // Notifications
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Handler: Update Ack Date
  const handleSetAckDateToday = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    handleUpdateDocusignDetails({
      acknowledgedStartDate: todayStr,
    });
    setFeedbackToast('Acknowledged Start Date set to today. SLA reference clock active.');
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  const handleUpdateDocusignDetails = (partial: Partial<DocuSignDetails>) => {
    const updatedDetails: DocuSignDetails = {
      routingMode: 'DOCUSIGN',
      status: 'DRAFT',
      ...opportunity.docusignDetails,
      stage10TriggerDate,
      stage9TriggerDate: stage10TriggerDate,
      acknowledgedStartDate: effectiveAckDate,
      slaTriggerToAckDays,
      stage10TargetSlaDays,
      contractsSpecialist,
      salesAssigned,
      routingBy,
      contractsRoutingChannel,
      ...partial,
    };

    onUpdateOpportunity({
      ...opportunity,
      docusignDetails: updatedDetails,
    });
  };

  // Handler: Change Scenario (Contracts vs Client)
  const handleChangeScenario = (newScenario: 'CONTRACTS' | 'CLIENT') => {
    handleUpdateDocusignDetails({
      routingBy: newScenario,
      routingMode: newScenario === 'CLIENT' ? 'CLIENT_COORDINATION' : 'DOCUSIGN',
    });
  };

  // Handler: Change Contracts Channel (DocuSign vs Email)
  const handleChangeContractsChannel = (newChannel: 'DOCUSIGN' | 'EMAIL') => {
    handleUpdateDocusignDetails({
      contractsRoutingChannel: newChannel,
    });
  };

  // Handler: Put On Hold (Pause SLA)
  const handleConfirmOnHold = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = onHoldReasonInput.trim();
    if (!trimmed) {
      setOnHoldError('Please provide a specific reason for pausing the SLA and putting the agreement on hold.');
      return;
    }

    const now = new Date().toISOString();
    const actorName =
      (routingBy === 'CLIENT' ? salesAssigned : contractsSpecialist) ||
      `${currentRole} Officer`;

    const newHistoryEntry: DocuSignOnHoldEntry = {
      id: `hold-${Date.now()}`,
      pausedAt: now,
      reason: trimmed,
      pausedBy: actorName,
    };

    const currentHoldHistory = opportunity.docusignDetails?.onHoldHistory || [];

    const auditEntry: AuditLogEntry = {
      id: `hist-stage10-onhold-${Date.now()}`,
      timestamp: now,
      stage: 'DOCUSIGN_CLIENT_ROUTING',
      actorName,
      actorRole: currentRole,
      action: 'Agreement Put On Hold (SLA Paused)',
      comments: `Workflow placed On Hold. Reason: ${trimmed}`,
      dealValue: opportunity.dealValue,
      currency: opportunity.currency,
    };

    onUpdateOpportunity({
      ...opportunity,
      docusignDetails: {
        routingMode: 'DOCUSIGN',
        ...opportunity.docusignDetails,
        status: 'ON_HOLD',
        isOnHold: true,
        onHoldReason: trimmed,
        onHoldDate: now,
        onHoldHistory: [...currentHoldHistory, newHistoryEntry],
      },
      history: [...(opportunity.history || []), auditEntry],
    });

    setShowOnHoldModal(false);
    setOnHoldReasonInput('');
    setOnHoldError('');
    setFeedbackToast('Workflow put On Hold. SLA timer is paused.');
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  // Handler: Resume from On Hold
  const handleResumeWorkflow = () => {
    const now = new Date().toISOString();
    const actorName =
      (routingBy === 'CLIENT' ? salesAssigned : contractsSpecialist) ||
      `${currentRole} Officer`;

    const holdHistory = opportunity.docusignDetails?.onHoldHistory || [];
    const updatedHoldHistory = holdHistory.map((h, i) => {
      if (i === holdHistory.length - 1 && !h.resumedAt) {
        return { ...h, resumedAt: now };
      }
      return h;
    });

    const auditEntry: AuditLogEntry = {
      id: `hist-stage10-resume-${Date.now()}`,
      timestamp: now,
      stage: 'DOCUSIGN_CLIENT_ROUTING',
      actorName,
      actorRole: currentRole,
      action: 'Agreement Resumed from On Hold (SLA Reactivated)',
      comments: `Workflow resumed from On Hold. Previous Hold Reason: ${opportunity.docusignDetails?.onHoldReason || 'Commercial check'}`,
      dealValue: opportunity.dealValue,
      currency: opportunity.currency,
    };

    onUpdateOpportunity({
      ...opportunity,
      docusignDetails: {
        routingMode: 'DOCUSIGN',
        ...opportunity.docusignDetails,
        status: opportunity.docusignDetails?.routingMode === 'CLIENT_COORDINATION' ? 'SENT' : 'SENT',
        isOnHold: false,
        onHoldReason: undefined,
        onHoldDate: undefined,
        onHoldHistory: updatedHoldHistory,
      },
      history: [...(opportunity.history || []), auditEntry],
    });

    setFeedbackToast('Workflow resumed! SLA reference clock reactivated.');
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  // Pre-fill quick reason chips for On Hold
  const quickHoldReasons = [
    'Client Legal redlining indemnity clause',
    'Awaiting client board approval / signing authority',
    'Client procurement fiscal year-end budget freeze',
    'Tax exemption / Withholding certificate validation',
    'Purchase Order (PO) creation pending client Finance',
  ];

  // Handler: Advance when Routed by Contracts Team
  const handleAdvanceContractsSignatures = () => {
    const actor = contractsSpecialist || `${currentRole} Lead`;
    onAdvanceToWinNotification('DocuSign / Email Agreement Fully Executed', {
      docusignDetails: {
        routingMode: 'DOCUSIGN',
        ...opportunity.docusignDetails,
        status: 'COMPLETED',
        envelopeId,
        clientSignerName,
        clientSignerEmail,
        internalSignerName,
        internalSignedDate: new Date().toISOString(),
        clientSignedDate: opportunity.docusignDetails?.clientSignedDate || new Date().toISOString(),
        contractsSpecialist,
        salesAssigned,
      },
    });
  };

  // Handler: Advance when Routed by Client (Sales Coordinated)
  const handleAdvanceClientSignedPo = () => {
    if (!signedContractPoLink.trim()) {
      setFeedbackToast('⚠️ Please enter the link to the Signed Contract / Client PO before advancing.');
      return;
    }

    const now = new Date().toISOString();
    const actor = salesAssigned || `${currentRole} Lead`;

    onAdvanceToWinNotification('Client Returned Signed Contract & PO', {
      docusignDetails: {
        routingMode: 'CLIENT_COORDINATION',
        ...opportunity.docusignDetails,
        status: 'COMPLETED',
        routingBy: 'CLIENT',
        salesAssigned,
        contractsSpecialist,
        clientDispatchDate,
        clientExecutionTargetDate,
        clientReturnedDate: clientReturnedDate || now.split('T')[0],
        signedContractPoLink,
        signedContractPoFileName: signedContractPoLink,
        clientPoNumber,
        salesRoutingNotes,
        salesActionTaken: true,
      },
    });
  };

  return (
    <div className="space-y-4 text-xs">
      {/* 1. Top Header Card */}
      <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
        <div>
          <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <FileSignature className="w-4 h-4 text-rose-600" />
            Stage 10: DocuSign & Client Routing
          </div>
          <p className="text-slate-600 mt-0.5">
            Coordinate contract execution via Contracts Team (DocuSign/Email) or Client Procurement (Sales-led). Track turnaround SLAs and pause when placed on hold.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-[11px] font-bold">
            TCV: {formatCurrency(opportunity.dealValue, opportunity.currency)}
          </span>
          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
            isOnHold
              ? 'bg-amber-100 text-amber-900 border-amber-300'
              : opportunity.docusignDetails?.status === 'COMPLETED'
              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
              : 'bg-blue-50 text-blue-800 border-blue-200'
          }`}>
            {isOnHold ? 'ON HOLD (SLA PAUSED)' : `Status: ${opportunity.docusignDetails?.status || 'Active Routing'}`}
          </span>
        </div>
      </div>

      {/* Toast Feedback */}
      {feedbackToast && (
        <div className="p-2.5 bg-slate-900 text-white rounded-lg flex items-center justify-between text-xs animate-in fade-in shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackToast(null)}
            className="text-white/80 hover:text-white px-1.5 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Stage 10 Governance & SLA Ingress Panel (4 Columns) */}
      <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-rose-600" />
            <span className="font-bold text-slate-900 text-xs">Stage 10 SLA Ingress & Resource Assignment</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            SLA Clock Anchor: <strong className="text-slate-700">{effectiveAckDate ? 'Acknowledged Start Date' : 'Stage Trigger Date'}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Field 1: Stage 9 / 10 Trigger Date (Non-editable) */}
          <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="stage10-trigger-date-display" className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                Stage Trigger Date
                <span className="text-slate-400 font-normal">(Non-editable)</span>
              </label>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-600">
                Workflow Ingress
              </span>
            </div>
            <div id="stage10-trigger-date-display" className="flex items-center gap-1.5 p-1.5 bg-slate-50 rounded border border-slate-200 text-slate-800 font-mono text-xs font-semibold">
              <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>{stage10TriggerDate ? stage10TriggerDate.split('T')[0] : 'Pending Ingress'}</span>
              {stage10TriggerDate && (
                <span className="text-[10px] text-slate-500 font-sans font-normal ml-auto">
                  ({formatDate(stage10TriggerDate)})
                </span>
              )}
            </div>
            <span className="text-[9px] text-slate-400 mt-1 block">
              Workflow entered this stage from Stage 9 Final Finance Approval.
            </span>
          </div>

          {/* Field 2: Acknowledged Start Date */}
          <div className="p-2.5 bg-white rounded-lg border border-rose-200 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="stage10-ack-start-date" className="text-[10px] font-bold text-rose-950 uppercase tracking-wider flex items-center gap-1">
                Acknowledged Start Date
                <span className="text-rose-600 font-semibold">*</span>
              </label>
              <button
                type="button"
                onClick={handleSetAckDateToday}
                className="text-[10px] text-rose-700 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
              >
                <Check className="w-3 h-3" />
                Set Today
              </button>
            </div>
            <input
              id="stage10-ack-start-date"
              type="date"
              value={effectiveAckDate ? effectiveAckDate.split('T')[0] : ''}
              onChange={(e) => handleUpdateDocusignDetails({ acknowledgedStartDate: e.target.value })}
              className="w-full bg-white border border-rose-300 rounded px-2.5 py-1 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
            <div className="flex items-center justify-between text-[9px] text-slate-500 mt-1">
              <span>
                {isAutoDefaulted ? (
                  <strong className="text-amber-600">Auto-defaulted (+{slaTriggerToAckDays}d SLA)</strong>
                ) : rawAckDate ? (
                  <span className="text-emerald-700 font-semibold">Manually Acknowledged</span>
                ) : (
                  <span>Ack SLA: <strong>{slaTriggerToAckDays} day</strong></span>
                )}
              </span>
              <span className="text-slate-400">Target SLA: <strong>{stage10TargetSlaDays}d</strong></span>
            </div>
          </div>

          {/* Field 3: Contracts Specialist Dropdown */}
          <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="stage10-contracts-specialist-select" className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-teal-600" />
                Contracts Specialist
              </label>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-teal-50 text-teal-700">
                Contracts Team
              </span>
            </div>
            <select
              id="stage10-contracts-specialist-select"
              value={contractsSpecialist}
              onChange={(e) => handleUpdateDocusignDetails({ contractsSpecialist: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="">Select Contracts Specialist...</option>
              {contractsResources.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name} ({r.role || 'Contracts'})
                </option>
              ))}
              {contractsResources.length === 0 &&
                resources.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name} ({r.role})
                  </option>
                ))}
              {contractsSpecialist && !resources.some((r) => r.name === contractsSpecialist) && (
                <option value={contractsSpecialist}>{contractsSpecialist}</option>
              )}
            </select>
            <span className="text-[9px] text-slate-400 mt-1 block">
              Lead contract manager dispatching and tracking agreements.
            </span>
          </div>

          {/* Field 4: Sales Assigned Dropdown */}
          <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="stage10-sales-assigned-select" className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <User className="w-3 h-3 text-blue-600" />
                Sales Assigned
              </label>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-50 text-blue-700">
                Sales Desk
              </span>
            </div>
            <select
              id="stage10-sales-assigned-select"
              value={salesAssigned}
              onChange={(e) => handleUpdateDocusignDetails({ salesAssigned: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">Select Sales Assigned...</option>
              {salesResources.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name} ({r.role || 'Sales'})
                </option>
              ))}
              {salesResources.length === 0 &&
                resources.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name} ({r.role})
                  </option>
                ))}
              {salesAssigned && !resources.some((r) => r.name === salesAssigned) && (
                <option value={salesAssigned}>{salesAssigned}</option>
              )}
            </select>
            <span className="text-[9px] text-slate-400 mt-1 block">
              Account executive or sales lead coordinating client execution.
            </span>
          </div>
        </div>
      </div>

      {/* 3. SLA & On-Hold Status Banner */}
      <div
        className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs transition-colors ${
          isOnHold
            ? 'bg-amber-50 border-amber-300 text-amber-950 shadow-xs'
            : !rawAckDate
            ? isAutoDefaulted
              ? 'bg-amber-50/90 border-amber-300 text-amber-900'
              : isAckOverdue
              ? 'bg-rose-50 border-rose-300 text-rose-900'
              : 'bg-rose-50/70 border-rose-200 text-rose-900'
            : isSlaTargetOverdue
            ? 'bg-rose-50 border-rose-300 text-rose-900'
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}
      >
        <div className="flex items-center space-x-2.5">
          {isOnHold ? (
            <Pause className="w-5 h-5 text-amber-600 shrink-0" />
          ) : !rawAckDate ? (
            isAutoDefaulted ? (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            ) : isAckOverdue ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <Clock className="w-4 h-4 text-rose-600 shrink-0" />
            )
          ) : isSlaTargetOverdue ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}

          <div>
            <span className="font-bold text-xs">
              {isOnHold
                ? 'SLA PAUSED: Agreement Execution On Hold'
                : !rawAckDate
                ? isAutoDefaulted
                  ? `Acknowledgment SLA Auto-Defaulted (Trigger + ${slaTriggerToAckDays} day)`
                  : isAckOverdue
                  ? `Acknowledgment Overdue by ${elapsedDaysFromTrigger - slaTriggerToAckDays} day(s)`
                  : `Ingress Pending Acknowledgment (SLA: ${slaTriggerToAckDays} day)`
                : isSlaTargetOverdue
                ? `Signing Turnaround SLA Overdue by ${elapsedDaysFromAck - stage10TargetSlaDays} day(s)`
                : `Active Execution SLA Clock (${elapsedDaysFromAck}d / ${stage10TargetSlaDays}d Target)`}
            </span>
            <span className="text-[11px] block opacity-90 mt-0.5">
              {isOnHold
                ? `Paused on ${formatDate(opportunity.docusignDetails?.onHoldDate || new Date().toISOString())}. Reason: "${opportunity.docusignDetails?.onHoldReason || 'Commercial hold'}". SLA clock is currently stopped.`
                : !rawAckDate
                ? isAutoDefaulted
                  ? `SLA threshold elapsed. Acknowledged Start Date defaulted to ${effectiveAckDate}. SLA clock active.`
                  : `Triggered on ${stage10TriggerDate ? stage10TriggerDate.split('T')[0] : 'today'}. Set Acknowledged Start Date to lock SLA baseline.`
                : `Acknowledged Start Date: ${effectiveAckDate}. Review & signature target: ${stage10TargetSlaDays} business days.`}
            </span>
          </div>
        </div>

        {/* On-Hold / Resume Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {isOnHold ? (
            <button
              id="btn-resume-sla"
              type="button"
              onClick={handleResumeWorkflow}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              Resume SLA & Routing
            </button>
          ) : (
            <button
              id="btn-put-on-hold"
              type="button"
              onClick={() => {
                setShowOnHoldModal(true);
                setOnHoldReasonInput('');
                setOnHoldError('');
              }}
              className="px-3 py-1.5 rounded-lg bg-white/90 hover:bg-white text-amber-800 border border-amber-300 font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5" />
              Put On Hold (Pause SLA)
            </button>
          )}
        </div>
      </div>

      {/* 4. Recommended Design: 2 Execution Scenarios Segmented Controller */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        {/* Scenario Selection Tabs */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="space-y-0.5">
            <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-rose-600" />
              Routing Scenario Strategy
            </span>
            <span className="text-[11px] text-slate-500 block">
              Select whether the contract pack is routed directly by the <strong>Contracts Team</strong> or routed/managed through the <strong>Client</strong> (Sales-led).
            </span>
          </div>

          {/* Segmented Switcher */}
          <div className="inline-flex rounded-lg bg-slate-200/80 p-1 shrink-0">
            <button
              id="btn-scenario-contracts"
              type="button"
              onClick={() => handleChangeScenario('CONTRACTS')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                routingBy === 'CONTRACTS'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSignature className="w-3.5 h-3.5 text-rose-600" />
              (1) Routed by Contracts Team
            </button>

            <button
              id="btn-scenario-client"
              type="button"
              onClick={() => handleChangeScenario('CLIENT')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                routingBy === 'CLIENT'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              (2) Routed by Client (Sales Led)
            </button>
          </div>
        </div>

        {/* SCENARIO 1: CONTRACTS TEAM ROUTING */}
        {routingBy === 'CONTRACTS' && (
          <div className="p-4 space-y-4 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 text-xs">Contracts Team Routing Channel:</span>
                {/* Sub-channel pills: DocuSign vs Email */}
                <div className="inline-flex rounded-lg bg-slate-100 p-0.5">
                  <button
                    type="button"
                    onClick={() => handleChangeContractsChannel('DOCUSIGN')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      contractsRoutingChannel === 'DOCUSIGN'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Send className="w-3 h-3" />
                    DocuSign Digital Envelope
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChangeContractsChannel('EMAIL')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      contractsRoutingChannel === 'EMAIL'
                        ? 'bg-teal-700 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Mail className="w-3 h-3" />
                    Formal Email Dispatch
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-slate-500">Responsible Specialist:</span>
                <strong className="text-teal-700 font-semibold">
                  {contractsSpecialist || 'Contracts Team'}
                </strong>
              </div>
            </div>

            {/* CHANNEL A: DOCUSIGN DIGITAL ENVELOPE */}
            {contractsRoutingChannel === 'DOCUSIGN' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Envelope ID */}
                  <div className="space-y-1">
                    <label htmlFor="stage10-envelope-id" className="font-bold text-slate-700 block text-[11px]">
                      DocuSign Envelope ID
                    </label>
                    <input
                      id="stage10-envelope-id"
                      type="text"
                      value={envelopeId}
                      onChange={(e) => {
                        setEnvelopeId(e.target.value);
                        handleUpdateDocusignDetails({ envelopeId: e.target.value });
                      }}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-mono text-slate-900 font-semibold focus:bg-white focus:ring-2 focus:ring-rose-500 text-xs"
                      placeholder="ENV-XXXX-XXXX"
                    />
                  </div>

                  {/* Client Signatory Name */}
                  <div className="space-y-1">
                    <label htmlFor="stage10-client-signer" className="font-bold text-slate-700 block text-[11px]">
                      Client Signatory
                    </label>
                    <input
                      id="stage10-client-signer"
                      type="text"
                      value={clientSignerName}
                      onChange={(e) => {
                        setClientSignerName(e.target.value);
                        handleUpdateDocusignDetails({ clientSignerName: e.target.value });
                      }}
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-medium focus:ring-2 focus:ring-rose-500 text-xs"
                      placeholder="e.g. Jane Doe (VP Tech)"
                    />
                  </div>

                  {/* Client Signatory Email */}
                  <div className="space-y-1">
                    <label htmlFor="stage10-client-signer-email" className="font-bold text-slate-700 block text-[11px]">
                      Client Signatory Email
                    </label>
                    <input
                      id="stage10-client-signer-email"
                      type="email"
                      value={clientSignerEmail}
                      onChange={(e) => {
                        setClientSignerEmail(e.target.value);
                        handleUpdateDocusignDetails({ clientSignerEmail: e.target.value });
                      }}
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-medium focus:ring-2 focus:ring-rose-500 text-xs"
                      placeholder="signer@client.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Internal Executive Signer */}
                  <div className="space-y-1">
                    <label htmlFor="stage10-internal-signer" className="font-bold text-slate-700 block text-[11px]">
                      Internal Executive Signatory
                    </label>
                    <input
                      id="stage10-internal-signer"
                      type="text"
                      value={internalSignerName}
                      onChange={(e) => {
                        setInternalSignerName(e.target.value);
                        handleUpdateDocusignDetails({ internalSignerName: e.target.value });
                      }}
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-medium focus:ring-2 focus:ring-rose-500 text-xs"
                      placeholder="Internal Signatory"
                    />
                  </div>

                  {/* Envelope Status Badge & SLA Details */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block text-[11px]">
                      Digital Envelope State
                    </label>
                    <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded border border-slate-200">
                      <span className="font-mono text-slate-800 font-bold text-xs">
                        {opportunity.docusignDetails?.status || 'SENT'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Turnaround SLA: <strong>{stage10TargetSlaDays} Business Days</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Simulation & Workflow Controls */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-slate-700 text-[11px]">
                    DocuSign Lifecycle Controls:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        handleUpdateDocusignDetails({
                          status: 'SENT',
                          sentDate: new Date().toISOString(),
                        });
                        setFeedbackToast('DocuSign envelope dispatched to signers.');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium cursor-pointer"
                    >
                      Mark Dispatched
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleUpdateDocusignDetails({
                          status: 'CLIENT_SIGNED',
                          clientSignedDate: new Date().toISOString(),
                        });
                        setFeedbackToast('Client signature registered on envelope.');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-800 font-medium cursor-pointer"
                    >
                      Simulate: Client Signs
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleUpdateDocusignDetails({
                          status: 'COMPLETED',
                          internalSignedDate: new Date().toISOString(),
                        });
                        setFeedbackToast('Internal countersignature completed!');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-800 font-bold cursor-pointer"
                    >
                      Simulate: Internal Countersign (Complete)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* CHANNEL B: FORMAL EMAIL DISPATCH */}
            {contractsRoutingChannel === 'EMAIL' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="stage10-email-recipient" className="font-bold text-slate-700 block text-[11px]">
                      Recipient Email Address(es)
                    </label>
                    <input
                      id="stage10-email-recipient"
                      type="text"
                      value={emailRecipient}
                      onChange={(e) => {
                        setEmailRecipient(e.target.value);
                        handleUpdateDocusignDetails({ emailRecipient: e.target.value });
                      }}
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-medium focus:ring-2 focus:ring-teal-500 text-xs"
                      placeholder="client.legal@client.com"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="stage10-email-tracking-ref" className="font-bold text-slate-700 block text-[11px]">
                      Email Audit / Tracking Ref
                    </label>
                    <input
                      id="stage10-email-tracking-ref"
                      type="text"
                      value={emailTrackingRef}
                      onChange={(e) => {
                        setEmailTrackingRef(e.target.value);
                        handleUpdateDocusignDetails({ emailTrackingRef: e.target.value });
                      }}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-mono text-slate-900 font-semibold text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block text-[11px]">
                      Email Dispatch SLA
                    </label>
                    <div className="p-1.5 bg-slate-50 rounded border border-slate-200 text-slate-700 font-medium text-xs">
                      Target: <strong>2-3 Business Days</strong>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="stage10-email-subject" className="font-bold text-slate-700 block text-[11px]">
                    Email Subject Line
                  </label>
                  <input
                    id="stage10-email-subject"
                    type="text"
                    value={emailSubject}
                    onChange={(e) => {
                      setEmailSubject(e.target.value);
                      handleUpdateDocusignDetails({ emailSubject: e.target.value });
                    }}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-medium focus:ring-2 focus:ring-teal-500 text-xs"
                  />
                </div>

                {/* Contract Link preview */}
                <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-700 shrink-0" />
                    <div>
                      <span className="font-bold text-teal-950 text-xs block">Attached Executable Agreement</span>
                      <span className="text-[11px] text-teal-800 font-mono truncate max-w-md block">
                        {opportunity.contractDetails?.clientContractLink || 'Standard MSA / SOW Pack'}
                      </span>
                    </div>
                  </div>
                  {opportunity.contractDetails?.clientContractLink && (
                    <a
                      href={opportunity.contractDetails.clientContractLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded bg-teal-700 text-white font-bold text-[10px] hover:bg-teal-800 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View SOW
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Advance Action for Contracts Routing */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                id="btn-advance-contracts-complete"
                type="button"
                onClick={handleAdvanceContractsSignatures}
                className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-700 shadow-xs transition-all cursor-pointer gap-1.5"
              >
                <span>Signatures Completed → Release WIN Broadcast</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
          </div>
        )}

        {/* SCENARIO 2: CLIENT ROUTED (SALES COORDINATED) */}
        {routingBy === 'CLIENT' && (
          <div className="p-4 space-y-4 animate-in fade-in duration-150">
            {/* Sales Lead Responsibilities Notice */}
            <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl flex items-start gap-2.5">
              <UserCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-blue-950 text-xs block">
                  Sales Lead Direct Coordination Mode
                </span>
                <p className="text-[11px] text-blue-900">
                  The client has chosen to execute this contract via their internal signing authority, corporate procurement portal, or client-generated Purchase Order (PO). 
                  <strong> {salesAssigned || 'Sales Assigned'}</strong> is responsible for tracking client turnaround, securing the executed documents, and advancing the stage.
                </p>
              </div>
            </div>

            {/* Client Routing Dates Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Date A: Dispatched to Client */}
              <div className="space-y-1">
                <label htmlFor="stage10-client-dispatch-date" className="font-bold text-slate-700 block text-[11px]">
                  Contract Dispatched to Client Date
                </label>
                <input
                  id="stage10-client-dispatch-date"
                  type="date"
                  value={clientDispatchDate}
                  onChange={(e) => {
                    setClientDispatchDate(e.target.value);
                    handleUpdateDocusignDetails({ clientDispatchDate: e.target.value });
                  }}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 text-xs"
                />
                <span className="text-[9px] text-slate-400 block">When final SOW was delivered to client.</span>
              </div>

              {/* Date B: Client Execution Target Date */}
              <div className="space-y-1">
                <label htmlFor="stage10-client-target-date" className="font-bold text-slate-700 block text-[11px]">
                  Client Execution Target Date
                </label>
                <input
                  id="stage10-client-target-date"
                  type="date"
                  value={clientExecutionTargetDate}
                  onChange={(e) => {
                    setClientExecutionTargetDate(e.target.value);
                    handleUpdateDocusignDetails({ clientExecutionTargetDate: e.target.value });
                  }}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 text-xs"
                />
                <span className="text-[9px] text-slate-400 block">Committed signing or board approval deadline.</span>
              </div>

              {/* Date C: Client Returned Date */}
              <div className="space-y-1">
                <label htmlFor="stage10-client-returned-date" className="font-bold text-slate-700 block text-[11px]">
                  Client Returned Date (Signed / PO)
                </label>
                <input
                  id="stage10-client-returned-date"
                  type="date"
                  value={clientReturnedDate}
                  onChange={(e) => {
                    setClientReturnedDate(e.target.value);
                    handleUpdateDocusignDetails({ clientReturnedDate: e.target.value });
                  }}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500 text-xs"
                />
                <span className="text-[9px] text-slate-400 block">Actual date signed contract or PO received.</span>
              </div>
            </div>

            {/* MANDATORY LINK: Signed Contract / Purchase Order (PO) Field */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="stage10-signed-po-link" className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <span>Signed Contract / Client Purchase Order (PO) Link to File</span>
                  <span className="text-rose-600 font-bold">*</span>
                </label>
                {signedContractPoLink && (signedContractPoLink.startsWith('http://') || signedContractPoLink.startsWith('https://')) && (
                  <a
                    href={signedContractPoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-emerald-700 font-bold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                  >
                    <ExternalLink className="w-3 h-3" /> Open Document
                  </a>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Link input */}
                <div className="sm:col-span-2 relative">
                  <input
                    id="stage10-signed-po-link"
                    type="text"
                    required
                    value={signedContractPoLink}
                    onChange={(e) => {
                      setSignedContractPoLink(e.target.value);
                      handleUpdateDocusignDetails({
                        signedContractPoLink: e.target.value,
                        signedContractPoFileName: e.target.value,
                      });
                    }}
                    placeholder="e.g. https://drive.google.com/... or client signed SOW / PO file link"
                    className="w-full pl-3 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <Link2 className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>

                {/* Client PO Number input */}
                <div>
                  <input
                    id="stage10-client-po-number"
                    type="text"
                    value={clientPoNumber}
                    onChange={(e) => {
                      setClientPoNumber(e.target.value);
                      handleUpdateDocusignDetails({ clientPoNumber: e.target.value });
                    }}
                    placeholder="Client PO # (e.g. PO-2026-981)"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <span className="text-[10px] text-slate-500 block">
                Required by Sales to verify official binding client agreement or Purchase Order before triggering the WIN Notification.
              </span>
            </div>

            {/* Sales Notes */}
            <div className="space-y-1">
              <label htmlFor="stage10-sales-routing-notes" className="font-bold text-slate-700 block text-[11px]">
                Sales Engagement & Client Execution Notes
              </label>
              <textarea
                id="stage10-sales-routing-notes"
                rows={2}
                value={salesRoutingNotes}
                onChange={(e) => {
                  setSalesRoutingNotes(e.target.value);
                  handleUpdateDocusignDetails({ salesRoutingNotes: e.target.value });
                }}
                placeholder="Details regarding client procurement confirmation, billing contact, or PO terms..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Advance Action for Client Routing */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500">
                {signedContractPoLink.trim() ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Executed agreement link provided. Ready to advance!
                  </span>
                ) : (
                  <span className="text-amber-700 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Provide signed contract / PO link to advance to Stage 11.
                  </span>
                )}
              </span>

              <button
                id="btn-advance-client-po-complete"
                type="button"
                disabled={!signedContractPoLink.trim()}
                onClick={handleAdvanceClientSignedPo}
                className={`inline-flex items-center px-4 py-2 text-xs font-bold rounded-lg shadow-xs transition-all gap-1.5 cursor-pointer ${
                  signedContractPoLink.trim()
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>Client Signed & PO Received → Advance to WIN Notification</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. General Notes / Endorsement Comments */}
      <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1.5">
        <label htmlFor="stage10-routing-comments" className="block text-slate-800 font-bold text-xs">
          Stage 10 Execution Timeline Remarks / Comments
        </label>
        <textarea
          id="stage10-routing-comments"
          rows={2}
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Execution updates, countersignature progress, or client PO notes..."
          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
        />
      </div>

      {/* 6. On-Hold Modal Dialog */}
      {showOnHoldModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-4 bg-amber-500 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Pause className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Put Agreement On Hold</h3>
                  <p className="text-[11px] text-amber-100">Pause SLA clock and track reason</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowOnHoldModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmOnHold} className="p-4 space-y-3.5 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">
                  Quick Reason Selector:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {quickHoldReasons.map((qr) => (
                    <button
                      key={qr}
                      type="button"
                      onClick={() => {
                        setOnHoldReasonInput(qr);
                        if (onHoldError) setOnHoldError('');
                      }}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 text-[10px] font-medium transition-colors cursor-pointer border border-slate-200"
                    >
                      {qr}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="stage10-onhold-reason-textarea" className="font-bold text-slate-800 block">
                  Reason for Placing On Hold <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="stage10-onhold-reason-textarea"
                  rows={3}
                  required
                  value={onHoldReasonInput}
                  onChange={(e) => {
                    setOnHoldReasonInput(e.target.value);
                    if (onHoldError) setOnHoldError('');
                  }}
                  placeholder="Provide context on why this execution is paused (e.g. Client legal redline on indemnity, awaiting board sign-off, or budget freeze)..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none text-xs"
                  autoFocus
                />
                {onHoldError && (
                  <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {onHoldError}
                  </p>
                )}
                <span className="text-[10px] text-slate-500 block">
                  Pausing this opportunity stops the SLA turnaround clock and notifies the team.
                </span>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowOnHoldModal(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs flex items-center cursor-pointer gap-1.5"
                >
                  <Pause className="w-3.5 h-3.5" />
                  Confirm & Pause SLA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
