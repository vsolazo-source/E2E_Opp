import React, { useState, useEffect } from 'react';
import { 
  X, 
  Building2, 
  DollarSign, 
  Calendar, 
  User, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Layers, 
  Briefcase, 
  History, 
  Sparkles, 
  ExternalLink,
  Tag,
  Share2,
  Check,
  AlertTriangle,
  Link2,
  ShieldCheck,
  Calculator
} from 'lucide-react';
import { Opportunity, WorkflowStage, StakeholderRole, FormSelectorsConfig, ClientOrganization, ResourceMember, StageDefinition } from '../types';
import { STAGE_MAP, BU_LABELS } from '../data/stages';
import { StageProgressBar } from './StageProgressBar';
import { StageActionPanel } from './StageActionPanel';
import { FinanceAuditTrailSection } from './FinanceAuditTrailSection';
import { formatCurrency, formatDate, formatDateTime, getSlaStatus } from '../utils/formatters';

interface OpportunityDetailModalProps {
  opportunity: Opportunity | null;
  currentRole: StakeholderRole;
  formSelectors?: FormSelectorsConfig;
  clients?: ClientOrganization[];
  resources?: ResourceMember[];
  stageDefinitions?: StageDefinition[];
  onAddResource?: (newResource: ResourceMember) => void;
  onClose: () => void;
  onUpdateOpportunity: (updated: Opportunity) => void;
  onAdvanceStage: (oppId: string, nextStage: WorkflowStage, actionName: string, comments: string, extraUpdates?: Partial<Opportunity>) => void;
}

export const OpportunityDetailModal: React.FC<OpportunityDetailModalProps> = ({
  opportunity,
  currentRole,
  formSelectors,
  clients = [],
  resources = [],
  stageDefinitions,
  onAddResource,
  onClose,
  onUpdateOpportunity,
  onAdvanceStage,
}) => {
  const [activeTab, setActiveTab] = useState<'ACTION' | 'OVERVIEW' | 'SOLUTION_VENDOR' | 'CONTRACTS_LEGAL' | 'PMO_BILLING' | 'AUDIT'>('ACTION');
  const [selectedInspectStage, setSelectedInspectStage] = useState<WorkflowStage>(opportunity?.currentStage || 1);

  // Keep inspected stage in sync when the opportunity transitions to a new stage
  useEffect(() => {
    if (opportunity) {
      setSelectedInspectStage(opportunity.currentStage);
    }
  }, [opportunity?.id, opportunity?.currentStage]);

  if (!opportunity) return null;

  const stageDef = STAGE_MAP[opportunity.currentStage];
  const sla = getSlaStatus(opportunity, stageDefinitions);

  const handleAdvance = (nextStage: WorkflowStage, actionName: string, comments: string, extraUpdates?: Partial<Opportunity>) => {
    onAdvanceStage(opportunity.id, nextStage, actionName, comments, extraUpdates);
    setSelectedInspectStage(nextStage);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/75 backdrop-blur-xs overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-full max-h-[92vh] flex flex-col overflow-hidden min-h-0 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Top Header */}
        <div className="shrink-0 p-4 sm:p-5 border-b border-slate-800 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                {opportunity.trackingCode}
              </span>
              {opportunity.division && (
                <span className="text-xs text-purple-300 font-medium px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/60 truncate max-w-xs">
                  {opportunity.division}
                </span>
              )}
              <span className="text-xs text-slate-300 font-medium">
                {BU_LABELS[opportunity.businessUnit] || opportunity.businessUnit}
              </span>
              {opportunity.servicePillar && (
                <span className="text-xs text-cyan-300 font-medium px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60 truncate max-w-xs">
                  {opportunity.servicePillar}
                </span>
              )}
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                opportunity.priority === 'CRITICAL' ? 'bg-red-500/30 text-red-300' :
                opportunity.priority === 'HIGH' ? 'bg-amber-500/30 text-amber-300' :
                'bg-slate-700 text-slate-300'
              }`}>
                {opportunity.priority} PRIORITY
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white leading-snug break-words">
              {opportunity.title}
            </h2>
            <p className="text-xs text-slate-300 flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="font-semibold text-white">{opportunity.clientName}</span>
              <span>•</span>
              <span>Lead: <strong className="text-white font-semibold">{opportunity.salesLead}</strong></span>
              {(opportunity.solutionArchitect || opportunity.buOwner) && (
                <>
                  <span>•</span>
                  <span>SA / BU: <strong className="text-white font-semibold">{opportunity.solutionArchitect || opportunity.buOwner}</strong></span>
                </>
              )}
              <span>•</span>
              <span>Target Close: {formatDate(opportunity.targetCloseDate)}</span>
            </p>
          </div>

          <div className="flex items-center space-x-4 shrink-0 self-end md:self-center">
            <div className="text-right">
              <div className="text-xs text-slate-400 uppercase font-semibold">Deal Value</div>
              <div className="text-xl font-extrabold text-emerald-400">
                {formatCurrency(opportunity.dealValue, opportunity.currency)}
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 15-Stage Progress Stepper */}
        <div className="shrink-0 bg-slate-50 border-b border-slate-200 px-3 sm:px-4 py-1.5">
          <StageProgressBar
            currentStage={opportunity.currentStage}
            activeSelectedStage={selectedInspectStage}
            onStageClick={(stage) => setSelectedInspectStage(stage)}
          />
        </div>

        {/* Subheader Status Bar */}
        <div className="shrink-0 px-4 sm:px-5 py-2 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between text-xs gap-2">
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-slate-500 font-medium">Current Workflow Stage:</span>
            <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              {stageDef?.label}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600">
              Assigned: <strong className="text-slate-800">{stageDef?.actorLabel}</strong>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
              sla.isOverdue ? 'bg-red-100 text-red-800 border border-red-200' :
              sla.status === 'WARNING' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
              'bg-slate-100 text-slate-700'
            }`}>
              <Clock className="w-3 h-3 mr-1" />
              In Stage: {sla.days} day{sla.days !== 1 ? 's' : ''} (Target: {sla.targetDays}d)
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="shrink-0 flex items-center px-4 sm:px-5 border-b border-slate-200 bg-white overflow-x-auto gap-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('ACTION')}
            className={`shrink-0 whitespace-nowrap px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center ${
              activeTab === 'ACTION'
                ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            ⚡ Stage Action Center
          </button>
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`shrink-0 whitespace-nowrap px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'OVERVIEW'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Commercials & Scope
          </button>
          <button
            onClick={() => setActiveTab('SOLUTION_VENDOR')}
            className={`shrink-0 whitespace-nowrap px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'SOLUTION_VENDOR'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Solution & Vendor PR/PO
          </button>
          <button
            onClick={() => setActiveTab('CONTRACTS_LEGAL')}
            className={`shrink-0 whitespace-nowrap px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'CONTRACTS_LEGAL'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Contracts & DocuSign
          </button>
          <button
            onClick={() => setActiveTab('PMO_BILLING')}
            className={`shrink-0 whitespace-nowrap px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'PMO_BILLING'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            PMO Delivery, CWC & Billing
          </button>
          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`shrink-0 whitespace-nowrap px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'AUDIT'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Audit Trail ({opportunity.history?.length || 0})
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0 space-y-5 text-slate-800 overscroll-contain">
          
          {/* TAB 1: STAGE ACTION CENTER */}
          {activeTab === 'ACTION' && (
            <div className="space-y-4">
              <StageActionPanel
                opportunity={opportunity}
                currentRole={currentRole}
                formSelectors={formSelectors}
                clients={clients}
                resources={resources}
                onAddResource={onAddResource}
                onUpdateOpportunity={onUpdateOpportunity}
                onAdvanceStage={handleAdvance}
              />
            </div>
          )}

          {/* TAB 2: OVERVIEW & COMMERCIALS */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-5 text-xs">
              {/* Assigned Stakeholders Quick Summary */}
              <div className="bg-blue-50/60 rounded-xl p-3.5 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    👥
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs">Assigned Deal Team</div>
                    <div className="text-[11px] text-slate-600">Key opportunity sponsors & technical leadership</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
                  <div className="bg-white px-3 py-1.5 rounded-lg border border-blue-200/60 text-xs">
                    <span className="text-[10px] text-slate-500 font-semibold block uppercase">Assigned Sales Lead</span>
                    <span className="font-bold text-slate-800">{opportunity.salesLead || 'Unassigned'}</span>
                  </div>
                  <div className="bg-white px-3 py-1.5 rounded-lg border border-blue-200/60 text-xs">
                    <span className="text-[10px] text-slate-500 font-semibold block uppercase">Solution Architect / BU Owner</span>
                    <span className="font-bold text-blue-700">{opportunity.solutionArchitect || opportunity.buOwner || 'Unassigned'}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">Client & Opportunity Details</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-slate-500 block">Client Organization</span>
                      <span className="font-semibold text-slate-800">{opportunity.clientName}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <span className="text-slate-500 block">Division</span>
                        <span className="text-purple-700 font-medium">{opportunity.division || 'General Operations'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Business Unit</span>
                        <span className="text-slate-800 font-medium">{BU_LABELS[opportunity.businessUnit] || opportunity.businessUnit}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Service Pillar</span>
                        <span className={opportunity.servicePillar ? "text-cyan-700 font-medium" : "text-slate-400 italic font-normal"}>
                          {opportunity.servicePillar || 'None Specified'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Industry</span>
                      <span className="text-slate-800">{opportunity.clientIndustry}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Primary Client Contact</span>
                      <span className="font-semibold text-slate-800">{opportunity.clientContactName}</span>
                      <span className="text-slate-500 block">{opportunity.clientContactEmail}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">Commercial Parameters</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-slate-500 block">Forecast Value</span>
                      <span className="text-base font-bold text-emerald-700">
                        {formatCurrency(opportunity.dealValue, opportunity.currency)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Win Probability</span>
                      <span className="font-bold text-slate-800">{opportunity.probability}%</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Target Close Date</span>
                      <span className="text-slate-800">{formatDate(opportunity.targetCloseDate)}</span>
                    </div>
                    {opportunity.torLink && (
                      <div>
                        <span className="text-slate-500 block">TOR Reference / Link</span>
                        {opportunity.torLink.startsWith('http://') || opportunity.torLink.startsWith('https://') ? (
                          <a
                            href={opportunity.torLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-1 break-all"
                          >
                            <span>{opportunity.torLink}</span>
                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          </a>
                        ) : (
                          <span className="font-semibold text-slate-800 font-mono text-xs">
                            {opportunity.torLink}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">Deal Description & Scope</h4>
                <p className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
                  {opportunity.description}
                </p>
              </div>

              {/* Finance Value Progression & Audit Trail */}
              <FinanceAuditTrailSection opportunity={opportunity} />
            </div>
          )}

          {/* TAB 3: SOLUTION & VENDOR PR/PO */}
          {activeTab === 'SOLUTION_VENDOR' && (() => {
            const proposal = opportunity.solutionProposal;
            const propLink = proposal?.clientProposalLink || proposal?.solutionDocName;
            const calcLink = proposal?.pricingCalculatorLink;
            const tcv = opportunity.dealValue || 0;
            const internalCost = proposal?.ibsiInternalCost || 0;
            const grossProfit = tcv - internalCost;
            const grossMargin = tcv > 0 ? ((grossProfit / tcv) * 100) : 0;

            return (
              <div className="space-y-4 text-xs">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm">Architecture & Solution Proposal</h4>
                    {(opportunity.solutionArchitect || opportunity.buOwner) && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                        Lead: {opportunity.solutionArchitect || opportunity.buOwner}
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-white p-3 rounded-lg border border-slate-200">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Client Proposal Price (TCV)</span>
                        <span className="font-extrabold text-emerald-700 text-sm">
                          {formatCurrency(tcv, opportunity.currency)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">IBSI Internal Cost</span>
                        <span className="font-bold text-blue-800 text-sm">
                          {formatCurrency(internalCost, proposal?.ibsiInternalCurrency || opportunity.currency)}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          Margin: <strong className={grossMargin >= 25 ? 'text-emerald-700' : 'text-amber-700'}>{grossMargin.toFixed(1)}%</strong> ({formatCurrency(grossProfit, opportunity.currency)})
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Estimated Timeline</span>
                        <span className="font-bold text-slate-800">
                          {proposal?.estimatedEffortWeeks ? `${proposal.estimatedEffortWeeks} Weeks` : 'TBD'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">SA / BU Owner</span>
                        <span className="font-bold text-slate-800 truncate block">
                          {opportunity.solutionArchitect || opportunity.buOwner || 'Unassigned'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <span className="text-slate-500 block text-[11px] mb-0.5">Client Proposal Link to File</span>
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
                            <span className="font-semibold text-blue-800 break-all flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              {propLink}
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400 italic">No document link provided</span>
                        )}
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <span className="text-slate-500 block text-[11px] mb-0.5">Pricing Calculator Link to File</span>
                        {calcLink ? (
                          calcLink.startsWith('http://') || calcLink.startsWith('https://') ? (
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
                            <span className="font-semibold text-emerald-800 break-all flex items-center gap-1">
                              <Link2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              {calcLink}
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400 italic">No pricing calculator attached</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3 rounded-lg border border-slate-200">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Stage 2 Trigger Date</span>
                        <span className="font-medium text-slate-800">
                          {proposal?.stage2TriggerDate ? formatDate(proposal.stage2TriggerDate) : formatDate(opportunity.createdAt)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">TOR Received Date</span>
                        <span className="font-semibold text-blue-800">
                          {proposal?.torReceivedDate ? formatDate(proposal.torReceivedDate) : 'Pending Client TOR'}
                        </span>
                      </div>
                    </div>

                    {/* Proposal Validity Card */}
                    {(proposal?.proposalValidityStartDate || proposal?.proposalValidityEndDate || proposal?.proposalValidityDays !== undefined) && (
                      <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 block text-[11px] font-semibold">Proposal Validity</span>
                          {proposal?.proposalValidityDays !== undefined && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                              {proposal.proposalValidityDays} {proposal.proposalValidityDays === 1 ? 'Day' : 'Days'} Duration
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-slate-400 text-[10px] block">Start Date:</span>
                            <span className="font-medium text-slate-800">
                              {proposal.proposalValidityStartDate ? formatDate(proposal.proposalValidityStartDate) : 'Not specified'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] block">End / Expiry Date:</span>
                            <span className="font-bold text-slate-900">
                              {proposal.proposalValidityEndDate ? formatDate(proposal.proposalValidityEndDate) : 'Not specified'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <span className="text-slate-500 block font-semibold">Architecture Summary</span>
                      <p className="text-slate-700 mt-1 bg-white p-2.5 rounded-lg border border-slate-200">
                        {proposal?.architectureSummary || 'Architecture design and scope specification in progress.'}
                      </p>
                    </div>

                    {proposal?.deliverables && proposal.deliverables.length > 0 && (
                      <div>
                        <span className="text-slate-500 block mb-1 font-semibold">Key Deliverables</span>
                        <ul className="list-disc list-inside space-y-1 text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200">
                          {proposal.deliverables.map((d, i) => (
                            <li key={i}>{d}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Vendor PR/PO Box */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm">Optional 3rd-Party Vendor</h4>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      proposal?.vendorProcurement?.requiresVendor
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {proposal?.vendorProcurement?.requiresVendor ? 'Vendor Required' : 'In-House (No Vendor)'}
                    </span>
                  </div>

                  {proposal?.vendorProcurement?.requiresVendor ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                          <span className="text-slate-500 block text-[10px]">Vendor Name</span>
                          <span className="font-bold text-slate-800">{proposal.vendorProcurement.vendorName || 'Unspecified'}</span>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                          <span className="text-slate-500 block text-[10px]">Purchase Request (PR)</span>
                          <span className="font-bold text-blue-700">{proposal.vendorProcurement.prNumber || 'Pending'}</span>
                          <span className="text-[10px] text-slate-400 block">{proposal.vendorProcurement.prStatus || 'Not created'}</span>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                          <span className="text-slate-500 block text-[10px]">Purchase Order (PO)</span>
                          <span className="font-bold text-amber-700">{proposal.vendorProcurement.poNumber || 'Pending'}</span>
                          <span className="text-[10px] text-slate-400 block">{proposal.vendorProcurement.poStatus || 'Not issued'}</span>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                          <span className="text-slate-500 block text-[10px]">Quote Amount</span>
                          <span className="font-bold text-slate-900">
                            {formatCurrency(
                              proposal.vendorProcurement.vendorQuoteAmount,
                              proposal.vendorProcurement.vendorQuoteCurrency || proposal.ibsiInternalCurrency || opportunity.currency
                            )}
                          </span>
                        </div>
                      </div>

                      {proposal.vendorProcurement.vendorProposalLink && (
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                          <div>
                            <span className="text-slate-500 block text-[10px]">Vendor Proposal Link to File</span>
                            <span className="font-mono text-xs text-blue-700 truncate max-w-md block">
                              {proposal.vendorProcurement.vendorProposalLink}
                            </span>
                          </div>
                          <a
                            href={proposal.vendorProcurement.vendorProposalLink.startsWith('http') ? proposal.vendorProcurement.vendorProposalLink : `https://${proposal.vendorProcurement.vendorProposalLink}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 shrink-0"
                          >
                            Open File <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-500">Purely internal Center of Excellence engineers. No external procurement required.</p>
                  )}
                </div>

                {/* Stage 3 Sales Proposal Review Track */}
                {(opportunity.salesReviewData || opportunity.salesReviewNotes || opportunity.currentStage === 'SALES_PROPOSAL_REVIEW') && (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm">Stage 3: Sales Proposal Review & Commercial Alignment</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                        {opportunity.currentStage === 'SALES_PROPOSAL_REVIEW' ? 'Active Review' : 'Proposal Reviewed'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-slate-500 block text-[10px]">Assigned Sales Lead</span>
                        <span className="font-bold text-slate-800">{opportunity.salesLead || 'Unassigned'}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-slate-500 block text-[10px]">Stage 3 Trigger Date</span>
                        <span className="font-medium text-slate-800">
                          {opportunity.salesReviewData?.stage3TriggerDate 
                            ? formatDate(opportunity.salesReviewData.stage3TriggerDate) 
                            : (opportunity.stageEnteredAt ? formatDate(opportunity.stageEnteredAt) : formatDate(opportunity.updatedAt))}
                        </span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-slate-500 block text-[10px]">Acknowledged Start Date</span>
                        <span className="font-bold text-blue-800">
                          {opportunity.salesReviewData?.acknowledgedStartDate 
                            ? formatDate(opportunity.salesReviewData.acknowledgedStartDate) 
                            : 'Pending Acknowledgment'}
                        </span>
                      </div>
                    </div>

                    {(opportunity.salesReviewNotes || opportunity.salesReviewData?.salesReviewNotes) && (
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-slate-500 block text-[10px] font-semibold mb-0.5">Sales Review & Commercial Notes</span>
                        <p className="text-slate-700">{opportunity.salesReviewNotes || opportunity.salesReviewData?.salesReviewNotes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB 4: CONTRACTS & DOCUSIGN */}
          {activeTab === 'CONTRACTS_LEGAL' && (
            <div className="space-y-4 text-xs">
              {/* Stage 4 Contracts Team Review Summary */}
              {(opportunity.contractsReviewData || opportunity.contractsReviewNotes || opportunity.contractsProcessor || opportunity.currentStage === 'CONTRACTS_PROPOSAL_REVIEW') && (
                <div className="bg-amber-50/60 rounded-xl p-4 border border-amber-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      <span>Stage 4: Contracts Team Proposal Review & Record</span>
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                      {opportunity.currentStage === 'CONTRACTS_PROPOSAL_REVIEW' ? 'Active Review' : 'Proposal Reviewed & Recorded'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block text-[10px]">Assigned Sales Lead</span>
                      <span className="font-bold text-slate-800">{opportunity.salesLead || 'Unassigned'}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block text-[10px]">Contracts Team Processor</span>
                      <span className="font-bold text-amber-800">{opportunity.contractsProcessor || opportunity.contractsReviewData?.contractsProcessor || 'Unassigned'}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block text-[10px]">Contract Type</span>
                      <span className="font-bold text-indigo-700">{opportunity.contractsReviewData?.contractType || opportunity.contractType || opportunity.contractDetails?.contractType || 'Service Order'}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block text-[10px]">Stage 4 Trigger Date</span>
                      <span className="font-medium text-slate-800">
                        {opportunity.contractsReviewData?.stage4TriggerDate 
                          ? formatDate(opportunity.contractsReviewData.stage4TriggerDate) 
                          : (opportunity.stageEnteredAt ? formatDate(opportunity.stageEnteredAt) : formatDate(opportunity.updatedAt))}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block text-[10px]">Acknowledged Start Date</span>
                      <span className="font-bold text-amber-800">
                        {opportunity.contractsReviewData?.acknowledgedStartDate 
                          ? formatDate(opportunity.contractsReviewData.acknowledgedStartDate) 
                          : 'Pending Acknowledgment'}
                      </span>
                    </div>
                  </div>

                  {(opportunity.contractsReviewNotes || opportunity.contractsReviewData?.contractsReviewNotes) && (
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block text-[10px] font-semibold mb-0.5">Contracts Specialist Review Notes</span>
                      <p className="text-slate-700">{opportunity.contractsReviewNotes || opportunity.contractsReviewData?.contractsReviewNotes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Stage 5 Initial Finance Review Summary */}
              {(opportunity.initialFinanceReviewData || opportunity.initialFinanceApproval || opportunity.financeProcessor || opportunity.currentStage === 'INITIAL_FINANCE_APPROVAL') && (
                <div className="bg-purple-50/60 rounded-xl p-4 border border-purple-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Calculator className="w-4 h-4 text-purple-600" />
                      <span>Stage 5: Initial Finance Approval & Margin Clearance</span>
                    </h4>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      opportunity.initialFinanceApproval?.approved 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : opportunity.currentStage === 'INITIAL_FINANCE_APPROVAL' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-slate-100 text-slate-700'
                    }`}>
                      {opportunity.initialFinanceApproval?.approved ? 'Finance Approved ✓' : opportunity.currentStage === 'INITIAL_FINANCE_APPROVAL' ? 'Active Finance Review' : 'Pending Review'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block text-[10px]">Finance Processor</span>
                      <span className="font-bold text-purple-800">{opportunity.financeProcessor || opportunity.initialFinanceReviewData?.financeProcessor || opportunity.initialFinanceApproval?.approvedBy || 'Unassigned'}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block text-[10px]">Stage 5 Trigger Date</span>
                      <span className="font-medium text-slate-800">
                        {opportunity.initialFinanceReviewData?.stage5TriggerDate 
                          ? formatDate(opportunity.initialFinanceReviewData.stage5TriggerDate) 
                          : (opportunity.stageEnteredAt ? formatDate(opportunity.stageEnteredAt) : formatDate(opportunity.updatedAt))}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block text-[10px]">Acknowledged Start Date</span>
                      <span className="font-bold text-purple-800">
                        {opportunity.initialFinanceReviewData?.acknowledgedStartDate 
                          ? formatDate(opportunity.initialFinanceReviewData.acknowledgedStartDate) 
                          : 'Pending Acknowledgment'}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block text-[10px]">Approved Margin</span>
                      <span className="font-bold text-emerald-700">
                        {opportunity.initialFinanceReviewData?.approvedMarginPercent 
                          ? `${opportunity.initialFinanceReviewData.approvedMarginPercent.toFixed(1)}%`
                          : (opportunity.initialFinanceApproval?.approvedMarginPercent 
                            ? `${opportunity.initialFinanceApproval.approvedMarginPercent}%` 
                            : 'Pending Clearance')}
                      </span>
                    </div>
                  </div>

                  {(opportunity.initialFinanceReviewData?.financeReviewNotes || opportunity.initialFinanceApproval?.comments) && (
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block text-[10px] font-semibold mb-0.5">Finance Review Notes & Conditions</span>
                      <p className="text-slate-700">{opportunity.initialFinanceReviewData?.financeReviewNotes || opportunity.initialFinanceApproval?.comments}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm">Contract Conversion Record</h4>
                  <div className="space-y-1.5">
                    <div>
                      <span className="text-slate-500 block">Contract Reference</span>
                      <span className="font-bold text-slate-800">{opportunity.contractDetails?.contractNumber || 'Not Yet Converted'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Governing Law</span>
                      <span className="text-slate-800">{opportunity.contractDetails?.governingLaw || 'Standard'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm">DocuSign Execution Status</h4>
                  <div className="space-y-1.5">
                    <div>
                      <span className="text-slate-500 block">Envelope Status</span>
                      <span className="font-bold text-emerald-700">{opportunity.docusignDetails?.status || 'Draft'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Envelope ID</span>
                      <span className="font-mono text-slate-700">{opportunity.docusignDetails?.envelopeId || 'DOCU-PENDING'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* WIN Notification Status */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">WIN Announcement Email</h4>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    opportunity.winNotification?.isReleased ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {opportunity.winNotification?.isReleased ? 'Broadcast Released 🎉' : 'Pending Signing'}
                  </span>
                </div>
                {opportunity.winNotification?.isReleased && (
                  <div className="p-3 bg-white rounded-lg border border-slate-200 text-slate-700">
                    <div className="font-bold text-slate-900">{opportunity.winNotification.emailSubject}</div>
                    <pre className="mt-1 text-xs whitespace-pre-wrap font-sans text-slate-600">
                      {opportunity.winNotification.emailBody}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: PMO DELIVERY, CWC & BILLING */}
          {activeTab === 'PMO_BILLING' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Finance Setup */}
                <div className="bg-slate-50 rounded-xl p-4 border border-purple-200 space-y-2">
                  <h4 className="font-bold text-purple-900 text-sm">Finance Budget Allocation</h4>
                  <div className="space-y-1.5">
                    <div>
                      <span className="text-slate-500 block">Budget Code</span>
                      <span className="font-bold text-slate-800">{opportunity.parallelFinance?.budgetCode || 'Pending Assignment'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Contract Code</span>
                      <span className="font-bold text-slate-800">{opportunity.parallelFinance?.contractCode || 'Pending Assignment'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Contract Period</span>
                      <span className="text-slate-700">{formatDate(opportunity.parallelFinance?.contractStartDate)} to {formatDate(opportunity.parallelFinance?.contractEndDate)}</span>
                    </div>
                  </div>
                </div>

                {/* PMO Delivery */}
                <div className="bg-slate-50 rounded-xl p-4 border border-cyan-200 space-y-2">
                  <h4 className="font-bold text-cyan-900 text-sm">PMO Delivery Status</h4>
                  <div className="space-y-1.5">
                    <div>
                      <span className="text-slate-500 block">Project Manager</span>
                      <span className="font-bold text-slate-800">{opportunity.parallelPmo?.projectManager || 'Unassigned'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Progress</span>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-cyan-600 h-full transition-all"
                            style={{ width: `${opportunity.parallelPmo?.progressPercentage || 0}%` }}
                          />
                        </div>
                        <span className="font-bold">{opportunity.parallelPmo?.progressPercentage || 0}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CWC & Billing Box */}
              <div className="bg-slate-50 rounded-xl p-4 border border-emerald-200 space-y-3">
                <h4 className="font-bold text-emerald-900 text-sm">CWC Endorsement & Billing Status</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">CWC Document #</span>
                    <span className="font-bold text-slate-800">{opportunity.cwcRecord?.cwcNumber || 'Pending Signoff'}</span>
                    <span className="text-[10px] text-slate-400 block">{opportunity.cwcRecord?.isAcceptedByClient ? 'Client Accepted' : 'In Review'}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Invoice Reference</span>
                    <span className="font-bold text-slate-800">{opportunity.billingRecord?.invoiceNumber || 'Draft'}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Payment Status</span>
                    <span className="font-bold text-emerald-700">{opportunity.billingRecord?.paymentStatus || 'Pending'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: AUDIT TRAIL */}
          {activeTab === 'AUDIT' && (
            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-slate-900 text-sm">Complete Opportunity Lifecycle Audit Log</h4>
              <div className="space-y-2">
                {opportunity.history && opportunity.history.length > 0 ? (
                  opportunity.history.map((entry, idx) => (
                    <div
                      key={entry.id || idx}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start space-x-3"
                    >
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{entry.action}</span>
                          <span className="text-slate-400 text-[11px]">{formatDateTime(entry.timestamp)}</span>
                        </div>
                        <div className="text-slate-500">
                          Actor: <span className="font-semibold text-slate-700">{entry.actorName}</span> ({entry.actorRole})
                        </div>
                        {entry.comments && (
                          <div className="text-slate-600 italic bg-white p-2 rounded border border-slate-200/60 mt-1">
                            "{entry.comments}"
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 italic">No historical transitions recorded yet.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <div className="text-slate-500">
            Last Updated: <span className="font-medium text-slate-700">{formatDateTime(opportunity.updatedAt)}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
