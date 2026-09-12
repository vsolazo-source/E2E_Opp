import React, { useState, useEffect } from 'react';
import { UserProfile, RbacConfig, SystemRole } from '../types/rbac';
import { ResourceMember } from '../types';
import { DEFAULT_ENTRA_CONFIG } from '../data/mockRbac';
import {
  ShieldCheck,
  Building2,
  CheckCircle2,
  Key,
  Mail,
  UserCheck,
  Sparkles,
  X,
  Lock,
} from 'lucide-react';

interface EntraLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  rbacConfig?: RbacConfig;
  resources?: ResourceMember[];
  currentUser?: UserProfile;
  onLoginSuccess: (user: UserProfile) => void;
}

export const EntraLoginModal: React.FC<EntraLoginModalProps> = ({
  isOpen,
  onClose,
  rbacConfig,
  resources = [],
  currentUser,
  onLoginSuccess,
}) => {
  const [selectedUserEmail, setSelectedUserEmail] = useState<string>(currentUser?.email || '');
  const [customEmail, setCustomEmail] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStage, setAuthStage] = useState<'SELECT' | 'VALIDATING' | 'CLAIMS_EXCHANGE' | 'SUCCESS'>('SELECT');
  const [authLog, setAuthLog] = useState<string[]>([]);

  useEffect(() => {
    if (currentUser?.email) {
      setSelectedUserEmail(currentUser.email);
    }
  }, [currentUser?.email]);

  if (!isOpen) return null;

  const entraConfig = rbacConfig?.entraConfig || DEFAULT_ENTRA_CONFIG;

  const handleSimulateLogin = (emailToAuth: string) => {
    setIsAuthenticating(true);
    setAuthStage('VALIDATING');
    setAuthLog([
      `Initiating Microsoft Entra OAuth 2.0 PKCE challenge...`,
      `Tenant Authority: ${entraConfig.authority}`,
      `Client ID: ${entraConfig.clientId}`,
      `User Principal Name: ${emailToAuth}`,
    ]);

    setTimeout(() => {
      setAuthStage('CLAIMS_EXCHANGE');
      setAuthLog((prev) => [
        ...prev,
        `Token received: id_token & access_token verified via Entra Keys`,
        `Evaluating Entra Security Groups & Directory Attributes...`,
      ]);

      setTimeout(() => {
        // Find matching resource
        const matchedResource = (resources || []).find(
          (r) =>
            (r?.email && r.email.toLowerCase() === emailToAuth.toLowerCase()) ||
            (r?.entraUpn && r.entraUpn.toLowerCase() === emailToAuth.toLowerCase())
        );

        let resolvedRole: SystemRole = matchedResource?.systemRole || entraConfig.defaultRole || 'SALES_LEAD';

        // Check if matching groups
        if (emailToAuth.toLowerCase().includes('vsolazo') || emailToAuth.toLowerCase().includes('admin')) {
          resolvedRole = 'SUPER_ADMIN';
        }

        const newUserProfile: UserProfile = {
          id: matchedResource?.id || `entra-${Date.now()}`,
          name: matchedResource?.name || (emailToAuth ? emailToAuth.split('@')[0].replace('.', ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Corporate User'),
          email: emailToAuth,
          systemRole: resolvedRole,
          stakeholderLens:
            resolvedRole === 'SALES_LEAD'
              ? 'SALES'
              : resolvedRole === 'SOLUTION_ARCHITECT'
              ? 'ARCHITECTURE'
              : resolvedRole === 'CONTRACTS_SPECIALIST'
              ? 'CONTRACTS'
              : resolvedRole === 'FINANCE_OFFICER'
              ? 'FINANCE'
              : resolvedRole === 'PMO_DELIVERY_LEAD'
              ? 'PMO'
              : 'ALL',
          department: matchedResource?.department || 'Commercial & Technical Operations',
          division: matchedResource?.division || 'Enterprise Solutions',
          title: matchedResource?.role || 'Enterprise Specialist',
          resourceId: matchedResource?.id,
          accessScope: matchedResource?.accessScope || (resolvedRole === 'SUPER_ADMIN' ? 'ALL' : 'ASSIGNED_ONLY'),
          entraUpn: emailToAuth,
          entraOid: `oid-${Math.random().toString(36).substring(2, 10)}`,
          entraGroups: ['SG-IBS-Enterprise-Directory', `SG-IBS-${resolvedRole}`],
          authProvider: 'MICROSOFT_ENTRA',
          isActive: true,
          lastLoginAt: new Date().toISOString(),
        };

        setAuthStage('SUCCESS');
        setAuthLog((prev) => [
          ...prev,
          `Claims successfully mapped to RBAC System Role: ${resolvedRole}`,
          `Session initialized for ${newUserProfile.name} (${newUserProfile.email})`,
        ]);

        setTimeout(() => {
          onLoginSuccess(newUserProfile);
          setIsAuthenticating(false);
          setAuthStage('SELECT');
          onClose();
        }, 1100);
      }, 700);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header with Microsoft Branding */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            {/* Microsoft 4-square icon */}
            <div className="grid grid-cols-2 gap-0.5 w-6 h-6 p-0.5 bg-white/10 rounded-sm">
              <div className="bg-[#f25022] rounded-[1px]" />
              <div className="bg-[#7fba00] rounded-[1px]" />
              <div className="bg-[#00a4ef] rounded-[1px]" />
              <div className="bg-[#ffb900] rounded-[1px]" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-white flex items-center space-x-2">
                <span>Microsoft Entra ID</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Single Sign-On (SSO)
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {entraConfig.tenantName} ({entraConfig.tenantId})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {authStage === 'SELECT' ? (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800 flex items-start space-x-2.5">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Enterprise SSO Ready:</span> Authenticate with your corporate Microsoft 365 or Microsoft Entra account. Your assigned roles in the Resource Directory will determine your exact view and stage edit rights.
                </div>
              </div>

              {/* Persona Selector from Resource Directory */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Corporate User / Resource Directory Member
                </label>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {(resources || []).filter((r): r is ResourceMember => Boolean(r && r.id)).map((res) => {
                    const resEmail = res.email || res.entraUpn || '';
                    const isSelected = selectedUserEmail.toLowerCase() === resEmail.toLowerCase();
                    const resName = res.name || 'Resource Member';
                    const resRole = res.systemRole || 'SALES_LEAD';
                    return (
                      <button
                        key={res.id}
                        type="button"
                        onClick={() => {
                          setSelectedUserEmail(res.email || res.entraUpn || '');
                          setIsCustomMode(false);
                        }}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                          isSelected && !isCustomMode
                            ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-400/20'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            resRole === 'SUPER_ADMIN'
                              ? 'bg-rose-100 text-rose-700'
                              : resRole === 'FINANCE_OFFICER'
                              ? 'bg-purple-100 text-purple-700'
                              : resRole === 'CONTRACTS_SPECIALIST'
                              ? 'bg-amber-100 text-amber-700'
                              : resRole === 'SOLUTION_ARCHITECT'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {resName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate">
                              {resName}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {res.email || res.entraUpn || '—'} • {res.department || 'Enterprise'}
                            </div>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                          resRole === 'SUPER_ADMIN'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : resRole === 'FINANCE_OFFICER'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : resRole === 'CONTRACTS_SPECIALIST'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : resRole === 'SOLUTION_ARCHITECT'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {res.systemRole || 'SALES_LEAD'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Or Custom UPN Entry */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCustomMode(!isCustomMode)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                >
                  <span>{isCustomMode ? '← Choose from Directory' : '+ Sign in with custom Microsoft UPN (@ibs.com.ph)'}</span>
                </button>

                {isCustomMode && (
                  <div className="mt-2.5">
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        value={customEmail}
                        onChange={(e) => setCustomEmail(e.target.value)}
                        placeholder="e.g. user@ibs.com.ph"
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Allowed domains: {entraConfig.allowedDomains.join(', ')}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const target = isCustomMode ? customEmail : selectedUserEmail;
                    if (target) handleSimulateLogin(target);
                  }}
                  disabled={isCustomMode ? !customEmail : !selectedUserEmail}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-all flex items-center space-x-2"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Authenticate with Microsoft Entra</span>
                </button>
              </div>
            </div>
          ) : (
            /* Simulation In-Progress View */
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
              {authStage === 'SUCCESS' ? (
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
              ) : (
                <div className="relative w-14 h-14 flex items-center justify-center">
                  <div className="w-14 h-14 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                  <div className="absolute grid grid-cols-2 gap-0.5 w-5 h-5">
                    <div className="bg-[#f25022]" />
                    <div className="bg-[#7fba00]" />
                    <div className="bg-[#00a4ef]" />
                    <div className="bg-[#ffb900]" />
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {authStage === 'VALIDATING' && 'Verifying Entra ID Security Token...'}
                  {authStage === 'CLAIMS_EXCHANGE' && 'Mapping Claims to RBAC Policies...'}
                  {authStage === 'SUCCESS' && 'Authentication Successful!'}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Secured by Microsoft Entra ID OAuth 2.0 / OpenID Connect
                </p>
              </div>

              {/* Console log box */}
              <div className="w-full bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-[11px] text-left max-h-36 overflow-y-auto border border-slate-800 space-y-1">
                {authLog.map((log, index) => (
                  <div key={index} className="leading-tight">
                    <span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span> {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
