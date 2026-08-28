import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Opportunity, WorkflowStage, StakeholderRole, ClientOrganization, ResourceMember, FormSelectorsConfig, StageDefinition, AuditLogEntry } from './types';
import { INITIAL_OPPORTUNITIES } from './data/mockOpportunities';
import { INITIAL_CLIENTS } from './data/mockClients';
import { INITIAL_RESOURCES } from './data/mockResources';
import { INITIAL_FORM_SELECTORS } from './data/mockFormSelectors';
import { STAGE_MAP, WORKFLOW_STAGES, ensureValid15Stages } from './data/stages';
import { Navbar } from './components/Navbar';
import { StakeholderDashboard } from './components/StakeholderDashboard';
import { OpportunityList } from './components/OpportunityList';
import { OpportunityDetailModal } from './components/OpportunityDetailModal';
import { NewOpportunityModal } from './components/NewOpportunityModal';
import { AIAssistantModal } from './components/AIAssistantModal';
import { AdminSection } from './components/AdminSection';
import { 
  seedInitialFirestoreDataIfEmpty,
  subscribeOpportunities,
  subscribeClients,
  subscribeResources,
  subscribeFormSelectors,
  subscribeStageDefinitions,
  saveOpportunityToDb,
  deleteOpportunityFromDb,
  saveClientToDb,
  deleteClientFromDb,
  saveResourceToDb,
  deleteResourceFromDb,
  saveFormSelectorsToDb,
  saveStageDefinitionsToDb,
  resetFirestoreToDemoData
} from './lib/firebase';

const LOCAL_STORAGE_KEY = 'e2e_opportunity_tracker_data_v1';
const CLIENT_STORAGE_KEY = 'e2e_client_directory_v1';
const RESOURCE_STORAGE_KEY = 'e2e_resource_directory_v1';
const FORM_SELECTORS_STORAGE_KEY = 'e2e_form_selectors_config_v1';
const STAGE_SLAS_STORAGE_KEY = 'e2e_workflow_stage_slas_v1';

export default function App() {
  // Database status
  const [dbStatus, setDbStatus] = useState<'CONNECTING' | 'CONNECTED' | 'SYNCING' | 'ERROR' | 'OFFLINE'>('CONNECTING');
  const isInitialMount = useRef(true);

  // Target SLAs & Workflow Stages State
  const [stageDefinitions, setStageDefinitions] = useState<StageDefinition[]>(() => {
    try {
      const saved = localStorage.getItem(STAGE_SLAS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return ensureValid15Stages(parsed);
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

  // Initialize and subscribe to Cloud Firestore
  useEffect(() => {
    let unsubscribeOpps: (() => void) | undefined;
    let unsubscribeClients: (() => void) | undefined;
    let unsubscribeResources: (() => void) | undefined;
    let unsubscribeSelectors: (() => void) | undefined;
    let unsubscribeStages: (() => void) | undefined;

    const initDb = async () => {
      try {
        setDbStatus('CONNECTING');
        await seedInitialFirestoreDataIfEmpty();

        unsubscribeOpps = subscribeOpportunities(
          (dbOpps) => {
            if (dbOpps && dbOpps.length > 0) {
              setOpportunities(dbOpps);
            }
            setDbStatus('CONNECTED');
          },
          (err) => {
            console.error('Firestore opps error:', err);
            setDbStatus('ERROR');
          }
        );

        unsubscribeClients = subscribeClients(
          (dbClients) => {
            if (dbClients && dbClients.length > 0) {
              setClients(dbClients);
            }
          },
          (err) => console.error('Firestore clients error:', err)
        );

        unsubscribeResources = subscribeResources(
          (dbResources) => {
            if (dbResources && dbResources.length > 0) {
              setResources(dbResources);
            }
          },
          (err) => console.error('Firestore resources error:', err)
        );

        unsubscribeSelectors = subscribeFormSelectors(
          (dbSelectors) => {
            if (dbSelectors && typeof dbSelectors === 'object') {
              setFormSelectors(dbSelectors);
            }
          },
          (err) => console.error('Firestore selectors error:', err)
        );

        unsubscribeStages = subscribeStageDefinitions(
          (dbStages) => {
            if (dbStages && Array.isArray(dbStages) && dbStages.length > 0) {
              const validated = ensureValid15Stages(dbStages);
              setStageDefinitions(validated);
              if (dbStages.length !== WORKFLOW_STAGES.length) {
                saveStageDefinitionsToDb(validated);
              }
            }
          },
          (err) => console.error('Firestore stages error:', err)
        );

      } catch (err) {
        console.error('Firestore database initialization error:', err);
        setDbStatus('ERROR');
      }
    };

    initDb();

    return () => {
      if (unsubscribeOpps) unsubscribeOpps();
      if (unsubscribeClients) unsubscribeClients();
      if (unsubscribeResources) unsubscribeResources();
      if (unsubscribeSelectors) unsubscribeSelectors();
      if (unsubscribeStages) unsubscribeStages();
    };
  }, []);

  // Sync to local storage as fallback offline cache
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

  // Opportunity Handlers with Cloud DB synchronization
  const handleUpdateOpportunity = async (updated: Opportunity) => {
    const updatedWithTime: Opportunity = { ...updated, updatedAt: new Date().toISOString() };
    setOpportunities((prev) =>
      prev.map((opp) => (opp.id === updated.id ? updatedWithTime : opp))
    );
    if (selectedOpportunity?.id === updated.id) {
      setSelectedOpportunity(updatedWithTime);
    }

    try {
      await saveOpportunityToDb(updatedWithTime);
    } catch (err) {
      console.error('Failed to persist opportunity update to Firestore:', err);
    }
  };

  const handleAdvanceStage = async (
    oppId: string,
    nextStage: WorkflowStage,
    actionName: string,
    comments: string,
    extraUpdates?: Partial<Opportunity>
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

    let updatedRecord: Opportunity | null = null;

    setOpportunities((prev) =>
      prev.map((opp) => {
        if (opp.id !== oppId) return opp;

        const baseMerged = extraUpdates ? { ...opp, ...extraUpdates } : opp;
        const newHistoryEntry = createHistoryEntry(baseMerged.dealValue, baseMerged.currency);

        const updated = {
          ...baseMerged,
          currentStage: nextStage,
          stageEnteredAt: now,
          updatedAt: now,
          history: [...(baseMerged.history || []), newHistoryEntry],
        };
        updatedRecord = updated;
        return updated;
      })
    );

    setSelectedOpportunity((prev) => {
      if (!prev || prev.id !== oppId) return prev;
      const baseMerged = extraUpdates ? { ...prev, ...extraUpdates } : prev;
      const newHistoryEntry = createHistoryEntry(baseMerged.dealValue, baseMerged.currency);
      return {
        ...baseMerged,
        currentStage: nextStage,
        stageEnteredAt: now,
        updatedAt: now,
        history: [...(baseMerged.history || []), newHistoryEntry],
      };
    });

    if (updatedRecord) {
      try {
        await saveOpportunityToDb(updatedRecord);
      } catch (err) {
        console.error('Failed to persist stage progression to Firestore:', err);
      }
    }
  };

  const handleCreateOpportunity = async (newOpp: Opportunity) => {
    setOpportunities((prev) => [newOpp, ...prev]);
    setSelectedOpportunity(newOpp);
    try {
      await saveOpportunityToDb(newOpp);
    } catch (err) {
      console.error('Failed to persist new opportunity to Firestore:', err);
    }
  };

  // Client Directory Handlers with Cloud DB synchronization
  const handleAddClient = async (newClient: ClientOrganization) => {
    setClients((prev) => [newClient, ...prev]);
    try {
      await saveClientToDb(newClient);
    } catch (err) {
      console.error('Failed to save client to Firestore:', err);
    }
  };

  const handleUpdateClient = async (updatedClient: ClientOrganization) => {
    setClients((prev) =>
      prev.map((c) => (c.id === updatedClient.id ? updatedClient : c))
    );
    try {
      await saveClientToDb(updatedClient);
    } catch (err) {
      console.error('Failed to update client in Firestore:', err);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    setClients((prev) => prev.filter((c) => c.id !== clientId));
    try {
      await deleteClientFromDb(clientId);
    } catch (err) {
      console.error('Failed to delete client from Firestore:', err);
    }
  };

  const handleBulkImportClients = async (newClients: ClientOrganization[], mode: 'APPEND' | 'REPLACE') => {
    if (mode === 'REPLACE') {
      setClients(newClients);
      for (const client of newClients) {
        saveClientToDb(client).catch(console.error);
      }
    } else {
      setClients((prev) => {
        const existingNames = new Set(prev.map((c) => (c?.name || '').toLowerCase()));
        const uniqueNew = newClients.filter((c) => c?.name && !existingNames.has(c.name.toLowerCase()));
        uniqueNew.forEach((c) => saveClientToDb(c).catch(console.error));
        return [...prev, ...uniqueNew];
      });
    }
  };

  // Resource Directory Handlers with Cloud DB synchronization
  const handleAddResource = async (newResource: ResourceMember) => {
    setResources((prev) => [newResource, ...prev]);
    try {
      await saveResourceToDb(newResource);
    } catch (err) {
      console.error('Failed to save resource to Firestore:', err);
    }
  };

  const handleUpdateResource = async (updatedResource: ResourceMember) => {
    setResources((prev) =>
      prev.map((r) => (r.id === updatedResource.id ? updatedResource : r))
    );
    try {
      await saveResourceToDb(updatedResource);
    } catch (err) {
      console.error('Failed to update resource in Firestore:', err);
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    setResources((prev) => prev.filter((r) => r.id !== resourceId));
    try {
      await deleteResourceFromDb(resourceId);
    } catch (err) {
      console.error('Failed to delete resource from Firestore:', err);
    }
  };

  const handleBulkImportResources = async (newResources: ResourceMember[], mode: 'APPEND' | 'REPLACE') => {
    if (mode === 'REPLACE') {
      setResources(newResources);
      for (const res of newResources) {
        saveResourceToDb(res).catch(console.error);
      }
    } else {
      setResources((prev) => {
        const existingEmails = new Set(prev.map((r) => (r?.email || '').toLowerCase()));
        const uniqueNew = newResources.filter((r) => r?.email && !existingEmails.has(r.email.toLowerCase()));
        uniqueNew.forEach((r) => saveResourceToDb(r).catch(console.error));
        return [...prev, ...uniqueNew];
      });
    }
  };

  const handleResetData = async () => {
    if (window.confirm('Reset all opportunities, clients, resource directory, target SLAs, and form selector dropdowns in the Cloud Database back to initial realistic demo dataset?')) {
      setDbStatus('SYNCING');
      try {
        await resetFirestoreToDemoData();
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
        setDbStatus('CONNECTED');
      } catch (err) {
        console.error('Failed to reset cloud database:', err);
        setDbStatus('ERROR');
      }
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

  const handleUpdateStageDefinitions = async (updatedStages: StageDefinition[]) => {
    setStageDefinitions(updatedStages);
    try {
      await saveStageDefinitionsToDb(updatedStages);
    } catch (err) {
      console.error('Failed to save stage definitions to Firestore:', err);
    }
  };

  const handleUpdateFormSelectors = async (newConfig: FormSelectorsConfig) => {
    setFormSelectors(newConfig);
    try {
      await saveFormSelectorsToDb(newConfig);
    } catch (err) {
      console.error('Failed to save form selectors to Firestore:', err);
    }
  };

  const handleSyncFormOption = async (
    category: any,
    option: { label: string; value: string; color?: string; description?: string }
  ) => {
    if (!option.label || !option.label.trim()) return;
    const labelTrimmed = option.label.trim();
    const valueTrimmed = (option.value || option.label).trim();

    let updatedConfig: FormSelectorsConfig | null = null;

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

      const next = {
        ...prev,
        [categoryKey]: [...currentList, newItem],
      };
      updatedConfig = next;
      return next;
    });

    if (updatedConfig) {
      try {
        await saveFormSelectorsToDb(updatedConfig);
      } catch (err) {
        console.error('Failed to sync form option to Firestore:', err);
      }
    }
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
        dbStatus={dbStatus}
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
            End-to-End Enterprise Opportunity Tracker • 15 Lifecycle Stages & Organization Directory
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

