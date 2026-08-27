import React, { useState, useMemo } from 'react';
import {
  Opportunity,
  WorkflowStage,
  ClientOrganization,
  ResourceMember,
  FormSelectorsConfig,
  StageDefinition,
} from '../types';
import {
  X,
  Search,
  SlidersHorizontal,
  Edit3,
  Trash2,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Building2,
  User,
  DollarSign,
  Calendar,
  FileText,
  ShieldAlert,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Filter,
  Check,
  RotateCcw,
  Briefcase,
  Calculator,
  FileSignature,
  Send,
  Kanban,
  FileCheck,
  Receipt,
  Eye,
} from 'lucide-react';
import { WORKFLOW_STAGES, STAGE_MAP, BU_LABELS } from '../data/stages';

interface OpportunityAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunities: Opportunity[];
  clients: ClientOrganization[];
  resources: ResourceMember[];
  formSelectors: FormSelectorsConfig;
  stageDefinitions?: StageDefinition[];
  onUpdateOpportunity: (opp: Opportunity) => void;
  onDeleteOpportunity: (oppId: string) => void;
  onMoveStage?: (oppId: string, targetStage: WorkflowStage, reason: string) => void;
  onSelectOpportunity?: (opp: Opportunity) => void;
}

type EditTab = 'CORE' | 'TEAM' | 'SOLUTION' | 'LEGAL' | 'FINANCE' | 'DELIVERY';

export const OpportunityAdminModal: React.FC<OpportunityAdminModalProps> = ({
  isOpen,
  onClose,
  opportunities,
  clients,
  resources,
  formSelectors,
  stageDefinitions = WORKFLOW_STAGES,
  onUpdateOpportunity,
  onDeleteOpportunity,
  onMoveStage,
  onSelectOpportunity,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [buFilter, setBuFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  // Editing state
  const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null);
  const [activeEditTab, setActiveEditTab] = useState<EditTab>('CORE');

  // Stage Move state
  const [stageMoveOpp, setStageMoveOpp] = useState<Opportunity | null>(null);
  const [targetStage, setTargetStage] = useState<WorkflowStage>('OPPORTUNITY_INTAKE');
  const [stageMoveReason, setStageMoveReason] = useState<string>('');
  const [stageMoveError, setStageMoveError] = useState<string>('');

  // Delete Confirmation state
  const [deletingOpp, setDeletingOpp] = useState<Opportunity | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState<string>('');

  // Success toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered list
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      const matchesSearch =
        !searchTerm.trim() ||
        opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opp.trackingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opp.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (opp.salesLead && opp.salesLead.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (opp.solutionArchitect && opp.solutionArchitect.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStage = stageFilter === 'ALL' || opp.currentStage === stageFilter;
      const matchesBu = buFilter === 'ALL' || opp.businessUnit === buFilter;
      const matchesPriority = priorityFilter === 'ALL' || opp.priority === priorityFilter;

      return matchesSearch && matchesStage && matchesBu && matchesPriority;
    });
  }, [opportunities, searchTerm, stageFilter, buFilter, priorityFilter]);

  if (!isOpen) return null;

  // Open Edit Modal
  const handleOpenEdit = (opp: Opportunity) => {
    // Deep clone to isolate edits until save
    setEditingOpp(JSON.parse(JSON.stringify(opp)));
    setActiveEditTab('CORE');
  };

  // Save Edits
  const handleSaveEdits = () => {
    if (!editingOpp) return;
    if (!editingOpp.title.trim()) {
      alert('Opportunity Title is required.');
      return;
    }
    if (!editingOpp.trackingCode.trim()) {
      alert('Tracking Code is required.');
      return;
    }

    const updated: Opportunity = {
      ...editingOpp,
      updatedAt: new Date().toISOString(),
    };

    onUpdateOpportunity(updated);
    showToast(`Opportunity ${editingOpp.trackingCode} updated successfully.`);
    setEditingOpp(null);
  };

  // Open Move Stage Modal
  const handleOpenStageMove = (opp: Opportunity) => {
    setStageMoveOpp(opp);
    setTargetStage(opp.currentStage);
    setStageMoveReason(`Admin manual workflow override to ${STAGE_MAP[opp.currentStage]?.label || opp.currentStage}`);
    setStageMoveError('');
  };

  // Execute Move Stage
  const handleExecuteStageMove = () => {
    if (!stageMoveOpp) return;
    if (targetStage === stageMoveOpp.currentStage) {
      setStageMoveError('Please select a different target stage than the current stage.');
      return;
    }

    const now = new Date().toISOString();
    const targetStageDef = STAGE_MAP[targetStage];
    const targetStageName = targetStageDef?.name || targetStage;
    const reasonText = stageMoveReason.trim() || `Workflow manually moved to ${targetStageName} by Administrator`;

    const newHistoryEntry = {
      id: `admin-override-${Date.now()}`,
      timestamp: now,
      stage: targetStage,
      actorName: 'System Administrator',
      actorRole: 'ALL' as const,
      action: `Admin Stage Override: Moved to ${targetStageName}`,
      comments: reasonText,
      isApproval: true,
    };

    const updated: Opportunity = {
      ...stageMoveOpp,
      currentStage: targetStage,
      stageEnteredAt: now,
      updatedAt: now,
      history: [...(stageMoveOpp.history || []), newHistoryEntry],
    };

    onUpdateOpportunity(updated);
    showToast(`Successfully moved ${stageMoveOpp.trackingCode} to "${targetStageName}".`);
    setStageMoveOpp(null);
  };

  // Execute Delete
  const handleExecuteDelete = () => {
    if (!deletingOpp) return;
    onDeleteOpportunity(deletingOpp.id);
    showToast(`Opportunity ${deletingOpp.trackingCode} permanently deleted.`);
    setDeletingOpp(null);
    setDeleteConfirmText('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-70 bg-emerald-900 text-emerald-100 px-4 py-3 rounded-xl shadow-2xl border border-emerald-500 flex items-center space-x-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Main Admin Modal Container */}
      <div className="bg-white w-full max-w-7xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-xl shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Opportunity Master Admin Tool
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {opportunities.length} Pipeline Deals
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <ShieldAlert className="w-3 h-3 mr-1" />
                  Full CRUD & Stage Override
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Manually edit any opportunity field, override workflow stages across 14 lifecycle steps, or delete records.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shrink-0 text-xs">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by tracking code, title, client, sales lead, architect..."
              className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Stage Filter */}
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-500 font-medium text-[11px]">Stage:</span>
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="ALL">All Stages ({opportunities.length})</option>
                {stageDefinitions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.index}. {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* BU Filter */}
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-500 font-medium text-[11px]">BU:</span>
              <select
                value={buFilter}
                onChange={(e) => setBuFilter(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="ALL">All BUs</option>
                {Object.entries(BU_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-500 font-medium text-[11px]">Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="ALL">All</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            {(searchTerm || stageFilter !== 'ALL' || buFilter !== 'ALL' || priorityFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setStageFilter('ALL');
                  setBuFilter('ALL');
                  setPriorityFilter('ALL');
                }}
                className="px-2.5 py-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg font-bold transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Opportunity Table / Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {filteredOpportunities.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
              <div className="p-3 bg-slate-200 rounded-full w-12 h-12 mx-auto flex items-center justify-center text-slate-500">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">No opportunities match the search or filter criteria</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try adjusting your search query, stage selection, or clearing applied filters.
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 select-none">
                    <th className="py-3 px-3.5">Code / Title</th>
                    <th className="py-3 px-3">Client Organization</th>
                    <th className="py-3 px-3">Value / BU</th>
                    <th className="py-3 px-3">Current Stage</th>
                    <th className="py-3 px-3">Key Stakeholders</th>
                    <th className="py-3 px-3 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredOpportunities.map((opp) => {
                    const stageDef = STAGE_MAP[opp.currentStage] || {
                      order: 0,
                      name: opp.currentStage,
                      color: 'slate',
                    };

                    const priorityColors: Record<string, string> = {
                      CRITICAL: 'bg-rose-100 text-rose-800 border-rose-200',
                      HIGH: 'bg-amber-100 text-amber-800 border-amber-200',
                      MEDIUM: 'bg-blue-100 text-blue-800 border-blue-200',
                      LOW: 'bg-slate-100 text-slate-700 border-slate-200',
                    };

                    return (
                      <tr key={opp.id} className="hover:bg-indigo-50/30 transition-colors">
                        {/* Tracking Code & Title */}
                        <td className="py-3 px-3.5 align-top">
                          <div className="flex items-center space-x-1.5 mb-1">
                            <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 text-[11px]">
                              {opp.trackingCode}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${priorityColors[opp.priority] || 'bg-slate-100 text-slate-700'}`}>
                              {opp.priority}
                            </span>
                          </div>
                          <div className="font-bold text-slate-900 line-clamp-1 text-xs" title={opp.title}>
                            {opp.title}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center space-x-2">
                            <span>Updated: {opp.updatedAt ? new Date(opp.updatedAt).toLocaleDateString() : 'N/A'}</span>
                            {opp.stageEnteredAt && (
                              <span>• Stage Entry: {new Date(opp.stageEnteredAt).toLocaleDateString()}</span>
                            )}
                          </div>
                        </td>

                        {/* Client Organization */}
                        <td className="py-3 px-3 align-top">
                          <div className="font-semibold text-slate-800">{opp.clientName}</div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[160px]">{opp.clientContactName || 'No contact specified'}</div>
                          {opp.clientIndustry && (
                            <span className="inline-block mt-0.5 text-[9px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                              {opp.clientIndustry}
                            </span>
                          )}
                        </td>

                        {/* Value / BU */}
                        <td className="py-3 px-3 align-top whitespace-nowrap">
                          <div className="font-mono font-bold text-slate-900">
                            ${opp.dealValue.toLocaleString()} {opp.currency || 'USD'}
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            {BU_LABELS[opp.businessUnit] || opp.businessUnit}
                          </div>
                          {opp.probability !== undefined && (
                            <div className="text-[10px] text-slate-400">
                              Prob: <span className="font-bold text-slate-700">{opp.probability}%</span>
                            </div>
                          )}
                        </td>

                        {/* Current Stage */}
                        <td className="py-3 px-3 align-top">
                          <div className="flex items-center space-x-1.5">
                            <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                              {stageDef.order}
                            </span>
                            <span className="font-bold text-slate-800 text-[11px]">
                              {stageDef.name}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenStageMove(opp)}
                            className="mt-1.5 inline-flex items-center space-x-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                          >
                            <ArrowRightLeft className="w-3 h-3" />
                            <span>Move Stage</span>
                          </button>
                        </td>

                        {/* Key Stakeholders */}
                        <td className="py-3 px-3 align-top text-[11px] text-slate-600 space-y-0.5">
                          <div>
                            <span className="text-slate-400">Sales:</span> <span className="font-medium text-slate-800">{opp.salesLead || 'Unassigned'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Arch:</span> <span className="font-medium text-slate-800">{opp.solutionArchitect || 'Unassigned'}</span>
                          </div>
                          {opp.financeProcessor && (
                            <div>
                              <span className="text-slate-400">Fin:</span> <span className="font-medium text-purple-800">{opp.financeProcessor}</span>
                            </div>
                          )}
                        </td>

                        {/* Admin Action Buttons */}
                        <td className="py-3 px-3 align-top text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1">
                            {/* View in Cockpit */}
                            {onSelectOpportunity && (
                              <button
                                type="button"
                                onClick={() => {
                                  onSelectOpportunity(opp);
                                  onClose();
                                }}
                                title="Open in Opportunity Cockpit"
                                className="p-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer border border-transparent hover:border-blue-200"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Move Stage Quick Action */}
                            <button
                              type="button"
                              onClick={() => handleOpenStageMove(opp)}
                              title="Manually Move Workflow Stage"
                              className="p-1.5 rounded-lg text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition-colors cursor-pointer border border-transparent hover:border-indigo-200"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit All Details */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(opp)}
                              title="Manually Update Full Details"
                              className="p-1.5 rounded-lg text-amber-600 hover:text-amber-800 hover:bg-amber-50 transition-colors cursor-pointer border border-transparent hover:border-amber-200"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Opportunity */}
                            <button
                              type="button"
                              onClick={() => {
                                setDeletingOpp(opp);
                                setDeleteConfirmText('');
                              }}
                              title="Permanently Delete Opportunity"
                              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center space-x-2">
            <span>Showing <strong>{filteredOpportunities.length}</strong> of <strong>{opportunities.length}</strong> opportunities</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer"
          >
            Close Tool
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: MOVE WORKFLOW STAGE OVERRIDE MODAL */}
      {/* ========================================================================= */}
      {stageMoveOpp && (
        <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 space-y-4 p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2.5 text-indigo-700">
                <div className="p-2 bg-indigo-100 rounded-xl">
                  <ArrowRightLeft className="w-5 h-5 text-indigo-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Manually Move Workflow Stage</h3>
                  <p className="text-xs text-slate-500 font-mono">{stageMoveOpp.trackingCode} • {stageMoveOpp.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStageMoveOpp(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Stage Indicator */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">CURRENT STAGE</span>
                <span className="font-bold text-slate-800">
                  {STAGE_MAP[stageMoveOpp.currentStage]?.order}. {STAGE_MAP[stageMoveOpp.currentStage]?.name}
                </span>
              </div>
              <span className="text-slate-400 font-mono text-[10px]">
                {stageMoveOpp.currentStage}
              </span>
            </div>

            {/* Target Stage Picker */}
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-700 flex items-center space-x-1">
                <span>Select Target Workflow Stage</span>
                <span className="text-rose-500">*</span>
              </label>
              <select
                value={targetStage}
                onChange={(e) => {
                  const newStage = e.target.value as WorkflowStage;
                  setTargetStage(newStage);
                  setStageMoveReason(`Admin manual workflow override to ${STAGE_MAP[newStage]?.label || newStage}`);
                  setStageMoveError('');
                }}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {stageDefinitions.map((s) => (
                  <option key={s.id} value={s.id}>
                    Stage {s.index}: {s.label} ({s.primaryActor})
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-500 block">
                Moving stages will instantly update the deal's active workflow step and record a high-priority admin audit entry.
              </span>
            </div>

            {/* Reason / Audit Note */}
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-700 flex items-center space-x-1">
                <span>Reason for Stage Override / Audit Notes</span>
                <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={stageMoveReason}
                onChange={(e) => setStageMoveReason(e.target.value)}
                placeholder="Specify why this opportunity is being jumped or reassigned..."
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {stageMoveError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{stageMoveError}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setStageMoveOpp(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteStageMove}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Apply Stage Override</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT FULL OPPORTUNITY DETAILS MODAL */}
      {/* ========================================================================= */}
      {editingOpp && (
        <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Edit Opportunity Master Record
                  </h3>
                  <p className="text-xs text-slate-300 font-mono">
                    {editingOpp.trackingCode} • {editingOpp.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingOpp(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-4 overflow-x-auto text-xs shrink-0 scrollbar-none">
              {[
                { key: 'CORE', label: '1. Core Details & Commercials', icon: DollarSign },
                { key: 'TEAM', label: '2. Deal Team & Processors', icon: User },
                { key: 'SOLUTION', label: '3. Solution & Scope', icon: FileText },
                { key: 'LEGAL', label: '4. Legal & Contract', icon: Briefcase },
                { key: 'FINANCE', label: '5. Finance & Margins', icon: Calculator },
                { key: 'DELIVERY', label: '6. PMO, DocuSign & Billing', icon: Send },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeEditTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveEditTab(tab.key as EditTab)}
                    className={`flex items-center space-x-1.5 py-3 px-3.5 border-b-2 font-bold whitespace-nowrap cursor-pointer transition-colors ${
                      isActive
                        ? 'border-indigo-600 text-indigo-700 bg-white'
                        : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-5 text-xs space-y-4">
              
              {/* TAB 1: CORE DETAILS */}
              {activeEditTab === 'CORE' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="font-bold text-slate-700 block mb-1">Opportunity Title *</label>
                      <input
                        type="text"
                        value={editingOpp.title}
                        onChange={(e) => setEditingOpp({ ...editingOpp, title: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Tracking Code *</label>
                      <input
                        type="text"
                        value={editingOpp.trackingCode}
                        onChange={(e) => setEditingOpp({ ...editingOpp, trackingCode: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Client Organization *</label>
                      <select
                        value={editingOpp.clientName}
                        onChange={(e) => {
                          const val = e.target.value;
                          const matchedClient = clients.find((c) => c.name === val);
                          setEditingOpp({
                            ...editingOpp,
                            clientName: val,
                            clientIndustry: matchedClient?.industry || editingOpp.clientIndustry,
                            clientContactName: matchedClient?.primaryContactName || editingOpp.clientContactName,
                            clientContactEmail: matchedClient?.contactEmail || editingOpp.clientContactEmail,
                          });
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        {clients.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name} {c.abbreviation ? `(${c.abbreviation})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Client Industry</label>
                      <input
                        type="text"
                        value={editingOpp.clientIndustry || ''}
                        onChange={(e) => setEditingOpp({ ...editingOpp, clientIndustry: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Business Unit / Dept *</label>
                      <select
                        value={editingOpp.businessUnit}
                        onChange={(e) => setEditingOpp({ ...editingOpp, businessUnit: e.target.value as any })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        {Object.entries(BU_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Deal Value (TCV) *</label>
                      <input
                        type="number"
                        value={editingOpp.dealValue}
                        onChange={(e) => setEditingOpp({ ...editingOpp, dealValue: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-emerald-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Currency</label>
                      <select
                        value={editingOpp.currency || 'USD'}
                        onChange={(e) => setEditingOpp({ ...editingOpp, currency: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="PHP">PHP (₱)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="SGD">SGD (S$)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Win Probability (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={editingOpp.probability ?? 50}
                        onChange={(e) => setEditingOpp({ ...editingOpp, probability: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Priority</label>
                      <select
                        value={editingOpp.priority}
                        onChange={(e) => setEditingOpp({ ...editingOpp, priority: e.target.value as any })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Client Contact Person</label>
                      <input
                        type="text"
                        value={editingOpp.clientContactName || ''}
                        onChange={(e) => setEditingOpp({ ...editingOpp, clientContactName: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Client Contact Email</label>
                      <input
                        type="email"
                        value={editingOpp.clientContactEmail || ''}
                        onChange={(e) => setEditingOpp({ ...editingOpp, clientContactEmail: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Description / Project Scope</label>
                    <textarea
                      rows={3}
                      value={editingOpp.description}
                      onChange={(e) => setEditingOpp({ ...editingOpp, description: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: DEAL TEAM & PROCESSORS */}
              {activeEditTab === 'TEAM' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Sales Lead / Account Executive</label>
                      <select
                        value={editingOpp.salesLead || ''}
                        onChange={(e) => setEditingOpp({ ...editingOpp, salesLead: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="">-- Select Sales Lead --</option>
                        {resources.map((r) => (
                          <option key={r.id} value={r.name}>
                            {r.name} ({r.role})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Solution Architect</label>
                      <select
                        value={editingOpp.solutionArchitect || ''}
                        onChange={(e) => setEditingOpp({ ...editingOpp, solutionArchitect: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="">-- Select Solution Architect --</option>
                        {resources.map((r) => (
                          <option key={r.id} value={r.name}>
                            {r.name} ({r.role})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Contracts Processor</label>
                      <select
                        value={editingOpp.contractsProcessor || ''}
                        onChange={(e) => setEditingOpp({ ...editingOpp, contractsProcessor: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="">-- Select Contracts Specialist --</option>
                        {resources.map((r) => (
                          <option key={r.id} value={r.name}>
                            {r.name} ({r.role})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Finance Processor / Deal Desk</label>
                      <select
                        value={editingOpp.financeProcessor || ''}
                        onChange={(e) => setEditingOpp({ ...editingOpp, financeProcessor: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="">-- Select Finance Processor --</option>
                        {resources.map((r) => (
                          <option key={r.id} value={r.name}>
                            {r.name} ({r.role})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <h4 className="font-bold text-slate-900 text-xs mb-2">Stakeholder Assignment Status</h4>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      Assigned team members are automatically recognized in role-specific dashboard filters and action sign-offs across Stages 1 through 14.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 3: SOLUTION & SCOPE */}
              {activeEditTab === 'SOLUTION' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Solution Document Name</label>
                      <input
                        type="text"
                        value={editingOpp.solutionProposal?.solutionDocName || ''}
                        onChange={(e) =>
                          setEditingOpp({
                            ...editingOpp,
                            solutionProposal: {
                              ...editingOpp.solutionProposal,
                              solutionDocName: e.target.value,
                              deliverables: editingOpp.solutionProposal?.deliverables || [],
                              techStack: editingOpp.solutionProposal?.techStack || [],
                              estimatedEffortWeeks: editingOpp.solutionProposal?.estimatedEffortWeeks || 4,
                              estimatedDeliveryCost: editingOpp.solutionProposal?.estimatedDeliveryCost || 0,
                            },
                          })
                        }
                        placeholder="e.g. Cloud_Architecture_Blueprint_v1.0.pdf"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Client Proposal Link</label>
                      <input
                        type="url"
                        value={editingOpp.solutionProposal?.clientProposalLink || ''}
                        onChange={(e) =>
                          setEditingOpp({
                            ...editingOpp,
                            solutionProposal: {
                              ...editingOpp.solutionProposal,
                              clientProposalLink: e.target.value,
                              deliverables: editingOpp.solutionProposal?.deliverables || [],
                              techStack: editingOpp.solutionProposal?.techStack || [],
                              estimatedEffortWeeks: editingOpp.solutionProposal?.estimatedEffortWeeks || 4,
                              estimatedDeliveryCost: editingOpp.solutionProposal?.estimatedDeliveryCost || 0,
                            },
                          })
                        }
                        placeholder="https://docs.ibsi.internal/proposals/..."
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Pricing Calculator Link</label>
                      <input
                        type="url"
                        value={editingOpp.solutionProposal?.pricingCalculatorLink || ''}
                        onChange={(e) =>
                          setEditingOpp({
                            ...editingOpp,
                            solutionProposal: {
                              ...editingOpp.solutionProposal,
                              pricingCalculatorLink: e.target.value,
                              deliverables: editingOpp.solutionProposal?.deliverables || [],
                              techStack: editingOpp.solutionProposal?.techStack || [],
                              estimatedEffortWeeks: editingOpp.solutionProposal?.estimatedEffortWeeks || 4,
                              estimatedDeliveryCost: editingOpp.solutionProposal?.estimatedDeliveryCost || 0,
                            },
                          })
                        }
                        placeholder="https://calc.ibsi.internal/sheets/..."
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Est. Delivery Cost ($)</label>
                      <input
                        type="number"
                        value={editingOpp.solutionProposal?.estimatedDeliveryCost || 0}
                        onChange={(e) =>
                          setEditingOpp({
                            ...editingOpp,
                            solutionProposal: {
                              ...editingOpp.solutionProposal,
                              estimatedDeliveryCost: Number(e.target.value),
                              deliverables: editingOpp.solutionProposal?.deliverables || [],
                              techStack: editingOpp.solutionProposal?.techStack || [],
                              estimatedEffortWeeks: editingOpp.solutionProposal?.estimatedEffortWeeks || 4,
                            },
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Architecture Summary / Scope Notes</label>
                    <textarea
                      rows={3}
                      value={editingOpp.solutionProposal?.architectureSummary || ''}
                      onChange={(e) =>
                        setEditingOpp({
                          ...editingOpp,
                          solutionProposal: {
                            ...editingOpp.solutionProposal,
                            architectureSummary: e.target.value,
                            deliverables: editingOpp.solutionProposal?.deliverables || [],
                            techStack: editingOpp.solutionProposal?.techStack || [],
                            estimatedEffortWeeks: editingOpp.solutionProposal?.estimatedEffortWeeks || 4,
                            estimatedDeliveryCost: editingOpp.solutionProposal?.estimatedDeliveryCost || 0,
                          },
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: LEGAL & CONTRACT */}
              {activeEditTab === 'LEGAL' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Contract Type</label>
                      <input
                        type="text"
                        value={editingOpp.contractDetails?.contractType || editingOpp.contractType || ''}
                        onChange={(e) =>
                          setEditingOpp({
                            ...editingOpp,
                            contractType: e.target.value,
                            contractDetails: {
                              ...editingOpp.contractDetails,
                              contractType: e.target.value,
                            },
                          })
                        }
                        placeholder="e.g. Master Services Agreement"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Contract Number / Ref #</label>
                      <input
                        type="text"
                        value={editingOpp.contractDetails?.contractNumber || ''}
                        onChange={(e) =>
                          setEditingOpp({
                            ...editingOpp,
                            contractDetails: {
                              ...editingOpp.contractDetails,
                              contractNumber: e.target.value,
                            },
                          })
                        }
                        placeholder="e.g. CTR-2026-8801"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Governing Law Jurisdiction</label>
                      <input
                        type="text"
                        value={editingOpp.contractDetails?.governingLaw || ''}
                        onChange={(e) =>
                          setEditingOpp({
                            ...editingOpp,
                            contractDetails: {
                              ...editingOpp.contractDetails,
                              governingLaw: e.target.value,
                            },
                          })
                        }
                        placeholder="e.g. State of California"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Contracts Specialist Notes</label>
                    <textarea
                      rows={3}
                      value={editingOpp.contractDetails?.contractsSpecialistNotes || editingOpp.contractsReviewData?.contractsReviewNotes || ''}
                      onChange={(e) =>
                        setEditingOpp({
                          ...editingOpp,
                          contractDetails: {
                            ...editingOpp.contractDetails,
                            contractsSpecialistNotes: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* TAB 5: FINANCE & MARGINS */}
              {activeEditTab === 'FINANCE' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Stage 5 Trigger Date</label>
                      <input
                        type="date"
                        value={editingOpp.initialFinanceReviewData?.stage5TriggerDate?.split('T')[0] || ''}
                        onChange={(e) =>
                          setEditingOpp({
                            ...editingOpp,
                            initialFinanceReviewData: {
                              ...editingOpp.initialFinanceReviewData,
                              stage5TriggerDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                            },
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Acknowledged Start Date</label>
                      <input
                        type="date"
                        value={editingOpp.initialFinanceReviewData?.acknowledgedStartDate || ''}
                        onChange={(e) =>
                          setEditingOpp({
                            ...editingOpp,
                            initialFinanceReviewData: {
                              ...editingOpp.initialFinanceReviewData,
                              acknowledgedStartDate: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-purple-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Approved Margin (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editingOpp.initialFinanceReviewData?.approvedMarginPercent || editingOpp.initialFinanceApproval?.approvedMarginPercent || ''}
                        onChange={(e) => {
                          const margin = Number(e.target.value);
                          setEditingOpp({
                            ...editingOpp,
                            initialFinanceReviewData: {
                              ...editingOpp.initialFinanceReviewData,
                              approvedMarginPercent: margin,
                            },
                            initialFinanceApproval: {
                              ...editingOpp.initialFinanceApproval,
                              approvedMarginPercent: margin,
                              approved: true,
                            },
                          });
                        }}
                        placeholder="e.g. 38.5"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-emerald-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Finance Review Notes & Conditions</label>
                    <textarea
                      rows={3}
                      value={editingOpp.initialFinanceReviewData?.financeReviewNotes || editingOpp.initialFinanceApproval?.comments || ''}
                      onChange={(e) =>
                        setEditingOpp({
                          ...editingOpp,
                          initialFinanceReviewData: {
                            ...editingOpp.initialFinanceReviewData,
                            financeReviewNotes: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* TAB 6: DELIVERY, PMO & BILLING */}
              {activeEditTab === 'DELIVERY' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">DocuSign Status</label>
                      <select
                        value={editingOpp.docusignDetails?.status || 'DRAFT'}
                        onChange={(e) =>
                          setEditingOpp({
                            ...editingOpp,
                            docusignDetails: {
                              routingMode: editingOpp.docusignDetails?.routingMode || 'DOCUSIGN',
                              ...editingOpp.docusignDetails,
                              status: e.target.value as any,
                            },
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="DRAFT">DRAFT</option>
                        <option value="SENT">SENT</option>
                        <option value="VIEWED">VIEWED</option>
                        <option value="CLIENT_SIGNED">CLIENT_SIGNED</option>
                        <option value="COUNTERSIGNED">COUNTERSIGNED</option>
                        <option value="COMPLETED">COMPLETED</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">PMO Delivery Health</label>
                      <select
                        value={editingOpp.parallelPmo?.deliveryHealth || 'ON_TRACK'}
                        onChange={(e) =>
                          setEditingOpp({
                            ...editingOpp,
                            parallelPmo: {
                              progressPercentage: editingOpp.parallelPmo?.progressPercentage || 0,
                              milestones: editingOpp.parallelPmo?.milestones || [],
                              isKickoffCompleted: editingOpp.parallelPmo?.isKickoffCompleted || false,
                              ...editingOpp.parallelPmo,
                              deliveryHealth: e.target.value as any,
                            },
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="ON_TRACK">ON_TRACK</option>
                        <option value="AT_RISK">AT_RISK</option>
                        <option value="DELAYED">DELAYED</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Billing Payment Status</label>
                      <select
                        value={editingOpp.billingRecord?.paymentStatus || 'DRAFT'}
                        onChange={(e) =>
                          setEditingOpp({
                            ...editingOpp,
                            billingRecord: {
                              paymentStatus: e.target.value as any,
                              ...editingOpp.billingRecord,
                            },
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="DRAFT">DRAFT</option>
                        <option value="ISSUED">ISSUED</option>
                        <option value="PARTIALLY_PAID">PARTIALLY_PAID</option>
                        <option value="PAID">PAID</option>
                        <option value="OVERDUE">OVERDUE</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Edit Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500">
                All edits take immediate effect across all dashboards and audit trails.
              </span>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingOpp(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl border border-slate-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdits}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Opportunity Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {deletingOpp && (
        <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-full">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Permanently Delete Opportunity?</h4>
                <p className="text-xs text-slate-500 font-mono">{deletingOpp.trackingCode}</p>
              </div>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1">
              <div className="font-bold">{deletingOpp.title}</div>
              <div>Client: <span className="font-semibold">{deletingOpp.clientName}</span></div>
              <div>Deal Value: <span className="font-bold font-mono">${deletingOpp.dealValue.toLocaleString()} {deletingOpp.currency}</span></div>
              <div className="pt-1 text-[11px] text-rose-700">
                Warning: This will completely erase this deal, all stage history, approval timestamps, and attached documents from the database.
              </div>
            </div>

            <p className="text-xs text-slate-600">
              To confirm deletion, please type <strong className="font-mono text-rose-600">{deletingOpp.trackingCode}</strong> below:
            </p>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={`Type ${deletingOpp.trackingCode} to confirm`}
              className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />

            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setDeletingOpp(null);
                  setDeleteConfirmText('');
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmText.trim().toLowerCase() !== deletingOpp.trackingCode.toLowerCase()}
                onClick={handleExecuteDelete}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm & Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
