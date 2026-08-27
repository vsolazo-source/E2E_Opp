import React, { useState, useEffect } from 'react';
import { ClientOrganization, FormSelectorsConfig, FormSelectorCategoryKey } from '../types';
import { X, Building2, User, Mail, Phone, FileText, Tag, Briefcase, ShieldCheck, Sparkles } from 'lucide-react';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: ClientOrganization) => void;
  clientToEdit?: ClientOrganization | null;
  existingClients: ClientOrganization[];
  formSelectors?: FormSelectorsConfig;
  onSyncFormOption?: (
    category: FormSelectorCategoryKey,
    option: { label: string; value: string; color?: string; description?: string }
  ) => void;
}

export const ClientModal: React.FC<ClientModalProps> = ({
  isOpen,
  onClose,
  onSave,
  clientToEdit,
  existingClients,
  formSelectors,
  onSyncFormOption,
}) => {
  const isEditing = Boolean(clientToEdit);

  const activeIndustries = (formSelectors?.industries || []).filter((i) => i.isActive !== false);
  const activeProfiles = (formSelectors?.clientProfiles || []).filter((p) => p.isActive !== false);

  const defaultIndustry = activeIndustries.find((i) => i.isDefault)?.value || activeIndustries[0]?.value || 'Banking & Financial Services';
  const defaultProfile = (activeProfiles.find((p) => p.isDefault)?.value as 'Internal' | 'External') || 'External';

  const [name, setName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [industry, setIndustry] = useState(defaultIndustry);
  const [clientProfile, setClientProfile] = useState<'Internal' | 'External'>(defaultProfile);
  const [customIndustry, setCustomIndustry] = useState('');
  const [primaryContactName, setPrimaryContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [remarks, setRemarks] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (clientToEdit) {
      setName(clientToEdit.name || '');
      setAbbreviation(clientToEdit.abbreviation || '');
      setClientProfile(clientToEdit.clientProfile || 'External');
      
      const matched = activeIndustries.find((i) => i.value === clientToEdit.industry);
      if (matched) {
        setIndustry(clientToEdit.industry);
        setCustomIndustry('');
      } else {
        setIndustry('Other');
        setCustomIndustry(clientToEdit.industry || '');
      }
      setPrimaryContactName(clientToEdit.primaryContactName || '');
      setContactEmail(clientToEdit.contactEmail || '');
      setContactPhone(clientToEdit.contactPhone || '');
      setRemarks(clientToEdit.remarks || '');
    } else {
      setName('');
      setAbbreviation('');
      setIndustry(defaultIndustry);
      setClientProfile(defaultProfile);
      setCustomIndustry('');
      setPrimaryContactName('');
      setContactEmail('');
      setContactPhone('');
      setRemarks('');
    }
    setErrors({});
  }, [clientToEdit, isOpen, defaultIndustry, defaultProfile]);

  // Auto-generate abbreviation from name if adding new and user hasn't typed custom
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing && (!abbreviation || abbreviation.length <= 6)) {
      const words = val.trim().split(/\s+/).filter(Boolean);
      if (words.length === 1 && words[0].length >= 3) {
        setAbbreviation(words[0].substring(0, 4).toUpperCase());
      } else if (words.length > 1) {
        setAbbreviation(words.map((w) => w[0]).join('').substring(0, 6).toUpperCase());
      }
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Client / Organization name is required';
    }

    if (!abbreviation.trim()) {
      newErrors.abbreviation = 'Abbreviation is required';
    }

    // Check unique abbreviation or name unless editing self
    const duplicateName = existingClients.find(
      (c) => c.name.toLowerCase() === name.trim().toLowerCase() && c.id !== clientToEdit?.id
    );
    if (duplicateName) {
      newErrors.name = 'An organization with this name already exists';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const finalIndustry = industry === 'Other' && customIndustry.trim() ? customIndustry.trim() : industry;

    // Sync custom industry to form selectors
    if (industry === 'Other' && customIndustry.trim() && onSyncFormOption) {
      onSyncFormOption('industry', {
        label: customIndustry.trim(),
        value: customIndustry.trim(),
        color: 'blue',
        description: `Synced from client registry for ${name.trim()}`,
      });
    }

    const clientData: ClientOrganization = {
      id: clientToEdit?.id || `cli-${Date.now()}`,
      name: name.trim(),
      abbreviation: abbreviation.trim().toUpperCase(),
      industry: finalIndustry,
      clientProfile,
      primaryContactName: primaryContactName.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim() || undefined,
      remarks: remarks.trim() || undefined,
      createdAt: clientToEdit?.createdAt || new Date().toISOString(),
      updatedAt: isEditing ? new Date().toISOString() : undefined,
    };

    onSave(clientData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        id="client-modal-card"
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {isEditing ? 'Edit Client / Organization' : 'Add Client / Organization'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center space-x-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Synced with Admin</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isEditing
                  ? 'Update organization details, primary contacts, and administrative metadata'
                  : 'Register a new enterprise client account into the Master Organization Directory'}
              </p>
            </div>
          </div>
          <button
            id="close-client-modal-btn"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Organization Name & Abbreviation */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Client / Organization Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="client-name-input"
                  type="text"
                  required
                  placeholder="e.g. MetroBank Corporation"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none ${
                    errors.name ? 'border-red-500 bg-red-50/30' : 'border-slate-300'
                  }`}
                />
              </div>
              {errors.name && <p className="text-[11px] text-red-600 font-medium">{errors.name}</p>}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Abbreviation <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="client-abbreviation-input"
                  type="text"
                  required
                  maxLength={10}
                  placeholder="e.g. MBANK"
                  value={abbreviation}
                  onChange={(e) => setAbbreviation(e.target.value.toUpperCase())}
                  className={`w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-mono uppercase tracking-wider bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none ${
                    errors.abbreviation ? 'border-red-500 bg-red-50/30' : 'border-slate-300'
                  }`}
                />
              </div>
              {errors.abbreviation && <p className="text-[11px] text-red-600 font-medium">{errors.abbreviation}</p>}
            </div>
          </div>

          {/* Industry Selection & Client Profile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Industry Sector <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <select
                  id="client-industry-select"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 font-medium"
                >
                  {activeIndustries.map((ind) => (
                    <option key={ind.id} value={ind.value}>
                      {ind.label}
                    </option>
                  ))}
                  <option value="Other">+ Add Custom Industry...</option>
                </select>
              </div>
              {industry === 'Other' && (
                <div className="mt-2 animate-in fade-in duration-150">
                  <input
                    id="client-custom-industry-input"
                    type="text"
                    required
                    placeholder="Specify custom industry vertical..."
                    value={customIndustry}
                    onChange={(e) => setCustomIndustry(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-blue-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white shadow-xs font-medium"
                  />
                  <p className="text-[10px] text-blue-600 mt-1">✨ Automatically synced into Form Selector Admin master list.</p>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Client Profile <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <select
                  id="client-profile-select"
                  value={clientProfile}
                  onChange={(e) => setClientProfile(e.target.value as 'Internal' | 'External')}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 font-medium"
                >
                  {activeProfiles.length > 0 ? (
                    activeProfiles.map((p) => (
                      <option key={p.id} value={p.value}>
                        {p.label}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="External">External (Commercial Account)</option>
                      <option value="Internal">Internal (Company Business Unit)</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Primary Contact Person */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              Primary Contact Person (Full Name)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                id="client-primary-contact-input"
                type="text"
                placeholder="e.g. Rachel Vance (Chief Technology Officer)"
                value={primaryContactName}
                onChange={(e) => setPrimaryContactName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Contact Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Contact Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="client-contact-email-input"
                  type="email"
                  placeholder="rachel.vance@metrobank.example.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none font-mono text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Contact Phone
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="client-contact-phone-input"
                  type="tel"
                  placeholder="+1 (212) 555-0194"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              Remarks & Administrative Notes
            </label>
            <textarea
              id="client-remarks-input"
              rows={2}
              placeholder="Enterprise account notes, security requirements, master agreement terms, billing quirks..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              id="cancel-client-modal-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="submit-client-modal-btn"
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Building2 className="w-4 h-4" />
              <span>{isEditing ? 'Save Changes' : 'Create Organization'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
