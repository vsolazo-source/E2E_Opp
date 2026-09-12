import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, RbacConfig, SystemRole } from '../types/rbac';
import { ResourceMember } from '../types';
import { INITIAL_RESOURCES } from '../data/mockResources';
import { resolveResourceSystemRole, resolveResourceAccessScope, deriveLensFromSystemRole } from '../utils/rbac';
import {
  User,
  Shield,
  Check,
  ChevronDown,
  Lock,
  LogOut,
  Sliders,
  Sparkles,
  Users,
  Target,
  ExternalLink,
  Building,
  Crown,
} from 'lucide-react';

interface UserProfileMenuProps {
  currentUser?: UserProfile;
  resources?: ResourceMember[];
  rbacConfig?: RbacConfig;
  onlyAssignedFilter?: boolean;
  onToggleOnlyAssignedFilter?: (enabled: boolean) => void;
  onSwitchUser?: (user: UserProfile) => void;
  onOpenEntraLogin?: () => void;
  onOpenRbacAdmin?: () => void;
}

const ROLE_DISPLAY_NAMES: Record<SystemRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  SALES_LEAD: 'Sales Lead',
  SOLUTION_ARCHITECT: 'Solution Architect',
  CONTRACTS_SPECIALIST: 'Contracts Specialist',
  FINANCE_OFFICER: 'Finance Officer',
  PMO_DELIVERY_LEAD: 'PMO Lead',
  AUDITOR_VIEWER: 'Auditor',
};

const ROLE_SORT_ORDER: Record<SystemRole, number> = {
  SUPER_ADMIN: 1,
  SALES_LEAD: 2,
  SOLUTION_ARCHITECT: 3,
  CONTRACTS_SPECIALIST: 4,
  FINANCE_OFFICER: 5,
  PMO_DELIVERY_LEAD: 6,
  AUDITOR_VIEWER: 7,
};

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({
  currentUser,
  resources = [],
  rbacConfig,
  onlyAssignedFilter = false,
  onToggleOnlyAssignedFilter,
  onSwitchUser,
  onOpenEntraLogin,
  onOpenRbacAdmin,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleBadgeClasses = (role: SystemRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'SALES_LEAD':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'SOLUTION_ARCHITECT':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CONTRACTS_SPECIALIST':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'FINANCE_OFFICER':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'PMO_DELIVERY_LEAD':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'AUDITOR_VIEWER':
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getRoleInitialsBg = (role: SystemRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-rose-600 text-white';
      case 'SALES_LEAD':
        return 'bg-emerald-600 text-white';
      case 'SOLUTION_ARCHITECT':
        return 'bg-blue-600 text-white';
      case 'CONTRACTS_SPECIALIST':
        return 'bg-amber-600 text-white';
      case 'FINANCE_OFFICER':
        return 'bg-purple-600 text-white';
      case 'PMO_DELIVERY_LEAD':
        return 'bg-cyan-600 text-white';
      case 'AUDITOR_VIEWER':
      default:
        return 'bg-slate-600 text-white';
    }
  };

  const userSystemRole = currentUser?.systemRole || 'SUPER_ADMIN';
  const currentRoleConfig = rbacConfig?.rolePermissions?.[userSystemRole];
  const isSuperAdmin = userSystemRole === 'SUPER_ADMIN';

  // Ensure Victor Solazo (Super Admin) and core directory personas are ALWAYS present
  const combinedResources = React.useMemo(() => {
    const map = new Map<string, ResourceMember>();
    // Guarantee default admin and core profiles from INITIAL_RESOURCES
    INITIAL_RESOURCES.forEach((r) => {
      map.set((r.email || r.id).toLowerCase(), r);
    });
    // Overlay any live/custom resources
    (resources || []).forEach((r) => {
      if (r && r.id) {
        map.set((r.email || r.id).toLowerCase(), r);
      }
    });
    return Array.from(map.values());
  }, [resources]);

  const superAdminResource = combinedResources.find(
    (r) => r.systemRole === 'SUPER_ADMIN' || r.id === 'res-admin-1' || (r.email && r.email.toLowerCase() === 'vsolazo@ibs.com.ph')
  ) || INITIAL_RESOURCES[0];

  const handleQuickSwitchToSuperAdmin = () => {
    const adminUser: UserProfile = {
      id: superAdminResource.id,
      name: superAdminResource.name,
      email: superAdminResource.email,
      systemRole: 'SUPER_ADMIN',
      stakeholderLens: 'ALL',
      department: superAdminResource.department || 'Executive Governance & Technology',
      division: superAdminResource.division || 'Strategic Enterprise Solutions',
      title: superAdminResource.role || 'VP of Solutions & Enterprise Governance',
      resourceId: superAdminResource.id,
      accessScope: 'ALL',
      entraUpn: superAdminResource.entraUpn || superAdminResource.email,
      authProvider: 'SIMULATED',
      isActive: true,
      lastLoginAt: new Date().toISOString(),
    };
    if (onSwitchUser) onSwitchUser(adminUser);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Trigger Button */}
      <button
        id="btn-user-profile-menu"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2.5 py-1.5 px-3 rounded-xl border shadow-xs transition-all cursor-pointer group ${
          isSuperAdmin
            ? 'bg-slate-900 hover:bg-slate-800 text-white border-rose-500/50 shadow-rose-950/20 ring-1 ring-rose-500/30'
            : 'bg-slate-800/90 hover:bg-slate-700/90 text-white border-slate-700'
        }`}
      >
        {/* Avatar Initials with Crown for Super Admin */}
        <div className="relative">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shadow-xs ${getRoleInitialsBg(
              userSystemRole
            )}`}
          >
            {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
          </div>
          {isSuperAdmin && (
            <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-xs">
              <Crown className="w-2.5 h-2.5 text-slate-900 fill-slate-900" />
            </div>
          )}
        </div>

        {/* Name & Role */}
        <div className="text-left hidden sm:block">
          <div className="text-xs font-bold leading-none text-slate-100 flex items-center space-x-1.5">
            <span>{currentUser?.name || 'User Profile'}</span>
            {isSuperAdmin && (
              <span className="text-[10px] font-extrabold text-amber-300 flex items-center">
                👑
              </span>
            )}
            {currentUser?.authProvider === 'MICROSOFT_ENTRA' && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" title="Authenticated with Microsoft Entra ID" />
            )}
          </div>
          <div className="text-[10px] text-slate-300 font-medium leading-tight mt-0.5 flex items-center space-x-1">
            <span className={isSuperAdmin ? 'text-rose-300 font-bold' : ''}>
              {isSuperAdmin ? 'Super Admin (Full Access)' : currentRoleConfig?.shortLabel || userSystemRole}
            </span>
            {currentUser?.accessScope === 'ASSIGNED_ONLY' && (
              <span className="text-[9px] px-1 py-0.2 rounded bg-slate-700 text-amber-300">
                Assigned Only
              </span>
            )}
          </div>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-84 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-slate-800">
          {/* User Header Summary */}
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70 -mt-2.5 rounded-t-2xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <span>{currentUser?.name || 'User Profile'}</span>
                  {isSuperAdmin && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[9px] font-bold rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                      <Crown className="w-2.5 h-2.5 text-rose-600 fill-rose-600" />
                      Super Admin
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">{currentUser?.email || '—'}</div>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getRoleBadgeClasses(
                  userSystemRole
                )}`}
              >
                {currentRoleConfig?.shortLabel || userSystemRole}
              </span>
            </div>

            <div className="mt-2 text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Department:</span>
                <span className="font-semibold text-slate-700">{currentUser?.department || 'Enterprise'}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-slate-400">View Scope:</span>
                <span className="font-semibold text-slate-700 capitalize">
                  {currentUser?.accessScope === 'ALL'
                    ? 'All Opportunities (Enterprise)'
                    : currentUser?.accessScope === 'DEPARTMENT'
                    ? 'My Department / BU'
                    : 'Assigned Deals Only'}
                </span>
              </div>
              {isSuperAdmin && (
                <div className="mt-1 pt-1 border-t border-slate-100 text-[10px] text-rose-700 font-medium flex items-center space-x-1">
                  <Shield className="w-3 h-3 text-rose-600 shrink-0" />
                  <span>Unrestricted rights: create, edit, delete & stage revert.</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Switch to Super Admin banner if not currently Super Admin */}
          {!isSuperAdmin && (
            <div className="p-2.5 border-b border-rose-100 bg-rose-50/50">
              <button
                type="button"
                id="btn-quick-switch-super-admin"
                onClick={handleQuickSwitchToSuperAdmin}
                className="w-full px-3 py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-xl flex items-center justify-between text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer group"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center text-[10px]">
                    <Crown className="w-3 h-3 text-amber-300 fill-amber-300" />
                  </div>
                  <span>Switch to Super Admin</span>
                </div>
                <span className="text-[10px] font-semibold bg-white/20 px-2 py-0.5 rounded-md">
                  Victor Solazo 👑
                </span>
              </button>
            </div>
          )}

          {/* Quick Toggle: Only My Assigned Deals */}
          <div className="px-4 py-2.5 border-b border-slate-100">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-indigo-600" />
                <div>
                  <div className="text-xs font-bold text-slate-800">Only My Assigned Deals</div>
                  <div className="text-[10px] text-slate-500">Filter pipeline to your designated deals</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={onlyAssignedFilter}
                onChange={(e) => onToggleOnlyAssignedFilter && onToggleOnlyAssignedFilter(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
            </label>
          </div>

          {/* Persona Switcher Section (Test Different Roles) */}
          <div className="px-3 py-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5 flex items-center justify-between">
              <span>Switch Testing Persona / Role</span>
              <span className="text-[9px] text-indigo-600 font-semibold">Live RBAC</span>
            </div>

            <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
              {combinedResources
                .filter((r): r is ResourceMember => Boolean(r && r.id))
                .map((res) => {
                  const resRole = resolveResourceSystemRole(res);
                  const resScope = resolveResourceAccessScope(resRole, res.accessScope);
                  return { ...res, systemRole: resRole, accessScope: resScope };
                })
                .sort((a, b) => (ROLE_SORT_ORDER[a.systemRole] || 99) - (ROLE_SORT_ORDER[b.systemRole] || 99))
                .map((res) => {
                  const resEmail = res.email || res.entraUpn || '';
                  const isCurrent = (currentUser?.email || '').toLowerCase() === resEmail.toLowerCase();
                  const resRole = res.systemRole;
                  const resName = res.name || 'Resource Member';
                  const roleLabel = ROLE_DISPLAY_NAMES[resRole] || resRole.replace(/_/g, ' ');
                  const isItemSuperAdmin = resRole === 'SUPER_ADMIN';

                  return (
                    <button
                      key={res.id}
                      type="button"
                      onClick={() => {
                        const switchedUser: UserProfile = {
                          id: res.id,
                          name: resName,
                          email: resEmail,
                          systemRole: resRole,
                          stakeholderLens: deriveLensFromSystemRole(resRole),
                          department: res.department || 'Enterprise',
                          division: res.division || 'Enterprise Solutions',
                          title: res.role || 'Member',
                          resourceId: res.id,
                          accessScope: res.accessScope,
                          entraUpn: res.entraUpn || resEmail,
                          authProvider: 'SIMULATED',
                          isActive: true,
                          lastLoginAt: new Date().toISOString(),
                        };
                        if (onSwitchUser) onSwitchUser(switchedUser);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        isCurrent
                          ? isItemSuperAdmin
                            ? 'bg-rose-50 text-rose-950 font-bold border border-rose-200'
                            : 'bg-indigo-50 text-indigo-900 font-bold'
                          : isItemSuperAdmin
                          ? 'hover:bg-rose-50/70 text-slate-800 bg-rose-50/20'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 relative ${getRoleInitialsBg(
                            resRole
                          )}`}
                        >
                          {resName.charAt(0)}
                          {isItemSuperAdmin && (
                            <span className="absolute -top-1 -right-1 text-[8px]">👑</span>
                          )}
                        </div>
                        <div className="truncate min-w-0">
                          <div className="truncate font-medium flex items-center space-x-1">
                            <span>{resName}</span>
                            {isItemSuperAdmin && (
                              <span className="text-[10px] text-rose-600 font-bold">👑</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">{res.role || 'Member'}</div>
                        </div>
                      </div>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded border ml-2 shrink-0 font-semibold ${getRoleBadgeClasses(
                          resRole
                        )}`}
                      >
                        {isItemSuperAdmin ? '👑 Super Admin' : roleLabel}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Footer Actions: Microsoft Entra SSO & RBAC Admin */}
          <div className="pt-2 mt-1 border-t border-slate-100 px-2 space-y-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                if (onOpenEntraLogin) onOpenEntraLogin();
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-blue-700 hover:bg-blue-50 flex items-center space-x-2.5 transition-colors cursor-pointer"
            >
              {/* Microsoft 4 squares */}
              <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5">
                <div className="bg-[#f25022]" />
                <div className="bg-[#7fba00]" />
                <div className="bg-[#00a4ef]" />
                <div className="bg-[#ffb900]" />
              </div>
              <span>Sign In with Microsoft Entra ID</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                if (onOpenRbacAdmin) onOpenRbacAdmin();
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-indigo-700 hover:bg-indigo-50 flex items-center space-x-2.5 transition-colors cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-indigo-600" />
              <span>RBAC & Entra Governance Hub</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
