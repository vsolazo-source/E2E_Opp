import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Layers,
  ArrowRight,
  User,
  ShieldCheck,
  RefreshCw,
  FileText,
  Briefcase,
  Sparkles,
  ChevronRight,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Opportunity, StakeholderRole, ResourceMember, FormSelectorsConfig, ParallelFinanceData, ParallelPmoData, WorkflowStage } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { ensureValidFormSelectors } from '../data/mockFormSelectors';

interface ParallelExecutionSectionProps {
  opportunity: Opportunity;
  currentRole: StakeholderRole;
  resources?: ResourceMember[];
  formSelectors?: FormSelectorsConfig;
  comments: string;
  setComments: (c: string) => void;
  onUpdateOpportunity: (updated: Opportunity) => void;
  onAdvanceToCwcDelivery: (actionName: string, comments: string, extraUpdates?: Partial<Opportunity>) => void;
}

export const ParallelExecutionSection: React.FC<ParallelExecutionSectionProps> = ({
  opportunity,
  currentRole,
  resources = [],
  formSelectors,
  comments,
  setComments,
  onUpdateOpportunity,
  onAdvanceToCwcDelivery,
}) => {
  const safeFormSelectors = useMemo(() => ensureValidFormSelectors(formSelectors), [formSelectors]);
  const activeDivisions = useMemo(
    () => (safeFormSelectors.divisions || []).filter((d) => d.isActive !== false),
    [safeFormSelectors]
  );
  const activeDepartments = useMemo(
    () => (safeFormSelectors.departments || []).filter((d) => d.isActive !== false),
    [safeFormSelectors]
  );

  // Track A states & fallbacks
  const financeData = opportunity.parallelFinance;
  const isFinanceCompleted = !!financeData?.isFinanceCompleted;
  const trackAStartTriggerDate = financeData?.trackAStartTriggerDate || opportunity.stageEnteredAt || opportunity.updatedAt || new Date().toISOString();
  const targetSlaDaysA = financeData?.targetSlaDays || 5;

  // Track A fields
  const [budgetCode, setBudgetCode] = useState(financeData?.budgetCode || '');
  const [contractCode, setContractCode] = useState(
    financeData?.contractCode ||
    opportunity.contractDetails?.contractNumber ||
    ((opportunity.trackingCode || '').includes('-OPP-')
      ? (opportunity.trackingCode || '').replace('-OPP-', '-CTR-')
      : `CTR-${(opportunity.trackingCode || opportunity.id || '').replace(/^OPP-/, '')}`)
  );
  const [contractStartDate, setContractStartDate] = useState(financeData?.contractStartDate || '');
  const [contractEndDate, setContractEndDate] = useState(financeData?.contractEndDate || '');
  const [contractRenewalType, setContractRenewalType] = useState<'RECURRING' | 'NON_RECURRING'>(
    financeData?.contractRenewalType || 'NON_RECURRING'
  );
  const [contractOwner, setContractOwner] = useState(
    financeData?.contractOwner ||
    opportunity.contractDetails?.contractsSpecialist ||
    opportunity.salesLead ||
    'David Cho'
  );
  const [tcv, setTcv] = useState<number>(financeData?.tcv || opportunity.dealValue || 0);
  const [billingFrequency, setBillingFrequency] = useState<ParallelFinanceData['billingFrequency']>(
    financeData?.billingFrequency || 'MILESTONE'
  );

  // Track B states & fallbacks
  const pmoData = opportunity.parallelPmo;
  const isDeliveryCompleted = !!pmoData?.isDeliveryCompleted;
  const trackBStartTriggerDate = pmoData?.trackBStartTriggerDate || opportunity.stageEnteredAt || opportunity.updatedAt || new Date().toISOString();

  // Track B fields
  const [division, setDivision] = useState(pmoData?.division || opportunity.division || activeDivisions[0]?.value || 'Digital Applications & AI Solutions');
  const [businessUnit, setBusinessUnit] = useState(pmoData?.businessUnit || opportunity.businessUnit || activeDepartments[0]?.value || 'Enterprise AI & Data Solutions');
  const [isProject, setIsProject] = useState<boolean>(pmoData?.isProject !== false);

  // If a project
  const [projectManager, setProjectManager] = useState(pmoData?.projectManager || 'Samantha Reynolds, PMP');
  const [progressPercentage, setProgressPercentage] = useState<number>(pmoData?.progressPercentage || 0);
  const [deliveryHealth, setDeliveryHealth] = useState<ParallelPmoData['deliveryHealth']>(pmoData?.deliveryHealth || 'ON_TRACK');
  const [projectStartDate, setProjectStartDate] = useState(pmoData?.projectStartDate || '');
  const [targetEndDate, setTargetEndDate] = useState(pmoData?.targetEndDate || '');
  const [actualGoLiveDate, setActualGoLiveDate] = useState(pmoData?.actualGoLiveDate || '');
  const [actualClosureDate, setActualClosureDate] = useState(pmoData?.actualClosureDate || '');

  // If not a project
  const [businessUnitOwner, setBusinessUnitOwner] = useState(pmoData?.businessUnitOwner || pmoData?.buHead || 'Elena Rostova (VP Digital Solutions)');
  const [deliveryClosureDate, setDeliveryClosureDate] = useState(pmoData?.deliveryClosureDate || '');
  const [notesOrDescription, setNotesOrDescription] = useState(pmoData?.notesOrDescription || pmoData?.deliveryNotes || '');

  // Computed days for Track B (Project SLA calculation)
  const computedDays = useMemo(() => {
    if (isProject) {
      if (projectStartDate && targetEndDate) {
        const start = new Date(projectStartDate).getTime();
        const end = new Date(targetEndDate).getTime();
        const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
        return Math.max(1, diff);
      }
      return pmoData?.computedDays || 30;
    } else {
      if (deliveryClosureDate && trackBStartTriggerDate) {
        const start = new Date(trackBStartTriggerDate).getTime();
        const end = new Date(deliveryClosureDate).getTime();
        const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
        return Math.max(1, diff);
      }
      return pmoData?.computedDays || 14;
    }
  }, [isProject, projectStartDate, targetEndDate, deliveryClosureDate, trackBStartTriggerDate, pmoData?.computedDays]);

  const targetSlaDaysB = computedDays;

  // Track A SLA calculation
  const nowMs = Date.now();
  const triggerMsA = new Date(trackAStartTriggerDate).getTime();
  const elapsedDaysA = Math.max(0, Math.floor((nowMs - triggerMsA) / (1000 * 60 * 60 * 24)));
  const remainingDaysA = targetSlaDaysA - elapsedDaysA;
  const isOverdueA = !isFinanceCompleted && remainingDaysA < 0;

  // Track B SLA calculation
  const triggerMsB = isProject && projectStartDate ? new Date(projectStartDate).getTime() : new Date(trackBStartTriggerDate).getTime();
  const elapsedDaysB = Math.max(0, Math.floor((nowMs - triggerMsB) / (1000 * 60 * 60 * 24)));
  const remainingDaysB = targetSlaDaysB - elapsedDaysB;
  const isOverdueB = !isDeliveryCompleted && remainingDaysB < 0;

  // Candidate lists for dropdowns
  const contractOwnerOptions = useMemo(() => {
    const list = resources.map((r) => `${r.name} (${r.role || r.department})`);
    const defaults = [
      'David Cho (Finance Lead / Controller)',
      'Sarah Jenkins (Senior Contracts Specialist)',
      'Marcus Sterling (Principal Enterprise AE)',
      'Jessica Chen (Commercial Director)',
      'Arthur Pendelton (EVP, Enterprise Services)',
    ];
    return Array.from(new Set([...list, ...defaults]));
  }, [resources]);

  const projectManagerOptions = useMemo(() => {
    const pmResources = resources
      .filter((r) => (r.role || '').toLowerCase().includes('project') || (r.role || '').toLowerCase().includes('scrum') || (r.department || '').toLowerCase().includes('pmo'))
      .map((r) => `${r.name} (${r.role})`);
    const defaults = [
      'Samantha Reynolds, PMP (Lead PM)',
      'David Kim, CSM (Senior Agile Project Manager)',
      'Elena Cruz, PMP (Technical Delivery Manager)',
      'Robert Sterling (Infrastructure Project Lead)',
    ];
    return Array.from(new Set([...pmResources, ...defaults]));
  }, [resources]);

  const buOwnerOptions = useMemo(() => {
    const buResources = resources
      .filter((r) => (r.role || '').toLowerCase().includes('director') || (r.role || '').toLowerCase().includes('vp') || (r.role || '').toLowerCase().includes('head'))
      .map((r) => `${r.name} (${r.role})`);
    const defaults = [
      'Elena Rostova (VP Digital Solutions)',
      'Carlos Vance (Director, Enterprise AI & Cloud)',
      'Arthur Pendelton (EVP, Enterprise Services)',
      'Patricia Gomez (Head of Managed Services)',
    ];
    return Array.from(new Set([...buResources, ...defaults]));
  }, [resources]);

  // Handle Track A Save & Finance Setup Completed
  const handleCompleteFinanceSetup = () => {
    const now = new Date().toISOString();
    const updatedFinance: ParallelFinanceData = {
      ...opportunity.parallelFinance,
      budgetCode,
      contractCode,
      tcv,
      contractStartDate,
      contractEndDate,
      contractRenewalType,
      contractOwner,
      billingFrequency,
      isConfigured: true,
      isFinanceCompleted: true,
      financeCompletedAt: now,
      trackAStartTriggerDate,
      targetSlaDays: targetSlaDaysA,
    };

    const isTrackBAlreadyFinished = isDeliveryCompleted;

    if (!isTrackBAlreadyFinished) {
      // Track A finished FIRST -> Hold stage at 12, add history & note
      const historyEntry = {
        id: `hist-track-a-complete-${Date.now()}`,
        timestamp: now,
        stage: 'PARALLEL_EXECUTION' as WorkflowStage,
        actorName: contractOwner || 'Finance Controller',
        actorRole: 'FINANCE' as StakeholderRole,
        action: 'Finance Set-up Completed (Track A Finished, Track B Ongoing)',
        notes: `Budget Code: ${budgetCode || 'N/A'}, Contract Code: ${contractCode || 'N/A'}, Owner: ${contractOwner}. Workflow held in Stage 12 while Track B finishes.`,
      };

      onUpdateOpportunity({
        ...opportunity,
        parallelFinance: updatedFinance,
        contractDetails: {
          ...opportunity.contractDetails,
          contractNumber: contractCode,
        },
        history: [...(opportunity.history || []), historyEntry],
      });

      confetti({ particleCount: 30, spread: 45, origin: { y: 0.6 } });
    } else {
      // Track A finished SECOND -> Both tracks are finished! Advance to Stage 13 CWC_DELIVERY
      const oppTracking = opportunity.trackingCode || opportunity.id || 'OPP-001';
      const extraUpdates: Partial<Opportunity> = {
        parallelFinance: updatedFinance,
        contractDetails: {
          ...opportunity.contractDetails,
          contractNumber: contractCode,
        },
        cwcRecord: {
          ...opportunity.cwcRecord,
          cwcNumber:
            opportunity.cwcRecord?.cwcNumber ||
            (oppTracking.includes('-OPP-')
              ? oppTracking.replace('-OPP-', '-CWC-')
              : `CWC-${new Date().getFullYear()}-${oppTracking.replace(/^OPP-/, '')}`),
          issuedDate: now.split('T')[0],
          stage13TriggerDate: now.split('T')[0],
          cwcRoutedBy: projectManager || 'Samantha Reynolds, PMP',
          pmoLeadSigner: projectManager || 'Samantha Reynolds, PMP',
          originalSlaDays: 5,
          acknowledgementSlaDays: 2,
          extendedSlaDays: 0,
          slaExtendedCount: 0,
          slaExtensionHistory: [],
          clientApproverName: opportunity.clientContactName,
          acceptanceRemarks: 'All deliverables validated against contract and SOW specifications.',
          isAcceptedByClient: false,
        },
      };

      onAdvanceToCwcDelivery(
        'Finance Set-up Completed (All Parallel Tracks Complete)',
        comments || 'Finance budget and contract setup verified. With Delivery track already completed, advancing to Certificate of Work Completion (CWC).',
        extraUpdates
      );
    }
  };

  // Handle Track B Save & Delivery Completed
  const handleCompleteDelivery = () => {
    const now = new Date().toISOString();
    const updatedPmo: ParallelPmoData = {
      ...opportunity.parallelPmo,
      division,
      businessUnit,
      isProject,
      projectManager: isProject ? projectManager : undefined,
      progressPercentage: 100,
      deliveryHealth: isProject ? deliveryHealth : 'ON_TRACK',
      projectStartDate: isProject ? projectStartDate : undefined,
      targetEndDate: isProject ? targetEndDate : undefined,
      actualGoLiveDate: isProject ? actualGoLiveDate : undefined,
      actualClosureDate: isProject ? actualClosureDate : undefined,
      businessUnitOwner: !isProject ? businessUnitOwner : undefined,
      deliveryClosureDate: !isProject ? deliveryClosureDate : undefined,
      notesOrDescription: !isProject ? notesOrDescription : undefined,
      computedDays,
      targetSlaDays: computedDays,
      isKickoffCompleted: true,
      isDeliveryCompleted: true,
      deliveryCompletedAt: now,
      trackBStartTriggerDate,
      milestones: opportunity.parallelPmo?.milestones || [],
    };

    const isTrackAAlreadyFinished = isFinanceCompleted;

    if (!isTrackAAlreadyFinished) {
      // Track B finished FIRST -> Hold stage at 12, add history & note
      const historyEntry = {
        id: `hist-track-b-complete-${Date.now()}`,
        timestamp: now,
        stage: 'PARALLEL_EXECUTION' as WorkflowStage,
        actorName: (isProject ? projectManager : businessUnitOwner) || 'PMO / Delivery Head',
        actorRole: 'PMO' as StakeholderRole,
        action: 'Delivery Completed (Track B Finished, Track A Ongoing)',
        notes: `${isProject ? 'Project Delivery' : 'Service Delivery'} closed at 100%. Division: ${division}, BU: ${businessUnit}. Workflow held in Stage 12 while Track A finishes.`,
      };

      onUpdateOpportunity({
        ...opportunity,
        parallelPmo: updatedPmo,
        history: [...(opportunity.history || []), historyEntry],
      });

      confetti({ particleCount: 30, spread: 45, origin: { y: 0.6 } });
    } else {
      // Track B finished SECOND -> Both tracks are finished! Advance to Stage 13 CWC_DELIVERY
      const oppTracking = opportunity.trackingCode || opportunity.id || 'OPP-001';
      const extraUpdates: Partial<Opportunity> = {
        parallelPmo: updatedPmo,
        cwcRecord: {
          ...opportunity.cwcRecord,
          cwcNumber:
            opportunity.cwcRecord?.cwcNumber ||
            (oppTracking.includes('-OPP-')
              ? oppTracking.replace('-OPP-', '-CWC-')
              : `CWC-${new Date().getFullYear()}-${oppTracking.replace(/^OPP-/, '')}`),
          issuedDate: now.split('T')[0],
          stage13TriggerDate: now.split('T')[0],
          cwcRoutedBy: (isProject ? projectManager : businessUnitOwner) || 'Samantha Reynolds, PMP',
          pmoLeadSigner: (isProject ? projectManager : businessUnitOwner) || 'Samantha Reynolds, PMP',
          originalSlaDays: 5,
          acknowledgementSlaDays: 2,
          extendedSlaDays: 0,
          slaExtendedCount: 0,
          slaExtensionHistory: [],
          clientApproverName: opportunity.clientContactName,
          acceptanceRemarks: isProject
            ? 'Project delivery deliverables validated against SOW specifications.'
            : (notesOrDescription || 'Operational service delivery validated and closed.'),
          isAcceptedByClient: false,
        },
      };

      onAdvanceToCwcDelivery(
        'Delivery Completed (All Parallel Tracks Complete)',
        comments || 'PMO / BU Delivery completed. With Finance setup already completed, advancing to Certificate of Work Completion (CWC).',
        extraUpdates
      );
    }
  };

  // Re-open Track handlers for convenience
  const handleReopenFinance = () => {
    onUpdateOpportunity({
      ...opportunity,
      parallelFinance: {
        ...opportunity.parallelFinance,
        isFinanceCompleted: false,
        financeCompletedAt: undefined,
      },
    });
  };

  const handleReopenDelivery = () => {
    onUpdateOpportunity({
      ...opportunity,
      parallelPmo: {
        ...opportunity.parallelPmo,
        isDeliveryCompleted: false,
        deliveryCompletedAt: undefined,
      },
    });
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Coordination Header: Dual Track SLA & Execution Status */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-xl p-4 text-white border border-slate-700 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Stage 12 • Dual-Track SLA Orchestration
              </span>
              <span className="text-slate-400 text-xs font-mono">
                Triggered: {formatDate(trackAStartTriggerDate)}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white mt-1">
              Parallel Execution: Track A (Finance) & Track B (PMO / BU Delivery)
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <div className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center space-x-1.5 ${
              isFinanceCompleted && isDeliveryCompleted
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span>
                {isFinanceCompleted && isDeliveryCompleted
                  ? 'Both Tracks Completed 🎉'
                  : isFinanceCompleted
                  ? 'Track A Done • Track B Ongoing'
                  : isDeliveryCompleted
                  ? 'Track B Done • Track A Ongoing'
                  : 'Both Tracks In Progress'}
              </span>
            </div>
          </div>
        </div>

        {/* Status Callout Banner when one track is completed first */}
        {isFinanceCompleted && !isDeliveryCompleted && (
          <div className="bg-amber-500/15 border border-amber-400/40 rounded-lg p-2.5 flex items-start space-x-2 text-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong className="text-white font-semibold">Track A (Finance Setup) Completed!</strong> Track B (PMO / BU Delivery Execution) is currently ongoing. The workflow is held in Stage 12 until Track B completes via the "Delivery Completed" button.
            </div>
          </div>
        )}

        {!isFinanceCompleted && isDeliveryCompleted && (
          <div className="bg-cyan-500/15 border border-cyan-400/40 rounded-lg p-2.5 flex items-start space-x-2 text-cyan-200">
            <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong className="text-white font-semibold">Track B (Delivery Execution) Completed!</strong> Track A (Finance Budget & Contract Setup) is currently ongoing. The workflow is held in Stage 12 until Track A completes via the "Finance Set-up Completed" button.
            </div>
          </div>
        )}

        {/* Dual SLA Progress Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 text-[11px]">
          {/* Track A SLA Summary */}
          <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700">
            <div className="flex items-center justify-between font-semibold">
              <span className="text-purple-300 flex items-center space-x-1">
                <DollarSign className="w-3.5 h-3.5 text-purple-400" />
                <span>Track A: Finance Setup SLA</span>
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                isFinanceCompleted
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : isOverdueA
                  ? 'bg-rose-500/20 text-rose-300'
                  : 'bg-amber-500/20 text-amber-300'
              }`}>
                {isFinanceCompleted ? 'SLA Stopped ✅' : isOverdueA ? 'SLA Overdue' : 'SLA Active'}
              </span>
            </div>
            <div className="text-slate-400 text-[10px] mt-1 flex items-center justify-between">
              <span>Target: {targetSlaDaysA} days</span>
              <span>
                {isFinanceCompleted
                  ? `Completed at: ${formatDate(financeData?.financeCompletedAt)}`
                  : remainingDaysA >= 0
                  ? `${remainingDaysA} days remaining`
                  : `${Math.abs(remainingDaysA)} days overdue`}
              </span>
            </div>
          </div>

          {/* Track B SLA Summary */}
          <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700">
            <div className="flex items-center justify-between font-semibold">
              <span className="text-cyan-300 flex items-center space-x-1">
                <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
                <span>Track B: Delivery SLA (Computed)</span>
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                isDeliveryCompleted
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : isOverdueB
                  ? 'bg-rose-500/20 text-rose-300'
                  : 'bg-cyan-500/20 text-cyan-300'
              }`}>
                {isDeliveryCompleted ? 'SLA Stopped ✅' : isOverdueB ? 'SLA Overdue' : 'SLA Active'}
              </span>
            </div>
            <div className="text-slate-400 text-[10px] mt-1 flex items-center justify-between">
              <span>Target: {targetSlaDaysB} days ({isProject ? 'From Project Dates' : 'Standard Closure'})</span>
              <span>
                {isDeliveryCompleted
                  ? `Completed at: ${formatDate(pmoData?.deliveryCompletedAt)}`
                  : remainingDaysB >= 0
                  ? `${remainingDaysB} days remaining`
                  : `${Math.abs(remainingDaysB)} days overdue`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Track A (Left) & Track B (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* ========================================================================= */}
        {/* TRACK A: FINANCE BUDGET & CONTRACT SETUP                                   */}
        {/* ========================================================================= */}
        <div className={`bg-white rounded-xl border p-4 space-y-3.5 transition-all ${
          isFinanceCompleted ? 'border-purple-300 shadow-xs ring-1 ring-purple-200' : 'border-purple-200'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Track A: Finance Setup</h4>
                <p className="text-[10px] text-slate-500">Budget allocation, contract governance & billing terms</p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                isFinanceCompleted
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-purple-100 text-purple-800'
              }`}>
                {isFinanceCompleted ? 'Completed ✅' : 'In Progress'}
              </span>
              {isFinanceCompleted && (
                <button
                  type="button"
                  onClick={handleReopenFinance}
                  className="text-[10px] text-purple-700 hover:text-purple-900 underline font-medium"
                >
                  Edit
                </button>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-2.5">
            {/* Assigned Budget Code */}
            <div>
              <label className="block text-slate-700 font-semibold mb-0.5">Assigned Budget Code</label>
              <input
                type="text"
                value={budgetCode}
                onChange={(e) => {
                  setBudgetCode(e.target.value);
                  onUpdateOpportunity({
                    ...opportunity,
                    parallelFinance: { ...opportunity.parallelFinance, budgetCode: e.target.value },
                  });
                }}
                disabled={isFinanceCompleted}
                placeholder="e.g. BDG-2026-AI-09"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>

            {/* Contract Code / Reference # */}
            <div>
              <label className="block text-slate-700 font-semibold mb-0.5">Contract Code / Reference #</label>
              <input
                type="text"
                value={contractCode}
                onChange={(e) => {
                  setContractCode(e.target.value);
                  onUpdateOpportunity({
                    ...opportunity,
                    parallelFinance: { ...opportunity.parallelFinance, contractCode: e.target.value },
                    contractDetails: { ...opportunity.contractDetails, contractNumber: e.target.value },
                  });
                }}
                disabled={isFinanceCompleted}
                placeholder="e.g. CTR-2026-001"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>

            {/* Contract Start Date & Contract End Date (Renamed per requirement) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-700 font-semibold mb-0.5 flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-purple-600" />
                  <span>Contract Start Date</span>
                </label>
                <input
                  type="date"
                  value={contractStartDate}
                  onChange={(e) => {
                    setContractStartDate(e.target.value);
                    onUpdateOpportunity({
                      ...opportunity,
                      parallelFinance: { ...opportunity.parallelFinance, contractStartDate: e.target.value },
                    });
                  }}
                  disabled={isFinanceCompleted}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-0.5 flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-purple-600" />
                  <span>Contract End Date</span>
                </label>
                <input
                  type="date"
                  value={contractEndDate}
                  onChange={(e) => {
                    setContractEndDate(e.target.value);
                    onUpdateOpportunity({
                      ...opportunity,
                      parallelFinance: { ...opportunity.parallelFinance, contractEndDate: e.target.value },
                    });
                  }}
                  disabled={isFinanceCompleted}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>
            </div>

            {/* Recurring or Non-Recurring (Renewal Indicator) */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Contract Renewal Classification
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isFinanceCompleted}
                  onClick={() => {
                    setContractRenewalType('RECURRING');
                    onUpdateOpportunity({
                      ...opportunity,
                      parallelFinance: { ...opportunity.parallelFinance, contractRenewalType: 'RECURRING' },
                    });
                  }}
                  className={`px-3 py-2 rounded-lg border text-left text-xs transition-all ${
                    contractRenewalType === 'RECURRING'
                      ? 'bg-purple-50 border-purple-400 text-purple-900 font-bold ring-1 ring-purple-300'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center space-x-1.5">
                    <RefreshCw className="w-3 h-3 text-purple-600" />
                    <span>Recurring</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5 font-normal">
                    Subject to annual / multi-year renewal
                  </span>
                </button>

                <button
                  type="button"
                  disabled={isFinanceCompleted}
                  onClick={() => {
                    setContractRenewalType('NON_RECURRING');
                    onUpdateOpportunity({
                      ...opportunity,
                      parallelFinance: { ...opportunity.parallelFinance, contractRenewalType: 'NON_RECURRING' },
                    });
                  }}
                  className={`px-3 py-2 rounded-lg border text-left text-xs transition-all ${
                    contractRenewalType === 'NON_RECURRING'
                      ? 'bg-purple-50 border-purple-400 text-purple-900 font-bold ring-1 ring-purple-300'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center space-x-1.5">
                    <FileText className="w-3 h-3 text-purple-600" />
                    <span>Non-Recurring</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5 font-normal">
                    One-off project / fixed term contract
                  </span>
                </button>
              </div>
            </div>

            {/* Contract Owner Dropdown */}
            <div>
              <label className="block text-slate-700 font-semibold mb-0.5 flex items-center space-x-1">
                <User className="w-3 h-3 text-purple-600" />
                <span>Contract Owner</span>
              </label>
              <select
                value={contractOwner}
                disabled={isFinanceCompleted}
                onChange={(e) => {
                  setContractOwner(e.target.value);
                  onUpdateOpportunity({
                    ...opportunity,
                    parallelFinance: { ...opportunity.parallelFinance, contractOwner: e.target.value },
                  });
                }}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
              >
                {contractOwnerOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Designated commercial/finance owner responsible for billing records and contract lifecycle.
              </span>
            </div>

            {/* Total Contract Value & Billing Frequency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block text-slate-600 font-medium mb-0.5">Total Contract Value (TCV)</label>
                <div className="font-bold text-slate-900 px-3 py-1.5 bg-purple-50/70 border border-purple-200 rounded-lg text-xs">
                  {formatCurrency(tcv || opportunity.dealValue, opportunity.currency)}
                </div>
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-0.5">Billing Frequency</label>
                <select
                  value={billingFrequency}
                  disabled={isFinanceCompleted}
                  onChange={(e: any) => {
                    setBillingFrequency(e.target.value);
                    onUpdateOpportunity({
                      ...opportunity,
                      parallelFinance: { ...opportunity.parallelFinance, billingFrequency: e.target.value },
                    });
                  }}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                >
                  <option value="MILESTONE">Milestone-Based Billing</option>
                  <option value="MONTHLY">Monthly Retainer</option>
                  <option value="UPFRONT_50_50">50% Advance / 50% Completion</option>
                  <option value="COMPLETION">100% Upon Completion</option>
                </select>
              </div>
            </div>
          </div>

          {/* Track A Action Button: Finance Set-up Completed */}
          <div className="pt-2 border-t border-slate-100">
            {isFinanceCompleted ? (
              <div className="p-2.5 bg-purple-50 rounded-lg border border-purple-200 flex items-center justify-between text-purple-900">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="font-bold text-xs">Finance Set-up Completed</span>
                    <span className="block text-[10px] text-purple-700">
                      SLA stopped at {formatDate(financeData?.financeCompletedAt)}
                    </span>
                  </div>
                </div>
                {!isDeliveryCompleted && (
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-semibold">
                    Waiting for Track B
                  </span>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={handleCompleteFinanceSetup}
                className="w-full py-2.5 px-3 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center space-x-2"
              >
                <DollarSign className="w-4 h-4" />
                <span>Finance Set-up Completed</span>
              </button>
            )}
            <p className="text-[10px] text-slate-500 mt-1 text-center">
              Stops Track A SLA. If Track B is ongoing, workflow stage is held; if Track B is finished, advances to Stage 13.
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TRACK B: PMO / BU DELIVERY EXECUTION                                      */}
        {/* ========================================================================= */}
        <div className={`bg-white rounded-xl border p-4 space-y-3.5 transition-all ${
          isDeliveryCompleted ? 'border-cyan-300 shadow-xs ring-1 ring-cyan-200' : 'border-cyan-200'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
                <CheckSquare className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Track B: PMO / BU Delivery</h4>
                <p className="text-[10px] text-slate-500">Project schedule, delivery governance & completion tracking</p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                isDeliveryCompleted
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-cyan-100 text-cyan-800'
              }`}>
                {isDeliveryCompleted ? 'Completed ✅' : 'In Progress'}
              </span>
              {isDeliveryCompleted && (
                <button
                  type="button"
                  onClick={handleReopenDelivery}
                  className="text-[10px] text-cyan-700 hover:text-cyan-900 underline font-medium"
                >
                  Edit
                </button>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-2.5">
            {/* Division and Business Unit Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-700 font-semibold mb-0.5">Division</label>
                <select
                  value={division}
                  disabled={isDeliveryCompleted}
                  onChange={(e) => {
                    setDivision(e.target.value);
                    onUpdateOpportunity({
                      ...opportunity,
                      parallelPmo: { ...opportunity.parallelPmo, division: e.target.value },
                    });
                  }}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                >
                  {activeDivisions.map((div) => (
                    <option key={div.id} value={div.value}>
                      {div.label}
                    </option>
                  ))}
                  {/* Preserve current if custom */}
                  {division && !activeDivisions.some((d) => d.value === division) && (
                    <option value={division}>{division}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-0.5">Business Unit</label>
                <select
                  value={businessUnit}
                  disabled={isDeliveryCompleted}
                  onChange={(e) => {
                    setBusinessUnit(e.target.value);
                    onUpdateOpportunity({
                      ...opportunity,
                      parallelPmo: { ...opportunity.parallelPmo, businessUnit: e.target.value },
                    });
                  }}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                >
                  {activeDepartments.map((dept) => (
                    <option key={dept.id} value={dept.value}>
                      {dept.label}
                    </option>
                  ))}
                  {businessUnit && !activeDepartments.some((d) => d.value === businessUnit) && (
                    <option value={businessUnit}>{businessUnit}</option>
                  )}
                </select>
              </div>
            </div>

            {/* Is this a Project? Toggle */}
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <label className="block text-slate-800 font-bold mb-1">Is this a Project?</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isDeliveryCompleted}
                  onClick={() => {
                    setIsProject(true);
                    onUpdateOpportunity({
                      ...opportunity,
                      parallelPmo: { ...opportunity.parallelPmo, isProject: true },
                    });
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    isProject
                      ? 'bg-cyan-700 text-white shadow-xs'
                      : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  ✓ Yes, It's a Project
                </button>

                <button
                  type="button"
                  disabled={isDeliveryCompleted}
                  onClick={() => {
                    setIsProject(false);
                    onUpdateOpportunity({
                      ...opportunity,
                      parallelPmo: { ...opportunity.parallelPmo, isProject: false },
                    });
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    !isProject
                      ? 'bg-cyan-700 text-white shadow-xs'
                      : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  ✕ No (Non-Project Delivery)
                </button>
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">
                {isProject
                  ? 'Project mode active: Governed by Project Manager, completion milestones, and computed duration SLA.'
                  : 'Non-project mode: Governed by Business Unit Owner with operational delivery closure and SLA.'}
              </span>
            </div>

            {/* ========================================================= */}
            {/* CONDITIONAL BRANCH: IF A PROJECT                          */}
            {/* ========================================================= */}
            {isProject ? (
              <div className="space-y-2.5 bg-cyan-50/40 p-3 rounded-lg border border-cyan-100">
                {/* Assigned Project Manager */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-0.5">Assigned Project Manager</label>
                  <select
                    value={projectManager}
                    disabled={isDeliveryCompleted}
                    onChange={(e) => {
                      setProjectManager(e.target.value);
                      onUpdateOpportunity({
                        ...opportunity,
                        parallelPmo: { ...opportunity.parallelPmo, projectManager: e.target.value },
                      });
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    {projectManagerOptions.map((pm) => (
                      <option key={pm} value={pm}>
                        {pm}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Delivery Completion % and Delivery Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-0.5">
                      Delivery Completion % ({progressPercentage}%)
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        disabled={isDeliveryCompleted}
                        value={progressPercentage}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setProgressPercentage(val);
                          onUpdateOpportunity({
                            ...opportunity,
                            parallelPmo: { ...opportunity.parallelPmo, progressPercentage: val },
                          });
                        }}
                        className="flex-1 accent-cyan-600 disabled:opacity-50"
                      />
                      <input
                        type="number"
                        min={0}
                        max={100}
                        disabled={isDeliveryCompleted}
                        value={progressPercentage}
                        onChange={(e) => {
                          const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                          setProgressPercentage(val);
                          onUpdateOpportunity({
                            ...opportunity,
                            parallelPmo: { ...opportunity.parallelPmo, progressPercentage: val },
                          });
                        }}
                        className="w-14 px-1.5 py-1 bg-white border border-slate-300 rounded text-center text-xs font-bold text-slate-800 disabled:bg-slate-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-0.5">Delivery Status</label>
                    <select
                      value={deliveryHealth}
                      disabled={isDeliveryCompleted}
                      onChange={(e: any) => {
                        setDeliveryHealth(e.target.value);
                        onUpdateOpportunity({
                          ...opportunity,
                          parallelPmo: { ...opportunity.parallelPmo, deliveryHealth: e.target.value },
                        });
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 disabled:bg-slate-100"
                    >
                      <option value="ON_TRACK">🟢 On Track (Healthy)</option>
                      <option value="AT_RISK">🟡 At Risk (Requires Attention)</option>
                      <option value="DELAYED">🔴 Delayed</option>
                    </select>
                  </div>
                </div>

                {/* Project Start Date & Target End Date with Computed Days SLA */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-0.5 flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-cyan-600" />
                      <span>Project Start Date</span>
                    </label>
                    <input
                      type="date"
                      value={projectStartDate}
                      disabled={isDeliveryCompleted}
                      onChange={(e) => {
                        setProjectStartDate(e.target.value);
                        onUpdateOpportunity({
                          ...opportunity,
                          parallelPmo: {
                            ...opportunity.parallelPmo,
                            projectStartDate: e.target.value,
                            computedDays: computedDays,
                            targetSlaDays: computedDays,
                          },
                        });
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-0.5 flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-cyan-600" />
                      <span>Target End Date</span>
                    </label>
                    <input
                      type="date"
                      value={targetEndDate}
                      disabled={isDeliveryCompleted}
                      onChange={(e) => {
                        setTargetEndDate(e.target.value);
                        onUpdateOpportunity({
                          ...opportunity,
                          parallelPmo: {
                            ...opportunity.parallelPmo,
                            targetEndDate: e.target.value,
                            computedDays: computedDays,
                            targetSlaDays: computedDays,
                          },
                        });
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 disabled:bg-slate-100"
                    />
                  </div>
                </div>

                {/* Computed Days Badge (Updates Track B SLA) */}
                <div className="bg-cyan-100/70 border border-cyan-200 rounded-lg p-2 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-cyan-700" />
                    <div>
                      <span className="font-bold text-cyan-950 text-xs">
                        Computed Duration: {computedDays} Calendar Days
                      </span>
                      <span className="block text-[10px] text-cyan-800">
                        Track B SLA target automatically updated to {computedDays} days
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-700 text-white">
                    SLA = {computedDays}d
                  </span>
                </div>

                {/* Actual Go Live Date & Actual Closure Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-0.5">Actual Go Live Date</label>
                    <input
                      type="date"
                      value={actualGoLiveDate}
                      disabled={isDeliveryCompleted}
                      onChange={(e) => {
                        setActualGoLiveDate(e.target.value);
                        onUpdateOpportunity({
                          ...opportunity,
                          parallelPmo: { ...opportunity.parallelPmo, actualGoLiveDate: e.target.value },
                        });
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-0.5">Actual Closure Date</label>
                    <input
                      type="date"
                      value={actualClosureDate}
                      disabled={isDeliveryCompleted}
                      onChange={(e) => {
                        setActualClosureDate(e.target.value);
                        onUpdateOpportunity({
                          ...opportunity,
                          parallelPmo: { ...opportunity.parallelPmo, actualClosureDate: e.target.value },
                        });
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 disabled:bg-slate-100"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* ========================================================= */
              /* CONDITIONAL BRANCH: IF NOT A PROJECT                      */
              /* ========================================================= */
              <div className="space-y-2.5 bg-amber-50/40 p-3 rounded-lg border border-amber-100">
                {/* Business Unit Owner Dropdown */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-0.5 flex items-center space-x-1">
                    <User className="w-3 h-3 text-amber-600" />
                    <span>Business Unit Owner</span>
                  </label>
                  <select
                    value={businessUnitOwner}
                    disabled={isDeliveryCompleted}
                    onChange={(e) => {
                      setBusinessUnitOwner(e.target.value);
                      onUpdateOpportunity({
                        ...opportunity,
                        parallelPmo: { ...opportunity.parallelPmo, businessUnitOwner: e.target.value },
                      });
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    {buOwnerOptions.map((owner) => (
                      <option key={owner} value={owner}>
                        {owner}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Delivery Closure Date */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-0.5 flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-amber-600" />
                    <span>Delivery Closure Date</span>
                  </label>
                  <input
                    type="date"
                    value={deliveryClosureDate}
                    disabled={isDeliveryCompleted}
                    onChange={(e) => {
                      setDeliveryClosureDate(e.target.value);
                      onUpdateOpportunity({
                        ...opportunity,
                        parallelPmo: {
                          ...opportunity.parallelPmo,
                          deliveryClosureDate: e.target.value,
                          computedDays: computedDays,
                          targetSlaDays: computedDays,
                        },
                      });
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 disabled:bg-slate-100"
                  />
                </div>

                {/* Notes / Description of Delivery */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-0.5">
                    Notes / Description of Delivery
                  </label>
                  <textarea
                    rows={3}
                    value={notesOrDescription}
                    disabled={isDeliveryCompleted}
                    onChange={(e) => {
                      setNotesOrDescription(e.target.value);
                      onUpdateOpportunity({
                        ...opportunity,
                        parallelPmo: {
                          ...opportunity.parallelPmo,
                          notesOrDescription: e.target.value,
                          deliveryNotes: e.target.value,
                        },
                      });
                    }}
                    placeholder="Provide operational delivery notes, scope of managed services, deliverables, or acceptance verification..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Track B Action Button: Delivery Completed */}
          <div className="pt-2 border-t border-slate-100">
            {isDeliveryCompleted ? (
              <div className="p-2.5 bg-cyan-50 rounded-lg border border-cyan-200 flex items-center justify-between text-cyan-900">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="font-bold text-xs">Delivery Completed</span>
                    <span className="block text-[10px] text-cyan-700">
                      SLA stopped at {formatDate(pmoData?.deliveryCompletedAt)}
                    </span>
                  </div>
                </div>
                {!isFinanceCompleted && (
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-semibold">
                    Waiting for Track A
                  </span>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={handleCompleteDelivery}
                className="w-full py-2.5 px-3 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center space-x-2"
              >
                <CheckSquare className="w-4 h-4" />
                <span>Delivery Completed</span>
              </button>
            )}
            <p className="text-[10px] text-slate-500 mt-1 text-center">
              Stops Track B SLA. If Track A is ongoing, workflow stage is held; if Track A is finished, advances to Stage 13.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
