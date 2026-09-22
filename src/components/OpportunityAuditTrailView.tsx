import React, { useState, useMemo } from 'react';
import {
  Opportunity,
  AuditLogEntry,
  WorkflowStage,
  AcknowledgedDateChangeEntry,
  FieldChangeEntry,
} from '../types';
import { STAGE_MAP } from '../data/stages';
import { UserProfile } from '../types/rbac';
import { formatDateTime } from '../utils/formatters';
import {
  Calendar,
  Clock,
  User,
  Shield,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Search,
  Download,
  FileText,
  Edit3,
  Tag,
  Check,
  Filter,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface OpportunityAuditTrailViewProps {
  opportunity: Opportunity;
  currentUser?: UserProfile | null;
  compact?: boolean;
}

type EventFilterType = 'ALL' | 'ACKNOWLEDGE_DATE' | 'FIELD_UPDATE' | 'STAGE_TRANSITION' | 'ADMIN_OVERRIDE';

export const OpportunityAuditTrailView: React.FC<OpportunityAuditTrailViewProps> = ({
  opportunity,
  currentUser,
  compact = false,
}) => {
  const [filterType, setFilterType] = useState<EventFilterType>('ALL');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedEntries, setExpandedEntries] = useState<Record<string, boolean>>({});

  const history = useMemo(() => {
    return opportunity.history || [];
  }, [opportunity.history]);

  // Derived counts for quick filter buttons
  const counts = useMemo(() => {
    let ackDates = 0;
    let fieldUpdates = 0;
    let stageTransitions = 0;
    let adminOverrides = 0;

    history.forEach((entry) => {
      const isAck =
        entry.changeType === 'ACKNOWLEDGE_DATE' ||
        !!entry.acknowledgedDateChange ||
        /acknowledge|start date|sla clock/i.test(entry.action);

      const isField =
        entry.changeType === 'FIELD_UPDATE' ||
        (entry.fieldChanges && entry.fieldChanges.length > 0) ||
        /field update|modified/i.test(entry.action);

      const isOverride =
        entry.changeType === 'ADMIN_OVERRIDE' ||
        /override|reset/i.test(entry.action);

      const isTrans =
        entry.changeType === 'STAGE_TRANSITION' ||
        entry.isApproval ||
        entry.isReturn ||
        (!isAck && !isField && !isOverride);

      if (isAck) ackDates++;
      if (isField) fieldUpdates++;
      if (isOverride) adminOverrides++;
      if (isTrans) stageTransitions++;
    });

    return {
      all: history.length,
      ackDates,
      fieldUpdates,
      stageTransitions,
      adminOverrides,
    };
  }, [history]);

  // Filter and sort entries (latest first)
  const filteredEntries = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return [...history].reverse().filter((entry) => {
      // 1. Filter Type
      const isAck =
        entry.changeType === 'ACKNOWLEDGE_DATE' ||
        !!entry.acknowledgedDateChange ||
        /acknowledge|start date|sla clock/i.test(entry.action);

      const isField =
        entry.changeType === 'FIELD_UPDATE' ||
        (entry.fieldChanges && entry.fieldChanges.length > 0) ||
        /field update|modified/i.test(entry.action);

      const isOverride =
        entry.changeType === 'ADMIN_OVERRIDE' ||
        /override|reset/i.test(entry.action);

      const isTrans =
        entry.changeType === 'STAGE_TRANSITION' ||
        entry.isApproval ||
        entry.isReturn ||
        (!isAck && !isField && !isOverride);

      if (filterType === 'ACKNOWLEDGE_DATE' && !isAck) return false;
      if (filterType === 'FIELD_UPDATE' && !isField) return false;
      if (filterType === 'ADMIN_OVERRIDE' && !isOverride) return false;
      if (filterType === 'STAGE_TRANSITION' && !isTrans) return false;

      // 2. Stage Filter
      if (stageFilter !== 'ALL' && entry.stage !== stageFilter) {
        return false;
      }

      // 3. Search Query
      if (q) {
        const textToSearch = [
          entry.action,
          entry.actionOwner,
          entry.actorName,
          entry.actorRole,
          entry.actorEmail,
          entry.comments,
          entry.acknowledgedDateChange?.fieldLabel,
          entry.acknowledgedDateChange?.newDate,
          ...(entry.fieldChanges?.map((f) => `${f.fieldLabel} ${f.oldValue} ${f.newValue}`) || []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!textToSearch.includes(q)) return false;
      }

      return true;
    });
  }, [history, filterType, stageFilter, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedEntries((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // CSV Export for Compliance and Audit
  const handleExportCSV = () => {
    if (history.length === 0) return;

    const headers = [
      'Timestamp',
      'Stage',
      'Stage Label',
      'Action',
      'Action Owner',
      'Actor Name',
      'Actor Role',
      'Actor Email',
      'Event Type',
      'Acknowledged Date Change',
      'Field Updates Summary',
      'Comments',
      'Deal Value',
      'Currency',
    ];

    const rows = history.map((e) => {
      const stageLabel = STAGE_MAP[e.stage]?.label || e.stage;
      const ackStr = e.acknowledgedDateChange
        ? `${e.acknowledgedDateChange.fieldLabel}: ${e.acknowledgedDateChange.oldDate || 'None'} -> ${e.acknowledgedDateChange.newDate}`
        : '';
      const fieldStr = (e.fieldChanges || [])
        .map((f) => `${f.fieldLabel}: [${f.oldValue}] -> [${f.newValue}]`)
        .join('; ');

      return [
        `"${e.timestamp}"`,
        `"${e.stage}"`,
        `"${stageLabel}"`,
        `"${(e.action || '').replace(/"/g, '""')}"`,
        `"${(e.actionOwner || `${e.actorName} (${e.actorRole})`).replace(/"/g, '""')}"`,
        `"${(e.actorName || '').replace(/"/g, '""')}"`,
        `"${(e.actorRole || '').replace(/"/g, '""')}"`,
        `"${(e.actorEmail || '').replace(/"/g, '""')}"`,
        `"${e.changeType || 'STAGE_TRANSITION'}"`,
        `"${ackStr.replace(/"/g, '""')}"`,
        `"${fieldStr.replace(/"/g, '""')}"`,
        `"${(e.comments || '').replace(/"/g, '""')}"`,
        e.dealValue !== undefined ? e.dealValue : '',
        `"${e.currency || opportunity.currency || 'USD'}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Audit_Trail_${opportunity.trackingCode}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Header & Export Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-indigo-600" />
            <h4 className="font-bold text-slate-900 text-sm">Opportunity Lifecycle Audit Trail</h4>
            <span className="text-[11px] font-semibold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
              {history.length} Events Logged
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Full compliance traceability across all 15 stages: Acknowledged Start Dates, Field Updates, and Action Owners.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            disabled={history.length === 0}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 shadow-xs flex items-center space-x-1.5 transition-colors disabled:opacity-50"
            title="Download complete audit log as CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5 ${
              filterType === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <span>All Events</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filterType === 'ALL' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {counts.all}
            </span>
          </button>

          <button
            onClick={() => setFilterType('ACKNOWLEDGE_DATE')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5 ${
              filterType === 'ACKNOWLEDGE_DATE'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/60'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Acknowledged Dates</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filterType === 'ACKNOWLEDGE_DATE' ? 'bg-amber-700 text-white' : 'bg-amber-200/80 text-amber-900'}`}>
              {counts.ackDates}
            </span>
          </button>

          <button
            onClick={() => setFilterType('FIELD_UPDATE')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5 ${
              filterType === 'FIELD_UPDATE'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200/60'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Field Updates</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filterType === 'FIELD_UPDATE' ? 'bg-sky-700 text-white' : 'bg-sky-200/80 text-sky-900'}`}>
              {counts.fieldUpdates}
            </span>
          </button>

          <button
            onClick={() => setFilterType('STAGE_TRANSITION')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5 ${
              filterType === 'STAGE_TRANSITION'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Stage Transitions</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filterType === 'STAGE_TRANSITION' ? 'bg-emerald-800 text-white' : 'bg-emerald-200/80 text-emerald-900'}`}>
              {counts.stageTransitions}
            </span>
          </button>

          {counts.adminOverrides > 0 && (
            <button
              onClick={() => setFilterType('ADMIN_OVERRIDE')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5 ${
                filterType === 'ADMIN_OVERRIDE'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200/60'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Overrides</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filterType === 'ADMIN_OVERRIDE' ? 'bg-purple-700 text-white' : 'bg-purple-200/80 text-purple-900'}`}>
                {counts.adminOverrides}
              </span>
            </button>
          )}
        </div>

        {/* Search bar & Stage dropdown */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by field name, action owner, actor, or comment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="sm:w-60">
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Stages (1 - 15)</option>
              {Object.entries(STAGE_MAP).map(([key, def]) => (
                <option key={key} value={key}>
                  Stage {def.index}: {def.shortLabel}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Audit Entries List */}
      <div className="space-y-3">
        {filteredEntries.length > 0 ? (
          filteredEntries.map((entry, idx) => {
            const stageDef = STAGE_MAP[entry.stage];
            const stageLabel = stageDef ? `Stage ${stageDef.index}: ${stageDef.label}` : entry.stage;

            const isAck =
              entry.changeType === 'ACKNOWLEDGE_DATE' ||
              !!entry.acknowledgedDateChange ||
              /acknowledge|start date|sla clock/i.test(entry.action);

            const isField =
              entry.changeType === 'FIELD_UPDATE' ||
              (entry.fieldChanges && entry.fieldChanges.length > 0) ||
              /field update|modified/i.test(entry.action);

            const isOverride =
              entry.changeType === 'ADMIN_OVERRIDE' ||
              /override|reset/i.test(entry.action);

            const isReturn =
              entry.isReturn ||
              entry.changeType === 'RETURN' ||
              /return|revert|send back/i.test(entry.action);

            const isExpanded = expandedEntries[entry.id] ?? true;

            // Action Owner formatting
            const actionOwnerStr =
              entry.actionOwner ||
              `${entry.actorName} (${entry.actorRole})${entry.actorEmail ? ` <${entry.actorEmail}>` : ''}`;

            return (
              <div
                key={entry.id || idx}
                className={`rounded-xl border transition-shadow bg-white overflow-hidden shadow-xs ${
                  isAck
                    ? 'border-amber-200 hover:border-amber-300'
                    : isField
                    ? 'border-sky-200 hover:border-sky-300'
                    : isOverride
                    ? 'border-purple-200 hover:border-purple-300'
                    : isReturn
                    ? 'border-rose-200 hover:border-rose-300'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Entry Header */}
                <div
                  className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer select-none ${
                    isAck
                      ? 'bg-amber-50/70 border-b border-amber-100'
                      : isField
                      ? 'bg-sky-50/70 border-b border-sky-100'
                      : isOverride
                      ? 'bg-purple-50/70 border-b border-purple-100'
                      : isReturn
                      ? 'bg-rose-50/70 border-b border-rose-100'
                      : 'bg-slate-50/80 border-b border-slate-100'
                  }`}
                  onClick={() => toggleExpand(entry.id)}
                >
                  <div className="flex items-start sm:items-center space-x-2.5">
                    {/* Event Type Icon Pill */}
                    {isAck ? (
                      <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Calendar className="w-4 h-4" />
                      </div>
                    ) : isField ? (
                      <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Edit3 className="w-4 h-4" />
                      </div>
                    ) : isOverride ? (
                      <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Shield className="w-4 h-4" />
                      </div>
                    ) : isReturn ? (
                      <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <RotateCcw className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}

                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">
                          {entry.action}
                        </span>

                        {/* Badges */}
                        {isAck && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md border border-amber-300/60">
                            Acknowledged Start Date
                          </span>
                        )}
                        {isField && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-sky-100 text-sky-800 rounded-md border border-sky-300/60">
                            Field Updates
                          </span>
                        )}
                        {isOverride && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-purple-100 text-purple-800 rounded-md border border-purple-300/60">
                            Admin Override
                          </span>
                        )}
                        {isReturn && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-rose-100 text-rose-800 rounded-md border border-rose-300/60">
                            Stage Return
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="font-medium text-slate-700 bg-white/80 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                          {stageLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-right">
                    <div className="text-right">
                      <div className="text-xs font-semibold text-slate-700">
                        {formatDateTime(entry.timestamp)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(entry.timestamp).toLocaleDateString(undefined, {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                    <button className="text-slate-400 hover:text-slate-600 p-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Entry Body */}
                {isExpanded && (
                  <div className="p-4 space-y-3.5">
                    {/* OWNER OF THE ACTION BADGE / CARD */}
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                          {entry.actorName ? entry.actorName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                              Owner of Action:
                            </span>
                            <span className="font-bold text-slate-900">{entry.actorName}</span>
                            {entry.actorTitle && (
                              <span className="text-slate-500 font-medium">({entry.actorTitle})</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                            <span>Role: <strong className="text-slate-700">{entry.actorRole}</strong></span>
                            {entry.actorEmail && (
                              <>
                                <span>•</span>
                                <span className="text-indigo-600 font-mono">{entry.actorEmail}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {entry.dealValue !== undefined && (
                        <div className="text-right sm:border-l sm:border-slate-200 sm:pl-3">
                          <div className="text-[10px] text-slate-400 uppercase font-semibold">Opportunity Value</div>
                          <div className="font-bold text-slate-900 text-sm">
                            {entry.currency || opportunity.currency || 'USD'} ${entry.dealValue.toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ACKNOWLEDGED START DATE DETAILS (IF PRESENT) */}
                    {(entry.acknowledgedDateChange || isAck) && (
                      <div className="bg-amber-50/90 rounded-lg p-3.5 border border-amber-200 text-xs space-y-2">
                        <div className="flex items-center space-x-2 text-amber-900 font-bold">
                          <Calendar className="w-4 h-4 text-amber-600" />
                          <span>Acknowledged Start Date Milestone</span>
                        </div>

                        {entry.acknowledgedDateChange ? (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-slate-700">
                            <div className="bg-white p-2.5 rounded-md border border-amber-200/60">
                              <div className="text-[10px] text-slate-400 font-semibold uppercase">Workflow Stage</div>
                              <div className="font-bold text-slate-900 mt-0.5">
                                {entry.acknowledgedDateChange.stageName}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                {entry.acknowledgedDateChange.field}
                              </div>
                            </div>

                            <div className="bg-white p-2.5 rounded-md border border-amber-200/60">
                              <div className="text-[10px] text-slate-400 font-semibold uppercase">Previous Date</div>
                              <div className="font-semibold text-slate-500 mt-0.5">
                                {entry.acknowledgedDateChange.oldDate || (
                                  <span className="italic text-slate-400">Awaiting Acknowledgment</span>
                                )}
                              </div>
                            </div>

                            <div className="bg-white p-2.5 rounded-md border border-amber-300 ring-1 ring-amber-300">
                              <div className="text-[10px] text-amber-700 font-bold uppercase flex items-center space-x-1">
                                <Check className="w-3 h-3 text-amber-600" />
                                <span>Acknowledged Start Date</span>
                              </div>
                              <div className="font-bold text-amber-950 text-sm mt-0.5 font-mono">
                                {entry.acknowledgedDateChange.newDate}
                              </div>
                              <div className="text-[10px] text-amber-700">
                                SLA clock running from this date
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-amber-900 text-xs">
                            {entry.comments || 'Workflow Stage SLA clock acknowledged.'}
                          </div>
                        )}
                      </div>
                    )}

                    {/* FIELD UPDATES DIFF TABLE (IF PRESENT) */}
                    {entry.fieldChanges && entry.fieldChanges.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-slate-600">
                          <span className="font-bold flex items-center space-x-1.5 text-slate-800">
                            <Edit3 className="w-3.5 h-3.5 text-sky-600" />
                            <span>Modified Fields ({entry.fieldChanges.length})</span>
                          </span>
                        </div>

                        <div className="overflow-x-auto rounded-lg border border-slate-200">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-100/80 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-200">
                              <tr>
                                <th className="p-2.5 pl-3">Field Name</th>
                                <th className="p-2.5">Previous Value</th>
                                <th className="p-2.5 w-8 text-center"></th>
                                <th className="p-2.5 pr-3">Updated Value</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/70 bg-white">
                              {entry.fieldChanges.map((f, fIdx) => (
                                <tr key={fIdx} className="hover:bg-slate-50/60 transition-colors">
                                  <td className="p-2.5 pl-3 font-semibold text-slate-800">
                                    <div>{f.fieldLabel}</div>
                                    <div className="text-[10px] text-slate-400 font-mono font-normal">
                                      {f.field}
                                    </div>
                                  </td>
                                  <td className="p-2.5 text-slate-500 line-through font-mono text-[11px] max-w-xs truncate">
                                    {f.oldValue}
                                  </td>
                                  <td className="p-2.5 text-center text-slate-400">
                                    <ArrowRight className="w-3.5 h-3.5 mx-auto text-sky-500" />
                                  </td>
                                  <td className="p-2.5 pr-3 font-semibold text-emerald-800 bg-emerald-50/40 font-mono text-[11px] max-w-xs truncate">
                                    {f.newValue}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* COMMENTS / EXPLANATION */}
                    {entry.comments && (
                      <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 flex items-start space-x-2">
                        <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <div className="italic">
                          "{entry.comments}"
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 p-6">
            <Shield className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-slate-700">No audit events match current filters</p>
            <p className="text-xs text-slate-500 mt-1">
              Try resetting the search query or selecting "All Events" to view historical activity.
            </p>
            {(searchQuery || filterType !== 'ALL' || stageFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterType('ALL');
                  setStageFilter('ALL');
                }}
                className="mt-3 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-100 shadow-xs"
              >
                Reset Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
