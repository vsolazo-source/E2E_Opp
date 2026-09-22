import {
  Opportunity,
  AuditLogEntry,
  FieldChangeEntry,
  AcknowledgedDateChangeEntry,
  WorkflowStage,
  StakeholderRole,
} from '../types';
import { STAGE_MAP } from '../data/stages';
import { UserProfile } from '../types/rbac';

export interface ActionOwnerInfo {
  ownerString: string;
  name: string;
  role: StakeholderRole | string;
  email?: string;
  title?: string;
}

/**
 * Resolves comprehensive identity of the action owner
 */
export function resolveActionOwner(
  currentUser?: UserProfile | null,
  fallbackRole?: StakeholderRole | string,
  fallbackName?: string
): ActionOwnerInfo {
  if (currentUser && currentUser.name) {
    const roleTitle = currentUser.title || currentUser.systemRole || 'Authorized User';
    const emailStr = currentUser.email ? ` <${currentUser.email}>` : '';
    return {
      ownerString: `${currentUser.name} (${roleTitle})${emailStr}`,
      name: currentUser.name,
      role: (currentUser.stakeholderLens === 'ALL' ? 'SALES' : currentUser.stakeholderLens) || fallbackRole || 'SALES',
      email: currentUser.email,
      title: roleTitle,
    };
  }

  const name = fallbackName || 'System Administrator';
  const role = fallbackRole || 'ADMIN';
  return {
    ownerString: `${name} (${role})`,
    name,
    role,
  };
}

/**
 * Stage-by-stage Acknowledged Start Date configurations
 */
interface AckDateDef {
  stage: WorkflowStage;
  stageName: string;
  field: string;
  fieldLabel: string;
  getValue: (opp: Opportunity) => string | undefined;
}

export const STAGE_ACK_DATE_DEFS: AckDateDef[] = [
  {
    stage: 'OPPORTUNITY_INTAKE',
    stageName: 'Stage 1: Opportunity Intake',
    field: 'stageEnteredAt',
    fieldLabel: 'Stage 1 Intake Start Date',
    getValue: (opp) => opp.stageEnteredAt || opp.createdAt,
  },
  {
    stage: 'SOLUTION_DESIGN',
    stageName: 'Stage 2: Solution Design & Architecture',
    field: 'solutionProposal.acknowledgedStartDate',
    fieldLabel: 'Stage 2 Solution Design Acknowledged Start Date',
    getValue: (opp) =>
      opp.solutionProposal?.acknowledgedStartDate ||
      opp.solutionProposal?.torReceivedDate ||
      opp.solutionProposal?.stage2TriggerDate,
  },
  {
    stage: 'SALES_PROPOSAL_REVIEW',
    stageName: 'Stage 3: Sales Proposal Review',
    field: 'salesReviewData.acknowledgedStartDate',
    fieldLabel: 'Stage 3 Sales Review Acknowledged Start Date',
    getValue: (opp) => opp.salesReviewData?.acknowledgedStartDate,
  },
  {
    stage: 'CONTRACTS_PROPOSAL_REVIEW',
    stageName: 'Stage 4: Contracts Team Proposal Review',
    field: 'contractsReviewData.acknowledgedStartDate',
    fieldLabel: 'Stage 4 Contracts Review Acknowledged Start Date',
    getValue: (opp) => opp.contractsReviewData?.acknowledgedStartDate,
  },
  {
    stage: 'INITIAL_FINANCE_APPROVAL',
    stageName: 'Stage 5: Initial Finance Approval',
    field: 'initialFinanceReviewData.acknowledgedStartDate',
    fieldLabel: 'Stage 5 Initial Finance Acknowledged Start Date',
    getValue: (opp) => opp.initialFinanceReviewData?.acknowledgedStartDate,
  },
  {
    stage: 'CONTRACTS_PROPOSAL_ENDORSEMENT',
    stageName: 'Stage 6: Contracts Team Proposal Endorsement',
    field: 'contractsEndorsementData.acknowledgedStartDate',
    fieldLabel: 'Stage 6 Contracts Endorsement Acknowledged Start Date',
    getValue: (opp) => opp.contractsEndorsementData?.acknowledgedStartDate,
  },
  {
    stage: 'CLIENT_BUYOFF_NEGOTIATION',
    stageName: 'Stage 7: Client Buyoff & Negotiation',
    field: 'clientNegotiation.acknowledgedStartDate',
    fieldLabel: 'Stage 7 Client Buyoff Acknowledged Start Date',
    getValue: (opp) => opp.clientNegotiation?.acknowledgedStartDate,
  },
  {
    stage: 'CONTRACT_CONVERSION',
    stageName: 'Stage 8: Contract & Agreement Conversion',
    field: 'contractDetails.acknowledgedStartDate',
    fieldLabel: 'Stage 8 Contract Conversion Acknowledged Start Date',
    getValue: (opp) => opp.contractDetails?.acknowledgedStartDate,
  },
  {
    stage: 'FINAL_FINANCE_APPROVAL',
    stageName: 'Stage 9: Final Finance Approval',
    field: 'finalFinanceApproval.acknowledgedStartDate',
    fieldLabel: 'Stage 9 Final Finance Acknowledged Start Date',
    getValue: (opp) =>
      opp.finalFinanceApproval?.acknowledgedStartDate ||
      (opp as any).finalFinanceApprovalData?.acknowledgedStartDate,
  },
  {
    stage: 'DOCUSIGN_CLIENT_ROUTING',
    stageName: 'Stage 10: DocuSign & Client Routing',
    field: 'docusignDetails.acknowledgedStartDate',
    fieldLabel: 'Stage 10 DocuSign Routing Acknowledged Start Date',
    getValue: (opp) => opp.docusignDetails?.acknowledgedStartDate,
  },
  {
    stage: 'WIN_NOTIFICATION',
    stageName: 'Stage 11: WIN Notification Release',
    field: 'winNotification.acknowledgedStartDate',
    fieldLabel: 'Stage 11 WIN Notification Acknowledged Start Date',
    getValue: (opp) => opp.winNotification?.acknowledgedStartDate,
  },
  {
    stage: 'PARALLEL_EXECUTION',
    stageName: 'Stage 12: Parallel Execution (Finance & PMO)',
    field: 'parallelFinance.trackAStartTriggerDate',
    fieldLabel: 'Stage 12 Track A (Finance) Start Trigger Date',
    getValue: (opp) => opp.parallelFinance?.trackAStartTriggerDate,
  },
  {
    stage: 'PARALLEL_EXECUTION',
    stageName: 'Stage 12: Parallel Execution (PMO Delivery)',
    field: 'parallelPmo.kickoffDate',
    fieldLabel: 'Stage 12 Track B (PMO) Project Kickoff / Start Date',
    getValue: (opp) =>
      opp.parallelPmo?.kickoffDate ||
      opp.parallelPmo?.projectStartDate ||
      opp.parallelPmo?.trackBStartTriggerDate,
  },
  {
    stage: 'CWC_DELIVERY',
    stageName: 'Stage 13: Certificate of Work Completion (CWC)',
    field: 'cwcRecord.acknowledgedStartDate',
    fieldLabel: 'Stage 13 CWC Delivery Acknowledged Start Date',
    getValue: (opp) => opp.cwcRecord?.acknowledgedStartDate,
  },
  {
    stage: 'FINANCE_BILLING_ENDORSEMENT',
    stageName: 'Stage 14: Finance Endorsement & Billing',
    field: 'billingRecord.acknowledgedStartDate',
    fieldLabel: 'Stage 14 Billing Endorsement Acknowledged Start Date',
    getValue: (opp) => opp.billingRecord?.acknowledgedStartDate,
  },
  {
    stage: 'DEAL_CLOSED',
    stageName: 'Stage 15: Deal & Project Closed',
    field: 'stageEnteredAt',
    fieldLabel: 'Stage 15 Deal Closed Realization Date',
    getValue: (opp) => opp.stageEnteredAt || opp.updatedAt,
  },
];

/**
 * List of business fields to audit across all workflow stages
 */
interface FieldDef {
  path: string;
  fieldLabel: string;
  getter: (opp: Opportunity) => any;
  format?: (val: any) => string;
}

function formatVal(v: any): string {
  if (v === null || v === undefined || v === '') return 'None';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'number') return v.toLocaleString();
  if (Array.isArray(v)) return v.length === 0 ? 'Empty (0)' : `[${v.length} item(s)]`;
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

export const MONITORED_FIELD_DEFS: FieldDef[] = [
  // Core Opportunity Fields
  { path: 'title', fieldLabel: 'Opportunity Title', getter: (o) => o.title },
  { path: 'clientName', fieldLabel: 'Client Organization', getter: (o) => o.clientName },
  { path: 'clientIndustry', fieldLabel: 'Industry Sector', getter: (o) => o.clientIndustry },
  { path: 'clientContactName', fieldLabel: 'Client Contact Name', getter: (o) => o.clientContactName },
  { path: 'clientContactEmail', fieldLabel: 'Client Contact Email', getter: (o) => o.clientContactEmail },
  {
    path: 'dealValue',
    fieldLabel: 'Deal Value (TCV)',
    getter: (o) => o.dealValue,
    format: (v) => (typeof v === 'number' ? `$${v.toLocaleString()}` : formatVal(v)),
  },
  { path: 'currency', fieldLabel: 'Commercial Currency', getter: (o) => o.currency },
  {
    path: 'probability',
    fieldLabel: 'Win Probability',
    getter: (o) => o.probability,
    format: (v) => (v !== undefined ? `${v}%` : 'None'),
  },
  { path: 'targetCloseDate', fieldLabel: 'Target Close Date', getter: (o) => o.targetCloseDate },
  { path: 'salesLead', fieldLabel: 'Assigned Sales Lead', getter: (o) => o.salesLead },
  { path: 'solutionArchitect', fieldLabel: 'Assigned Solution Architect', getter: (o) => o.solutionArchitect },
  { path: 'buOwner', fieldLabel: 'Business Unit Owner', getter: (o) => o.buOwner },
  { path: 'businessUnit', fieldLabel: 'Business Unit', getter: (o) => o.businessUnit },
  { path: 'division', fieldLabel: 'Corporate Division', getter: (o) => o.division },
  { path: 'servicePillar', fieldLabel: 'Service Pillar', getter: (o) => o.servicePillar },
  { path: 'priority', fieldLabel: 'Deal Priority', getter: (o) => o.priority },
  { path: 'status', fieldLabel: 'Deal Status', getter: (o) => (o as any).status || (o as any).opportunityStatus },
  { path: 'torLink', fieldLabel: 'TOR / Scope Document Link', getter: (o) => o.torLink },
  { path: 'description', fieldLabel: 'Scope & Description', getter: (o) => o.description },

  // Stage 2: Solution Design
  {
    path: 'solutionProposal.ibsiInternalCost',
    fieldLabel: 'Stage 2 Internal Delivery Cost',
    getter: (o) => o.solutionProposal?.ibsiInternalCost,
    format: (v) => (typeof v === 'number' ? `$${v.toLocaleString()}` : formatVal(v)),
  },
  {
    path: 'solutionProposal.pricingCalculatorLink',
    fieldLabel: 'Stage 2 Pricing Calculator Link',
    getter: (o) => o.solutionProposal?.pricingCalculatorLink,
  },
  {
    path: 'solutionProposal.proposalValidityDays',
    fieldLabel: 'Stage 2 Proposal Validity Days',
    getter: (o) => o.solutionProposal?.proposalValidityDays,
  },
  {
    path: 'solutionProposal.estimatedEffortWeeks',
    fieldLabel: 'Stage 2 Estimated Effort (Weeks)',
    getter: (o) => o.solutionProposal?.estimatedEffortWeeks,
  },
  {
    path: 'solutionProposal.vendorProcurement.requiresVendor',
    fieldLabel: 'Stage 2 3rd-Party Vendor Procurement',
    getter: (o) => o.solutionProposal?.vendorProcurement?.requiresVendor,
  },
  {
    path: 'solutionProposal.vendorProcurement.vendorName',
    fieldLabel: 'Stage 2 Vendor Name',
    getter: (o) => o.solutionProposal?.vendorProcurement?.vendorName,
  },
  {
    path: 'solutionProposal.vendorProcurement.vendorQuoteAmount',
    fieldLabel: 'Stage 2 Vendor Quote Amount',
    getter: (o) => o.solutionProposal?.vendorProcurement?.vendorQuoteAmount,
    format: (v) => (typeof v === 'number' ? `$${v.toLocaleString()}` : formatVal(v)),
  },

  // Stage 3: Sales Proposal Review
  {
    path: 'salesReviewData.reviewedBy',
    fieldLabel: 'Stage 3 Sales Reviewer',
    getter: (o) => o.salesReviewData?.reviewedBy,
  },
  {
    path: 'salesReviewData.salesReviewNotes',
    fieldLabel: 'Stage 3 Sales Review Notes',
    getter: (o) => o.salesReviewData?.salesReviewNotes,
  },
  {
    path: 'salesReviewData.stage3TargetSlaDays',
    fieldLabel: 'Stage 3 Target SLA (Days)',
    getter: (o) => o.salesReviewData?.stage3TargetSlaDays,
  },

  // Stage 4: Contracts Proposal Review
  {
    path: 'contractsReviewData.contractsProcessor',
    fieldLabel: 'Stage 4 Contracts Processor',
    getter: (o) => o.contractsReviewData?.contractsProcessor,
  },
  {
    path: 'contractsReviewData.contractType',
    fieldLabel: 'Stage 4 Proposed Contract Type',
    getter: (o) => o.contractsReviewData?.contractType,
  },
  {
    path: 'contractsReviewData.contractsReviewNotes',
    fieldLabel: 'Stage 4 Contracts Review Notes',
    getter: (o) => o.contractsReviewData?.contractsReviewNotes,
  },

  // Stage 5: Initial Finance Approval
  {
    path: 'initialFinanceReviewData.financeProcessor',
    fieldLabel: 'Stage 5 Finance Processor',
    getter: (o) => o.initialFinanceReviewData?.financeProcessor,
  },
  {
    path: 'initialFinanceReviewData.approvedMarginPercent',
    fieldLabel: 'Stage 5 Approved Margin (%)',
    getter: (o) => o.initialFinanceReviewData?.approvedMarginPercent,
    format: (v) => (v !== undefined ? `${v}%` : 'None'),
  },
  {
    path: 'initialFinanceReviewData.financeReviewNotes',
    fieldLabel: 'Stage 5 Finance Review Notes',
    getter: (o) => o.initialFinanceReviewData?.financeReviewNotes,
  },
  {
    path: 'initialFinanceReviewData.approved',
    fieldLabel: 'Stage 5 Margin Clearance Status',
    getter: (o) => o.initialFinanceReviewData?.approved,
  },

  // Stage 6: Contracts Proposal Endorsement
  {
    path: 'contractsEndorsementData.contractsEndorser',
    fieldLabel: 'Stage 6 Contracts Endorser',
    getter: (o) => o.contractsEndorsementData?.contractsEndorser,
  },
  {
    path: 'contractsEndorsementData.approvedProposalLink',
    fieldLabel: 'Stage 6 Approved Proposal Link',
    getter: (o) => o.contractsEndorsementData?.approvedProposalLink,
  },
  {
    path: 'contractsEndorsementData.endorsementNotes',
    fieldLabel: 'Stage 6 Contracts Endorsement Notes',
    getter: (o) => o.contractsEndorsementData?.endorsementNotes,
  },

  // Stage 7: Client Buyoff & Negotiation
  {
    path: 'clientNegotiation.negotiationLead',
    fieldLabel: 'Stage 7 Negotiation Lead',
    getter: (o) => o.clientNegotiation?.negotiationLead,
  },
  {
    path: 'clientNegotiation.presentedDate',
    fieldLabel: 'Stage 7 Proposal Presented Date',
    getter: (o) => o.clientNegotiation?.presentedDate,
  },
  {
    path: 'clientNegotiation.agreedDiscountPercent',
    fieldLabel: 'Stage 7 Agreed Discount (%)',
    getter: (o) => o.clientNegotiation?.agreedDiscountPercent,
    format: (v) => (v !== undefined ? `${v}%` : 'None'),
  },
  {
    path: 'clientNegotiation.finalAgreedValue',
    fieldLabel: 'Stage 7 Final Agreed Deal Value',
    getter: (o) => o.clientNegotiation?.finalAgreedValue,
    format: (v) => (typeof v === 'number' ? `$${v.toLocaleString()}` : formatVal(v)),
  },
  {
    path: 'clientNegotiation.clientConfirmedDate',
    fieldLabel: 'Stage 7 Client Confirmation Date',
    getter: (o) => o.clientNegotiation?.clientConfirmedDate,
  },
  {
    path: 'clientNegotiation.status',
    fieldLabel: 'Stage 7 Negotiation Status',
    getter: (o) => o.clientNegotiation?.status,
  },
  {
    path: 'clientNegotiation.buyoffNotes',
    fieldLabel: 'Stage 7 Buyoff & Feedback Notes',
    getter: (o) => o.clientNegotiation?.buyoffNotes,
  },

  // Stage 8: Contract Conversion
  {
    path: 'contractDetails.contractNumber',
    fieldLabel: 'Stage 8 Contract / Agreement Number',
    getter: (o) => o.contractDetails?.contractNumber,
  },
  {
    path: 'contractDetails.contractType',
    fieldLabel: 'Stage 8 Converted Contract Type',
    getter: (o) => o.contractDetails?.contractType,
  },
  {
    path: 'contractDetails.governingLaw',
    fieldLabel: 'Stage 8 Governing Law',
    getter: (o) => o.contractDetails?.governingLaw,
  },
  {
    path: 'contractDetails.liabilityLimit',
    fieldLabel: 'Stage 8 Liability Limit',
    getter: (o) => o.contractDetails?.liabilityLimit,
  },
  {
    path: 'contractDetails.contractsSpecialist',
    fieldLabel: 'Stage 8 Contracts Specialist',
    getter: (o) => o.contractDetails?.contractsSpecialist,
  },
  {
    path: 'contractDetails.clientContractPriceAmount',
    fieldLabel: 'Stage 8 Contract Price Amount',
    getter: (o) => o.contractDetails?.clientContractPriceAmount,
    format: (v) => (typeof v === 'number' ? `$${v.toLocaleString()}` : formatVal(v)),
  },
  {
    path: 'contractDetails.clientContractLink',
    fieldLabel: 'Stage 8 Client Contract Document Link',
    getter: (o) => o.contractDetails?.clientContractLink,
  },

  // Stage 9: Final Finance Approval
  {
    path: 'finalFinanceApproval.finalTcv',
    fieldLabel: 'Stage 9 Final Binding TCV',
    getter: (o) => o.finalFinanceApproval?.finalTcv,
    format: (v) => (typeof v === 'number' ? `$${v.toLocaleString()}` : formatVal(v)),
  },
  {
    path: 'finalFinanceApproval.approved',
    fieldLabel: 'Stage 9 Final Finance Approval Status',
    getter: (o) => o.finalFinanceApproval?.approved,
  },
  {
    path: 'finalFinanceApproval.approvedBy',
    fieldLabel: 'Stage 9 Finance Approver Authority',
    getter: (o) => o.finalFinanceApproval?.approvedBy,
  },
  {
    path: 'finalFinanceApproval.financeProcessor',
    fieldLabel: 'Stage 9 Finance Processor',
    getter: (o) => o.finalFinanceApproval?.financeProcessor,
  },
  {
    path: 'finalFinanceApproval.comments',
    fieldLabel: 'Stage 9 Finance Approval Comments',
    getter: (o) => o.finalFinanceApproval?.comments,
  },

  // Stage 10: DocuSign & Client Routing
  {
    path: 'docusignDetails.envelopeId',
    fieldLabel: 'Stage 10 DocuSign Envelope ID',
    getter: (o) => o.docusignDetails?.envelopeId,
  },
  {
    path: 'docusignDetails.routingMode',
    fieldLabel: 'Stage 10 Routing Channel Mode',
    getter: (o) => o.docusignDetails?.routingMode,
  },
  {
    path: 'docusignDetails.status',
    fieldLabel: 'Stage 10 Execution Status',
    getter: (o) => o.docusignDetails?.status,
  },
  {
    path: 'docusignDetails.clientSignerName',
    fieldLabel: 'Stage 10 Client Signer Name',
    getter: (o) => o.docusignDetails?.clientSignerName,
  },
  {
    path: 'docusignDetails.clientSignerEmail',
    fieldLabel: 'Stage 10 Client Signer Email',
    getter: (o) => o.docusignDetails?.clientSignerEmail,
  },
  {
    path: 'docusignDetails.sentDate',
    fieldLabel: 'Stage 10 Envelope Dispatch Date',
    getter: (o) => o.docusignDetails?.sentDate,
  },
  {
    path: 'docusignDetails.clientSignedDate',
    fieldLabel: 'Stage 10 Client Signed Date',
    getter: (o) => o.docusignDetails?.clientSignedDate,
  },
  {
    path: 'docusignDetails.isOnHold',
    fieldLabel: 'Stage 10 Execution On-Hold Status',
    getter: (o) => o.docusignDetails?.isOnHold,
  },
  {
    path: 'docusignDetails.onHoldReason',
    fieldLabel: 'Stage 10 Execution On-Hold Reason',
    getter: (o) => o.docusignDetails?.onHoldReason,
  },
  {
    path: 'docusignDetails.clientPoNumber',
    fieldLabel: 'Stage 10 Client PO Number',
    getter: (o) => o.docusignDetails?.clientPoNumber,
  },

  // Stage 11: WIN Notification Release
  {
    path: 'winNotification.isReleased',
    fieldLabel: 'Stage 11 WIN Announcement Released',
    getter: (o) => o.winNotification?.isReleased,
  },
  {
    path: 'winNotification.emailSubject',
    fieldLabel: 'Stage 11 WIN Email Subject',
    getter: (o) => o.winNotification?.emailSubject,
  },

  // Stage 12: Parallel Execution
  {
    path: 'parallelFinance.budgetCode',
    fieldLabel: 'Stage 12 Finance Budget Code',
    getter: (o) => o.parallelFinance?.budgetCode,
  },
  {
    path: 'parallelFinance.contractCode',
    fieldLabel: 'Stage 12 Finance Contract Code',
    getter: (o) => o.parallelFinance?.contractCode,
  },
  {
    path: 'parallelFinance.billingFrequency',
    fieldLabel: 'Stage 12 Billing Frequency',
    getter: (o) => o.parallelFinance?.billingFrequency,
  },
  {
    path: 'parallelFinance.isFinanceCompleted',
    fieldLabel: 'Stage 12 Track A (Finance) Completed',
    getter: (o) => o.parallelFinance?.isFinanceCompleted,
  },
  {
    path: 'parallelPmo.projectManager',
    fieldLabel: 'Stage 12 Assigned Project Manager (PMO)',
    getter: (o) => o.parallelPmo?.projectManager,
  },
  {
    path: 'parallelPmo.progressPercentage',
    fieldLabel: 'Stage 12 PMO Delivery Progress (%)',
    getter: (o) => o.parallelPmo?.progressPercentage,
    format: (v) => (v !== undefined ? `${v}%` : 'None'),
  },
  {
    path: 'parallelPmo.deliveryHealth',
    fieldLabel: 'Stage 12 Delivery Health',
    getter: (o) => o.parallelPmo?.deliveryHealth,
  },
  {
    path: 'parallelPmo.isDeliveryCompleted',
    fieldLabel: 'Stage 12 Track B (PMO) Completed',
    getter: (o) => o.parallelPmo?.isDeliveryCompleted,
  },

  // Stage 13: CWC Delivery
  {
    path: 'cwcRecord.cwcNumber',
    fieldLabel: 'Stage 13 CWC Certificate Number',
    getter: (o) => o.cwcRecord?.cwcNumber,
  },
  {
    path: 'cwcRecord.issuedDate',
    fieldLabel: 'Stage 13 CWC Issued Date',
    getter: (o) => o.cwcRecord?.issuedDate,
  },
  {
    path: 'cwcRecord.clientApproverName',
    fieldLabel: 'Stage 13 Client Signer / Approver',
    getter: (o) => o.cwcRecord?.clientApproverName,
  },
  {
    path: 'cwcRecord.isAcceptedByClient',
    fieldLabel: 'Stage 13 Client Acceptance Confirmed',
    getter: (o) => o.cwcRecord?.isAcceptedByClient,
  },
  {
    path: 'cwcRecord.acceptanceRemarks',
    fieldLabel: 'Stage 13 Client Acceptance Remarks',
    getter: (o) => o.cwcRecord?.acceptanceRemarks,
  },

  // Stage 14: Finance Billing Endorsement
  {
    path: 'billingRecord.invoiceNumber',
    fieldLabel: 'Stage 14 Invoice Number',
    getter: (o) => o.billingRecord?.invoiceNumber,
  },
  {
    path: 'billingRecord.invoiceAmount',
    fieldLabel: 'Stage 14 Invoiced Amount',
    getter: (o) => o.billingRecord?.invoiceAmount,
    format: (v) => (typeof v === 'number' ? `$${v.toLocaleString()}` : formatVal(v)),
  },
  {
    path: 'billingRecord.paymentDueDate',
    fieldLabel: 'Stage 14 Payment Due Date',
    getter: (o) => o.billingRecord?.paymentDueDate,
  },
  {
    path: 'billingRecord.paymentStatus',
    fieldLabel: 'Stage 14 Invoice Payment Status',
    getter: (o) => o.billingRecord?.paymentStatus,
  },
];

/**
 * Compares two opportunity states and returns all detected changes in:
 * 1. Acknowledged start dates across all stages
 * 2. Monitored workflow fields
 */
export function diffOpportunity(
  prev: Opportunity,
  next: Opportunity
): {
  ackDateChanges: AcknowledgedDateChangeEntry[];
  fieldChanges: FieldChangeEntry[];
} {
  const ackDateChanges: AcknowledgedDateChangeEntry[] = [];
  const fieldChanges: FieldChangeEntry[] = [];

  // 1. Check Acknowledged Start Dates across all stages
  for (const def of STAGE_ACK_DATE_DEFS) {
    const prevDate = def.getValue(prev);
    const nextDate = def.getValue(next);

    if (nextDate && nextDate !== prevDate) {
      ackDateChanges.push({
        stage: def.stage,
        stageName: def.stageName,
        field: def.field,
        fieldLabel: def.fieldLabel,
        oldDate: prevDate,
        newDate: nextDate,
      });
    }
  }

  // 2. Check all monitored fields
  for (const fDef of MONITORED_FIELD_DEFS) {
    const prevRaw = fDef.getter(prev);
    const nextRaw = fDef.getter(next);

    // Normalize empty strings and undefined for comparison
    const normPrev = prevRaw === undefined || prevRaw === null ? '' : prevRaw;
    const normNext = nextRaw === undefined || nextRaw === null ? '' : nextRaw;

    if (JSON.stringify(normPrev) !== JSON.stringify(normNext)) {
      const formatFn = fDef.format || formatVal;
      fieldChanges.push({
        field: fDef.path,
        fieldLabel: fDef.fieldLabel,
        oldValue: formatFn(prevRaw),
        newValue: formatFn(nextRaw),
      });
    }
  }

  return { ackDateChanges, fieldChanges };
}

/**
 * Intelligently applies audit logging to an updated opportunity.
 * Ensures:
 * - Acknowledged start date changes in any stage are captured
 * - Field updates are captured with diffs
 * - Owner of the action (User, Title, Role, Email) is attached
 */
export function applyAuditLogToOpportunity(
  prevOpp: Opportunity,
  nextOpp: Opportunity,
  currentUser?: UserProfile | null,
  overrideOptions?: {
    actionLabel?: string;
    customReason?: string;
    actorName?: string;
    actorRole?: StakeholderRole | string;
    actionOwner?: string;
  }
): Opportunity {
  const actorInfo = resolveActionOwner(
    currentUser,
    overrideOptions?.actorRole,
    overrideOptions?.actorName
  );
  const actionOwner = overrideOptions?.actionOwner || actorInfo.ownerString;
  const now = new Date().toISOString();

  const prevHistory = prevOpp.history || [];
  const nextHistory = nextOpp.history || [];

  const { ackDateChanges, fieldChanges } = diffOpportunity(prevOpp, nextOpp);

  // Case A: Caller already added a new history entry explicitly (e.g. stage transition or override)
  if (nextHistory.length > prevHistory.length) {
    const lastIdx = nextHistory.length - 1;
    const existingEntry = nextHistory[lastIdx];

    // Enrich existing entry with actionOwner, fieldChanges, and ackDateChange
    const enrichedEntry: AuditLogEntry = {
      ...existingEntry,
      actorName: existingEntry.actorName || actorInfo.name,
      actorRole: existingEntry.actorRole || actorInfo.role,
      actorEmail: existingEntry.actorEmail || actorInfo.email,
      actorTitle: existingEntry.actorTitle || actorInfo.title,
      actionOwner: existingEntry.actionOwner || actionOwner,
      fieldChanges: existingEntry.fieldChanges || (fieldChanges.length > 0 ? fieldChanges : undefined),
      acknowledgedDateChange:
        existingEntry.acknowledgedDateChange ||
        (ackDateChanges.length > 0 ? ackDateChanges[0] : undefined),
    };

    const updatedHistory = [...nextHistory];
    updatedHistory[lastIdx] = enrichedEntry;

    return {
      ...nextOpp,
      history: updatedHistory,
    };
  }

  // Case B: No new history entry was added, but acknowledge date or fields changed
  if (ackDateChanges.length === 0 && fieldChanges.length === 0) {
    return nextOpp;
  }

  // Handle Acknowledged Start Date Change(s)
  if (ackDateChanges.length > 0) {
    const primaryAck = ackDateChanges[0];
    const stageName = STAGE_MAP[primaryAck.stage]?.label || primaryAck.stageName;

    const ackAuditEntry: AuditLogEntry = {
      id: `audit-ack-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: now,
      stage: primaryAck.stage,
      actorName: actorInfo.name,
      actorRole: actorInfo.role,
      actorEmail: actorInfo.email,
      actorTitle: actorInfo.title,
      actionOwner,
      action: `${stageName}: Acknowledged Start Date Set`,
      comments:
        overrideOptions?.customReason ||
        `SLA Clock Started: ${primaryAck.fieldLabel} set to ${primaryAck.newDate}${
          primaryAck.oldDate ? ` (previously ${primaryAck.oldDate})` : ' (initial acknowledge)'
        }. Owner: ${actionOwner}`,
      isApproval: true,
      dealValue: nextOpp.dealValue,
      currency: nextOpp.currency,
      acknowledgedDateChange: primaryAck,
      fieldChanges: fieldChanges.length > 0 ? fieldChanges : undefined,
      changeType: 'ACKNOWLEDGE_DATE',
    };

    return {
      ...nextOpp,
      history: [...nextHistory, ackAuditEntry],
    };
  }

  // Handle General Field Update(s)
  if (fieldChanges.length > 0) {
    const stageDef = STAGE_MAP[nextOpp.currentStage];
    const stageLabel = stageDef ? `Stage ${stageDef.index}: ${stageDef.shortLabel}` : nextOpp.currentStage;

    const changeSummary = fieldChanges
      .slice(0, 3)
      .map((f) => `${f.fieldLabel} (${f.oldValue} ➔ ${f.newValue})`)
      .join(', ');
    const moreCount = fieldChanges.length > 3 ? ` and ${fieldChanges.length - 3} more` : '';

    // Check if the last history entry was ALSO a recent field update (within 4 seconds) by same owner
    if (nextHistory.length > 0) {
      const lastEntry = nextHistory[nextHistory.length - 1];
      const timeDiffMs = new Date(now).getTime() - new Date(lastEntry.timestamp).getTime();

      if (
        lastEntry.changeType === 'FIELD_UPDATE' &&
        lastEntry.actionOwner === actionOwner &&
        lastEntry.stage === nextOpp.currentStage &&
        timeDiffMs < 4000
      ) {
        // Merge field changes cleanly
        const existingFieldMap = new Map<string, FieldChangeEntry>();
        (lastEntry.fieldChanges || []).forEach((f) => existingFieldMap.set(f.field, f));

        fieldChanges.forEach((f) => {
          const prevItem = existingFieldMap.get(f.field);
          if (prevItem) {
            existingFieldMap.set(f.field, {
              ...prevItem,
              newValue: f.newValue,
            });
          } else {
            existingFieldMap.set(f.field, f);
          }
        });

        const mergedFields = Array.from(existingFieldMap.values());
        const updatedEntry: AuditLogEntry = {
          ...lastEntry,
          timestamp: now,
          action: `${stageLabel}: Field Updates (${mergedFields.length} field${mergedFields.length > 1 ? 's' : ''})`,
          comments: `Fields updated: ${mergedFields.slice(0, 3).map((f) => f.fieldLabel).join(', ')}${
            mergedFields.length > 3 ? ` +${mergedFields.length - 3} more` : ''
          }. Action Owner: ${actionOwner}`,
          fieldChanges: mergedFields,
          dealValue: nextOpp.dealValue,
          currency: nextOpp.currency,
        };

        const updatedHistory = [...nextHistory];
        updatedHistory[updatedHistory.length - 1] = updatedEntry;

        return {
          ...nextOpp,
          history: updatedHistory,
        };
      }
    }

    // Create a new Field Update Audit Entry
    const fieldAuditEntry: AuditLogEntry = {
      id: `audit-field-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: now,
      stage: nextOpp.currentStage,
      actorName: actorInfo.name,
      actorRole: actorInfo.role,
      actorEmail: actorInfo.email,
      actorTitle: actorInfo.title,
      actionOwner,
      action: `${stageLabel}: Field Updates (${fieldChanges.length} field${fieldChanges.length > 1 ? 's' : ''})`,
      comments:
        overrideOptions?.customReason ||
        `Modified: ${changeSummary}${moreCount}. Action Owner: ${actionOwner}`,
      dealValue: nextOpp.dealValue,
      currency: nextOpp.currency,
      fieldChanges,
      changeType: 'FIELD_UPDATE',
    };

    return {
      ...nextOpp,
      history: [...nextHistory, fieldAuditEntry],
    };
  }

  return nextOpp;
}
