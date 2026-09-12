import { Opportunity, WorkflowStage } from '../types';
import { UserProfile, RbacConfig, StageAccessResult, SystemRole } from '../types/rbac';
import { STAGE_MAP } from '../data/stages';

/**
 * Checks whether the current user is assigned to this opportunity in any capacity:
 * Sales Lead, Solution Architect, BU Owner, Contracts Specialist, Finance Processor, or PMO Manager.
 */
export function isUserAssignedToOpportunity(opportunity: Opportunity, user: UserProfile): boolean {
  if (!opportunity || !user) return false;

  const normalizedUserName = (user.name || '').trim().toLowerCase();
  const normalizedUserEmail = (user.email || '').trim().toLowerCase();
  const normalizedUserUpn = (user.entraUpn || '').trim().toLowerCase();

  const matches = (fieldValue?: string) => {
    if (!fieldValue) return false;
    const val = fieldValue.trim().toLowerCase();
    return (
      val === normalizedUserName ||
      val === normalizedUserEmail ||
      val === normalizedUserUpn ||
      normalizedUserName.includes(val) ||
      val.includes(normalizedUserName)
    );
  };

  // 1. Primary Deal Roles
  if (matches(opportunity.salesLead)) return true;
  if (matches(opportunity.solutionArchitect)) return true;
  if (matches(opportunity.buOwner)) return true;
  if (matches(opportunity.contractsProcessor)) return true;
  if (matches(opportunity.financeProcessor)) return true;

  // 2. Stage Specific Embedded Assignments
  if (matches(opportunity.solutionProposal?.solutionArchitect)) return true;
  if (matches(opportunity.solutionProposal?.buOwner)) return true;
  if (matches(opportunity.salesReviewData?.reviewedBy)) return true;
  if (matches(opportunity.contractsReviewData?.contractsProcessor)) return true;
  if (matches(opportunity.initialFinanceReviewData?.financeProcessor)) return true;
  if (matches(opportunity.contractsEndorsementData?.contractsEndorser)) return true;
  if (matches(opportunity.contractDetails?.contractsSpecialist)) return true;
  if (matches(opportunity.finalFinanceApproval?.financeProcessor)) return true;
  if (matches(opportunity.docusignDetails?.contractsSpecialist)) return true;
  if (matches(opportunity.docusignDetails?.salesAssigned)) return true;
  if (matches(opportunity.parallelFinance?.financeOfficer)) return true;
  if (matches(opportunity.parallelPmo?.projectManager)) return true;
  if (matches(opportunity.parallelPmo?.buHead)) return true;
  if (matches(opportunity.cwcRecord?.pmoLeadSigner)) return true;
  if (matches(opportunity.cwcRecord?.cwcRoutedBy)) return true;
  if (matches(opportunity.billingRecord?.financeProcessor)) return true;

  // 3. Stakeholder Lens check for unassigned deals
  const currentStageDef = STAGE_MAP[opportunity.currentStage];
  if (currentStageDef && currentStageDef.primaryActor === user.stakeholderLens) {
    // If the deal is in their stage and no specific person was locked in, they are considered eligible
    return true;
  }

  return false;
}

/**
 * Returns human-readable label for which role handles a specific workflow stage.
 */
export function getRequiredRoleLabelForStage(stage: WorkflowStage): string {
  switch (stage) {
    case 'OPPORTUNITY_INTAKE':
    case 'SALES_PROPOSAL_REVIEW':
    case 'CLIENT_BUYOFF_NEGOTIATION':
      return 'Sales & Commercial Lead';
    case 'SOLUTION_DESIGN':
      return 'Solution Architect / BU Pre-Sales';
    case 'CONTRACTS_PROPOSAL_REVIEW':
    case 'CONTRACTS_PROPOSAL_ENDORSEMENT':
    case 'CONTRACT_CONVERSION':
    case 'DOCUSIGN_CLIENT_ROUTING':
    case 'WIN_NOTIFICATION':
      return 'Contracts Specialist / Legal Counsel';
    case 'INITIAL_FINANCE_APPROVAL':
    case 'FINAL_FINANCE_APPROVAL':
    case 'FINANCE_BILLING_ENDORSEMENT':
      return 'Finance Controller / Commercial Deal Desk';
    case 'PARALLEL_EXECUTION':
      return 'Joint Finance (Track A) & PMO (Track B) Delivery Leads';
    case 'CWC_DELIVERY':
      return 'PMO Delivery Lead / Program Manager';
    case 'DEAL_CLOSED':
      return 'Closed & Archived';
    default:
      return 'Assigned Stakeholder';
  }
}

/**
 * Determines whether a user can view an opportunity based on RBAC scope settings and filters.
 */
export function canUserViewOpportunity(
  opportunity?: Opportunity,
  user?: UserProfile,
  rbacConfig?: RbacConfig,
  forceOnlyAssignedFilter: boolean = false
): boolean {
  if (!opportunity || !user) return false;

  const userRole = user.systemRole || 'SUPER_ADMIN';

  // Super Admin bypass unless user explicitly toggled "My Assigned Deals" filter
  if (userRole === 'SUPER_ADMIN') {
    if (forceOnlyAssignedFilter) {
      return isUserAssignedToOpportunity(opportunity, user);
    }
    return true;
  }

  // If user has the "My Assigned Deals" filter active on UI
  if (forceOnlyAssignedFilter) {
    return isUserAssignedToOpportunity(opportunity, user);
  }

  // Check RBAC Scope
  const permissions = rbacConfig?.rolePermissions?.[userRole];
  const effectiveScope = user.accessScope || permissions?.canViewScope || 'ALL';

  if (effectiveScope === 'ALL') {
    return true;
  }

  if (effectiveScope === 'DEPARTMENT') {
    const userDept = (user.department || '').toLowerCase();
    const userDiv = (user.division || '').toLowerCase();
    const oppBu = (opportunity.businessUnit || '').toLowerCase();
    const oppDiv = (opportunity.division || '').toLowerCase();

    const deptMatch =
      (userDept && oppBu.includes(userDept)) ||
      (oppBu && userDept.includes(oppBu)) ||
      (userDiv && oppDiv.includes(userDiv));

    return deptMatch || isUserAssignedToOpportunity(opportunity, user);
  }

  if (effectiveScope === 'ASSIGNED_ONLY') {
    return isUserAssignedToOpportunity(opportunity, user);
  }

  return true;
}

/**
 * Validates whether the active user has authority to edit and advance a specific workflow stage.
 */
export function checkStageAccess(
  stage: WorkflowStage,
  opportunity?: Opportunity,
  user?: UserProfile,
  rbacConfig?: RbacConfig
): StageAccessResult {
  if (!user) {
    return {
      canView: false,
      canEdit: false,
      canAdvance: false,
      canRevert: false,
      isAdminOverride: false,
      reason: 'No authenticated user session found.',
      requiredRoleLabel: getRequiredRoleLabelForStage(stage),
    };
  }

  const userRole = user.systemRole || 'SUPER_ADMIN';

  // 1. Super Admin Full Governance Override
  if (userRole === 'SUPER_ADMIN') {
    return {
      canView: true,
      canEdit: true,
      canAdvance: true,
      canRevert: true,
      isAdminOverride: true,
      reason: 'Super Admin Governance Override enabled.',
      requiredRoleLabel: getRequiredRoleLabelForStage(stage),
    };
  }

  const permissions = rbacConfig?.rolePermissions?.[userRole];
  if (!permissions) {
    return {
      canView: true,
      canEdit: false,
      canAdvance: false,
      canRevert: false,
      isAdminOverride: false,
      reason: 'Unknown or unconfigured role profile.',
      requiredRoleLabel: getRequiredRoleLabelForStage(stage),
    };
  }

  // 2. Read-Only Auditor Check
  if (permissions.canEditScope === 'READ_ONLY' || userRole === 'AUDITOR_VIEWER') {
    return {
      canView: true,
      canEdit: false,
      canAdvance: false,
      canRevert: false,
      isAdminOverride: false,
      reason: 'Auditor profile: Read-only access across all stages.',
      requiredRoleLabel: getRequiredRoleLabelForStage(stage),
    };
  }

  // 3. Stage Authorization Check
  const allowedStages = permissions.allowedStages || [];
  const isStageAllowed = allowedStages.includes(stage);
  if (!isStageAllowed) {
    const requiredRole = getRequiredRoleLabelForStage(stage);
    return {
      canView: true,
      canEdit: false,
      canAdvance: false,
      canRevert: false,
      isAdminOverride: false,
      reason: `Action restricted to ${requiredRole}. Your current role is ${permissions.label}.`,
      requiredRoleLabel: requiredRole,
    };
  }

  // 4. Deal Assignment Constraint (if user has ASSIGNED_STAGES_AND_DEALS scope)
  if (permissions.canEditScope === 'ASSIGNED_STAGES_AND_DEALS') {
    const isAssigned = opportunity ? isUserAssignedToOpportunity(opportunity, user) : false;
    if (!isAssigned) {
      return {
        canView: true,
        canEdit: false,
        canAdvance: false,
        canRevert: false,
        isAdminOverride: false,
        reason: `You are authorized for this stage, but you are not assigned as the designated lead for this specific deal.`,
        requiredRoleLabel: getRequiredRoleLabelForStage(stage),
      };
    }
  }

  // 5. Allowed to proceed!
  const canRevert = permissions.canRevertStages?.includes(stage) ?? false;

  return {
    canView: true,
    canEdit: true,
    canAdvance: true,
    canRevert,
    isAdminOverride: false,
    requiredRoleLabel: getRequiredRoleLabelForStage(stage),
  };
}

/**
 * Helper to derive the corresponding lens from a SystemRole.
 */
export function deriveLensFromSystemRole(systemRole: SystemRole) {
  switch (systemRole) {
    case 'SALES_LEAD':
      return 'SALES';
    case 'SOLUTION_ARCHITECT':
      return 'ARCHITECTURE';
    case 'CONTRACTS_SPECIALIST':
      return 'CONTRACTS';
    case 'FINANCE_OFFICER':
      return 'FINANCE';
    case 'PMO_DELIVERY_LEAD':
      return 'PMO';
    case 'SUPER_ADMIN':
    case 'AUDITOR_VIEWER':
    default:
      return 'ALL';
  }
}

/**
 * Intelligently resolves the proper RBAC SystemRole for any resource member.
 * Falls back to role title, department, or admin status instead of blindly defaulting to SALES_LEAD.
 */
export function resolveResourceSystemRole(
  resource?: {
    systemRole?: SystemRole;
    role?: string;
    department?: string;
    division?: string;
    email?: string;
    name?: string;
    isAdmin?: boolean;
  } | null
): SystemRole {
  if (!resource) return 'SALES_LEAD';

  // 1. Return explicit systemRole if already set and recognized
  if (
    resource.systemRole &&
    [
      'SUPER_ADMIN',
      'SALES_LEAD',
      'SOLUTION_ARCHITECT',
      'CONTRACTS_SPECIALIST',
      'FINANCE_OFFICER',
      'PMO_DELIVERY_LEAD',
      'AUDITOR_VIEWER',
    ].includes(resource.systemRole)
  ) {
    return resource.systemRole;
  }

  const emailLower = (resource.email || '').toLowerCase().trim();
  const nameLower = (resource.name || '').toLowerCase().trim();

  // 2. Victor Solazo / Super Admin heuristics
  if (
    resource.isAdmin ||
    emailLower.includes('vsolazo') ||
    emailLower.includes('admin') ||
    nameLower.includes('victor solazo')
  ) {
    return 'SUPER_ADMIN';
  }

  // 3. Known key personas by email or name
  if (
    emailLower.includes('marcus.sterling') ||
    emailLower.includes('msterling') ||
    emailLower.includes('sarah.jenkins') ||
    emailLower.includes('sjenkins')
  ) {
    return 'SALES_LEAD';
  }

  if (
    emailLower.includes('vikram.patel') ||
    emailLower.includes('vpatel') ||
    emailLower.includes('jessica.chen') ||
    emailLower.includes('jchen')
  ) {
    return 'SOLUTION_ARCHITECT';
  }

  if (
    emailLower.includes('arthur.pendelton') ||
    emailLower.includes('apendelton') ||
    emailLower.includes('nadia.almansoor') ||
    emailLower.includes('nalmansoor')
  ) {
    return 'CONTRACTS_SPECIALIST';
  }

  if (
    emailLower.includes('elena.rostova') ||
    emailLower.includes('erostova') ||
    emailLower.includes('david.cho') ||
    emailLower.includes('dcho') ||
    emailLower.includes('priya.sharma') ||
    emailLower.includes('psharma')
  ) {
    return 'FINANCE_OFFICER';
  }

  if (
    emailLower.includes('carlos.mendez') ||
    emailLower.includes('cmendez')
  ) {
    return 'PMO_DELIVERY_LEAD';
  }

  if (
    emailLower.includes('audit') ||
    nameLower.includes('auditor') ||
    nameLower.includes('compliance')
  ) {
    return 'AUDITOR_VIEWER';
  }

  // 4. Role Title and Department/Business Unit matching
  const textBlob = `${resource.role || ''} ${resource.department || ''} ${resource.division || ''}`.toLowerCase();

  // Super Admin / Governance
  if (
    textBlob.includes('executive governance') ||
    textBlob.includes('system admin') ||
    textBlob.includes('enterprise governance') ||
    textBlob.includes('vice president of solutions')
  ) {
    return 'SUPER_ADMIN';
  }

  // Solutions Architect / Pre-Sales
  if (
    textBlob.includes('architect') ||
    textBlob.includes('pre-sales') ||
    textBlob.includes('presales') ||
    textBlob.includes('solution design') ||
    textBlob.includes('solutions architecture') ||
    textBlob.includes('cloud infrastructure')
  ) {
    return 'SOLUTION_ARCHITECT';
  }

  // Contracts / Legal / Procurement
  if (
    textBlob.includes('contracts') ||
    textBlob.includes('legal') ||
    textBlob.includes('counsel') ||
    textBlob.includes('procurement') ||
    textBlob.includes('vendor management')
  ) {
    return 'CONTRACTS_SPECIALIST';
  }

  // Finance / Billing / Accounting
  if (
    textBlob.includes('finance') ||
    textBlob.includes('accounting') ||
    textBlob.includes('billing') ||
    textBlob.includes('deal desk') ||
    textBlob.includes('cfo') ||
    textBlob.includes('financial')
  ) {
    return 'FINANCE_OFFICER';
  }

  // PMO / Project Delivery
  if (
    textBlob.includes('pmo') ||
    textBlob.includes('program director') ||
    textBlob.includes('project manager') ||
    textBlob.includes('project delivery') ||
    textBlob.includes('cwc') ||
    textBlob.includes('delivery lead')
  ) {
    return 'PMO_DELIVERY_LEAD';
  }

  // Audit / Risk / Compliance
  if (
    textBlob.includes('audit') ||
    textBlob.includes('compliance') ||
    textBlob.includes('risk management') ||
    textBlob.includes('internal audit')
  ) {
    return 'AUDITOR_VIEWER';
  }

  // Sales / Commercial
  if (
    textBlob.includes('sales') ||
    textBlob.includes('commercial') ||
    textBlob.includes('account executive') ||
    textBlob.includes('business development')
  ) {
    return 'SALES_LEAD';
  }

  return 'SALES_LEAD';
}

/**
 * Resolves access scope based on resolved SystemRole.
 */
export function resolveResourceAccessScope(
  systemRole: SystemRole,
  existingScope?: import('../types/rbac').AccessScope
): import('../types/rbac').AccessScope {
  if (existingScope) return existingScope;
  switch (systemRole) {
    case 'SUPER_ADMIN':
    case 'AUDITOR_VIEWER':
    case 'CONTRACTS_SPECIALIST':
    case 'FINANCE_OFFICER':
    case 'PMO_DELIVERY_LEAD':
      return 'ALL';
    case 'SOLUTION_ARCHITECT':
      return 'DEPARTMENT';
    case 'SALES_LEAD':
    default:
      return 'ASSIGNED_ONLY';
  }
}
