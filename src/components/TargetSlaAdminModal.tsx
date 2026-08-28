import React, { useState, useMemo } from 'react';
import {
  X,
  Clock,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Search,
  Filter,
  Download,
  Upload,
  ArrowRight,
  TrendingUp,
  Info,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Check,
  Zap,
  Activity,
  AlertCircle
} from 'lucide-react';
import { StageDefinition, WorkflowStage, StakeholderRole, Opportunity } from '../types';
import { WORKFLOW_STAGES, STAGE_MAP, ensureValid15Stages } from '../data/stages';
import { getSlaStatus } from '../utils/formatters';

interface TargetSlaAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  stageDefinitions: StageDefinition[];
  onSaveStageDefinitions: (updatedStages: StageDefinition[]) => void;
  opportunities: Opportunity[];
}

export interface SlaPreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  totalDays: number;
  stages: Record<WorkflowStage, number>;
}

export const SLA_PRESETS: Record<string, SlaPreset> = {
  STANDARD: {
    id: 'STANDARD',
    name: 'Standard Enterprise Baseline',
    badge: '68 Days E2E',
    description: 'Balanced enterprise workflow designed for multi-stakeholder commercial, legal, and delivery governance.',
    totalDays: 68,
    stages: {
      OPPORTUNITY_INTAKE: 2,
      SOLUTION_DESIGN: 5,
      SALES_PROPOSAL_REVIEW: 2,
      CONTRACTS_PROPOSAL_REVIEW: 3,
      INITIAL_FINANCE_APPROVAL: 2,
      CONTRACTS_PROPOSAL_ENDORSEMENT: 2,
      CLIENT_BUYOFF_NEGOTIATION: 7,
      CONTRACT_CONVERSION: 4,
      FINAL_FINANCE_APPROVAL: 2,
      DOCUSIGN_CLIENT_ROUTING: 4,
      WIN_NOTIFICATION: 1,
      PARALLEL_EXECUTION: 30,
      CWC_DELIVERY: 3,
      FINANCE_BILLING_ENDORSEMENT: 5,
      DEAL_CLOSED: 0,
    },
  },
  FAST_TRACK: {
    id: 'FAST_TRACK',
    name: 'Fast-Track / Agile Delivery',
    badge: '33 Days E2E',
    description: 'Accelerated turnaround for high-velocity standard deals, renewals, and streamlined RFP responses.',
    totalDays: 33,
    stages: {
      OPPORTUNITY_INTAKE: 1,
      SOLUTION_DESIGN: 3,
      SALES_PROPOSAL_REVIEW: 1,
      CONTRACTS_PROPOSAL_REVIEW: 2,
      INITIAL_FINANCE_APPROVAL: 1,
      CONTRACTS_PROPOSAL_ENDORSEMENT: 1,
      CLIENT_BUYOFF_NEGOTIATION: 4,
      CONTRACT_CONVERSION: 2,
      FINAL_FINANCE_APPROVAL: 1,
      DOCUSIGN_CLIENT_ROUTING: 2,
      WIN_NOTIFICATION: 1,
      PARALLEL_EXECUTION: 10,
      CWC_DELIVERY: 2,
      FINANCE_BILLING_ENDORSEMENT: 2,
      DEAL_CLOSED: 0,
    },
  },
  STRATEGIC_LARGE: {
    id: 'STRATEGIC_LARGE',
    name: 'Strategic & High-Governance Deals',
    badge: '98 Days E2E',
    description: 'Extended validation periods for complex Tier-1 enterprise deals with multi-tier approvals and bespoke MSA clauses.',
    totalDays: 98,
    stages: {
      OPPORTUNITY_INTAKE: 3,
      SOLUTION_DESIGN: 10,
      SALES_PROPOSAL_REVIEW: 3,
      CONTRACTS_PROPOSAL_REVIEW: 5,
      INITIAL_FINANCE_APPROVAL: 4,
      CONTRACTS_PROPOSAL_ENDORSEMENT: 3,
      CLIENT_BUYOFF_NEGOTIATION: 14,
      CONTRACT_CONVERSION: 7,
      FINAL_FINANCE_APPROVAL: 3,
      DOCUSIGN_CLIENT_ROUTING: 7,
      WIN_NOTIFICATION: 2,
      PARALLEL_EXECUTION: 45,
      CWC_DELIVERY: 5,
      FINANCE_BILLING_ENDORSEMENT: 7,
      DEAL_CLOSED: 0,
    },
  },
};

export const TargetSlaAdminModal: React.FC<TargetSlaAdminModalProps> = ({
  isOpen,
  onClose,
  stageDefinitions,
  onSaveStageDefinitions,
  opportunities,
}) => {
  // Working copy of stage definitions
  const [workingStages, setWorkingStages] = useState<StageDefinition[]>(() => {
    return ensureValid15Stages(stageDefinitions);
  });

  // Re-sync when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setWorkingStages(ensureValid15Stages(stageDefinitions));
      setSaveSuccess(false);
    }
  }, [isOpen, stageDefinitions]);

  // UI state
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState<'ALL' | '1' | '2' | '3' | '4'>('ALL');
  const [selectedActorFilter, setSelectedActorFilter] = useState<StakeholderRole | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'STAGES' | 'SIMULATION'>('STAGES');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [expandedNotesStage, setExpandedNotesStage] = useState<string | null>(null);

  // Group definitions for phases
  const PHASES = [
    { id: '1', name: 'Phase 1: Presales & Architecture', count: 3, range: [1, 2, 3] },
    { id: '2', name: 'Phase 2: Legal & Commercial Buyoff', count: 4, range: [4, 5, 6, 7] },
    { id: '3', name: 'Phase 3: Contract & WIN Broadcast', count: 4, range: [8, 9, 10, 11] },
    { id: '4', name: 'Phase 4: Delivery, CWC & Billing', count: 4, range: [12, 13, 14, 15] },
  ];

  // Stage Map from working copy
  const workingStageMap = useMemo(() => {
    return workingStages.reduce((acc, s) => {
      acc[s.id] = s;
      return acc;
    }, {} as Record<WorkflowStage, StageDefinition>);
  }, [workingStages]);

  // Total End-to-End SLA days
  const totalE2eDays = useMemo(() => {
    return workingStages.reduce((sum, s) => sum + (s.targetSlaDays || 0), 0);
  }, [workingStages]);

  // Baseline total
  const baselineE2eDays = useMemo(() => {
    return WORKFLOW_STAGES.reduce((sum, s) => sum + (s.targetSlaDays || 0), 0);
  }, []);

  // Live Pipeline Impact under working copy
  const pipelineImpact = useMemo(() => {
    let onTrack = 0;
    let warning = 0;
    let critical = 0;

    opportunities.forEach((opp) => {
      if (opp.currentStage === 'DEAL_CLOSED') return;
      const sla = getSlaStatus(opp, workingStageMap);
      if (sla.isOverdue) critical++;
      else if (sla.status === 'WARNING') warning++;
      else onTrack++;
    });

    return { onTrack, warning, critical, total: onTrack + warning + critical };
  }, [opportunities, workingStageMap]);

  // Filtered stages
  const filteredStages = useMemo(() => {
    return workingStages.filter((stage) => {
      // Phase Filter
      if (selectedPhaseFilter !== 'ALL') {
        const phaseObj = PHASES.find((p) => p.id === selectedPhaseFilter);
        if (phaseObj && !phaseObj.range.includes(stage.index)) {
          return false;
        }
      }

      // Actor Filter
      if (selectedActorFilter !== 'ALL' && stage.primaryActor !== selectedActorFilter) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchLabel = stage.label.toLowerCase().includes(q);
        const matchShort = stage.shortLabel.toLowerCase().includes(q);
        const matchDesc = stage.description.toLowerCase().includes(q);
        const matchActor = stage.actorLabel.toLowerCase().includes(q);
        if (!matchLabel && !matchShort && !matchDesc && !matchActor) {
          return false;
        }
      }

      return true;
    });
  }, [workingStages, selectedPhaseFilter, selectedActorFilter, searchQuery]);

  // Handle stage SLA update
  const handleUpdateStageSla = (stageId: WorkflowStage, newDays: number) => {
    const validDays = Math.max(0, Math.min(180, Math.round(newDays)));
    setWorkingStages((prev) =>
      prev.map((s) => (s.id === stageId ? { ...s, targetSlaDays: validDays } : s))
    );
    setSaveSuccess(false);
  };

  // Handle warning threshold update
  const handleUpdateThreshold = (stageId: WorkflowStage, threshold: number) => {
    setWorkingStages((prev) =>
      prev.map((s) => (s.id === stageId ? { ...s, warningThresholdPercentage: threshold } : s))
    );
    setSaveSuccess(false);
  };

  // Handle escalation notes update
  const handleUpdateNotes = (stageId: WorkflowStage, notes: string) => {
    setWorkingStages((prev) =>
      prev.map((s) => (s.id === stageId ? { ...s, escalationNotes: notes } : s))
    );
    setSaveSuccess(false);
  };

  // Apply a Preset
  const handleApplyPreset = (presetKey: keyof typeof SLA_PRESETS) => {
    const preset = SLA_PRESETS[presetKey];
    if (!preset) return;

    setWorkingStages((prev) =>
      prev.map((s) => ({
        ...s,
        targetSlaDays: preset.stages[s.id] ?? s.targetSlaDays,
      }))
    );
    setSaveSuccess(false);
  };

  // Reset Single Stage to Factory Baseline
  const handleResetSingleStage = (stageId: WorkflowStage) => {
    const baseline = WORKFLOW_STAGES.find((s) => s.id === stageId);
    if (!baseline) return;
    setWorkingStages((prev) =>
      prev.map((s) => (s.id === stageId ? { ...s, targetSlaDays: baseline.targetSlaDays, warningThresholdPercentage: 75 } : s))
    );
    setSaveSuccess(false);
  };

  // Reset All to Factory Baseline
  const handleResetAllToBaseline = () => {
    if (window.confirm('Reset all 15 workflow stages to standard baseline SLA turnaround targets?')) {
      setWorkingStages(WORKFLOW_STAGES);
      setSaveSuccess(false);
    }
  };

  // Batch Adjust
  const handleBatchAdjust = (deltaDays: number) => {
    setWorkingStages((prev) =>
      prev.map((s) => {
        if (s.id === 'DEAL_CLOSED') return s;
        // If filtered, only adjust filtered stages
        const isFiltered = filteredStages.some((fs) => fs.id === s.id);
        if (!isFiltered) return s;
        return {
          ...s,
          targetSlaDays: Math.max(1, s.targetSlaDays + deltaDays),
        };
      })
    );
    setSaveSuccess(false);
  };

  // Export SLA Configuration as JSON
  const handleExportJson = () => {
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      totalE2eDays,
      stages: workingStages.map((s) => ({
        id: s.id,
        index: s.index,
        label: s.label,
        shortLabel: s.shortLabel,
        primaryActor: s.primaryActor,
        targetSlaDays: s.targetSlaDays,
        warningThresholdPercentage: s.warningThresholdPercentage || 75,
        escalationNotes: s.escalationNotes || '',
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `workflow-sla-policy-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export SLA Configuration as CSV
  const handleExportCsv = () => {
    const headers = [
      'Stage Index',
      'Stage ID',
      'Stage Name',
      'Primary Actor',
      'Target SLA (Days)',
      'Warning Threshold (%)',
      'Escalation Notes',
    ];

    const rows = workingStages.map((s) => [
      s.index,
      `"${s.id}"`,
      `"${s.label.replace(/"/g, '""')}"`,
      `"${s.actorLabel.replace(/"/g, '""')}"`,
      s.targetSlaDays,
      s.warningThresholdPercentage || 75,
      `"${(s.escalationNotes || s.description || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `workflow-target-slas-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON SLA policy
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.stages)) {
          const importedMap = parsed.stages.reduce((acc: any, s: any) => {
            acc[s.id] = s;
            return acc;
          }, {});

          setWorkingStages((prev) =>
            prev.map((s) => {
              const imp = importedMap[s.id];
              if (imp) {
                return {
                  ...s,
                  targetSlaDays: typeof imp.targetSlaDays === 'number' ? imp.targetSlaDays : s.targetSlaDays,
                  warningThresholdPercentage: typeof imp.warningThresholdPercentage === 'number' ? imp.warningThresholdPercentage : 75,
                  escalationNotes: imp.escalationNotes || s.escalationNotes,
                };
              }
              return s;
            })
          );
          alert('SLA policy successfully imported!');
        } else {
          alert('Invalid SLA JSON configuration format.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Save changes
  const handleSave = () => {
    onSaveStageDefinitions(workingStages);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* MODAL HEADER */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0 border-b border-slate-800">
          <div className="flex items-start space-x-3.5">
            <div className="p-3 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl shadow-xs shrink-0 mt-0.5">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center flex-wrap gap-2.5">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Target SLA & Workflow Governance Admin
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center space-x-1">
                  <Sliders className="w-3 h-3 text-blue-400" />
                  <span>15 Stages Configurable</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Define, enforce, and simulate target turnaround Service Level Agreements (SLAs), warning alert thresholds, and escalation triggers across all 15 lifecycle workflow stages.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
            {/* Export Menu */}
            <div className="flex items-center space-x-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={handleExportJson}
                title="Export SLA Policy as JSON"
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/60 rounded-lg transition-colors text-xs font-medium flex items-center space-x-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden md:inline">JSON</span>
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                title="Export SLAs as CSV"
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/60 rounded-lg transition-colors text-xs font-medium flex items-center space-x-1 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline">CSV</span>
              </button>
              <label
                title="Import SLA Policy JSON"
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/60 rounded-lg transition-colors text-xs font-medium flex items-center space-x-1 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden md:inline">Import</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJson}
                  className="hidden"
                />
              </label>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* METRICS & PRESET BANNER */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-stretch">
            
            {/* Metric 1: Total End-to-End SLA */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Total End-to-End SLA
                </span>
                <div className="flex items-baseline space-x-2 mt-0.5">
                  <span className="text-2xl font-black text-slate-900">
                    {totalE2eDays}
                  </span>
                  <span className="text-xs font-medium text-slate-500">Business Days</span>
                </div>
                <span className="text-[10px] text-slate-400">
                  Baseline: {baselineE2eDays} Days ({totalE2eDays > baselineE2eDays ? `+${totalE2eDays - baselineE2eDays}d` : `${totalE2eDays - baselineE2eDays}d`})
                </span>
              </div>
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            {/* Metric 2: Live Pipeline Impact (On Track) */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
                  On-Track Deals
                </span>
                <div className="flex items-baseline space-x-2 mt-0.5">
                  <span className="text-2xl font-black text-emerald-700">
                    {pipelineImpact.onTrack}
                  </span>
                  <span className="text-xs font-medium text-slate-500">of {pipelineImpact.total} Active</span>
                </div>
                <span className="text-[10px] text-emerald-600">
                  {pipelineImpact.total > 0 ? `${Math.round((pipelineImpact.onTrack / pipelineImpact.total) * 100)}% SLA Compliance` : 'No active deals'}
                </span>
              </div>
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            {/* Metric 3: Live Pipeline Warning & Overdue */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
                  At Risk / Overdue
                </span>
                <div className="flex items-baseline space-x-2 mt-0.5">
                  <span className="text-2xl font-black text-amber-700">
                    {pipelineImpact.warning + pipelineImpact.critical}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    ({pipelineImpact.critical} Overdue)
                  </span>
                </div>
                <span className="text-[10px] text-rose-600">
                  {pipelineImpact.critical > 0 ? 'Requires escalation' : 'No critical breaches'}
                </span>
              </div>
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>

            {/* Quick Presets Selector */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                  Quick Presets
                </span>
                <span className="text-[10px] text-indigo-600 font-medium flex items-center space-x-0.5">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Templates</span>
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('STANDARD')}
                  title={SLA_PRESETS.STANDARD.description}
                  className="px-2 py-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition-colors text-center cursor-pointer"
                >
                  Standard (66d)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('FAST_TRACK')}
                  title={SLA_PRESETS.FAST_TRACK.description}
                  className="px-2 py-1.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition-colors text-center cursor-pointer"
                >
                  Fast-Track (32d)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('STRATEGIC_LARGE')}
                  title={SLA_PRESETS.STRATEGIC_LARGE.description}
                  className="px-2 py-1.5 bg-slate-50 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition-colors text-center cursor-pointer"
                >
                  Strategic (95d)
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* TOOLBAR: TABS & FILTERS */}
        <div className="bg-white border-b border-slate-200 px-5 py-3 shrink-0 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Main Navigation Tabs */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setActiveTab('STAGES')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                activeTab === 'STAGES'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Configure Stage SLAs ({workingStages.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('SIMULATION')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                activeTab === 'SIMULATION'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-blue-500" />
              <span>Live Pipeline Impact ({opportunities.length} Deals)</span>
            </button>
          </div>

          {/* Filtering and Batch Tools */}
          {activeTab === 'STAGES' && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Phase Filter */}
              <select
                value={selectedPhaseFilter}
                onChange={(e) => setSelectedPhaseFilter(e.target.value as any)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">All Phases (15 Stages)</option>
                {PHASES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.count})
                  </option>
                ))}
              </select>

              {/* Actor Filter */}
              <select
                value={selectedActorFilter}
                onChange={(e) => setSelectedActorFilter(e.target.value as any)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">All Primary Roles</option>
                <option value="SALES">Sales Executive</option>
                <option value="ARCHITECTURE">Solution Architecture / BU</option>
                <option value="CONTRACTS">Contracts & Legal</option>
                <option value="FINANCE">Finance & Deal Desk</option>
                <option value="PMO">PMO & Delivery</option>
              </select>

              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search stages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-36 sm:w-44"
                />
              </div>

              {/* Batch Steppers */}
              <div className="flex items-center space-x-1 border-l border-slate-200 pl-2">
                <button
                  type="button"
                  onClick={() => handleBatchAdjust(1)}
                  title="Add +1 Business Day to filtered stages"
                  className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                >
                  +1d
                </button>
                <button
                  type="button"
                  onClick={() => handleBatchAdjust(-1)}
                  title="Subtract -1 Business Day from filtered stages"
                  className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                >
                  -1d
                </button>
              </div>
            </div>
          )}
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-100/60">
          {activeTab === 'STAGES' ? (
            <div className="space-y-3">
              {filteredStages.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-8">
                  <Sliders className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-700">No workflow stages match the filter</p>
                  <p className="text-xs text-slate-400 mt-1">Try resetting the phase or role search criteria.</p>
                </div>
              ) : (
                filteredStages.map((stage) => {
                  const percentOfTotal = totalE2eDays > 0 ? Math.round((stage.targetSlaDays / totalE2eDays) * 100) : 0;
                  const isDealClosed = stage.id === 'DEAL_CLOSED';
                  const activeDealsInStage = opportunities.filter((o) => o.currentStage === stage.id);
                  const isExpandedNotes = expandedNotesStage === stage.id;
                  const warningPct = stage.warningThresholdPercentage || 75;

                  return (
                    <div
                      key={stage.id}
                      className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-2xs transition-all overflow-hidden"
                    >
                      <div className="p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        
                        {/* STAGE INFO */}
                        <div className="flex items-start space-x-3 min-w-0 flex-1">
                          {/* Stage Number Badge */}
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ${
                            stage.index <= 3
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : stage.index <= 6
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : stage.index <= 10
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            #{stage.index}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center flex-wrap gap-2">
                              <span className="text-sm font-bold text-slate-900 tracking-tight">
                                {stage.label}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                {stage.primaryActor}
                              </span>
                              {activeDealsInStage.length > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center space-x-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                                  <span>{activeDealsInStage.length} Active Deal{activeDealsInStage.length > 1 ? 's' : ''}</span>
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                              {stage.description}
                            </p>
                          </div>
                        </div>

                        {/* SLA CONTROLS */}
                        <div className="flex flex-wrap items-center gap-3 shrink-0 self-end lg:self-center">
                          
                          {/* Stepper / Input */}
                          <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-200 flex items-center space-x-2">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-1">
                              Target SLA:
                            </span>

                            <button
                              type="button"
                              disabled={isDealClosed || stage.targetSlaDays <= 1}
                              onClick={() => handleUpdateStageSla(stage.id, stage.targetSlaDays - 1)}
                              className="w-7 h-7 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center font-bold text-slate-700 cursor-pointer transition-colors shadow-2xs"
                            >
                              -
                            </button>

                            <div className="flex items-center">
                              <input
                                type="number"
                                min={isDealClosed ? 0 : 1}
                                max={180}
                                disabled={isDealClosed}
                                value={stage.targetSlaDays}
                                onChange={(e) => handleUpdateStageSla(stage.id, parseInt(e.target.value) || 0)}
                                className="w-14 text-center font-mono font-black text-sm text-slate-900 bg-white border border-slate-300 rounded-lg py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
                              />
                              <span className="text-xs font-semibold text-slate-600 ml-1.5">
                                Days
                              </span>
                            </div>

                            <button
                              type="button"
                              disabled={isDealClosed}
                              onClick={() => handleUpdateStageSla(stage.id, stage.targetSlaDays + 1)}
                              className="w-7 h-7 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center font-bold text-slate-700 cursor-pointer transition-colors shadow-2xs"
                            >
                              +
                            </button>
                          </div>

                          {/* Warning Alert Threshold */}
                          <div className="flex items-center space-x-1.5 text-xs bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                            <span className="text-slate-500 text-[11px] font-semibold">Alert at:</span>
                            <select
                              value={warningPct}
                              disabled={isDealClosed}
                              onChange={(e) => handleUpdateThreshold(stage.id, parseInt(e.target.value) || 75)}
                              className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 font-bold text-slate-700 text-xs focus:outline-none cursor-pointer disabled:opacity-40"
                            >
                              <option value={50}>50% SLA</option>
                              <option value={65}>65% SLA</option>
                              <option value={75}>75% SLA</option>
                              <option value={80}>80% SLA</option>
                              <option value={90}>90% SLA</option>
                            </select>
                          </div>

                          {/* Relative Weight Badge */}
                          <span className="text-[11px] font-mono text-slate-400 px-2 py-1 bg-slate-50 rounded-lg border border-slate-200 hidden sm:inline-block">
                            {percentOfTotal}% of total
                          </span>

                          {/* Stage Notes Toggle */}
                          <button
                            type="button"
                            onClick={() => setExpandedNotesStage(isExpandedNotes ? null : stage.id)}
                            title="Edit escalation guidelines"
                            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                              isExpandedNotes || Boolean(stage.escalationNotes)
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-700'
                            }`}
                          >
                            <Info className="w-4 h-4" />
                          </button>

                          {/* Reset Single Stage */}
                          <button
                            type="button"
                            onClick={() => handleResetSingleStage(stage.id)}
                            title="Reset this stage to factory baseline SLA"
                            className="p-2 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-lg transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>

                        </div>
                      </div>

                      {/* Expandable Stage Notes & Escalation Guidelines */}
                      {isExpandedNotes && (
                        <div className="bg-slate-50 p-3.5 border-t border-slate-200 flex flex-col sm:flex-row items-start gap-3">
                          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 shrink-0 pt-1">
                            <ShieldAlert className="w-4 h-4 text-indigo-600" />
                            <span>Escalation & SLA Notes:</span>
                          </div>
                          <div className="flex-1 w-full">
                            <input
                              type="text"
                              placeholder="e.g. Escalate to BU Lead if Solution Design exceeds 5 business days without PR approval."
                              value={stage.escalationNotes || ''}
                              onChange={(e) => handleUpdateNotes(stage.id, e.target.value)}
                              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 placeholder-slate-400"
                            />
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              Primary Owner: <strong className="text-slate-600">{stage.actorLabel}</strong> • Stage ID: <code className="font-mono">{stage.id}</code>
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* SIMULATION / ACTIVE DEALS IMPACT VIEW */
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Live Deal SLA Status Simulation
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Evaluates all active deals against the modified Target SLA configuration in real-time.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {opportunities.length} Pipeline Deals Analyzed
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200">
                      <th className="py-3 px-4">Opportunity</th>
                      <th className="py-3 px-4">Current Stage</th>
                      <th className="py-3 px-4 text-center">Days in Stage</th>
                      <th className="py-3 px-4 text-center">Configured SLA</th>
                      <th className="py-3 px-4 text-center">SLA Health Status</th>
                      <th className="py-3 px-4 text-right">Variance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {opportunities.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                          No opportunities found in the pipeline.
                        </td>
                      </tr>
                    ) : (
                      opportunities.map((opp) => {
                        const sla = getSlaStatus(opp, workingStageMap);
                        const isClosed = opp.currentStage === 'DEAL_CLOSED';
                        const stageObj = workingStageMap[opp.currentStage] || STAGE_MAP[opp.currentStage];
                        const diff = sla.days - sla.targetDays;

                        return (
                          <tr key={opp.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{opp.title}</div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                {opp.trackingCode} • {opp.clientName}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-semibold text-slate-800 block">
                                {stageObj?.label || opp.currentStage}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Owner: {stageObj?.actorLabel || 'Assigned Lead'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                              {sla.days} Days
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-bold text-blue-600">
                              {isClosed ? '—' : `${sla.targetDays} Days`}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {isClosed ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                                  Closed / Realized
                                </span>
                              ) : sla.isOverdue ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  <AlertCircle className="w-3 h-3 mr-1 text-rose-600" />
                                  Overdue ({sla.days}d / {sla.targetDays}d)
                                </span>
                              ) : sla.status === 'WARNING' ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" />
                                  Approaching SLA
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                                  On Track
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-xs">
                              {isClosed ? (
                                <span className="text-slate-400">—</span>
                              ) : diff > 0 ? (
                                <span className="text-rose-600 font-bold">+{diff}d breach</span>
                              ) : diff === 0 ? (
                                <span className="text-amber-600 font-bold">Due today</span>
                              ) : (
                                <span className="text-emerald-600 font-bold">{Math.abs(diff)}d remaining</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 border-t border-slate-800">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleResetAllToBaseline}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Factory Defaults</span>
            </button>
            {saveSuccess && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1 animate-in fade-in">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Target SLAs applied across system!</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel / Close
            </button>
            <button
              id="btn-save-target-slas"
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/25 flex items-center space-x-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save & Enforce SLA Policy</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
