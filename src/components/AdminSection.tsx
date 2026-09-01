import React, { useState, useMemo } from 'react';
import { ClientOrganization, ResourceMember, Opportunity, FormSelectorsConfig, FormSelectorCategoryKey, StageDefinition, FinanceAdminConfig, WorkflowStage } from '../types';
import {
  Building2,
  Users,
  Download,
  RotateCcw,
  Plus,
  Upload,
  ArrowRight,
  ShieldAlert,
  Database,
  FileSpreadsheet,
  Settings,
  Sparkles,
  Layers,
  CheckCircle2,
  ChevronDown,
  Sliders,
  RefreshCw,
  Clock,
  Calculator,
  ArrowRightLeft,
} from 'lucide-react';
import { ClientDirectoryModal } from './ClientDirectoryModal';
import { ClientModal } from './ClientModal';
import { BulkUploadModal } from './BulkUploadModal';
import { ResourceDirectoryModal } from './ResourceDirectoryModal';
import { ResourceModal } from './ResourceModal';
import { ResourceBulkUploadModal } from './ResourceBulkUploadModal';
import { FormSelectorAdminModal } from './FormSelectorAdminModal';
import { TargetSlaAdminModal } from './TargetSlaAdminModal';
import { OpportunityAdminModal } from './OpportunityAdminModal';
import { FinanceAdminModal } from './FinanceAdminModal';
import { WORKFLOW_STAGES } from '../data/stages';
import { INITIAL_FINANCE_CONFIG } from '../data/mockFinanceConfig';

interface AdminSectionProps {
  clients: ClientOrganization[];
  resources: ResourceMember[];
  opportunities: Opportunity[];
  formSelectors: FormSelectorsConfig;
  stageDefinitions?: StageDefinition[];
  financeConfig?: FinanceAdminConfig;
  onUpdateFinanceConfig?: (config: FinanceAdminConfig) => void;
  onUpdateOpportunity?: (opp: Opportunity) => void;
  onDeleteOpportunity?: (oppId: string) => void;
  onMoveOpportunityStage?: (oppId: string, targetStage: WorkflowStage, reason: string) => void;
  onUpdateFormSelectors: (config: FormSelectorsConfig) => void;
  onUpdateStageDefinitions?: (stages: StageDefinition[]) => void;
  onSyncFormOption?: (
    category: FormSelectorCategoryKey,
    option: { label: string; value: string; color?: string; description?: string }
  ) => void;
  onAddClient: (client: ClientOrganization) => void;
  onUpdateClient: (client: ClientOrganization) => void;
  onDeleteClient: (clientId: string) => void;
  onBulkImportClients: (newClients: ClientOrganization[], mode: 'APPEND' | 'REPLACE') => void;
  onAddResource: (resource: ResourceMember) => void;
  onUpdateResource: (resource: ResourceMember) => void;
  onDeleteResource: (resourceId: string) => void;
  onBulkImportResources: (newResources: ResourceMember[], mode: 'APPEND' | 'REPLACE') => void;
  onExportData: () => void;
  onResetData: () => void;
  onSelectOpportunity?: (opportunity: Opportunity) => void;
}

const CONTRACT_STAGES = new Set([
  'CONTRACT_CONVERSION',
  'FINAL_FINANCE_APPROVAL',
  'DOCUSIGN_CLIENT_ROUTING',
  'WIN_NOTIFICATION',
  'PARALLEL_EXECUTION',
  'CWC_DELIVERY',
  'FINANCE_BILLING_ENDORSEMENT',
  'DEAL_CLOSED',
]);

export const AdminSection: React.FC<AdminSectionProps> = ({
  clients,
  resources,
  opportunities,
  formSelectors,
  stageDefinitions = WORKFLOW_STAGES,
  financeConfig = INITIAL_FINANCE_CONFIG,
  onUpdateFinanceConfig,
  onUpdateOpportunity,
  onDeleteOpportunity,
  onMoveOpportunityStage,
  onUpdateFormSelectors,
  onUpdateStageDefinitions,
  onSyncFormOption,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  onBulkImportClients,
  onAddResource,
  onUpdateResource,
  onDeleteResource,
  onBulkImportResources,
  onExportData,
  onResetData,
  onSelectOpportunity,
}) => {
  // Modal State for Opportunity Admin Tool (NEW)
  const [isOpportunityAdminOpen, setIsOpportunityAdminOpen] = useState(false);

  // Modal State for Finance Admin Tool (NEW)
  const [isFinanceAdminOpen, setIsFinanceAdminOpen] = useState(false);

  // Modal State for Target SLA Admin
  const [isTargetSlaAdminOpen, setIsTargetSlaAdminOpen] = useState(false);

  // Modal State for Form Selectors Admin
  const [isFormSelectorAdminOpen, setIsFormSelectorAdminOpen] = useState(false);

  // Modal State for Clients
  const [isDirectoryModalOpen, setIsDirectoryModalOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);

  // Modal State for Resources
  const [isResourceDirectoryOpen, setIsResourceDirectoryOpen] = useState(false);
  const [isQuickAddResourceOpen, setIsQuickAddResourceOpen] = useState(false);
  const [isBulkUploadResourceOpen, setIsBulkUploadResourceOpen] = useState(false);

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Total Target SLA turnaround days
  const totalSlaDays = useMemo(() => {
    return (stageDefinitions || WORKFLOW_STAGES).reduce(
      (sum, s) => sum + (s.targetSlaDays || 0),
      0
    );
  }, [stageDefinitions]);

  // Compute key summary metrics for display on indicators
  const totalContractsCount = useMemo(() => {
    let count = 0;
    opportunities.forEach((opp) => {
      if (CONTRACT_STAGES.has(opp.currentStage) || Boolean(opp.contractDetails?.contractNumber)) {
        count++;
      }
    });
    return count;
  }, [opportunities]);

  const totalContractPortfolioValue = useMemo(() => {
    let total = 0;
    opportunities.forEach((opp) => {
      const isContract = CONTRACT_STAGES.has(opp.currentStage) || Boolean(opp.contractDetails?.contractNumber);
      if (isContract) {
        total +=
          opp.finalFinanceApproval?.finalTcv ||
          opp.clientNegotiation?.finalAgreedValue ||
          opp.dealValue ||
          0;
      } else {
        total += opp.dealValue || 0;
      }
    });
    return total;
  }, [opportunities]);

  const handleExportClientsCsvOnly = () => {
    const headers = [
      'Client / Organization Name',
      'Abbreviation',
      'Industry',
      'Client Profile',
      'Primary Contact Person',
      'Contact Email',
      'Contact Phone',
      'Remarks',
    ];

    const rows = clients.map((c) => [
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${c.abbreviation || ''}"`,
      `"${(c.industry || '').replace(/"/g, '""')}"`,
      `"${c.clientProfile || 'External'}"`,
      `"${(c.primaryContactName || '').replace(/"/g, '""')}"`,
      `"${c.contactEmail || ''}"`,
      `"${c.contactPhone || ''}"`,
      `"${(c.remarks || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `clients_master_directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setShowExportMenu(false);
  };

  const handleExportResourcesCsvOnly = () => {
    const headers = [
      'Resource Name',
      'Role',
      'Division',
      'Business Unit',
      'Email Address',
      'Contact Number',
      'Remarks',
    ];

    const rows = resources.map((r) => [
      `"${(r.name || '').replace(/"/g, '""')}"`,
      `"${(r.role || '').replace(/"/g, '""')}"`,
      `"${(r.division || 'General Operations').replace(/"/g, '""')}"`,
      `"${(r.department || '').replace(/"/g, '""')}"`,
      `"${r.email || ''}"`,
      `"${r.contactNumber || ''}"`,
      `"${(r.remarks || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `resources_directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setShowExportMenu(false);
  };

  return (
    <section id="admin-management-section" className="pt-2">
      {/* Executive Admin Panel with Button Actions and Live Indicators */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          {/* Section Info & Live Status Indicator */}
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl shadow-xs mt-0.5">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Admin & System Hub
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                  Synced • 15 Lifecycle Stages
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                Master client directory, enterprise resource staffing, master form dropdown configurations, and data persistence.
              </p>
            </div>
          </div>

          {/* Micro Telemetry Indicators */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <div className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center space-x-2">
              <span className="text-slate-400">Team:</span>
              <span className="font-bold text-indigo-300">{resources.length} Resources</span>
              <span className="text-slate-500">•</span>
              <span className="font-bold text-blue-300">{clients.length} Clients</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center space-x-2">
              <span className="text-slate-400">Portfolio:</span>
              <span className="font-mono font-bold text-emerald-400">
                ${totalContractPortfolioValue.toLocaleString()} USD
              </span>
            </div>
          </div>
        </div>

        {/* Buttons Toolbar - 4-Column Balanced Grid Layout */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-stretch">
            
            {/* ROW 1 - ITEM 1: Opportunity Master Admin Tool */}
            <button
              id="btn-admin-open-opportunity-admin"
              type="button"
              onClick={() => setIsOpportunityAdminOpen(true)}
              className="group relative flex items-center justify-between min-h-[4.25rem] py-3 px-3.5 bg-white hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer text-left"
            >
              <div className="flex items-center min-w-0 mr-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 mr-3 shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-800 group-hover:text-indigo-700 leading-snug">
                    Opportunity Admin
                  </div>
                  <div className="text-xs text-slate-500 font-medium leading-tight mt-0.5">
                    Edit, Delete & Stage Control
                  </div>
                </div>
              </div>
              <span className="px-2 py-1 text-[11px] font-bold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                {opportunities.length} Deals
              </span>
            </button>

            {/* ROW 1 - ITEM 2: Finance Admin Tool */}
            <button
              id="btn-admin-open-finance-admin"
              type="button"
              onClick={() => setIsFinanceAdminOpen(true)}
              className="group relative flex items-center justify-between min-h-[4.25rem] py-3 px-3.5 bg-white hover:bg-purple-50/50 border border-slate-200 hover:border-purple-300 rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer text-left"
            >
              <div className="flex items-center min-w-0 mr-2">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 mr-3 shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                  <Calculator className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-800 group-hover:text-purple-700 leading-snug">
                    Finance Admin
                  </div>
                  <div className="text-xs text-slate-500 font-medium leading-tight mt-0.5">
                    Approval Tiers & Thresholds
                  </div>
                </div>
              </div>
              <span className="px-2 py-1 text-[11px] font-bold rounded-lg bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                {financeConfig?.tiers?.length || 4} Tiers
              </span>
            </button>

            {/* ROW 1 - ITEM 3: Resource Directory with Sub-Actions */}
            <div className="group relative flex items-stretch min-h-[4.25rem] bg-white hover:bg-indigo-50/30 border border-slate-200 hover:border-indigo-300 rounded-xl shadow-2xs hover:shadow-xs transition-all overflow-hidden">
              <button
                id="btn-admin-open-resource-directory"
                type="button"
                onClick={() => setIsResourceDirectoryOpen(true)}
                className="flex-1 flex items-center min-w-0 pl-3.5 pr-2 py-3 text-left cursor-pointer hover:bg-indigo-50/50 transition-colors"
              >
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 mr-3 shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                  <Users className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-slate-800 group-hover:text-indigo-700 leading-snug">
                    Resource Directory
                  </div>
                  <div className="text-xs text-slate-500 font-medium leading-tight mt-0.5">
                    {resources.length} Team Members
                  </div>
                </div>
              </button>

              <div className="h-7 self-center w-px bg-slate-200 shrink-0" />

              {/* Sub-actions: Add & Bulk */}
              <div className="flex items-center px-1.5 bg-slate-50/70 shrink-0 space-x-1">
                <button
                  id="btn-admin-quick-add-resource"
                  type="button"
                  onClick={() => setIsQuickAddResourceOpen(true)}
                  title="Add New Resource Member"
                  className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-700 hover:bg-indigo-100 border border-transparent hover:border-indigo-200 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  id="btn-admin-quick-bulk-upload-resource"
                  type="button"
                  onClick={() => setIsBulkUploadResourceOpen(true)}
                  title="Bulk Upload Resources"
                  className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-700 hover:bg-indigo-100 border border-transparent hover:border-indigo-200 transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ROW 1 - ITEM 4: Client / Org Directory with Sub-Actions */}
            <div className="group relative flex items-stretch min-h-[4.25rem] bg-white hover:bg-blue-50/30 border border-slate-200 hover:border-blue-300 rounded-xl shadow-2xs hover:shadow-xs transition-all overflow-hidden">
              <button
                id="btn-admin-open-client-directory"
                type="button"
                onClick={() => setIsDirectoryModalOpen(true)}
                className="flex-1 flex items-center min-w-0 pl-3.5 pr-2 py-3 text-left cursor-pointer hover:bg-blue-50/50 transition-colors"
              >
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 mr-3 shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-slate-800 group-hover:text-blue-700 leading-snug">
                    Client Directory
                  </div>
                  <div className="text-xs text-slate-500 font-medium leading-tight mt-0.5">
                    {clients.length} Organizations
                  </div>
                </div>
              </button>

              <div className="h-7 self-center w-px bg-slate-200 shrink-0" />

              {/* Sub-actions: Add & Bulk */}
              <div className="flex items-center px-1.5 bg-slate-50/70 shrink-0 space-x-1">
                <button
                  id="btn-admin-quick-add-client"
                  type="button"
                  onClick={() => setIsQuickAddOpen(true)}
                  title="Add New Client Organization"
                  className="p-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-100 border border-transparent hover:border-blue-200 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  id="btn-admin-quick-bulk-upload"
                  type="button"
                  onClick={() => setIsBulkUploadOpen(true)}
                  title="Bulk Upload Organizations"
                  className="p-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-100 border border-transparent hover:border-blue-200 transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ROW 2 - ITEM 1: Target SLA Admin */}
            <button
              id="btn-admin-open-target-slas"
              type="button"
              onClick={() => setIsTargetSlaAdminOpen(true)}
              className="group relative flex items-center justify-between min-h-[4.25rem] py-3 px-3.5 bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer text-left"
            >
              <div className="flex items-center min-w-0 mr-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 mr-3 shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-800 group-hover:text-blue-700 leading-snug">
                    Target SLAs
                  </div>
                  <div className="text-xs text-slate-500 font-medium leading-tight mt-0.5">
                    {totalSlaDays}d Total Turnaround
                  </div>
                </div>
              </div>
              <span className="px-2 py-1 text-[11px] font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-200 shrink-0 flex items-center space-x-1">
                <ShieldAlert className="w-3 h-3 text-blue-500" />
                <span>15 Stages</span>
              </span>
            </button>

            {/* ROW 2 - ITEM 2: Form Selector Admin */}
            <button
              id="btn-admin-open-form-selectors"
              type="button"
              onClick={() => setIsFormSelectorAdminOpen(true)}
              className="group relative flex items-center justify-between min-h-[4.25rem] py-3 px-3.5 bg-white hover:bg-purple-50/50 border border-slate-200 hover:border-purple-300 rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer text-left"
            >
              <div className="flex items-center min-w-0 mr-2">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 mr-3 shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                  <Sliders className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-800 group-hover:text-purple-700 leading-snug">
                    Form Selectors
                  </div>
                  <div className="text-xs text-slate-500 font-medium leading-tight mt-0.5">
                    8 Master Categories
                  </div>
                </div>
              </div>
              <span className="px-2 py-1 text-[11px] font-bold rounded-lg bg-purple-50 text-purple-700 border border-purple-200 shrink-0 flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-purple-500" />
                <span>Live Sync</span>
              </span>
            </button>

            {/* ROW 2 - ITEM 3: Export Master Data Menu */}
            <div className="relative">
              <button
                id="btn-admin-export-data"
                type="button"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="group relative w-full flex items-center justify-between min-h-[4.25rem] py-3 px-3.5 bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer text-left"
              >
                <div className="flex items-center min-w-0 mr-2">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 mr-3 shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                    <Download className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-800 group-hover:text-emerald-700 leading-snug">
                      Export Data
                    </div>
                    <div className="text-xs text-slate-500 font-medium leading-tight mt-0.5">
                      {opportunities.length} Pipeline Deals
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1.5 shrink-0">
                  <span className="px-2 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                    CSV/JSON
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showExportMenu ? 'rotate-180 text-emerald-600' : ''}`} />
                </div>
              </button>

              {/* Export Dropdown Options */}
              {showExportMenu && (
                <div className="absolute left-0 right-0 sm:right-auto sm:w-80 top-full mt-2 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-40 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    id="menu-export-master-json-btn"
                    type="button"
                    onClick={() => {
                      setShowExportMenu(false);
                      onExportData();
                    }}
                    className="w-full px-3 py-2.5 text-left text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg transition-colors flex items-center space-x-2.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-900">Export Master JSON</div>
                      <div className="text-[10px] text-slate-500">All deals, stages, clients & resources</div>
                    </div>
                  </button>
                  <button
                    id="menu-export-resources-csv-btn"
                    type="button"
                    onClick={handleExportResourcesCsvOnly}
                    className="w-full px-3 py-2.5 text-left text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-800 rounded-lg transition-colors flex items-center space-x-2.5 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-900">Export Resource Directory (CSV)</div>
                      <div className="text-[10px] text-slate-500">Team members, roles & contact list</div>
                    </div>
                  </button>
                  <button
                    id="menu-export-clients-csv-btn"
                    type="button"
                    onClick={handleExportClientsCsvOnly}
                    className="w-full px-3 py-2.5 text-left text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-800 rounded-lg transition-colors flex items-center space-x-2.5 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-900">Export Client Directory (CSV)</div>
                      <div className="text-[10px] text-slate-500">Formatted accounts & contacts</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* ROW 2 - ITEM 4: Reset Demo Dataset */}
            <button
              id="btn-admin-reset-demo"
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="group relative flex items-center justify-between min-h-[4.25rem] py-3 px-3.5 bg-white hover:bg-red-50/50 border border-slate-200 hover:border-red-200 rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer text-left"
            >
              <div className="flex items-center min-w-0 mr-2">
                <div className="p-2 rounded-xl bg-slate-100 group-hover:bg-red-100 text-slate-500 group-hover:text-red-600 border border-slate-200 group-hover:border-red-200 mr-3 shrink-0 transition-colors shadow-2xs">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-700 group-hover:text-red-700 leading-snug">
                    Reset Demo Data
                  </div>
                  <div className="text-xs text-slate-400 group-hover:text-red-500 font-medium leading-tight mt-0.5">
                    Factory Defaults
                  </div>
                </div>
              </div>
              <span className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 group-hover:bg-red-100 text-slate-500 group-hover:text-red-700 transition-colors shrink-0">
                Baseline
              </span>
            </button>

          </div>
        </div>
      </div>

      {/* Opportunity Admin Modal (Pops open from Opportunity Admin Button) */}
      <OpportunityAdminModal
        isOpen={isOpportunityAdminOpen}
        onClose={() => setIsOpportunityAdminOpen(false)}
        opportunities={opportunities}
        clients={clients}
        resources={resources}
        formSelectors={formSelectors}
        stageDefinitions={stageDefinitions}
        onUpdateOpportunity={(opp) => {
          if (onUpdateOpportunity) {
            onUpdateOpportunity(opp);
          }
        }}
        onDeleteOpportunity={(oppId) => {
          if (onDeleteOpportunity) {
            onDeleteOpportunity(oppId);
          }
        }}
        onMoveStage={(oppId, targetStage, reason) => {
          if (onMoveOpportunityStage) {
            onMoveOpportunityStage(oppId, targetStage, reason);
          }
        }}
        onSelectOpportunity={onSelectOpportunity}
      />

      {/* Finance Admin Modal (Pops open from Finance Admin Button) */}
      <FinanceAdminModal
        isOpen={isFinanceAdminOpen}
        onClose={() => setIsFinanceAdminOpen(false)}
        config={financeConfig}
        resources={resources}
        opportunities={opportunities}
        onSaveConfig={(updatedConfig) => {
          if (onUpdateFinanceConfig) {
            onUpdateFinanceConfig(updatedConfig);
          }
        }}
      />

      {/* Resource Directory Modal (Pops open from Button 1) */}
      <ResourceDirectoryModal
        isOpen={isResourceDirectoryOpen}
        onClose={() => setIsResourceDirectoryOpen(false)}
        resources={resources}
        opportunities={opportunities}
        formSelectors={formSelectors}
        onAddResource={onAddResource}
        onUpdateResource={onUpdateResource}
        onDeleteResource={onDeleteResource}
        onBulkImport={onBulkImportResources}
        onSelectOpportunity={onSelectOpportunity}
        onSyncFormOption={onSyncFormOption}
      />

      {/* Quick Add Resource Modal */}
      <ResourceModal
        isOpen={isQuickAddResourceOpen}
        onClose={() => setIsQuickAddResourceOpen(false)}
        onSave={onAddResource}
        existingResources={resources}
        formSelectors={formSelectors}
        onSyncFormOption={onSyncFormOption}
      />

      {/* Quick Bulk Upload Resources Modal */}
      <ResourceBulkUploadModal
        isOpen={isBulkUploadResourceOpen}
        onClose={() => setIsBulkUploadResourceOpen(false)}
        onImport={onBulkImportResources}
        existingResources={resources}
      />

      {/* Client Directory Modal (Pops open from Button 2) */}
      <ClientDirectoryModal
        isOpen={isDirectoryModalOpen}
        onClose={() => setIsDirectoryModalOpen(false)}
        clients={clients}
        opportunities={opportunities}
        formSelectors={formSelectors}
        onAddClient={onAddClient}
        onUpdateClient={onUpdateClient}
        onDeleteClient={onDeleteClient}
        onBulkImport={onBulkImportClients}
        onSelectOpportunity={onSelectOpportunity}
      />

      {/* Quick Add Client Modal */}
      <ClientModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSave={onAddClient}
        existingClients={clients}
        formSelectors={formSelectors}
        onSyncFormOption={onSyncFormOption}
      />

      {/* Quick Bulk Upload Clients Modal */}
      <BulkUploadModal
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
        onImport={onBulkImportClients}
        existingClients={clients}
      />

      {/* Form Selector Admin Modal (Pops open from Button 4) */}
      <FormSelectorAdminModal
        isOpen={isFormSelectorAdminOpen}
        onClose={() => setIsFormSelectorAdminOpen(false)}
        config={formSelectors}
        onUpdateConfig={onUpdateFormSelectors}
      />

      {/* Target SLA Admin Modal (Pops open from Button 3) */}
      <TargetSlaAdminModal
        isOpen={isTargetSlaAdminOpen}
        onClose={() => setIsTargetSlaAdminOpen(false)}
        stageDefinitions={stageDefinitions}
        onSaveStageDefinitions={(updatedStages) => {
          if (onUpdateStageDefinitions) {
            onUpdateStageDefinitions(updatedStages);
          }
        }}
        opportunities={opportunities}
      />

      {/* Reset Confirmation Dialog Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center space-x-3 text-amber-600">
              <div className="p-3 bg-amber-100 rounded-full">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Reset to Demo Dataset?</h4>
                <p className="text-xs text-slate-500">Restore factory sample pipeline, clients & resources</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This will restore all <strong>opportunities, approvals, billing milestones</strong>, the <strong>Client Directory</strong>, and the <strong>Resource Directory</strong> back to the initial sample enterprise state. Any custom data created locally will be reset.
            </p>

            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-reset-demo-btn"
                onClick={() => {
                  setShowResetConfirm(false);
                  onResetData();
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Confirm Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
