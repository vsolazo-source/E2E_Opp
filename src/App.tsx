import React, { useState, useEffect, useMemo } from 'react';
import { Opportunity, WorkflowStage, StakeholderRole, ClientOrganization, ResourceMember, FormSelectorsConfig, StageDefinition, AuditLogEntry } from './types';
import { INITIAL_OPPORTUNITIES } from './data/mockOpportunities';
import { INITIAL_CLIENTS } from './data/mockClients';
import { INITIAL_RESOURCES } from './data/mockResources';
import { INITIAL_FORM_SELECTORS } from './data/mockFormSelectors';
import { STAGE_MAP, WORKFLOW_STAGES } from './data/stages';
import { Navbar } from './components/Navbar';
import { StakeholderDashboard } from './components/StakeholderDashboard';
import { OpportunityList } from './components/OpportunityList';
import { OpportunityDetailModal } from './components/OpportunityDetailModal';
import { NewOpportunityModal } from './components/NewOpportunityModal';
import { AIAssistantModal } from './components/AIAssistantModal';
import { AdminSection } from './components/AdminSection';

const LOCAL_STORAGE_KEY = 'e2e_opportunity_tracker_data_v1';
const CLIENT_STORAGE_KEY = 'e2e_client_directory_v1';
const RESOURCE_STORAGE_KEY = 'e2e_resource_directory_v1';
const FORM_SELECTORS_STORAGE_KEY = 'e2e_form_selectors_config_v1';
const STAGE_SLAS_STORAGE_KEY = 'e2e_workflow_stage_slas_v1';

export default function App() {
  // Target SLAs & Workflow Stages State
  const [stageDefinitions, setStageDefinitions] = useState<StageDefinition[]>(() => {
    try {
      const saved = localStorage.getItem(STAGE_SLAS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load stored stage SLAs:', e);
    }
    return WORKFLOW_STAGES;
  });

  // Form Selectors & Master Dropdowns State
  const [formSelectors, setFormSelectors] = useState<FormSelectorsConfig>(() => {
    try {
      const saved = localStorage.getItem(FORM_SELECTORS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            industries: Array.isArray(parsed.industries) && parsed.industries.length > 0 ? parsed.industries : INITIAL_FORM_SELECTORS.industries,
            departments: Array.isArray(parsed.departments) && parsed.departments.length > 0 ? parsed.departments : INITIAL_FORM_SELECTORS.departments,
            divisions: Array.isArray(parsed.divisions) && parsed.divisions.length > 0 ? parsed.divisions : INITIAL_FORM_SELECTORS.divisions,
            roles: Array.isArray(parsed.roles) && parsed.roles.length > 0 ? parsed.roles : INITIAL_FORM_SELECTORS.roles,
            priorities: Array.isArray(parsed.priorities) && parsed.priorities.length > 0 ? parsed.priorities : INITIAL_FORM_SELECTORS.priorities,
            opportunityStatuses: Array.isArray(parsed.opportunityStatuses) && parsed.opportunityStatuses.length > 0 ? parsed.opportunityStatuses : INITIAL_FORM_SELECTORS.opportunityStatuses,
            clientProfiles: Array.isArray(parsed.clientProfiles) && parsed.clientProfiles.length > 0 ? parsed.clientProfiles : INITIAL_FORM_SELECTORS.clientProfiles,
            contractTypes: Array.isArray(parsed.contractTypes) && parsed.contractTypes.length > 0 ? parsed.contractTypes : INITIAL_FORM_SELECTORS.contractTypes,
          };
        }
      }
    } catch (e) {
      console.error('Failed to load stored form selectors:', e);
    }
    return INITIAL_FORM_SELECTORS;
  });

  // Opportunities State with LocalStorage Persistence
  const [opportunities, setOpportunities] = useState<Opportunity[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load stored opportunities:', e);
    }
    return INITIAL_OPPORTUNITIES;
  });

  // Client / Organization Directory State
  const [clients, setClients] = useState<ClientOrganization[]>(() => {
    try {
      const saved = localStorage.getItem(CLIENT_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load stored clients:', e);
    }
    return INITIAL_CLIENTS;
  });

  // Resource Directory State
  const [resources, setResources] = useState<ResourceMember[]>(() => {
    try {
      const saved = localStorage.getItem(RESOURCE_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load stored resources:', e);
    }
    return INITIAL_RESOURCES;
  });

  // UI State
  const [currentRole, setCurrentRole] = useState<StakeholderRole>('ALL');
  const [selectedStageFilter, setSelectedStageFilter] = useState<WorkflowStage | 'ALL'>('ALL');
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STAGE_SLAS_STORAGE_KEY, JSON.stringify(stageDefinitions));
    } catch (e) {
      console.error('Failed to save stage SLAs:', e);
    }
  }, [stageDefinitions]);

  useEffect(() => {
    try {
      localStorage.setItem(FORM_SELECTORS_STORAGE_KEY, JSON.stringify(formSelectors));
    } catch (e) {
      console.error('Failed to save form selectors:', e);
    }
  }, [formSelectors]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(opportunities));
    } catch (e) {
      console.error('Failed to save opportunities:', e);
    }
  }, [opportunities]);

  useEffect(() => {
    try {
      localStorage.setItem(CLIENT_STORAGE_KEY, JSON.stringify(clients));
    } catch (e) {
      console.error('Failed to save clients:', e);
    }
  }, [clients]);

  useEffect(() => {
    try {
      localStorage.setItem(RESOURCE_STORAGE_KEY, JSON.stringify(resources));
    } catch (e) {
      console.error('Failed to save resources:', e);
    }
  }, [resources]);


  // Keep selectedOpportunity in sync when opportunities change
  useEffect(() => {
    if (selectedOpportunity) {
      const updated = opportunities.find((o) => o.id === selectedOpportunity.id);
      if (updated) {
        setSelectedOpportunity(updated);
      }
    }
  }, [opportunities]);

  // Calculate Pending Action Count per Role
  const pendingCountsByRole = useMemo(() => {
    const counts: Record<StakeholderRole, number> = {
      ALL: opportunities.filter((o) => o.currentStage !== 'DEAL_CLOSED').length,
      SALES: 0,
      ARCHITECTURE: 0,
      CONTRACTS: 0,
      FINANCE: 0,
      PMO: 0,
    };

    opportunities.forEach((opp) => {
      const stageDef = STAGE_MAP[opp.currentStage];
      if (stageDef && stageDef.primaryActor && stageDef.primaryActor !== 'ALL') {
        counts[stageDef.primaryActor] = (counts[stageDef.primaryActor] || 0) + 1;
      }
    });

    return counts;
  }, [opportunities]);

  // Opportunity Handlers
  const handleUpdateOpportunity = (updated: Opportunity) => {
    const updatedWithTime: Opportunity = { ...updated, updatedAt: new Date().toISOString() };
    setOpportunities((prev) =>
      prev.map((opp) => (opp.id === updated.id ? updatedWithTime : opp))
    );
    if (selectedOpportunity?.id === updated.id) {
      setSelectedOpportunity(updatedWithTime);
    }
  };

  const handleAdvanceStage = (
    oppId: string,
    nextStage: WorkflowStage,
    actionName: string,
    comments: string
  ) => {
    const now = new Date().toISOString();
    const actorName = currentRole === 'ALL' ? 'Executive Stakeholder' : `${currentRole} Lead`;
    const isReturn = /return|revert|rejected|send back/i.test(actionName) || /returned to/i.test(comments || '');

    const createHistoryEntry = (oppDealValue: number, oppCurrency: string): AuditLogEntry => ({
      id: `h-${Date.now()}`,
      timestamp: now,
      stage: nextStage,
      actorName,
      actorRole: currentRole === 'ALL' ? 'SALES' : currentRole,
      action: actionName,
      comments: comments || undefined,
      isApproval: !isReturn,
      isReturn,
      dealValue: oppDealValue,
      currency: oppCurrency,
    });

    setOpportunities((prev) =>
      prev.map((opp) => {
        if (opp.id !== oppId) return opp;

        const newHistoryEntry = createHistoryEntry(opp.dealValue, opp.currency);

        return {
          ...opp,
          currentStage: nextStage,
          stageEnteredAt: now,
          updatedAt: now,
          history: [...(opp.history || []), newHistoryEntry],
        };
      })
    );

    setSelectedOpportunity((prev) => {
      if (!prev || prev.id !== oppId) return prev;
      const newHistoryEntry = createHistoryEntry(prev.dealValue, prev.currency);
      return {
        ...prev,
        currentStage: nextStage,
        stageEnteredAt: now,
        updatedAt: now,
        history: [...(prev.history || []), newHistoryEntry],
      };
    });
  };

  const handleCreateOpportunity = (newOpp: Opportunity) => {
    setOpportunities((prev) => [newOpp, ...prev]);
    setSelectedOpportunity(newOpp);
  };

  // Client Directory Handlers
  const handleAddClient = (newClient: ClientOrganization) => {
    setClients((prev) => [newClient, ...prev]);
  };

  const handleUpdateClient = (updatedClient: ClientOrganization) => {
    setClients((prev) =>
      prev.map((c) => (c.id === updatedClient.id ? updatedClient : c))
    );
  };

  const handleDeleteClient = (clientId: string) => {
    setClients((prev) => prev.filter((c) => c.id !== clientId));
  };

  const handleBulkImportClients = (newClients: ClientOrganization[], mode: 'APPEND' | 'REPLACE') => {
    if (mode === 'REPLACE') {
      setClients(newClients);
    } else {
      setClients((prev) => {
        const existingNames = new Set(prev.map((c) => (c?.name || '').toLowerCase()));
        const uniqueNew = newClients.filter((c) => c?.name && !existingNames.has(c.name.toLowerCase()));
        return [...prev, ...uniqueNew];
      });
    }
  };

  // Resource Directory Handlers
  const handleAddResource = (newResource: ResourceMember) => {
    setResources((prev) => [newResource, ...prev]);
  };

  const handleUpdateResource = (updatedResource: ResourceMember) => {
    setResources((prev) =>
      prev.map((r) => (r.id === updatedResource.id ? updatedResource : r))
    );
  };

  const handleDeleteResource = (resourceId: string) => {
    setResources((prev) => prev.filter((r) => r.id !== resourceId));
  };

  const handleBulkImportResources = (newResources: ResourceMember[], mode: 'APPEND' | 'REPLACE') => {
    if (mode === 'REPLACE') {
      setResources(newResources);
    } else {
      setResources((prev) => {
        const existingEmails = new Set(prev.map((r) => (r?.email || '').toLowerCase()));
        const uniqueNew = newResources.filter((r) => r?.email && !existingEmails.has(r.email.toLowerCase()));
        return [...prev, ...uniqueNew];
      });
    }
  };

  const handleResetData = () => {
    if (window.confirm('Reset all opportunities, clients, resource directory, target SLAs, and form selector dropdowns back to initial realistic demo dataset?')) {
      setOpportunities(INITIAL_OPPORTUNITIES);
      setClients(INITIAL_CLIENTS);
      setResources(INITIAL_RESOURCES);
      setFormSelectors(INITIAL_FORM_SELECTORS);
      setStageDefinitions(WORKFLOW_STAGES);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      localStorage.removeItem(CLIENT_STORAGE_KEY);
      localStorage.removeItem(RESOURCE_STORAGE_KEY);
      localStorage.removeItem(FORM_SELECTORS_STORAGE_KEY);
      localStorage.removeItem(STAGE_SLAS_STORAGE_KEY);
      setSelectedOpportunity(null);
    }
  };

  const handleExportData = () => {
    const exportBundle = {
      exportedAt: new Date().toISOString(),
      stageDefinitions,
      formSelectors,
      opportunities,
      clients,
      resources,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportBundle, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `opportunity_tracker_master_export_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleUpdateStageDefinitions = (updatedStages: StageDefinition[]) => {
    setStageDefinitions(updatedStages);
  };

  const handleUpdateFormSelectors = (newConfig: FormSelectorsConfig) => {
    setFormSelectors(newConfig);
  };

  const handleSyncFormOption = (
    category: any,
    option: { label: string; value: string; color?: string; description?: string }
  ) => {
    if (!option.label || !option.label.trim()) return;
    const labelTrimmed = option.label.trim();
    const valueTrimmed = (option.value || option.label).trim();

    setFormSelectors((prev) => {
      let categoryKey: keyof FormSelectorsConfig = 'industries';
      if (category === 'industry' || category === 'industries') categoryKey = 'industries';
      else if (category === 'division' || category === 'divisions') categoryKey = 'divisions';
      else if (category === 'department' || category === 'departments' || category === 'businessUnit') categoryKey = 'departments';
      else if (category === 'role' || category === 'roles') categoryKey = 'roles';
      else if (category === 'priority' || category === 'priorities') categoryKey = 'priorities';
      else if (category === 'opportunityStatus' || category === 'opportunityStatuses') categoryKey = 'opportunityStatuses';
      else if (category === 'clientProfile' || category === 'clientProfiles') categoryKey = 'clientProfiles';
      else if (category === 'contractType' || category === 'contractTypes') categoryKey = 'contractTypes';

      const currentList = prev[categoryKey] || [];
      const exists = currentList.some(
        (item) =>
          item.label.toLowerCase() === labelTrimmed.toLowerCase() ||
          item.value.toLowerCase() === valueTrimmed.toLowerCase()
      );

      if (exists) return prev;

      const newItem = {
        id: `${category}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        label: labelTrimmed,
        value: valueTrimmed,
        color: option.color || 'blue',
        description: option.description,
        isActive: true,
        isDefault: false,
        order: currentList.length + 1,
      };

      return {
        ...prev,
        [categoryKey]: [...currentList, newItem],
      };
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Navigation Header */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={(role) => setCurrentRole(role)}
        pendingCountsByRole={pendingCountsByRole}
        onOpenNewModal={() => setIsNewModalOpen(true)}
        onOpenAiAssistant={() => setIsAiModalOpen(true)}
        onResetData={handleResetData}
        onExportData={handleExportData}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Real-time Stakeholder Dashboard & KPI Funnel */}
        <StakeholderDashboard
          opportunities={opportunities}
          currentRole={currentRole}
          selectedStageFilter={selectedStageFilter}
          stageDefinitions={stageDefinitions}
          onSelectStageFilter={(stage) => setSelectedStageFilter(stage)}
          onSelectOpportunity={(opp) => setSelectedOpportunity(opp)}
        />

        {/* Opportunity Data Table / Kanban List */}
        <OpportunityList
          opportunities={opportunities}
          currentRole={currentRole}
          selectedStageFilter={selectedStageFilter}
          formSelectors={formSelectors}
          stageDefinitions={stageDefinitions}
          onSelectOpportunity={(opp) => setSelectedOpportunity(opp)}
          onOpenNewOpportunity={() => setIsNewModalOpen(true)}
        />

        {/* Admin Section: Resource Directory, Client Directory, Target SLAs, Form Selector Admin, Export, and Reset */}
        <AdminSection
          clients={clients}
          resources={resources}
          opportunities={opportunities}
          formSelectors={formSelectors}
          stageDefinitions={stageDefinitions}
          onUpdateStageDefinitions={handleUpdateStageDefinitions}
          onUpdateFormSelectors={handleUpdateFormSelectors}
          onSyncFormOption={handleSyncFormOption}
          onAddClient={handleAddClient}
          onUpdateClient={handleUpdateClient}
          onDeleteClient={handleDeleteClient}
          onBulkImportClients={handleBulkImportClients}
          onAddResource={handleAddResource}
          onUpdateResource={handleUpdateResource}
          onDeleteResource={handleDeleteResource}
          onBulkImportResources={handleBulkImportResources}
          onExportData={handleExportData}
          onResetData={handleResetData}
          onSelectOpportunity={(opp) => setSelectedOpportunity(opp)}
        />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-4 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            End-to-End Enterprise Opportunity Tracker • 14 Lifecycle Stages & Organization Directory
          </div>
          <div className="flex items-center space-x-3">
            <span>Sales Intake → Contracts & Finance → DocuSign WIN → PMO CWC → Billing</span>
          </div>
        </div>
      </footer>

      {/* Detail / Action Cockpit Modal */}
      <OpportunityDetailModal
        opportunity={selectedOpportunity}
        currentRole={currentRole}
        formSelectors={formSelectors}
        clients={clients}
        resources={resources}
        stageDefinitions={stageDefinitions}
        onAddResource={handleAddResource}
        onClose={() => setSelectedOpportunity(null)}
        onUpdateOpportunity={handleUpdateOpportunity}
        onAdvanceStage={handleAdvanceStage}
      />

      {/* New Opportunity Intake Modal */}
      <NewOpportunityModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCreate={handleCreateOpportunity}
        clients={clients}
        resources={resources}
        formSelectors={formSelectors}
      />

      {/* AI Deal Desk Advisor Modal */}
      <AIAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        opportunities={opportunities}
      />
    </div>
  );
}
