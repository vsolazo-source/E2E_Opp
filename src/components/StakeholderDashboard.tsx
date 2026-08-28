import React from 'react';
import { 
  TrendingUp, 
  Award, 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  FileSignature, 
  ChevronRight, 
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { Opportunity, StakeholderRole, WorkflowStage, StageDefinition } from '../types';
import { WORKFLOW_STAGES, STAGE_MAP } from '../data/stages';
import { formatCurrency, getSlaStatus } from '../utils/formatters';

interface StakeholderDashboardProps {
  opportunities: Opportunity[];
  currentRole: StakeholderRole;
  selectedStageFilter: WorkflowStage | 'ALL';
  stageDefinitions?: StageDefinition[];
  onSelectStageFilter: (stage: WorkflowStage | 'ALL') => void;
  onSelectOpportunity: (opp: Opportunity) => void;
}

export const StakeholderDashboard: React.FC<StakeholderDashboardProps> = ({
  opportunities,
  currentRole,
  selectedStageFilter,
  stageDefinitions = WORKFLOW_STAGES,
  onSelectStageFilter,
  onSelectOpportunity,
}) => {
  // Aggregate Metrics
  const totalPipelineValue = opportunities.reduce((sum, opp) => sum + (opp.dealValue || 0), 0);
  
  const contractedAndWonDeals = opportunities.filter((opp) => 
    ['WIN_NOTIFICATION', 'PARALLEL_EXECUTION', 'CWC_DELIVERY', 'FINANCE_BILLING_ENDORSEMENT', 'DEAL_CLOSED'].includes(opp.currentStage)
  );
  const contractedTcv = contractedAndWonDeals.reduce((sum, opp) => sum + (opp.parallelFinance?.tcv || opp.dealValue || 0), 0);

  const billedRevenue = opportunities.reduce((sum, opp) => {
    if (opp.billingRecord?.paymentStatus === 'PAID' || opp.billingRecord?.paymentStatus === 'ISSUED') {
      return sum + (opp.billingRecord?.totalAmount || opp.billingRecord?.invoiceAmount || 0);
    }
    return sum;
  }, 0);

  const inDocuSignCount = opportunities.filter((o) => o.currentStage === 'DOCUSIGN_CLIENT_ROUTING').length;
  
  // Overdue SLA Deals
  const overdueDeals = opportunities.filter((opp) => getSlaStatus(opp, stageDefinitions).isOverdue);

  const activeStages = stageDefinitions && stageDefinitions.length > 0 ? stageDefinitions : WORKFLOW_STAGES;

  // Group stages for visual process map
  const stageGroups = [
    {
      name: '1. Presales & Architecture',
      color: 'border-blue-200 bg-blue-50/40',
      badgeColor: 'bg-blue-100 text-blue-800',
      stages: activeStages.slice(0, 3),
    },
    {
      name: '2. Legal & Commercial Buyoff',
      color: 'border-purple-200 bg-purple-50/40',
      badgeColor: 'bg-purple-100 text-purple-800',
      stages: activeStages.slice(3, 6),
    },
    {
      name: '3. Contract & WIN Broadcast',
      color: 'border-amber-200 bg-amber-50/40',
      badgeColor: 'bg-amber-100 text-amber-800',
      stages: activeStages.slice(6, 10),
    },
    {
      name: '4. Delivery, CWC & Billing',
      color: 'border-emerald-200 bg-emerald-50/40',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      stages: activeStages.slice(10, 14),
    },
  ];

  // Role Banner Info
  const roleGuidance: Record<StakeholderRole, { title: string; desc: string; focusStage: string }> = {
    ALL: {
      title: 'Executive Real-Time Pipeline & Governance',
      desc: '360° visibility across all 14 lifecycle stages from Sales Intake to Finance billing & project closeout.',
      focusStage: '14 Active Lifecycle Stages',
    },
    SALES: {
      title: 'Sales Executive Workbench',
      desc: 'Track intake opportunities, review architect solution proposals, and lead client commercial negotiations.',
      focusStage: 'Focus: Stages 1, 3, 6, 9 (DocuSign coordination)',
    },
    ARCHITECTURE: {
      title: 'Solution Architecture & BU Head Console',
      desc: 'Design technical blueprints, scope deliverables, estimate costs, and trigger optional 3rd-party Vendor PR/PO procurement.',
      focusStage: 'Focus: Stage 2 (Solution Design & Vendor PR/PO)',
    },
    CONTRACTS: {
      title: 'Contracts, Legal & Compliance Queue',
      desc: 'Review proposals, convert accepted deals into MSA/SOW contracts, dispatch DocuSign envelopes, and release WIN announcement emails.',
      focusStage: 'Focus: Stages 4, 7, 9, 10 (WIN Broadcast)',
    },
    FINANCE: {
      title: 'Finance & Deal Desk Command Center',
      desc: 'Evaluate gross margins, approve contract TCV, allocate Budget & Contract codes, and endorse CWC milestone billings.',
      focusStage: 'Focus: Stages 5, 8, 11 (Budget Codes), 13 (Billing)',
    },
    PMO: {
      title: 'PMO & Project Delivery Execution Hub',
      desc: 'Kick off delivery milestones upon contract win, manage sprint health, and issue Certificate of Work Completion (CWC).',
      focusStage: 'Focus: Stages 11 (Parallel Delivery) & 12 (CWC Signoff)',
    },
  };

  return (
    <div className="space-y-6">
      {/* Role Context Notification */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-5 shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
              <Zap className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-white">
              {roleGuidance[currentRole].title}
            </h2>
          </div>
          <p className="text-xs text-slate-300 max-w-3xl">
            {roleGuidance[currentRole].desc}
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="px-3 py-1.5 rounded-lg bg-white/10 text-xs font-semibold text-indigo-200 border border-white/10">
            {roleGuidance[currentRole].focusStage}
          </span>
        </div>
      </div>

      {/* Real-Time KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Pipeline */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Pipeline Value</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 truncate">
            {formatCurrency(totalPipelineValue, 'PHP')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {opportunities.length} Active Deals
          </div>
        </div>

        {/* Won / Contracted TCV */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Contracted TCV</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-lg font-bold text-emerald-700 truncate">
            {formatCurrency(contractedTcv, 'PHP')}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            {contractedAndWonDeals.length} Won & In Delivery
          </div>
        </div>

        {/* Billed Revenue */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Billed Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 truncate">
            {formatCurrency(billedRevenue, 'PHP')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Via Endorsed CWCs
          </div>
        </div>

        {/* In DocuSign */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">DocuSign Queue</span>
            <FileSignature className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-lg font-bold text-slate-900">
            {inDocuSignCount} Deals
          </div>
          <div className="text-[11px] text-rose-600 font-medium mt-1">
            Awaiting Signatures
          </div>
        </div>

        {/* PMO Active */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">PMO Delivery</span>
            <ShieldCheck className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-lg font-bold text-slate-900">
            {opportunities.filter((o) => o.currentStage === 'PARALLEL_EXECUTION' || o.currentStage === 'CWC_DELIVERY').length} Projects
          </div>
          <div className="text-[11px] text-cyan-700 font-medium mt-1">
            Active Milestone Work
          </div>
        </div>

        {/* SLA Alerts */}
        <div className={`rounded-xl p-4 border shadow-2xs ${
          overdueDeals.length > 0
            ? 'bg-amber-50/70 border-amber-300'
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">SLA Bottlenecks</span>
            <AlertTriangle className={`w-4 h-4 ${overdueDeals.length > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
          </div>
          <div className={`text-lg font-bold ${overdueDeals.length > 0 ? 'text-amber-900' : 'text-slate-900'}`}>
            {overdueDeals.length} Overdue
          </div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">
            {overdueDeals.length > 0 ? 'Requires Escalation' : 'All SLAs on Target'}
          </div>
        </div>
      </div>

      {/* Interactive 14-Stage End-to-End Visual Workflow Pipeline */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center">
              <span>Complete 14-Step Lifecycle Funnel</span>
              <span className="ml-2 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                Interactive Stage Filter
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any stage below to filter opportunities or inspect handoffs.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {selectedStageFilter !== 'ALL' && (
              <button
                onClick={() => onSelectStageFilter('ALL')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg transition-colors"
              >
                Clear Stage Filter (Show All)
              </button>
            )}
          </div>
        </div>

        {/* 4 Process Groups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stageGroups.map((group, groupIdx) => (
            <div
              key={groupIdx}
              className={`rounded-xl border p-3 flex flex-col justify-between ${group.color}`}
            >
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {group.name}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${group.badgeColor}`}>
                  Phase {groupIdx + 1}
                </span>
              </div>

              <div className="space-y-1.5 flex-1">
                {group.stages.map((stage) => {
                  const dealCount = opportunities.filter((o) => o.currentStage === stage.id).length;
                  const isSelected = selectedStageFilter === stage.id;
                  const isPrimaryForRole = currentRole !== 'ALL' && stage.primaryActor === currentRole;

                  return (
                    <button
                      key={stage.id}
                      id={`stage-filter-${stage.id.toLowerCase()}`}
                      onClick={() => onSelectStageFilter(isSelected ? 'ALL' : stage.id)}
                      className={`w-full text-left p-2 rounded-lg text-xs transition-all flex items-center justify-between border ${
                        isSelected
                          ? 'bg-blue-600 text-white font-semibold border-blue-700 shadow-xs'
                          : isPrimaryForRole
                          ? 'bg-white text-slate-900 border-amber-300 ring-1 ring-amber-300 font-medium hover:bg-amber-50/50'
                          : 'bg-white/85 hover:bg-white text-slate-700 border-slate-200/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            isSelected ? 'bg-white text-blue-700' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {stage.index}
                        </span>
                        <div className="truncate">
                          <div className="truncate font-medium">{stage.shortLabel}</div>
                          <div className={`text-[10px] truncate ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                            {stage.actorLabel}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0 ml-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                            dealCount > 0
                              ? isSelected
                                ? 'bg-white text-blue-700'
                                : 'bg-blue-100 text-blue-800'
                              : isSelected
                              ? 'bg-blue-500 text-blue-100'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {dealCount}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SLA Bottleneck Attention Bar (If any overdue deals) */}
      {overdueDeals.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                SLA Attention Required: {overdueDeals.length} Deal{overdueDeals.length > 1 ? 's' : ''} Exceeding Stage Target Time
              </h4>
              <p className="text-xs text-amber-700">
                Action required to avoid deal slippage or delivery milestone delays.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {overdueDeals.slice(0, 3).map((opp) => (
              <button
                key={opp.id}
                onClick={() => onSelectOpportunity(opp)}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-900 hover:bg-amber-100/60 shadow-2xs flex items-center"
              >
                {opp.clientName} ({STAGE_MAP[opp.currentStage]?.shortLabel})
                <ArrowRight className="w-3 h-3 ml-1 text-amber-700" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
