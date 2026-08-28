import { StageDefinition, WorkflowStage } from '../types';

export const WORKFLOW_STAGES: StageDefinition[] = [
  {
    id: 'OPPORTUNITY_INTAKE',
    index: 1,
    label: '1. Opportunity Intake',
    shortLabel: 'Sales Intake',
    description: 'Opportunity created and qualified by Sales Executive. Scope, target value, and client needs captured.',
    primaryActor: 'SALES',
    actorLabel: 'Sales Executive',
    targetSlaDays: 2,
    color: 'emerald',
  },
  {
    id: 'SOLUTION_DESIGN',
    index: 2,
    label: '2. Solution Design & Architecture',
    shortLabel: 'Solution Design',
    description: 'Solution Architects & BU Heads design technical architecture, deliverables, and optional Vendor PR/PO procurement.',
    primaryActor: 'ARCHITECTURE',
    actorLabel: 'Solution Architect / BU Head',
    targetSlaDays: 5,
    color: 'blue',
  },
  {
    id: 'SALES_PROPOSAL_REVIEW',
    index: 3,
    label: '3. Sales Proposal Review',
    shortLabel: 'Sales Review',
    description: 'Solution Document & technical proposal released to Sales for review and commercial alignment.',
    primaryActor: 'SALES',
    actorLabel: 'Sales Executive',
    targetSlaDays: 2,
    color: 'indigo',
  },
  {
    id: 'CONTRACTS_PROPOSAL_REVIEW',
    index: 4,
    label: '4. Contracts Team Proposal Review & Record',
    shortLabel: 'Contracts Team Review',
    description: 'Sales submits proposal to Contracts team. Legal & Contracts review, record, and endorse proposal.',
    primaryActor: 'CONTRACTS',
    actorLabel: 'Contracts Team',
    targetSlaDays: 3,
    color: 'amber',
  },
  {
    id: 'INITIAL_FINANCE_APPROVAL',
    index: 5,
    label: '5. Initial Finance Approval',
    shortLabel: 'Initial Finance',
    description: 'Finance review of estimated margins, direct costs, vendor expenditure, and commercial terms.',
    primaryActor: 'FINANCE',
    actorLabel: 'Finance / Deal Desk',
    targetSlaDays: 2,
    color: 'purple',
  },
  {
    id: 'CONTRACTS_PROPOSAL_ENDORSEMENT',
    index: 6,
    label: '6. Contracts Team Proposal Endorsement',
    shortLabel: 'Contracts Endorsement',
    description: 'Contracts team endorsing the finance approved Proposal to Sales team for Buyoff.',
    primaryActor: 'CONTRACTS',
    actorLabel: 'Contracts Team',
    targetSlaDays: 2,
    color: 'amber',
  },
  {
    id: 'CLIENT_BUYOFF_NEGOTIATION',
    index: 7,
    label: '7. Client Buyoff & Negotiation',
    shortLabel: 'Client Buyoff',
    description: 'Sales presents proposal to client, negotiates commercial terms, and secures client confirmation.',
    primaryActor: 'SALES',
    actorLabel: 'Sales Executive',
    targetSlaDays: 7,
    color: 'sky',
  },
  {
    id: 'CONTRACT_CONVERSION',
    index: 8,
    label: '8. Contract & Agreement Conversion',
    shortLabel: 'Contract Conversion',
    description: 'Contracts team converts confirmed proposal into Master Services Agreement (MSA), SOW, or SLA.',
    primaryActor: 'CONTRACTS',
    actorLabel: 'Contracts Team',
    targetSlaDays: 4,
    color: 'teal',
  },
  {
    id: 'FINAL_FINANCE_APPROVAL',
    index: 9,
    label: '9. Final Finance Approval',
    shortLabel: 'Final Finance',
    description: 'Contracts team triggers final Finance approval on binding TCV, payment milestones, and billing clauses.',
    primaryActor: 'FINANCE',
    actorLabel: 'Finance Director / CFO Desk',
    targetSlaDays: 2,
    color: 'violet',
  },
  {
    id: 'DOCUSIGN_CLIENT_ROUTING',
    index: 10,
    label: '10. DocuSign & Client Routing',
    shortLabel: 'DocuSign / Signing',
    description: 'Contract routed via DocuSign digital envelope or coordinated by Sales with client for countersignature.',
    primaryActor: 'CONTRACTS',
    actorLabel: 'Contracts & Sales',
    targetSlaDays: 4,
    color: 'rose',
  },
  {
    id: 'WIN_NOTIFICATION',
    index: 11,
    label: '11. WIN Notification Release',
    shortLabel: 'WIN Broadcast',
    description: 'Contracts team releases official WIN notification announcement email to leadership and company.',
    primaryActor: 'CONTRACTS',
    actorLabel: 'Contracts Team',
    targetSlaDays: 1,
    color: 'amber',
  },
  {
    id: 'PARALLEL_EXECUTION',
    index: 12,
    label: '12. Parallel Execution (Finance & PMO)',
    shortLabel: 'Parallel Delivery',
    description: 'Finance assigns Budget Code, Contract Code & TCV; PMO kicks off project delivery & milestone tracking.',
    primaryActor: 'PMO',
    actorLabel: 'Finance & PMO / BU',
    targetSlaDays: 30,
    color: 'cyan',
  },
  {
    id: 'CWC_DELIVERY',
    index: 13,
    label: '13. Certificate of Work Completion (CWC)',
    shortLabel: 'CWC Signoff',
    description: 'PMO / BU issues Certificate of Work Completion and secures client milestone acceptance sign-off.',
    primaryActor: 'PMO',
    actorLabel: 'PMO / BU Delivery Head',
    targetSlaDays: 3,
    color: 'teal',
  },
  {
    id: 'FINANCE_BILLING_ENDORSEMENT',
    index: 14,
    label: '14. Finance Endorsement & Billing',
    shortLabel: 'Billing & Invoicing',
    description: 'Endorse signed CWC to Finance to issue formal invoice, record accounts receivable, and collect payment.',
    primaryActor: 'FINANCE',
    actorLabel: 'Finance / Billing Team',
    targetSlaDays: 5,
    color: 'emerald',
  },
  {
    id: 'DEAL_CLOSED',
    index: 15,
    label: '15. Deal & Project Closed',
    shortLabel: 'Closed / Realized',
    description: 'Full revenue collected, project archived, post-delivery realization completed.',
    primaryActor: 'ALL',
    actorLabel: 'All Stakeholders',
    targetSlaDays: 0,
    color: 'slate',
  },
];

export const STAGE_MAP: Record<WorkflowStage, StageDefinition> = WORKFLOW_STAGES.reduce(
  (acc, stage) => {
    acc[stage.id] = stage;
    return acc;
  },
  {} as Record<WorkflowStage, StageDefinition>
);

export const BU_LABELS: Record<string, string> = {
  CLOUD_INFRA: 'Cloud & Infrastructure',
  DIGITAL_APP: 'Digital & Enterprise Apps',
  ENTERPRISE_AI: 'Enterprise AI & Data Solutions',
  MANAGED_SERVICES: 'Managed Services & Security',
  CYBERSECURITY: 'Cybersecurity & Governance',
};

/**
 * Ensures stage definitions array always contains all 15 stages with exact indexes and phase groupings.
 */
export function ensureValid15Stages(savedStages?: any[]): StageDefinition[] {
  if (!Array.isArray(savedStages) || savedStages.length === 0) {
    return WORKFLOW_STAGES;
  }
  const savedMap = new Map<string, any>();
  savedStages.forEach((s) => {
    if (s && s.id) savedMap.set(s.id, s);
  });

  return WORKFLOW_STAGES.map((stdStage) => {
    const saved = savedMap.get(stdStage.id);
    if (saved) {
      return {
        ...stdStage,
        targetSlaDays: typeof saved.targetSlaDays === 'number' ? saved.targetSlaDays : stdStage.targetSlaDays,
        warningThresholdPercentage: typeof saved.warningThresholdPercentage === 'number' ? saved.warningThresholdPercentage : stdStage.warningThresholdPercentage,
        escalationNotes: typeof saved.escalationNotes === 'string' ? saved.escalationNotes : stdStage.escalationNotes,
      };
    }
    return stdStage;
  });
}

