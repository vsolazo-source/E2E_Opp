import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  RefreshCw, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Truck, 
  Receipt, 
  DollarSign, 
  ExternalLink, 
  UserCheck, 
  ArrowRight, 
  Layers, 
  Building2, 
  ShieldCheck, 
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Calendar,
  CalendarDays,
  List,
  Bell,
  Info,
  X
} from 'lucide-react';
import { Opportunity, StakeholderRole, FormSelectorsConfig } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { UserProfile } from '../types/rbac';
import { RenewalWorkflowModal } from './RenewalWorkflowModal';
import { NonRecurringContractModal } from './NonRecurringContractModal';
import { BU_LABELS } from '../data/stages';

interface ContractsViewProps {
  opportunities: Opportunity[];
  currentRole: StakeholderRole;
  currentUser?: UserProfile;
  formSelectors?: FormSelectorsConfig;
  onSelectOpportunity: (opp: Opportunity) => void;
  onUpdateOpportunity: (updated: Opportunity) => void;
}

export const ContractsView: React.FC<ContractsViewProps> = ({
  opportunities,
  currentRole,
  currentUser,
  formSelectors,
  onSelectOpportunity,
  onUpdateOpportunity,
}) => {
  // Filter for opportunities that have an assigned Contract Code (assigned by Finance in Stage 12 or converted)
  const contractedOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      const hasCode = Boolean(
        opp.parallelFinance?.contractCode || 
        (opp.contractDetails?.contractNumber && ['PARALLEL_EXECUTION', 'CWC_DELIVERY', 'FINANCE_BILLING_ENDORSEMENT', 'DEAL_CLOSED'].includes(opp.currentStage))
      );
      return hasCode;
    });
  }, [opportunities]);

  // Tab & Filter States
  const [activeTab, setActiveTab] = useState<'ALL' | 'RECURRING' | 'NON_RECURRING' | 'EXPIRING_SOON' | 'RENEWALS_IN_FLIGHT'>('ALL');
  const [viewMode, setViewMode] = useState<'TABLE' | 'CALENDAR'>('TABLE');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBu, setSelectedBu] = useState<string>('ALL');
  const [selectedValidityFilter, setSelectedValidityFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED'>('ALL');

  // Calendar State (Defaults to October 2026 to align with application context)
  const [calendarYear, setCalendarYear] = useState<number>(2026);
  const [calendarMonth, setCalendarMonth] = useState<number>(9); // 0-indexed: 9 = October
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string | null>(null);

  // Modals state
  const [selectedRenewalOpp, setSelectedRenewalOpp] = useState<Opportunity | null>(null);
  const [selectedNonRecurringOpp, setSelectedNonRecurringOpp] = useState<Opportunity | null>(null);

  // Helper for validity evaluation
  const now = new Date().getTime();
  const getValidityInfo = (opp: Opportunity) => {
    const endDate = opp.parallelFinance?.contractEndDate;
    if (!endDate) {
      return { days: 999, status: 'ACTIVE' as const, label: 'Active (Ongoing)' };
    }
    const endMs = new Date(endDate).getTime();
    const days = Math.ceil((endMs - now) / (1000 * 60 * 60 * 24));
    if (days < 0) {
      return { days, status: 'EXPIRED' as const, label: `Expired (${Math.abs(days)}d ago)` };
    } else if (days <= 60) {
      return { days, status: 'EXPIRING_SOON' as const, label: `Expiring in ${days}d` };
    }
    return { days, status: 'ACTIVE' as const, label: `Active (${days}d left)` };
  };

  // Helper for contract classification: Recurring vs Non-Recurring
  const isRecurringContract = (opp: Opportunity): boolean => {
    if (opp.parallelFinance?.contractRenewalType) {
      return opp.parallelFinance.contractRenewalType === 'RECURRING';
    }
    // Heuristics fallback
    const titleAndDesc = `${opp.title} ${opp.description || ''} ${opp.servicePillar || ''} ${opp.businessUnit || ''}`.toLowerCase();
    return titleAndDesc.includes('managed') || 
           titleAndDesc.includes('retainer') || 
           titleAndDesc.includes('annual') || 
           titleAndDesc.includes('subscription') || 
           titleAndDesc.includes('24/7') ||
           opp.businessUnit === 'MANAGED_SERVICES';
  };

  // Filtered dataset
  const filteredContracts = useMemo(() => {
    return contractedOpportunities.filter((opp) => {
      const isRecurring = isRecurringContract(opp);
      const validity = getValidityInfo(opp);
      const renewalRecord = opp.contractRenewalRecord;
      const hasRenewalInFlight = Boolean(
        renewalRecord && 
        renewalRecord.status === 'IN_PROGRESS' && 
        renewalRecord.currentRenewalStage !== 'RENEWAL_ACTIVATED'
      );

      // Tab filter
      if (activeTab === 'RECURRING' && !isRecurring) return false;
      if (activeTab === 'NON_RECURRING' && isRecurring) return false;
      if (activeTab === 'EXPIRING_SOON' && validity.status === 'ACTIVE') return false;
      if (activeTab === 'RENEWALS_IN_FLIGHT' && !hasRenewalInFlight) return false;

      // Validity filter
      if (selectedValidityFilter !== 'ALL' && validity.status !== selectedValidityFilter) return false;

      // BU filter
      if (selectedBu !== 'ALL' && opp.businessUnit !== selectedBu) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const code = (opp.parallelFinance?.contractCode || opp.contractDetails?.contractNumber || '').toLowerCase();
        const client = (opp.clientName || '').toLowerCase();
        const title = (opp.title || '').toLowerCase();
        const owner = (opp.parallelFinance?.contractOwner || opp.salesLead || '').toLowerCase();
        const budget = (opp.parallelFinance?.budgetCode || '').toLowerCase();

        if (!code.includes(q) && !client.includes(q) && !title.includes(q) && !owner.includes(q) && !budget.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [contractedOpportunities, activeTab, selectedValidityFilter, selectedBu, searchQuery]);

  // Aggregate Metrics
  const totalContractsCount = contractedOpportunities.length;
  const recurringContractsCount = contractedOpportunities.filter(isRecurringContract).length;
  const nonRecurringContractsCount = contractedOpportunities.filter((o) => !isRecurringContract(o)).length;

  const totalContractedTcv = contractedOpportunities.reduce(
    (sum, o) => sum + (o.parallelFinance?.tcv || o.dealValue || 0), 0
  );
  const recurringAcv = contractedOpportunities
    .filter(isRecurringContract)
    .reduce((sum, o) => sum + (o.parallelFinance?.tcv || o.dealValue || 0), 0);
  const nonRecurringValue = contractedOpportunities
    .filter((o) => !isRecurringContract(o))
    .reduce((sum, o) => sum + (o.parallelFinance?.tcv || o.dealValue || 0), 0);

  const expiringAlertsCount = contractedOpportunities.filter((o) => getValidityInfo(o).status !== 'ACTIVE').length;
  const renewalsInFlightCount = contractedOpportunities.filter((o) => 
    o.contractRenewalRecord?.status === 'IN_PROGRESS' && o.contractRenewalRecord.currentRenewalStage !== 'RENEWAL_ACTIVATED'
  ).length;

  // Calendar Helpers & Math
  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(calendarYear - 1);
    } else {
      setCalendarMonth(calendarMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(calendarYear + 1);
    } else {
      setCalendarMonth(calendarMonth + 1);
    }
  };

  const handleGoToCurrentMonth = () => {
    setCalendarYear(2026);
    setCalendarMonth(9);
  };

  // Calendar Grid Calculation (7-column week matrix)
  const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay(); // 0 = Sunday
  const daysInCurrentMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(calendarYear, calendarMonth, 0).getDate();

  const calendarGridCells = useMemo(() => {
    const cells: Array<{
      dayNum: number;
      isCurrentMonth: boolean;
      dateStr: string;
      isToday: boolean;
    }> = [];

    const todayStr = '2026-10-06';

    // Preceding days from previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const prevM = calendarMonth === 0 ? 12 : calendarMonth;
      const prevY = calendarMonth === 0 ? calendarYear - 1 : calendarYear;
      const dNum = daysInPrevMonth - i;
      const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
      cells.push({
        dayNum: dNum,
        isCurrentMonth: false,
        dateStr,
        isToday: dateStr === todayStr,
      });
    }

    // Days in current month
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      cells.push({
        dayNum: i,
        isCurrentMonth: true,
        dateStr,
        isToday: dateStr === todayStr,
      });
    }

    // Trailing days from next month
    const totalCells = cells.length <= 35 ? 35 : 42;
    const remaining = totalCells - cells.length;
    for (let i = 1; i <= remaining; i++) {
      const nextM = calendarMonth === 11 ? 1 : calendarMonth + 2;
      const nextY = calendarMonth === 11 ? calendarYear + 1 : calendarYear;
      const dateStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      cells.push({
        dayNum: i,
        isCurrentMonth: false,
        dateStr,
        isToday: dateStr === todayStr,
      });
    }

    return cells;
  }, [calendarYear, calendarMonth, firstDayOfWeek, daysInCurrentMonth, daysInPrevMonth]);

  // Index contract milestones by Date string YYYY-MM-DD
  const eventsByDate = useMemo(() => {
    const map: Record<string, Array<{
      opp: Opportunity;
      type: 'EXPIRATION' | 'RENEWAL_TARGET';
      title: string;
      contractCode: string;
      clientName: string;
      status: 'EXPIRED' | 'EXPIRING_SOON' | 'ACTIVE';
      daysRemaining: number;
      isRecurring: boolean;
      renewalStage?: string;
    }>> = {};

    contractedOpportunities.forEach((opp) => {
      const isRecurring = isRecurringContract(opp);
      const validity = getValidityInfo(opp);
      const contractCode = opp.parallelFinance?.contractCode || opp.contractDetails?.contractNumber || 'CTR-PENDING';

      // 1. Contract End Date (Validity Expiration)
      const endDate = opp.parallelFinance?.contractEndDate;
      if (endDate) {
        if (!map[endDate]) map[endDate] = [];
        map[endDate].push({
          opp,
          type: 'EXPIRATION',
          title: `${contractCode} Validity End`,
          contractCode,
          clientName: opp.clientName,
          status: validity.status,
          daysRemaining: validity.days,
          isRecurring,
          renewalStage: opp.contractRenewalRecord?.currentRenewalStage,
        });
      }

      // 2. Renewal Target Date (if different from end date)
      const targetRenewal = opp.contractRenewalRecord?.targetRenewalDate;
      if (targetRenewal && targetRenewal !== endDate) {
        if (!map[targetRenewal]) map[targetRenewal] = [];
        map[targetRenewal].push({
          opp,
          type: 'RENEWAL_TARGET',
          title: `${contractCode} Target Renewal`,
          contractCode,
          clientName: opp.clientName,
          status: validity.status,
          daysRemaining: validity.days,
          isRecurring,
          renewalStage: opp.contractRenewalRecord?.currentRenewalStage,
        });
      }
    });

    return map;
  }, [contractedOpportunities]);

  // Upcoming Timelines Queue for Proactive Timeline Management (sorted chronologically)
  const upcomingTimelines = useMemo(() => {
    return contractedOpportunities
      .filter((opp) => Boolean(opp.parallelFinance?.contractEndDate))
      .map((opp) => {
        const validity = getValidityInfo(opp);
        const isRecurring = isRecurringContract(opp);
        const contractCode = opp.parallelFinance?.contractCode || opp.contractDetails?.contractNumber || 'CTR-PENDING';
        return {
          opp,
          validity,
          isRecurring,
          contractCode,
          endDate: opp.parallelFinance!.contractEndDate!,
          renewalRecord: opp.contractRenewalRecord,
        };
      })
      .sort((a, b) => a.validity.days - b.validity.days);
  }, [contractedOpportunities]);

  return (
    <div className="space-y-6">

      {/* CONTRACTS OVERVIEW METRICS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 2xl:gap-5">
        
        {/* Total Contracts */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold">Active Contract Base</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-lg font-extrabold text-slate-900 truncate">
            {formatCurrency(totalContractedTcv)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {totalContractsCount} Assigned Contract Codes
          </div>
        </div>

        {/* Recurring Contracts (ACV) */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold">Recurring ACV Base</span>
            <RefreshCw className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-lg font-extrabold text-indigo-700 truncate">
            {formatCurrency(recurringAcv)}
          </div>
          <div className="text-[11px] text-indigo-600 font-semibold mt-1">
            {recurringContractsCount} Recurring Subscriptions
          </div>
        </div>

        {/* Non-Recurring Projects */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold">Non-Recurring Projects</span>
            <Truck className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-lg font-extrabold text-cyan-800 truncate">
            {formatCurrency(nonRecurringValue)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {nonRecurringContractsCount} Fixed-Scope Engagements
          </div>
        </div>

        {/* Renewals In Flight */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold">Renewals In Flight</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-lg font-extrabold text-slate-900">
            {renewalsInFlightCount} In Progress
          </div>
          <div className="text-[11px] text-amber-700 font-semibold mt-1">
            Active Workflow Cycles
          </div>
        </div>

        {/* Validity Alerts */}
        <div className={`rounded-xl p-4 border shadow-2xs ${
          expiringAlertsCount > 0 ? 'bg-amber-50/80 border-amber-300' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold">Validity End Alerts</span>
            <AlertTriangle className={`w-4 h-4 ${expiringAlertsCount > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
          </div>
          <div className={`text-lg font-extrabold ${expiringAlertsCount > 0 ? 'text-amber-900' : 'text-slate-900'}`}>
            {expiringAlertsCount} Alerts
          </div>
          <div className="text-[11px] text-amber-700 font-semibold mt-1">
            {expiringAlertsCount > 0 ? 'Expiring in ≤ 60d or Expired' : 'All Contracts Healthy'}
          </div>
        </div>

      </div>

      {/* Visual Validity End & Renewal Warning Alert Banner - Moved below the 5 cards */}
      {expiringAlertsCount > 0 && (
        <div className="bg-gradient-to-r from-amber-50 via-rose-50 to-red-50 border border-amber-300 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600 animate-pulse" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-amber-950 flex items-center gap-2">
                <span>{expiringAlertsCount} {expiringAlertsCount === 1 ? 'Contract has' : 'Contracts have'} upcoming expiration or expired validity alerts</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-600 text-white uppercase tracking-wider">
                  Validity Alert
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-amber-800 mt-0.5">
                Contracts team proactive alert: contracts expired or expiring in ≤ 60 days require immediate review. Trigger recurring renewals with BU/Finance updates or inspect non-recurring billing & CWC sign-off below.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              id="btn-toggle-contracts-alert-banner"
              onClick={() => {
                if (activeTab === 'EXPIRING_SOON') {
                  setActiveTab('ALL');
                } else {
                  setActiveTab('EXPIRING_SOON');
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'EXPIRING_SOON'
                  ? 'bg-amber-700 text-white hover:bg-amber-800'
                  : 'bg-white text-amber-800 border border-amber-300 hover:bg-amber-100/60'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{activeTab === 'EXPIRING_SOON' ? 'Show All Contracts' : 'Filter Validity Alerts Only'}</span>
            </button>
          </div>
        </div>
      )}

      {/* FILTER & CONTROL BAR */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-4">
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Contracts ({totalContractsCount})
            </button>

            <button
              onClick={() => setActiveTab('RECURRING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'RECURRING'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Recurring Contracts ({recurringContractsCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('NON_RECURRING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'NON_RECURRING'
                  ? 'bg-cyan-700 text-white shadow-xs'
                  : 'bg-cyan-50 text-cyan-800 hover:bg-cyan-100 border border-cyan-200'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Non-Recurring Delivery & Invoicing ({nonRecurringContractsCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('EXPIRING_SOON')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'EXPIRING_SOON'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Validity Alerts ({expiringAlertsCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('RENEWALS_IN_FLIGHT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'RENEWALS_IN_FLIGHT'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Renewals In Flight ({renewalsInFlightCount})</span>
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-xs text-slate-500 font-medium">
              Showing <strong>{filteredContracts.length}</strong> of <strong>{totalContractsCount}</strong> contracts
            </div>

            {/* View Mode Toggle: Table View vs Calendar View */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl shrink-0">
              <button
                type="button"
                id="btn-view-mode-table"
                onClick={() => setViewMode('TABLE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  viewMode === 'TABLE'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Table View</span>
              </button>
              <button
                type="button"
                id="btn-view-mode-calendar"
                onClick={() => setViewMode('CALENDAR')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  viewMode === 'CALENDAR'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-indigo-700 hover:bg-slate-200/60'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Calendar & Timelines</span>
                {expiringAlertsCount > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                    viewMode === 'CALENDAR' ? 'bg-amber-400 text-amber-950' : 'bg-amber-500 text-white animate-pulse'
                  }`}>
                    {expiringAlertsCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Search & Secondary Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-md xl:max-w-xl 2xl:max-w-2xl">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Contract Code (e.g. CTR-...), Client, Title, Owner, or Budget Code..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Selectors */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Validity Filter */}
            <select
              value={selectedValidityFilter}
              onChange={(e) => setSelectedValidityFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
            >
              <option value="ALL">All Validity Statuses</option>
              <option value="ACTIVE">Active Validity</option>
              <option value="EXPIRING_SOON">Expiring Soon (≤ 60d)</option>
              <option value="EXPIRED">Expired Contracts</option>
            </select>

            {/* BU Selector */}
            <select
              value={selectedBu}
              onChange={(e) => setSelectedBu(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
            >
              <option value="ALL">All Business Units</option>
              <option value="CLOUD_INFRA">Cloud & Infrastructure</option>
              <option value="DIGITAL_APP">Digital & Enterprise Apps</option>
              <option value="ENTERPRISE_AI">Enterprise AI</option>
              <option value="MANAGED_SERVICES">Managed Services</option>
              <option value="CYBERSECURITY">Cybersecurity</option>
            </select>
          </div>

        </div>

      </div>

      {/* CONDITIONAL CONTENT: TABLE VIEW VS CALENDAR VIEW */}
      {viewMode === 'TABLE' ? (
        /* CONTRACTS TABLE */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Contract Code & Type</th>
                  <th className="px-4 py-3">Client & Deal Title</th>
                  <th className="px-4 py-3">BU & Contract Owner</th>
                  <th className="px-4 py-3">Contract Value (TCV)</th>
                  <th className="px-4 py-3">Validity Period & Alert</th>
                  <th className="px-4 py-3">Operational / Renewal Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredContracts.length > 0 ? (
                  filteredContracts.map((opp) => {
                    const contractCode = opp.parallelFinance?.contractCode || opp.contractDetails?.contractNumber || 'CTR-PENDING';
                    const budgetCode = opp.parallelFinance?.budgetCode || 'N/A';
                    const tcv = opp.parallelFinance?.tcv || opp.dealValue || 0;
                    const currency = opp.currency || 'PHP';
                    const isRecurring = isRecurringContract(opp);
                    const validity = getValidityInfo(opp);
                    const renewalRecord = opp.contractRenewalRecord;
                    const hasRenewal = Boolean(renewalRecord);

                    // Non-recurring statuses
                    const isDelivered = opp.cwcRecord?.isAcceptedByClient || opp.currentStage === 'DEAL_CLOSED';
                    const progressPct = opp.parallelPmo?.progressPercentage || (isDelivered ? 100 : 0);
                    const isBilled = Boolean(opp.billingRecord?.confirmedByFinanceDate || opp.billingRecord?.invoiceNumber);
                    const invoiceNum = opp.billingRecord?.invoiceNumber;
                    const paymentStatus = opp.billingRecord?.paymentStatus || 'DRAFT';

                    return (
                      <tr
                        key={opp.id}
                        className={`hover:bg-slate-50/90 transition-colors ${
                          validity.status === 'EXPIRED'
                            ? 'border-l-4 border-l-red-500 bg-red-50/20'
                            : validity.status === 'EXPIRING_SOON'
                            ? 'border-l-4 border-l-amber-500 bg-amber-50/20'
                            : ''
                        }`}
                      >
                        {/* 1. Contract Code & Type */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {contractCode}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center space-x-1.5">
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-extrabold ${
                              isRecurring 
                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' 
                                : 'bg-cyan-100 text-cyan-800 border border-cyan-200'
                            }`}>
                              {isRecurring ? 'RECURRING' : 'NON-RECURRING'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              BC: {budgetCode}
                            </span>
                          </div>
                        </td>

                        {/* 2. Client & Title */}
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900 text-xs hover:text-blue-600 cursor-pointer" onClick={() => onSelectOpportunity(opp)}>
                            {opp.title}
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                            {opp.clientName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {opp.trackingCode}
                          </div>
                        </td>

                        {/* 3. BU & Owner */}
                        <td className="px-4 py-3.5">
                          <div className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-blue-500" />
                            {opp.parallelFinance?.contractOwner || opp.salesLead || 'Unassigned'}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {BU_LABELS[opp.businessUnit] || opp.businessUnit}
                          </div>
                        </td>

                        {/* 4. Contract Amount */}
                        <td className="px-4 py-3.5">
                          <div className="font-extrabold text-slate-900 text-xs">
                            {formatCurrency(tcv, currency)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {opp.parallelFinance?.billingFrequency || 'Milestone Billing'}
                          </div>
                        </td>

                        {/* 5. Validity & Alert */}
                        <td className="px-4 py-3.5">
                          <div className="text-[11px] font-semibold text-slate-700">
                            {formatDate(opp.parallelFinance?.contractStartDate)} → {formatDate(opp.parallelFinance?.contractEndDate)}
                          </div>
                          <div className="mt-1">
                            {validity.status === 'EXPIRED' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-red-100 text-red-800 border border-red-300">
                                <AlertTriangle className="w-3 h-3 text-red-600 animate-pulse shrink-0" />
                                {validity.label}
                              </span>
                            ) : validity.status === 'EXPIRING_SOON' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                                <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                                {validity.label}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                {validity.label}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 6. Operational Status (Recurring Renewals vs Non-recurring Delivery/Billing) */}
                        <td className="px-4 py-3.5">
                          {isRecurring ? (
                            // RECURRING WORKFLOW STATUS
                            <div className="space-y-1">
                              {hasRenewal && renewalRecord?.status === 'IN_PROGRESS' ? (
                                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-100 border border-purple-200 text-purple-900 font-extrabold text-[11px]">
                                  <Sparkles className="w-3 h-3 text-purple-600 animate-pulse" />
                                  <span>
                                    {renewalRecord.currentRenewalStage === 'RENEWAL_TRIGGERED' ? 'R1: BU Scope Update' :
                                     renewalRecord.currentRenewalStage === 'BU_SCOPE_UPDATED' ? 'R2: Contracts Review' :
                                     renewalRecord.currentRenewalStage === 'CONTRACTS_REVIEW' ? 'R3: Contracts Review' :
                                     renewalRecord.currentRenewalStage === 'FINANCE_APPROVAL' ? 'R4: Finance Sign-off' :
                                     renewalRecord.currentRenewalStage === 'SALES_CLIENT_SIGNING' ? 'R5: Client Signing & PO' :
                                     renewalRecord.currentRenewalStage === 'CCM_TAGGING' ? 'R6: CCM Date Tagging' :
                                     'Renewal Active'}
                                  </span>
                                </div>
                              ) : hasRenewal && renewalRecord?.status === 'COMPLETED' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Renewed (Cycle #{renewalRecord.cycleNumber})
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                                  Standard Active Term
                                </span>
                              )}
                              <div className="text-[10px] text-slate-400">
                                {renewalRecord?.renewalReason ? renewalRecord.renewalReason : 'Annual recurring contract'}
                              </div>
                            </div>
                          ) : (
                            // NON-RECURRING DELIVERY & INVOICING STATUS
                            <div className="space-y-1">
                              <div className="flex items-center space-x-1.5 text-[11px]">
                                <span className={`px-1.5 py-0.2 rounded font-bold ${
                                  isDelivered ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {isDelivered ? 'Delivered' : `${progressPct}% Delivery`}
                                </span>
                                <span className={`px-1.5 py-0.2 rounded font-bold ${
                                  paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                                  paymentStatus === 'ISSUED' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {paymentStatus}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                {invoiceNum ? `Inv: ${invoiceNum}` : isBilled ? 'Billed' : 'Pending CWC'}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* 7. Action Buttons */}
                        <td className="px-4 py-3.5 text-right space-x-1.5">
                          {isRecurring ? (
                            <button
                              type="button"
                              onClick={() => setSelectedRenewalOpp(opp)}
                              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-all cursor-pointer"
                            >
                              <RefreshCw className="w-3.5 h-3.5 mr-1" />
                              {hasRenewal && renewalRecord?.status === 'IN_PROGRESS' ? 'Manage Renewal' : 'Trigger Renewal'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedNonRecurringOpp(opp)}
                              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-700 hover:bg-cyan-800 text-white shadow-2xs transition-all cursor-pointer"
                            >
                              <Truck className="w-3.5 h-3.5 mr-1" />
                              Inspect Status
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onSelectOpportunity(opp)}
                            title="Open Full Opportunity Cockpit"
                            className="inline-flex items-center p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <FileText className="w-8 h-8 text-slate-300" />
                        <div className="font-semibold text-slate-600">No matching contracts found</div>
                        <div className="text-xs text-slate-400">
                          {searchQuery ? `No contracts matching "${searchQuery}"` : 'Opportunities that receive a Contract Code from Finance in Stage 12 will appear here.'}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* DATE-BASED CALENDAR & PROACTIVE TIMELINES VISUALIZATION */
        <div className="space-y-6">
          {/* Calendar Header Controls */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700">
                    <CalendarDays className="w-4 h-4" />
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Contract Expiration & Renewal Schedule
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                    Proactive Timeline Manager
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Interactive monthly calendar highlighting contract expiration deadlines, renewal review milestones, and active validity periods.
                </p>
              </div>

              {/* Month Navigation & Today Shortcut */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-all cursor-pointer"
                    title="Previous Month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-1 font-bold text-xs text-slate-900 min-w-[120px] text-center">
                    {MONTH_NAMES[calendarMonth]} {calendarYear}
                  </span>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-all cursor-pointer"
                    title="Next Month"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleGoToCurrentMonth}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                >
                  Jump to Oct 2026
                </button>
              </div>
            </div>

            {/* Quick Month Shortcuts & Legend */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              {/* Quick Month Tabs */}
              <div className="flex items-center flex-wrap gap-1.5">
                {[
                  { m: 7, y: 2026, label: 'Aug 2026' },
                  { m: 8, y: 2026, label: 'Sep 2026' },
                  { m: 9, y: 2026, label: 'Oct 2026 (Active)' },
                  { m: 10, y: 2026, label: 'Nov 2026' },
                  { m: 11, y: 2026, label: 'Dec 2026' },
                  { m: 7, y: 2027, label: 'Aug 2027' },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCalendarMonth(item.m);
                      setCalendarYear(item.y);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      calendarMonth === item.m && calendarYear === item.y
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Color Legend */}
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                  <span>Expired</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <span>Expiring Soon (≤ 60d)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                  <span>Renewal Target / In-Flight</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>Active (&gt; 60d)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full ring-2 ring-blue-600 bg-blue-100 shrink-0" />
                  <span>Today</span>
                </span>
              </div>
            </div>
          </div>

          {/* 2-Column Layout: Month Grid + Proactive Agenda Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Calendar 7-Day Matrix (8 cols on lg) */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs flex flex-col">
              {/* Day of Week Header */}
              <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 text-center py-2.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              {/* Grid Cells */}
              <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 flex-1">
                {calendarGridCells.map((cell, idx) => {
                  const dayEvents = eventsByDate[cell.dateStr] || [];
                  const hasEvents = dayEvents.length > 0;

                  return (
                    <div
                      key={idx}
                      className={`min-h-[110px] 2xl:min-h-[125px] p-2 flex flex-col justify-between transition-colors ${
                        !cell.isCurrentMonth
                          ? 'bg-slate-50/50 text-slate-300'
                          : cell.isToday
                          ? 'bg-blue-50/30'
                          : 'bg-white hover:bg-slate-50/60'
                      }`}
                    >
                      {/* Cell Header: Day Number + Today indicator */}
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${
                          cell.isToday
                            ? 'w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-black shadow-xs'
                            : cell.isCurrentMonth
                            ? 'text-slate-800'
                            : 'text-slate-400'
                        }`}>
                          {cell.dayNum}
                        </span>
                        {cell.isToday && (
                          <span className="text-[9px] font-black uppercase text-blue-600 bg-blue-100 px-1 py-0.2 rounded">
                            Today
                          </span>
                        )}
                        {hasEvents && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                        )}
                      </div>

                      {/* Events Container */}
                      <div className="space-y-1.5 my-1">
                        {dayEvents.map((ev, evIdx) => {
                          const isExpired = ev.status === 'EXPIRED';
                          const isExpiringSoon = ev.status === 'EXPIRING_SOON';
                          const isRenewal = ev.type === 'RENEWAL_TARGET';

                          return (
                            <div
                              key={evIdx}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (ev.isRecurring) {
                                  setSelectedRenewalOpp(ev.opp);
                                } else {
                                  setSelectedNonRecurringOpp(ev.opp);
                                }
                              }}
                              className={`p-1.5 rounded-lg border text-left shadow-2xs cursor-pointer transition-transform hover:scale-[1.02] ${
                                isExpired
                                  ? 'bg-red-50 border-red-300 text-red-950 hover:bg-red-100'
                                  : isExpiringSoon
                                  ? 'bg-amber-50 border-amber-300 text-amber-950 hover:bg-amber-100'
                                  : isRenewal
                                  ? 'bg-purple-50 border-purple-300 text-purple-950 hover:bg-purple-100'
                                  : 'bg-emerald-50 border-emerald-300 text-emerald-950 hover:bg-emerald-100'
                              }`}
                              title={`${ev.title} - ${ev.clientName} (${ev.opp.title})`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-mono text-[10px] font-bold truncate">
                                  {ev.contractCode}
                                </span>
                                <span className={`px-1 py-0.2 rounded text-[8px] font-black shrink-0 ${
                                  isExpired
                                    ? 'bg-red-600 text-white'
                                    : isExpiringSoon
                                    ? 'bg-amber-600 text-white'
                                    : isRenewal
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-emerald-600 text-white'
                                }`}>
                                  {isExpired ? 'EXPIRED' : isExpiringSoon ? `${ev.daysRemaining}d` : isRenewal ? 'RENEWAL' : 'VALID'}
                                </span>
                              </div>
                              <div className="text-[10px] font-semibold truncate mt-0.5 text-slate-700">
                                {ev.clientName}
                              </div>
                              <div className="text-[9px] text-slate-500 truncate flex items-center justify-between mt-0.5">
                                <span>{ev.isRecurring ? 'Recurring' : 'Fixed Scope'}</span>
                                <span className="text-indigo-600 font-bold hover:underline">Manage →</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Proactive Timelines & Renewal Agenda Sidebar (4 cols on lg) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <span className="p-1 rounded-lg bg-indigo-100 text-indigo-700">
                      <Clock className="w-4 h-4" />
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">
                      Upcoming Action Queue
                    </h4>
                  </div>
                  <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                    {upcomingTimelines.length} Contracts
                  </span>
                </div>

                {/* Timeline Queue Items */}
                <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                  {upcomingTimelines.map((item) => {
                    const isExpired = item.validity.status === 'EXPIRED';
                    const isExpiringSoon = item.validity.status === 'EXPIRING_SOON';
                    const renewalInFlight = item.renewalRecord && item.renewalRecord.status === 'IN_PROGRESS';

                    return (
                      <div
                        key={item.opp.id}
                        className={`p-3.5 rounded-xl border transition-all shadow-2xs space-y-2.5 ${
                          isExpired
                            ? 'bg-red-50/40 border-red-200 hover:border-red-300'
                            : isExpiringSoon
                            ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {/* Status banner */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                              {item.contractCode}
                            </span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                              item.isRecurring ? 'bg-indigo-100 text-indigo-800' : 'bg-cyan-100 text-cyan-800'
                            }`}>
                              {item.isRecurring ? 'Recurring' : 'Non-Recurring'}
                            </span>
                          </div>

                          {isExpired ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black bg-red-100 text-red-800 px-2 py-0.5 rounded border border-red-300">
                              <AlertTriangle className="w-3 h-3 text-red-600 animate-pulse" />
                              {item.validity.label}
                            </span>
                          ) : isExpiringSoon ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                              <Clock className="w-3 h-3 text-amber-600" />
                              {item.validity.label}
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {item.validity.label}
                            </span>
                          )}
                        </div>

                        {/* Title & Client */}
                        <div>
                          <h5 
                            onClick={() => onSelectOpportunity(item.opp)}
                            className="font-bold text-xs text-slate-900 hover:text-blue-600 cursor-pointer line-clamp-1"
                          >
                            {item.opp.title}
                          </h5>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {item.opp.clientName} • {BU_LABELS[item.opp.businessUnit] || item.opp.businessUnit}
                          </div>
                        </div>

                        {/* Dates & Values */}
                        <div className="flex items-center justify-between text-[11px] text-slate-600 pt-2 border-t border-slate-100">
                          <div>
                            <span className="text-slate-400">Expires: </span>
                            <strong className="text-slate-800">{formatDate(item.endDate)}</strong>
                          </div>
                          <div className="font-extrabold text-slate-900">
                            {formatCurrency(item.opp.parallelFinance?.tcv || item.opp.dealValue || 0, item.opp.currency)}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between pt-1">
                          {item.isRecurring ? (
                            <button
                              type="button"
                              onClick={() => setSelectedRenewalOpp(item.opp)}
                              className="w-full inline-flex items-center justify-center py-1.5 px-3 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-2xs cursor-pointer"
                            >
                              <RefreshCw className="w-3.5 h-3.5 mr-1" />
                              {renewalInFlight ? 'Manage Active Renewal' : 'Trigger Renewal Workflow'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedNonRecurringOpp(item.opp)}
                              className="w-full inline-flex items-center justify-center py-1.5 px-3 rounded-lg text-xs font-bold bg-cyan-700 hover:bg-cyan-800 text-white transition-all shadow-2xs cursor-pointer"
                            >
                              <Truck className="w-3.5 h-3.5 mr-1" />
                              Inspect Delivery & Billing
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Proactive SLA Playbook Box */}
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl border border-indigo-200 p-4 text-xs space-y-2 shadow-2xs">
                <div className="flex items-center space-x-2 text-indigo-900 font-bold">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Proactive Renewal SLA Playbook</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Enterprise best practice: Contracts team triggers renewal cycles <strong>45–60 days</strong> before contract expiration. This accommodates:
                </p>
                <ul className="text-[11px] text-slate-700 space-y-1 list-disc list-inside">
                  <li><strong>Stage 2:</strong> BU scope modifications & cost adjustment</li>
                  <li><strong>Stage 3/4:</strong> Contracts & Finance margin threshold sign-off</li>
                  <li><strong>Stage 5/6:</strong> Sales client release, DocuSign signing & CCM tagging</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RENEWAL WORKFLOW MODAL */}
      <RenewalWorkflowModal
        isOpen={Boolean(selectedRenewalOpp)}
        opportunity={selectedRenewalOpp}
        currentUser={currentUser}
        onClose={() => setSelectedRenewalOpp(null)}
        onUpdateOpportunity={(updated) => {
          onUpdateOpportunity(updated);
          setSelectedRenewalOpp(updated);
        }}
      />

      {/* NON-RECURRING CONTRACT DETAILS MODAL */}
      <NonRecurringContractModal
        isOpen={Boolean(selectedNonRecurringOpp)}
        opportunity={selectedNonRecurringOpp}
        onClose={() => setSelectedNonRecurringOpp(null)}
        onOpenOpportunityCockpit={(opp) => {
          setSelectedNonRecurringOpp(null);
          onSelectOpportunity(opp);
        }}
      />

    </div>
  );
};
