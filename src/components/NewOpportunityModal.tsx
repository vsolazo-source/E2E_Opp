import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Sparkles,
  Building,
  DollarSign,
  Calendar,
  User,
  FileText,
  Briefcase,
  Layers,
  ShieldCheck,
  AlertCircle,
  Clock,
  CheckCircle2,
  Link2,
  Coins,
  ArrowRight,
  Network,
} from 'lucide-react';
import { Opportunity, ClientOrganization, ResourceMember, FormSelectorsConfig } from '../types';
import { ensureValidFormSelectors } from '../data/mockFormSelectors';
import {
  generateOpportunityCode,
  previewOpportunityCode,
  getDivisionCode,
  getBusinessUnitCode,
} from '../lib/opportunityCode';

export const SUPPORTED_CURRENCIES = [
  { code: 'PHP', symbol: '₱', label: 'PHP (₱ - Philippine Peso)' },
  { code: 'USD', symbol: '$', label: 'USD ($ - US Dollar)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€ - Euro)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£ - British Pound)' },
  { code: 'SGD', symbol: 'S$', label: 'SGD (S$ - Singapore Dollar)' },
  { code: 'AUD', symbol: 'A$', label: 'AUD (A$ - Australian Dollar)' },
  { code: 'JPY', symbol: '¥', label: 'JPY (¥ - Japanese Yen)' },
  { code: 'CAD', symbol: 'C$', label: 'CAD (C$ - Canadian Dollar)' },
];

interface NewOpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (opportunity: Opportunity) => void;
  opportunities?: Opportunity[];
  clients?: ClientOrganization[];
  resources?: ResourceMember[];
  formSelectors?: FormSelectorsConfig;
}

export const NewOpportunityModal: React.FC<NewOpportunityModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  opportunities = [],
  clients = [],
  resources = [],
  formSelectors,
}) => {
  // Available dropdown options from Form Selectors
  const safeFormSelectors = useMemo(() => ensureValidFormSelectors(formSelectors), [formSelectors]);

  const activeIndustries = useMemo(
    () => (safeFormSelectors.industries || []).filter((i) => i.isActive !== false),
    [safeFormSelectors]
  );
  const activeDepartments = useMemo(
    () => (safeFormSelectors.departments || []).filter((d) => d.isActive !== false),
    [safeFormSelectors]
  );
  const activeDivisions = useMemo(
    () => (safeFormSelectors.divisions || []).filter((div) => div.isActive !== false),
    [safeFormSelectors]
  );
  const activeServicePillars = useMemo(
    () => (safeFormSelectors.servicePillars || []).filter((sp) => sp.isActive !== false),
    [safeFormSelectors]
  );
  const activePriorities = useMemo(
    () => (safeFormSelectors.priorities || []).filter((p) => p.isActive !== false),
    [safeFormSelectors]
  );
  const activeStatuses = useMemo(
    () => (safeFormSelectors.opportunityStatuses || []).filter((s) => s.isActive !== false),
    [safeFormSelectors]
  );

  const defaultIndustry = activeIndustries.find((i) => i.isDefault)?.value || activeIndustries[0]?.value || 'Banking & Financial Services';
  const defaultDept = activeDepartments.find((d) => d.isDefault)?.value || activeDepartments[0]?.value || 'Cloud & Infrastructure';
  const defaultDivision = activeDivisions.find((div) => div.isDefault)?.value || activeDivisions[0]?.value || 'Financial Services & FinTech';
  const defaultServicePillar = activeServicePillars.find((sp) => sp.isDefault)?.value || '';
  const defaultPriority = activePriorities.find((p) => p.isDefault)?.value || activePriorities[0]?.value || 'HIGH';
  const defaultStatus = activeStatuses.find((s) => s.isDefault)?.value || activeStatuses[0]?.value || 'Active';

  // Sales Leads derived from Resource Directory (Role containing Sales Lead / Sales / Account Executive)
  const salesLeadOptions = useMemo(() => {
    if (!resources || resources.length === 0) {
      return [
        { id: 'res-1', name: 'Marcus Sterling', role: 'Principal Enterprise Account Executive', department: 'Sales & Commercial' },
        { id: 'res-2', name: 'Sarah Jenkins', role: 'Senior Enterprise Account Executive', department: 'Sales & Commercial' },
      ];
    }

    const salesFiltered = resources.filter((r) => {
      const role = (r.role || '').toLowerCase();
      const dept = (r.department || '').toLowerCase();
      return (
        role.includes('sales lead') ||
        role.includes('sales') ||
        role.includes('account executive') ||
        role.includes('commercial') ||
        dept.includes('sales') ||
        dept.includes('commercial')
      );
    });

    return salesFiltered.length > 0 ? salesFiltered : resources;
  }, [resources]);

  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientIndustry, setClientIndustry] = useState(defaultIndustry);
  const [clientContactName, setClientContactName] = useState('');
  const [clientContactEmail, setClientContactEmail] = useState('');
  const [dealValue, setDealValue] = useState<number>(2500000);
  const [currency, setCurrency] = useState('PHP');
  const [probability, setProbability] = useState<number>(75);
  const [targetCloseDate, setTargetCloseDate] = useState(
    new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [salesLead, setSalesLead] = useState('');
  const [division, setDivision] = useState<string>(defaultDivision);
  const [businessUnit, setBusinessUnit] = useState<string>(defaultDept);
  const [servicePillar, setServicePillar] = useState<string>(defaultServicePillar);
  const [priority, setPriority] = useState<string>(defaultPriority);
  const [status, setStatus] = useState<string>(defaultStatus);
  const [torLink, setTorLink] = useState('');
  const [description, setDescription] = useState('');

  // Matched client info for visual feedback
  const matchedClient = useMemo(() => {
    if (!clientName.trim()) return null;
    return clients.find((c) => c.name.toLowerCase() === clientName.trim().toLowerCase()) || null;
  }, [clientName, clients]);

  const liveOpportunityCode = useMemo(() => {
    return previewOpportunityCode(division, businessUnit, opportunities);
  }, [division, businessUnit, opportunities]);

  const divCode = useMemo(() => getDivisionCode(division), [division]);
  const buCode = useMemo(() => getBusinessUnitCode(businessUnit), [businessUnit]);

  // Sync initial state when modal opens
  useEffect(() => {
    if (isOpen) {
      setClientIndustry(defaultIndustry);
      setDivision(defaultDivision);
      setBusinessUnit(defaultDept);
      setServicePillar(defaultServicePillar);
      setPriority(defaultPriority);
      setStatus(defaultStatus);
      setCurrency('PHP');
      if (salesLeadOptions.length > 0) {
        setSalesLead(salesLeadOptions[0].name);
      }
    }
  }, [isOpen, defaultIndustry, defaultDivision, defaultDept, defaultServicePillar, defaultPriority, defaultStatus, salesLeadOptions]);

  if (!isOpen) return null;

  // Handle Client Organization selection and automatically reflect Industry
  const handleClientSelect = (selectedName: string) => {
    setClientName(selectedName);
    const matched = clients.find(
      (c) => c.name.toLowerCase() === selectedName.trim().toLowerCase()
    );
    if (matched) {
      if (matched.industry) {
        setClientIndustry(matched.industry);
      }
      if (matched.primaryContactName && !clientContactName) {
        setClientContactName(matched.primaryContactName);
      }
      if (matched.contactEmail && !clientContactEmail) {
        setClientContactEmail(matched.contactEmail);
      }
    }
  };

  const handleQuickClientSelectDropdown = (selectedName: string) => {
    if (!selectedName) return;
    handleClientSelect(selectedName);
  };

  const currentCurrencySymbol =
    SUPPORTED_CURRENCIES.find((c) => c.code === currency)?.symbol || currency;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !clientName.trim()) return;

    const now = new Date().toISOString();
    const trackingCode = generateOpportunityCode({
      division,
      businessUnit,
      createdAt: now,
      existingOpportunities: opportunities,
    });
    const newId = `opp-${Date.now()}`;

    const selectedSalesLeadName = salesLead.trim() || salesLeadOptions[0]?.name || 'Sales Executive';

    const newOpp: Opportunity = {
      id: newId,
      trackingCode,
      title: title.trim(),
      clientName: clientName.trim(),
      clientIndustry,
      clientContactName: clientContactName.trim() || 'Key Decision Maker',
      clientContactEmail: clientContactEmail.trim() || `contact@${clientName.toLowerCase().replace(/[^a-z0-9]/g, '')}.example.com`,
      dealValue: Number(dealValue) || 0,
      currency: currency || 'PHP',
      probability: Number(probability) || 50,
      targetCloseDate,
      salesLead: selectedSalesLeadName,
      division,
      businessUnit,
      servicePillar,
      priority,
      status,
      torLink: torLink.trim() || undefined,
      description: description.trim() || `${title} initiative for ${clientName}.`,
      currentStage: 'OPPORTUNITY_INTAKE',
      stageEnteredAt: now,
      createdAt: now,
      updatedAt: now,
      solutionProposal: {
        vendorProcurement: {
          requiresVendor: false,
        },
      },
      contractDetails: {},
      docusignDetails: {
        routingMode: 'DOCUSIGN',
        status: 'DRAFT',
      },
      winNotification: {
        isReleased: false,
      },
      parallelFinance: {
        isConfigured: false,
      },
      parallelPmo: {
        isKickoffCompleted: false,
        progressPercentage: 0,
        deliveryHealth: 'ON_TRACK',
        milestones: [],
      },
      cwcRecord: {
        isAcceptedByClient: false,
      },
      billingRecord: {
        paymentStatus: 'DRAFT',
      },
      history: [
        {
          id: `h-${Date.now()}`,
          timestamp: now,
          stage: 'OPPORTUNITY_INTAKE',
          actorName: selectedSalesLeadName,
          actorRole: 'SALES',
          action: 'Opportunity Created & Qualified',
          comments: `Created deal with Forecast Value of ${currency} ${Number(dealValue).toLocaleString()} for ${clientName}.${torLink.trim() ? ` (TOR Link: ${torLink.trim()})` : ''}`,
        },
      ],
    };

    onCreate(newOpp);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white tracking-tight">Create New Opportunity</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Stage 1 Intake
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Initiate Sales Qualification & Scope Intake into the 15-stage pipeline
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Opportunity Code Live Tag Banner */}
          <div className="bg-slate-900 rounded-xl p-3.5 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center space-x-2.5">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                Assigned Code:
              </span>
              <span className="font-mono font-bold text-sm text-cyan-300 bg-cyan-950/80 px-2.5 py-1 rounded-lg border border-cyan-800/80 tracking-wider shadow-inner">
                {liveOpportunityCode}
              </span>
            </div>
            <div className="flex items-center space-x-1.5 text-[11px] font-mono bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-400">
              <span className="text-purple-400 font-semibold" title={`Division: ${division} (${divCode})`}>{divCode}</span>
              <span className="text-slate-600">-</span>
              <span className="text-blue-400 font-semibold" title={`Business Unit: ${businessUnit} (${buCode})`}>{buCode}</span>
              <span className="text-slate-600">-</span>
              <span className="text-amber-400 font-semibold">OPP</span>
              <span className="text-slate-600">-</span>
              <span className="text-emerald-400 font-semibold">{new Date().getFullYear()}</span>
              <span className="text-slate-600">-</span>
              <span className="text-cyan-400 font-semibold">{liveOpportunityCode.split('-').pop()}</span>
              <span className="text-[10px] text-slate-500 font-sans ml-1.5 hidden sm:inline">(DIV-BU-OPP-YYYY-NNN)</span>
            </div>
          </div>

          {/* Title & Client */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Opportunity / Deal Title *
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  id="input-opportunity-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Core Banking System Modernization & AI"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-700 font-semibold">
                  Client / Organization Name *
                </label>
                {matchedClient && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    Industry Linked: {matchedClient.industry}
                  </span>
                )}
              </div>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  id="input-opportunity-client-name"
                  type="text"
                  required
                  list="registered-clients-list"
                  value={clientName}
                  onChange={(e) => handleClientSelect(e.target.value)}
                  placeholder="e.g. MetroBank Corporation or select from directory"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                />
                <datalist id="registered-clients-list">
                  {clients.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.abbreviation ? `[${c.abbreviation}] ${c.industry}` : c.industry}
                    </option>
                  ))}
                </datalist>
              </div>

              {/* Fast Select from Registered Directory */}
              {clients.length > 0 && (
                <div className="mt-1 flex items-center space-x-1.5 text-[11px] text-slate-500">
                  <span>Directory:</span>
                  <select
                    className="bg-transparent text-blue-600 font-semibold hover:underline cursor-pointer focus:outline-none truncate max-w-[200px]"
                    value={matchedClient ? matchedClient.name : ''}
                    onChange={(e) => handleQuickClientSelectDropdown(e.target.value)}
                  >
                    <option value="">Choose registered organization...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} ({c.industry})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Industry, Division, Business Unit & Service Pillar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-700 font-semibold">Industry Sector</label>
                {matchedClient && (
                  <span className="text-[10px] text-slate-500">Synced from Client Directory</span>
                )}
              </div>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <select
                  id="select-opportunity-industry"
                  value={clientIndustry}
                  onChange={(e) => setClientIndustry(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {/* If client's industry is not in standard list, include it as an option */}
                  {clientIndustry && !activeIndustries.some((i) => i.value === clientIndustry) && (
                    <option value={clientIndustry}>{clientIndustry} (Client Directory)</option>
                  )}
                  {activeIndustries.map((ind) => (
                    <option key={ind.id} value={ind.value}>
                      {ind.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Division</label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <select
                  id="select-opportunity-division"
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {activeDivisions.map((div) => (
                    <option key={div.id} value={div.value}>
                      {div.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Business Unit</label>
              <div className="relative">
                <Layers className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <select
                  id="select-opportunity-department"
                  value={businessUnit}
                  onChange={(e) => setBusinessUnit(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {activeDepartments.map((dept) => (
                    <option key={dept.id} value={dept.value}>
                      {dept.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Service Pillar</label>
              <div className="relative">
                <Network className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <select
                  id="select-opportunity-service-pillar"
                  value={servicePillar}
                  onChange={(e) => setServicePillar(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">-- None / Select Service Pillar (Optional) --</option>
                  {activeServicePillars.map((sp) => (
                    <option key={sp.id} value={sp.value}>
                      {sp.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Financial Parameters: Currency, Forecast Value, Probability, Priority, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {/* Currency Selector (Default PHP) */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Currency</label>
              <div className="relative">
                <Coins className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <select
                  id="select-opportunity-currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full pl-9 pr-2 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {SUPPORTED_CURRENCIES.map((curr) => (
                    <option key={curr.code} value={curr.code}>
                      {curr.code} ({curr.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Forecast Value (Renamed from Estimated Value) */}
            <div className="sm:col-span-1 md:col-span-1">
              <label className="block text-slate-700 font-semibold mb-1 truncate" title="Forecast Value">
                Forecast Value
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-sm font-bold text-slate-500 pointer-events-none">
                  {currentCurrencySymbol}
                </span>
                <input
                  id="input-opportunity-forecast-value"
                  type="number"
                  required
                  min={1000}
                  step={10000}
                  value={dealValue}
                  onChange={(e) => setDealValue(Number(e.target.value))}
                  placeholder="0"
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Probability (%) */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Probability (%)</label>
              <input
                id="input-opportunity-probability"
                type="number"
                min={10}
                max={100}
                value={probability}
                onChange={(e) => setProbability(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Priority</label>
              <select
                id="select-opportunity-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
              >
                {activePriorities.map((prio) => (
                  <option key={prio.id} value={prio.value}>
                    {prio.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Status</label>
              <select
                id="select-opportunity-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
              >
                {activeStatuses.map((stat) => (
                  <option key={stat.id} value={stat.value}>
                    {stat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Client Contact & Sales Lead Dropdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Client Contact Name</label>
              <input
                id="input-opportunity-contact-name"
                type="text"
                value={clientContactName}
                onChange={(e) => setClientContactName(e.target.value)}
                placeholder="e.g. Rachel Vance (CTO)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Contact Email</label>
              <input
                id="input-opportunity-contact-email"
                type="email"
                value={clientContactEmail}
                onChange={(e) => setClientContactEmail(e.target.value)}
                placeholder="e.g. rachel.vance@company.com"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-xs"
              />
            </div>

            {/* Sales Lead Dropdown derived from Resource Directory */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Sales Lead (Resource Directory) *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <select
                  id="select-opportunity-sales-lead"
                  value={salesLead}
                  onChange={(e) => setSalesLead(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                >
                  {salesLeadOptions.map((res) => (
                    <option key={res.id} value={res.name}>
                      {res.name} — {res.role}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* TOR Link: Free Text & Target Close Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {/* TOR Link Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-700 font-semibold">
                  TOR Link (Terms of Reference)
                </label>
                <span className="text-[10px] text-slate-400">Free text / URL link</span>
              </div>
              <div className="relative">
                <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  id="input-opportunity-tor-link"
                  type="text"
                  value={torLink}
                  onChange={(e) => setTorLink(e.target.value)}
                  placeholder="e.g. https://sharepoint.company.com/tor/project-spec.pdf or Doc Ref #"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Target Close Date */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Target Close Date</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  id="input-opportunity-close-date"
                  type="date"
                  value={targetCloseDate}
                  onChange={(e) => setTargetCloseDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Scope & Description */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Scope & Objectives Summary</label>
            <textarea
              id="textarea-opportunity-description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline business objectives, key deliverables, and target architecture..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              id="btn-opportunity-cancel"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="btn-opportunity-submit"
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Create Opportunity</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

