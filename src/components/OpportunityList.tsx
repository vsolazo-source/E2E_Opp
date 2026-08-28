import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  Clock, 
  ArrowRight, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  Briefcase,
  Layers,
  FileText,
  DollarSign,
  Zap,
  ArrowUpRight,
  X,
  UserCheck
} from 'lucide-react';
import { Opportunity, WorkflowStage, StakeholderRole, FormSelectorsConfig, StageDefinition } from '../types';
import { WORKFLOW_STAGES, STAGE_MAP, BU_LABELS } from '../data/stages';
import { formatCurrency, formatDate, getSlaStatus } from '../utils/formatters';

interface OpportunityListProps {
  opportunities: Opportunity[];
  currentRole: StakeholderRole;
  selectedStageFilter: WorkflowStage | 'ALL';
  formSelectors?: FormSelectorsConfig;
  stageDefinitions?: StageDefinition[];
  onSelectOpportunity: (opp: Opportunity) => void;
  onOpenNewOpportunity: () => void;
}

export const OpportunityList: React.FC<OpportunityListProps> = ({
  opportunities,
  currentRole,
  selectedStageFilter,
  formSelectors,
  stageDefinitions,
  onSelectOpportunity,
  onOpenNewOpportunity,
}) => {
  const [viewMode, setViewMode] = useState<'TABLE' | 'KANBAN'>('TABLE');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<string>('ALL');
  const [selectedBu, setSelectedBu] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [slaFilterOnly, setSlaFilterOnly] = useState(false);

  const activeDivisions = (formSelectors?.divisions || []).filter((d) => d.isActive !== false);
  const activeDepartments = (formSelectors?.departments || []).filter((d) => d.isActive !== false);
  const activePriorities = (formSelectors?.priorities || []).filter((p) => p.isActive !== false);

  // Filtered dataset with comprehensive matching on client, title, and assigned resource
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      // Search by Client Name, Deal Title, Tracking Code, or Assigned Resources
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();

        // 1. Client Match (Name, Industry, Contact Person, Contact Email)
        const matchClient = Boolean(
          (opp.clientName && opp.clientName.toLowerCase().includes(q)) ||
          (opp.clientIndustry && opp.clientIndustry.toLowerCase().includes(q)) ||
          (opp.clientContactName && opp.clientContactName.toLowerCase().includes(q)) ||
          (opp.clientContactEmail && opp.clientContactEmail.toLowerCase().includes(q))
        );

        // 2. Title & Tracking Code Match
        const matchTitle = Boolean(
          (opp.title && opp.title.toLowerCase().includes(q)) ||
          (opp.trackingCode && opp.trackingCode.toLowerCase().includes(q)) ||
          (opp.description && opp.description.toLowerCase().includes(q))
        );

        // 3. Assigned Resource Match (Sales Lead, Presales/Solution Architect, BU Owner, Contracts Processor, Finance Processor, PMO/Project Manager, Signers)
        const assignedResources = [
          opp.salesLead,
          opp.solutionArchitect,
          opp.solutionProposal?.solutionArchitect,
          opp.buOwner,
          opp.solutionProposal?.buOwner,
          opp.contractsProcessor,
          opp.contractsReviewData?.contractsProcessor,
          opp.contractsReviewData?.reviewedBy,
          opp.financeProcessor,
          opp.initialFinanceReviewData?.financeProcessor,
          opp.initialFinanceApproval?.approvedBy,
          opp.parallelFinance?.financeOfficer,
          opp.parallelPmo?.projectManager,
          opp.parallelPmo?.buHead,
          opp.cwcRecord?.pmoLeadSigner,
          opp.cwcRecord?.clientApproverName,
          opp.docusignDetails?.clientSignerName,
          opp.docusignDetails?.internalSignerName,
          opp.winNotification?.releasedBy,
        ].filter(Boolean) as string[];

        const matchResource = assignedResources.some((resource) =>
          resource.toLowerCase().includes(q)
        );

        if (!matchClient && !matchTitle && !matchResource) return false;
      }

      // Stage Filter
      if (selectedStageFilter !== 'ALL' && opp.currentStage !== selectedStageFilter) {
        return false;
      }

      // Role Filter (If role is not ALL and user hasn't explicitly selected a stage)
      if (currentRole !== 'ALL' && selectedStageFilter === 'ALL') {
        const stageDef = STAGE_MAP[opp.currentStage];
        if (stageDef?.primaryActor !== currentRole && currentRole !== 'ALL') {
          // Keep showing if it's in their broad domain
        }
      }

      // Division filter
      if (selectedDivision !== 'ALL' && (opp.division || 'General Operations') !== selectedDivision) {
        return false;
      }

      // BU filter
      if (selectedBu !== 'ALL' && opp.businessUnit !== selectedBu) {
        return false;
      }

      // Priority filter
      if (selectedPriority !== 'ALL' && opp.priority !== selectedPriority) {
        return false;
      }

      // SLA filter
      if (slaFilterOnly) {
        const sla = getSlaStatus(opp, stageDefinitions);
        if (!sla.isOverdue) return false;
      }

      return true;
    });
  }, [opportunities, searchQuery, selectedStageFilter, currentRole, selectedDivision, selectedBu, selectedPriority, slaFilterOnly, stageDefinitions]);

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    selectedDivision !== 'ALL' ||
    selectedBu !== 'ALL' ||
    selectedPriority !== 'ALL' ||
    slaFilterOnly ||
    selectedStageFilter !== 'ALL'
  );

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleResetAllFilters = () => {
    setSearchQuery('');
    setSelectedDivision('ALL');
    setSelectedBu('ALL');
    setSelectedPriority('ALL');
    setSlaFilterOnly(false);
  };

  // Kanban Columns (Grouped by 4 Enterprise Phases)
  const kanbanPhases = [
    {
      id: 'PHASE_1',
      title: '1. Presales & Architecture',
      subtitle: 'Intake, Solution Design, Sales Review',
      stages: ['OPPORTUNITY_INTAKE', 'SOLUTION_DESIGN', 'SALES_PROPOSAL_REVIEW'] as WorkflowStage[],
      headerColor: 'bg-blue-50 text-blue-900 border-blue-200',
    },
    {
      id: 'PHASE_2',
      title: '2. Contracts & Finance Governance',
      subtitle: 'Contracts Review, Initial Finance, Contracts Endorsement, Client Buyoff',
      stages: ['CONTRACTS_PROPOSAL_REVIEW', 'INITIAL_FINANCE_APPROVAL', 'CONTRACTS_PROPOSAL_ENDORSEMENT', 'CLIENT_BUYOFF_NEGOTIATION'] as WorkflowStage[],
      headerColor: 'bg-purple-50 text-purple-900 border-purple-200',
    },
    {
      id: 'PHASE_3',
      title: '3. Legal Execution & WIN',
      subtitle: 'Contract SOW, Final Finance, DocuSign, WIN Email',
      stages: ['CONTRACT_CONVERSION', 'FINAL_FINANCE_APPROVAL', 'DOCUSIGN_CLIENT_ROUTING', 'WIN_NOTIFICATION'] as WorkflowStage[],
      headerColor: 'bg-amber-50 text-amber-900 border-amber-200',
    },
    {
      id: 'PHASE_4',
      title: '4. Delivery, CWC & Invoicing',
      subtitle: 'Parallel Delivery, CWC Signoff, Billing, Closed',
      stages: ['PARALLEL_EXECUTION', 'CWC_DELIVERY', 'FINANCE_BILLING_ENDORSEMENT', 'DEAL_CLOSED'] as WorkflowStage[],
      headerColor: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Control Bar: Search & Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              id="input-search-opportunities"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by client name, opportunity title, or assigned resource..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-full hover:bg-slate-200"
                title="Clear search"
                id="btn-clear-opportunity-search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Division Selector */}
            {activeDivisions.length > 0 && (
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
                id="select-division-filter"
              >
                <option value="ALL">All Divisions</option>
                {activeDivisions.map((div) => (
                  <option key={div.id} value={div.value}>
                    {div.label}
                  </option>
                ))}
              </select>
            )}

            {/* BU Selector */}
            <select
              value={selectedBu}
              onChange={(e) => setSelectedBu(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
              id="select-bu-filter"
            >
              <option value="ALL">All Business Units</option>
              {activeDepartments.length > 0 ? (
                activeDepartments.map((dept) => (
                  <option key={dept.id} value={dept.value}>
                    {dept.label}
                  </option>
                ))
              ) : (
                <>
                  <option value="CLOUD_INFRA">Cloud & Infrastructure</option>
                  <option value="DIGITAL_APP">Digital & Enterprise Apps</option>
                  <option value="ENTERPRISE_AI">Enterprise AI</option>
                  <option value="MANAGED_SERVICES">Managed Services</option>
                  <option value="CYBERSECURITY">Cybersecurity</option>
                </>
              )}
            </select>

            {/* Priority Selector */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
              id="select-priority-filter"
            >
              <option value="ALL">All Priorities</option>
              {activePriorities.length > 0 ? (
                activePriorities.map((prio) => (
                  <option key={prio.id} value={prio.value}>
                    {prio.label}
                  </option>
                ))
              ) : (
                <>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </>
              )}
            </select>

            {/* SLA Overdue Toggle */}
            <button
              type="button"
              id="btn-filter-sla-overdue"
              onClick={() => setSlaFilterOnly(!slaFilterOnly)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center ${
                slaFilterOnly
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5 mr-1" />
              SLA Overdue Only
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50 p-0.5 ml-auto">
              <button
                type="button"
                id="btn-view-table"
                onClick={() => setViewMode('TABLE')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'TABLE' ? 'bg-white shadow-xs text-blue-700' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Table Grid View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                id="btn-view-kanban"
                onClick={() => setViewMode('KANBAN')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'KANBAN' ? 'bg-white shadow-xs text-blue-700' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Kanban Board View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Results summary & active filters chips */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <span>
              Showing <strong className="text-slate-800 font-bold">{filteredOpportunities.length}</strong> of{' '}
              <strong className="text-slate-700 font-semibold">{opportunities.length}</strong> opportunities
            </span>
            
            {searchQuery.trim() && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-medium">
                <Search className="w-3 h-3 text-blue-500" />
                Query: "{searchQuery}"
                <button
                  onClick={handleClearSearch}
                  className="hover:text-blue-900 ml-0.5"
                  title="Remove search query"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedStageFilter !== 'ALL' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium">
                Stage: {STAGE_MAP[selectedStageFilter]?.shortLabel}
              </span>
            )}

            {selectedDivision !== 'ALL' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-medium">
                Division: {selectedDivision}
              </span>
            )}

            {selectedBu !== 'ALL' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-medium">
                BU: {BU_LABELS[selectedBu] || selectedBu}
              </span>
            )}

            {selectedPriority !== 'ALL' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-medium">
                Priority: {selectedPriority}
              </span>
            )}

            {slaFilterOnly && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[11px] font-medium">
                Overdue SLAs
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              id="btn-clear-all-filters"
              onClick={handleResetAllFilters}
              className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold hover:underline flex items-center gap-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* TABLE VIEW */}
      {viewMode === 'TABLE' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Tracking / Deal Title</th>
                  <th className="px-4 py-3">Client & Industry</th>
                  <th className="px-4 py-3">Deal Value</th>
                  <th className="px-4 py-3">Current Stage</th>
                  <th className="px-4 py-3">Assigned Lead / Resources</th>
                  <th className="px-4 py-3">SLA Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOpportunities.length > 0 ? (
                  filteredOpportunities.map((opp) => {
                    const stageDef = STAGE_MAP[opp.currentStage];
                    const sla = getSlaStatus(opp, stageDefinitions);
                    const isRelevantToRole = currentRole !== 'ALL' && stageDef?.primaryActor === currentRole;

                    return (
                      <tr
                        key={opp.id}
                        onClick={() => onSelectOpportunity(opp)}
                        className={`hover:bg-slate-50/90 cursor-pointer transition-colors ${
                          isRelevantToRole ? 'bg-amber-50/30' : ''
                        }`}
                      >
                        {/* Title & Code */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-[11px] text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
                              {opp.trackingCode}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              opp.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                              opp.priority === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {opp.priority}
                            </span>
                          </div>
                          <div className="font-bold text-slate-900 text-xs mt-1 hover:text-blue-600">
                            {opp.title}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {opp.division ? `${opp.division} • ` : ''}{BU_LABELS[opp.businessUnit] || opp.businessUnit}
                          </div>
                        </td>

                        {/* Client */}
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-900">{opp.clientName}</div>
                          <div className="text-[11px] text-slate-500">{opp.clientIndustry}</div>
                          {opp.clientContactName && (
                            <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[180px]">
                              {opp.clientContactName}
                            </div>
                          )}
                        </td>

                        {/* Deal Value */}
                        <td className="px-4 py-3.5">
                          <div className="font-extrabold text-slate-900 text-xs">
                            {formatCurrency(opp.dealValue, opp.currency)}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Prob: {opp.probability}%
                          </div>
                        </td>

                        {/* Current Stage */}
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-1.5"></span>
                            {stageDef?.shortLabel}
                          </span>
                        </td>

                        {/* Assigned Role & Lead */}
                        <td className="px-4 py-3.5">
                          <div className="font-medium text-slate-800 text-xs flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-blue-500" />
                            {opp.salesLead || 'Unassigned'}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {opp.solutionArchitect || opp.solutionProposal?.solutionArchitect ? (
                              <span>SA: {opp.solutionArchitect || opp.solutionProposal?.solutionArchitect}</span>
                            ) : (
                              <span>Stage: {stageDef?.actorLabel}</span>
                            )}
                          </div>
                        </td>

                        {/* SLA */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center space-x-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                sla.isOverdue
                                  ? 'bg-red-500 animate-pulse'
                                  : sla.status === 'WARNING'
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                            />
                            <span className={`text-[11px] font-semibold ${
                              sla.isOverdue ? 'text-red-700 font-bold' : 'text-slate-600'
                            }`}>
                              {sla.days}d / {sla.targetDays}d
                            </span>
                          </div>
                        </td>

                        {/* Action */}
                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectOpportunity(opp);
                            }}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-2xs transition-all"
                          >
                            <Zap className="w-3.5 h-3.5 mr-1" />
                            Action
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Search className="w-8 h-8 text-slate-300" />
                        <div className="font-semibold text-slate-600">No matching opportunities found</div>
                        <div className="text-xs text-slate-400">
                          {searchQuery ? `No results matching "${searchQuery}"` : 'Try adjusting your filter criteria'}
                        </div>
                        {hasActiveFilters && (
                          <button
                            onClick={handleResetAllFilters}
                            className="mt-2 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium transition-colors"
                          >
                            Clear All Filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* KANBAN BOARD VIEW */}
      {viewMode === 'KANBAN' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {kanbanPhases.map((phase) => {
            const phaseOpps = filteredOpportunities.filter((opp) => phase.stages.includes(opp.currentStage));
            const phaseTcv = phaseOpps.reduce((sum, o) => sum + (o.dealValue || 0), 0);

            return (
              <div
                key={phase.id}
                className="bg-slate-100/70 rounded-2xl border border-slate-200 p-3.5 space-y-3"
              >
                {/* Column Header */}
                <div className={`p-3 rounded-xl border ${phase.headerColor}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{phase.title}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/80">
                      {phaseOpps.length}
                    </span>
                  </div>
                  <div className="text-[10px] opacity-80 mt-0.5">{phase.subtitle}</div>
                  <div className="text-xs font-extrabold mt-1.5 pt-1.5 border-t border-black/10">
                    Total: {formatCurrency(phaseTcv)}
                  </div>
                </div>

                {/* Cards Container */}
                <div className="space-y-2.5 min-h-[240px]">
                  {phaseOpps.length > 0 ? (
                    phaseOpps.map((opp) => {
                      const stageDef = STAGE_MAP[opp.currentStage];
                      const sla = getSlaStatus(opp, stageDefinitions);

                      return (
                        <div
                          key={opp.id}
                          onClick={() => onSelectOpportunity(opp)}
                          className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer space-y-2.5"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-mono text-slate-500 font-semibold">{opp.trackingCode}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              opp.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                              opp.priority === 'HIGH' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {opp.priority}
                            </span>
                          </div>

                          <div>
                            <h5 className="font-bold text-xs text-slate-900 line-clamp-2">{opp.title}</h5>
                            <div className="text-[11px] text-slate-500 font-medium mt-0.5">{opp.clientName}</div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                            <span className="font-extrabold text-emerald-700">{formatCurrency(opp.dealValue, opp.currency)}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-100">
                              {stageDef?.shortLabel}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span className="truncate max-w-[120px]">
                              Lead: {opp.salesLead}
                            </span>
                            <span className={sla.isOverdue ? 'text-red-600 font-bold' : ''}>
                              {sla.days}d in stage
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-32 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                      No active deals
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

