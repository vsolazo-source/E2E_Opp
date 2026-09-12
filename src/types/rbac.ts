import { WorkflowStage, StakeholderRole } from '../types';

export type SystemRole =
  | 'SUPER_ADMIN'
  | 'SALES_LEAD'
  | 'SOLUTION_ARCHITECT'
  | 'CONTRACTS_SPECIALIST'
  | 'FINANCE_OFFICER'
  | 'PMO_DELIVERY_LEAD'
  | 'AUDITOR_VIEWER';

export type AccessScope = 'ALL' | 'DEPARTMENT' | 'ASSIGNED_ONLY';

export type EditScope =
  | 'FULL_ADMIN'
  | 'ASSIGNED_STAGES_ANY_DEAL'
  | 'ASSIGNED_STAGES_AND_DEALS'
  | 'READ_ONLY';

export interface RolePermissions {
  role: SystemRole;
  label: string;
  shortLabel: string;
  description: string;
  badgeColor: string;
  lens: StakeholderRole;
  canViewScope: AccessScope;
  canEditScope: EditScope;
  allowedStages: WorkflowStage[];
  canRevertStages: WorkflowStage[];
  canCreateOpportunities: boolean;
  canEditOpportunityBasics: boolean;
  canDeleteOpportunity: boolean;
  canAccessAdminHub: boolean;
  canManageRbac: boolean;
  canExportData: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  systemRole: SystemRole;
  stakeholderLens: StakeholderRole;
  department: string;
  division?: string;
  title?: string;
  resourceId?: string;
  accessScope: AccessScope;
  entraUpn: string;
  entraOid?: string;
  entraGroups?: string[];
  authProvider: 'MICROSOFT_ENTRA' | 'LOCAL_SESSION' | 'SIMULATED';
  avatarUrl?: string;
  isActive: boolean;
  lastLoginAt?: string;
}

export interface EntraGroupMapping {
  id: string;
  entraGroupName: string;
  entraGroupId: string;
  systemRole: SystemRole;
  description?: string;
}

export interface MicrosoftEntraConfig {
  enabled: boolean;
  tenantId: string;
  tenantName: string;
  clientId: string;
  authority: string;
  redirectUri: string;
  allowedDomains: string[];
  defaultRole: SystemRole;
  groupMappings: EntraGroupMapping[];
  autoProvisionResources: boolean;
  mockSsoEnabled: boolean;
  lastConfiguredAt?: string;
}

export interface RbacConfig {
  rolePermissions: Record<SystemRole, RolePermissions>;
  entraConfig: MicrosoftEntraConfig;
  strictAssignedOnly: boolean;
  allowAdminOverride: boolean;
}

export interface StageAccessResult {
  canView: boolean;
  canEdit: boolean;
  canAdvance: boolean;
  canRevert: boolean;
  isAdminOverride: boolean;
  reason?: string;
  requiredRoleLabel?: string;
}
