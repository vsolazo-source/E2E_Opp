import React from 'react';
import { 
  Briefcase, 
  Layers, 
  FileText, 
  DollarSign, 
  CheckCircle, 
  Plus, 
  Sparkles, 
  RotateCcw, 
  Download,
  Users,
  Building2
} from 'lucide-react';
import { StakeholderRole } from '../types';

interface NavbarProps {
  currentRole: StakeholderRole;
  onRoleChange: (role: StakeholderRole) => void;
  pendingCountsByRole: Record<StakeholderRole, number>;
  onOpenNewModal: () => void;
  onOpenAiAssistant: () => void;
  onResetData?: () => void;
  onExportData?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  pendingCountsByRole,
  onOpenNewModal,
  onOpenAiAssistant,
}) => {
  const roles: { id: StakeholderRole; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'ALL', label: 'All Stakeholders (360°)', icon: <Building2 className="w-4 h-4" />, color: 'bg-slate-800 text-white' },
    { id: 'SALES', label: 'Sales Execs', icon: <Briefcase className="w-4 h-4" />, color: 'bg-emerald-600 text-white' },
    { id: 'ARCHITECTURE', label: 'Solution Arch / BU', icon: <Layers className="w-4 h-4" />, color: 'bg-blue-600 text-white' },
    { id: 'CONTRACTS', label: 'Contracts & Legal', icon: <FileText className="w-4 h-4" />, color: 'bg-amber-600 text-white' },
    { id: 'FINANCE', label: 'Finance Team', icon: <DollarSign className="w-4 h-4" />, color: 'bg-purple-600 text-white' },
    { id: 'PMO', label: 'PMO / Delivery', icon: <CheckCircle className="w-4 h-4" />, color: 'bg-cyan-600 text-white' },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-sm font-bold text-xl tracking-tight">
              ET
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-slate-900 leading-none">
                  End-to-End Opportunity Tracker
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  Lifecycle Hub
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Sales Intake → Solution Design → Contracts & Finance → DocuSign WIN → PMO CWC → Billing
              </p>
            </div>
          </div>

          {/* Global Actions */}
          <div className="flex items-center flex-wrap gap-2.5">
            <button
              id="btn-ai-advisor"
              onClick={onOpenAiAssistant}
              className="inline-flex items-center px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors shadow-2xs cursor-pointer"
            >
              <Sparkles className="w-4 h-4 mr-1.5 text-indigo-600" />
              AI Deal Advisor
            </button>

            <button
              id="btn-new-opportunity"
              onClick={onOpenNewModal}
              className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all hover:shadow cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" />
              New Opportunity
            </button>
          </div>
        </div>
      </div>

      {/* Role Navigation Bar */}
      <div className="bg-slate-50 border-t border-slate-200 px-4 sm:px-6 lg:px-8 py-2 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex items-center justify-between min-w-[760px] gap-2">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-2 flex items-center">
              <Users className="w-3.5 h-3.5 mr-1" /> Lens:
            </span>
            {roles.map((r) => {
              const isActive = currentRole === r.id;
              const pendingCount = pendingCountsByRole[r.id] || 0;
              return (
                <button
                  key={r.id}
                  id={`role-btn-${r.id.toLowerCase()}`}
                  onClick={() => onRoleChange(r.id)}
                  className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? `${r.color} shadow-xs font-semibold`
                      : 'text-slate-600 hover:bg-slate-200/80 bg-white border border-slate-200/70'
                  }`}
                >
                  <span className="mr-1.5 opacity-90">{r.icon}</span>
                  {r.label}
                  {pendingCount > 0 && (
                    <span
                      className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive
                          ? 'bg-white/25 text-white'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {pendingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="text-xs text-slate-500 font-medium flex items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1.5"></span>
            Real-Time Sync Active
          </div>
        </div>
      </div>
    </header>
  );
};
