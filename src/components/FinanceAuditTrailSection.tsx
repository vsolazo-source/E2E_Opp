import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  User, 
  Layers, 
  ShieldCheck, 
  Sparkles, 
  FileText,
  AlertCircle,
  ArrowRight,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Opportunity, FinanceAuditEntry, WorkflowStage } from '../types';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';
import { buildFinanceAuditTrail } from '../utils/financeAuditHelper';

interface FinanceAuditTrailSectionProps {
  opportunity: Opportunity;
}

export const FinanceAuditTrailSection: React.FC<FinanceAuditTrailSectionProps> = ({
  opportunity,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'CHANGES_ONLY' | 'RETURNS_ONLY'>('ALL');
  const [isExpanded, setIsExpanded] = useState(true);

  const auditEntries = buildFinanceAuditTrail(opportunity);

  // Compute key comparison metrics
  const firstEntry = auditEntries[0];
  const lastEntry = auditEntries[auditEntries.length - 1];
  const initialValue = firstEntry?.amount || opportunity.dealValue || 0;
  const latestValue = lastEntry?.amount || opportunity.dealValue || 0;
  const netVariance = latestValue - initialValue;
  const netVariancePercent = initialValue > 0 ? (netVariance / initialValue) * 100 : 0;

  const returnCount = auditEntries.filter((e) => e.isReturn || e.eventType === 'STAGE_RETURN').length;
  const valueChangeCount = auditEntries.filter((e) => (e.variance && Math.abs(e.variance) > 0)).length;

  const filteredEntries = auditEntries.filter((e) => {
    if (filterType === 'RETURNS_ONLY') return e.isReturn || e.eventType === 'STAGE_RETURN';
    if (filterType === 'CHANGES_ONLY') return (e.variance && Math.abs(e.variance) > 0) || e.eventType === 'SALES_FORECAST';
    return true;
  });

  const getEventBadge = (entry: FinanceAuditEntry) => {
    if (entry.isReturn || entry.eventType === 'STAGE_RETURN') {
      return {
        bg: 'bg-amber-100 text-amber-900 border-amber-300',
        icon: <RotateCcw className="w-3 h-3 text-amber-700 shrink-0" />,
        label: 'Stage Returned / Reverted',
      };
    }
    switch (entry.eventType) {
      case 'SALES_FORECAST':
        return {
          bg: 'bg-blue-100 text-blue-900 border-blue-300',
          icon: <Sparkles className="w-3 h-3 text-blue-700 shrink-0" />,
          label: 'Initial Sales Forecast',
        };
      case 'PROPOSED_TCV':
        return {
          bg: 'bg-indigo-100 text-indigo-900 border-indigo-300',
          icon: <Layers className="w-3 h-3 text-indigo-700 shrink-0" />,
          label: 'Solution Proposed TCV',
        };
      case 'SALES_ENDORSEMENT':
        return {
          bg: 'bg-cyan-100 text-cyan-900 border-cyan-300',
          icon: <CheckCircle2 className="w-3 h-3 text-cyan-700 shrink-0" />,
          label: 'Sales Endorsement',
        };
      case 'CONTRACTS_REVIEW':
        return {
          bg: 'bg-teal-100 text-teal-900 border-teal-300',
          icon: <FileText className="w-3 h-3 text-teal-700 shrink-0" />,
          label: 'Contracts Review',
        };
      case 'INITIAL_FINANCE_APPROVAL':
        return {
          bg: 'bg-purple-100 text-purple-900 border-purple-300',
          icon: <ShieldCheck className="w-3 h-3 text-purple-700 shrink-0" />,
          label: 'Initial Finance Approval',
        };
      case 'CLIENT_NEGOTIATION':
        return {
          bg: 'bg-orange-100 text-orange-900 border-orange-300',
          icon: <DollarSign className="w-3 h-3 text-orange-700 shrink-0" />,
          label: 'Client Negotiation',
        };
      case 'CONTRACT_CONVERSION':
        return {
          bg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          icon: <FileText className="w-3 h-3 text-emerald-700 shrink-0" />,
          label: 'Contract Conversion',
        };
      case 'FINAL_FINANCE_APPROVAL':
        return {
          bg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          icon: <ShieldCheck className="w-3 h-3 text-emerald-700 shrink-0" />,
          label: 'Final Finance Sign-Off (Locked)',
        };
      case 'ADMIN_OVERRIDE':
        return {
          bg: 'bg-rose-100 text-rose-900 border-rose-300',
          icon: <AlertCircle className="w-3 h-3 text-rose-700 shrink-0" />,
          label: 'Admin Manual Override',
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-800 border-slate-300',
          icon: <Clock className="w-3 h-3 text-slate-600 shrink-0" />,
          label: 'Workflow Update',
        };
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Section Header */}
      <div className="p-4 bg-gradient-to-r from-slate-50 via-slate-50 to-blue-50/40 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-purple-700 text-white flex items-center justify-center shadow-xs shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-slate-900 text-sm">Finance & Commercial Value Audit Trail</h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
                {auditEntries.length} Checkpoints
              </span>
              {returnCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                  <RotateCcw className="w-2.5 h-2.5" />
                  {returnCount} {returnCount === 1 ? 'Stage Return' : 'Stage Returns'}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Tracks value progression from Sales Forecast to Solution TCV, Approvals, Negotiations, and Returns.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {/* Filter options */}
          <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-[11px] font-semibold text-slate-700">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterType === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              All ({auditEntries.length})
            </button>
            <button
              onClick={() => setFilterType('CHANGES_ONLY')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterType === 'CHANGES_ONLY' ? 'bg-white text-purple-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Value Deltas ({valueChangeCount + 1})
            </button>
            {returnCount > 0 && (
              <button
                onClick={() => setFilterType('RETURNS_ONLY')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filterType === 'RETURNS_ONLY' ? 'bg-white text-amber-900 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Returns ({returnCount})
              </button>
            )}
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title={isExpanded ? 'Collapse section' : 'Expand section'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Key Value Progression Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-200">
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block mb-0.5">
                1. Initial Sales Forecast
              </span>
              <span className="text-sm font-extrabold text-slate-800 block">
                {formatCurrency(initialValue, opportunity.currency)}
              </span>
              <span className="text-[10px] text-slate-500 block">
                Logged at Opportunity Intake
              </span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block mb-0.5">
                2. Solution Proposed TCV
              </span>
              <span className="text-sm font-extrabold text-blue-700 block">
                {formatCurrency(opportunity.dealValue, opportunity.currency)}
              </span>
              <span className="text-[10px] text-slate-500 block">
                {opportunity.solutionProposal?.ibsiInternalCost
                  ? `Cost: ${formatCurrency(opportunity.solutionProposal.ibsiInternalCost, opportunity.solutionProposal.ibsiInternalCurrency || opportunity.currency)}`
                  : 'Pending SA costing'}
              </span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block mb-0.5">
                3. Current Active Value
              </span>
              <span className="text-sm font-extrabold text-emerald-700 block">
                {formatCurrency(latestValue, opportunity.currency)}
              </span>
              <span className="text-[10px] text-slate-500 block">
                Stage: {opportunity.currentStage.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block mb-0.5">
                Net Value Progression Delta
              </span>
              {netVariance === 0 ? (
                <div>
                  <span className="text-sm font-extrabold text-slate-700 block">
                    No Net Variance ($0)
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Maintained at 100% of baseline
                  </span>
                </div>
              ) : netVariance > 0 ? (
                <div>
                  <span className="text-sm font-extrabold text-emerald-700 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    +{formatCurrency(netVariance, opportunity.currency)} (+{netVariancePercent.toFixed(1)}%)
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold block">
                    Scope / value expanded from intake
                  </span>
                </div>
              ) : (
                <div>
                  <span className="text-sm font-extrabold text-amber-700 flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5" />
                    {formatCurrency(netVariance, opportunity.currency)} ({netVariancePercent.toFixed(1)}%)
                  </span>
                  <span className="text-[10px] text-amber-600 font-semibold block">
                    Commercial discount or scope adjustment
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Chronological Audit Trail Timeline */}
          <div className="relative pl-6 sm:pl-8 space-y-4 before:content-[''] before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {filteredEntries.map((entry, idx) => {
              const badge = getEventBadge(entry);
              const isInitial = idx === 0;
              const hasDelta = entry.variance !== undefined && Math.abs(entry.variance) > 0;
              const isPositive = entry.variance && entry.variance > 0;

              return (
                <div
                  key={entry.id || idx}
                  className={`relative p-3.5 sm:p-4 rounded-xl border transition-all ${
                    entry.isReturn
                      ? 'bg-amber-50/70 border-amber-200'
                      : entry.eventType === 'INITIAL_FINANCE_APPROVAL' || entry.eventType === 'FINAL_FINANCE_APPROVAL'
                      ? 'bg-purple-50/40 border-purple-200'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Timeline node icon */}
                  <div
                    className={`absolute -left-6 sm:-left-8 top-3.5 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shadow-xs ${
                      entry.isReturn
                        ? 'bg-amber-500 border-white text-white'
                        : entry.eventType === 'INITIAL_FINANCE_APPROVAL' || entry.eventType === 'FINAL_FINANCE_APPROVAL'
                        ? 'bg-purple-600 border-white text-white'
                        : entry.eventType === 'SALES_FORECAST'
                        ? 'bg-blue-600 border-white text-white'
                        : 'bg-slate-700 border-white text-white'
                    }`}
                  >
                    {idx + 1}
                  </div>

                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200/80">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-xs text-slate-900">
                        {entry.stageName || entry.stage}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}
                      >
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <User className="w-3 h-3 text-slate-400" />
                        {entry.actorName} ({entry.actorRole})
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {formatDateTime(entry.timestamp)}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                    {/* Left: Financial Metric Snapshot */}
                    <div className="md:col-span-5 bg-slate-50/90 p-3 rounded-lg border border-slate-200 space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                          Deal Value / TCV:
                        </span>
                        <span className="text-base font-black text-slate-900">
                          {formatCurrency(entry.amount, entry.currency)}
                        </span>
                      </div>

                      {/* Delta Tag */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                        <span className="text-slate-500">Step Variance:</span>
                        {isInitial ? (
                          <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold text-[10px]">
                            ★ Baseline Forecast
                          </span>
                        ) : hasDelta ? (
                          isPositive ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] inline-flex items-center gap-0.5">
                              <TrendingUp className="w-3 h-3" />
                              +{formatCurrency(entry.variance, entry.currency)} (+{entry.variancePercent?.toFixed(1)}%)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px] inline-flex items-center gap-0.5">
                              <TrendingDown className="w-3 h-3" />
                              {formatCurrency(entry.variance, entry.currency)} ({entry.variancePercent?.toFixed(1)}%)
                            </span>
                          )
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700 font-semibold text-[10px]">
                            No Value Change (Confirmed)
                          </span>
                        )}
                      </div>

                      {/* Internal Cost & Margin (if present) */}
                      {(entry.internalCost !== undefined || entry.marginPercent !== undefined) && (
                        <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-600">
                          {entry.internalCost !== undefined && (
                            <span>
                              Cost: <strong>{formatCurrency(entry.internalCost, entry.internalCurrency || entry.currency)}</strong>
                            </span>
                          )}
                          {entry.marginPercent !== undefined && (
                            <span className={`font-bold ${entry.marginPercent >= 25 ? 'text-emerald-700' : 'text-amber-700'}`}>
                              Margin: {entry.marginPercent.toFixed(1)}%
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right: Notes, Action Description & Return Justification */}
                    <div className="md:col-span-7 space-y-2">
                      <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                        <span className="text-purple-700">Action:</span>
                        <span>{entry.actionLabel}</span>
                      </div>

                      {/* Return Alert Box if this was a revert/return step */}
                      {entry.isReturn && (
                        <div className="p-2.5 rounded-lg bg-amber-100/80 border border-amber-300 text-amber-950 text-xs space-y-1">
                          <div className="font-bold flex items-center gap-1.5 text-amber-900">
                            <RotateCcw className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                            <span>Workflow Reversal / Return Notice</span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-amber-900">
                            <strong>Reason:</strong> {entry.notes || 'Returned to previous stage for commercial or technical revision.'}
                          </p>
                        </div>
                      )}

                      {/* Standard Notes */}
                      {!entry.isReturn && entry.notes && (
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-[11px] leading-relaxed">
                          <span className="font-semibold text-slate-800 block mb-0.5">Audit Remarks & Context:</span>
                          <p>{entry.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
