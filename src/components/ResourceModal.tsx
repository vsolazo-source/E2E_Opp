import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Briefcase,
  Building,
  FileText,
  CheckCircle2,
  ShieldCheck,
  PlusCircle,
  Sparkles,
} from 'lucide-react';
import { ResourceMember, FormSelectorsConfig, FormSelectorCategoryKey } from '../types';

interface ResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (resource: ResourceMember) => void;
  resourceToEdit?: ResourceMember | null;
  existingResources?: ResourceMember[];
  formSelectors?: FormSelectorsConfig;
  onSyncFormOption?: (
    category: FormSelectorCategoryKey,
    option: { label: string; value: string; color?: string; description?: string }
  ) => void;
}

export const ResourceModal: React.FC<ResourceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  resourceToEdit,
  existingResources = [],
  formSelectors,
  onSyncFormOption,
}) => {
  const isEditing = Boolean(resourceToEdit);

  // Active departments (Business Units), divisions & roles from Form Selectors config
  const activeDepartments = (formSelectors?.departments || []).filter((d) => d.isActive !== false);
  const defaultDept = activeDepartments.find((d) => d.isDefault)?.value || activeDepartments[0]?.value || 'Sales & Commercial';

  const activeDivisions = (formSelectors?.divisions || []).filter((div) => div.isActive !== false);
  const defaultDivision = activeDivisions.find((div) => div.isDefault)?.value || activeDivisions[0]?.value || 'Financial Services & FinTech';

  const activeRoles = (formSelectors?.roles || []).filter((r) => r.isActive !== false);
  const defaultRole = activeRoles.find((r) => r.isDefault)?.value || activeRoles[0]?.value || 'Senior Enterprise Account Executive';

  // Form State
  const [name, setName] = useState('');
  const [role, setRole] = useState(defaultRole);
  const [customRole, setCustomRole] = useState('');
  const [isCustomRole, setIsCustomRole] = useState(false);

  const [division, setDivision] = useState(defaultDivision);
  const [customDivision, setCustomDivision] = useState('');
  const [isCustomDivision, setIsCustomDivision] = useState(false);

  const [department, setDepartment] = useState(defaultDept);
  const [customDepartment, setCustomDepartment] = useState('');
  const [isCustomDept, setIsCustomDept] = useState(false);

  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (resourceToEdit) {
      setName(resourceToEdit.name || '');

      // Check if role is in active roles list
      const matchedRole = activeRoles.find((r) => r.value === resourceToEdit.role || r.label === resourceToEdit.role);
      if (matchedRole || !resourceToEdit.role) {
        setRole(resourceToEdit.role || defaultRole);
        setIsCustomRole(false);
        setCustomRole('');
      } else {
        setRole('OTHER');
        setIsCustomRole(true);
        setCustomRole(resourceToEdit.role || '');
      }

      // Check if division is in active divisions list
      const matchedDivision = activeDivisions.find((div) => div.value === resourceToEdit.division || div.label === resourceToEdit.division);
      if (matchedDivision || !resourceToEdit.division) {
        setDivision(resourceToEdit.division || defaultDivision);
        setIsCustomDivision(false);
        setCustomDivision('');
      } else {
        setDivision('OTHER');
        setIsCustomDivision(true);
        setCustomDivision(resourceToEdit.division || '');
      }

      // Check if department (business unit) is in active departments list
      const matchedDept = activeDepartments.find((d) => d.value === resourceToEdit.department || d.label === resourceToEdit.department);
      if (matchedDept || !resourceToEdit.department) {
        setDepartment(resourceToEdit.department || defaultDept);
        setIsCustomDept(false);
        setCustomDepartment('');
      } else {
        setDepartment('OTHER');
        setIsCustomDept(true);
        setCustomDepartment(resourceToEdit.department || '');
      }

      setEmail(resourceToEdit.email || '');
      setContactNumber(resourceToEdit.contactNumber || '');
      setRemarks(resourceToEdit.remarks || '');
      setError(null);
    } else {
      setName('');
      setRole(defaultRole);
      setIsCustomRole(false);
      setCustomRole('');
      setDivision(defaultDivision);
      setIsCustomDivision(false);
      setCustomDivision('');
      setDepartment(defaultDept);
      setIsCustomDept(false);
      setCustomDepartment('');
      setEmail('');
      setContactNumber('');
      setRemarks('');
      setError(null);
    }
  }, [resourceToEdit, isOpen, defaultDept, defaultDivision, defaultRole]);

  // Auto-generate company email if blank
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing && !email) {
      const clean = val.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '.');
      if (clean) {
        setEmail(`${clean}@enterprise-solutions.com`);
      }
    }
  };

  const handleRoleChange = (val: string) => {
    if (val === 'OTHER') {
      setIsCustomRole(true);
      setRole('OTHER');
    } else {
      setIsCustomRole(false);
      setRole(val);
    }
  };

  const handleDivisionChange = (val: string) => {
    if (val === 'OTHER') {
      setIsCustomDivision(true);
      setDivision('OTHER');
    } else {
      setIsCustomDivision(false);
      setDivision(val);
    }
  };

  const handleDepartmentChange = (val: string) => {
    if (val === 'OTHER') {
      setIsCustomDept(true);
      setDepartment('OTHER');
    } else {
      setIsCustomDept(false);
      setDepartment(val);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const finalRole = (isCustomRole ? customRole : role).trim();
    const finalDivision = (isCustomDivision ? customDivision : division).trim();
    const finalDepartment = (isCustomDept ? customDepartment : department).trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      setError('Resource Name is required.');
      return;
    }

    if (!finalRole) {
      setError('Role / Title is required.');
      return;
    }

    if (!finalDivision) {
      setError('Division is required.');
      return;
    }

    if (!finalDepartment) {
      setError('Business Unit is required.');
      return;
    }

    if (!trimmedEmail) {
      setError('Email Address is required.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please provide a valid email address.');
      return;
    }

    // Duplicate email check
    const duplicate = existingResources.find(
      (r) => r.email.toLowerCase() === trimmedEmail && r.id !== resourceToEdit?.id
    );
    if (duplicate) {
      setError(`A resource with email "${trimmedEmail}" already exists (${duplicate.name}).`);
      return;
    }

    // Bidirectional sync: sync custom role, division, or business unit back to Form Selector config
    if (onSyncFormOption) {
      if (finalRole) {
        onSyncFormOption('role', {
          label: finalRole,
          value: finalRole,
          color: 'blue',
          description: `Synced from resource directory for ${trimmedName}`,
        });
      }
      if (finalDivision) {
        onSyncFormOption('division', {
          label: finalDivision,
          value: finalDivision,
          color: 'purple',
          description: `Synced from resource directory for ${trimmedName}`,
        });
      }
      if (finalDepartment) {
        onSyncFormOption('department', {
          label: finalDepartment,
          value: finalDepartment,
          color: 'indigo',
          description: `Synced from resource directory for ${trimmedName}`,
        });
      }
    }

    const savedResource: ResourceMember = {
      id: resourceToEdit ? resourceToEdit.id : `res-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: trimmedName,
      role: finalRole,
      division: finalDivision,
      department: finalDepartment,
      email: trimmedEmail,
      contactNumber: contactNumber.trim() || undefined,
      remarks: remarks.trim() || undefined,
      createdAt: resourceToEdit ? resourceToEdit.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(savedResource);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        id="resource-modal-container"
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {isEditing ? 'Edit Resource Profile' : 'Add New Team Resource'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center space-x-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Synced with Admin</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Staff member profile for deal allocation, workflow approvals, and SLA tracking.
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
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start space-x-2">
              <div className="font-bold">Error:</div>
              <div>{error}</div>
            </div>
          )}

          {/* Resource Name */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Resource Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                id="input-resource-name"
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Marcus Sterling"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Role / Title (Dropdown with live Admin Sync + Custom fallback) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-700 font-semibold">
                Role & Job Title *
              </label>
              <span className="text-[10px] text-blue-600 font-medium flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3 text-blue-500" />
                <span>Synced with Form Selector Admin</span>
              </span>
            </div>
            <div className="relative">
              <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <select
                id="select-resource-role"
                value={isCustomRole ? 'OTHER' : role}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none font-medium text-xs sm:text-sm"
              >
                {activeRoles.map((r) => (
                  <option key={r.id} value={r.value}>
                    {r.label}
                  </option>
                ))}
                <option value="OTHER">+ Add Custom Role / Title...</option>
              </select>
            </div>

            {isCustomRole && (
              <div className="mt-2 space-y-1 animate-in fade-in duration-150">
                <input
                  id="input-custom-role"
                  type="text"
                  required
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  placeholder="Enter new role title (e.g. Principal GenAI Strategist)"
                  className="w-full px-3 py-2 bg-white border border-blue-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs sm:text-sm font-medium text-slate-900 shadow-xs"
                />
                <p className="text-[10px] text-blue-600 flex items-center space-x-1">
                  <span>✨ This custom role will automatically register in the Form Selector Admin master list upon saving.</span>
                </p>
              </div>
            )}
          </div>

          {/* Division & Business Unit Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Division */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Division *
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <select
                  id="select-resource-division"
                  value={isCustomDivision ? 'OTHER' : division}
                  onChange={(e) => handleDivisionChange(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none font-medium text-xs sm:text-sm"
                >
                  {activeDivisions.map((div) => (
                    <option key={div.id} value={div.value}>
                      {div.label}
                    </option>
                  ))}
                  <option value="OTHER">+ Add Custom Division...</option>
                </select>
              </div>

              {isCustomDivision && (
                <div className="mt-2 space-y-1 animate-in fade-in duration-150">
                  <input
                    id="input-custom-division"
                    type="text"
                    required
                    value={customDivision}
                    onChange={(e) => setCustomDivision(e.target.value)}
                    placeholder="Enter custom division name"
                    className="w-full px-3 py-2 bg-white border border-blue-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs sm:text-sm font-medium text-slate-900 shadow-xs"
                  />
                  <p className="text-[10px] text-blue-600">
                    ✨ Custom division will automatically register in master Form Selectors.
                  </p>
                </div>
              )}
            </div>

            {/* Business Unit */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Business Unit *
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <select
                  id="select-resource-dept"
                  value={isCustomDept ? 'OTHER' : department}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none font-medium text-xs sm:text-sm"
                >
                  {activeDepartments.map((dept) => (
                    <option key={dept.id} value={dept.value}>
                      {dept.label}
                    </option>
                  ))}
                  <option value="OTHER">+ Add Custom Business Unit...</option>
                </select>
              </div>

              {isCustomDept && (
                <div className="mt-2 space-y-1 animate-in fade-in duration-150">
                  <input
                    id="input-custom-department"
                    type="text"
                    required
                    value={customDepartment}
                    onChange={(e) => setCustomDepartment(e.target.value)}
                    placeholder="Enter custom business unit name"
                    className="w-full px-3 py-2 bg-white border border-blue-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs sm:text-sm font-medium text-slate-900 shadow-xs"
                  />
                  <p className="text-[10px] text-blue-600">
                    ✨ Custom business unit will automatically register in master Form Selectors.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Contact Details Grid: Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="input-resource-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@enterprise-solutions.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Contact Number (Optional)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="input-resource-phone"
                  type="tel"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none text-xs sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Remarks & Specializations (Optional)
            </label>
            <textarea
              id="textarea-resource-remarks"
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Lead deal owner for Tier-1 Banking accounts; certified AWS Solutions Architect."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none text-xs"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="submit-resource-btn"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isEditing ? 'Update Resource' : 'Save Resource'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
