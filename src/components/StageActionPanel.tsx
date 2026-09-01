import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  ArrowRight, 
  CheckCircle, 
  FileText, 
  Sparkles, 
  Building, 
  Send, 
  DollarSign, 
  Briefcase, 
  Layers, 
  ShieldCheck, 
  Mail, 
  FileCheck, 
  CheckSquare, 
  AlertCircle,
  Plus,
  Trash2,
  ExternalLink,
  ChevronDown,
  Edit3,
  Check,
  X,
  UserPlus,
  UserCheck,
  Sliders,
  CheckCircle2,
  RotateCcw,
  Link2,
  Coins,
  Calendar,
  Building2,
  User,
  Info,
  ChevronRight,
  Clock,
  Calculator,
  AlertTriangle,
  FileSignature,
  Handshake
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Opportunity, WorkflowStage, StakeholderRole, FormSelectorsConfig, ClientOrganization, ResourceMember } from '../types';
import { STAGE_MAP } from '../data/stages';
import { formatCurrency, formatDate } from '../utils/formatters';
import { SUPPORTED_CURRENCIES } from './NewOpportunityModal';
import { ClientProposalUpdatePanel } from './ClientProposalUpdatePanel';

interface StageActionPanelProps {
  opportunity: Opportunity;
  currentRole: StakeholderRole;
  formSelectors?: FormSelectorsConfig;
  clients?: ClientOrganization[];
  resources?: ResourceMember[];
  onAddResource?: (newResource: ResourceMember) => void;
  onUpdateOpportunity: (updated: Opportunity) => void;
  onAdvanceStage: (nextStage: WorkflowStage, actionName: string, comments: string, extraUpdates?: Partial<Opportunity>) => void;
  onRejectStage?: (prevStage: WorkflowStage, reason: string) => void;
}

export const StageActionPanel: React.FC<StageActionPanelProps> = ({
  opportunity,
  currentRole,
  formSelectors,
  clients = [],
  resources = [],
  onAddResource,
  onUpdateOpportunity,
  onAdvanceStage,
  onRejectStage,
}) => {
  const currentStage = opportunity.currentStage;
  const stageDef = STAGE_MAP[currentStage];
  
  const [comments, setComments] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Stage 1 specific states
  const [isEditingStage1, setIsEditingStage1] = useState(false);
  const [stage1Section, setStage1Section] = useState<'ALL' | 'STAKEHOLDERS' | 'COMMERCIALS' | 'SOLUTION_VENDOR'>('ALL');
  const [showCustomSalesModal, setShowCustomSalesModal] = useState(false);
  const [customSalesForm, setCustomSalesForm] = useState({
    name: '',
    role: 'Senior Enterprise Account Executive',
    department: 'Sales & Commercial',
    division: opportunity.division || 'Financial Services & FinTech',
    email: '',
    contactNumber: '',
  });

  const [showCustomSaModal, setShowCustomSaModal] = useState(false);
  const [customSaForm, setCustomSaForm] = useState({
    name: '',
    role: 'Lead Cloud Solutions Architect',
    department: 'Solutions Architecture & Pre-Sales',
    division: opportunity.division || 'Enterprise Cloud & Infrastructure',
    email: '',
    contactNumber: '',
  });

  const [newDeliverableText, setNewDeliverableText] = useState('');
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Revert back to Stage 1 modal state
  const [showReturnToStage1Modal, setShowReturnToStage1Modal] = useState(false);
  const [returnToStage1Reason, setReturnToStage1Reason] = useState('');
  const [returnToStage1Error, setReturnToStage1Error] = useState('');

  const handleConfirmReturnToStage1 = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedReason = returnToStage1Reason.trim();
    if (!trimmedReason) {
      setReturnToStage1Error('Please specify a required reason for returning this opportunity to Stage 1.');
      return;
    }

    onAdvanceStage(
      'OPPORTUNITY_INTAKE',
      'Returned to Sales Intake',
      trimmedReason
    );
    setShowReturnToStage1Modal(false);
    setReturnToStage1Reason('');
    setReturnToStage1Error('');
  };

  // Revert back to Stage 2 modal state
  const [showReturnToStage2Modal, setShowReturnToStage2Modal] = useState(false);
  const [returnToStage2Reason, setReturnToStage2Reason] = useState('');
  const [returnToStage2Error, setReturnToStage2Error] = useState('');

  const handleConfirmReturnToStage2 = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedReason = returnToStage2Reason.trim();
    if (!trimmedReason) {
      setReturnToStage2Error('Please specify a required reason for returning this opportunity to Stage 2 (Solution Design).');
      return;
    }

    onAdvanceStage(
      'SOLUTION_DESIGN',
      'Returned to Solution Design',
      trimmedReason
    );
    setShowReturnToStage2Modal(false);
    setReturnToStage2Reason('');
    setReturnToStage2Error('');
  };

  // Revert back to Stage 3 modal state
  const [showReturnToStage3Modal, setShowReturnToStage3Modal] = useState(false);
  const [returnToStage3Reason, setReturnToStage3Reason] = useState('');
  const [returnToStage3Error, setReturnToStage3Error] = useState('');

  const handleConfirmReturnToStage3 = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedReason = returnToStage3Reason.trim();
    if (!trimmedReason) {
      setReturnToStage3Error('Please specify a required reason for returning this opportunity to Sales for update.');
      return;
    }

    onAdvanceStage(
      'SALES_PROPOSAL_REVIEW',
      'Returned to Sales for Update',
      trimmedReason
    );
    setShowReturnToStage3Modal(false);
    setReturnToStage3Reason('');
    setReturnToStage3Error('');
  };

  // Revert back to Stage 4 modal state (Finance to Contracts Team)
  const [showReturnToStage4Modal, setShowReturnToStage4Modal] = useState(false);
  const [returnToStage4Reason, setReturnToStage4Reason] = useState('');
  const [returnToStage4Error, setReturnToStage4Error] = useState('');

  const handleConfirmReturnToStage4 = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedReason = returnToStage4Reason.trim();
    if (!trimmedReason) {
      setReturnToStage4Error('Please specify a required reason for returning this opportunity to Contracts Team for update/clarification.');
      return;
    }

    onAdvanceStage(
      'CONTRACTS_PROPOSAL_REVIEW',
      'Returned to Contracts Team for Update/Clarification',
      trimmedReason
    );
    setShowReturnToStage4Modal(false);
    setReturnToStage4Reason('');
    setReturnToStage4Error('');
  };

  // Revert back to Stage 6 modal state (Stage 7 to Contracts Team Endorsement for Review)
  const [showReturnToStage6Modal, setShowReturnToStage6Modal] = useState(false);
  const [returnToStage6Reason, setReturnToStage6Reason] = useState('');
  const [returnToStage6Error, setReturnToStage6Error] = useState('');

  const handleConfirmReturnToStage6 = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedReason = returnToStage6Reason.trim();
    if (!trimmedReason) {
      setReturnToStage6Error('Please specify a required reason for returning this opportunity to Stage 6 (Contracts Team for Review).');
      return;
    }

    onAdvanceStage(
      'CONTRACTS_PROPOSAL_ENDORSEMENT',
      'Returned to Contracts Team for Review',
      trimmedReason
    );
    setShowReturnToStage6Modal(false);
    setReturnToStage6Reason('');
    setReturnToStage6Error('');
  };

  const activeContractTypes = (formSelectors?.contractTypes || []).filter((c) => c.isActive !== false);

  const activeIndustries = useMemo(
    () => (formSelectors?.industries || []).filter((i) => i.isActive !== false),
    [formSelectors]
  );
  const activeDepartments = useMemo(
    () => (formSelectors?.departments || []).filter((d) => d.isActive !== false),
    [formSelectors]
  );
  const activeDivisions = useMemo(
    () => (formSelectors?.divisions || []).filter((div) => div.isActive !== false),
    [formSelectors]
  );
  const activeServicePillars = useMemo(
    () => (formSelectors?.servicePillars || []).filter((sp) => sp.isActive !== false),
    [formSelectors]
  );
  const activePriorities = useMemo(
    () => (formSelectors?.priorities || []).filter((p) => p.isActive !== false),
    [formSelectors]
  );
  const activeStatuses = useMemo(
    () => (formSelectors?.opportunityStatuses || []).filter((s) => s.isActive !== false),
    [formSelectors]
  );

  // Sales resources
  const salesResources = useMemo(() => {
    return resources.filter((r) => {
      const role = (r.role || '').toLowerCase();
      const dept = (r.department || '').toLowerCase();
      return role.includes('sales') || role.includes('account') || role.includes('commercial') || dept.includes('sales') || dept.includes('commercial');
    });
  }, [resources]);

  const nonSalesResources = useMemo(() => {
    return resources.filter((r) => {
      const role = (r.role || '').toLowerCase();
      const dept = (r.department || '').toLowerCase();
      return !(role.includes('sales') || role.includes('account') || role.includes('commercial') || dept.includes('sales') || dept.includes('commercial'));
    });
  }, [resources]);

  // Architect & BU Owner resources
  const architectResources = useMemo(() => {
    return resources.filter((r) => {
      const role = (r.role || '').toLowerCase();
      const dept = (r.department || '').toLowerCase();
      return role.includes('architect') || role.includes('solution') || role.includes('bu') || role.includes('technical') || role.includes('vp') || dept.includes('architecture') || dept.includes('pre-sales') || dept.includes('engineering');
    });
  }, [resources]);

  const nonArchitectResources = useMemo(() => {
    return resources.filter((r) => {
      const role = (r.role || '').toLowerCase();
      const dept = (r.department || '').toLowerCase();
      return !(role.includes('architect') || role.includes('solution') || role.includes('bu') || role.includes('technical') || role.includes('vp') || dept.includes('architecture') || dept.includes('pre-sales') || dept.includes('engineering'));
    });
  }, [resources]);

  // Handlers for Custom Stakeholder Quick Add & Sync to Resource Repository
  const handleSaveCustomSalesLead = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customSalesForm.name.trim()) return;

    const newResource: ResourceMember = {
      id: `res-${Date.now()}`,
      name: customSalesForm.name.trim(),
      role: customSalesForm.role.trim() || 'Senior Enterprise Account Executive',
      department: customSalesForm.department.trim() || 'Sales & Commercial',
      division: customSalesForm.division.trim() || opportunity.division || 'Financial Services & FinTech',
      email: customSalesForm.email.trim() || `${customSalesForm.name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@enterprise-solutions.com`,
      contactNumber: customSalesForm.contactNumber.trim() || '+1 (555) 000-0000',
      remarks: `Added via Opportunity Intake (${opportunity.trackingCode})`,
      createdAt: new Date().toISOString(),
    };

    if (onAddResource) {
      onAddResource(newResource);
    }
    onUpdateOpportunity({
      ...opportunity,
      salesLead: newResource.name,
    });
    setShowCustomSalesModal(false);
    setCustomSalesForm({
      name: '',
      role: 'Senior Enterprise Account Executive',
      department: 'Sales & Commercial',
      division: opportunity.division || '',
      email: '',
      contactNumber: '',
    });
    setSyncToast(`Sales Lead "${newResource.name}" added and synced to Resource Repository!`);
    setTimeout(() => setSyncToast(null), 4000);
  };

  const handleSaveCustomSa = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customSaForm.name.trim()) return;

    const newResource: ResourceMember = {
      id: `res-${Date.now()}`,
      name: customSaForm.name.trim(),
      role: customSaForm.role.trim() || 'Lead Cloud Solutions Architect',
      department: customSaForm.department.trim() || 'Solutions Architecture & Pre-Sales',
      division: customSaForm.division.trim() || opportunity.division || 'Enterprise Cloud & Infrastructure',
      email: customSaForm.email.trim() || `${customSaForm.name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@enterprise-solutions.com`,
      contactNumber: customSaForm.contactNumber.trim() || '+1 (555) 000-0000',
      remarks: `Added via Opportunity Intake (${opportunity.trackingCode})`,
      createdAt: new Date().toISOString(),
    };

    if (onAddResource) {
      onAddResource(newResource);
    }
    onUpdateOpportunity({
      ...opportunity,
      solutionArchitect: newResource.name,
      buOwner: newResource.name,
    });
    setShowCustomSaModal(false);
    setCustomSaForm({
      name: '',
      role: 'Lead Cloud Solutions Architect',
      department: 'Solutions Architecture & Pre-Sales',
      division: opportunity.division || '',
      email: '',
      contactNumber: '',
    });
    setSyncToast(`Solution Architect / BU Owner "${newResource.name}" added and synced to Resource Repository!`);
    setTimeout(() => setSyncToast(null), 4000);
  };

  // Deliverables helpers
  const handleAddDeliverable = () => {
    if (!newDeliverableText.trim()) return;
    const currentDeliverables = opportunity.solutionProposal?.deliverables || [];
    onUpdateOpportunity({
      ...opportunity,
      solutionProposal: {
        ...opportunity.solutionProposal,
        deliverables: [...currentDeliverables, newDeliverableText.trim()],
      },
    });
    setNewDeliverableText('');
  };

  const handleRemoveDeliverable = (index: number) => {
    const currentDeliverables = opportunity.solutionProposal?.deliverables || [];
    onUpdateOpportunity({
      ...opportunity,
      solutionProposal: {
        ...opportunity.solutionProposal,
        deliverables: currentDeliverables.filter((_, i) => i !== index),
      },
    });
  };

  // Helper to trigger confetti on WIN broadcast
  const triggerWinConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  // AI Proposal Generator
  const handleGenerateAiProposal = async () => {
    setIsAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/gemini/generate-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunity }),
      });
      const data = await res.json();
      
      const updated = {
        ...opportunity,
        solutionProposal: {
          ...opportunity.solutionProposal,
          solutionDocName: `${opportunity.clientName.replace(/\s+/g, '_')}_Solution_Proposal_v1.0.pdf`,
          architectureSummary: data.technicalArchitecture || data.executiveSummary,
          deliverables: data.scopeDeliverables || [
            'Architecture Blueprint & Security Configuration',
            'Core Service Implementation & Integration',
            'UAT Testing & User Training',
            'Go-Live & Hypercare Support',
          ],
          solutionArchitectNotes: `AI Presales Proposal generated. Recommended Pricing: ${data.recommendedPricing || 'Standard'}`,
        },
      };
      onUpdateOpportunity(updated);
    } catch (err: any) {
      console.error(err);
      setAiError('Failed to generate with AI. Using smart fallback proposal.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // AI Win Email Generator
  const handleGenerateAiWinEmail = async () => {
    setIsAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/gemini/draft-win-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunity }),
      });
      const data = await res.json();
      
      const updated = {
        ...opportunity,
        winNotification: {
          ...opportunity.winNotification,
          emailSubject: data.subject || `🎉 WIN ANNOUNCEMENT: ${opportunity.clientName} - ${opportunity.title}`,
          emailBody: data.body || `Dear Team,\n\nWe are delighted to announce that ${opportunity.clientName} has signed the ${opportunity.title} contract for $${opportunity.dealValue.toLocaleString()} ${opportunity.currency}!`,
        },
      };
      onUpdateOpportunity(updated);
    } catch (err: any) {
      console.error(err);
      setAiError('Could not contact AI service. Using standard WIN announcement template.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Render individual stage action forms
  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-5">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
        <div className="flex items-center space-x-2.5">
          <span className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
            {stageDef?.index}
          </span>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Current Action: {stageDef?.label}
            </h4>
            <p className="text-xs text-slate-500">
              Assigned Actor: <span className="font-semibold text-blue-700">{stageDef?.actorLabel}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
            Target SLA: {stageDef?.targetSlaDays} Days
          </span>
        </div>
      </div>

      {aiError && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 shrink-0 text-amber-600" />
          {aiError}
        </div>
      )}

      {/* Sync Notification Toast */}
      {syncToast && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{syncToast}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setSyncToast(null)}
            className="text-emerald-700 hover:text-emerald-900 p-0.5 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* STAGE 1: OPPORTUNITY INTAKE */}
      {currentStage === 'OPPORTUNITY_INTAKE' && (
        <div className="space-y-4">
          
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  Stage 1 Cockpit
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  {isEditingStage1 ? 'Editing Opportunity Intake & Scope' : 'Sales Intake & Qualification'}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEditingStage1 
                  ? 'Update commercials, assigned lead, SA/BU owner, and vendor procurement details directly.'
                  : 'Review deal parameters, assign stakeholders, and hand off to Solution Architecture.'}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsEditingStage1(!isEditingStage1)}
                className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs ${
                  isEditingStage1
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:text-blue-700'
                }`}
              >
                {isEditingStage1 ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1.5" />
                    Done Editing
                  </>
                ) : (
                  <>
                    <Edit3 className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                    Edit Stage 1 Details
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Stakeholders Bar (Always visible with live dropdowns & sync) */}
          <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-xl p-4 border border-blue-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                  Assigned Opportunity Stakeholders (Synced to Resource Repository)
                </h4>
              </div>
              <span className="text-[11px] text-blue-600 font-medium hidden sm:inline-block">
                Auto-syncs across workflow & repository
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Field 1: Assigned Sales Lead */}
              <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center">
                    <User className="w-3 h-3 mr-1 text-slate-500" />
                    Assigned Sales Lead
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCustomSalesModal(true)}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                  >
                    <Plus className="w-3 h-3 mr-0.5" />
                    + New Resource
                  </button>
                </div>
                <select
                  value={opportunity.salesLead || ''}
                  onChange={(e) => {
                    if (e.target.value === '__CUSTOM__') {
                      setShowCustomSalesModal(true);
                    } else {
                      onUpdateOpportunity({
                        ...opportunity,
                        salesLead: e.target.value,
                      });
                    }
                  }}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                >
                  <option value="" disabled>-- Select Sales Lead --</option>
                  {salesResources.length > 0 && (
                    <optgroup label="Sales & Commercial Team">
                      {salesResources.map((res) => (
                        <option key={res.id} value={res.name}>
                          {res.name} — {res.role} ({res.department})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {nonSalesResources.length > 0 && (
                    <optgroup label="Other Repository Members">
                      {nonSalesResources.map((res) => (
                        <option key={res.id} value={res.name}>
                          {res.name} — {res.role} ({res.department})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <option value="__CUSTOM__" className="font-bold text-blue-600">
                    + Add Custom Sales Lead (Sync to Resource Repo)...
                  </option>
                </select>
                <div className="text-[10px] text-slate-500 flex items-center justify-between pt-0.5">
                  <span>Current: <strong className="text-slate-800">{opportunity.salesLead || 'None'}</strong></span>
                  <span className="text-emerald-700 font-semibold flex items-center">
                    <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> Synced
                  </span>
                </div>
              </div>

              {/* Field 2: Solution Architect / BU Owner */}
              <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center">
                    <Building2 className="w-3 h-3 mr-1 text-slate-500" />
                    Solution Architect / BU Owner
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCustomSaModal(true)}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                  >
                    <Plus className="w-3 h-3 mr-0.5" />
                    + New Resource
                  </button>
                </div>
                <select
                  value={opportunity.solutionArchitect || opportunity.buOwner || ''}
                  onChange={(e) => {
                    if (e.target.value === '__CUSTOM__') {
                      setShowCustomSaModal(true);
                    } else {
                      onUpdateOpportunity({
                        ...opportunity,
                        solutionArchitect: e.target.value,
                        buOwner: e.target.value,
                      });
                    }
                  }}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                >
                  <option value="">-- Unassigned (Select Architect / BU Owner) --</option>
                  {architectResources.length > 0 && (
                    <optgroup label="Architecture & BU Leadership">
                      {architectResources.map((res) => (
                        <option key={res.id} value={res.name}>
                          {res.name} — {res.role} ({res.department})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {nonArchitectResources.length > 0 && (
                    <optgroup label="Other Repository Members">
                      {nonArchitectResources.map((res) => (
                        <option key={res.id} value={res.name}>
                          {res.name} — {res.role} ({res.department})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <option value="__CUSTOM__" className="font-bold text-blue-600">
                    + Add Custom SA / BU Owner (Sync to Resource Repo)...
                  </option>
                </select>
                <div className="text-[10px] text-slate-500 flex items-center justify-between pt-0.5">
                  <span>Current: <strong className="text-blue-700">{opportunity.solutionArchitect || opportunity.buOwner || 'Unassigned'}</strong></span>
                  <span className="text-emerald-700 font-semibold flex items-center">
                    <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> Synced
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* EDIT MODE: FULL INTAKE EDITOR */}
          {isEditingStage1 ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Sub-section Navigation Tabs */}
              <div className="flex items-center space-x-1 border-b border-slate-200 pb-1">
                <button
                  type="button"
                  onClick={() => setStage1Section('ALL')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    stage1Section === 'ALL'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  All Sections
                </button>
                <button
                  type="button"
                  onClick={() => setStage1Section('COMMERCIALS')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    stage1Section === 'COMMERCIALS'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  Commercials & Scope
                </button>
                <button
                  type="button"
                  onClick={() => setStage1Section('SOLUTION_VENDOR')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    stage1Section === 'SOLUTION_VENDOR'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  Solution & Vendor PR/PO
                </button>
              </div>

              {/* SECTION A: COMMERCIALS & SCOPE */}
              {(stage1Section === 'ALL' || stage1Section === 'COMMERCIALS') && (
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                        Commercial Parameters & Scope Definition
                      </h4>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      Commercials
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* Opportunity Title */}
                    <div className="md:col-span-2 space-y-1">
                      <label className="font-semibold text-slate-700 block">Opportunity Title</label>
                      <input
                        type="text"
                        value={opportunity.title}
                        onChange={(e) => onUpdateOpportunity({ ...opportunity, title: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white"
                        placeholder="e.g. Core Banking Cloud Modernization"
                      />
                    </div>

                    {/* Client Name & Industry */}
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Client Organization</label>
                      <input
                        type="text"
                        value={opportunity.clientName}
                        onChange={(e) => onUpdateOpportunity({ ...opportunity, clientName: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Client Industry</label>
                      <select
                        value={opportunity.clientIndustry || ''}
                        onChange={(e) => onUpdateOpportunity({ ...opportunity, clientIndustry: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      >
                        <option value="Financial Services">Financial Services & Banking</option>
                        <option value="Healthcare">Healthcare & Life Sciences</option>
                        <option value="Telecommunications">Telecommunications & Media</option>
                        <option value="Retail & E-commerce">Retail & E-Commerce</option>
                        <option value="Public Sector & Govt">Public Sector & Government</option>
                        <option value="Manufacturing & Logistics">Manufacturing & Logistics</option>
                        {activeIndustries.map((ind) => (
                          <option key={ind.id} value={ind.name}>{ind.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Primary Contact Name & Email */}
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Client Primary Contact</label>
                      <input
                        type="text"
                        value={opportunity.clientContactName || ''}
                        onChange={(e) => onUpdateOpportunity({ ...opportunity, clientContactName: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                        placeholder="e.g. Maria Santos"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Client Contact Email</label>
                      <input
                        type="email"
                        value={opportunity.clientContactEmail || ''}
                        onChange={(e) => onUpdateOpportunity({ ...opportunity, clientContactEmail: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                        placeholder="contact@client.com"
                      />
                    </div>

                    {/* Deal Value & Currency */}
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Forecast Deal Value</label>
                      <input
                        type="number"
                        value={opportunity.dealValue}
                        onChange={(e) => onUpdateOpportunity({ ...opportunity, dealValue: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-emerald-800 font-bold text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Currency</label>
                      <select
                        value={opportunity.currency || 'USD'}
                        onChange={(e) => onUpdateOpportunity({ ...opportunity, currency: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      >
                        {SUPPORTED_CURRENCIES.map((curr) => (
                          <option key={curr.code} value={curr.code}>
                            {curr.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Probability & Target Close Date */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="font-semibold text-slate-700">Win Probability</label>
                        <span className="font-bold text-blue-700">{opportunity.probability}%</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="range"
                          min="10"
                          max="95"
                          step="5"
                          value={opportunity.probability}
                          onChange={(e) => onUpdateOpportunity({ ...opportunity, probability: parseInt(e.target.value, 10) })}
                          className="w-full accent-blue-600 cursor-pointer"
                        />
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={opportunity.probability}
                          onChange={(e) => onUpdateOpportunity({ ...opportunity, probability: Math.min(100, Math.max(1, parseInt(e.target.value, 10) || 0)) })}
                          className="w-14 bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-center font-bold text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Target Close Date</label>
                      <input
                        type="date"
                        value={opportunity.targetCloseDate ? opportunity.targetCloseDate.slice(0, 10) : ''}
                        onChange={(e) => onUpdateOpportunity({ ...opportunity, targetCloseDate: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>

                    {/* Priority & Opportunity Status */}
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Priority Level</label>
                      <select
                        value={opportunity.priority}
                        onChange={(e) => onUpdateOpportunity({ ...opportunity, priority: e.target.value as any })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      >
                        <option value="LOW">Low Priority</option>
                        <option value="MEDIUM">Medium Priority</option>
                        <option value="HIGH">High Priority</option>
                        <option value="CRITICAL">Critical Priority</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Opportunity Status</label>
                      <select
                        value={opportunity.opportunityStatus || 'Active / In-Pipeline'}
                        onChange={(e) => onUpdateOpportunity({ ...opportunity, opportunityStatus: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      >
                        <option value="Active / In-Pipeline">Active / In-Pipeline</option>
                        <option value="On Hold / Pending Sponsor">On Hold / Pending Sponsor</option>
                        <option value="Budgetary / Indicative Only">Budgetary / Indicative Only</option>
                        <option value="Contract Won">Contract Won</option>
                        <option value="Disqualified / Lost">Disqualified / Lost</option>
                        {activeStatuses.map((s) => (
                          <option key={s.id} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Business Unit & Service Pillar */}
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Business Unit (BU)</label>
                      <select
                        value={opportunity.businessUnit}
                        onChange={(e) => onUpdateOpportunity({ ...opportunity, businessUnit: e.target.value as any })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      >
                        <option value="CLOUD_INFRA">Cloud & Infrastructure Services</option>
                        <option value="CYBER_SECURITY">Cybersecurity & Trust</option>
                        <option value="DATA_AI">Data, AI & Analytics</option>
                        <option value="APP_DEV">Application Modernization & Dev</option>
                        <option value="MANAGED_SERVICES">Managed Services & NOC</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Service Pillar</label>
                      <select
                        value={opportunity.servicePillar || ''}
                        onChange={(e) => onUpdateOpportunity({ ...opportunity, servicePillar: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      >
                        <option value="">-- None / Blank (Optional) --</option>
                        {opportunity.servicePillar && !activeServicePillars.some((sp) => sp.value === opportunity.servicePillar) && (
                          <option value={opportunity.servicePillar}>{opportunity.servicePillar} (Current)</option>
                        )}
                        {(activeServicePillars.length > 0
                          ? activeServicePillars
                          : [
                              { id: 'sp-1', label: 'Workplace', value: 'Workplace' },
                              { id: 'sp-2', label: 'Infrastructure', value: 'Infrastructure' },
                              { id: 'sp-3', label: 'Network', value: 'Network' },
                            ]
                        ).map((sp) => (
                          <option key={sp.id} value={sp.value}>{sp.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Division</label>
                      <select
                        value={opportunity.division || 'General Operations'}
                        onChange={(e) => onUpdateOpportunity({ ...opportunity, division: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      >
                        <option value="General Operations">General Operations</option>
                        <option value="Financial Services & FinTech">Financial Services & FinTech</option>
                        <option value="Enterprise Cloud & Infrastructure">Enterprise Cloud & Infrastructure</option>
                        <option value="Government & Public Sector">Government & Public Sector</option>
                        <option value="Commercial & Mid-Market">Commercial & Mid-Market</option>
                        {activeDivisions.map((div) => (
                          <option key={div.id} value={div.name}>{div.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* TOR Reference Link */}
                    <div className="md:col-span-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="font-semibold text-slate-700 block">Terms of Reference (TOR) Reference / Scope Link</label>
                        {opportunity.torLink && (opportunity.torLink.startsWith('http://') || opportunity.torLink.startsWith('https://')) && (
                          <a
                            href={opportunity.torLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-blue-600 font-semibold hover:underline inline-flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" /> Test Link
                          </a>
                        )}
                      </div>
                      <input
                        type="text"
                        value={opportunity.torLink || ''}
                        onChange={(e) => onUpdateOpportunity({ ...opportunity, torLink: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white"
                        placeholder="https://drive.google.com/... or TOR-2026-REF-091"
                      />
                    </div>

                    {/* Scope & Description */}
                    <div className="md:col-span-2 space-y-1">
                      <label className="font-semibold text-slate-700 block">Deal Description & Scope of Work</label>
                      <textarea
                        rows={3}
                        value={opportunity.description || ''}
                        onChange={(e) => onUpdateOpportunity({ ...opportunity, description: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white"
                        placeholder="Comprehensive description of business requirements, technical scope, and deliverables..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION B: SOLUTION & VENDOR PR/PO */}
              {(stage1Section === 'ALL' || stage1Section === 'SOLUTION_VENDOR') && (
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <Layers className="w-4 h-4 text-purple-600" />
                      <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                        Solution Architecture & Vendor PR/PO Procurement
                      </h4>
                    </div>
                    <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                      Architecture & Vendor
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* Solution Document Name */}
                    <div className="md:col-span-2 space-y-1">
                      <label className="font-semibold text-slate-700 block">Solution Proposal Document Name / Reference</label>
                      <input
                        type="text"
                        value={opportunity.solutionProposal?.solutionDocName || ''}
                        onChange={(e) => onUpdateOpportunity({
                          ...opportunity,
                          solutionProposal: {
                            ...opportunity.solutionProposal,
                            solutionDocName: e.target.value,
                          },
                        })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white"
                        placeholder="e.g. MetroBank_Enterprise_Solution_Proposal_v1.0.pdf"
                      />
                    </div>

                    {/* Estimated Delivery Cost & Effort Weeks */}
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Estimated Delivery Cost</label>
                      <input
                        type="number"
                        value={opportunity.solutionProposal?.estimatedDeliveryCost || 0}
                        onChange={(e) => onUpdateOpportunity({
                          ...opportunity,
                          solutionProposal: {
                            ...opportunity.solutionProposal,
                            estimatedDeliveryCost: parseFloat(e.target.value) || 0,
                          },
                        })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-emerald-800 font-bold focus:ring-2 focus:ring-blue-500 focus:bg-white"
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Estimated Timeline / Effort (Weeks)</label>
                      <input
                        type="number"
                        value={opportunity.solutionProposal?.estimatedEffortWeeks || 0}
                        onChange={(e) => onUpdateOpportunity({
                          ...opportunity,
                          solutionProposal: {
                            ...opportunity.solutionProposal,
                            estimatedEffortWeeks: parseInt(e.target.value, 10) || 0,
                          },
                        })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                        placeholder="e.g. 12"
                      />
                    </div>

                    {/* Architecture Summary */}
                    <div className="md:col-span-2 space-y-1">
                      <label className="font-semibold text-slate-700 block">Technical Architecture Summary</label>
                      <textarea
                        rows={3}
                        value={opportunity.solutionProposal?.architectureSummary || ''}
                        onChange={(e) => onUpdateOpportunity({
                          ...opportunity,
                          solutionProposal: {
                            ...opportunity.solutionProposal,
                            architectureSummary: e.target.value,
                          },
                        })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white"
                        placeholder="Outline cloud infrastructure topology, high availability configuration, API gateways, and data pipelines..."
                      />
                    </div>

                    {/* Key Scope Deliverables (Add/Remove) */}
                    <div className="md:col-span-2 space-y-2">
                      <label className="font-semibold text-slate-700 block">Key Scope Deliverables</label>
                      <div className="space-y-1.5">
                        {(opportunity.solutionProposal?.deliverables || []).map((del, idx) => (
                          <div key={idx} className="flex items-center space-x-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                            <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                              {idx + 1}
                            </span>
                            <span className="text-xs text-slate-800 flex-1">{del}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveDeliverable(idx)}
                              className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center space-x-2 pt-1">
                        <input
                          type="text"
                          value={newDeliverableText}
                          onChange={(e) => setNewDeliverableText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddDeliverable();
                            }
                          }}
                          placeholder="Add a new deliverable (e.g. Disaster Recovery Runbook)..."
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                        />
                        <button
                          type="button"
                          onClick={handleAddDeliverable}
                          disabled={!newDeliverableText.trim()}
                          className="px-3 py-1.5 bg-purple-600 text-white rounded-lg font-bold text-xs hover:bg-purple-700 disabled:opacity-50 transition-colors shrink-0 flex items-center"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Deliverable
                        </button>
                      </div>
                    </div>

                    {/* 3rd-Party Vendor Procurement Track */}
                    <div className="md:col-span-2 pt-3 border-t border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="requiresVendorToggle"
                            checked={opportunity.solutionProposal?.vendorProcurement?.requiresVendor || false}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              onUpdateOpportunity({
                                ...opportunity,
                                solutionProposal: {
                                  ...opportunity.solutionProposal,
                                  vendorProcurement: {
                                    ...opportunity.solutionProposal?.vendorProcurement,
                                    requiresVendor: checked,
                                    vendorName: opportunity.solutionProposal?.vendorProcurement?.vendorName || (checked ? 'Microsoft / Cisco Systems' : 'None'),
                                    prStatus: opportunity.solutionProposal?.vendorProcurement?.prStatus || 'NOT_CREATED',
                                    poStatus: opportunity.solutionProposal?.vendorProcurement?.poStatus || 'NOT_ISSUED',
                                    invoiceStatus: opportunity.solutionProposal?.vendorProcurement?.invoiceStatus || 'PENDING',
                                  },
                                },
                              });
                            }}
                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                          />
                          <label htmlFor="requiresVendorToggle" className="font-bold text-slate-900 text-xs cursor-pointer">
                            Requires 3rd-Party Vendor (Hardware / Software / Services)
                          </label>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          opportunity.solutionProposal?.vendorProcurement?.requiresVendor
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}>
                          {opportunity.solutionProposal?.vendorProcurement?.requiresVendor ? 'Vendor Track Enabled' : 'In-House Solution'}
                        </span>
                      </div>

                      {opportunity.solutionProposal?.vendorProcurement?.requiresVendor && (
                        <div className="p-3.5 bg-purple-50/60 rounded-xl border border-purple-200 space-y-3 animate-in fade-in duration-150">
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <label className="font-semibold text-slate-700 block text-[11px]">Vendor Name</label>
                              <input
                                type="text"
                                value={opportunity.solutionProposal?.vendorProcurement?.vendorName || ''}
                                onChange={(e) => onUpdateOpportunity({
                                  ...opportunity,
                                  solutionProposal: {
                                    ...opportunity.solutionProposal,
                                    vendorProcurement: {
                                      ...opportunity.solutionProposal?.vendorProcurement,
                                      requiresVendor: true,
                                      vendorName: e.target.value,
                                    },
                                  },
                                })}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:ring-2 focus:ring-purple-500"
                                placeholder="e.g. Cisco Systems / AWS"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="font-semibold text-slate-700 block text-[11px]">Vendor Category</label>
                              <input
                                type="text"
                                value={opportunity.solutionProposal?.vendorProcurement?.vendorCategory || ''}
                                onChange={(e) => onUpdateOpportunity({
                                  ...opportunity,
                                  solutionProposal: {
                                    ...opportunity.solutionProposal,
                                    vendorProcurement: {
                                      ...opportunity.solutionProposal?.vendorProcurement,
                                      requiresVendor: true,
                                      vendorCategory: e.target.value,
                                    },
                                  },
                                })}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:ring-2 focus:ring-purple-500"
                                placeholder="e.g. Enterprise Networking Hardware"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="font-semibold text-slate-700 block text-[11px]">Vendor Quote Amount</label>
                              <input
                                type="number"
                                value={opportunity.solutionProposal?.vendorProcurement?.vendorQuoteAmount || 0}
                                onChange={(e) => onUpdateOpportunity({
                                  ...opportunity,
                                  solutionProposal: {
                                    ...opportunity.solutionProposal,
                                    vendorProcurement: {
                                      ...opportunity.solutionProposal?.vendorProcurement,
                                      requiresVendor: true,
                                      vendorQuoteAmount: parseFloat(e.target.value) || 0,
                                    },
                                  },
                                })}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-emerald-700 font-bold focus:ring-2 focus:ring-purple-500"
                                placeholder="0.00"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="font-semibold text-slate-700 block text-[11px]">Purchase Request (PR) #</label>
                              <input
                                type="text"
                                value={opportunity.solutionProposal?.vendorProcurement?.prNumber || ''}
                                onChange={(e) => onUpdateOpportunity({
                                  ...opportunity,
                                  solutionProposal: {
                                    ...opportunity.solutionProposal,
                                    vendorProcurement: {
                                      ...opportunity.solutionProposal?.vendorProcurement,
                                      requiresVendor: true,
                                      prNumber: e.target.value,
                                    },
                                  },
                                })}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:ring-2 focus:ring-purple-500"
                                placeholder="PR-2026-0001"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="font-semibold text-slate-700 block text-[11px]">PR Status</label>
                              <select
                                value={opportunity.solutionProposal?.vendorProcurement?.prStatus || 'NOT_CREATED'}
                                onChange={(e) => onUpdateOpportunity({
                                  ...opportunity,
                                  solutionProposal: {
                                    ...opportunity.solutionProposal,
                                    vendorProcurement: {
                                      ...opportunity.solutionProposal?.vendorProcurement,
                                      requiresVendor: true,
                                      prStatus: e.target.value as any,
                                    },
                                  },
                                })}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-purple-500"
                              >
                                <option value="NOT_CREATED">Not Created</option>
                                <option value="PR_SUBMITTED">PR Submitted</option>
                                <option value="PR_APPROVED">PR Approved</option>
                                <option value="PR_REJECTED">PR Rejected</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="font-semibold text-slate-700 block text-[11px]">Purchase Order (PO) #</label>
                              <input
                                type="text"
                                value={opportunity.solutionProposal?.vendorProcurement?.poNumber || ''}
                                onChange={(e) => onUpdateOpportunity({
                                  ...opportunity,
                                  solutionProposal: {
                                    ...opportunity.solutionProposal,
                                    vendorProcurement: {
                                      ...opportunity.solutionProposal?.vendorProcurement,
                                      requiresVendor: true,
                                      poNumber: e.target.value,
                                    },
                                  },
                                })}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:ring-2 focus:ring-purple-500"
                                placeholder="PO-2026-0001"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="font-semibold text-slate-700 block text-[11px]">PO Status</label>
                              <select
                                value={opportunity.solutionProposal?.vendorProcurement?.poStatus || 'NOT_ISSUED'}
                                onChange={(e) => onUpdateOpportunity({
                                  ...opportunity,
                                  solutionProposal: {
                                    ...opportunity.solutionProposal,
                                    vendorProcurement: {
                                      ...opportunity.solutionProposal?.vendorProcurement,
                                      requiresVendor: true,
                                      poStatus: e.target.value as any,
                                    },
                                  },
                                })}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-purple-500"
                              >
                                <option value="NOT_ISSUED">Not Issued</option>
                                <option value="PO_ISSUED">PO Issued</option>
                                <option value="PO_ACCEPTED">PO Accepted by Vendor</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="font-semibold text-slate-700 block text-[11px]">Vendor Invoice #</label>
                              <input
                                type="text"
                                value={opportunity.solutionProposal?.vendorProcurement?.vendorInvoiceNumber || ''}
                                onChange={(e) => onUpdateOpportunity({
                                  ...opportunity,
                                  solutionProposal: {
                                    ...opportunity.solutionProposal,
                                    vendorProcurement: {
                                      ...opportunity.solutionProposal?.vendorProcurement,
                                      requiresVendor: true,
                                      vendorInvoiceNumber: e.target.value,
                                    },
                                  },
                                })}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:ring-2 focus:ring-purple-500"
                                placeholder="INV-2026-001"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="font-semibold text-slate-700 block text-[11px]">Invoice Status</label>
                              <select
                                value={opportunity.solutionProposal?.vendorProcurement?.invoiceStatus || 'PENDING'}
                                onChange={(e) => onUpdateOpportunity({
                                  ...opportunity,
                                  solutionProposal: {
                                    ...opportunity.solutionProposal,
                                    vendorProcurement: {
                                      ...opportunity.solutionProposal?.vendorProcurement,
                                      requiresVendor: true,
                                      invoiceStatus: e.target.value as any,
                                    },
                                  },
                                })}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-purple-500"
                              >
                                <option value="PENDING">Pending Delivery</option>
                                <option value="RECEIVED">Invoice Received</option>
                                <option value="VERIFIED">Verified by Finance</option>
                                <option value="PAID">Paid in Full</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Done Editing Bar */}
              <div className="flex items-center justify-between p-3 bg-slate-100 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-600 font-medium flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
                  All changes are preserved in real time.
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingStage1(false)}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center"
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Save & Exit Edit Mode
                </button>
              </div>
            </div>
          ) : (
            /* VIEW MODE: COMPREHENSIVE EXECUTIVE STAGE 1 SUMMARY */
            <div className="space-y-4">
              
              {/* Sales Qualification Checklist */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-sm flex items-center">
                    <CheckSquare className="w-4 h-4 mr-1.5 text-blue-600" />
                    Sales Qualification Checklist & Opportunity Parameters
                  </div>
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {opportunity.opportunityStatus || 'Active / In-Pipeline'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Forecast Deal Value</span>
                    <span className="text-sm font-bold text-emerald-700">
                      {formatCurrency(opportunity.dealValue, opportunity.currency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Win Probability</span>
                    <span className="text-sm font-bold text-slate-800">{opportunity.probability}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Target Close Date</span>
                    <span className="text-sm font-bold text-slate-800">{formatDate(opportunity.targetCloseDate)}</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex items-start space-x-2 text-slate-600">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span>Client pain points and technical objectives qualified with sponsor: <strong className="text-slate-900">{opportunity.clientContactName || opportunity.clientName}</strong></span>
                  </div>
                  <div className="flex items-start space-x-2 text-slate-600">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span>Assigned Sales Lead: <strong className="text-slate-900">{opportunity.salesLead}</strong></span>
                  </div>
                  <div className="flex items-start space-x-2 text-slate-600">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span>Solution Architect / BU Owner: <strong className="text-blue-700">{opportunity.solutionArchitect || opportunity.buOwner || 'Pending Assignment'}</strong></span>
                  </div>
                  {opportunity.torLink && (
                    <div className="flex items-start space-x-2 text-slate-600">
                      <Link2 className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                      <span>
                        TOR Scope Reference: {' '}
                        {opportunity.torLink.startsWith('http://') || opportunity.torLink.startsWith('https://') ? (
                          <a href={opportunity.torLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline">
                            {opportunity.torLink} <ExternalLink className="w-3 h-3 inline" />
                          </a>
                        ) : (
                          <strong className="font-mono text-slate-800">{opportunity.torLink}</strong>
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {opportunity.description && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-500 block mb-1">Deal Description & Scope</span>
                    <p className="text-slate-700 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 leading-relaxed">
                      {opportunity.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Solution & Vendor Preview */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-sm flex items-center">
                    <Layers className="w-4 h-4 mr-1.5 text-purple-600" />
                    Solution Architecture & Vendor Procurement Status
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    opportunity.solutionProposal?.vendorProcurement?.requiresVendor
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {opportunity.solutionProposal?.vendorProcurement?.requiresVendor ? '3rd-Party Vendor Required' : 'In-House Solution'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-purple-50/40 p-3 rounded-lg border border-purple-100">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Solution Document</span>
                    <span className="font-semibold text-purple-800">
                      {opportunity.solutionProposal?.solutionDocName || 'Pending Architecture Generation'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Est. Delivery Cost</span>
                    <span className="font-bold text-emerald-700">
                      {opportunity.solutionProposal?.estimatedDeliveryCost ? formatCurrency(opportunity.solutionProposal.estimatedDeliveryCost, opportunity.currency) : 'Pending Assessment'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Est. Timeline</span>
                    <span className="font-bold text-slate-800">
                      {opportunity.solutionProposal?.estimatedEffortWeeks ? `${opportunity.solutionProposal.estimatedEffortWeeks} Weeks` : 'TBD'}
                    </span>
                  </div>
                </div>

                {opportunity.solutionProposal?.vendorProcurement?.requiresVendor && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Vendor</span>
                      <span className="font-semibold text-slate-800">{opportunity.solutionProposal.vendorProcurement.vendorName || 'Not Set'}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">PR Status</span>
                      <span className="font-semibold text-blue-700">{opportunity.solutionProposal.vendorProcurement.prStatus || 'NOT_CREATED'}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">PO Status</span>
                      <span className="font-semibold text-indigo-700">{opportunity.solutionProposal.vendorProcurement.poStatus || 'NOT_ISSUED'}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Quote</span>
                      <span className="font-semibold text-emerald-700">
                        {opportunity.solutionProposal.vendorProcurement.vendorQuoteAmount ? formatCurrency(opportunity.solutionProposal.vendorProcurement.vendorQuoteAmount, opportunity.currency) : 'Pending'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stage Hand-off Comments & Advance Button */}
          <div className="pt-2 space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                Stage Hand-off Notes & Architectural Instructions:
              </label>
              <textarea
                rows={2}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add notes for the Solution Architecture and BU team..."
                className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setIsEditingStage1(!isEditingStage1)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center"
              >
                <Edit3 className="w-3.5 h-3.5 mr-1" />
                {isEditingStage1 ? 'Close Editor' : 'Edit Commercials, Scope & PR/PO'}
              </button>

              <button
                type="button"
                onClick={() => onAdvanceStage('SOLUTION_DESIGN', 'Opportunity Submitted to Architecture', comments || 'Sales intake complete, handed off to Solution Architects.')}
                className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-xs transition-all"
              >
                Submit to Solution Architecture / BU
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK MODAL 1: ADD CUSTOM SALES LEAD & SYNC TO REPOSITORY */}
      {showCustomSalesModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 my-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Add New Sales Lead</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomSalesModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              This resource will be assigned as the opportunity Sales Lead and automatically saved to the <strong>Resource Repository</strong> for team-wide reuse.
            </p>

            <form onSubmit={handleSaveCustomSalesLead} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Full Name *</label>
                <input
                  type="text"
                  required
                  value={customSalesForm.name}
                  onChange={(e) => setCustomSalesForm({ ...customSalesForm, name: e.target.value })}
                  placeholder="e.g. Andrea Valenzuela"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Job Role</label>
                  <input
                    type="text"
                    value={customSalesForm.role}
                    onChange={(e) => setCustomSalesForm({ ...customSalesForm, role: e.target.value })}
                    placeholder="Senior Account Executive"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Department</label>
                  <input
                    type="text"
                    value={customSalesForm.department}
                    onChange={(e) => setCustomSalesForm({ ...customSalesForm, department: e.target.value })}
                    placeholder="Sales & Commercial"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Email Address</label>
                  <input
                    type="email"
                    value={customSalesForm.email}
                    onChange={(e) => setCustomSalesForm({ ...customSalesForm, email: e.target.value })}
                    placeholder="andrea.v@enterprise-solutions.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Phone / Mobile</label>
                  <input
                    type="text"
                    value={customSalesForm.contactNumber}
                    onChange={(e) => setCustomSalesForm({ ...customSalesForm, contactNumber: e.target.value })}
                    placeholder="+1 (555) 345-6789"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCustomSalesModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!customSalesForm.name.trim()}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs disabled:opacity-50 flex items-center cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Save & Sync to Repository
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* QUICK MODAL 2: ADD CUSTOM SOLUTION ARCHITECT / BU OWNER & SYNC TO REPOSITORY */}
      {showCustomSaModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 my-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900 text-sm">Add Solution Architect / BU Owner</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomSaModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              This resource will be assigned as the Solution Architect / BU Owner and automatically synced to the <strong>Resource Repository</strong> for team-wide reuse.
            </p>

            <form onSubmit={handleSaveCustomSa} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Full Name *</label>
                <input
                  type="text"
                  required
                  value={customSaForm.name}
                  onChange={(e) => setCustomSaForm({ ...customSaForm, name: e.target.value })}
                  placeholder="e.g. Dr. Roberto Mendoza"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Job Role / Title</label>
                  <input
                    type="text"
                    value={customSaForm.role}
                    onChange={(e) => setCustomSaForm({ ...customSaForm, role: e.target.value })}
                    placeholder="Lead Cloud Solutions Architect"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Department / Practice</label>
                  <input
                    type="text"
                    value={customSaForm.department}
                    onChange={(e) => setCustomSaForm({ ...customSaForm, department: e.target.value })}
                    placeholder="Solutions Architecture & Pre-Sales"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Email Address</label>
                  <input
                    type="email"
                    value={customSaForm.email}
                    onChange={(e) => setCustomSaForm({ ...customSaForm, email: e.target.value })}
                    placeholder="roberto.m@enterprise-solutions.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Phone / Mobile</label>
                  <input
                    type="text"
                    value={customSaForm.contactNumber}
                    onChange={(e) => setCustomSaForm({ ...customSaForm, contactNumber: e.target.value })}
                    placeholder="+1 (555) 789-0123"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCustomSaModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!customSaForm.name.trim()}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs disabled:opacity-50 flex items-center cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Save & Sync to Repository
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL: RETURN TO STAGE 1 (SALES INTAKE) WITH REQUIRED NOTE */}
      {showReturnToStage1Modal && createPortal(
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-amber-200 bg-amber-50/90 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 font-bold shrink-0">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Return to Sales Intake</h3>
                  <p className="text-[11px] text-amber-800">Revert opportunity back to Stage 1 (Intake & Commercials)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowReturnToStage1Modal(false);
                  setReturnToStage1Error('');
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-amber-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReturnToStage1} className="p-4 space-y-3.5 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold text-slate-700 block">Opportunity Context:</span>
                <div className="text-slate-900 font-semibold">{opportunity.title}</div>
                <div className="text-slate-500 text-[11px]">
                  Client: <strong className="text-slate-700">{opportunity.clientName}</strong> • Sales Lead: <strong className="text-slate-700">{opportunity.salesLead}</strong>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">
                  Reason for Returning to Sales Intake <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={returnToStage1Reason}
                  onChange={(e) => {
                    setReturnToStage1Reason(e.target.value);
                    if (returnToStage1Error) setReturnToStage1Error('');
                  }}
                  placeholder="Please specify why this opportunity is being returned to Sales (e.g. Terms of Reference (TOR) requirements unclear, missing target budget details from client, client requested scope revision, or commercial adjustment required)..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none text-xs"
                  autoFocus
                />
                {returnToStage1Error && (
                  <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {returnToStage1Error}
                  </p>
                )}
                <span className="text-[10px] text-slate-500 block">
                  * Note: Providing a return reason is mandatory. This note will be recorded in the opportunity history and timeline.
                </span>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowReturnToStage1Modal(false);
                    setReturnToStage1Error('');
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs flex items-center cursor-pointer gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Confirm Return to Sales Intake
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL: RETURN TO STAGE 2 (SOLUTION DESIGN) WITH REQUIRED NOTE */}
      {showReturnToStage2Modal && createPortal(
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-amber-200 bg-amber-50/90 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 font-bold shrink-0">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Return to Solution Design</h3>
                  <p className="text-[11px] text-amber-800">Revert opportunity back to Stage 2 (Architecture & Pricing)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowReturnToStage2Modal(false);
                  setReturnToStage2Error('');
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-amber-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReturnToStage2} className="p-4 space-y-3.5 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold text-slate-700 block">Opportunity Context:</span>
                <div className="text-slate-900 font-semibold">{opportunity.title}</div>
                <div className="text-slate-500 text-[11px]">
                  Client: <strong className="text-slate-700">{opportunity.clientName}</strong> • SA/BU Lead: <strong className="text-slate-700">{opportunity.solutionArchitect || opportunity.buOwner || 'Unassigned'}</strong>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">
                  Reason for Returning to Solution Design <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={returnToStage2Reason}
                  onChange={(e) => {
                    setReturnToStage2Reason(e.target.value);
                    if (returnToStage2Error) setReturnToStage2Error('');
                  }}
                  placeholder="Please specify why this proposal is being returned to the Solution Architect / BU team (e.g. Scope adjustment requested, pricing model requires rework, vendor quotation needs recalculation, or deliverable schedule adjustment required)..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none text-xs"
                  autoFocus
                />
                {returnToStage2Error && (
                  <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {returnToStage2Error}
                  </p>
                )}
                <span className="text-[10px] text-slate-500 block">
                  * Note: Providing a return reason is mandatory. This note will be recorded in the opportunity history and timeline.
                </span>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowReturnToStage2Modal(false);
                    setReturnToStage2Error('');
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs flex items-center cursor-pointer gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Confirm Return to Solution Design
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* RETURN TO STAGE 3 MODAL (CONTRACTS TO SALES UPDATE) */}
      {showReturnToStage3Modal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="p-4 bg-amber-500 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <RotateCcw className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Return to Sales for Update</h3>
                  <p className="text-[11px] text-amber-100">Send opportunity back to Stage 3 (Sales Proposal Review)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowReturnToStage3Modal(false);
                  setReturnToStage3Error('');
                }}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReturnToStage3} className="p-4 space-y-3.5 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold text-slate-700 block">Opportunity Context:</span>
                <div className="text-slate-900 font-semibold">{opportunity.title}</div>
                <div className="text-slate-500 text-[11px]">
                  Client: <strong className="text-slate-700">{opportunity.clientName}</strong> • Assigned Sales: <strong className="text-slate-700">{opportunity.salesLead || 'Unassigned'}</strong>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">
                  Reason for Returning to Sales for Update <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={returnToStage3Reason}
                  onChange={(e) => {
                    setReturnToStage3Reason(e.target.value);
                    if (returnToStage3Error) setReturnToStage3Error('');
                  }}
                  placeholder="Please specify why this proposal is being returned to the Sales Executive for update (e.g., Commercial terms clarification required, discount structure needs alignment, client contract stipulations need revision, or missing commercial appendices)..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none text-xs"
                  autoFocus
                />
                {returnToStage3Error && (
                  <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {returnToStage3Error}
                  </p>
                )}
                <span className="text-[10px] text-slate-500 block">
                  * Note: Providing a return reason is mandatory. This note will be recorded in the opportunity history and timeline.
                </span>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowReturnToStage3Modal(false);
                    setReturnToStage3Error('');
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs flex items-center cursor-pointer gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Confirm Return to Sales for Update
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* RETURN TO STAGE 4 MODAL (FINANCE TO CONTRACTS TEAM) */}
      {showReturnToStage4Modal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="p-4 bg-amber-500 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <RotateCcw className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Return to Contracts Team for Update/Clarification</h3>
                  <p className="text-[11px] text-amber-100">Send opportunity back to Stage 4 (Contracts Team Proposal Review & Record)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowReturnToStage4Modal(false);
                  setReturnToStage4Error('');
                }}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReturnToStage4} className="p-4 space-y-3.5 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold text-slate-700 block">Opportunity Context:</span>
                <div className="text-slate-900 font-semibold">{opportunity.title}</div>
                <div className="text-slate-500 text-[11px]">
                  Client: <strong className="text-slate-700">{opportunity.clientName}</strong> • Contracts Processor: <strong className="text-slate-700">{opportunity.contractsProcessor || opportunity.contractsReviewData?.contractsProcessor || 'Unassigned'}</strong> • Deal Value: <strong className="text-emerald-700">{formatCurrency(opportunity.dealValue, opportunity.currency)}</strong>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">
                  Reason for Returning to Contracts Team <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={returnToStage4Reason}
                  onChange={(e) => {
                    setReturnToStage4Reason(e.target.value);
                    if (returnToStage4Error) setReturnToStage4Error('');
                  }}
                  placeholder="Please specify why this opportunity is being returned to the Contracts Team for update or clarification (e.g., Contract type / template mismatch, payment milestones not aligned with revenue policy, liability cap concerns, missing legal attachments, or rate adjustment required)..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none text-xs"
                  autoFocus
                />
                {returnToStage4Error && (
                  <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {returnToStage4Error}
                  </p>
                )}
                <span className="text-[10px] text-slate-500 block">
                  * Note: Providing a return reason is mandatory. This note will be recorded in the opportunity history and timeline.
                </span>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowReturnToStage4Modal(false);
                    setReturnToStage4Error('');
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs flex items-center cursor-pointer gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Confirm Return to Contracts Team
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* RETURN TO STAGE 6 MODAL (FROM STAGE 7 TO CONTRACTS TEAM FOR REVIEW) */}
      {showReturnToStage6Modal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="p-4 bg-amber-500 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <RotateCcw className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Return to Contracts Team for Review</h3>
                  <p className="text-[11px] text-amber-100">Send opportunity back to Stage 6 (Contracts Team Proposal Endorsement)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowReturnToStage6Modal(false);
                  setReturnToStage6Error('');
                }}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReturnToStage6} className="p-4 space-y-3.5 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold text-slate-700 block">Opportunity Context:</span>
                <div className="text-slate-900 font-semibold">{opportunity.title}</div>
                <div className="text-slate-500 text-[11px]">
                  Client: <strong className="text-slate-700">{opportunity.clientName}</strong> • Current Deal Value: <strong className="text-emerald-700">{formatCurrency(opportunity.dealValue, opportunity.currency)}</strong>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">
                  Reason for Returning to Contracts Team for Review <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={returnToStage6Reason}
                  onChange={(e) => {
                    setReturnToStage6Reason(e.target.value);
                    if (returnToStage6Error) setReturnToStage6Error('');
                  }}
                  placeholder="Please specify why this opportunity is being returned to the Contracts Team for review (e.g., Client requested legal clause modifications, liability adjustments needed, custom SOW deliverables re-alignment, or updated commercial endorsements required)..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none text-xs"
                  autoFocus
                />
                {returnToStage6Error && (
                  <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {returnToStage6Error}
                  </p>
                )}
                <span className="text-[10px] text-slate-500 block">
                  * Note: Providing a return reason is mandatory. This note will be recorded in the opportunity history and timeline.
                </span>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowReturnToStage6Modal(false);
                    setReturnToStage6Error('');
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs flex items-center cursor-pointer gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Confirm Return to Contracts Team
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* STAGE 2: SOLUTION DESIGN & VENDOR PROCUREMENT */}
      {currentStage === 'SOLUTION_DESIGN' && (() => {
        const stage2TriggerDate = opportunity.solutionProposal?.stage2TriggerDate || 
          (opportunity.currentStage === 'SOLUTION_DESIGN' ? (opportunity.stageEnteredAt || opportunity.createdAt) : (opportunity.stageEnteredAt || opportunity.createdAt));
        const torReceivedDate = opportunity.solutionProposal?.torReceivedDate || '';
        const slaTriggerToTorDays = opportunity.solutionProposal?.slaTriggerToTorDays || 2;
        const nowMs = Date.now();
        const triggerMs = stage2TriggerDate ? new Date(stage2TriggerDate).getTime() : nowMs;
        const torMs = torReceivedDate ? new Date(torReceivedDate).getTime() : null;
        
        const elapsedDaysFromTrigger = Math.max(0, Math.floor((nowMs - triggerMs) / (1000 * 60 * 60 * 24)));
        const isTorOverdue = !torReceivedDate && elapsedDaysFromTrigger > slaTriggerToTorDays;
        
        const stage2TargetSlaDays = STAGE_MAP.SOLUTION_DESIGN?.targetSlaDays || 5;
        const elapsedDaysFromTor = torMs ? Math.max(0, Math.floor((nowMs - torMs) / (1000 * 60 * 60 * 24))) : 0;
        const isStage2Overdue = torMs ? (elapsedDaysFromTor > stage2TargetSlaDays) : false;

        const currentTcv = opportunity.dealValue || 0;
        const currentInternalCost = opportunity.solutionProposal?.ibsiInternalCost || 0;
        const grossProfit = currentTcv - currentInternalCost;
        const grossMarginPercent = currentTcv > 0 ? ((grossProfit / currentTcv) * 100) : 0;

        const handleSetTorDateToday = () => {
          const todayStr = new Date().toISOString().split('T')[0];
          onUpdateOpportunity({
            ...opportunity,
            solutionProposal: {
              ...opportunity.solutionProposal,
              stage2TriggerDate: stage2TriggerDate,
              torReceivedDate: todayStr,
            }
          });
        };

        // Proposal Validity Calculation Helpers
        const addDaysToDate = (dateStr: string, days: number): string => {
          if (!dateStr) return '';
          const parts = dateStr.split('T')[0].split('-').map(Number);
          if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return '';
          const d = new Date(parts[0], parts[1] - 1, parts[2]);
          d.setDate(d.getDate() + Number(days));
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const dt = String(d.getDate()).padStart(2, '0');
          return `${y}-${m}-${dt}`;
        };

        const getDaysDiff = (startStr: string, endStr: string): number => {
          if (!startStr || !endStr) return 0;
          const p1 = startStr.split('T')[0].split('-').map(Number);
          const p2 = endStr.split('T')[0].split('-').map(Number);
          if (p1.length !== 3 || p2.length !== 3 || !p1[0] || !p1[1] || !p1[2] || !p2[0] || !p2[1] || !p2[2]) return 0;
          const date1 = new Date(p1[0], p1[1] - 1, p1[2]).getTime();
          const date2 = new Date(p2[0], p2[1] - 1, p2[2]).getTime();
          const diffTime = date2 - date1;
          return Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)));
        };

        const proposalValidityStartDate = opportunity.solutionProposal?.proposalValidityStartDate || '';
        const proposalValidityEndDate = opportunity.solutionProposal?.proposalValidityEndDate || '';
        const rawValidityDays = opportunity.solutionProposal?.proposalValidityDays;
        const proposalValidityDays = rawValidityDays !== undefined 
          ? rawValidityDays 
          : ((proposalValidityStartDate && proposalValidityEndDate) ? getDaysDiff(proposalValidityStartDate, proposalValidityEndDate) : undefined);

        const handleValidityStartDateChange = (newStartDate: string) => {
          let newEndDate = proposalValidityEndDate;
          let days = proposalValidityDays;

          if (newStartDate) {
            if (days !== undefined && days > 0) {
              newEndDate = addDaysToDate(newStartDate, days);
            } else if (newEndDate) {
              days = getDaysDiff(newStartDate, newEndDate);
            }
          }

          onUpdateOpportunity({
            ...opportunity,
            solutionProposal: {
              ...opportunity.solutionProposal,
              proposalValidityStartDate: newStartDate,
              proposalValidityEndDate: newEndDate,
              proposalValidityDays: days,
            }
          });
        };

        const handleValidityEndDateChange = (newEndDate: string) => {
          let days = proposalValidityDays;
          if (newEndDate && proposalValidityStartDate) {
            days = getDaysDiff(proposalValidityStartDate, newEndDate);
          }

          onUpdateOpportunity({
            ...opportunity,
            solutionProposal: {
              ...opportunity.solutionProposal,
              proposalValidityEndDate: newEndDate,
              proposalValidityDays: days,
            }
          });
        };

        const handleValidityDaysChange = (newDays: number | string) => {
          const daysNum = typeof newDays === 'string' ? (newDays === '' ? undefined : parseInt(newDays, 10)) : newDays;
          let startDate = proposalValidityStartDate;
          let newEndDate = proposalValidityEndDate;

          if (daysNum !== undefined && !isNaN(daysNum)) {
            if (!startDate) {
              startDate = new Date().toISOString().split('T')[0];
            }
            newEndDate = addDaysToDate(startDate, daysNum);
          }

          onUpdateOpportunity({
            ...opportunity,
            solutionProposal: {
              ...opportunity.solutionProposal,
              proposalValidityStartDate: startDate,
              proposalValidityEndDate: newEndDate,
              proposalValidityDays: daysNum !== undefined && !isNaN(daysNum) ? daysNum : undefined,
            }
          });
        };

        return (
          <div className="space-y-4 text-xs">
            {/* Top Bar with AI Assistant */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-600" />
                  <span>2. Solution Design & Architecture Specifications</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Author technical architecture, commercial proposal pricing, TOR milestones, and 3rd-party vendor procurement.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerateAiProposal}
                disabled={isAiLoading}
                className="inline-flex items-center px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 font-semibold transition-colors disabled:opacity-50 cursor-pointer shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                {isAiLoading ? 'Generating AI Proposal...' : 'AI Proposal Assistant'}
              </button>
            </div>

            {/* SECTION 1: PERSONNEL & STAGE TIMELINES / SLA */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  Ownership, Workflow Ingress & TOR Handover SLA
                </span>
                <span className="text-[10px] font-semibold text-slate-500">
                  Target Architecture SLA: <strong className="text-slate-800">{stage2TargetSlaDays} Days</strong> (post-TOR)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Solution Architect / BU Head Owner Dropdown */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700 block">
                      Solution Architect / BU Head Owner <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCustomSaModal(true)}
                      className="text-[10px] text-purple-700 hover:text-purple-900 font-bold hover:underline"
                    >
                      + Quick Add SA
                    </button>
                  </div>
                  <select
                    value={opportunity.solutionArchitect || opportunity.buOwner || ''}
                    onChange={(e) => {
                      if (e.target.value === 'ADD_CUSTOM_SA') {
                        setShowCustomSaModal(true);
                        return;
                      }
                      const val = e.target.value;
                      onUpdateOpportunity({
                        ...opportunity,
                        solutionArchitect: val,
                        buOwner: val,
                        solutionProposal: {
                          ...opportunity.solutionProposal,
                          solutionArchitect: val,
                          buOwner: val,
                        },
                      });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none text-xs"
                  >
                    <option value="">-- Select Assigned SA / BU Owner --</option>
                    {(opportunity.solutionArchitect || opportunity.buOwner) && (
                      <option value={opportunity.solutionArchitect || opportunity.buOwner}>
                        ★ {opportunity.solutionArchitect || opportunity.buOwner} (Assigned)
                      </option>
                    )}
                    <optgroup label="── Solution Architects & BU Leads ──">
                      {architectResources.map((r) => (
                        <option key={r.id} value={r.name}>
                          {r.name} — {r.role} ({r.division || r.department || 'SA/BU'})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="── All Engineering & Presales Resources ──">
                      {nonArchitectResources.map((r) => (
                        <option key={r.id} value={r.name}>
                          {r.name} — {r.role} ({r.division || r.department || 'General'})
                        </option>
                      ))}
                    </optgroup>
                    <option value="ADD_CUSTOM_SA" className="text-purple-700 font-bold bg-purple-50">
                      ➕ + Add Custom SA / BU Head Owner...
                    </option>
                  </select>
                  <span className="text-[10px] text-slate-400 block">
                    Synced with Resource Repository. Defaulted from Stage 1 intake.
                  </span>
                </div>

                {/* Stage 2 Trigger Date (Non-editable) */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 flex items-center gap-1">
                    <span>Stage 2 Trigger Date</span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-600 text-[9px] font-bold">Non-Editable</span>
                  </label>
                  <div className="w-full bg-slate-100/90 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-mono text-xs flex items-center justify-between cursor-not-allowed">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{formatDate(stage2TriggerDate)}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-sans">
                      {elapsedDaysFromTrigger}d ago
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    Workflow ingress timestamp when opportunity entered Stage 2.
                  </span>
                </div>

                {/* TOR Received Date (Main reference of SLA) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700 block">
                      TOR Received Date <span className="text-purple-600 font-normal text-[10px]">(SLA Baseline)</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleSetTorDateToday}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-bold hover:underline"
                    >
                      Set Today
                    </button>
                  </div>
                  <input
                    type="date"
                    value={torReceivedDate ? torReceivedDate.split('T')[0] : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      onUpdateOpportunity({
                        ...opportunity,
                        solutionProposal: {
                          ...opportunity.solutionProposal,
                          stage2TriggerDate: stage2TriggerDate,
                          torReceivedDate: val,
                        }
                      });
                    }}
                    className={`w-full bg-white border rounded-lg px-2.5 py-1.5 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs ${
                      !torReceivedDate ? 'border-amber-400 bg-amber-50/40' : 'border-slate-300'
                    }`}
                  />
                  <span className="text-[10px] text-slate-500 block">
                    Date SA/BU starts work. Primary reference for Stage 2 SLA countdown.
                  </span>
                </div>
              </div>

              {/* Handover & Stage 2 SLA Status Banner */}
              <div className={`p-2.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                !torReceivedDate
                  ? isTorOverdue
                    ? 'bg-rose-50 border-rose-300 text-rose-800'
                    : 'bg-amber-50 border-amber-300 text-amber-800'
                  : isStage2Overdue
                    ? 'bg-rose-50 border-rose-300 text-rose-800'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-800'
              }`}>
                <div className="flex items-start sm:items-center space-x-2">
                  {!torReceivedDate ? (
                    isTorOverdue ? (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5 sm:mt-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
                    )
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
                  )}
                  <div>
                    {!torReceivedDate ? (
                      isTorOverdue ? (
                        <span>
                          <strong>🚨 Handover SLA Exceeded:</strong> {elapsedDaysFromTrigger} days elapsed since trigger (SLA threshold: {slaTriggerToTorDays} days). Record TOR date to start Stage 2 SLA.
                        </span>
                      ) : (
                        <span>
                          <strong>⏱️ Trigger-to-TOR Handover SLA:</strong> {elapsedDaysFromTrigger} of {slaTriggerToTorDays} days elapsed. Awaiting TOR handover confirmation from Sales/Client.
                        </span>
                      )
                    ) : (
                      <span>
                        <strong>✅ Stage 2 Solution SLA Active:</strong> TOR received on <strong>{formatDate(torReceivedDate)}</strong>. {elapsedDaysFromTor} of {stage2TargetSlaDays} days elapsed ({stage2TargetSlaDays - elapsedDaysFromTor > 0 ? `${stage2TargetSlaDays - elapsedDaysFromTor} days remaining` : 'Overdue'}).
                      </span>
                    )}
                  </div>
                </div>

                {!torReceivedDate && (
                  <button
                    type="button"
                    onClick={handleSetTorDateToday}
                    className="self-end sm:self-auto px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded shadow-xs shrink-0 cursor-pointer flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Mark TOR Received Today
                  </button>
                )}
              </div>
            </div>

            {/* SECTION 2: PROPOSAL LINKS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Client Proposal Link to File */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700 block">
                    Client Proposal Link to File <span className="text-rose-500">*</span>
                  </label>
                  {(opportunity.solutionProposal?.clientProposalLink || opportunity.solutionProposal?.solutionDocName) && (
                    (() => {
                      const link = opportunity.solutionProposal?.clientProposalLink || opportunity.solutionProposal?.solutionDocName || '';
                      if (link.startsWith('http://') || link.startsWith('https://')) {
                        return (
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-blue-600 font-bold hover:underline inline-flex items-center gap-0.5"
                          >
                            <ExternalLink className="w-3 h-3" /> Open Link
                          </a>
                        );
                      }
                      return null;
                    })()
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={opportunity.solutionProposal?.clientProposalLink || opportunity.solutionProposal?.solutionDocName || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      onUpdateOpportunity({
                        ...opportunity,
                        solutionProposal: {
                          ...opportunity.solutionProposal,
                          clientProposalLink: val,
                          solutionDocName: val,
                        },
                      });
                    }}
                    placeholder="e.g., https://drive.google.com/... or Proposal_v1.0.pdf"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs font-medium"
                  />
                  <FileText className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
                <span className="text-[10px] text-slate-400 block">
                  Link to final client-facing solution proposal document or file repository.
                </span>
              </div>

              {/* Client Proposal Pricing Calculator Link to File */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700 block">
                    Client Proposal Pricing Calculator Link to File
                  </label>
                  {opportunity.solutionProposal?.pricingCalculatorLink && (
                    (() => {
                      const link = opportunity.solutionProposal.pricingCalculatorLink;
                      if (link.startsWith('http://') || link.startsWith('https://')) {
                        return (
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-emerald-600 font-bold hover:underline inline-flex items-center gap-0.5"
                          >
                            <ExternalLink className="w-3 h-3" /> Open Calculator
                          </a>
                        );
                      }
                      return null;
                    })()
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={opportunity.solutionProposal?.pricingCalculatorLink || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      onUpdateOpportunity({
                        ...opportunity,
                        solutionProposal: {
                          ...opportunity.solutionProposal,
                          pricingCalculatorLink: val,
                        },
                      });
                    }}
                    placeholder="e.g., https://docs.google.com/spreadsheets/... or Pricing_Model_v3.xlsx"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs font-medium"
                  />
                  <Link2 className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
                <span className="text-[10px] text-slate-400 block">
                  Link to pricing sheets, BOM calculators, or internal gross margin models.
                </span>
              </div>
            </div>

            {/* SECTION: PROPOSAL VALIDITY (FULL WIDTH) */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-slate-900 text-xs">Proposal Validity</span>
                </div>
                <span className="text-[10px] text-slate-500">
                  Bidirectional auto-computation for expiration & duration
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-200">
                {/* Start Date */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700 text-[11px] block">
                      Start Date
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const todayStr = new Date().toISOString().split('T')[0];
                        handleValidityStartDateChange(todayStr);
                      }}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-bold hover:underline"
                    >
                      Set Today
                    </button>
                  </div>
                  <input
                    type="date"
                    value={proposalValidityStartDate ? proposalValidityStartDate.split('T')[0] : ''}
                    onChange={(e) => handleValidityStartDateChange(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs font-medium"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    Quotation release date.
                  </span>
                </div>

                {/* End Date */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 text-[11px] block">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={proposalValidityEndDate ? proposalValidityEndDate.split('T')[0] : ''}
                    onChange={(e) => handleValidityEndDateChange(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs font-medium"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    Expiration cutoff date.
                  </span>
                </div>

                {/* Days Validity */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 text-[11px] block">
                    Days Validity
                  </label>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      min="0"
                      value={proposalValidityDays !== undefined ? proposalValidityDays : ''}
                      onChange={(e) => handleValidityDaysChange(e.target.value)}
                      placeholder="e.g. 30"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs font-bold text-slate-900"
                    />
                    <span className="text-xs text-slate-500 font-semibold pr-1">Days</span>
                  </div>
                  {/* Presets */}
                  <div className="flex items-center gap-1 pt-0.5">
                    {[15, 30, 60, 90].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleValidityDaysChange(preset)}
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold border transition-colors cursor-pointer ${
                          proposalValidityDays === preset
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {preset}d
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Validity Status Banner */}
              {(proposalValidityStartDate || proposalValidityEndDate || proposalValidityDays !== undefined) && (() => {
                const today = new Date().toISOString().split('T')[0];
                const hasBothDates = Boolean(proposalValidityStartDate && proposalValidityEndDate);
                const isExpired = hasBothDates && (proposalValidityEndDate < today);
                const daysRemaining = hasBothDates 
                  ? Math.round((new Date(proposalValidityEndDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24))
                  : undefined;

                return (
                  <div className={`p-2.5 rounded-lg border flex items-center justify-between text-xs ${
                    isExpired
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : hasBothDates
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-blue-50 border-blue-200 text-blue-800'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 shrink-0" />
                      <div>
                        {hasBothDates ? (
                          <span>
                            {isExpired ? (
                              <strong className="text-rose-700">⚠️ Proposal Expired: </strong>
                            ) : (
                              <strong className="text-emerald-700">✅ Proposal Valid: </strong>
                            )}
                            Valid from <strong>{formatDate(proposalValidityStartDate)}</strong> until <strong>{formatDate(proposalValidityEndDate)}</strong> ({proposalValidityDays} {proposalValidityDays === 1 ? 'day' : 'days'}).
                            {!isExpired && daysRemaining !== undefined && (
                              <span className="ml-1 font-semibold text-emerald-800">
                                ({daysRemaining === 0 ? 'Expires today' : `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} remaining`})
                              </span>
                            )}
                            {isExpired && daysRemaining !== undefined && (
                              <span className="ml-1 font-semibold text-rose-800">
                                (Expired {Math.abs(daysRemaining)} {Math.abs(daysRemaining) === 1 ? 'day' : 'days'} ago)
                              </span>
                            )}
                          </span>
                        ) : (
                          <span>
                            <strong>ℹ️ Proposal Duration: </strong>
                            {proposalValidityDays !== undefined ? `${proposalValidityDays} days duration set.` : 'Select start and end dates or set duration.'}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-current shadow-2xs font-bold shrink-0 ml-2">
                      {proposalValidityDays !== undefined ? `${proposalValidityDays} Days` : 'Pending'}
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* SECTION 3: COMMERCIAL TCV & IBSI INTERNAL COST SETS */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <Coins className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-900 text-xs">
                    Commercial Proposal Pricing & Cost Analysis
                  </span>
                </div>
                <span className="text-[10px] text-slate-500">
                  Updates Opportunity Deal Value & Margin Model
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Set A: Client Proposal Price (TCV) with Currency selector */}
                <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <label className="font-bold text-slate-800 block text-xs flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Client Proposal Price (TCV)</span>
                    <span className="text-[10px] text-emerald-700 font-normal">(Updates Deal Value)</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    {/* Currency Selector */}
                    <select
                      value={opportunity.currency || 'USD'}
                      onChange={(e) => {
                        const newCurr = e.target.value;
                        onUpdateOpportunity({
                          ...opportunity,
                          currency: newCurr,
                          solutionProposal: {
                            ...opportunity.solutionProposal,
                            ibsiInternalCurrency: opportunity.solutionProposal?.ibsiInternalCurrency || newCurr,
                          }
                        });
                      }}
                      className="bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 text-xs shrink-0"
                    >
                      {SUPPORTED_CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} ({c.symbol})
                        </option>
                      ))}
                    </select>

                    {/* Price (TCV) input */}
                    <div className="relative flex-1">
                      <input
                        type="number"
                        value={opportunity.dealValue || 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          onUpdateOpportunity({
                            ...opportunity,
                            dealValue: val,
                            solutionProposal: {
                              ...opportunity.solutionProposal,
                              estimatedDeliveryCost: val,
                            },
                          });
                        }}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-emerald-700 font-extrabold text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    Total Contract Value (TCV) offered to client. Automatically synchronizes Deal Value across the pipeline.
                  </span>
                </div>

                {/* Set B: IBSI Internal Cost with Currency selector */}
                <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <label className="font-bold text-slate-800 block text-xs flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                    <span>IBSI Internal Cost</span>
                    <span className="text-[10px] text-slate-500 font-normal">(Delivery & Resources)</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    {/* Currency Selector */}
                    <select
                      value={opportunity.solutionProposal?.ibsiInternalCurrency || opportunity.currency || 'USD'}
                      onChange={(e) => {
                        const newCurr = e.target.value;
                        onUpdateOpportunity({
                          ...opportunity,
                          solutionProposal: {
                            ...opportunity.solutionProposal,
                            ibsiInternalCurrency: newCurr,
                          }
                        });
                      }}
                      className="bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 text-xs shrink-0"
                    >
                      {SUPPORTED_CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} ({c.symbol})
                        </option>
                      ))}
                    </select>

                    {/* Internal Cost input */}
                    <div className="relative flex-1">
                      <input
                        type="number"
                        value={opportunity.solutionProposal?.ibsiInternalCost || 0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          onUpdateOpportunity({
                            ...opportunity,
                            solutionProposal: {
                              ...opportunity.solutionProposal,
                              ibsiInternalCost: val,
                            },
                          });
                        }}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-blue-800 font-extrabold text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    IBSI internal build cost, staffing, resource overheads, and vendor pass-through expenses.
                  </span>
                </div>
              </div>

              {/* Profit Margin & Commercial Viability Analytics Pill */}
              <div className="bg-slate-900 text-white rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Client TCV</span>
                    <span className="font-bold text-emerald-400">
                      {formatCurrency(currentTcv, opportunity.currency)}
                    </span>
                  </div>
                  <span className="text-slate-600">−</span>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Internal Cost</span>
                    <span className="font-bold text-slate-200">
                      {formatCurrency(currentInternalCost, opportunity.solutionProposal?.ibsiInternalCurrency || opportunity.currency)}
                    </span>
                  </div>
                  <span className="text-slate-600">=</span>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Gross Profit</span>
                    <span className={`font-bold ${grossProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatCurrency(grossProfit, opportunity.currency)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[11px] text-slate-300">Projected Margin:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                    grossMarginPercent >= 35
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                      : grossMarginPercent >= 20
                        ? 'bg-blue-500/20 text-blue-300 border-blue-400/40'
                        : grossMarginPercent >= 10
                          ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                          : 'bg-rose-500/20 text-rose-300 border-rose-400/40'
                  }`}>
                    {grossMarginPercent.toFixed(1)}% Gross Margin
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 4: ARCHITECTURE SUMMARY & DELIVERABLES */}
            <div className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Technical Architecture Summary
                </label>
                <textarea
                  rows={3}
                  value={opportunity.solutionProposal?.architectureSummary || ''}
                  onChange={(e) => onUpdateOpportunity({
                    ...opportunity,
                    solutionProposal: { ...opportunity.solutionProposal, architectureSummary: e.target.value }
                  })}
                  placeholder="Describe cloud infrastructure, microservices, security compliance, high availability topologies..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
                />
              </div>

              {/* Key Deliverables & Effort Weeks */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2 space-y-2">
                  <label className="font-semibold text-slate-700 block">
                    Key Scope Deliverables
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newDeliverableText}
                      onChange={(e) => setNewDeliverableText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddDeliverable();
                        }
                      }}
                      placeholder="Add key deliverable (e.g., Multi-region Kubernetes cluster)..."
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddDeliverable}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center shrink-0 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {(opportunity.solutionProposal?.deliverables || []).map((del, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs">
                        <span className="text-slate-800 font-medium flex items-center gap-1.5">
                          <CheckSquare className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{del}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDeliverable(idx)}
                          className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {(!opportunity.solutionProposal?.deliverables || opportunity.solutionProposal.deliverables.length === 0) && (
                      <p className="text-[11px] text-slate-400 italic">No deliverables specified yet.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">
                    Estimated Timeline / Effort (Weeks)
                  </label>
                  <input
                    type="number"
                    value={opportunity.solutionProposal?.estimatedEffortWeeks || 0}
                    onChange={(e) => onUpdateOpportunity({
                      ...opportunity,
                      solutionProposal: {
                        ...opportunity.solutionProposal,
                        estimatedEffortWeeks: parseInt(e.target.value, 10) || 0,
                      },
                    })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
                    placeholder="e.g. 12"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    Total delivery schedule duration from kick-off to UAT.
                  </span>
                </div>
              </div>
            </div>

            {/* VENDOR PROCUREMENT SUB-PROCESS (PR / PO / INVOICE) */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block text-xs">Optional 3rd-Party Vendor</span>
                  <span className="text-[11px] text-slate-500">Track PR, PO, vendor proposal documents, and quotations if 3rd party hardware or software licensing is required.</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={opportunity.solutionProposal?.vendorProcurement?.requiresVendor || false}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      onUpdateOpportunity({
                        ...opportunity,
                        solutionProposal: {
                          ...opportunity.solutionProposal,
                          vendorProcurement: {
                            ...opportunity.solutionProposal?.vendorProcurement,
                            requiresVendor: checked,
                            prStatus: checked ? (opportunity.solutionProposal?.vendorProcurement?.prStatus || 'PR_SUBMITTED') : 'NOT_CREATED',
                            poStatus: checked ? (opportunity.solutionProposal?.vendorProcurement?.poStatus || 'PO_ISSUED') : 'NOT_ISSUED',
                          }
                        }
                      });
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {opportunity.solutionProposal?.vendorProcurement?.requiresVendor && (
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 font-medium mb-1 text-[11px]">Vendor Partner Name</label>
                      <input
                        type="text"
                        value={opportunity.solutionProposal.vendorProcurement.vendorName || ''}
                        onChange={(e) => onUpdateOpportunity({
                          ...opportunity,
                          solutionProposal: {
                            ...opportunity.solutionProposal,
                            vendorProcurement: { ...opportunity.solutionProposal.vendorProcurement, vendorName: e.target.value }
                          }
                        })}
                        placeholder="e.g. Cisco, AWS, Palo Alto"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-medium mb-1 text-[11px]">Purchase Request (PR #)</label>
                      <input
                        type="text"
                        value={opportunity.solutionProposal.vendorProcurement.prNumber || ''}
                        onChange={(e) => onUpdateOpportunity({
                          ...opportunity,
                          solutionProposal: {
                            ...opportunity.solutionProposal,
                            vendorProcurement: { ...opportunity.solutionProposal.vendorProcurement, prNumber: e.target.value }
                          }
                        })}
                        placeholder="e.g. PR-2026-4401"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-medium mb-1 text-[11px]">Purchase Order (PO #)</label>
                      <input
                        type="text"
                        value={opportunity.solutionProposal.vendorProcurement.poNumber || ''}
                        onChange={(e) => onUpdateOpportunity({
                          ...opportunity,
                          solutionProposal: {
                            ...opportunity.solutionProposal,
                            vendorProcurement: { ...opportunity.solutionProposal.vendorProcurement, poNumber: e.target.value }
                          }
                        })}
                        placeholder="e.g. PO-2026-8802"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-0.5">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-700 font-medium text-[11px] flex items-center gap-1">
                          <Link2 className="w-3 h-3 text-blue-500" />
                          Vendor Proposal Link to File
                        </label>
                        {opportunity.solutionProposal.vendorProcurement.vendorProposalLink && (
                          <a
                            href={opportunity.solutionProposal.vendorProcurement.vendorProposalLink.startsWith('http') ? opportunity.solutionProposal.vendorProcurement.vendorProposalLink : `https://${opportunity.solutionProposal.vendorProcurement.vendorProposalLink}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-0.5 hover:underline"
                          >
                            Open Link <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                      <input
                        type="url"
                        value={opportunity.solutionProposal.vendorProcurement.vendorProposalLink || ''}
                        onChange={(e) => onUpdateOpportunity({
                          ...opportunity,
                          solutionProposal: {
                            ...opportunity.solutionProposal,
                            vendorProcurement: { ...opportunity.solutionProposal.vendorProcurement, vendorProposalLink: e.target.value }
                          }
                        })}
                        placeholder="https://drive.google.com/... or SharePoint link to vendor quote/proposal"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1 text-[11px]">Vendor Quote Amount</label>
                      <div className="flex items-center space-x-1.5">
                        <select
                          value={opportunity.solutionProposal.vendorProcurement.vendorQuoteCurrency || opportunity.solutionProposal?.ibsiInternalCurrency || opportunity.currency || 'USD'}
                          onChange={(e) => {
                            const newCurr = e.target.value;
                            onUpdateOpportunity({
                              ...opportunity,
                              solutionProposal: {
                                ...opportunity.solutionProposal,
                                vendorProcurement: {
                                  ...opportunity.solutionProposal.vendorProcurement,
                                  vendorQuoteCurrency: newCurr,
                                }
                              }
                            });
                          }}
                          className="bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 text-xs shrink-0"
                        >
                          {SUPPORTED_CURRENCIES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.code} ({c.symbol})
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={opportunity.solutionProposal.vendorProcurement.vendorQuoteAmount || 0}
                          onChange={(e) => onUpdateOpportunity({
                            ...opportunity,
                            solutionProposal: {
                              ...opportunity.solutionProposal,
                              vendorProcurement: { ...opportunity.solutionProposal.vendorProcurement, vendorQuoteAmount: parseFloat(e.target.value) || 0 }
                            }
                          })}
                          placeholder="0.00"
                          className="flex-1 w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ACTION FOOTER */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-200">
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => {
                    setReturnToStage1Reason('');
                    setReturnToStage1Error('');
                    setShowReturnToStage1Modal(true);
                  }}
                  className="inline-flex items-center justify-center px-3.5 py-2 text-xs font-bold rounded-lg border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 hover:border-amber-400 shadow-xs transition-all cursor-pointer gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                  Return to Sales Intake
                </button>
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => onAdvanceStage('SALES_PROPOSAL_REVIEW', 'Proposal & Pricing Released to Sales', comments || 'Technical design, client proposal document, and pricing model completed.')}
                  className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-xs transition-all cursor-pointer gap-1.5"
                >
                  Release Proposal & Pricing to Sales for Review
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* STAGE 3: SALES PROPOSAL REVIEW */}
      {currentStage === 'SALES_PROPOSAL_REVIEW' && (() => {
        const propLink = opportunity.solutionProposal?.clientProposalLink || opportunity.solutionProposal?.solutionDocName;
        const calcLink = opportunity.solutionProposal?.pricingCalculatorLink;
        const tcv = opportunity.dealValue || 0;
        const internalCost = opportunity.solutionProposal?.ibsiInternalCost || 0;
        const grossMargin = tcv > 0 ? (((tcv - internalCost) / tcv) * 100) : 0;

        // Stage 3 Ingress & SLA parameters
        const stage3TriggerDate = opportunity.salesReviewData?.stage3TriggerDate || 
          (opportunity.currentStage === 'SALES_PROPOSAL_REVIEW' ? (opportunity.stageEnteredAt || opportunity.updatedAt || opportunity.createdAt) : (opportunity.stageEnteredAt || opportunity.createdAt));
        
        const slaTriggerToAckDays = opportunity.salesReviewData?.slaTriggerToAckDays || 2;
        const stage3TargetSlaDays = opportunity.salesReviewData?.stage3TargetSlaDays || STAGE_MAP.SALES_PROPOSAL_REVIEW?.targetSlaDays || 3;
        
        const nowMs = Date.now();
        const triggerMs = stage3TriggerDate ? new Date(stage3TriggerDate).getTime() : nowMs;
        const elapsedDaysFromTrigger = Math.max(0, Math.floor((nowMs - triggerMs) / (1000 * 60 * 60 * 24)));
        
        // Auto-default logic: if no manual input in acknowledged date after SLA days, default to Trigger Date + SLA
        const rawAckDate = opportunity.salesReviewData?.acknowledgedStartDate || '';
        const isAutoDefaulted = !rawAckDate && elapsedDaysFromTrigger >= slaTriggerToAckDays;
        const autoDefaultedAckDate = new Date(triggerMs + slaTriggerToAckDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const effectiveAckDate = rawAckDate || (isAutoDefaulted ? autoDefaultedAckDate : '');
        
        const isAckOverdue = !rawAckDate && elapsedDaysFromTrigger > slaTriggerToAckDays;
        const ackMs = effectiveAckDate ? new Date(effectiveAckDate).getTime() : null;
        const elapsedDaysFromAck = ackMs ? Math.max(0, Math.floor((nowMs - ackMs) / (1000 * 60 * 60 * 24))) : 0;
        const isSalesReviewOverdue = effectiveAckDate ? elapsedDaysFromAck > stage3TargetSlaDays : false;

        const handleSetAckDateToday = () => {
          const todayStr = new Date().toISOString().split('T')[0];
          onUpdateOpportunity({
            ...opportunity,
            salesReviewData: {
              ...opportunity.salesReviewData,
              stage3TriggerDate,
              acknowledgedStartDate: todayStr,
              slaTriggerToAckDays,
              stage3TargetSlaDays,
            }
          });
        };

        return (
          <div className="space-y-4 text-xs">
            {/* SOLUTION & PROPOSAL SPECIFICATION SUMMARY */}
            <div className="p-3.5 bg-white rounded-lg border border-slate-200 space-y-2.5">
              <div className="font-semibold text-slate-900 text-sm flex items-center justify-between">
                <span>Solution & Proposal Specification Summary:</span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                  Stage 2 Complete
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs pt-1">
                <div>
                  <span className="text-slate-500 block text-[11px]">Client Proposal Doc / Link</span>
                  {propLink ? (
                    propLink.startsWith('http://') || propLink.startsWith('https://') ? (
                      <a
                        href={propLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1 break-all"
                      >
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span>{propLink}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="font-bold text-slate-800 break-all">{propLink}</span>
                    )
                  ) : (
                    <span className="text-slate-400 italic">Standard Attached</span>
                  )}
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px]">Client Proposal Price (TCV)</span>
                  <span className="font-extrabold text-emerald-700">
                    {formatCurrency(tcv, opportunity.currency)}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px]">IBSI Internal Cost</span>
                  <span className="font-bold text-blue-800">
                    {formatCurrency(internalCost, opportunity.solutionProposal?.ibsiInternalCurrency || opportunity.currency)}
                    <span className="ml-1 text-[10px] text-slate-500">({grossMargin.toFixed(1)}% Margin)</span>
                  </span>
                </div>

                {calcLink && (
                  <div className="sm:col-span-2">
                    <span className="text-slate-500 block text-[11px]">Pricing Calculator Link</span>
                    {calcLink.startsWith('http://') || calcLink.startsWith('https://') ? (
                      <a
                        href={calcLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1 break-all"
                      >
                        <Link2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{calcLink}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="font-bold text-slate-800 break-all">{calcLink}</span>
                    )}
                  </div>
                )}

                {opportunity.solutionProposal?.torReceivedDate && (
                  <div>
                    <span className="text-slate-500 block text-[11px]">TOR Received Baseline</span>
                    <span className="font-medium text-slate-700">{formatDate(opportunity.solutionProposal.torReceivedDate)}</span>
                  </div>
                )}
              </div>

              {opportunity.solutionProposal?.vendorProcurement?.requiresVendor && (
                <p className="text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                  ⚠️ Includes Vendor Component: <strong>{opportunity.solutionProposal.vendorProcurement.vendorName}</strong> (PR: {opportunity.solutionProposal.vendorProcurement.prNumber || 'Pending'})
                </p>
              )}
            </div>

            {/* STAGE 3 CLIENT PROPOSAL DETAILS & PRICE (TCV) UPDATE PANEL */}
            <ClientProposalUpdatePanel
              opportunity={opportunity}
              stage="SALES_PROPOSAL_REVIEW"
              currentRole={currentRole}
              onUpdateOpportunity={onUpdateOpportunity}
            />

            {/* STAGE 3 TIMELINE, ACKNOWLEDGMENT & SLA ENGINE */}
            <div className="p-3.5 bg-blue-50/40 rounded-xl border border-blue-200/70 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-blue-200/50 pb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    ⏱️
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">Sales Review SLA & Acknowledgment Tracking</span>
                    <span className="text-[11px] text-slate-600">Stage 3 trigger ingress and active sales SLA reference benchmark</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                    Handover SLA: {slaTriggerToAckDays} Days
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold">
                    Sales Review Target: {stage3TargetSlaDays} Days (post-Ack)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Assigned Sales Lead */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">
                    Assigned Sales Lead <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={opportunity.salesLead || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      onUpdateOpportunity({
                        ...opportunity,
                        salesLead: val,
                      });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
                  >
                    <option value="">-- Select Sales Lead --</option>
                    {opportunity.salesLead && (
                      <option value={opportunity.salesLead}>★ {opportunity.salesLead} (Assigned)</option>
                    )}
                    <optgroup label="── Sales Leads & Account Executives ──">
                      {salesResources.map((r) => (
                        <option key={r.id} value={r.name}>
                          {r.name} — {r.role} ({r.department || 'Sales'})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="── Other Team Members ──">
                      {nonSalesResources.map((r) => (
                        <option key={r.id} value={r.name}>
                          {r.name} — {r.role}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  <span className="text-[10px] text-slate-400 block">
                    Primary commercial owner responsible for proposal presentation.
                  </span>
                </div>

                {/* Stage 3 Trigger Date (Non-editable) */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 flex items-center gap-1">
                    <span>Stage 3 Trigger Date</span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-600 text-[9px] font-bold">Non-Editable</span>
                  </label>
                  <div className="w-full bg-slate-100/90 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-mono text-xs flex items-center justify-between cursor-not-allowed">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{formatDate(stage3TriggerDate)}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-sans">
                      {elapsedDaysFromTrigger}d ago
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    Workflow ingress timestamp when opportunity entered Stage 3.
                  </span>
                </div>

                {/* Acknowledged Start Date (Main reference of SLA) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700 flex items-center gap-1">
                      <span>Acknowledged Start Date</span>
                      <span className="text-purple-600 font-normal text-[10px]">(SLA Baseline)</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleSetAckDateToday}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-bold hover:underline"
                    >
                      Set Today
                    </button>
                  </div>
                  <input
                    type="date"
                    value={effectiveAckDate ? effectiveAckDate.split('T')[0] : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      onUpdateOpportunity({
                        ...opportunity,
                        salesReviewData: {
                          ...opportunity.salesReviewData,
                          stage3TriggerDate,
                          acknowledgedStartDate: val,
                          slaTriggerToAckDays,
                          stage3TargetSlaDays,
                        }
                      });
                    }}
                    className={`w-full bg-white border rounded-lg px-2.5 py-1.5 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs ${
                      !rawAckDate && !isAutoDefaulted ? 'border-amber-400 bg-amber-50/40' : 'border-slate-300'
                    }`}
                  />
                  <div className="text-[10px] text-slate-500 flex items-center justify-between flex-wrap gap-1">
                    <span>
                      {rawAckDate 
                        ? 'Sales start date acknowledged.' 
                        : isAutoDefaulted 
                          ? `Auto-defaulted to Trigger Date + ${slaTriggerToAckDays}d SLA.`
                          : `Defaults to Trigger + ${slaTriggerToAckDays}d SLA if uninputted.`
                      }
                    </span>
                    {isAutoDefaulted && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold text-[9px]">
                        Auto-Default Applied
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Handover & Stage 3 SLA Status Notification Banner */}
              <div className={`p-2.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                !rawAckDate
                  ? isAutoDefaulted
                    ? 'bg-amber-50 border-amber-300 text-amber-800'
                    : isAckOverdue
                      ? 'bg-rose-50 border-rose-300 text-rose-800'
                      : 'bg-blue-50 border-blue-200 text-blue-900'
                  : isSalesReviewOverdue
                    ? 'bg-rose-50 border-rose-300 text-rose-800'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-800'
              }`}>
                <div className="flex items-start sm:items-center space-x-2">
                  {!rawAckDate ? (
                    isAutoDefaulted ? (
                      <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
                    ) : isAckOverdue ? (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5 sm:mt-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5 sm:mt-0" />
                    )
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
                  )}
                  <div>
                    {!rawAckDate ? (
                      isAutoDefaulted ? (
                        <span>
                          <strong>⚠️ Auto-Default SLA Active:</strong> Handover SLA ({slaTriggerToAckDays} days) elapsed without manual input. Acknowledged Start Date defaulted to <strong>{formatDate(autoDefaultedAckDate)}</strong> (Trigger + {slaTriggerToAckDays}d). Active for notification & SLA tracking.
                        </span>
                      ) : isAckOverdue ? (
                        <span>
                          <strong>🚨 Handover Acknowledgment Overdue:</strong> {elapsedDaysFromTrigger} days elapsed since trigger. Record Acknowledged Start Date or default will apply.
                        </span>
                      ) : (
                        <span>
                          <strong>⏱️ Handover SLA in Progress:</strong> {elapsedDaysFromTrigger} of {slaTriggerToAckDays} days elapsed. Awaiting Sales Lead acknowledgment. (Will auto-default to Trigger Date + {slaTriggerToAckDays}d after SLA threshold).
                        </span>
                      )
                    ) : (
                      <span>
                        <strong>✅ Stage 3 Sales Review SLA Active:</strong> Sales work acknowledged on <strong>{formatDate(rawAckDate)}</strong>. {elapsedDaysFromAck} of {stage3TargetSlaDays} days elapsed ({stage3TargetSlaDays - elapsedDaysFromAck > 0 ? `${stage3TargetSlaDays - elapsedDaysFromAck} days remaining` : 'Review Overdue'}).
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-1.5 self-end sm:self-auto">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/80 border border-current shadow-2xs">
                    {effectiveAckDate ? `Base: ${effectiveAckDate}` : `SLA: ${slaTriggerToAckDays}d`}
                  </span>
                </div>
              </div>
            </div>

            {/* SALES REVIEW NOTES */}
            <div>
              <label className="block text-slate-700 font-medium mb-1">Sales Review Comments & Commercial Notes</label>
              <textarea
                rows={2}
                value={opportunity.salesReviewNotes || opportunity.salesReviewData?.salesReviewNotes || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  onUpdateOpportunity({ 
                    ...opportunity, 
                    salesReviewNotes: val,
                    salesReviewData: {
                      ...opportunity.salesReviewData,
                      stage3TriggerDate,
                      acknowledgedStartDate: effectiveAckDate,
                      slaTriggerToAckDays,
                      stage3TargetSlaDays,
                      salesReviewNotes: val,
                    }
                  });
                }}
                placeholder="Confirm pricing alignment, commercial scope, target client presentation timeline..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>

            {/* ACTION FOOTER */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-200">
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => {
                    setReturnToStage2Reason('');
                    setReturnToStage2Error('');
                    setShowReturnToStage2Modal(true);
                  }}
                  className="inline-flex items-center justify-center px-3.5 py-2 text-xs font-bold rounded-lg border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 hover:border-amber-400 shadow-xs transition-all cursor-pointer gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                  Return to Solution Design
                </button>
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
                    // Ensure stage 3 review data is preserved when submitting
                    if (!opportunity.salesReviewData?.acknowledgedStartDate && effectiveAckDate) {
                      onUpdateOpportunity({
                        ...opportunity,
                        salesReviewData: {
                          ...opportunity.salesReviewData,
                          stage3TriggerDate,
                          acknowledgedStartDate: effectiveAckDate,
                          slaTriggerToAckDays,
                          stage3TargetSlaDays,
                        }
                      });
                    }
                    onAdvanceStage('CONTRACTS_PROPOSAL_REVIEW', 'Proposal Submitted to Contracts', comments || 'Sales reviewed and endorsed proposal to Contracts.');
                  }}
                  className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-xs transition-all cursor-pointer gap-1.5"
                >
                  Submit Proposal to Contracts Team
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* STAGE 4: CONTRACTS TEAM PROPOSAL REVIEW & RECORD */}
      {currentStage === 'CONTRACTS_PROPOSAL_REVIEW' && (() => {
        const propLink = opportunity.solutionProposal?.clientProposalLink || opportunity.solutionProposal?.solutionDocName;
        const calcLink = opportunity.solutionProposal?.pricingCalculatorLink;
        const tcv = opportunity.dealValue || 0;
        const internalCost = opportunity.solutionProposal?.ibsiInternalCost || 0;
        const grossMargin = tcv > 0 ? (((tcv - internalCost) / tcv) * 100) : 0;

        // Stage 4 Ingress & SLA parameters
        const stage4TriggerDate = opportunity.contractsReviewData?.stage4TriggerDate || 
          (opportunity.currentStage === 'CONTRACTS_PROPOSAL_REVIEW' ? (opportunity.stageEnteredAt || opportunity.updatedAt || opportunity.createdAt) : (opportunity.stageEnteredAt || opportunity.createdAt));
        
        const slaTriggerToAckDays = opportunity.contractsReviewData?.slaTriggerToAckDays || 2;
        const stage4TargetSlaDays = opportunity.contractsReviewData?.stage4TargetSlaDays || STAGE_MAP.CONTRACTS_PROPOSAL_REVIEW?.targetSlaDays || 3;
        
        const nowMs = Date.now();
        const triggerMs = stage4TriggerDate ? new Date(stage4TriggerDate).getTime() : nowMs;
        const elapsedDaysFromTrigger = Math.max(0, Math.floor((nowMs - triggerMs) / (1000 * 60 * 60 * 24)));
        
        // Auto-default logic: if no manual input in acknowledged date after SLA days, default to Trigger Date + SLA
        const rawAckDate = opportunity.contractsReviewData?.acknowledgedStartDate || '';
        const isAutoDefaulted = !rawAckDate && elapsedDaysFromTrigger >= slaTriggerToAckDays;
        const autoDefaultedAckDate = new Date(triggerMs + slaTriggerToAckDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const effectiveAckDate = rawAckDate || (isAutoDefaulted ? autoDefaultedAckDate : '');
        
        const isAckOverdue = !rawAckDate && elapsedDaysFromTrigger > slaTriggerToAckDays;
        const ackMs = effectiveAckDate ? new Date(effectiveAckDate).getTime() : null;
        const elapsedDaysFromAck = ackMs ? Math.max(0, Math.floor((nowMs - ackMs) / (1000 * 60 * 60 * 24))) : 0;
        const isContractsReviewOverdue = effectiveAckDate ? elapsedDaysFromAck > stage4TargetSlaDays : false;

        // Resource filtering for Contracts Team Processor
        const contractsProcessor = opportunity.contractsProcessor || opportunity.contractsReviewData?.contractsProcessor || '';
        const currentContractType = opportunity.contractsReviewData?.contractType || opportunity.contractType || opportunity.contractDetails?.contractType || (activeContractTypes.find(c => c.isDefault)?.value || 'Service Order');
        
        const contractsResources = resources.filter(r => 
          r.department?.toLowerCase().includes('legal') || 
          r.department?.toLowerCase().includes('contract') || 
          r.role?.toLowerCase().includes('contract') || 
          r.role?.toLowerCase().includes('counsel') || 
          r.role?.toLowerCase().includes('legal') ||
          r.division?.toLowerCase().includes('legal')
        );
        const nonContractsResources = resources.filter(r => !contractsResources.some(cr => cr.id === r.id));

        const handleSetAckDateToday = () => {
          const todayStr = new Date().toISOString().split('T')[0];
          onUpdateOpportunity({
            ...opportunity,
            contractType: currentContractType,
            contractDetails: {
              ...opportunity.contractDetails,
              contractType: currentContractType,
            },
            contractsReviewData: {
              ...opportunity.contractsReviewData,
              stage4TriggerDate,
              acknowledgedStartDate: todayStr,
              slaTriggerToAckDays,
              stage4TargetSlaDays,
              contractsProcessor: contractsProcessor,
              contractType: currentContractType,
            }
          });
        };

        return (
          <div className="space-y-4 text-xs">
            {/* PROPOSAL & COMMERCIAL CONTEXT SUMMARY */}
            <div className="p-3.5 bg-white rounded-lg border border-slate-200 space-y-2.5">
              <div className="font-semibold text-slate-900 text-sm flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Proposal & Commercial Context for Contracts Review:</span>
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                  Stage 4 Active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs pt-1">
                <div>
                  <span className="text-slate-500 block text-[11px]">Client Proposal Doc / Link</span>
                  {propLink ? (
                    propLink.startsWith('http://') || propLink.startsWith('https://') ? (
                      <a
                        href={propLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1 break-all"
                      >
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span>{propLink}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="font-bold text-slate-800 break-all">{propLink}</span>
                    )
                  ) : (
                    <span className="text-slate-400 italic">Standard Attached</span>
                  )}
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px]">Proposed Deal Value (TCV)</span>
                  <span className="font-extrabold text-emerald-700">
                    {formatCurrency(tcv, opportunity.currency)}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px]">IBSI Internal Cost & Margin</span>
                  <span className="font-bold text-blue-800">
                    {formatCurrency(internalCost, opportunity.solutionProposal?.ibsiInternalCurrency || opportunity.currency)}
                    <span className="ml-1 text-[10px] text-slate-500">({grossMargin.toFixed(1)}%)</span>
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px]">Endorsed by Sales Lead</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>{opportunity.salesLead || 'Unassigned'}</span>
                  </span>
                </div>
              </div>

              {opportunity.solutionProposal?.vendorProcurement?.requiresVendor && (
                <p className="text-amber-800 bg-amber-50 p-2 rounded border border-amber-200 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>
                    Includes 3rd-party vendor scope: <strong>{opportunity.solutionProposal.vendorProcurement.vendorName}</strong> (PR: {opportunity.solutionProposal.vendorProcurement.prNumber || 'Pending'} / PO: {opportunity.solutionProposal.vendorProcurement.poNumber || 'Pending'}).
                  </span>
                </p>
              )}
            </div>

            {/* STAGE 4 CLIENT PROPOSAL DETAILS & DEAL VALUE (TCV) UPDATE PANEL */}
            <ClientProposalUpdatePanel
              opportunity={opportunity}
              stage="CONTRACTS_PROPOSAL_REVIEW"
              currentRole={currentRole}
              onUpdateOpportunity={onUpdateOpportunity}
            />

            {/* STAGE 4 TIMELINE, ACKNOWLEDGMENT, PROCESSOR & SLA ENGINE */}
            <div className="p-3.5 bg-amber-50/40 rounded-xl border border-amber-200/70 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-amber-200/50 pb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-md bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
                    ⏱️
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">Contracts Team Review SLA & Ingress Tracking</span>
                    <span className="text-[11px] text-slate-600">Stage 4 trigger date, contracts processor assignment, and acknowledgment SLA baseline</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                    Handover SLA: {slaTriggerToAckDays} Days
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold">
                    Contracts Review Target: {stage4TargetSlaDays} Days (post-Ack)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Dropdown: Contracts Team Processor (Sync from Resource Repository) */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">
                    Contracts Team Processor <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={contractsProcessor}
                    onChange={(e) => {
                      const val = e.target.value;
                      onUpdateOpportunity({
                        ...opportunity,
                        contractsProcessor: val,
                        contractsReviewData: {
                          ...opportunity.contractsReviewData,
                          stage4TriggerDate,
                          acknowledgedStartDate: effectiveAckDate,
                          slaTriggerToAckDays,
                          stage4TargetSlaDays,
                          contractsProcessor: val,
                          contractType: currentContractType,
                        }
                      });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none text-xs"
                  >
                    <option value="">-- Select Contracts Processor --</option>
                    {contractsProcessor && (
                      <option value={contractsProcessor}>★ {contractsProcessor} (Assigned)</option>
                    )}
                    <optgroup label="── Legal & Contracts Specialists ──">
                      {contractsResources.map((r) => (
                        <option key={r.id} value={r.name}>
                          {r.name} — {r.role} ({r.department || 'Legal & Contracts'})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="── All Team Members ──">
                      {nonContractsResources.map((r) => (
                        <option key={r.id} value={r.name}>
                          {r.name} — {r.role}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  <span className="text-[10px] text-slate-400 block">
                    Contracts specialist processing proposal record & compliance.
                  </span>
                </div>

                {/* Dropdown: Contract Type (Sync from Form Selector & Master Dropdown Admin) */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">
                    Contract Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={currentContractType}
                    onChange={(e) => {
                      const val = e.target.value;
                      onUpdateOpportunity({
                        ...opportunity,
                        contractType: val,
                        contractDetails: {
                          ...opportunity.contractDetails,
                          contractType: val,
                        },
                        contractsReviewData: {
                          ...opportunity.contractsReviewData,
                          stage4TriggerDate,
                          acknowledgedStartDate: effectiveAckDate,
                          slaTriggerToAckDays,
                          stage4TargetSlaDays,
                          contractsProcessor: contractsProcessor,
                          contractType: val,
                        }
                      });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none text-xs"
                  >
                    <option value="">-- Select Contract Type --</option>
                    {activeContractTypes.length > 0 ? (
                      activeContractTypes.map((ct) => (
                        <option key={ct.id} value={ct.value}>
                          {ct.label}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Service Order">Service Order</option>
                        <option value="Service Agreement">Service Agreement</option>
                        <option value="Variation Order">Variation Order</option>
                        <option value="Extension Letter">Extension Letter</option>
                        <option value="Work Authorization Request">Work Authorization Request</option>
                        <option value="Renewal Letter">Renewal Letter</option>
                        <option value="Termination Letter">Termination Letter</option>
                        <option value="SOW">SOW</option>
                        <option value="Proposal">Proposal</option>
                        <option value="Amendment">Amendment</option>
                      </>
                    )}
                  </select>
                  <span className="text-[10px] text-slate-400 block">
                    Agreement classification synced with Form Selector Admin.
                  </span>
                </div>

                {/* Non-editable field: Stage 4 Trigger Date */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 flex items-center gap-1">
                    <span>Stage 4 Trigger Date</span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-600 text-[9px] font-bold">Non-Editable</span>
                  </label>
                  <div className="w-full bg-slate-100/90 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-mono text-xs flex items-center justify-between cursor-not-allowed">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{formatDate(stage4TriggerDate)}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-sans">
                      {elapsedDaysFromTrigger}d ago
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    Workflow ingress timestamp when opportunity entered Stage 4.
                  </span>
                </div>

                {/* Date field: Acknowledged Start Date (Main reference of SLA) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700 flex items-center gap-1">
                      <span>Acknowledged Start Date</span>
                      <span className="text-amber-700 font-normal text-[10px]">(SLA Baseline)</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleSetAckDateToday}
                      className="text-[10px] text-amber-700 hover:text-amber-900 font-bold hover:underline cursor-pointer"
                    >
                      Set Today
                    </button>
                  </div>
                  <input
                    type="date"
                    value={effectiveAckDate ? effectiveAckDate.split('T')[0] : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      onUpdateOpportunity({
                        ...opportunity,
                        contractsReviewData: {
                          ...opportunity.contractsReviewData,
                          stage4TriggerDate,
                          acknowledgedStartDate: val,
                          slaTriggerToAckDays,
                          stage4TargetSlaDays,
                          contractsProcessor: contractsProcessor,
                          contractType: currentContractType,
                        }
                      });
                    }}
                    className={`w-full bg-white border rounded-lg px-2.5 py-1.5 text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none text-xs ${
                      !rawAckDate && !isAutoDefaulted ? 'border-amber-400 bg-amber-50/40' : 'border-slate-300'
                    }`}
                  />
                  <div className="text-[10px] text-slate-500 flex items-center justify-between flex-wrap gap-1">
                    <span>
                      {rawAckDate 
                        ? 'Contracts start date acknowledged.' 
                        : isAutoDefaulted 
                          ? `Auto-defaulted to Trigger Date + ${slaTriggerToAckDays}d SLA.`
                          : `Defaults to Trigger + ${slaTriggerToAckDays}d SLA if uninputted.`
                      }
                    </span>
                    {isAutoDefaulted && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold text-[9px]">
                        Auto-Default Applied
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Handover & Stage 4 SLA Status Notification Banner */}
              <div className={`p-2.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                !rawAckDate
                  ? isAutoDefaulted
                    ? 'bg-amber-50 border-amber-300 text-amber-800'
                    : isAckOverdue
                      ? 'bg-rose-50 border-rose-300 text-rose-800'
                      : 'bg-amber-50/80 border-amber-200 text-amber-900'
                  : isContractsReviewOverdue
                    ? 'bg-rose-50 border-rose-300 text-rose-800'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-800'
              }`}>
                <div className="flex items-start sm:items-center space-x-2">
                  {!rawAckDate ? (
                    isAutoDefaulted ? (
                      <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
                    ) : isAckOverdue ? (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5 sm:mt-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
                    )
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
                  )}
                  <div>
                    {!rawAckDate ? (
                      isAutoDefaulted ? (
                        <span>
                          <strong>⚠️ Auto-Default SLA Active:</strong> Handover SLA ({slaTriggerToAckDays} days) elapsed without manual input. Acknowledged Start Date defaulted to <strong>{formatDate(autoDefaultedAckDate)}</strong> (Trigger + {slaTriggerToAckDays}d). Active for notification & SLA tracking.
                        </span>
                      ) : isAckOverdue ? (
                        <span>
                          <strong>🚨 Handover Acknowledgment Overdue:</strong> {elapsedDaysFromTrigger} days elapsed since trigger. Record Acknowledged Start Date or default will apply.
                        </span>
                      ) : (
                        <span>
                          <strong>⏱️ Handover SLA in Progress:</strong> {elapsedDaysFromTrigger} of {slaTriggerToAckDays} days elapsed. Awaiting Contracts Team acknowledgment. (Will auto-default to Trigger Date + {slaTriggerToAckDays}d after SLA threshold).
                        </span>
                      )
                    ) : (
                      <span>
                        <strong>✅ Stage 4 Contracts Review SLA Active:</strong> Contracts processing acknowledged on <strong>{formatDate(rawAckDate)}</strong>. {elapsedDaysFromAck} of {stage4TargetSlaDays} days elapsed ({stage4TargetSlaDays - elapsedDaysFromAck > 0 ? `${stage4TargetSlaDays - elapsedDaysFromAck} days remaining` : 'Review Overdue'}).
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-1.5 self-end sm:self-auto">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/80 border border-current shadow-2xs">
                    {effectiveAckDate ? `Base: ${effectiveAckDate}` : `SLA: ${slaTriggerToAckDays}d`}
                  </span>
                </div>
              </div>
            </div>

            {/* CONTRACTS REVIEW CHECKLIST & NOTES */}
            <div className="p-3.5 bg-white rounded-lg border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900 text-sm">Contracts & Legal Review Checklist:</div>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li>Review intellectual property clauses and deliverable specifications</li>
                <li>Verify liability caps (standard 1.0x contract value)</li>
                <li>Record proposal in company registry for audit tracking</li>
              </ul>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Contracts Specialist Review Notes</label>
              <textarea
                rows={2}
                value={opportunity.contractsReviewNotes || opportunity.contractsReviewData?.contractsReviewNotes || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  onUpdateOpportunity({ 
                    ...opportunity, 
                    contractsReviewNotes: val,
                    contractsReviewData: {
                      ...opportunity.contractsReviewData,
                      stage4TriggerDate,
                      acknowledgedStartDate: effectiveAckDate,
                      slaTriggerToAckDays,
                      stage4TargetSlaDays,
                      contractsProcessor: contractsProcessor,
                      contractType: currentContractType,
                      contractsReviewNotes: val,
                    }
                  });
                }}
                placeholder="Add legal / compliance approvals or notes..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>

            {/* ACTION FOOTER */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-200">
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => {
                    setReturnToStage3Reason('');
                    setReturnToStage3Error('');
                    setShowReturnToStage3Modal(true);
                  }}
                  className="inline-flex items-center justify-center px-3.5 py-2 text-xs font-bold rounded-lg border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 hover:border-amber-400 shadow-xs transition-all cursor-pointer gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                  Return to Sales for Update
                </button>
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const extraUpdates: Partial<Opportunity> = {
                      contractType: currentContractType,
                      contractDetails: {
                        ...opportunity.contractDetails,
                        contractType: currentContractType,
                      },
                      contractsProcessor: contractsProcessor || opportunity.contractsProcessor,
                      contractsReviewData: {
                        ...opportunity.contractsReviewData,
                        stage4TriggerDate,
                        acknowledgedStartDate: effectiveAckDate,
                        slaTriggerToAckDays,
                        stage4TargetSlaDays,
                        contractsProcessor: contractsProcessor,
                        contractType: currentContractType,
                        contractsReviewNotes: opportunity.contractsReviewNotes || opportunity.contractsReviewData?.contractsReviewNotes,
                      },
                      initialFinanceReviewData: {
                        ...opportunity.initialFinanceReviewData,
                        stage5TriggerDate: new Date().toISOString(),
                      }
                    };

                    onAdvanceStage(
                      'INITIAL_FINANCE_APPROVAL',
                      'Proposal Approved by Contracts',
                      comments || 'Contracts team reviewed, recorded proposal code, and endorsed to Finance.',
                      extraUpdates
                    );
                  }}
                  className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-xs transition-all cursor-pointer gap-1.5"
                >
                  Approve & Endorse to Finance Team
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* STAGE 5: INITIAL FINANCE APPROVAL */}
      {currentStage === 'INITIAL_FINANCE_APPROVAL' && (() => {
        const propLink = opportunity.solutionProposal?.clientProposalLink || opportunity.solutionProposal?.solutionDocName;
        const calcLink = opportunity.solutionProposal?.pricingCalculatorLink;
        const tcv = opportunity.dealValue || 0;
        const internalCost = opportunity.solutionProposal?.ibsiInternalCost || 
          ((opportunity.solutionProposal?.estimatedDeliveryCost || 0) + (opportunity.solutionProposal?.vendorProcurement?.vendorQuoteAmount || 0));
        const grossProfit = tcv - internalCost;
        const grossMarginPercent = tcv > 0 ? ((grossProfit / tcv) * 100) : 0;

        // Stage 5 Ingress & SLA parameters
        const stage5TriggerDate = opportunity.initialFinanceReviewData?.stage5TriggerDate || 
          (opportunity.currentStage === 'INITIAL_FINANCE_APPROVAL' 
            ? (opportunity.stageEnteredAt || opportunity.updatedAt || opportunity.createdAt) 
            : (opportunity.stageEnteredAt || opportunity.createdAt));
        
        const slaTriggerToAckDays = opportunity.initialFinanceReviewData?.slaTriggerToAckDays || 2;
        const stage5TargetSlaDays = opportunity.initialFinanceReviewData?.stage5TargetSlaDays || STAGE_MAP.INITIAL_FINANCE_APPROVAL?.targetSlaDays || 2;
        
        const nowMs = Date.now();
        const triggerMs = stage5TriggerDate ? new Date(stage5TriggerDate).getTime() : nowMs;
        const elapsedDaysFromTrigger = Math.max(0, Math.floor((nowMs - triggerMs) / (1000 * 60 * 60 * 24)));
        
        // Auto-default logic: if no manual input in acknowledged date after SLA days, default to Trigger Date + SLA
        const rawAckDate = opportunity.initialFinanceReviewData?.acknowledgedStartDate || '';
        const isAutoDefaulted = !rawAckDate && elapsedDaysFromTrigger >= slaTriggerToAckDays;
        const autoDefaultedAckDate = new Date(triggerMs + slaTriggerToAckDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const effectiveAckDate = rawAckDate || (isAutoDefaulted ? autoDefaultedAckDate : '');
        
        const isAckOverdue = !rawAckDate && elapsedDaysFromTrigger > slaTriggerToAckDays;
        const ackMs = effectiveAckDate ? new Date(effectiveAckDate).getTime() : null;
        const elapsedDaysFromAck = ackMs ? Math.max(0, Math.floor((nowMs - ackMs) / (1000 * 60 * 60 * 24))) : 0;
        const isFinanceReviewOverdue = effectiveAckDate ? elapsedDaysFromAck > stage5TargetSlaDays : false;

        // Resource filtering for Finance Team Processor
        const financeProcessor = opportunity.financeProcessor || opportunity.initialFinanceReviewData?.financeProcessor || '';
        
        const financeResources = resources.filter(r => 
          r.department?.toLowerCase().includes('finance') || 
          r.department?.toLowerCase().includes('accounting') || 
          r.role?.toLowerCase().includes('finance') || 
          r.role?.toLowerCase().includes('deal desk') || 
          r.role?.toLowerCase().includes('controller') || 
          r.role?.toLowerCase().includes('cfo') ||
          r.division?.toLowerCase().includes('finance')
        );
        const nonFinanceResources = resources.filter(r => !financeResources.some(fr => fr.id === r.id));

        const handleSetAckDateToday = () => {
          const todayStr = new Date().toISOString().split('T')[0];
          onUpdateOpportunity({
            ...opportunity,
            financeProcessor: financeProcessor,
            initialFinanceReviewData: {
              ...opportunity.initialFinanceReviewData,
              stage5TriggerDate,
              acknowledgedStartDate: todayStr,
              slaTriggerToAckDays,
              stage5TargetSlaDays,
              financeProcessor: financeProcessor,
            }
          });
        };

        const financeReviewNotes = opportunity.initialFinanceReviewData?.financeReviewNotes || opportunity.initialFinanceApproval?.comments || '';
        const contractTypeDisplay = opportunity.contractsReviewData?.contractType || opportunity.contractType || opportunity.contractDetails?.contractType || 'Service Order';

        return (
          <div className="space-y-4 text-xs">
            {/* Header Stage Overview */}
            <div className="p-3.5 bg-gradient-to-r from-purple-50/80 to-indigo-50/80 rounded-xl border border-purple-200/90 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                  <Calculator className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">Stage 5: Initial Finance Approval & Margin Clearance</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                      Finance / Deal Desk Review
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Verify commercial profitability, pricing baseline, vendor cost commitments, and approve proposal release to client.
                  </p>
                </div>
              </div>

              {/* Status Pill */}
              <div className="flex items-center gap-2 shrink-0">
                {isFinanceReviewOverdue ? (
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1 shadow-2xs">
                    <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                    Review Overdue ({elapsedDaysFromAck}d / {stage5TargetSlaDays}d SLA)
                  </span>
                ) : effectiveAckDate ? (
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 shadow-2xs">
                    <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                    Acknowledged & Under Finance Review ({elapsedDaysFromAck}d / {stage5TargetSlaDays}d SLA)
                  </span>
                ) : isAckOverdue ? (
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 shadow-2xs">
                    <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                    Ack Auto-Defaulted (Trigger + {slaTriggerToAckDays}d SLA)
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1 shadow-2xs">
                    <Clock className="w-3 h-3 text-blue-600 shrink-0" />
                    Awaiting Finance Acknowledgment ({elapsedDaysFromTrigger}d elapsed / {slaTriggerToAckDays}d Ack SLA)
                  </span>
                )}
              </div>
            </div>

            {/* Stage 5 Governance Grid: Processor, Stage 5 Trigger Date, Acknowledged Start Date */}
            <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200/90 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-purple-600" />
                  <h4 className="font-bold text-slate-800 text-xs">Stage 5 Timelines & Assigned Finance Processor</h4>
                </div>
                <div className="text-[11px] text-slate-500">
                  Ack SLA: <strong className="text-slate-700">{slaTriggerToAckDays} Days</strong> • Finance Review SLA: <strong className="text-slate-700">{stage5TargetSlaDays} Days</strong>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Dropdown: Finance team Processor (Sync from Resource Repository) */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 flex items-center justify-between">
                    <span>
                      Finance Team Processor <span className="text-rose-500">*</span>
                    </span>
                    <span className="text-[10px] text-purple-600 font-normal">Synced from Resources</span>
                  </label>
                  <select
                    value={financeProcessor}
                    onChange={(e) => {
                      const val = e.target.value;
                      onUpdateOpportunity({
                        ...opportunity,
                        financeProcessor: val,
                        initialFinanceReviewData: {
                          ...opportunity.initialFinanceReviewData,
                          stage5TriggerDate,
                          acknowledgedStartDate: effectiveAckDate,
                          slaTriggerToAckDays,
                          stage5TargetSlaDays,
                          financeProcessor: val,
                        }
                      });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none text-xs"
                  >
                    <option value="">-- Select Finance Processor --</option>
                    {financeResources.length > 0 && (
                      <optgroup label="Finance & Deal Desk Team">
                        {financeResources.map((res) => (
                          <option key={res.id} value={res.name}>
                            {res.name} — {res.role || 'Finance Specialist'} {res.department ? `(${res.department})` : ''}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {nonFinanceResources.length > 0 && (
                      <optgroup label="Other Deal Team Resources">
                        {nonFinanceResources.map((res) => (
                          <option key={res.id} value={res.name}>
                            {res.name} — {res.role || 'Member'} {res.department ? `(${res.department})` : ''}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  <span className="text-[10px] text-slate-400 block">
                    Designated finance officer or deal desk analyst managing commercial clearance.
                  </span>
                </div>

                {/* Non-editable field: Stage 5 Trigger Date */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Stage 5 Trigger Date</span>
                    <span className="text-[10px] text-slate-400 font-normal">(Non-editable Ingress)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={stage5TriggerDate ? `${stage5TriggerDate.split('T')[0]} (${formatDate(stage5TriggerDate)})` : 'Pending Stage Ingress'}
                      className="w-full bg-slate-100 border border-slate-300 text-slate-700 font-bold rounded-lg px-2.5 py-1.5 text-xs cursor-not-allowed select-all"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    Recorded automatically when endorsed by Contracts Team ({elapsedDaysFromTrigger}d elapsed).
                  </span>
                </div>

                {/* Date field: Acknowledged Start Date (Main reference for Stage 5 SLA) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-purple-600" />
                      <span>Acknowledged Start Date</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleSetAckDateToday}
                      className="text-[10px] font-bold text-purple-600 hover:text-purple-800 hover:underline cursor-pointer flex items-center gap-0.5"
                      title="Set today's date as Acknowledged Start Date"
                    >
                      <Check className="w-3 h-3" />
                      Set Today
                    </button>
                  </div>
                  <input
                    type="date"
                    value={effectiveAckDate}
                    onChange={(e) => {
                      const val = e.target.value;
                      onUpdateOpportunity({
                        ...opportunity,
                        financeProcessor: financeProcessor,
                        initialFinanceReviewData: {
                          ...opportunity.initialFinanceReviewData,
                          stage5TriggerDate,
                          acknowledgedStartDate: val,
                          slaTriggerToAckDays,
                          stage5TargetSlaDays,
                          financeProcessor: financeProcessor,
                        }
                      });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none text-xs"
                  />
                  <span className="text-[10px] text-slate-500 block">
                    {isAutoDefaulted ? (
                      <span className="text-amber-700 font-medium">
                        * Auto-defaulted to Trigger + {slaTriggerToAckDays}d SLA since no manual input was made.
                      </span>
                    ) : rawAckDate ? (
                      <span className="text-emerald-700 font-medium">
                        ✓ Finance review SLA reference active ({elapsedDaysFromAck}d / {stage5TargetSlaDays}d).
                      </span>
                    ) : (
                      <span>Primary SLA reference baseline. Auto-defaults after {slaTriggerToAckDays} days.</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Parameters & Commercial Health Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1 shadow-2xs">
                <span className="text-slate-500 block text-[11px] font-medium">Proposed Deal Value (TCV)</span>
                <span className="text-base font-bold text-slate-900">
                  {formatCurrency(tcv, opportunity.currency)}
                </span>
                <span className="text-[10px] text-slate-400 block">Total commercial contract value</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1 shadow-2xs">
                <span className="text-slate-500 block text-[11px] font-medium">Est. Internal / Delivery Cost</span>
                <span className="text-base font-bold text-slate-800">
                  {formatCurrency(internalCost, opportunity.currency)}
                </span>
                <span className="text-[10px] text-slate-400 block">Delivery resources + vendor quotes</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1 shadow-2xs">
                <span className="text-slate-500 block text-[11px] font-medium">Est. Gross Profit ($)</span>
                <span className={`text-base font-bold ${grossProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {formatCurrency(grossProfit, opportunity.currency)}
                </span>
                <span className="text-[10px] text-slate-400 block">Net commercial dollar contribution</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 block text-[11px] font-medium">Gross Margin (%)</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    grossMarginPercent >= 35 ? 'bg-emerald-100 text-emerald-800' : grossMarginPercent >= 20 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {grossMarginPercent >= 35 ? 'Healthy Margin' : grossMarginPercent >= 20 ? 'Standard' : 'Low Margin Alert'}
                  </span>
                </div>
                <span className={`text-base font-bold ${grossMarginPercent >= 30 ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {grossMarginPercent.toFixed(1)}%
                </span>
                <span className="text-[10px] text-slate-400 block">Benchmark target: ≥ 35.0%</span>
              </div>
            </div>

            {/* STAGE 5 CLIENT PROPOSAL DETAILS, DEAL VALUE (TCV) & COST MODEL UPDATE PANEL */}
            <ClientProposalUpdatePanel
              opportunity={opportunity}
              stage="INITIAL_FINANCE_APPROVAL"
              currentRole={currentRole}
              onUpdateOpportunity={onUpdateOpportunity}
            />

            {/* Supporting Proposals, Calculator & Contract Context */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1 shadow-2xs">
                <span className="text-slate-500 block text-[10px] font-semibold uppercase">Contract Classification</span>
                <div className="flex items-center gap-1.5">
                  <FileSignature className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="font-bold text-slate-900 text-xs">{contractTypeDisplay}</span>
                </div>
                <span className="text-[10px] text-slate-400 block">Validated in Stage 4 by Contracts Team</span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1 shadow-2xs">
                <span className="text-slate-500 block text-[10px] font-semibold uppercase">Client Proposal Link</span>
                {propLink ? (
                  propLink.startsWith('http://') || propLink.startsWith('https://') ? (
                    <a
                      href={propLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1 break-all text-xs"
                    >
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{propLink}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="font-semibold text-blue-800 break-all flex items-center gap-1 text-xs">
                      <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate">{propLink}</span>
                    </span>
                  )
                ) : (
                  <span className="text-slate-400 italic text-xs">No proposal document link</span>
                )}
                <span className="text-[10px] text-slate-400 block">Official client-facing proposal scope</span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1 shadow-2xs">
                <span className="text-slate-500 block text-[10px] font-semibold uppercase">Pricing Calculator Link</span>
                {calcLink ? (
                  calcLink.startsWith('http://') || calcLink.startsWith('https://') ? (
                    <a
                      href={calcLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1 break-all text-xs"
                    >
                      <Link2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{calcLink}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="font-semibold text-emerald-800 break-all flex items-center gap-1 text-xs">
                      <Link2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{calcLink}</span>
                    </span>
                  )
                ) : (
                  <span className="text-slate-400 italic text-xs">No pricing sheet provided</span>
                )}
                <span className="text-[10px] text-slate-400 block">Cost calculation & rate card matrix</span>
              </div>
            </div>

            {/* Finance Review Notes / Deal Desk Conditions */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">
                Finance Review Notes & Commercial Conditions
              </label>
              <textarea
                rows={2}
                value={financeReviewNotes}
                onChange={(e) => {
                  const val = e.target.value;
                  onUpdateOpportunity({
                    ...opportunity,
                    financeProcessor: financeProcessor,
                    initialFinanceReviewData: {
                      ...opportunity.initialFinanceReviewData,
                      stage5TriggerDate,
                      acknowledgedStartDate: effectiveAckDate,
                      slaTriggerToAckDays,
                      stage5TargetSlaDays,
                      financeProcessor: financeProcessor,
                      financeReviewNotes: val,
                    },
                    initialFinanceApproval: {
                      ...opportunity.initialFinanceApproval,
                      approved: opportunity.initialFinanceApproval?.approved ?? false,
                      comments: val,
                    }
                  });
                }}
                placeholder="Record financial observations, margin caveats, approved payment milestones, or required revenue recognition notes..."
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none text-xs"
              />
            </div>

            {/* Note: Roadmap Notice for Future Thresholds & Approvers */}
            <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-xl flex items-start gap-2 text-xs text-purple-900 shadow-2xs">
              <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold">Next Phase Roadmap:</span> We will implement the finance approval threshold and multiple approvers matrix (based on deal value tiers) on the next phase.
              </div>
            </div>

            {/* Action Bar with Return to Contracts Team & Grant Approval Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-200">
              {/* Button: Return to Contracts Team for Update/Clarification */}
              <button
                type="button"
                onClick={() => {
                  setShowReturnToStage4Modal(true);
                  setReturnToStage4Error('');
                }}
                className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold rounded-lg border border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 hover:border-amber-400 shadow-2xs transition-all cursor-pointer gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                Return to Contracts Team for Update/Clarification
              </button>

              {/* Button: Grant Finance Approval to Contracts Team */}
              <button
                type="button"
                onClick={() => {
                  const approvalDate = new Date().toISOString();
                  const extraUpdates: Partial<Opportunity> = {
                    financeProcessor: financeProcessor || 'Finance / Deal Desk',
                    initialFinanceReviewData: {
                      ...opportunity.initialFinanceReviewData,
                      stage5TriggerDate,
                      acknowledgedStartDate: effectiveAckDate,
                      slaTriggerToAckDays,
                      stage5TargetSlaDays,
                      financeProcessor: financeProcessor || 'Finance / Deal Desk',
                      financeReviewNotes: financeReviewNotes || comments || 'Margins verified and commercial clearance granted.',
                      approved: true,
                      approvedBy: financeProcessor || 'Finance / Deal Desk',
                      approvedAt: approvalDate,
                      approvedMarginPercent: grossMarginPercent,
                      comments: financeReviewNotes || comments || 'Margins verified and commercial clearance granted.',
                    },
                    initialFinanceApproval: {
                      approved: true,
                      approvedBy: financeProcessor || 'Finance / Deal Desk',
                      approvedAt: approvalDate,
                      approvedMarginPercent: grossMarginPercent,
                      comments: financeReviewNotes || comments || 'Margins verified and approved for Contracts Team endorsement.',
                    },
                    contractsEndorsementData: {
                      ...opportunity.contractsEndorsementData,
                      stage6TriggerDate: approvalDate,
                    }
                  };

                  onAdvanceStage(
                    'CONTRACTS_PROPOSAL_ENDORSEMENT',
                    'Initial Finance Approval Granted to Contracts Team',
                    comments || financeReviewNotes || 'Finance approved commercial margins and terms. Endorsed to Contracts Team for proposal endorsement.',
                    extraUpdates
                  );
                }}
                className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold rounded-lg bg-purple-600 text-white hover:bg-purple-700 shadow-xs transition-all cursor-pointer gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Grant Finance Approval to Contracts Team
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })()}

      {/* STAGE 6: CONTRACTS TEAM PROPOSAL ENDORSEMENT */}
      {currentStage === 'CONTRACTS_PROPOSAL_ENDORSEMENT' && (() => {
        const stage6TriggerDate =
          opportunity.contractsEndorsementData?.stage6TriggerDate ||
          opportunity.initialFinanceApproval?.approvedAt ||
          (opportunity.currentStage === 'CONTRACTS_PROPOSAL_ENDORSEMENT' ? (opportunity.stageEnteredAt || opportunity.updatedAt || opportunity.createdAt) : (opportunity.stageEnteredAt || opportunity.createdAt));

        const triggerDateDisplay = formatDate(stage6TriggerDate);
        const triggerMs = new Date(stage6TriggerDate).getTime();
        const autoDefaultedAckDate = new Date(triggerMs).toISOString().split('T')[0];
        const storedAckDate = opportunity.contractsEndorsementData?.acknowledgedStartDate;
        const effectiveAckDate = storedAckDate || autoDefaultedAckDate;
        const stage6TargetSlaDays = opportunity.contractsEndorsementData?.stage6TargetSlaDays || STAGE_MAP.CONTRACTS_PROPOSAL_ENDORSEMENT?.targetSlaDays || 2;
        const contractsEndorser = opportunity.contractsEndorsementData?.contractsEndorser || opportunity.contractsProcessor || '';
        const targetSalesLead = opportunity.contractsEndorsementData?.targetSalesLead || opportunity.salesLead || '';
        const endorsementNotes = opportunity.contractsEndorsementData?.endorsementNotes || opportunity.contractsEndorsementNotes || '';
        const commercialGuidance = opportunity.contractsEndorsementData?.commercialGuidanceNotes || '';

        // Calculate SLA elapsed
        const ackMs = new Date(effectiveAckDate).getTime();
        const elapsedDays = Math.max(0, Math.floor((Date.now() - ackMs) / (1000 * 60 * 60 * 24)));
        const isOverdue = elapsedDays > stage6TargetSlaDays;

        // Commercial & Financial metrics
        const internalCost = opportunity.solutionProposal?.estimatedDeliveryCost || opportunity.solutionProposal?.ibsiInternalCost || 0;
        const grossProfit = opportunity.dealValue - internalCost;
        const grossMarginPercent = opportunity.dealValue > 0 ? (grossProfit / opportunity.dealValue) * 100 : 0;
        const contractTypeDisplay = opportunity.contractType || opportunity.contractDetails?.contractType || opportunity.contractsReviewData?.contractType || 'Standard SOW';
        const propLink = opportunity.solutionProposal?.clientProposalLink || opportunity.torLink;
        const financeApprover = opportunity.initialFinanceApproval?.approvedBy || opportunity.initialFinanceReviewData?.financeProcessor || 'Finance / Deal Desk';
        const financeApprovedAt = opportunity.initialFinanceApproval?.approvedAt || opportunity.initialFinanceReviewData?.approvedAt;
        const financeNotes = opportunity.initialFinanceReviewData?.financeReviewNotes || opportunity.initialFinanceApproval?.comments || 'Commercial margins and pricing approved by Finance.';

        return (
          <div className="space-y-4 text-xs">
            {/* SLA & Ingress Tracking Header */}
            <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50/50 rounded-xl border border-amber-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-amber-200/60">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-amber-600 text-white font-bold text-[10px] rounded-md uppercase tracking-wider">
                      Stage 6 • Contracts Endorsement
                    </span>
                    <span className="text-amber-900 font-bold text-xs">
                      Contracts Team Proposal Endorsement to Sales
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800/80 mt-0.5">
                    Review Finance-approved proposal terms, verify legal/commercial boundaries, and officially endorse the proposal to the Sales team for Client Buyoff.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                  <span className={`px-2 py-1 rounded-md font-bold text-[10px] flex items-center gap-1 ${
                    isOverdue ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    <Clock className="w-3 h-3" />
                    {isOverdue ? `SLA Overdue (${elapsedDays}d / ${stage6TargetSlaDays}d target)` : `Within SLA (${elapsedDays}d / ${stage6TargetSlaDays}d)`}
                  </span>
                </div>
              </div>

              {/* Ingress Dates & Endorser Assignment */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-amber-900 uppercase block mb-1">
                    Finance Approval Ingress Date
                  </label>
                  <div className="p-2 bg-white/90 border border-amber-200 rounded-lg text-slate-800 font-mono text-xs font-semibold">
                    {stage6TriggerDate ? `${stage6TriggerDate.split('T')[0]} (${triggerDateDisplay})` : 'Pending Stage Ingress'}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-amber-900 uppercase block">
                      Acknowledged Start Date
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const todayStr = new Date().toISOString().split('T')[0];
                        onUpdateOpportunity({
                          ...opportunity,
                          contractsEndorsementData: {
                            ...opportunity.contractsEndorsementData,
                            stage6TriggerDate,
                            acknowledgedStartDate: todayStr,
                            stage6TargetSlaDays,
                            contractsEndorser,
                            targetSalesLead,
                          }
                        });
                      }}
                      className="text-[10px] text-amber-700 font-bold hover:underline cursor-pointer"
                    >
                      Set Today
                    </button>
                  </div>
                  <input
                    type="date"
                    value={effectiveAckDate ? effectiveAckDate.split('T')[0] : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      onUpdateOpportunity({
                        ...opportunity,
                        contractsEndorsementData: {
                          ...opportunity.contractsEndorsementData,
                          stage6TriggerDate,
                          acknowledgedStartDate: val,
                          stage6TargetSlaDays,
                          contractsEndorser,
                          targetSalesLead,
                        }
                      });
                    }}
                    className="w-full bg-white border border-amber-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-amber-900 uppercase block mb-1">
                    Contracts Lead / Endorser
                  </label>
                  <select
                    value={contractsEndorser}
                    onChange={(e) => {
                      const val = e.target.value;
                      onUpdateOpportunity({
                        ...opportunity,
                        contractsProcessor: val,
                        contractsEndorsementData: {
                          ...opportunity.contractsEndorsementData,
                          stage6TriggerDate,
                          acknowledgedStartDate: effectiveAckDate,
                          stage6TargetSlaDays,
                          contractsEndorser: val,
                          targetSalesLead,
                        }
                      });
                    }}
                    className="w-full bg-white border border-amber-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="">Select Contracts Lead / Specialist...</option>
                    {resources
                      ?.filter((r) => r.role?.toLowerCase().includes('contract') || r.role?.toLowerCase().includes('legal') || r.department?.toLowerCase().includes('legal') || r.department?.toLowerCase().includes('contract'))
                      .map((r) => (
                        <option key={r.id} value={r.name}>
                          {r.name} ({r.role})
                        </option>
                      ))}
                    {(!resources || resources.filter((r) => r.role?.toLowerCase().includes('contract') || r.role?.toLowerCase().includes('legal')).length === 0) &&
                      resources?.map((r) => (
                        <option key={r.id} value={r.name}>
                          {r.name} ({r.role})
                        </option>
                      ))}
                    {opportunity.contractsProcessor && !resources?.some((r) => r.name === opportunity.contractsProcessor) && (
                      <option value={opportunity.contractsProcessor}>{opportunity.contractsProcessor}</option>
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* Finance Approved Commercial Summary */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Finance-Approved Commercial Summary & Clearances
                </span>
                <span className="text-[10px] text-slate-500">
                  Approved by: <span className="font-semibold text-slate-700">{financeApprover}</span> {financeApprovedAt ? `on ${formatDate(financeApprovedAt)}` : ''}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-medium">Approved Deal Value (TCV)</span>
                  <span className="text-sm font-bold text-slate-900 block mt-0.5">
                    {formatCurrency(opportunity.dealValue, opportunity.currency)}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-medium">Approved Gross Margin</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-sm font-bold text-emerald-700">
                      {grossMarginPercent.toFixed(1)}%
                    </span>
                    <span className="px-1.5 py-0.2 text-[9px] font-bold bg-emerald-100 text-emerald-800 rounded">
                      Verified
                    </span>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-medium">Contract Classification</span>
                  <span className="text-xs font-bold text-slate-800 block mt-0.5 truncate">
                    {contractTypeDisplay}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-medium">Assigned Sales Executive</span>
                  <span className="text-xs font-bold text-slate-800 block mt-0.5 truncate">
                    {targetSalesLead || opportunity.salesLead || 'Sales Executive'}
                  </span>
                </div>
              </div>

              {/* Finance Clearance Comments */}
              <div className="p-2.5 bg-purple-50/70 border border-purple-200 rounded-lg">
                <span className="text-[10px] font-bold text-purple-900 uppercase block mb-0.5">
                  Finance Commercial Signoff Notes
                </span>
                <p className="text-xs text-purple-950 italic">
                  "{financeNotes}"
                </p>
              </div>

              {/* Verified Proposal Doc Link */}
              {propLink && (
                <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="text-slate-600 truncate font-medium">
                      Client-Facing Proposal Doc: <span className="text-slate-900 font-semibold">{propLink}</span>
                    </span>
                  </div>
                  {propLink.startsWith('http') && (
                    <a
                      href={propLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 font-bold hover:underline shrink-0 inline-flex items-center gap-1 ml-2"
                    >
                      Open Doc
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Contracts Endorsement Notes & Guidance for Sales Team */}
            <div className="space-y-3 p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <div className="font-bold text-slate-900 text-xs">
                Contracts Endorsement & Commercial Guidance for Sales Buyoff:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block text-xs mb-1">
                    Designated Sales Lead for Client Buyoff
                  </label>
                  <select
                    value={targetSalesLead}
                    onChange={(e) => {
                      const val = e.target.value;
                      onUpdateOpportunity({
                        ...opportunity,
                        salesLead: val || opportunity.salesLead,
                        contractsEndorsementData: {
                          ...opportunity.contractsEndorsementData,
                          stage6TriggerDate,
                          acknowledgedStartDate: effectiveAckDate,
                          stage6TargetSlaDays,
                          contractsEndorser,
                          targetSalesLead: val,
                          endorsementNotes,
                          commercialGuidanceNotes: commercialGuidance,
                        }
                      });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
                  >
                    <option value="">Select Sales Lead...</option>
                    {resources
                      ?.filter((r) => r.role?.toLowerCase().includes('sales') || r.department?.toLowerCase().includes('sales') || r.department?.toLowerCase().includes('commercial'))
                      .map((r) => (
                        <option key={r.id} value={r.name}>
                          {r.name} ({r.role})
                        </option>
                      ))}
                    {opportunity.salesLead && !resources?.some((r) => r.name === opportunity.salesLead) && (
                      <option value={opportunity.salesLead}>{opportunity.salesLead}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block text-xs mb-1">
                    Commercial & Legal Guardrails for Sales
                  </label>
                  <input
                    type="text"
                    value={commercialGuidance}
                    onChange={(e) => {
                      const val = e.target.value;
                      onUpdateOpportunity({
                        ...opportunity,
                        contractsEndorsementData: {
                          ...opportunity.contractsEndorsementData,
                          stage6TriggerDate,
                          acknowledgedStartDate: effectiveAckDate,
                          stage6TargetSlaDays,
                          contractsEndorser,
                          targetSalesLead,
                          endorsementNotes,
                          commercialGuidanceNotes: val,
                        }
                      });
                    }}
                    placeholder="e.g. Max 5% discount flexibility; Net 30 payment terms..."
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block text-xs mb-1">
                  Contracts Endorsement Notes
                </label>
                <textarea
                  rows={2}
                  value={endorsementNotes}
                  onChange={(e) => {
                    const val = e.target.value;
                    onUpdateOpportunity({
                      ...opportunity,
                      contractsEndorsementNotes: val,
                      contractsEndorsementData: {
                        ...opportunity.contractsEndorsementData,
                        stage6TriggerDate,
                        acknowledgedStartDate: effectiveAckDate,
                        stage6TargetSlaDays,
                        contractsEndorser,
                        targetSalesLead,
                        endorsementNotes: val,
                        commercialGuidanceNotes: commercialGuidance,
                      }
                    });
                  }}
                  placeholder="Record legal/contracts verification remarks, proposal code confirmation, and instructions for Sales team..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  if (onRejectStage) {
                    onRejectStage('INITIAL_FINANCE_APPROVAL', comments || endorsementNotes || 'Returned by Contracts to Finance for commercial/margin re-evaluation.');
                  }
                }}
                className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold rounded-lg border border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 hover:border-amber-400 shadow-2xs transition-all cursor-pointer gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                Return to Finance for Margin/Pricing Re-evaluation
              </button>

              <button
                type="button"
                onClick={() => {
                  const endorseDate = new Date().toISOString();
                  const extraUpdates: Partial<Opportunity> = {
                    contractsEndorsementNotes: endorsementNotes || comments,
                    contractsEndorsementData: {
                      ...opportunity.contractsEndorsementData,
                      stage6TriggerDate,
                      acknowledgedStartDate: effectiveAckDate,
                      stage6TargetSlaDays,
                      contractsEndorser: contractsEndorser || 'Contracts Team',
                      targetSalesLead: targetSalesLead || opportunity.salesLead,
                      endorsementNotes: endorsementNotes || comments || 'Finance-approved proposal endorsed to Sales for client buyoff.',
                      endorsedBy: contractsEndorser || 'Contracts Team',
                      endorsedAt: endorseDate,
                      commercialGuidanceNotes: commercialGuidance,
                    }
                  };
                  onAdvanceStage(
                    'CLIENT_BUYOFF_NEGOTIATION',
                    'Proposal Endorsed to Sales Team for Buyoff',
                    comments || endorsementNotes || 'Contracts team endorsed Finance-approved proposal to Sales for client presentation and commercial buyoff.',
                    extraUpdates
                  );
                }}
                className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-all cursor-pointer gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Endorse Proposal to Sales Team for Client Buyoff
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })()}

      {/* STAGE 7: CLIENT BUYOFF & NEGOTIATION */}
      {currentStage === 'CLIENT_BUYOFF_NEGOTIATION' && (() => {
        const stage7TriggerDate = opportunity.clientNegotiation?.stage7TriggerDate || 
          (opportunity.currentStage === 'CLIENT_BUYOFF_NEGOTIATION' 
            ? (opportunity.stageEnteredAt || opportunity.updatedAt || opportunity.createdAt) 
            : (opportunity.stageEnteredAt || opportunity.createdAt));
        
        const slaTriggerToAckDays = opportunity.clientNegotiation?.slaTriggerToAckDays || 2;
        const stage7TargetSlaDays = opportunity.clientNegotiation?.stage7TargetSlaDays || STAGE_MAP.CLIENT_BUYOFF_NEGOTIATION?.targetSlaDays || 5;
        
        const nowMs = Date.now();
        const triggerMs = stage7TriggerDate ? new Date(stage7TriggerDate).getTime() : nowMs;
        const elapsedDaysFromTrigger = Math.max(0, Math.floor((nowMs - triggerMs) / (1000 * 60 * 60 * 24)));
        
        // Auto-default logic: if no manual input in acknowledged date after SLA days, default to Trigger Date + SLA
        const rawAckDate = opportunity.clientNegotiation?.acknowledgedStartDate || '';
        const isAutoDefaulted = !rawAckDate && elapsedDaysFromTrigger >= slaTriggerToAckDays;
        const autoDefaultedAckDate = new Date(triggerMs + slaTriggerToAckDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const effectiveAckDate = rawAckDate || (isAutoDefaulted ? autoDefaultedAckDate : '');
        
        const isAckOverdue = !rawAckDate && elapsedDaysFromTrigger > slaTriggerToAckDays;
        const ackMs = effectiveAckDate ? new Date(effectiveAckDate).getTime() : null;
        const elapsedDaysFromAck = ackMs ? Math.max(0, Math.floor((nowMs - ackMs) / (1000 * 60 * 60 * 24))) : 0;
        const isNegotiationOverdue = effectiveAckDate ? (elapsedDaysFromAck > stage7TargetSlaDays) : false;

        const negotiationLead = opportunity.clientNegotiation?.negotiationLead || opportunity.salesLead || '';
        const baselineProposalTcv = opportunity.solutionProposal?.tcv || opportunity.dealValue || 0;
        const internalCost = opportunity.solutionProposal?.ibsiInternalCost || (opportunity.solutionProposal?.estimatedDeliveryCost || 0);
        const discountPercent = opportunity.clientNegotiation?.agreedDiscountPercent ?? 0;
        const finalAgreedVal = opportunity.clientNegotiation?.finalAgreedValue ?? (discountPercent > 0 ? Math.round(baselineProposalTcv * (1 - discountPercent / 100)) : opportunity.dealValue);
        
        const effectiveGrossProfit = finalAgreedVal - internalCost;
        const effectiveMarginPercent = finalAgreedVal > 0 ? (effectiveGrossProfit / finalAgreedVal) * 100 : 0;
        const varianceVsBaseline = finalAgreedVal - baselineProposalTcv;
        const variancePercent = baselineProposalTcv > 0 ? (varianceVsBaseline / baselineProposalTcv) * 100 : 0;
        const clientFeedback = opportunity.clientNegotiation?.clientFeedback || '';
        const endorsementGuidance = opportunity.contractsEndorsementData?.commercialGuidanceNotes || opportunity.contractsEndorsementNotes;
        const propLink = opportunity.solutionProposal?.clientProposalLink || opportunity.torLink;

        const salesResources = resources.filter(r => 
          r.department?.toLowerCase().includes('sales') || 
          r.department?.toLowerCase().includes('commercial') || 
          r.role?.toLowerCase().includes('sales') || 
          r.role?.toLowerCase().includes('account') || 
          r.role?.toLowerCase().includes('business development') || 
          r.role?.toLowerCase().includes('director') ||
          r.division?.toLowerCase().includes('sales')
        );

        const handleSetAckDateToday = () => {
          const todayStr = new Date().toISOString().split('T')[0];
          onUpdateOpportunity({
            ...opportunity,
            clientNegotiation: {
              ...opportunity.clientNegotiation,
              status: opportunity.clientNegotiation?.status || 'IN_NEGOTIATION',
              stage7TriggerDate,
              acknowledgedStartDate: todayStr,
              slaTriggerToAckDays,
              stage7TargetSlaDays,
              negotiationLead,
              agreedDiscountPercent: discountPercent,
              finalAgreedValue: finalAgreedVal,
              clientFeedback,
            }
          });
        };

        const handleConfirmClientBuyoff = () => {
          const finalVal = finalAgreedVal;
          const confirmDate = new Date().toISOString();
          
          // Generate Finance Audit Entry for Client Buyoff & Final Agreed Value
          const auditEntry = {
            id: `audit-stage7-${Date.now()}`,
            timestamp: confirmDate,
            stage: 'CLIENT_BUYOFF_NEGOTIATION' as WorkflowStage,
            stageName: STAGE_MAP.CLIENT_BUYOFF_NEGOTIATION?.label || 'Client Buyoff & Negotiation',
            eventType: 'CLIENT_NEGOTIATION' as const,
            actorName: negotiationLead || opportunity.salesLead || 'Sales Executive',
            actorRole: 'SALES' as StakeholderRole,
            actionLabel: 'Final Agreed Value & Commercial Buyoff Confirmed',
            amount: finalVal,
            currency: opportunity.currency || 'USD',
            internalCost: internalCost > 0 ? internalCost : undefined,
            internalCurrency: opportunity.solutionProposal?.ibsiInternalCurrency || opportunity.currency || 'USD',
            marginPercent: effectiveMarginPercent,
            notes: clientFeedback || (discountPercent > 0 
              ? `Client sponsor agreed to ${discountPercent}% discount. Final TCV confirmed at ${formatCurrency(finalVal, opportunity.currency)}.` 
              : `Commercial terms and proposal accepted without discount at ${formatCurrency(finalVal, opportunity.currency)}.`),
          };

          const existingAudit = opportunity.financeAuditTrail || [];
          const updatedAuditTrail = [...existingAudit, auditEntry];

          const updatedOpportunity: Opportunity = {
            ...opportunity,
            dealValue: finalVal,
            financeAuditTrail: updatedAuditTrail,
            clientNegotiation: {
              ...opportunity.clientNegotiation,
              status: 'CLIENT_CONFIRMED',
              stage7TriggerDate,
              acknowledgedStartDate: effectiveAckDate,
              slaTriggerToAckDays,
              stage7TargetSlaDays,
              negotiationLead,
              agreedDiscountPercent: discountPercent,
              finalAgreedValue: finalVal,
              clientConfirmedDate: confirmDate,
              clientFeedback,
            }
          };

          onUpdateOpportunity(updatedOpportunity);
          onAdvanceStage(
            'CONTRACT_CONVERSION', 
            'Client Buyoff Confirmed & Final Agreed Value Locked', 
            comments || clientFeedback || `Client confirmed buyoff at ${formatCurrency(finalVal, opportunity.currency)} (${discountPercent > 0 ? `${discountPercent}% discount applied` : 'full proposal value'}). Routed to Contracts team for legal agreement conversion.`,
            {
              dealValue: finalVal,
              financeAuditTrail: updatedAuditTrail,
            }
          );
        };

        return (
          <div className="space-y-4 text-xs">
            {/* Header Stage Overview & SLA Tracker */}
            <div className="p-3.5 bg-gradient-to-r from-sky-50/90 to-blue-50/90 rounded-xl border border-sky-200/90 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                  <Handshake className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">Stage 7: Client Buyoff & Commercial Negotiation</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                      Sales & Commercial Deal Team
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Engage client executive sponsors (<span className="font-semibold text-slate-800">{opportunity.clientContactName || 'Client Lead'}</span> at <span className="font-semibold text-slate-800">{opportunity.clientName}</span>) to present approved commercial terms and confirm final agreed value.
                  </p>
                </div>
              </div>

              {/* Status Pill */}
              <div className="flex items-center gap-2 shrink-0">
                {isNegotiationOverdue ? (
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1 shadow-2xs">
                    <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                    Negotiation Overdue ({elapsedDaysFromAck}d / {stage7TargetSlaDays}d SLA)
                  </span>
                ) : effectiveAckDate ? (
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 shadow-2xs">
                    <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                    Acknowledged & In Client Negotiation ({elapsedDaysFromAck}d / {stage7TargetSlaDays}d SLA)
                  </span>
                ) : isAckOverdue ? (
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 shadow-2xs">
                    <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                    Ack Auto-Defaulted (Trigger + {slaTriggerToAckDays}d SLA)
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200 flex items-center gap-1 shadow-2xs">
                    <Clock className="w-3 h-3 text-sky-600 shrink-0" />
                    Awaiting Deal Team Acknowledgment ({elapsedDaysFromTrigger}d / {slaTriggerToAckDays}d Ack SLA)
                  </span>
                )}
              </div>
            </div>

            {/* Stage 7 Governance Grid: Ingress Date, Acknowledged Start Date, Negotiation Lead */}
            <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200/90 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-sky-600" />
                  <span className="font-bold text-slate-900 text-xs">Stage 7 SLA Ingress & Deal Lead Assignment</span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">
                  SLA Reference Clock: <span className="font-semibold text-slate-700">{effectiveAckDate ? 'Acknowledged Start Date' : 'Stage Trigger Date'}</span>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. Stage 7 Trigger Date (Non-Editable) */}
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                      Stage 7 Trigger Date
                      <span className="text-slate-400 font-normal">(Non-editable)</span>
                    </label>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-600">
                      Workflow Ingress
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-1.5 bg-slate-50/80 rounded border border-slate-200 text-slate-800 font-mono text-xs font-semibold">
                    <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{stage7TriggerDate ? stage7TriggerDate.split('T')[0] : 'Pending Ingress'}</span>
                    {stage7TriggerDate && (
                      <span className="text-[10px] text-slate-500 font-sans font-normal ml-auto">
                        ({formatDate(stage7TriggerDate)})
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 block">
                    Automatic timestamp recorded upon entering Client Buyoff stage.
                  </span>
                </div>

                {/* 2. Acknowledged Start Date */}
                <div className="p-2.5 bg-white rounded-lg border border-sky-200 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-sky-900 uppercase tracking-wider flex items-center gap-1">
                      Acknowledged Start Date
                      <span className="text-sky-600 font-semibold">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleSetAckDateToday}
                      className="text-[10px] text-sky-600 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      <Check className="w-3 h-3" />
                      Set Today
                    </button>
                  </div>
                  <input
                    type="date"
                    value={effectiveAckDate ? effectiveAckDate.split('T')[0] : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      onUpdateOpportunity({
                        ...opportunity,
                        clientNegotiation: {
                          ...opportunity.clientNegotiation,
                          status: opportunity.clientNegotiation?.status || 'IN_NEGOTIATION',
                          stage7TriggerDate,
                          acknowledgedStartDate: val,
                          slaTriggerToAckDays,
                          stage7TargetSlaDays,
                          negotiationLead,
                          agreedDiscountPercent: discountPercent,
                          finalAgreedValue: finalAgreedVal,
                          clientFeedback,
                        }
                      });
                    }}
                    className="w-full bg-white border border-sky-300 rounded px-2.5 py-1 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                  <div className="flex items-center justify-between text-[9px] text-slate-500 mt-1">
                    <span>
                      {isAutoDefaulted ? (
                        <strong className="text-amber-600">Auto-defaulted (Trigger + {slaTriggerToAckDays}d SLA)</strong>
                      ) : rawAckDate ? (
                        <span className="text-emerald-700 font-semibold">Manually Acknowledged</span>
                      ) : (
                        <span>Ack SLA window: <strong>{slaTriggerToAckDays} days</strong></span>
                      )}
                    </span>
                    <span className="text-slate-400">Target SLA: <strong>{stage7TargetSlaDays}d</strong></span>
                  </div>
                </div>

                {/* 3. Negotiation Lead / Account Executive */}
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Designated Negotiation Lead
                  </label>
                  <select
                    value={negotiationLead}
                    onChange={(e) => {
                      const val = e.target.value;
                      onUpdateOpportunity({
                        ...opportunity,
                        salesLead: val || opportunity.salesLead,
                        clientNegotiation: {
                          ...opportunity.clientNegotiation,
                          status: opportunity.clientNegotiation?.status || 'IN_NEGOTIATION',
                          stage7TriggerDate,
                          acknowledgedStartDate: effectiveAckDate,
                          slaTriggerToAckDays,
                          stage7TargetSlaDays,
                          negotiationLead: val,
                          agreedDiscountPercent: discountPercent,
                          finalAgreedValue: finalAgreedVal,
                          clientFeedback,
                        }
                      });
                    }}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="">Select Sales / Commercial Lead...</option>
                    {salesResources.map(r => (
                      <option key={r.id} value={r.name}>
                        {r.name} ({r.role})
                      </option>
                    ))}
                    {opportunity.salesLead && !salesResources.some(r => r.name === opportunity.salesLead) && (
                      <option value={opportunity.salesLead}>{opportunity.salesLead} (Assigned Sales)</option>
                    )}
                  </select>
                  <span className="text-[9px] text-slate-400 mt-1 block">
                    Account Executive leading client presentation & closing.
                  </span>
                </div>
              </div>
            </div>

            {/* Commercial Terms, Discount & Final Agreed Value Audit Card */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-emerald-600" />
                  Commercial Negotiation & Value Audit Alignment
                </span>
                <span className="text-[10px] text-slate-500">
                  Currency: <strong className="text-slate-700">{opportunity.currency || 'USD'}</strong>
                </span>
              </div>

              {/* Endorsement Guidance Banner if available */}
              {endorsementGuidance && (
                <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-lg flex items-start gap-2 text-xs text-amber-950">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-[10px] uppercase text-amber-900">Contracts Endorsement Guidance for Sales:</span>
                    <p className="text-[11px] italic mt-0.5">{endorsementGuidance}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {/* 1. Baseline Approved Proposal TCV */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Baseline Proposal TCV
                  </span>
                  <div className="text-sm font-bold text-slate-900">
                    {formatCurrency(baselineProposalTcv, opportunity.currency)}
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    Stage 6 Endorsed Value
                  </span>
                </div>

                {/* 2. Agreed Discount % */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                    Agreed Discount %
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={discountPercent}
                      onChange={(e) => {
                        const discount = Number(e.target.value);
                        const computedFinalVal = Math.max(0, Math.round(baselineProposalTcv * (1 - (discount || 0) / 100)));
                        onUpdateOpportunity({
                          ...opportunity,
                          clientNegotiation: {
                            ...opportunity.clientNegotiation,
                            status: 'IN_NEGOTIATION',
                            stage7TriggerDate,
                            acknowledgedStartDate: effectiveAckDate,
                            slaTriggerToAckDays,
                            stage7TargetSlaDays,
                            negotiationLead,
                            agreedDiscountPercent: discount,
                            finalAgreedValue: computedFinalVal,
                            clientFeedback,
                          }
                        });
                      }}
                      placeholder="0"
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                    <span className="absolute right-2.5 top-1.5 text-xs text-slate-400 font-bold">%</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    {discountPercent > 0 ? `${discountPercent}% concession applied` : 'No discount granted'}
                  </span>
                </div>

                {/* 3. Final Agreed Value ($) */}
                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-1">
                  <label className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block">
                    Final Agreed Value (TCV) <span className="text-emerald-700 font-semibold">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={finalAgreedVal}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const derivedDiscount = baselineProposalTcv > 0 ? Math.max(0, Math.round(((baselineProposalTcv - val) / baselineProposalTcv) * 100 * 10) / 10) : 0;
                      onUpdateOpportunity({
                        ...opportunity,
                        clientNegotiation: {
                          ...opportunity.clientNegotiation,
                          status: 'IN_NEGOTIATION',
                          stage7TriggerDate,
                          acknowledgedStartDate: effectiveAckDate,
                          slaTriggerToAckDays,
                          stage7TargetSlaDays,
                          negotiationLead,
                          agreedDiscountPercent: derivedDiscount,
                          finalAgreedValue: val,
                          clientFeedback,
                        }
                      });
                    }}
                    className="w-full bg-white border border-emerald-300 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-semibold text-emerald-800">{formatCurrency(finalAgreedVal, opportunity.currency)}</span>
                    {varianceVsBaseline !== 0 && (
                      <span className={`font-bold ${varianceVsBaseline < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {varianceVsBaseline < 0 ? `-${formatCurrency(Math.abs(varianceVsBaseline), opportunity.currency)}` : `+${formatCurrency(varianceVsBaseline, opportunity.currency)}`} ({variancePercent.toFixed(1)}%)
                      </span>
                    )}
                  </div>
                </div>

                {/* 4. Projected Margin % */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Negotiated Margin
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-bold ${effectiveMarginPercent >= 20 ? 'text-emerald-700' : effectiveMarginPercent >= 10 ? 'text-amber-700' : 'text-rose-700'}`}>
                      {effectiveMarginPercent.toFixed(1)}%
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-200 text-slate-700">
                      Profit: {formatCurrency(effectiveGrossProfit, opportunity.currency)}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    Internal Cost: {formatCurrency(internalCost, opportunity.currency)}
                  </span>
                </div>
              </div>

              {/* Proposal Document Link */}
              {propLink && (
                <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="text-slate-600 truncate font-medium">
                      Client-Facing Proposal Reference: <span className="text-slate-900 font-semibold">{propLink}</span>
                    </span>
                  </div>
                  {propLink.startsWith('http') && (
                    <a
                      href={propLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 font-bold hover:underline shrink-0 inline-flex items-center gap-1 ml-2"
                    >
                      Open Document
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              {/* Client Feedback & Buyoff Confirmation Notes */}
              <div>
                <label className="block text-slate-700 font-semibold text-xs mb-1">
                  Client Feedback & Buyoff Confirmation Notes <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={clientFeedback}
                  onChange={(e) => {
                    const val = e.target.value;
                    onUpdateOpportunity({
                      ...opportunity,
                      clientNegotiation: {
                        ...opportunity.clientNegotiation,
                        status: 'IN_NEGOTIATION',
                        stage7TriggerDate,
                        acknowledgedStartDate: effectiveAckDate,
                        slaTriggerToAckDays,
                        stage7TargetSlaDays,
                        negotiationLead,
                        agreedDiscountPercent: discountPercent,
                        finalAgreedValue: finalAgreedVal,
                        clientFeedback: val,
                      }
                    });
                  }}
                  placeholder="Record client sponsor remarks, feedback on proposal scope, discount negotiations, agreed milestones, and verbal or email buyoff confirmation..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  * Note: This confirmation is permanently recorded in the opportunity timeline and Finance & Commercial Value Audit Trail.
                </span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-slate-200">
              <div className="flex flex-wrap items-center gap-2">
                {/* Button 1: Revert back to Stage 3 */}
                <button
                  type="button"
                  onClick={() => setShowReturnToStage3Modal(true)}
                  className="inline-flex items-center justify-center px-3.5 py-2 text-xs font-bold rounded-lg border border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 hover:border-amber-400 shadow-2xs transition-all cursor-pointer gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                  Return to Sales Review
                </button>

                {/* Button 2: Revert back to Stage 6 */}
                <button
                  type="button"
                  onClick={() => setShowReturnToStage6Modal(true)}
                  className="inline-flex items-center justify-center px-3.5 py-2 text-xs font-bold rounded-lg border border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 hover:border-amber-400 shadow-2xs transition-all cursor-pointer gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                  Return to Contracts Team for Review
                </button>
              </div>

              {/* Button 3: Confirm Client Buyoff & Route to Contracts */}
              <button
                type="button"
                onClick={handleConfirmClientBuyoff}
                className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold rounded-lg bg-sky-600 text-white hover:bg-sky-700 shadow-xs transition-all cursor-pointer gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Confirm Client Buyoff & Route to Contracts
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </div>
          </div>
        );
      })()}

      {/* STAGE 8: CONTRACT & AGREEMENT CONVERSION */}
      {currentStage === 'CONTRACT_CONVERSION' && (
        <div className="space-y-4 text-xs">
          <div className="p-3.5 bg-white rounded-lg border border-slate-200">
            <div className="font-bold text-slate-900 text-sm mb-1">Proposal to Legal Agreement Conversion</div>
            <p className="text-slate-600">
              Contracts team generates formal Statement of Work (SOW) / Master Services Agreement based on client buyoff.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Contract Type</label>
              <select
                value={opportunity.contractDetails?.contractType || 'SERVICE_ORDER'}
                onChange={(e) => onUpdateOpportunity({
                  ...opportunity,
                  contractDetails: { ...opportunity.contractDetails, contractType: e.target.value as any }
                })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
              >
                {activeContractTypes.length > 0 ? (
                  activeContractTypes.map((ct) => (
                    <option key={ct.id} value={ct.value}>
                      {ct.label}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="SERVICE_ORDER">Service Order</option>
                    <option value="SERVICE_AGREEMENT">Service Agreement</option>
                    <option value="AMENDMENT">Amendment</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Contract Code / Reference #</label>
              <input
                type="text"
                value={opportunity.contractDetails?.contractNumber || (opportunity.trackingCode.includes('-OPP-') ? opportunity.trackingCode.replace('-OPP-', '-CTR-') : `CTR-${opportunity.trackingCode.replace(/^OPP-/, '')}`)}
                onChange={(e) => onUpdateOpportunity({
                  ...opportunity,
                  contractDetails: { ...opportunity.contractDetails, contractNumber: e.target.value }
                })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Governing Law Jurisdiction</label>
              <input
                type="text"
                value={opportunity.contractDetails?.governingLaw || 'State of New York / Commercial Arbitration'}
                onChange={(e) => onUpdateOpportunity({
                  ...opportunity,
                  contractDetails: { ...opportunity.contractDetails, governingLaw: e.target.value }
                })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              onClick={() => onAdvanceStage('FINAL_FINANCE_APPROVAL', 'Triggered Final Finance Approval', comments || 'SOW draft completed. Forwarded to Finance for final TCV sign-off.')}
              className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-lg bg-teal-600 text-white hover:bg-teal-700 shadow-xs transition-all"
            >
              Trigger Final Finance Approval
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </button>
          </div>
        </div>
      )}

      {/* STAGE 9: FINAL FINANCE APPROVAL */}
      {currentStage === 'FINAL_FINANCE_APPROVAL' && (
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-white rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-slate-500 block">Final Binding TCV</span>
              <span className="text-base font-bold text-slate-900">{formatCurrency(opportunity.dealValue)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Contract Reference</span>
              <span className="text-sm font-semibold text-slate-800">{opportunity.contractDetails?.contractNumber || 'Standard SOW'}</span>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              onClick={() => {
                const updated = {
                  ...opportunity,
                  finalFinanceApproval: {
                    approved: true,
                    approvedBy: 'Chief Financial Officer / Deal Desk',
                    approvedAt: new Date().toISOString(),
                    finalTcv: opportunity.dealValue,
                    comments: comments || 'Binding TCV and commercial terms approved for signing.',
                  }
                };
                onUpdateOpportunity(updated);
                onAdvanceStage('DOCUSIGN_CLIENT_ROUTING', 'Final Finance Approval Signed Off', 'Final commercial sign-off granted. Ready for DocuSign routing.');
              }}
              className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-lg bg-violet-600 text-white hover:bg-violet-700 shadow-xs transition-all"
            >
              Sign Off Final Finance (Ready for DocuSign)
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </button>
          </div>
        </div>
      )}

      {/* STAGE 10: DOCUSIGN & CLIENT ROUTING */}
      {currentStage === 'DOCUSIGN_CLIENT_ROUTING' && (
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-900 text-sm">DocuSign Digital Envelope Management</div>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                opportunity.docusignDetails?.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
              }`}>
                Status: {opportunity.docusignDetails?.status || 'SENT'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Client Signer</span>
                <span className="font-semibold text-slate-800">{opportunity.clientContactName}</span>
                <span className="text-slate-400 block text-[11px]">{opportunity.clientContactEmail}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Internal Executive Signer</span>
                <span className="font-semibold text-slate-800">{opportunity.docusignDetails?.internalSignerName || 'EVP Enterprise Services'}</span>
              </div>
            </div>

            {/* Simulation controls */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onUpdateOpportunity({
                    ...opportunity,
                    docusignDetails: {
                      ...opportunity.docusignDetails,
                      status: 'CLIENT_SIGNED',
                      clientSignedDate: new Date().toISOString(),
                    }
                  });
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
              >
                Simulate: Client Signs
              </button>

              <button
                type="button"
                onClick={() => {
                  onUpdateOpportunity({
                    ...opportunity,
                    docusignDetails: {
                      ...opportunity.docusignDetails,
                      status: 'COMPLETED',
                      internalSignedDate: new Date().toISOString(),
                    }
                  });
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-medium"
              >
                Simulate: Internal Countersignature (Complete)
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              onClick={() => {
                const updated = {
                  ...opportunity,
                  docusignDetails: {
                    ...opportunity.docusignDetails,
                    status: 'COMPLETED' as const,
                    internalSignedDate: opportunity.docusignDetails?.internalSignedDate || new Date().toISOString(),
                  }
                };
                onUpdateOpportunity(updated);
                onAdvanceStage('WIN_NOTIFICATION', 'DocuSign Agreement Fully Executed', comments || 'Both client and internal signatories completed signing.');
              }}
              className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-700 shadow-xs transition-all"
            >
              Signatures Completed → Release WIN Broadcast
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </button>
          </div>
        </div>
      )}

      {/* STAGE 11: WIN NOTIFICATION RELEASE */}
      {currentStage === 'WIN_NOTIFICATION' && (
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900 text-sm block">Official Enterprise WIN Notification Broadcast</span>
              <span className="text-[11px] text-slate-500">Contracts team sends official company-wide announcement email.</span>
            </div>
            <button
              onClick={handleGenerateAiWinEmail}
              disabled={isAiLoading}
              className="inline-flex items-center px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-600" />
              {isAiLoading ? 'Drafting...' : 'AI WIN Email Composer'}
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Email Subject Line</label>
              <input
                type="text"
                value={opportunity.winNotification?.emailSubject || `🎉 DEAL WIN: ${opportunity.clientName} - ${opportunity.title} [${formatCurrency(opportunity.dealValue)}]`}
                onChange={(e) => onUpdateOpportunity({
                  ...opportunity,
                  winNotification: { ...opportunity.winNotification, emailSubject: e.target.value }
                })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Email Broadcast Body</label>
              <textarea
                rows={5}
                value={opportunity.winNotification?.emailBody || `Dear Team,\n\nWe are excited to announce a major contract WIN with ${opportunity.clientName} for ${opportunity.title}!\n\n• TCV: ${formatCurrency(opportunity.dealValue)}\n• Sales Lead: ${opportunity.salesLead}\n• BU: ${opportunity.businessUnit}\n\nParallel onboarding: Finance is allocating budget codes and PMO is initiating sprint kickoff.`}
                onChange={(e) => onUpdateOpportunity({
                  ...opportunity,
                  winNotification: { ...opportunity.winNotification, emailBody: e.target.value }
                })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              onClick={() => {
                triggerWinConfetti();
                const updated = {
                  ...opportunity,
                  winNotification: {
                    ...opportunity.winNotification,
                    isReleased: true,
                    releasedAt: new Date().toISOString(),
                    releasedBy: 'Contracts & Legal Team',
                  },
                  // Initialize parallel finance & pmo structures
                  parallelFinance: {
                    ...opportunity.parallelFinance,
                    budgetCode: opportunity.parallelFinance?.budgetCode || (opportunity.trackingCode.includes('-OPP-') ? opportunity.trackingCode.replace('-OPP-', '-BC-') : `BC-${opportunity.trackingCode.replace(/^OPP-/, '')}`),
                    contractCode: opportunity.parallelFinance?.contractCode || (opportunity.trackingCode.includes('-OPP-') ? opportunity.trackingCode.replace('-OPP-', '-CTR-') : `CTR-${opportunity.trackingCode.replace(/^OPP-/, '')}`),
                    tcv: opportunity.dealValue,
                    contractStartDate: new Date().toISOString().split('T')[0],
                    contractEndDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    isConfigured: true,
                  },
                  parallelPmo: {
                    ...opportunity.parallelPmo,
                    isKickoffCompleted: true,
                    projectManager: opportunity.parallelPmo?.projectManager || 'Samantha Reynolds, PMP',
                    progressPercentage: 20,
                    deliveryHealth: 'ON_TRACK' as const,
                    milestones: [
                      { id: 'm1', title: 'Architecture Blueprint & Environment Setup', targetDate: '2026-09-15', status: 'IN_PROGRESS' },
                      { id: 'm2', title: 'Core Implementation & UAT Ingestion', targetDate: '2026-10-30', status: 'PENDING' },
                      { id: 'm3', title: 'Final Production Deployment & CWC Handover', targetDate: '2026-12-15', status: 'PENDING' },
                    ]
                  }
                };
                onUpdateOpportunity(updated);
                onAdvanceStage('PARALLEL_EXECUTION', 'WIN Notification Released & Parallel Phase Kickoff', comments || 'Contracts broadcasted WIN announcement email. Finance and PMO parallel tracks activated!');
              }}
              className="inline-flex items-center px-5 py-2.5 text-xs font-bold rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 shadow-sm transition-all"
            >
              <Mail className="w-4 h-4 mr-1.5" />
              Broadcast WIN Notification Email 🎉
            </button>
          </div>
        </div>
      )}

      {/* STAGE 12: PARALLEL EXECUTION (FINANCE & PMO TRACKS) */}
      {currentStage === 'PARALLEL_EXECUTION' && (
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Track 1: Finance Budget & TCV Setup */}
            <div className="bg-white rounded-xl border border-purple-200 p-4 space-y-3">
              <div className="flex items-center space-x-2 text-purple-900 font-bold text-sm">
                <DollarSign className="w-4 h-4 text-purple-600" />
                <span>Track A: Finance Budget & Contract Setup</span>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="block text-slate-600 font-medium">Assigned Budget Code</label>
                  <input
                    type="text"
                    value={opportunity.parallelFinance?.budgetCode || ''}
                    onChange={(e) => onUpdateOpportunity({
                      ...opportunity,
                      parallelFinance: { ...opportunity.parallelFinance, budgetCode: e.target.value }
                    })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium">Assigned Contract Code</label>
                  <input
                    type="text"
                    value={opportunity.parallelFinance?.contractCode || ''}
                    onChange={(e) => onUpdateOpportunity({
                      ...opportunity,
                      parallelFinance: { ...opportunity.parallelFinance, contractCode: e.target.value }
                    })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-600 font-medium">Start Date</label>
                    <input
                      type="date"
                      value={opportunity.parallelFinance?.contractStartDate || ''}
                      onChange={(e) => onUpdateOpportunity({
                        ...opportunity,
                        parallelFinance: { ...opportunity.parallelFinance, contractStartDate: e.target.value }
                      })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium">End Date</label>
                    <input
                      type="date"
                      value={opportunity.parallelFinance?.contractEndDate || ''}
                      onChange={(e) => onUpdateOpportunity({
                        ...opportunity,
                        parallelFinance: { ...opportunity.parallelFinance, contractEndDate: e.target.value }
                      })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Track 2: PMO Project Delivery Kickoff */}
            <div className="bg-white rounded-xl border border-cyan-200 p-4 space-y-3">
              <div className="flex items-center space-x-2 text-cyan-900 font-bold text-sm">
                <CheckSquare className="w-4 h-4 text-cyan-600" />
                <span>Track B: PMO / BU Delivery Execution</span>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="block text-slate-600 font-medium">Assigned Project Manager</label>
                  <input
                    type="text"
                    value={opportunity.parallelPmo?.projectManager || ''}
                    onChange={(e) => onUpdateOpportunity({
                      ...opportunity,
                      parallelPmo: { ...opportunity.parallelPmo, projectManager: e.target.value }
                    })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium">Delivery Completion %</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={opportunity.parallelPmo?.progressPercentage || 0}
                      onChange={(e) => onUpdateOpportunity({
                        ...opportunity,
                        parallelPmo: { ...opportunity.parallelPmo, progressPercentage: Number(e.target.value) }
                      })}
                      className="flex-1 accent-cyan-600"
                    />
                    <span className="font-bold text-slate-800 w-10 text-right">{opportunity.parallelPmo?.progressPercentage || 0}%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium">Delivery Status</label>
                  <select
                    value={opportunity.parallelPmo?.deliveryHealth || 'ON_TRACK'}
                    onChange={(e: any) => onUpdateOpportunity({
                      ...opportunity,
                      parallelPmo: { ...opportunity.parallelPmo, deliveryHealth: e.target.value }
                    })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    <option value="ON_TRACK">🟢 On Track (Healthy)</option>
                    <option value="AT_RISK">🟡 At Risk (Requires Attention)</option>
                    <option value="DELAYED">🔴 Delayed</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              onClick={() => {
                const updated = {
                  ...opportunity,
                  parallelPmo: {
                    ...opportunity.parallelPmo,
                    progressPercentage: 100,
                  },
                  cwcRecord: {
                    ...opportunity.cwcRecord,
                    cwcNumber: opportunity.cwcRecord?.cwcNumber || (opportunity.trackingCode.includes('-OPP-') ? opportunity.trackingCode.replace('-OPP-', '-CWC-') : `CWC-${new Date().getFullYear()}-${opportunity.trackingCode.replace(/^OPP-/, '')}`),
                    issuedDate: new Date().toISOString().split('T')[0],
                    pmoLeadSigner: opportunity.parallelPmo?.projectManager || 'Samantha Reynolds, PMP',
                    clientApproverName: opportunity.clientContactName,
                    acceptanceRemarks: 'All deliverables tested and validated against SOW specifications.',
                  }
                };
                onUpdateOpportunity(updated);
                onAdvanceStage('CWC_DELIVERY', 'Delivery Complete: Generated CWC', comments || 'PMO completed project milestones. Initialized Certificate of Work Completion.');
              }}
              className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-lg bg-cyan-700 text-white hover:bg-cyan-800 shadow-xs transition-all"
            >
              Milestones Complete → Issue CWC (PMO Sign-off)
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </button>
          </div>
        </div>
      )}

      {/* STAGE 13: CERTIFICATE OF WORK COMPLETION (CWC) */}
      {currentStage === 'CWC_DELIVERY' && (
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">Certificate of Work Completion (CWC) Details</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-teal-100 text-teal-800">
                PMO & BU Endorsement
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">CWC Reference #</label>
                <input
                  type="text"
                  value={opportunity.cwcRecord?.cwcNumber || (opportunity.trackingCode.includes('-OPP-') ? opportunity.trackingCode.replace('-OPP-', '-CWC-') : `CWC-2026-${opportunity.trackingCode.replace(/^OPP-/, '')}`)}
                  onChange={(e) => onUpdateOpportunity({
                    ...opportunity,
                    cwcRecord: { ...opportunity.cwcRecord, cwcNumber: e.target.value }
                  })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">PMO Lead Signer</label>
                <input
                  type="text"
                  value={opportunity.cwcRecord?.pmoLeadSigner || opportunity.parallelPmo?.projectManager || ''}
                  onChange={(e) => onUpdateOpportunity({
                    ...opportunity,
                    cwcRecord: { ...opportunity.cwcRecord, pmoLeadSigner: e.target.value }
                  })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Client Acceptance Verification Remarks</label>
              <textarea
                rows={2}
                value={opportunity.cwcRecord?.acceptanceRemarks || ''}
                onChange={(e) => onUpdateOpportunity({
                  ...opportunity,
                  cwcRecord: { ...opportunity.cwcRecord, acceptanceRemarks: e.target.value }
                })}
                placeholder="Final user acceptance testing complete and accepted by client sponsor..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              onClick={() => {
                const updated = {
                  ...opportunity,
                  cwcRecord: {
                    ...opportunity.cwcRecord,
                    isAcceptedByClient: true,
                  },
                  billingRecord: {
                    ...opportunity.billingRecord,
                    invoiceNumber: opportunity.billingRecord?.invoiceNumber || (opportunity.trackingCode.includes('-OPP-') ? opportunity.trackingCode.replace('-OPP-', '-INV-') : `INV-2026-${opportunity.trackingCode.replace(/^OPP-/, '')}`),
                    invoiceAmount: opportunity.dealValue,
                    totalAmount: opportunity.dealValue,
                    invoiceDate: new Date().toISOString().split('T')[0],
                    paymentDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    paymentStatus: 'ISSUED' as const,
                  }
                };
                onUpdateOpportunity(updated);
                onAdvanceStage('FINANCE_BILLING_ENDORSEMENT', 'CWC Signed & Endorsed to Finance', comments || 'PMO signed CWC. Endorsed to Finance for final billing.');
              }}
              className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-lg bg-teal-600 text-white hover:bg-teal-700 shadow-xs transition-all"
            >
              Sign CWC & Endorse to Finance for Billing
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </button>
          </div>
        </div>
      )}

      {/* STAGE 14: FINANCE BILLING ENDORSEMENT */}
      {currentStage === 'FINANCE_BILLING_ENDORSEMENT' && (
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">Finance Invoice Generation & Billing</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                Accounts Receivable
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Invoice Reference #</label>
                <input
                  type="text"
                  value={opportunity.billingRecord?.invoiceNumber || ''}
                  onChange={(e) => onUpdateOpportunity({
                    ...opportunity,
                    billingRecord: { ...opportunity.billingRecord, invoiceNumber: e.target.value }
                  })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Invoice Amount ($)</label>
                <input
                  type="number"
                  value={opportunity.billingRecord?.totalAmount || opportunity.dealValue}
                  onChange={(e) => onUpdateOpportunity({
                    ...opportunity,
                    billingRecord: { ...opportunity.billingRecord, totalAmount: Number(e.target.value) }
                  })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Payment Status</label>
                <select
                  value={opportunity.billingRecord?.paymentStatus || 'ISSUED'}
                  onChange={(e: any) => onUpdateOpportunity({
                    ...opportunity,
                    billingRecord: { ...opportunity.billingRecord, paymentStatus: e.target.value }
                  })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  <option value="ISSUED">📨 Invoice Issued (Pending Payment)</option>
                  <option value="PAID">✅ Paid / Collected</option>
                  <option value="OVERDUE">⚠️ Overdue</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              onClick={() => {
                const updated = {
                  ...opportunity,
                  billingRecord: {
                    ...opportunity.billingRecord,
                    paymentStatus: 'PAID' as const,
                    confirmedByFinanceDate: new Date().toISOString(),
                  }
                };
                onUpdateOpportunity(updated);
                onAdvanceStage('DEAL_CLOSED', 'Payment Collected & Deal Closed', comments || 'Finance confirmed full payment collection. Project formally closed & archived.');
              }}
              className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition-all"
            >
              Confirm Full Collection & Close Deal 🎉
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </button>
          </div>
        </div>
      )}

      {/* STAGE 15: DEAL CLOSED */}
      {currentStage === 'DEAL_CLOSED' && (
        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-2">
          <div className="flex items-center space-x-2 text-emerald-900 font-bold text-sm">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span>Opportunity Lifecycle Successfully Completed & Realized</span>
          </div>
          <p className="text-emerald-800">
            Total Contract Value of <span className="font-bold">{formatCurrency(opportunity.dealValue)}</span> has been delivered, accepted via CWC ({opportunity.cwcRecord?.cwcNumber || 'CWC-Signed'}), and fully billed & collected.
          </p>
        </div>
      )}
    </div>
  );
};
