import React, { useState, useMemo } from 'react';
import {
  FinanceAdminConfig,
  FinanceApprovalTier,
  ResourceMember,
  Opportunity,
} from '../types';
import {
  X,
  Plus,
  Trash2,
  Edit3,
  Check,
  RotateCcw,
  Calculator,
  ShieldCheck,
  AlertTriangle,
  DollarSign,
  Users,
  CheckCircle2,
  Sliders,
  Sparkles,
  Info,
  Clock,
  ChevronDown,
  Search,
} from 'lucide-react';
import { INITIAL_FINANCE_CONFIG } from '../data/mockFinanceConfig';

interface FinanceAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: FinanceAdminConfig;
  resources: ResourceMember[];
  opportunities?: Opportunity[];
  onSaveConfig: (updatedConfig: FinanceAdminConfig) => void;
}

export const FinanceAdminModal: React.FC<FinanceAdminModalProps> = ({
  isOpen,
  onClose,
  config,
  resources,
  opportunities = [],
  onSaveConfig,
}) => {
  // Working copy of config
  const [currentConfig, setCurrentConfig] = useState<FinanceAdminConfig>(() => {
    return JSON.parse(JSON.stringify(config || INITIAL_FINANCE_CONFIG));
  });

  // State for tier modal (adding or editing a tier)
  const [editingTier, setEditingTier] = useState<FinanceApprovalTier | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [approverSearch, setApproverSearch] = useState('');

  // Interactive Simulator state
  const [simulatedAmount, setSimulatedAmount] = useState<number>(750000);
  const [simulatedStage, setSimulatedStage] = useState<'INITIAL_FINANCE_APPROVAL' | 'FINAL_FINANCE_APPROVAL'>('INITIAL_FINANCE_APPROVAL');

  // Success Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Keep internal copy updated if prop config changes
  React.useEffect(() => {
    if (isOpen) {
      setCurrentConfig(JSON.parse(JSON.stringify(config || INITIAL_FINANCE_CONFIG)));
    }
  }, [isOpen, config]);

  // Filter resources for approvers selector
  const availableFinanceResources = useMemo(() => {
    return resources.filter((r) => {
      const isFin =
        (r.department && r.department.toLowerCase().includes('fin')) ||
        (r.role && r.role.toLowerCase().includes('fin')) ||
        (r.role && r.role.toLowerCase().includes('account')) ||
        (r.role && r.role.toLowerCase().includes('cfo')) ||
        (r.role && r.role.toLowerCase().includes('controller')) ||
        (r.role && r.role.toLowerCase().includes('deal desk'));
      return isFin;
    });
  }, [resources]);

  if (!isOpen) return null;

  // Simulator matching
  const matchingSimulatedTier = currentConfig.tiers.find((tier) => {
    if (!tier.isActive) return false;
    const stageMatch =
      tier.applicableStages.includes('BOTH') ||
      (simulatedStage === 'INITIAL_FINANCE_APPROVAL' && tier.applicableStages.includes('INITIAL_FINANCE_APPROVAL')) ||
      (simulatedStage === 'FINAL_FINANCE_APPROVAL' && tier.applicableStages.includes('FINAL_FINANCE_APPROVAL'));
    if (!stageMatch) return false;

    const min = tier.minAmount;
    const max = tier.maxAmount;
    if (max === null) {
      return simulatedAmount >= min;
    }
    return simulatedAmount >= min && simulatedAmount <= max;
  });

  const handleSaveTier = () => {
    if (!editingTier) return;
    if (!editingTier.name.trim()) {
      alert('Tier Name is required.');
      return;
    }
    if (editingTier.minAmount < 0) {
      alert('Minimum Amount cannot be negative.');
      return;
    }
    if (editingTier.maxAmount !== null && editingTier.maxAmount < editingTier.minAmount) {
      alert('Maximum Amount must be greater than or equal to Minimum Amount.');
      return;
    }
    if (editingTier.requiredApproversCount < 0) {
      alert('Required number of approvers cannot be negative.');
      return;
    }
    if (editingTier.requiredApproversCount > 0 && editingTier.designatedApprovers.length === 0) {
      alert('Please select at least one designated approver from the resource list.');
      return;
    }

    let updatedTiers: FinanceApprovalTier[];
    if (isAddingNew) {
      updatedTiers = [...currentConfig.tiers, { ...editingTier, id: `tier-${Date.now()}` }];
    } else {
      updatedTiers = currentConfig.tiers.map((t) => (t.id === editingTier.id ? editingTier : t));
    }

    // Sort tiers by minAmount
    updatedTiers.sort((a, b) => a.minAmount - b.minAmount);

    const newConfig = { ...currentConfig, tiers: updatedTiers };
    setCurrentConfig(newConfig);
    onSaveConfig(newConfig);
    showToast(`Finance Approval Tier "${editingTier.name}" saved.`);
    setEditingTier(null);
    setIsAddingNew(false);
  };

  const handleDeleteTier = (tierId: string) => {
    if (currentConfig.tiers.length <= 1) {
      alert('At least one finance approval tier must remain configured.');
      return;
    }
    if (window.confirm('Delete this finance threshold tier?')) {
      const updatedTiers = currentConfig.tiers.filter((t) => t.id !== tierId);
      const newConfig = { ...currentConfig, tiers: updatedTiers };
      setCurrentConfig(newConfig);
      onSaveConfig(newConfig);
      showToast('Finance threshold tier removed.');
    }
  };

  const handleToggleTierActive = (tierId: string) => {
    const updatedTiers = currentConfig.tiers.map((t) => (t.id === tierId ? { ...t, isActive: !t.isActive } : t));
    const newConfig = { ...currentConfig, tiers: updatedTiers };
    setCurrentConfig(newConfig);
    onSaveConfig(newConfig);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset finance approval threshold tiers and SLAs back to factory baseline settings?')) {
      const resetConfig = JSON.parse(JSON.stringify(INITIAL_FINANCE_CONFIG));
      setCurrentConfig(resetConfig);
      onSaveConfig(resetConfig);
      showToast('Finance threshold configuration reset to factory defaults.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-70 bg-purple-900 text-purple-100 px-4 py-3 rounded-xl shadow-2xl border border-purple-500 flex items-center space-x-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-purple-300" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-xl shadow-xs">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Finance Admin Tool: Approval Thresholds & Sign-Off Matrix
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {currentConfig.tiers.length} Tiers Configured
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  Stage 5 & Stage 8 Active
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Configure deal value amount thresholds, minimum required approvers count, and designated authorized signatories for Initial (Stage 5) and Final (Stage 8) Finance Approval.
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Top Bar: Action Buttons & Global Benchmarks */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-purple-900 block">Gross Margin Benchmark</span>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  step="0.5"
                  value={currentConfig.marginBenchmarkPercent}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    const newCfg = { ...currentConfig, marginBenchmarkPercent: val };
                    setCurrentConfig(newCfg);
                    onSaveConfig(newCfg);
                  }}
                  className="w-20 px-2 py-1 bg-white border border-purple-300 rounded-lg text-xs font-bold text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                />
                <span className="text-xs font-bold text-purple-800">% Target</span>
              </div>
              <span className="text-[10px] text-purple-700 block">Triggers low margin warning below this threshold</span>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-slate-800 block">Default Acknowledgment SLA</span>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  max="14"
                  value={currentConfig.defaultAckSlaDays}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    const newCfg = { ...currentConfig, defaultAckSlaDays: val };
                    setCurrentConfig(newCfg);
                    onSaveConfig(newCfg);
                  }}
                  className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                />
                <span className="text-xs font-medium text-slate-700">Days</span>
              </div>
              <span className="text-[10px] text-slate-500 block">Auto-defaults Acknowledged Date after this period</span>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-slate-800 block">Default Finance Review SLA</span>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={currentConfig.defaultReviewSlaDays}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    const newCfg = { ...currentConfig, defaultReviewSlaDays: val };
                    setCurrentConfig(newCfg);
                    onSaveConfig(newCfg);
                  }}
                  className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                />
                <span className="text-xs font-medium text-slate-700">Days</span>
              </div>
              <span className="text-[10px] text-slate-500 block">Target turnaround days for Stage 5 & 8 clearance</span>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-800">Strict Enforcement</span>
                <input
                  type="checkbox"
                  checked={currentConfig.strictThresholdEnforcement}
                  onChange={(e) => {
                    const newCfg = { ...currentConfig, strictThresholdEnforcement: e.target.checked };
                    setCurrentConfig(newCfg);
                    onSaveConfig(newCfg);
                  }}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                />
              </div>
              <span className="text-[10px] text-slate-500 leading-tight">
                {currentConfig.strictThresholdEnforcement ? 'Requires exact multi-signoff before advancing.' : 'Advisory guidance with multi-approver tracking.'}
              </span>
            </div>
          </div>

          {/* Section: Finance Threshold Tiers Table */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <span>Finance Approval Threshold Matrix</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                    {currentConfig.tiers.filter((t) => t.isActive).length} Active Tiers
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Deals are matched based on total commercial value (TCV) to enforce minimum required signers and governance rules.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsAddingNew(true);
                  setEditingTier({
                    id: `tier-${Date.now()}`,
                    name: 'New Custom Tier',
                    currency: 'USD',
                    minCurrency: 'USD',
                    maxCurrency: 'USD',
                    minAmount: 500000,
                    maxAmount: 1000000,
                    requiredApproversCount: 2,
                    designatedApprovers: ['Elena Rostova'],
                    applicableStages: ['BOTH'],
                    description: 'Custom threshold tier policy notes',
                    requiresCfoSignoff: false,
                    isActive: true,
                  });
                }}
                className="inline-flex items-center px-3.5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition-colors cursor-pointer space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Threshold Tier</span>
              </button>
            </div>

            {/* Tiers Card List */}
            <div className="grid grid-cols-1 gap-3">
              {currentConfig.tiers.map((tier, idx) => {
                const stageLabel =
                  tier.applicableStages.includes('BOTH')
                    ? 'Stage 5 (Initial) & Stage 8 (Final)'
                    : tier.applicableStages.includes('INITIAL_FINANCE_APPROVAL')
                    ? 'Stage 5 (Initial Finance Only)'
                    : 'Stage 8 (Final Finance Only)';

                return (
                  <div
                    key={tier.id}
                    className={`p-4 rounded-xl border transition-all ${
                      tier.isActive
                        ? 'bg-white border-slate-200 hover:border-purple-300 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      {/* Left: Tier Name, Range, Badges */}
                      <div className="space-y-1.5">
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="font-bold text-sm text-slate-900">{tier.name}</span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                            {tier.maxAmount !== null
                              ? `${tier.minCurrency || tier.currency || 'USD'} ${tier.minAmount.toLocaleString()} — ${tier.maxCurrency || tier.currency || 'USD'} ${tier.maxAmount.toLocaleString()}`
                              : `> ${tier.minCurrency || tier.currency || 'USD'} ${tier.minAmount.toLocaleString()} (Unbounded)`}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            {tier.requiredApproversCount === 0
                              ? '0 Approvers (Auto-Pass)'
                              : tier.requiredApproversCount === 1
                              ? '1 Approver Required'
                              : `${tier.requiredApproversCount} Approvers Required`}
                          </span>
                          {tier.requiresCfoSignoff && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-amber-600" />
                              CFO / Board Sign-off
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            {stageLabel}
                          </span>
                        </div>

                        {tier.description && (
                          <p className="text-xs text-slate-600">{tier.description}</p>
                        )}

                        {/* Designated Approvers List */}
                        <div className="flex items-center flex-wrap gap-1.5 pt-1 text-xs">
                          <span className="text-[11px] font-semibold text-slate-500 mr-1">Designated Approvers:</span>
                          {tier.designatedApprovers.map((approver, aIdx) => (
                            <span
                              key={aIdx}
                              className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1"
                            >
                              <Users className="w-3 h-3 text-indigo-500" />
                              {approver}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center space-x-2 self-end lg:self-center shrink-0">
                        {/* Toggle Active */}
                        <button
                          type="button"
                          onClick={() => handleToggleTierActive(tier.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                            tier.isActive
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          {tier.isActive ? 'Active' : 'Inactive'}
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingNew(false);
                            setEditingTier(JSON.parse(JSON.stringify(tier)));
                          }}
                          className="p-1.5 rounded-lg text-amber-600 hover:text-amber-800 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-colors cursor-pointer"
                          title="Edit Tier Parameters"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteTier(tier.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                          title="Delete Tier"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Live Deal Simulator & Matrix Verifier */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-purple-500/20 text-purple-400 rounded-lg">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-white">Live Deal Value & Approval Threshold Simulator</h4>
              </div>
              <span className="text-[11px] text-slate-400">Interactive Policy Tester</span>
            </div>

            <p className="text-xs text-slate-300">
              Test how any deal value (TCV) automatically resolves against your configured finance threshold tiers.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Simulated Deal Value ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono">$</span>
                  <input
                    type="number"
                    step="10000"
                    value={simulatedAmount}
                    onChange={(e) => setSimulatedAmount(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Target Workflow Stage</label>
                <select
                  value={simulatedStage}
                  onChange={(e) => setSimulatedStage(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="INITIAL_FINANCE_APPROVAL">Stage 5: Initial Finance Approval</option>
                  <option value="FINAL_FINANCE_APPROVAL">Stage 8: Final Finance Approval</option>
                </select>
              </div>

              {/* Matching Result Output */}
              <div className="bg-slate-800/90 rounded-xl p-3 border border-slate-700 space-y-1 text-xs">
                <span className="text-[10px] text-purple-300 font-bold block uppercase tracking-wider">Triggered Threshold Tier</span>
                {matchingSimulatedTier ? (
                  <div>
                    <div className="font-bold text-white text-sm">{matchingSimulatedTier.name}</div>
                    <div className="text-purple-300 text-xs mt-0.5">
                      {matchingSimulatedTier.requiredApproversCount === 0 ? (
                        <span className="text-emerald-300 font-semibold">✓ 0 Approvers Required (Auto-Approved / No Manual Sign-Off Required)</span>
                      ) : (
                        <span>
                          ✓ Requires <strong>{matchingSimulatedTier.requiredApproversCount} {matchingSimulatedTier.requiredApproversCount === 1 ? 'Signer' : 'Signers'}</strong>: {matchingSimulatedTier.designatedApprovers.join(', ') || 'Any authorized finance personnel'}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-rose-400 font-semibold">
                    No active threshold tier covers this deal amount for {simulatedStage}.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="text-slate-600 hover:text-red-700 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Threshold Defaults</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer"
          >
            Save & Close
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT THRESHOLD TIER */}
      {/* ========================================================================= */}
      {editingTier && (
        <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2.5 text-purple-700">
                <div className="p-2 bg-purple-100 rounded-xl">
                  <Calculator className="w-5 h-5 text-purple-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {isAddingNew ? 'Add Finance Approval Threshold Tier' : 'Edit Finance Approval Tier'}
                  </h3>
                  <p className="text-xs text-slate-500">Configure deal value range and authorized approver rules</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingTier(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Tier Name */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tier Name *</label>
                <input
                  type="text"
                  value={editingTier.name}
                  onChange={(e) => setEditingTier({ ...editingTier, name: e.target.value })}
                  placeholder="e.g. Enterprise Deals ($500K - $1M)"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              {/* Amount Ranges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Min Amount Section: Currency before Min Amount */}
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-5">
                    <label className="font-bold text-slate-700 block mb-1">Currency</label>
                    <select
                      id="tier-min-currency-select"
                      value={editingTier.minCurrency || editingTier.currency || 'USD'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditingTier({
                          ...editingTier,
                          minCurrency: val,
                          currency: editingTier.currency || val,
                        });
                      }}
                      className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="PHP">PHP (₱)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="SGD">SGD (S$)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="AUD">AUD (A$)</option>
                      <option value="CAD">CAD (C$)</option>
                      <option value="JPY">JPY (¥)</option>
                    </select>
                  </div>
                  <div className="col-span-7">
                    <label className="font-bold text-slate-700 block mb-1">Min Amount *</label>
                    <input
                      type="number"
                      min="0"
                      value={editingTier.minAmount}
                      onChange={(e) => setEditingTier({ ...editingTier, minAmount: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Max Amount Section: Currency before Max Amount */}
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-5">
                    <label className="font-bold text-slate-700 block mb-1">Currency</label>
                    <select
                      id="tier-max-currency-select"
                      value={editingTier.maxCurrency || editingTier.currency || 'USD'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditingTier({
                          ...editingTier,
                          maxCurrency: val,
                          currency: editingTier.currency || val,
                        });
                      }}
                      className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="PHP">PHP (₱)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="SGD">SGD (S$)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="AUD">AUD (A$)</option>
                      <option value="CAD">CAD (C$)</option>
                      <option value="JPY">JPY (¥)</option>
                    </select>
                  </div>
                  <div className="col-span-7">
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700">Max Amount</label>
                      <label className="text-[10px] text-slate-500 flex items-center space-x-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingTier.maxAmount === null}
                          onChange={(e) => {
                            setEditingTier({
                              ...editingTier,
                              maxAmount: e.target.checked ? null : 1000000,
                            });
                          }}
                          className="rounded text-purple-600"
                        />
                        <span>No Limit</span>
                      </label>
                    </div>
                    <input
                      type="number"
                      disabled={editingTier.maxAmount === null}
                      value={editingTier.maxAmount === null ? '' : editingTier.maxAmount}
                      onChange={(e) =>
                        setEditingTier({
                          ...editingTier,
                          maxAmount: e.target.value === '' ? null : Number(e.target.value),
                        })
                      }
                      placeholder="No upper limit"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 disabled:bg-slate-100 disabled:text-slate-400 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Required Approvers Count & Stage Applicability */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Required Approvers Count *</label>
                  <select
                    id="tier-required-approvers-select"
                    value={editingTier.requiredApproversCount}
                    onChange={(e) => setEditingTier({ ...editingTier, requiredApproversCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value={0}>0 Approvers Required (Auto-Pass / No Sign-Off)</option>
                    <option value={1}>1 Approver Required</option>
                    <option value={2}>2 Approvers Required (Dual Sign-Off)</option>
                    <option value={3}>3 Approvers Required (Tri-Sign-Off)</option>
                    <option value={4}>4+ Approvers Required</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Applicable Stages</label>
                  <select
                    value={editingTier.applicableStages[0] || 'BOTH'}
                    onChange={(e) => setEditingTier({ ...editingTier, applicableStages: [e.target.value as any] })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="BOTH">Stage 5 (Initial) & Stage 8 (Final)</option>
                    <option value="INITIAL_FINANCE_APPROVAL">Stage 5 (Initial Finance Only)</option>
                    <option value="FINAL_FINANCE_APPROVAL">Stage 8 (Final Finance Only)</option>
                  </select>
                </div>
              </div>

              {/* Designated Approver Picker from Resources */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">
                    Designated Authorized Approvers {editingTier.requiredApproversCount > 0 ? '*' : '(Optional)'}
                  </label>
                  <span className="text-[10px] text-purple-700 font-semibold">
                    {editingTier.designatedApprovers.length} Selected
                  </span>
                </div>

                {/* Resource checkable list */}
                <div className="border border-slate-200 rounded-xl p-2 max-h-40 overflow-y-auto space-y-1 bg-slate-50">
                  {resources.map((res) => {
                    const isSelected = editingTier.designatedApprovers.includes(res.name);
                    return (
                      <label
                        key={res.id}
                        className={`flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                          isSelected ? 'bg-purple-100 text-purple-900 font-bold' : 'hover:bg-slate-200/60 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditingTier({
                                  ...editingTier,
                                  designatedApprovers: [...editingTier.designatedApprovers, res.name],
                                });
                              } else {
                                setEditingTier({
                                  ...editingTier,
                                  designatedApprovers: editingTier.designatedApprovers.filter((n) => n !== res.name),
                                });
                              }
                            }}
                            className="rounded text-purple-600 focus:ring-purple-500"
                          />
                          <span>{res.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-normal">
                          {res.role || 'Member'} {res.department ? `(${res.department})` : ''}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Description & CFO Checkbox */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Policy Description & Notes</label>
                <textarea
                  rows={2}
                  value={editingTier.description || ''}
                  onChange={(e) => setEditingTier({ ...editingTier, description: e.target.value })}
                  placeholder="e.g. Mandatory CFO review, rate card compliance, and credit audit"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="cfo-signoff-chk"
                  checked={editingTier.requiresCfoSignoff || false}
                  onChange={(e) => setEditingTier({ ...editingTier, requiresCfoSignoff: e.target.checked })}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="cfo-signoff-chk" className="font-semibold text-slate-800 text-xs cursor-pointer">
                  Requires Executive Board / Chief Financial Officer (CFO) Sign-off
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditingTier(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTier}
                className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Tier Configuration</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
