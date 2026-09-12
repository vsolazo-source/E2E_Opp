import React, { useState } from 'react';
import {
  RbacConfig,
  RolePermissions,
  SystemRole,
  AccessScope,
  EditScope,
  MicrosoftEntraConfig,
  UserProfile,
} from '../types/rbac';
import { ResourceMember, Opportunity, WorkflowStage } from '../types';
import { WORKFLOW_STAGES } from '../data/stages';
import { DEFAULT_ROLE_PERMISSIONS, DEFAULT_ENTRA_CONFIG, DEFAULT_RBAC_CONFIG } from '../data/mockRbac';
import { checkStageAccess, isUserAssignedToOpportunity, resolveResourceSystemRole, resolveResourceAccessScope } from '../utils/rbac';
import {
  Shield,
  Users,
  Key,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Save,
  Plus,
  Trash2,
  Lock,
  ChevronRight,
  ExternalLink,
  Layers,
  Sparkles,
  Search,
  Check,
  Building,
  Briefcase,
  X,
} from 'lucide-react';

interface RbacAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  rbacConfig: RbacConfig;
  resources: ResourceMember[];
  opportunities: Opportunity[];
  currentUser?: UserProfile;
  onUpdateRbacConfig: (newConfig: RbacConfig) => void;
  onUpdateResource: (resource: ResourceMember) => void;
  onSwitchUser: (user: UserProfile) => void;
}

export const RbacAdminModal: React.FC<RbacAdminModalProps> = ({
  isOpen,
  onClose,
  rbacConfig,
  resources,
  opportunities,
  currentUser,
  onUpdateRbacConfig,
  onUpdateResource,
  onSwitchUser,
}) => {
  const [activeTab, setActiveTab] = useState<'ROLES' | 'RESOURCES' | 'ENTRA' | 'AUDIT'>('ROLES');
  const [configDraft, setConfigDraft] = useState<RbacConfig>(JSON.parse(JSON.stringify(rbacConfig)));
  const [selectedRole, setSelectedRole] = useState<SystemRole>('SALES_LEAD');
  const [resourceSearch, setResourceSearch] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Diagnostic simulator states
  const [diagUserId, setDiagUserId] = useState<string>(currentUser?.id || '');
  const [diagOppId, setDiagOppId] = useState<string>(opportunities[0]?.id || '');

  if (!isOpen) return null;

  const roleKeys: SystemRole[] = [
    'SUPER_ADMIN',
    'SALES_LEAD',
    'SOLUTION_ARCHITECT',
    'CONTRACTS_SPECIALIST',
    'FINANCE_OFFICER',
    'PMO_DELIVERY_LEAD',
    'AUDITOR_VIEWER',
  ];

  const handleStageToggle = (role: SystemRole, stage: WorkflowStage) => {
    setConfigDraft((prev) => {
      const currentAllowed = prev.rolePermissions[role]?.allowedStages || [];
      const isAllowed = currentAllowed.includes(stage);
      const updatedAllowed = isAllowed
        ? currentAllowed.filter((s) => s !== stage)
        : [...currentAllowed, stage];

      const next = {
        ...prev,
        rolePermissions: {
          ...prev.rolePermissions,
          [role]: {
            ...prev.rolePermissions[role],
            allowedStages: updatedAllowed,
          },
        },
      };
      setHasUnsavedChanges(true);
      return next;
    });
  };

  const handleCapabilityToggle = (
    role: SystemRole,
    field: keyof Omit<RolePermissions, 'role' | 'label' | 'shortLabel' | 'description' | 'badgeColor' | 'lens' | 'canViewScope' | 'canEditScope' | 'allowedStages' | 'canRevertStages'>
  ) => {
    setConfigDraft((prev) => {
      const currentVal = Boolean(prev.rolePermissions[role]?.[field]);
      const next = {
        ...prev,
        rolePermissions: {
          ...prev.rolePermissions,
          [role]: {
            ...prev.rolePermissions[role],
            [field]: !currentVal,
          },
        },
      };
      setHasUnsavedChanges(true);
      return next;
    });
  };

  const handleViewScopeChange = (role: SystemRole, scope: AccessScope) => {
    setConfigDraft((prev) => {
      const next = {
        ...prev,
        rolePermissions: {
          ...prev.rolePermissions,
          [role]: {
            ...prev.rolePermissions[role],
            canViewScope: scope,
          },
        },
      };
      setHasUnsavedChanges(true);
      return next;
    });
  };

  const handleEditScopeChange = (role: SystemRole, scope: EditScope) => {
    setConfigDraft((prev) => {
      const next = {
        ...prev,
        rolePermissions: {
          ...prev.rolePermissions,
          [role]: {
            ...prev.rolePermissions[role],
            canEditScope: scope,
          },
        },
      };
      setHasUnsavedChanges(true);
      return next;
    });
  };

  const handleEntraFieldChange = (field: keyof MicrosoftEntraConfig, val: any) => {
    setConfigDraft((prev) => {
      const next = {
        ...prev,
        entraConfig: {
          ...prev.entraConfig,
          [field]: val,
        },
      };
      setHasUnsavedChanges(true);
      return next;
    });
  };

  const handleAddGroupMapping = () => {
    setConfigDraft((prev) => {
      const newMapping = {
        id: `map-${Date.now()}`,
        entraGroupName: 'SG-IBS-NewGroup',
        entraGroupId: '00000000-0000-0000-0000-000000000000',
        systemRole: 'SALES_LEAD' as SystemRole,
        description: 'New corporate security group mapping',
      };
      const next = {
        ...prev,
        entraConfig: {
          ...prev.entraConfig,
          groupMappings: [...prev.entraConfig.groupMappings, newMapping],
        },
      };
      setHasUnsavedChanges(true);
      return next;
    });
  };

  const handleRemoveGroupMapping = (id: string) => {
    setConfigDraft((prev) => {
      const next = {
        ...prev,
        entraConfig: {
          ...prev.entraConfig,
          groupMappings: prev.entraConfig.groupMappings.filter((m) => m.id !== id),
        },
      };
      setHasUnsavedChanges(true);
      return next;
    });
  };

  const handleSaveAllConfig = () => {
    onUpdateRbacConfig(configDraft);
    setHasUnsavedChanges(false);
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Reset all RBAC permissions and Entra settings to enterprise defaults?')) {
      setConfigDraft(JSON.parse(JSON.stringify(DEFAULT_RBAC_CONFIG)));
      onUpdateRbacConfig(DEFAULT_RBAC_CONFIG);
      setHasUnsavedChanges(false);
    }
  };

  // Resources filtered
  const filteredResources = resources.filter((r) => {
    const q = resourceSearch.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      (r.email && r.email.toLowerCase().includes(q)) ||
      (r.department && r.department.toLowerCase().includes(q)) ||
      (r.role && r.role.toLowerCase().includes(q))
    );
  });

  // Diagnostic calculations
  const diagResource = resources.find((r) => r.id === diagUserId);
  const diagResolvedRole = diagResource ? resolveResourceSystemRole(diagResource) : 'SALES_LEAD';
  const diagUser: UserProfile = diagResource
    ? {
        id: diagResource.id,
        name: diagResource.name,
        email: diagResource.email,
        systemRole: diagResolvedRole,
        stakeholderLens:
          diagResolvedRole === 'SALES_LEAD'
            ? 'SALES'
            : diagResolvedRole === 'SOLUTION_ARCHITECT'
            ? 'ARCHITECTURE'
            : diagResolvedRole === 'CONTRACTS_SPECIALIST'
            ? 'CONTRACTS'
            : diagResolvedRole === 'FINANCE_OFFICER'
            ? 'FINANCE'
            : diagResolvedRole === 'PMO_DELIVERY_LEAD'
            ? 'PMO'
            : 'ALL',
        department: diagResource.department,
        division: diagResource.division,
        title: diagResource.role,
        accessScope: resolveResourceAccessScope(diagResolvedRole, diagResource.accessScope),
        entraUpn: diagResource.entraUpn || diagResource.email,
        authProvider: 'SIMULATED',
        isActive: true,
      }
    : currentUser;

  const diagOpp = opportunities.find((o) => o.id === diagOppId) || opportunities[0];
  const diagStageAccess = diagOpp
    ? checkStageAccess(diagOpp.currentStage, diagOpp, diagUser, configDraft)
    : null;
  const diagIsAssigned = diagOpp ? isUserAssignedToOpportunity(diagOpp, diagUser) : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl shadow-xs">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  RBAC & Microsoft Entra Governance Hub
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  Role-Based Access Control
                </span>
                {hasUnsavedChanges && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 animate-pulse">
                    Unsaved Changes
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Manage roles, granular stage edit rights, Resource Directory assignments, and Microsoft Entra ID SSO integration.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {hasUnsavedChanges && (
              <button
                type="button"
                onClick={handleSaveAllConfig}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 px-6 pt-3 bg-slate-50 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('ROLES')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'ROLES'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Roles & Stage Permissions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('RESOURCES')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'RESOURCES'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Resource Directory Access ({resources.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ENTRA')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'ENTRA'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {/* Microsoft 4-square */}
            <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5">
              <div className="bg-[#f25022]" />
              <div className="bg-[#7fba00]" />
              <div className="bg-[#00a4ef]" />
              <div className="bg-[#ffb900]" />
            </div>
            <span>Microsoft Entra ID (Azure AD) SSO</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('AUDIT')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'AUDIT'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>Live Access Diagnostics & Audit</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {/* TAB 1: ROLES & STAGE PERMISSIONS */}
          {activeTab === 'ROLES' && (
            <div className="space-y-5">
              {/* Role Selection Tabs */}
              <div className="flex flex-wrap gap-2">
                {roleKeys.map((role) => {
                  const perm = configDraft.rolePermissions[role];
                  const isSelected = selectedRole === role;
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSelectedRole(role)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center space-x-2 ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <span>{perm?.shortLabel || role}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {perm?.allowedStages?.length || 0} Stages
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Selected Role Configuration Card */}
              {configDraft.rolePermissions[selectedRole] && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center space-x-3">
                        <h3 className="text-base font-bold text-slate-900">
                          {configDraft.rolePermissions[selectedRole].label}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {selectedRole}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {configDraft.rolePermissions[selectedRole].description}
                      </p>
                    </div>

                    {/* Scope Configs */}
                    <div className="flex items-center space-x-3 text-xs">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">
                          View Scope
                        </label>
                        <select
                          value={configDraft.rolePermissions[selectedRole].canViewScope}
                          onChange={(e) => handleViewScopeChange(selectedRole, e.target.value as AccessScope)}
                          className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium bg-white focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="ALL">All Opportunities</option>
                          <option value="DEPARTMENT">My Department / BU</option>
                          <option value="ASSIGNED_ONLY">Assigned Deals Only</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">
                          Edit Authority Scope
                        </label>
                        <select
                          value={configDraft.rolePermissions[selectedRole].canEditScope}
                          onChange={(e) => handleEditScopeChange(selectedRole, e.target.value as EditScope)}
                          className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium bg-white focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="FULL_ADMIN">Full Administrative Edit</option>
                          <option value="ASSIGNED_STAGES_ANY_DEAL">Authorized Stages (Any Deal)</option>
                          <option value="ASSIGNED_STAGES_AND_DEALS">Authorized Stages (Only Assigned Deals)</option>
                          <option value="READ_ONLY">Read Only (No Stage Actions)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* General Capabilities Grid */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                      System Capabilities
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                      {[
                        { key: 'canCreateOpportunities', label: 'Create Deals' },
                        { key: 'canEditOpportunityBasics', label: 'Edit Deal Details' },
                        { key: 'canAccessAdminHub', label: 'Access Admin Hub' },
                        { key: 'canManageRbac', label: 'Manage RBAC / Entra' },
                        { key: 'canExportData', label: 'Export Data' },
                        { key: 'canDeleteOpportunity', label: 'Delete Deal' },
                      ].map((cap) => {
                        const isChecked = Boolean(
                          configDraft.rolePermissions[selectedRole][cap.key as any]
                        );
                        return (
                          <label
                            key={cap.key}
                            className={`flex items-center space-x-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-indigo-50/70 border-indigo-300 text-indigo-900 font-semibold'
                                : 'bg-slate-50 border-slate-200 text-slate-600'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleCapabilityToggle(selectedRole, cap.key as any)}
                              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                            />
                            <span className="text-xs">{cap.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* 15 Lifecycle Stages Permission Grid */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Authorized Stages to Advance & Approve ({configDraft.rolePermissions[selectedRole].allowedStages.length} / 15)
                      </h4>
                      <span className="text-[11px] text-slate-500">
                        Check stages where members of this role have edit & sign-off authority.
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {WORKFLOW_STAGES.map((stageDef) => {
                        const isAllowed = configDraft.rolePermissions[selectedRole].allowedStages.includes(
                          stageDef.id
                        );
                        return (
                          <div
                            key={stageDef.id}
                            onClick={() => handleStageToggle(selectedRole, stageDef.id)}
                            className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start justify-between ${
                              isAllowed
                                ? 'bg-indigo-50/60 border-indigo-400/70 text-slate-900 shadow-2xs'
                                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-start space-x-2.5 pr-2">
                              <span
                                className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 ${
                                  isAllowed ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                                }`}
                              >
                                {stageDef.index}
                              </span>
                              <div>
                                <div className="font-bold leading-snug">{stageDef.label}</div>
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  Default: {stageDef.actorLabel || stageDef.primaryActor}
                                </div>
                              </div>
                            </div>
                            <input
                              type="checkbox"
                              checked={isAllowed}
                              onChange={() => {}} // Handled by parent div click
                              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 mt-0.5 shrink-0"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Reset to Enterprise Defaults Toolbar */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleResetToDefaults}
                  className="px-3 py-1.5 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition-colors flex items-center space-x-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All to Enterprise Defaults</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveAllConfig}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-2 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save RBAC Configuration</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: RESOURCE DIRECTORY USER ACCESS */}
          {activeTab === 'RESOURCES' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Resource Directory RBAC Mapping
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Link employees in the Resource Directory to their RBAC System Role, Access Scope, and Microsoft Entra UPN.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={resourceSearch}
                    onChange={(e) => setResourceSearch(e.target.value)}
                    placeholder="Search resources..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Resources Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Resource Member</th>
                        <th className="py-3 px-3">Department / BU</th>
                        <th className="py-3 px-3">RBAC System Role</th>
                        <th className="py-3 px-3">Access Scope</th>
                        <th className="py-3 px-3">Microsoft Entra UPN</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredResources.filter((r): r is ResourceMember => Boolean(r && r.id)).map((res) => {
                        const currentResRole = res.systemRole || resolveResourceSystemRole(res);
                        const resName = res.name || 'Resource Member';
                        const isCurrentActive = (currentUser?.email || '').toLowerCase() === (res.email || res.entraUpn || '').toLowerCase();

                        return (
                          <tr key={res.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-2.5">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                                  {resName.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                                    <span>{resName}</span>
                                    {isCurrentActive && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                        Active
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-500 truncate">
                                    {res.role}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              <span className="font-medium text-slate-800">{res.department}</span>
                              <div className="text-[10px] text-slate-400">{res.division}</div>
                            </td>

                            <td className="py-3 px-3">
                              <select
                                value={currentResRole}
                                onChange={(e) => {
                                  const updated: ResourceMember = {
                                    ...res,
                                    systemRole: e.target.value as SystemRole,
                                    isAdmin: e.target.value === 'SUPER_ADMIN',
                                  };
                                  onUpdateResource(updated);
                                }}
                                className="px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                              >
                                {roleKeys.map((rk) => (
                                  <option key={rk} value={rk}>
                                    {configDraft.rolePermissions[rk]?.shortLabel || rk}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="py-3 px-3">
                              <select
                                value={res.accessScope || (currentResRole === 'SUPER_ADMIN' ? 'ALL' : 'ASSIGNED_ONLY')}
                                onChange={(e) => {
                                  const updated: ResourceMember = {
                                    ...res,
                                    accessScope: e.target.value as AccessScope,
                                  };
                                  onUpdateResource(updated);
                                }}
                                className="px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                              >
                                <option value="ALL">All Deals</option>
                                <option value="DEPARTMENT">My Department</option>
                                <option value="ASSIGNED_ONLY">Assigned Only</option>
                              </select>
                            </td>

                            <td className="py-3 px-3">
                              <input
                                type="text"
                                defaultValue={res.entraUpn || res.email}
                                onBlur={(e) => {
                                  if (e.target.value !== res.entraUpn) {
                                    onUpdateResource({
                                      ...res,
                                      entraUpn: e.target.value,
                                    });
                                  }
                                }}
                                className="px-2 py-1 text-xs border border-slate-300 rounded-lg w-44 font-mono focus:ring-2 focus:ring-indigo-500"
                              />
                            </td>

                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  const targetUser: UserProfile = {
                                    id: res.id,
                                    name: res.name,
                                    email: res.email,
                                    systemRole: currentResRole,
                                    stakeholderLens:
                                      currentResRole === 'SALES_LEAD'
                                        ? 'SALES'
                                        : currentResRole === 'SOLUTION_ARCHITECT'
                                        ? 'ARCHITECTURE'
                                        : currentResRole === 'CONTRACTS_SPECIALIST'
                                        ? 'CONTRACTS'
                                        : currentResRole === 'FINANCE_OFFICER'
                                        ? 'FINANCE'
                                        : currentResRole === 'PMO_DELIVERY_LEAD'
                                        ? 'PMO'
                                        : 'ALL',
                                    department: res.department,
                                    division: res.division,
                                    title: res.role,
                                    resourceId: res.id,
                                    accessScope: res.accessScope || (currentResRole === 'SUPER_ADMIN' ? 'ALL' : 'ASSIGNED_ONLY'),
                                    entraUpn: res.entraUpn || res.email,
                                    authProvider: 'SIMULATED',
                                    isActive: true,
                                    lastLoginAt: new Date().toISOString(),
                                  };
                                  onSwitchUser(targetUser);
                                }}
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg border border-indigo-200 transition-colors"
                              >
                                ⚡ Switch Persona
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MICROSOFT ENTRA ID (AZURE AD) SSO */}
          {activeTab === 'ENTRA' && (
            <div className="space-y-5">
              {/* Entra SSO Status Banner */}
              <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-5 border border-blue-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-start space-x-3.5">
                  <div className="grid grid-cols-2 gap-0.5 w-8 h-8 p-1 bg-white rounded-lg shrink-0">
                    <div className="bg-[#f25022]" />
                    <div className="bg-[#7fba00]" />
                    <div className="bg-[#00a4ef]" />
                    <div className="bg-[#ffb900]" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-bold text-white">
                        Microsoft Entra ID (Azure AD) Architecture
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                        OIDC / OAuth 2.0 PKCE Ready
                      </span>
                    </div>
                    <p className="text-xs text-blue-200 mt-1 max-w-2xl">
                      Configure Microsoft 365 single sign-on parameters. Group claims in incoming Entra ID tokens are dynamically mapped to the application's RBAC roles.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      alert(
                        `Microsoft Entra App Registration Manifest:\n\n` +
                          JSON.stringify(
                            {
                              appId: configDraft.entraConfig.clientId,
                              signInAudience: 'AzureADMyOrg',
                              requiredResourceAccess: [
                                {
                                  resourceAppId: '00000003-0000-0000-c000-000000000000',
                                  resourceAccess: [{ id: 'e1fe6dd8-ba31-4d61-89e7-88639da4683d', type: 'Scope' }],
                                },
                              ],
                              groupMembershipClaims: 'SecurityGroup',
                            },
                            null,
                            2
                          )
                      );
                    }}
                    className="px-3.5 py-2 bg-blue-800 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl border border-blue-700 transition-colors"
                  >
                    View Azure Manifest
                  </button>
                </div>
              </div>

              {/* Entra Config Form */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Tenant & Application Credentials
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Azure Tenant Domain / ID
                    </label>
                    <input
                      type="text"
                      value={configDraft.entraConfig.tenantId}
                      onChange={(e) => handleEntraFieldChange('tenantId', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Tenant Display Name
                    </label>
                    <input
                      type="text"
                      value={configDraft.entraConfig.tenantName}
                      onChange={(e) => handleEntraFieldChange('tenantName', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Application (Client) ID
                    </label>
                    <input
                      type="text"
                      value={configDraft.entraConfig.clientId}
                      onChange={(e) => handleEntraFieldChange('clientId', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      OAuth 2.0 Authority Endpoint
                    </label>
                    <input
                      type="text"
                      value={configDraft.entraConfig.authority}
                      onChange={(e) => handleEntraFieldChange('authority', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Redirect URI
                    </label>
                    <input
                      type="text"
                      value={configDraft.entraConfig.redirectUri}
                      onChange={(e) => handleEntraFieldChange('redirectUri', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Default Assigned Role (New Users)
                    </label>
                    <select
                      value={configDraft.entraConfig.defaultRole}
                      onChange={(e) => handleEntraFieldChange('defaultRole', e.target.value as SystemRole)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    >
                      {roleKeys.map((rk) => (
                        <option key={rk} value={rk}>
                          {configDraft.rolePermissions[rk]?.label || rk}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Group Claim Mappings */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Entra Security Group to RBAC Role Mappings
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      When a user authenticates, the system checks token `groups` claims and assigns the highest matching role.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddGroupMapping}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 transition-colors flex items-center space-x-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Group Mapping</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Entra Security Group Name</th>
                        <th className="py-2.5 px-3">Entra Object ID (UUID)</th>
                        <th className="py-2.5 px-3">Mapped App Role</th>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {configDraft.entraConfig.groupMappings.map((mapping) => (
                        <tr key={mapping.id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                            {mapping.entraGroupName}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                            {mapping.entraGroupId}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-md font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {mapping.systemRole}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                            {mapping.description}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveGroupMapping(mapping.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Save Entra Settings */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveAllConfig}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-2 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Entra SSO Configuration</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: LIVE ACCESS DIAGNOSTICS & AUDIT */}
          {activeTab === 'AUDIT' && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Live Permission Evaluator & Policy Diagnostics
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select any user persona and any pipeline opportunity to test exact real-time View and Stage Edit permissions.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      Select Testing User Persona
                    </label>
                    <select
                      value={diagUserId}
                      onChange={(e) => setDiagUserId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                    >
                      {resources.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} — {r.systemRole || 'SALES_LEAD'} ({r.department})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      Select Pipeline Opportunity to Test
                    </label>
                    <select
                      value={diagOppId}
                      onChange={(e) => setDiagOppId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                    >
                      {opportunities.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.title} [{o.clientName}] — Stage: {o.currentStage}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Diagnostics Results Card */}
                {diagOpp && diagStageAccess && (
                  <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-200">
                      <div>
                        <div className="text-xs font-bold text-slate-800 flex items-center space-x-2">
                          <span>Testing Target:</span>
                          <span className="text-indigo-700">{diagOpp.title}</span>
                          <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono text-[10px]">
                            {diagOpp.currentStage}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Assigned Lead: {diagOpp.salesLead || 'Unassigned'} • Architect: {diagOpp.solutionArchitect || 'Unassigned'} • Finance: {diagOpp.financeProcessor || 'Unassigned'}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-700">Designated Role:</span>
                        <div className="text-xs text-indigo-600 font-semibold">
                          {diagStageAccess.requiredRoleLabel}
                        </div>
                      </div>
                    </div>

                    {/* Check items */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                      <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start space-x-2.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-slate-900">View Permission</div>
                          <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                            Allowed (Scope: {diagUser.accessScope})
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start space-x-2.5">
                        {diagIsAssigned ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="font-bold text-slate-900">Deal Assignment</div>
                          <div className="text-[11px] text-slate-600 mt-0.5">
                            {diagIsAssigned
                              ? 'User is directly assigned to deal'
                              : 'Not directly assigned to deal'}
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start space-x-2.5">
                        {diagStageAccess.canAdvance ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="font-bold text-slate-900">Stage Action Authority</div>
                          <div
                            className={`text-[11px] font-semibold mt-0.5 ${
                              diagStageAccess.canAdvance ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {diagStageAccess.canAdvance
                              ? diagStageAccess.isAdminOverride
                                ? 'Allowed via Admin Override'
                                : 'Authorized for this Stage'
                              : 'Action Restricted'}
                          </div>
                          {diagStageAccess.reason && (
                            <div className="text-[10px] text-slate-500 mt-1 leading-tight">
                              {diagStageAccess.reason}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
