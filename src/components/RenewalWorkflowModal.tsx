import React, { useState } from 'react';
import { 
  X, 
  RefreshCw, 
  FileText, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  ShieldCheck, 
  Send, 
  Calendar, 
  UserCheck, 
  ArrowRight, 
  Check, 
  AlertCircle,
  FileCheck,
  Building,
  Layers,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Opportunity, ContractRenewalRecord, RenewalStage, StakeholderRole, ResourceMember } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { UserProfile } from '../types/rbac';

interface RenewalWorkflowModalProps {
  isOpen: boolean;
  opportunity: Opportunity | null;
  currentUser?: UserProfile;
  resources?: ResourceMember[];
  onClose: () => void;
  onUpdateOpportunity: (updated: Opportunity) => void;
}

export const RenewalWorkflowModal: React.FC<RenewalWorkflowModalProps> = ({
  isOpen,
  opportunity,
  currentUser,
  resources = [],
  onClose,
  onUpdateOpportunity,
}) => {
  if (!isOpen || !opportunity) return null;

  const currentRenewal: ContractRenewalRecord = opportunity.contractRenewalRecord || {
    renewalId: `ren-${Date.now()}`,
    cycleNumber: (opportunity.renewalHistory?.length || 0) + 1,
    currentRenewalStage: 'RENEWAL_TRIGGERED',
    status: 'NOT_STARTED',
    initiatedAt: new Date().toISOString(),
    initiatedBy: currentUser?.name || 'Sarah Jenkins (Contracts Team)',
    renewalReason: 'Contract Expiration & Scope / Cost Update',
    financeApprovalRequired: true,
    stageHistory: [],
  };

  const currentStage: RenewalStage = currentRenewal.currentRenewalStage || 'RENEWAL_TRIGGERED';
  const contractCode = opportunity.parallelFinance?.contractCode || opportunity.contractDetails?.contractNumber || 'CTR-CODE-PENDING';
  const currentTcv = opportunity.parallelFinance?.tcv || opportunity.dealValue || 0;
  const currency = opportunity.currency || 'PHP';

  // Local form state for the active stage
  // Stage R1: Contracts Trigger
  const [renewalReason, setRenewalReason] = useState(currentRenewal.renewalReason || 'Additional Services & Cost Adjustment upon Renewal');
  const [updateScopeNotes, setUpdateScopeNotes] = useState(currentRenewal.updateScopeNotes || 'Client requested additional 24/7 SRE coverage, updated pricing indexation (+8%), and revision of SLA penalty clause.');
  const [assignedBuOwner, setAssignedBuOwner] = useState(currentRenewal.assignedBuOwner || opportunity.buOwner || opportunity.solutionProposal?.buOwner || 'Devon Wright (BU Lead)');
  const [targetRenewalDate, setTargetRenewalDate] = useState(
    currentRenewal.targetRenewalDate || (opportunity.parallelFinance?.contractEndDate || new Date().toISOString().split('T')[0])
  );

  // Stage R2: BU Scope Update
  const [updatedScopeDocFileName, setUpdatedScopeDocFileName] = useState(
    currentRenewal.updatedScopeDocFileName || `${contractCode}_Renewed_SOW_Scope_v2.pdf`
  );
  const [updatedScopeDocLink, setUpdatedScopeDocLink] = useState(
    currentRenewal.updatedScopeDocLink || 'https://sharepoint.internal/contracts/renewals/renewed-scope-doc.pdf'
  );
  const [additionalServicesSummary, setAdditionalServicesSummary] = useState(
    currentRenewal.additionalServicesSummary || 'Added 2 Tier-2 support shifts, microservices health monitoring dashboard, and expanded multi-region disaster recovery testing.'
  );
  const [clauseModifications, setClauseModifications] = useState(
    currentRenewal.clauseModifications || 'Updated SLA uptime guarantee to 99.95%, liability cap adjusted to 1.0x revised annual TCV.'
  );
  const [proposedRenewalAmount, setProposedRenewalAmount] = useState<number>(
    currentRenewal.proposedRenewalAmount || Math.round(currentTcv * 1.1)
  );
  const [buNotes, setBuNotes] = useState(currentRenewal.buNotes || 'Scope revised and validated with engineering delivery leads. Pricing model verified.');

  // Stage R3: Contracts Review & Finance Endorsement Decision
  const [financeApprovalRequired, setFinanceApprovalRequired] = useState<boolean>(
    currentRenewal.financeApprovalRequired !== undefined ? currentRenewal.financeApprovalRequired : true
  );
  const [contractsReviewNotes, setContractsReviewNotes] = useState(
    currentRenewal.contractsReviewNotes || 'Scope clauses and revised SOW schedule reviewed. Legal terms meet standard compliance criteria.'
  );
  const [financeThresholdReason, setFinanceThresholdReason] = useState(
    currentRenewal.financeThresholdReason || 'Proposed cost variance is greater than 5% indexation benchmark. Endorsed to Finance for margin approval.'
  );

  // Stage R4: Finance Approval
  const [approvedRenewalAmount, setApprovedRenewalAmount] = useState<number>(
    currentRenewal.approvedRenewalAmount || proposedRenewalAmount
  );
  const [financeApprovalNotes, setFinanceApprovalNotes] = useState(
    currentRenewal.financeApprovalNotes || 'Commercial terms and gross margin of 48.2% approved for renewal contract.'
  );

  // Stage R5: Sales Client Release & Signature
  const [clientPoNumber, setClientPoNumber] = useState(
    currentRenewal.clientPoNumber || `PO-REN-${new Date().getFullYear()}-8821`
  );
  const [signedRenewalContractFileName, setSignedRenewalContractFileName] = useState(
    currentRenewal.signedRenewalContractFileName || `${contractCode}_Executed_Renewal_Signed.pdf`
  );
  const [signedRenewalContractLink, setSignedRenewalContractLink] = useState(
    currentRenewal.signedRenewalContractLink || 'https://docusign.internal/envelopes/signed-renewal-contract.pdf'
  );
  const [clientPoFileName, setClientPoFileName] = useState(
    currentRenewal.clientPoFileName || `Client_Purchase_Order_${clientPoNumber}.pdf`
  );
  const [salesNotes, setSalesNotes] = useState(
    currentRenewal.salesNotes || 'Client procurement approved the revised proposal. Signed contract and official PO received.'
  );

  // Stage R6: CCM Tagging
  const [taggedNewStartDate, setTaggedNewStartDate] = useState(
    currentRenewal.taggedNewStartDate || 
    (opportunity.parallelFinance?.contractEndDate 
      ? new Date(new Date(opportunity.parallelFinance.contractEndDate).getTime() + 86400000).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0])
  );
  const [taggedNewEndDate, setTaggedNewEndDate] = useState(
    currentRenewal.taggedNewEndDate || 
    (opportunity.parallelFinance?.contractEndDate 
      ? new Date(new Date(opportunity.parallelFinance.contractEndDate).getTime() + 365 * 86400000).toISOString().split('T')[0]
      : new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0])
  );
  const [taggedSignedAmount, setTaggedSignedAmount] = useState<number>(
    currentRenewal.taggedSignedAmount || approvedRenewalAmount || proposedRenewalAmount
  );
  const [ccmNotes, setCcmNotes] = useState(
    currentRenewal.ccmNotes || 'Verified signed renewed contract and client PO against internal ledger. Active contract validity dates updated.'
  );

  // Calculate cost variance
  const costDifference = (proposedRenewalAmount || 0) - currentTcv;
  const costVariancePct = currentTcv > 0 ? Math.round((costDifference / currentTcv) * 100) : 0;

  // Workflow Stages Definition
  const renewalStages: { id: RenewalStage; title: string; stepNumber: number; actor: string; desc: string }[] = [
    { 
      id: 'RENEWAL_TRIGGERED', 
      title: '1. Contracts Trigger', 
      stepNumber: 1, 
      actor: 'Contracts Team', 
      desc: 'Trigger renewal & assign scope update to BU' 
    },
    { 
      id: 'BU_SCOPE_UPDATED', 
      title: '2. BU Scope & Cost Update', 
      stepNumber: 2, 
      actor: 'BU / Contract Owner', 
      desc: 'Download current contract, upload revised scope & cost' 
    },
    { 
      id: 'CONTRACTS_REVIEW', 
      title: '3. Contracts Review', 
      stepNumber: 3, 
      actor: 'Contracts Team', 
      desc: 'Review clauses; endorse to Finance or skip' 
    },
    { 
      id: 'FINANCE_APPROVAL', 
      title: '4. Finance Approval', 
      stepNumber: 4, 
      actor: 'Finance Team', 
      desc: 'Verify margin thresholds & budget approval' 
    },
    { 
      id: 'SALES_CLIENT_SIGNING', 
      title: '5. Sales Client Release & PO', 
      stepNumber: 5, 
      actor: 'Sales Executive', 
      desc: 'Client signature & upload signed contract + PO' 
    },
    { 
      id: 'CCM_TAGGING', 
      title: '6. CCM Tagging & Activation', 
      stepNumber: 6, 
      actor: 'CCM Compliance', 
      desc: 'Tag new dates, signed amount & activate' 
    },
  ];

  // Helper to determine stage index
  const getStageIndex = (stage: RenewalStage): number => {
    switch (stage) {
      case 'RENEWAL_TRIGGERED': return 1;
      case 'BU_SCOPE_UPDATED': return 2;
      case 'CONTRACTS_REVIEW': return 3;
      case 'FINANCE_APPROVAL': return 4;
      case 'SALES_CLIENT_SIGNING': return 5;
      case 'CCM_TAGGING': return 6;
      case 'RENEWAL_ACTIVATED': return 7;
      default: return 0;
    }
  };

  const currentStageIndex = getStageIndex(currentStage);

  // Transition handler
  const handleTransition = (nextStage: RenewalStage, actionLabel: string, comments: string) => {
    const now = new Date().toISOString();
    const actorName = currentUser?.name || 'Contracts Specialist';
    const actorRole = (currentUser?.role as StakeholderRole) || 'CONTRACTS';

    const stageEntry = {
      id: `rse-${Date.now()}`,
      stage: currentStage,
      stageLabel: renewalStages.find((s) => s.id === currentStage)?.title || currentStage,
      timestamp: now,
      actorName,
      actorRole,
      action: actionLabel,
      comments,
    };

    const updatedRecord: ContractRenewalRecord = {
      ...currentRenewal,
      currentRenewalStage: nextStage,
      status: nextStage === 'RENEWAL_ACTIVATED' ? 'COMPLETED' : 'IN_PROGRESS',
      renewalReason,
      updateScopeNotes,
      assignedBuOwner,
      targetRenewalDate,
      originalContractDownloadLink: `https://contracts.internal/download/${contractCode}_Signed.pdf`,
      originalContractFileName: `${contractCode}_Original_Executed_Contract.pdf`,
      updatedScopeDocFileName,
      updatedScopeDocLink,
      additionalServicesSummary,
      clauseModifications,
      proposedRenewalAmount,
      proposedRenewalCurrency: currency,
      costVariancePercent: costVariancePct,
      buSubmittedAt: currentStageIndex >= 2 ? (currentRenewal.buSubmittedAt || now) : undefined,
      buSubmittedBy: currentStageIndex >= 2 ? (currentRenewal.buSubmittedBy || actorName) : undefined,
      buNotes,
      contractsReviewer: currentStageIndex >= 3 ? (currentRenewal.contractsReviewer || actorName) : undefined,
      contractsReviewedAt: currentStageIndex >= 3 ? (currentRenewal.contractsReviewedAt || now) : undefined,
      contractsReviewNotes,
      financeApprovalRequired,
      financeThresholdReason,
      financeApprover: currentStageIndex >= 4 ? (currentRenewal.financeApprover || actorName) : undefined,
      financeApprovedAt: currentStageIndex >= 4 ? (currentRenewal.financeApprovedAt || now) : undefined,
      financeApprovalNotes,
      approvedRenewalAmount: approvedRenewalAmount || proposedRenewalAmount,
      financeApproved: currentStageIndex >= 4 ? true : undefined,
      salesLeadAssigned: opportunity.salesLead,
      signedRenewalContractFileName,
      signedRenewalContractLink,
      clientPoNumber,
      clientPoFileName,
      salesSubmittedAt: currentStageIndex >= 5 ? (currentRenewal.salesSubmittedAt || now) : undefined,
      salesNotes,
      ccmOfficer: nextStage === 'RENEWAL_ACTIVATED' ? actorName : currentRenewal.ccmOfficer,
      taggedNewStartDate,
      taggedNewEndDate,
      taggedSignedAmount,
      taggedCurrency: currency,
      ccmTaggedAt: nextStage === 'RENEWAL_ACTIVATED' ? now : currentRenewal.ccmTaggedAt,
      ccmNotes,
      stageHistory: [...(currentRenewal.stageHistory || []), stageEntry],
    };

    // If activating renewal:
    let updatedOpp: Opportunity = {
      ...opportunity,
      contractRenewalRecord: updatedRecord,
      updatedAt: now,
    };

    if (nextStage === 'RENEWAL_ACTIVATED') {
      // Update the active contract details in parallelFinance and opportunity
      updatedOpp = {
        ...updatedOpp,
        dealValue: taggedSignedAmount,
        parallelFinance: {
          ...updatedOpp.parallelFinance,
          contractStartDate: taggedNewStartDate,
          contractEndDate: taggedNewEndDate,
          tcv: taggedSignedAmount,
          isConfigured: true,
          contractRenewalType: 'RECURRING',
        },
        renewalHistory: [
          ...(updatedOpp.renewalHistory || []),
          { ...updatedRecord, currentRenewalStage: 'RENEWAL_ACTIVATED', status: 'COMPLETED' },
        ],
        // Record completed in audit log
        history: [
          ...(updatedOpp.history || []),
          {
            id: `audit-${Date.now()}`,
            timestamp: now,
            stage: updatedOpp.currentStage,
            actorName,
            actorRole,
            action: `Contract Renewal Cycle #${updatedRecord.cycleNumber} Fully Executed & Activated`,
            comments: `CCM tagged new validity period from ${taggedNewStartDate} to ${taggedNewEndDate} with revised signed amount ${formatCurrency(taggedSignedAmount, currency)}.`,
            dealValue: taggedSignedAmount,
          },
        ],
      };
    }

    onUpdateOpportunity(updatedOpp);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl xl:max-w-6xl 2xl:max-w-[92vw] 3xl:max-w-[88vw] max-h-[94vh] 2xl:max-h-[96vh] flex flex-col overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center shrink-0">
              <RefreshCw className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center flex-wrap gap-2">
                <span className="font-mono text-xs font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 px-2 py-0.5 rounded-md">
                  {contractCode}
                </span>
                <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  RENEWAL CYCLE #{currentRenewal.cycleNumber}
                </span>
                <span className="text-xs text-slate-300">
                  {opportunity.clientName}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
                Contract Renewal Governance Workflow
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0 self-end sm:self-center">
            <div className="text-right hidden sm:block">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Current Contract TCV</div>
              <div className="text-sm font-extrabold text-emerald-400">
                {formatCurrency(currentTcv, currency)}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* WORKFLOW STEPPER PROGRESS BAR */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-3 shrink-0 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[700px] gap-2">
            {renewalStages.map((stage, idx) => {
              const isPast = currentStageIndex > stage.stepNumber;
              const isCurrent = currentStageIndex === stage.stepNumber;
              return (
                <div key={stage.id} className="flex items-center flex-1 last:flex-none">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isPast
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : isCurrent
                          ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-xs'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {isPast ? <Check className="w-4 h-4 stroke-[3]" /> : stage.stepNumber}
                    </div>
                    <div>
                      <div className={`text-xs font-bold leading-tight ${
                        isCurrent ? 'text-indigo-900 font-extrabold' : isPast ? 'text-emerald-800' : 'text-slate-500'
                      }`}>
                        {stage.title}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {stage.actor}
                      </div>
                    </div>
                  </div>
                  {idx < renewalStages.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-3 ${isPast ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* MODAL MAIN BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* ACTIVE STAGE ACTION CARD */}
          <div className="bg-white rounded-2xl border-2 border-indigo-200/80 shadow-xs overflow-hidden">
            <div className="bg-indigo-50/80 px-5 py-3 border-b border-indigo-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="p-1 rounded-md bg-indigo-600 text-white">
                  <Sparkles className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-indigo-950">
                  Active Renewal Action: {renewalStages.find((s) => s.id === currentStage)?.title}
                </h3>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                Action Required by: {renewalStages.find((s) => s.id === currentStage)?.actor}
              </span>
            </div>

            <div className="p-5 sm:p-6 space-y-5">

              {/* ----------------- STAGE R1: CONTRACTS TRIGGER ----------------- */}
              {currentStage === 'RENEWAL_TRIGGERED' && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
                    <strong>Contracts Team Renewal Trigger</strong>: Initiate the renewal review when contract validity is nearing expiration, or when there is a requirement to update current scope, add extra service tiers, adjust rate cards/cost, or modify clauses upon contract renewal.
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Primary Reason for Renewal Update <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={renewalReason}
                        onChange={(e) => setRenewalReason(e.target.value)}
                        placeholder="e.g. Additional Services, Cost Adjustment upon Renewal, Clause Updates"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Assign to BU / Contract Owner <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={assignedBuOwner}
                        onChange={(e) => setAssignedBuOwner(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        {resources.length > 0 ? (
                          resources.map((r) => (
                            <option key={r.id} value={`${r.name} (${r.role || 'BU'})`}>
                              {r.name} — {r.role} ({r.department})
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="Devon Wright (BU Lead)">Devon Wright (BU Lead - Architecture)</option>
                            <option value="Samantha Reynolds (Delivery Lead)">Samantha Reynolds (PMO Delivery Lead)</option>
                            <option value="Jessica Chen (Sales / Presales)">Jessica Chen (Presales Lead)</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Guidance & Scope Instructions for BU Owner <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={updateScopeNotes}
                      onChange={(e) => setUpdateScopeNotes(e.target.value)}
                      placeholder="Specify what clauses, scope additions, or cost adjustments the BU owner must revise..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleTransition(
                        'BU_SCOPE_UPDATED',
                        'Renewal Triggered & Assigned to BU Owner',
                        `Contracts team triggered renewal for: ${renewalReason}. Assigned to ${assignedBuOwner}.`
                      )}
                      className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center shadow-xs transition-all cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                      Trigger Renewal & Assign to BU Owner
                    </button>
                  </div>
                </div>
              )}

              {/* ----------------- STAGE R2: BU SCOPE & COST UPDATE ----------------- */}
              {currentStage === 'BU_SCOPE_UPDATED' && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                    <strong>BU / Contract Owner Action</strong>: Review current executed contract, upload updated scope and clause documentation, describe any additional services, and update the proposed cost upon renewal.
                  </div>

                  {/* Download Executed Prior Contract */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          Executed Contract Document: {contractCode}_Original_Executed_Contract.pdf
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Original Signed MSA/SOW Contract ({formatCurrency(currentTcv, currency)})
                        </div>
                      </div>
                    </div>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        alert(`Downloading signed previous contract: ${contractCode}_Original_Executed_Contract.pdf`);
                      }}
                      className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 shadow-2xs transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 mr-1 text-blue-600" />
                      Download Signed Contract
                    </a>
                  </div>

                  {/* Upload Updated File */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Upload Updated Scope / Clause File <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={updatedScopeDocFileName}
                          onChange={(e) => setUpdatedScopeDocFileName(e.target.value)}
                          placeholder="e.g. CTR_Renewed_SOW_Scope_v2.pdf"
                          className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => alert('Simulated File Upload: Attached updated scope document successfully.')}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 flex items-center"
                        >
                          <Upload className="w-3.5 h-3.5 mr-1 text-slate-600" />
                          Browse
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Updated Cost upon Renewal ({currency}) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={proposedRenewalAmount}
                          onChange={(e) => setProposedRenewalAmount(Number(e.target.value))}
                          className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                        />
                        <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      </div>
                      <div className="flex items-center justify-between text-[11px] mt-1">
                        <span className="text-slate-500">Current: {formatCurrency(currentTcv, currency)}</span>
                        <span className={`font-bold ${costDifference >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          Variance: {costDifference >= 0 ? '+' : ''}{formatCurrency(costDifference, currency)} ({costDifference >= 0 ? '+' : ''}{costVariancePct}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Additional Services Included in Renewal
                    </label>
                    <textarea
                      rows={2}
                      value={additionalServicesSummary}
                      onChange={(e) => setAdditionalServicesSummary(e.target.value)}
                      placeholder="Specify any new deliverables, service pillars, or higher SLA tiers..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Scope Clause Modifications & BU Owner Remarks
                    </label>
                    <textarea
                      rows={2}
                      value={clauseModifications}
                      onChange={(e) => setClauseModifications(e.target.value)}
                      placeholder="Modifications to SLA uptime, maintenance windows, rate cards..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleTransition(
                        'CONTRACTS_REVIEW',
                        'BU Scope & Cost Updated',
                        `BU Owner submitted updated scope document (${updatedScopeDocFileName}) with proposed renewal cost of ${formatCurrency(proposedRenewalAmount, currency)}.`
                      )}
                      className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center shadow-xs transition-all cursor-pointer"
                    >
                      <ArrowRight className="w-3.5 h-3.5 mr-1.5" />
                      Submit to Contracts Team for Review
                    </button>
                  </div>
                </div>
              )}

              {/* ----------------- STAGE R3: CONTRACTS REVIEW & DECISION ----------------- */}
              {currentStage === 'CONTRACTS_REVIEW' && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-purple-50/80 border border-purple-200 rounded-xl text-xs text-purple-900 leading-relaxed">
                    <strong>Contracts Team Review</strong>: Validate updated clauses and scope document. Determine whether Finance approval is required based on renewal cost thresholds or can be skipped.
                  </div>

                  {/* Summary of BU Update */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Proposed Renewal Cost</span>
                      <strong className="text-slate-900 text-sm">{formatCurrency(proposedRenewalAmount, currency)}</strong>
                      <span className="text-[10px] text-emerald-700 font-bold ml-1">({costDifference >= 0 ? '+' : ''}{costVariancePct}%)</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Updated Scope Doc</span>
                      <span className="text-slate-800 font-semibold truncate block">{updatedScopeDocFileName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Additional Services</span>
                      <span className="text-slate-700 line-clamp-1">{additionalServicesSummary}</span>
                    </div>
                  </div>

                  {/* Decision on Finance Approval */}
                  <div className="border border-indigo-200 rounded-xl p-4 bg-indigo-50/30 space-y-3">
                    <div className="text-xs font-bold text-slate-800">
                      Finance Approval Decision (Threshold Policy):
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className={`p-3 rounded-xl border flex items-start space-x-2.5 cursor-pointer transition-all ${
                        financeApprovalRequired
                          ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-400/40'
                          : 'bg-white border-slate-200'
                      }`}>
                        <input
                          type="radio"
                          name="financeDecision"
                          checked={financeApprovalRequired === true}
                          onChange={() => setFinanceApprovalRequired(true)}
                          className="mt-0.5"
                        />
                        <div>
                          <div className="text-xs font-bold text-purple-900">Endorse to Finance for Approval</div>
                          <div className="text-[11px] text-purple-700 mt-0.5">
                            Required when cost adjustment exceeds standard threshold, or scope introduces commercial risk.
                          </div>
                        </div>
                      </label>

                      <label className={`p-3 rounded-xl border flex items-start space-x-2.5 cursor-pointer transition-all ${
                        !financeApprovalRequired
                          ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/40'
                          : 'bg-white border-slate-200'
                      }`}>
                        <input
                          type="radio"
                          name="financeDecision"
                          checked={financeApprovalRequired === false}
                          onChange={() => setFinanceApprovalRequired(false)}
                          className="mt-0.5"
                        />
                        <div>
                          <div className="text-xs font-bold text-emerald-900">Skip Finance Approval</div>
                          <div className="text-[11px] text-emerald-700 mt-0.5">
                            Permitted when cost is within pre-approved contractual price indexation (e.g. ≤ 5%).
                          </div>
                        </div>
                      </label>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Contracts Review Notes & Threshold Justification
                      </label>
                      <input
                        type="text"
                        value={financeThresholdReason}
                        onChange={(e) => setFinanceThresholdReason(e.target.value)}
                        placeholder="Justification for endorsing or skipping Finance approval..."
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-3 border-t border-slate-100 gap-2">
                    {financeApprovalRequired ? (
                      <button
                        type="button"
                        onClick={() => handleTransition(
                          'FINANCE_APPROVAL',
                          'Endorsed to Finance for Renewal Approval',
                          `Contracts team endorsed proposed renewal cost of ${formatCurrency(proposedRenewalAmount, currency)} to Finance for approval.`
                        )}
                        className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center shadow-xs transition-all cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                        Endorse to Finance for Approval
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleTransition(
                          'SALES_CLIENT_SIGNING',
                          'Finance Approval Skipped (Within Threshold) → Endorsed to Sales',
                          `Contracts team skipped Finance approval (within policy threshold) and endorsed directly to Sales for client execution.`
                        )}
                        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center shadow-xs transition-all cursor-pointer"
                      >
                        <ArrowRight className="w-3.5 h-3.5 mr-1.5" />
                        Skip Finance → Endorse to Sales for Client Release
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ----------------- STAGE R4: FINANCE APPROVAL ----------------- */}
              {currentStage === 'FINANCE_APPROVAL' && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-900 leading-relaxed">
                    <strong>Finance Team Approval</strong>: Evaluate the commercial variance, gross margin contribution, and approve the renewal contract baseline.
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Approved Renewal Amount ({currency}) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={approvedRenewalAmount}
                        onChange={(e) => setApprovedRenewalAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Finance Approver Name
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={currentUser?.name || 'David Cho (Chief Financial Officer)'}
                        className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Finance Approval Comments & Margin Sign-off
                    </label>
                    <textarea
                      rows={2}
                      value={financeApprovalNotes}
                      onChange={(e) => setFinanceApprovalNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleTransition(
                        'SALES_CLIENT_SIGNING',
                        'Finance Commercial Approval Granted',
                        `Finance team approved renewal amount of ${formatCurrency(approvedRenewalAmount, currency)}. Endorsed to Sales for client signing.`
                      )}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center shadow-xs transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                      Approve & Endorse to Sales for Signing
                    </button>
                  </div>
                </div>
              )}

              {/* ----------------- STAGE R5: SALES CLIENT SIGNING & PO ----------------- */}
              {currentStage === 'SALES_CLIENT_SIGNING' && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
                    <strong>Sales Team Action</strong>: Release the approved renewed contract to the client, obtain signed contract execution, secure the client's official Purchase Order (PO), and upload the executed files.
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Client Purchase Order (PO) Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={clientPoNumber}
                        onChange={(e) => setClientPoNumber(e.target.value)}
                        placeholder="e.g. PO-CLIENT-2026-9901"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Upload Client Signed Renewed Contract <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={signedRenewalContractFileName}
                          onChange={(e) => setSignedRenewalContractFileName(e.target.value)}
                          className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800"
                        />
                        <button
                          type="button"
                          onClick={() => alert('Simulated Upload: Signed Renewed Contract attached.')}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 flex items-center"
                        >
                          <Upload className="w-3.5 h-3.5 mr-1" />
                          Upload
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Upload Client Purchase Order (PO) File <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={clientPoFileName}
                        onChange={(e) => setClientPoFileName(e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => alert('Simulated Upload: Client PO document attached.')}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 flex items-center"
                      >
                        <Upload className="w-3.5 h-3.5 mr-1" />
                        Upload
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Sales Signing Execution Notes
                    </label>
                    <textarea
                      rows={2}
                      value={salesNotes}
                      onChange={(e) => setSalesNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleTransition(
                        'CCM_TAGGING',
                        'Executed Contract & Client PO Uploaded by Sales',
                        `Sales team uploaded client-signed renewed contract (${signedRenewalContractFileName}) and PO #${clientPoNumber}. Forwarded to CCM.`
                      )}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center shadow-xs transition-all cursor-pointer"
                    >
                      <ArrowRight className="w-3.5 h-3.5 mr-1.5" />
                      Submit to CCM for Date Tagging & Activation
                    </button>
                  </div>
                </div>
              )}

              {/* ----------------- STAGE R6: CCM TAGGING & ACTIVATION ----------------- */}
              {currentStage === 'CCM_TAGGING' && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-xl text-xs text-indigo-900 leading-relaxed">
                    <strong>CCM (Contract & Commercial Management) Compliance Action</strong>: Tag the newly verified contract validity dates and signed renewal amount into the system ledger. Activating will renew the opportunity contract record and update active validity alerts.
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        New Contract Start Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={taggedNewStartDate}
                        onChange={(e) => setTaggedNewStartDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        New Contract End Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={taggedNewEndDate}
                        onChange={(e) => setTaggedNewEndDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        New Signed Contract Amount ({currency}) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={taggedSignedAmount}
                        onChange={(e) => setTaggedSignedAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-emerald-700 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      CCM Registration Remarks
                    </label>
                    <textarea
                      rows={2}
                      value={ccmNotes}
                      onChange={(e) => setCcmNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      PO #{clientPoNumber} Verified • Executed Contract File: {signedRenewalContractFileName}
                    </span>
                    <span className="font-extrabold text-emerald-700">
                      Term: {taggedNewStartDate} → {taggedNewEndDate}
                    </span>
                  </div>

                  <div className="flex justify-end pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleTransition(
                        'RENEWAL_ACTIVATED',
                        'Contract Dates & Signed Amount Tagged by CCM',
                        `CCM tagged new validity period ${taggedNewStartDate} to ${taggedNewEndDate} and registered signed renewal amount of ${formatCurrency(taggedSignedAmount, currency)}.`
                      )}
                      className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center shadow-md transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1.5" />
                      Tag Dates, Amount & Activate Renewed Contract
                    </button>
                  </div>
                </div>
              )}

              {/* ----------------- STAGE: RENEWAL ACTIVATED / COMPLETED ----------------- */}
              {currentStage === 'RENEWAL_ACTIVATED' && (
                <div className="p-6 text-center space-y-3 bg-emerald-50/50 rounded-xl border border-emerald-200">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-extrabold text-emerald-950">
                    Contract Renewal Cycle #{currentRenewal.cycleNumber} Fully Activated!
                  </h4>
                  <p className="text-xs text-emerald-800 max-w-lg mx-auto">
                    The contract validity has been successfully extended from <strong>{opportunity.parallelFinance?.contractStartDate}</strong> to <strong>{opportunity.parallelFinance?.contractEndDate}</strong> with active TCV of <strong>{formatCurrency(opportunity.parallelFinance?.tcv, currency)}</strong>.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        // Option to start another cycle if needed
                        handleTransition('RENEWAL_TRIGGERED', 'Initiated Subsequent Renewal Cycle', 'Contracts team initiated a new renewal cycle.');
                      }}
                      className="px-4 py-2 rounded-lg bg-white border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-50 transition-colors shadow-2xs"
                    >
                      Prepare Subsequent Renewal Cycle
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* RENEWAL AUDIT HISTORY TIMELINE */}
          {(currentRenewal.stageHistory?.length || 0) > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                Renewal Workflow Stage History & Action Owners
              </h4>

              <div className="space-y-2.5">
                {currentRenewal.stageHistory.map((item, idx) => (
                  <div key={item.id || idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start justify-between text-xs gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{item.action}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                          {item.stageLabel || item.stage}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        {item.comments}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-semibold text-slate-700">{item.actorName} ({item.actorRole})</div>
                      <div className="text-[10px] text-slate-400">{formatDate(item.timestamp)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between shrink-0 text-xs">
          <div className="text-slate-500 font-medium">
            Contract: <strong className="text-slate-800 font-mono">{contractCode}</strong> • Budget Code: <strong className="text-slate-800 font-mono">{opportunity.parallelFinance?.budgetCode || 'N/A'}</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
          >
            Close Window
          </button>
        </div>

      </div>
    </div>
  );
};
