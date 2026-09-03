export type WorkflowStage =
  | 'OPPORTUNITY_INTAKE'
  | 'SOLUTION_DESIGN'
  | 'SALES_PROPOSAL_REVIEW'
  | 'CONTRACTS_PROPOSAL_REVIEW'
  | 'INITIAL_FINANCE_APPROVAL'
  | 'CONTRACTS_PROPOSAL_ENDORSEMENT'
  | 'CLIENT_BUYOFF_NEGOTIATION'
  | 'CONTRACT_CONVERSION'
  | 'FINAL_FINANCE_APPROVAL'
  | 'DOCUSIGN_CLIENT_ROUTING'
  | 'WIN_NOTIFICATION'
  | 'PARALLEL_EXECUTION'
  | 'CWC_DELIVERY'
  | 'FINANCE_BILLING_ENDORSEMENT'
  | 'DEAL_CLOSED';

export type StakeholderRole =
  | 'ALL'
  | 'SALES'
  | 'ARCHITECTURE'
  | 'CONTRACTS'
  | 'FINANCE'
  | 'PMO';

export interface StageDefinition {
  id: WorkflowStage;
  index: number;
  label: string;
  shortLabel: string;
  description: string;
  primaryActor: StakeholderRole;
  actorLabel: string;
  targetSlaDays: number;
  warningThresholdPercentage?: number;
  escalationNotes?: string;
  color: string;
}

export interface VendorProcurement {
  requiresVendor: boolean;
  vendorName?: string;
  vendorCategory?: string;
  vendorProposalLink?: string;
  vendorQuoteCurrency?: string;
  prNumber?: string;
  prStatus?: 'NOT_CREATED' | 'PR_SUBMITTED' | 'PR_APPROVED' | 'PR_REJECTED';
  poNumber?: string;
  poStatus?: 'NOT_ISSUED' | 'PO_ISSUED' | 'PO_ACCEPTED';
  vendorQuoteAmount?: number;
  invoiceNumber?: string;
  invoiceStatus?: 'PENDING' | 'RECEIVED' | 'VERIFIED' | 'PAID';
  notes?: string;
}

export interface SolutionProposal {
  solutionDocName?: string;
  solutionDocUrl?: string;
  clientProposalLink?: string;
  pricingCalculatorLink?: string;
  proposalValidityStartDate?: string;
  proposalValidityEndDate?: string;
  proposalValidityDays?: number;
  stage2TriggerDate?: string;
  torReceivedDate?: string;
  slaTriggerToTorDays?: number;
  solutionArchitect?: string;
  buOwner?: string;
  ibsiInternalCost?: number;
  ibsiInternalCurrency?: string;
  architectureSummary?: string;
  deliverables?: string[];
  techStack?: string[];
  estimatedEffortWeeks?: number;
  estimatedDeliveryCost?: number;
  vendorProcurement: VendorProcurement;
  solutionArchitectNotes?: string;
  completedAt?: string;
}

export interface SalesReviewData {
  stage3TriggerDate?: string;
  acknowledgedStartDate?: string;
  slaTriggerToAckDays?: number;
  stage3TargetSlaDays?: number;
  salesReviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface ContractsReviewData {
  stage4TriggerDate?: string;
  acknowledgedStartDate?: string;
  slaTriggerToAckDays?: number;
  stage4TargetSlaDays?: number;
  contractsProcessor?: string;
  contractType?: string;
  contractsReviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface InitialFinanceReviewData {
  stage5TriggerDate?: string;
  acknowledgedStartDate?: string;
  slaTriggerToAckDays?: number;
  stage5TargetSlaDays?: number;
  financeProcessor?: string;
  financeReviewNotes?: string;
  approved?: boolean;
  approvedBy?: string;
  approvedAt?: string;
  approvedMarginPercent?: number;
  comments?: string;
}

export interface ContractsEndorsementData {
  stage6TriggerDate?: string;
  acknowledgedStartDate?: string;
  slaTriggerToAckDays?: number;
  stage6TargetSlaDays?: number;
  contractsEndorser?: string;
  targetSalesLead?: string;
  endorsementNotes?: string;
  endorsedAt?: string;
  endorsedBy?: string;
  approvedProposalLink?: string;
  commercialGuidanceNotes?: string;
}

export interface ClientNegotiationData {
  stage7TriggerDate?: string;
  acknowledgedStartDate?: string;
  slaTriggerToAckDays?: number;
  stage7TargetSlaDays?: number;
  negotiationLead?: string;
  presentedDate?: string;
  clientFeedback?: string;
  agreedDiscountPercent?: number;
  finalAgreedValue?: number;
  clientConfirmedDate?: string;
  status: 'IN_NEGOTIATION' | 'CLIENT_CONFIRMED' | 'REJECTED';
  buyoffNotes?: string;
  returnReason?: string;
}

export interface ContractDetails {
  stage8TriggerDate?: string;
  acknowledgedStartDate?: string;
  slaTriggerToAckDays?: number;
  stage8TargetSlaDays?: number;
  contractsSpecialist?: string;
  contractType?: string;
  contractNumber?: string;
  governingLaw?: string;
  liabilityLimit?: string;
  paymentMilestones?: {
    id: string;
    name: string;
    percentage: number;
    amount: number;
    trigger: string;
  }[];
  convertedAt?: string;
  contractsSpecialistNotes?: string;
  returnReason?: string;
  // Converted Proposal to Contract uploads & pricing
  clientContractLink?: string;
  clientContractFileName?: string;
  clientContractPricingCalculatorLink?: string;
  clientContractPricingCalculatorFileName?: string;
  clientContractPriceCurrency?: string;
  clientContractPriceAmount?: number;
  clientProposalPriceUpdated?: boolean;
  uploadedAt?: string;
}

export interface FinalFinanceApprovalData {
  approved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  finalTcv?: number;
  finalCurrency?: string;
  comments?: string;
  stage9TriggerDate?: string;
  acknowledgedStartDate?: string;
  slaTriggerToAckDays?: number;
  stage9TargetSlaDays?: number;
  financeProcessor?: string;
  returnReason?: string;
  enableContractUpdates?: boolean;
}

export interface DocuSignOnHoldEntry {
  id: string;
  pausedAt: string;
  resumedAt?: string;
  reason: string;
  pausedBy?: string;
}

export interface DocuSignDetails {
  envelopeId?: string;
  routingMode: 'DOCUSIGN' | 'CLIENT_COORDINATION';
  status: 'DRAFT' | 'SENT' | 'VIEWED' | 'CLIENT_SIGNED' | 'COUNTERSIGNED' | 'COMPLETED' | 'ON_HOLD';
  sentDate?: string;
  clientSignerName?: string;
  clientSignerEmail?: string;
  clientSignedDate?: string;
  internalSignerName?: string;
  internalSignedDate?: string;
  docusignCertificateRef?: string;

  // Stage 10 Governance & SLA Tracking
  stage10TriggerDate?: string;
  stage9TriggerDate?: string; // Support trigger date reference
  acknowledgedStartDate?: string;
  slaTriggerToAckDays?: number;
  stage10TargetSlaDays?: number;
  contractsSpecialist?: string;
  salesAssigned?: string;

  // Scenario 1: Contracts Team Routing
  routingBy?: 'CONTRACTS' | 'CLIENT';
  contractsRoutingChannel?: 'DOCUSIGN' | 'EMAIL';
  emailDispatchDate?: string;
  emailRecipient?: string;
  emailSubject?: string;
  emailTrackingRef?: string;
  contractDocumentLink?: string;

  // On Hold & Pause SLA Tracking
  isOnHold?: boolean;
  onHoldReason?: string;
  onHoldDate?: string;
  onHoldHistory?: DocuSignOnHoldEntry[];
  pausedDaysTotal?: number;

  // Scenario 2: Client Routed (Sales Coordinated)
  clientDispatchDate?: string;
  clientExecutionTargetDate?: string;
  clientReturnedDate?: string;
  signedContractPoLink?: string;
  signedContractPoFileName?: string;
  clientPoNumber?: string;
  salesRoutingNotes?: string;
  salesActionTaken?: boolean;
}

export interface WinNotification {
  isReleased: boolean;
  releasedAt?: string;
  releasedBy?: string;
  emailSubject?: string;
  emailBody?: string;
  recipients?: string[];

  // Stage 11 Governance & SLA Tracking
  stage11TriggerDate?: string;
  acknowledgedStartDate?: string;
  slaTriggerToAckDays?: number;
  stage11TargetSlaDays?: number;
  contractsSpecialist?: string;
}

export interface ParallelFinanceData {
  budgetCode?: string;
  contractCode?: string;
  tcv?: number;
  contractStartDate?: string;
  contractEndDate?: string;
  billingFrequency?: 'MILESTONE' | 'MONTHLY' | 'UPFRONT_50_50' | 'COMPLETION';
  financeOfficer?: string;
  isConfigured: boolean;
}

export interface DeliveryMilestone {
  id: string;
  title: string;
  targetDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  completionDate?: string;
}

export interface ParallelPmoData {
  projectManager?: string;
  buHead?: string;
  kickoffDate?: string;
  currentMilestone?: string;
  progressPercentage: number;
  deliveryHealth: 'ON_TRACK' | 'AT_RISK' | 'DELAYED';
  milestones: DeliveryMilestone[];
  deliveryNotes?: string;
  isKickoffCompleted: boolean;
}

export interface CwcRecord {
  cwcNumber?: string;
  issuedDate?: string;
  pmoLeadSigner?: string;
  clientApproverName?: string;
  acceptanceRemarks?: string;
  isAcceptedByClient: boolean;
  documentRef?: string;
}

export interface BillingRecord {
  invoiceNumber?: string;
  invoiceAmount?: number;
  taxAmount?: number;
  totalAmount?: number;
  invoiceDate?: string;
  paymentDueDate?: string;
  paymentStatus: 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
  endorsementNotes?: string;
  confirmedByFinanceDate?: string;
}

export interface FinanceAuditEntry {
  id: string;
  timestamp: string;
  stage: WorkflowStage;
  stageName?: string;
  eventType:
    | 'SALES_FORECAST'
    | 'PROPOSED_TCV'
    | 'SALES_ENDORSEMENT'
    | 'CONTRACTS_REVIEW'
    | 'INITIAL_FINANCE_APPROVAL'
    | 'CLIENT_NEGOTIATION'
    | 'CONTRACT_CONVERSION'
    | 'FINAL_FINANCE_APPROVAL'
    | 'STAGE_RETURN'
    | 'ADMIN_OVERRIDE'
    | 'VALUE_UPDATE';
  actorName: string;
  actorRole: StakeholderRole | string;
  actionLabel: string;
  amount: number;
  previousAmount?: number;
  variance?: number; // amount - previousAmount
  variancePercent?: number;
  currency: string;
  internalCost?: number;
  internalCurrency?: string;
  marginPercent?: number;
  notes?: string;
  isReturn?: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  stage: WorkflowStage;
  actorName: string;
  actorRole: StakeholderRole;
  action: string;
  comments?: string;
  isApproval?: boolean;
  isReturn?: boolean;
  dealValue?: number;
  previousDealValue?: number;
  internalCost?: number;
  marginPercent?: number;
  currency?: string;
  variance?: number;
}

export interface Opportunity {
  id: string;
  trackingCode: string;
  title: string;
  clientName: string;
  clientIndustry: string;
  clientContactName: string;
  clientContactEmail: string;
  dealValue: number;
  currency: string;
  probability: number;
  targetCloseDate: string;
  salesLead: string;
  solutionArchitect?: string;
  buOwner?: string;
  division?: string;
  businessUnit: 'CLOUD_INFRA' | 'DIGITAL_APP' | 'ENTERPRISE_AI' | 'MANAGED_SERVICES' | 'CYBERSECURITY' | string;
  servicePillar?: 'Workplace' | 'Infrastructure' | 'Network' | string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
  status?: string; // 'Active' | 'On Hold' | 'Budgetary' | 'Won' | 'Lost' | 'Cancelled'
  description: string;
  torLink?: string; // Terms of Reference link / scope document
  currentStage: WorkflowStage;
  stageEnteredAt: string;
  createdAt: string;
  updatedAt: string;
  
  // Stages Data
  solutionProposal: SolutionProposal;
  salesReviewData?: SalesReviewData;
  salesReviewNotes?: string;
  contractsReviewData?: ContractsReviewData;
  contractsProcessor?: string;
  contractType?: string;
  contractsReviewNotes?: string;
  financeProcessor?: string;
  initialFinanceReviewData?: InitialFinanceReviewData;
  initialFinanceApproval?: {
    approved: boolean;
    approvedBy?: string;
    approvedAt?: string;
    approvedMarginPercent?: number;
    comments?: string;
  };
  contractsEndorsementData?: ContractsEndorsementData;
  contractsEndorsementNotes?: string;
  clientNegotiation?: ClientNegotiationData;
  contractDetails: ContractDetails;
  finalFinanceApproval?: FinalFinanceApprovalData;
  docusignDetails: DocuSignDetails;
  winNotification: WinNotification;
  parallelFinance: ParallelFinanceData;
  parallelPmo: ParallelPmoData;
  cwcRecord: CwcRecord;
  billingRecord: BillingRecord;
  
  // History & Audit
  history: AuditLogEntry[];
  financeAuditTrail?: FinanceAuditEntry[];
}

export interface ClientOrganization {
  id: string;
  name: string;
  abbreviation: string;
  industry: string;
  clientProfile?: 'Internal' | 'External' | string;
  primaryContactName: string;
  contactEmail: string;
  contactPhone?: string;
  remarks?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ResourceMember {
  id: string;
  name: string;
  role: string;
  division?: string;
  department: string; // Business Unit
  email: string;
  contactNumber?: string;
  remarks?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface FormOptionItem {
  id: string;
  label: string;
  value: string;
  description?: string;
  color?: string;
  isDefault?: boolean;
  isActive?: boolean;
  order?: number;
  metadata?: Record<string, any>;
}

export type FormSelectorCategoryKey =
  | 'industry'
  | 'department'
  | 'division'
  | 'servicePillar'
  | 'role'
  | 'priority'
  | 'opportunityStatus'
  | 'clientProfile'
  | 'contractType';

export interface FormSelectorsConfig {
  industries: FormOptionItem[];
  departments: FormOptionItem[]; // Business Units
  divisions: FormOptionItem[];   // Divisions
  servicePillars: FormOptionItem[]; // Service Pillars (Workplace, Infrastructure, Network)
  roles: FormOptionItem[];
  priorities: FormOptionItem[];
  opportunityStatuses: FormOptionItem[];
  clientProfiles: FormOptionItem[];
  contractTypes: FormOptionItem[];
}

export interface FinanceApprovalTier {
  id: string;
  name: string;
  currency?: string;
  minCurrency?: string;
  maxCurrency?: string;
  minAmount: number;
  maxAmount: number | null; // null represents unbounded (e.g. > $1M)
  requiredApproversCount: number;
  designatedApprovers: string[]; // Names/Emails of approvers from Resources
  applicableStages: ('INITIAL_FINANCE_APPROVAL' | 'FINAL_FINANCE_APPROVAL' | 'BOTH')[];
  description?: string;
  requiresCfoSignoff?: boolean;
  isActive?: boolean;
}

export interface FinanceAdminConfig {
  tiers: FinanceApprovalTier[];
  defaultAckSlaDays: number;
  defaultReviewSlaDays: number;
  marginBenchmarkPercent: number;
  strictThresholdEnforcement: boolean;
}

