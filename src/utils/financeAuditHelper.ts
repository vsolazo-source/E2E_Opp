import { Opportunity, FinanceAuditEntry, WorkflowStage } from '../types';
import { STAGE_MAP } from '../data/stages';
import { formatCurrency } from './formatters';

export function getStageName(stage: WorkflowStage): string {
  const def = STAGE_MAP[stage];
  return def ? `Stage ${def.index}: ${def.label}` : stage;
}

/**
 * Builds a comprehensive chronological Finance Audit Trail for an opportunity,
 * tracking forecast amounts, proposed TCVs, approvals, negotiations, updates, and returns.
 */
export function buildFinanceAuditTrail(opp: Opportunity): FinanceAuditEntry[] {
  const entries: FinanceAuditEntry[] = [];
  const currency = opp.currency || 'USD';

  // 1. If the opportunity has explicit financeAuditTrail entries, start with them
  if (opp.financeAuditTrail && opp.financeAuditTrail.length > 0) {
    opp.financeAuditTrail.forEach((e) => {
      entries.push({
        ...e,
        stageName: e.stageName || getStageName(e.stage),
      });
    });
  }

  // 2. Scan opportunity.history for any financial actions, stage advancements, returns, or overrides
  if (opp.history && opp.history.length > 0) {
    opp.history.forEach((h, index) => {
      const isReturn =
        h.isReturn === true ||
        /return|revert|rejected|send back/i.test(h.action) ||
        /returned to/i.test(h.comments || '');

      const isOverride =
        /override|admin|manual/i.test(h.action) ||
        /override/i.test(h.comments || '');

      const isFinanceRelevant =
        isReturn ||
        isOverride ||
        h.dealValue !== undefined ||
        h.marginPercent !== undefined ||
        /intake|create|solution|proposal|review|approval|finance|negotiation|buyoff|contract|sign-off|discount|lock|tcv/i.test(
          h.action
        ) ||
        /deal|value|tcv|margin|discount|\$|₱|€|£/i.test(h.comments || '');

      // Check if we already have an entry with this ID or identical timestamp + action
      const exists = entries.some(
        (e) => e.id === h.id || (e.timestamp === h.timestamp && e.actionLabel === h.action)
      );

      if (!exists && isFinanceRelevant) {
        // Derive event type
        let eventType: FinanceAuditEntry['eventType'] = 'VALUE_UPDATE';
        if (isReturn) {
          eventType = 'STAGE_RETURN';
        } else if (isOverride) {
          eventType = 'ADMIN_OVERRIDE';
        } else if (h.stage === 'OPPORTUNITY_INTAKE') {
          eventType = 'SALES_FORECAST';
        } else if (h.stage === 'SOLUTION_DESIGN') {
          eventType = 'PROPOSED_TCV';
        } else if (h.stage === 'SALES_PROPOSAL_REVIEW') {
          eventType = 'SALES_ENDORSEMENT';
        } else if (h.stage === 'CONTRACTS_PROPOSAL_REVIEW') {
          eventType = 'CONTRACTS_REVIEW';
        } else if (h.stage === 'INITIAL_FINANCE_APPROVAL') {
          eventType = 'INITIAL_FINANCE_APPROVAL';
        } else if (h.stage === 'CLIENT_BUYOFF_NEGOTIATION') {
          eventType = 'CLIENT_NEGOTIATION';
        } else if (h.stage === 'CONTRACT_CONVERSION') {
          eventType = 'CONTRACT_CONVERSION';
        } else if (h.stage === 'FINAL_FINANCE_APPROVAL') {
          eventType = 'FINAL_FINANCE_APPROVAL';
        }

        // Amount estimation from history or opportunity stage records
        let entryAmount = h.dealValue ?? opp.dealValue;
        if (h.stage === 'CLIENT_BUYOFF_NEGOTIATION' && opp.clientNegotiation?.finalAgreedValue) {
          entryAmount = opp.clientNegotiation.finalAgreedValue;
        } else if (h.stage === 'FINAL_FINANCE_APPROVAL' && opp.finalFinanceApproval?.finalTcv) {
          entryAmount = opp.finalFinanceApproval.finalTcv;
        }

        entries.push({
          id: h.id || `hist-${index}-${Date.now()}`,
          timestamp: h.timestamp,
          stage: h.stage,
          stageName: getStageName(h.stage),
          eventType,
          actorName: h.actorName || 'Stakeholder',
          actorRole: h.actorRole || 'SALES',
          actionLabel: h.action,
          amount: entryAmount,
          currency: h.currency || currency,
          internalCost: h.internalCost ?? (h.stage === 'SOLUTION_DESIGN' ? opp.solutionProposal?.ibsiInternalCost : undefined),
          internalCurrency: opp.solutionProposal?.ibsiInternalCurrency || currency,
          marginPercent: h.marginPercent,
          notes: h.comments,
          isReturn,
        });
      }
    });
  }

  // 3. Ensure baseline Stage 1 (Sales Forecast) is always present if no intake entry
  const hasStage1 = entries.some(
    (e) => e.stage === 'OPPORTUNITY_INTAKE' || e.eventType === 'SALES_FORECAST'
  );
  if (!hasStage1) {
    entries.unshift({
      id: `intake-${opp.id}`,
      timestamp: opp.createdAt || new Date().toISOString(),
      stage: 'OPPORTUNITY_INTAKE',
      stageName: getStageName('OPPORTUNITY_INTAKE'),
      eventType: 'SALES_FORECAST',
      actorName: opp.salesLead || 'Sales Lead',
      actorRole: 'SALES',
      actionLabel: 'Opportunity Created & Initial Sales Forecast Logged',
      amount: opp.dealValue || 0,
      currency,
      notes: `Initial qualified sales pipeline value. Industry: ${opp.clientIndustry || 'Standard'}. Probability: ${opp.probability || 0}%.`,
    });
  }

  // 4. Ensure Stage 2 (Solution Proposal) is represented if proposal exists
  if (opp.solutionProposal) {
    const hasStage2 = entries.some(
      (e) => e.stage === 'SOLUTION_DESIGN' || e.eventType === 'PROPOSED_TCV'
    );
    if (!hasStage2 && (opp.solutionProposal.solutionDocName || opp.solutionProposal.ibsiInternalCost || opp.solutionProposal.solutionArchitect || opp.currentStage !== 'OPPORTUNITY_INTAKE')) {
      const propCost = opp.solutionProposal.ibsiInternalCost || 0;
      const tcv = opp.dealValue || 0;
      const margin = tcv > 0 ? ((tcv - propCost) / tcv) * 100 : undefined;

      entries.push({
        id: `sol-${opp.id}`,
        timestamp: opp.solutionProposal.completedAt || opp.solutionProposal.stage2TriggerDate || opp.updatedAt || opp.createdAt,
        stage: 'SOLUTION_DESIGN',
        stageName: getStageName('SOLUTION_DESIGN'),
        eventType: 'PROPOSED_TCV',
        actorName: opp.solutionProposal.solutionArchitect || opp.solutionArchitect || opp.buOwner || 'Solution Architect',
        actorRole: 'ARCHITECTURE',
        actionLabel: 'Solution Proposal Generated & Architecture Costing',
        amount: tcv,
        currency,
        internalCost: propCost,
        internalCurrency: opp.solutionProposal.ibsiInternalCurrency || currency,
        marginPercent: margin,
        notes: `Architecture deliverable defined (${opp.solutionProposal.deliverables?.join(', ') || 'Custom solution'}). Estimated effort: ${opp.solutionProposal.estimatedEffortWeeks || 'TBD'} weeks.`,
      });
    }
  }

  // 5. Check if Stage 5 (Initial Finance Approval) snapshot exists
  if (opp.initialFinanceApproval?.approved || opp.initialFinanceReviewData?.approved) {
    const hasStage5 = entries.some(
      (e) => e.stage === 'INITIAL_FINANCE_APPROVAL' || e.eventType === 'INITIAL_FINANCE_APPROVAL'
    );
    if (!hasStage5) {
      entries.push({
        id: `fin-init-${opp.id}`,
        timestamp: opp.initialFinanceApproval?.approvedAt || opp.initialFinanceReviewData?.approvedAt || opp.updatedAt,
        stage: 'INITIAL_FINANCE_APPROVAL',
        stageName: getStageName('INITIAL_FINANCE_APPROVAL'),
        eventType: 'INITIAL_FINANCE_APPROVAL',
        actorName: opp.initialFinanceApproval?.approvedBy || opp.initialFinanceReviewData?.financeProcessor || opp.financeProcessor || 'Finance Approver',
        actorRole: 'FINANCE',
        actionLabel: 'Initial Finance Approval & Margin Sign-Off',
        amount: opp.dealValue,
        currency,
        marginPercent: opp.initialFinanceApproval?.approvedMarginPercent || opp.initialFinanceReviewData?.approvedMarginPercent,
        notes: opp.initialFinanceApproval?.comments || opp.initialFinanceReviewData?.financeReviewNotes || 'Finance threshold sign-off verified.',
      });
    }
  }

  // 6. Check if Stage 7 (Client Buyoff / Negotiation) snapshot exists
  if (opp.clientNegotiation?.finalAgreedValue || opp.clientNegotiation?.status === 'CLIENT_CONFIRMED') {
    const hasStage7 = entries.some(
      (e) => e.stage === 'CLIENT_BUYOFF_NEGOTIATION' || e.eventType === 'CLIENT_NEGOTIATION'
    );
    if (!hasStage7) {
      const finalAmount = opp.clientNegotiation.finalAgreedValue || opp.dealValue;
      const internalCost = opp.solutionProposal?.ibsiInternalCost || 0;
      const margin = finalAmount > 0 ? ((finalAmount - internalCost) / finalAmount) * 100 : undefined;

      entries.push({
        id: `neg-${opp.id}`,
        timestamp: opp.clientNegotiation.clientConfirmedDate || opp.clientNegotiation.presentedDate || opp.clientNegotiation.acknowledgedStartDate || opp.updatedAt,
        stage: 'CLIENT_BUYOFF_NEGOTIATION',
        stageName: getStageName('CLIENT_BUYOFF_NEGOTIATION'),
        eventType: 'CLIENT_NEGOTIATION',
        actorName: opp.clientNegotiation.negotiationLead || opp.salesLead || 'Sales Lead',
        actorRole: 'SALES',
        actionLabel: 'Client Negotiation & Agreed Value Confirmed',
        amount: finalAmount,
        currency,
        internalCost: internalCost > 0 ? internalCost : undefined,
        internalCurrency: opp.solutionProposal?.ibsiInternalCurrency || currency,
        marginPercent: margin,
        notes: opp.clientNegotiation.clientFeedback || (opp.clientNegotiation.agreedDiscountPercent ? `Agreed ${opp.clientNegotiation.agreedDiscountPercent}% commercial discount with client sponsor.` : 'Client accepted proposed deal structure.'),
      });
    }
  }

  // 7. Check if Stage 8 (Contract & Agreement Conversion) snapshot exists
  if (opp.contractDetails?.clientContractPriceAmount || opp.contractDetails?.clientContractLink || opp.contractDetails?.convertedAt) {
    const hasStage8 = entries.some(
      (e) => e.stage === 'CONTRACT_CONVERSION' || e.eventType === 'CONTRACT_CONVERSION'
    );
    if (!hasStage8) {
      const contractAmount = opp.contractDetails.clientContractPriceAmount || opp.dealValue;
      const contractCurrency = opp.contractDetails.clientContractPriceCurrency || opp.currency || currency;
      const internalCost = opp.solutionProposal?.ibsiInternalCost || 0;
      const margin = contractAmount > 0 ? ((contractAmount - internalCost) / contractAmount) * 100 : undefined;

      entries.push({
        id: `contract-conv-${opp.id}`,
        timestamp: opp.contractDetails.convertedAt || opp.contractDetails.uploadedAt || opp.contractDetails.acknowledgedStartDate || opp.updatedAt,
        stage: 'CONTRACT_CONVERSION',
        stageName: getStageName('CONTRACT_CONVERSION'),
        eventType: 'CONTRACT_CONVERSION',
        actorName: opp.contractDetails.contractsSpecialist || 'Contracts Specialist',
        actorRole: 'CONTRACTS',
        actionLabel: 'Converted Proposal to Contract & Price Confirmed',
        amount: contractAmount,
        currency: contractCurrency,
        internalCost: internalCost > 0 ? internalCost : undefined,
        internalCurrency: opp.solutionProposal?.ibsiInternalCurrency || contractCurrency,
        marginPercent: margin,
        notes: `Proposal converted to binding contract. ${opp.contractDetails.clientContractLink ? `Contract document: ${opp.contractDetails.clientContractLink}. ` : ''}Client Contract Price (TCV): ${formatCurrency(contractAmount, contractCurrency)}.`,
      });
    }
  }

  // 8. Check if Stage 9 (Final Finance Approval) snapshot exists
  if (opp.finalFinanceApproval?.approved || opp.finalFinanceApproval?.finalTcv) {
    const hasStage8 = entries.some(
      (e) => e.stage === 'FINAL_FINANCE_APPROVAL' || e.eventType === 'FINAL_FINANCE_APPROVAL'
    );
    if (!hasStage8) {
      entries.push({
        id: `fin-final-${opp.id}`,
        timestamp: opp.finalFinanceApproval.approvedAt || opp.updatedAt,
        stage: 'FINAL_FINANCE_APPROVAL',
        stageName: getStageName('FINAL_FINANCE_APPROVAL'),
        eventType: 'FINAL_FINANCE_APPROVAL',
        actorName: opp.finalFinanceApproval.approvedBy || 'Finance Director',
        actorRole: 'FINANCE',
        actionLabel: 'Final Finance Sign-Off & TCV Locked',
        amount: opp.finalFinanceApproval.finalTcv || opp.dealValue,
        currency,
        notes: opp.finalFinanceApproval.comments || 'Final commercial terms and revenue recognition baseline locked.',
      });
    }
  }

  // Sort entries chronologically (oldest to newest)
  entries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Calculate sequential variances (delta vs previous step)
  for (let i = 0; i < entries.length; i++) {
    if (i === 0) {
      entries[i].previousAmount = undefined;
      entries[i].variance = 0;
      entries[i].variancePercent = 0;
    } else {
      const prevAmount = entries[i - 1].amount;
      const currentAmount = entries[i].amount;
      entries[i].previousAmount = prevAmount;
      entries[i].variance = currentAmount - prevAmount;
      entries[i].variancePercent = prevAmount > 0 ? ((currentAmount - prevAmount) / prevAmount) * 100 : 0;
    }
  }

  return entries;
}
