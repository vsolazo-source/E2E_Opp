import React, { useState, useMemo } from 'react';
import {
  X,
  Sliders,
  Building2,
  Briefcase,
  AlertCircle,
  Activity,
  UserCheck,
  FileSignature,
  Plus,
  Search,
  RotateCcw,
  Download,
  Edit2,
  Trash2,
  Check,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Info,
  Layers,
  Palette,
  ShieldCheck,
  RefreshCw,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import {
  FormOptionItem,
  FormSelectorCategoryKey,
  FormSelectorsConfig,
} from '../types';
import { INITIAL_FORM_SELECTORS } from '../data/mockFormSelectors';

interface FormSelectorAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: FormSelectorsConfig;
  onUpdateConfig: (newConfig: FormSelectorsConfig) => void;
}

interface CategoryMeta {
  key: FormSelectorCategoryKey;
  title: string;
  shortTitle: string;
  icon: React.ElementType;
  description: string;
  usedInLocations: string[];
  defaultValuesSummary: string;
}

const CATEGORIES: CategoryMeta[] = [
  {
    key: 'industry',
    title: 'Industry Directory',
    shortTitle: 'Industry',
    icon: Building2,
    description: 'Master list of enterprise market sectors for client categorization and opportunity segmentation.',
    usedInLocations: ['New Opportunity Modal', 'Client Organization Modal', 'Client Master Directory Filter', 'Pipeline Analytics'],
    defaultValuesSummary: 'Banking & Financial Services, Healthcare, Retail & E-Commerce, Logistics, Energy, Telecom...',
  },
  {
    key: 'department',
    title: 'Business Unit Directory',
    shortTitle: 'Business Unit',
    icon: Layers,
    description: 'Operating business units, practice teams, and delivery groups for deal assignment and resource staffing.',
    usedInLocations: ['New Opportunity Business Unit', 'Resource Directory Business Unit', 'Resource Modal', 'Stage Workload Allocation'],
    defaultValuesSummary: 'Cloud & Infra, Digital Apps, Enterprise AI, Managed Services, Cybersecurity, Sales, Architecture, Legal, Finance, PMO, Billing',
  },
  {
    key: 'division',
    title: 'Division Directory',
    shortTitle: 'Division',
    icon: Briefcase,
    description: 'Corporate operating divisions and business groups governing strategic practice lines and regional delivery.',
    usedInLocations: ['New Opportunity Division', 'Resource Directory Division', 'Resource Modal', 'Executive Analytics'],
    defaultValuesSummary: 'Financial Services & FinTech, Enterprise Cloud & Infrastructure, Digital Applications & AI, Healthcare & Public Sector, Global Advisory & Consulting...',
  },
  {
    key: 'role',
    title: 'Role & Job Title Directory',
    shortTitle: 'Role / Title',
    icon: UserCheck,
    description: 'Master list of enterprise resource job titles and delivery roles synced directly with team member onboarding and staffing.',
    usedInLocations: ['Add Resource Modal', 'Resource Directory', 'Opportunity Assignee', 'Delivery Staffing'],
    defaultValuesSummary: 'Principal Account Executive, Solutions Architect, AI Practice Lead, Systems Engineer, Legal Counsel, PMO Director...',
  },
  {
    key: 'priority',
    title: 'Priority Levels',
    shortTitle: 'Priority',
    icon: AlertCircle,
    description: 'Urgency classifications that govern deal SLAs, turnaround targets, and executive escalations.',
    usedInLocations: ['New Opportunity Priority Selector', 'Opportunity Header SLA Badge', 'Kanban Board Filter', 'Executive Escalation Desk'],
    defaultValuesSummary: 'Critical (24h SLA), High (48h SLA), Medium (Standard), Low (Flexible)',
  },
  {
    key: 'opportunityStatus',
    title: 'Opportunity Status',
    shortTitle: 'Opp Status',
    icon: Activity,
    description: 'Macro operational statuses for deals across active execution, budgetary sizing, on-hold pauses, and outcomes.',
    usedInLocations: ['Opportunity Header Status', 'Pipeline Stage Overview', 'Opportunity List Filter', 'Revenue Forecast'],
    defaultValuesSummary: 'Active, On Hold, Budgetary, Won, Lost, Cancelled',
  },
  {
    key: 'clientProfile',
    title: 'Client Profile',
    shortTitle: 'Client Profile',
    icon: Tag,
    description: 'Classification model distinguishing internal corporate business units / subsidiaries from external commercial accounts.',
    usedInLocations: ['Client Directory Filter & Tags', 'Client Modal Profile Selector', 'Opportunity Intake Client Link'],
    defaultValuesSummary: 'Internal, External',
  },
  {
    key: 'contractType',
    title: 'Contract Type',
    shortTitle: 'Contract Type',
    icon: FileSignature,
    description: 'Legal agreement classifications and templates utilized during Stage 4 (Contracts Team Review & Record), Stage 7 (Contract Conversion), and DocuSign generation.',
    usedInLocations: ['Stage 4 Contracts Review', 'Stage 7 Contract Conversion', 'Legal & SOW Details Panel', 'Revenue Compliance'],
    defaultValuesSummary: 'Service Order, Service Agreement, Variation Order, Extension Letter, Work Authorization Request, Renewal Letter, Termination Letter, SOW, Proposal, Amendment',
  },
];

const PRESET_COLORS = [
  { name: 'Blue', value: 'blue', bg: 'bg-blue-100 text-blue-800 border-blue-200' },
  { name: 'Indigo', value: 'indigo', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { name: 'Purple', value: 'purple', bg: 'bg-purple-100 text-purple-800 border-purple-200' },
  { name: 'Emerald', value: 'emerald', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { name: 'Teal', value: 'teal', bg: 'bg-teal-100 text-teal-800 border-teal-200' },
  { name: 'Cyan', value: 'cyan', bg: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  { name: 'Amber', value: 'amber', bg: 'bg-amber-100 text-amber-800 border-amber-200' },
  { name: 'Rose', value: 'rose', bg: 'bg-rose-100 text-rose-800 border-rose-200' },
  { name: 'Red', value: 'red', bg: 'bg-red-100 text-red-800 border-red-200' },
  { name: 'Slate', value: 'slate', bg: 'bg-slate-100 text-slate-800 border-slate-200' },
];

export const FormSelectorAdminModal: React.FC<FormSelectorAdminModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
}) => {
  if (!isOpen) return null;

  const [activeCategory, setActiveCategory] = useState<FormSelectorCategoryKey>('industry');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Edit / Add Item Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FormOptionItem | null>(null);
  
  // Item Form Fields
  const [formLabel, setFormLabel] = useState('');
  const [formValue, setFormValue] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formColor, setFormColor] = useState('blue');
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [formError, setFormError] = useState('');

  // Confirmation modals
  const [showCategoryResetConfirm, setShowCategoryResetConfirm] = useState(false);

  // Safe fallback configuration ensuring no category is undefined or empty
  const safeConfig = useMemo<FormSelectorsConfig>(() => {
    return {
      industries: Array.isArray(config?.industries) && config.industries.length > 0 ? config.industries : INITIAL_FORM_SELECTORS.industries,
      departments: Array.isArray(config?.departments) && config.departments.length > 0 ? config.departments : INITIAL_FORM_SELECTORS.departments,
      divisions: Array.isArray(config?.divisions) && config.divisions.length > 0 ? config.divisions : INITIAL_FORM_SELECTORS.divisions,
      roles: Array.isArray(config?.roles) && config.roles.length > 0 ? config.roles : INITIAL_FORM_SELECTORS.roles,
      priorities: Array.isArray(config?.priorities) && config.priorities.length > 0 ? config.priorities : INITIAL_FORM_SELECTORS.priorities,
      opportunityStatuses: Array.isArray(config?.opportunityStatuses) && config.opportunityStatuses.length > 0 ? config.opportunityStatuses : INITIAL_FORM_SELECTORS.opportunityStatuses,
      clientProfiles: Array.isArray(config?.clientProfiles) && config.clientProfiles.length > 0 ? config.clientProfiles : INITIAL_FORM_SELECTORS.clientProfiles,
      contractTypes: Array.isArray(config?.contractTypes) && config.contractTypes.length > 0 ? config.contractTypes : INITIAL_FORM_SELECTORS.contractTypes,
    };
  }, [config]);

  // Active Category Meta
  const currentCategoryMeta = useMemo(() => {
    return CATEGORIES.find((c) => c.key === activeCategory) || CATEGORIES[0];
  }, [activeCategory]);

  // Current items for active category (guaranteed array)
  const activeItems: FormOptionItem[] = useMemo(() => {
    switch (activeCategory) {
      case 'industry':
        return safeConfig.industries;
      case 'department':
        return safeConfig.departments;
      case 'division':
        return safeConfig.divisions;
      case 'role':
        return safeConfig.roles;
      case 'priority':
        return safeConfig.priorities;
      case 'opportunityStatus':
        return safeConfig.opportunityStatuses;
      case 'clientProfile':
        return safeConfig.clientProfiles;
      case 'contractType':
        return safeConfig.contractTypes;
      default:
        return [];
    }
  }, [activeCategory, safeConfig]);

  // Filtered items by search term
  const filteredItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return activeItems;
    return activeItems.filter(
      (item) =>
        (item.label || '').toLowerCase().includes(q) ||
        (item.value || '').toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q)
    );
  }, [activeItems, searchTerm]);

  // Global Statistics
  const globalStats = useMemo(() => {
    const totalOptions =
      safeConfig.industries.length +
      safeConfig.departments.length +
      safeConfig.divisions.length +
      safeConfig.roles.length +
      safeConfig.priorities.length +
      safeConfig.opportunityStatuses.length +
      safeConfig.clientProfiles.length +
      safeConfig.contractTypes.length;

    const activeCount =
      safeConfig.industries.filter((i) => i.isActive !== false).length +
      safeConfig.departments.filter((i) => i.isActive !== false).length +
      safeConfig.divisions.filter((i) => i.isActive !== false).length +
      safeConfig.roles.filter((i) => i.isActive !== false).length +
      safeConfig.priorities.filter((i) => i.isActive !== false).length +
      safeConfig.opportunityStatuses.filter((i) => i.isActive !== false).length +
      safeConfig.clientProfiles.filter((i) => i.isActive !== false).length +
      safeConfig.contractTypes.filter((i) => i.isActive !== false).length;

    return { totalOptions, activeCount };
  }, [safeConfig]);

  // Helper to update specific category array in the global config
  const updateActiveCategoryItems = (newItems: FormOptionItem[]) => {
    const updated: FormSelectorsConfig = {
      ...safeConfig,
      ...(activeCategory === 'industry' && { industries: newItems }),
      ...(activeCategory === 'department' && { departments: newItems }),
      ...(activeCategory === 'division' && { divisions: newItems }),
      ...(activeCategory === 'role' && { roles: newItems }),
      ...(activeCategory === 'priority' && { priorities: newItems }),
      ...(activeCategory === 'opportunityStatus' && { opportunityStatuses: newItems }),
      ...(activeCategory === 'clientProfile' && { clientProfiles: newItems }),
      ...(activeCategory === 'contractType' && { contractTypes: newItems }),
    };
    onUpdateConfig(updated);
  };

  // Open Edit Item Form
  const handleOpenEdit = (item: FormOptionItem) => {
    setEditingItem(item);
    setFormLabel(item.label);
    setFormValue(item.value);
    setFormDescription(item.description || '');
    setFormColor(item.color || 'blue');
    setFormIsDefault(Boolean(item.isDefault));
    setFormError('');
    setIsEditModalOpen(true);
  };

  // Open Add Item Form
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormLabel('');
    setFormValue('');
    setFormDescription('');
    setFormColor(PRESET_COLORS[activeItems.length % PRESET_COLORS.length].value);
    setFormIsDefault(activeItems.length === 0);
    setFormError('');
    setIsEditModalOpen(true);
  };

  // Save Item (Create or Update)
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLabel.trim()) {
      setFormError('Option label is required');
      return;
    }

    const valueToSave = formValue.trim() || formLabel.trim();

    // Check duplicate label within category
    const isDuplicate = activeItems.some(
      (item) =>
        item.label.toLowerCase() === formLabel.trim().toLowerCase() &&
        item.id !== editingItem?.id
    );

    if (isDuplicate) {
      setFormError(`An option labeled "${formLabel.trim()}" already exists in ${currentCategoryMeta.shortTitle}.`);
      return;
    }

    let updatedList: FormOptionItem[];

    if (editingItem) {
      // Update existing item
      updatedList = activeItems.map((item) => {
        if (item.id === editingItem.id) {
          return {
            ...item,
            label: formLabel.trim(),
            value: valueToSave,
            description: formDescription.trim() || undefined,
            color: formColor,
            isDefault: formIsDefault,
          };
        }
        // If this item was marked default, unmark others
        if (formIsDefault) {
          return { ...item, isDefault: false };
        }
        return item;
      });
    } else {
      // Create new item
      const newItem: FormOptionItem = {
        id: `${activeCategory}-${Date.now()}`,
        label: formLabel.trim(),
        value: valueToSave,
        description: formDescription.trim() || undefined,
        color: formColor,
        isDefault: formIsDefault,
        isActive: true,
        order: activeItems.length + 1,
      };

      if (formIsDefault) {
        updatedList = activeItems.map((item) => ({ ...item, isDefault: false }));
        updatedList.push(newItem);
      } else {
        updatedList = [...activeItems, newItem];
      }
    }

    updateActiveCategoryItems(updatedList);
    setIsEditModalOpen(false);
  };

  // Toggle Active State
  const handleToggleActive = (id: string) => {
    const updatedList = activeItems.map((item) => {
      if (item.id === id) {
        return { ...item, isActive: item.isActive === false ? true : false };
      }
      return item;
    });
    updateActiveCategoryItems(updatedList);
  };

  // Set as Default
  const handleSetDefault = (id: string) => {
    const updatedList = activeItems.map((item) => ({
      ...item,
      isDefault: item.id === id,
    }));
    updateActiveCategoryItems(updatedList);
  };

  // Delete Option
  const handleDeleteItem = (id: string, label: string) => {
    if (activeItems.length <= 1) {
      alert(`Cannot delete the last remaining option in ${currentCategoryMeta.shortTitle}. A minimum of 1 option is required.`);
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${label}" from ${currentCategoryMeta.shortTitle}?`)) {
      const updatedList = activeItems.filter((item) => item.id !== id);
      // If deleted item was default, assign default to first item
      const hasDefault = updatedList.some((i) => i.isDefault);
      if (!hasDefault && updatedList.length > 0) {
        updatedList[0].isDefault = true;
      }
      updateActiveCategoryItems(updatedList);
    }
  };

  // Move Order Up / Down
  const handleMoveOrder = (index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activeItems.length) return;

    const newItems = [...activeItems];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    // reindex order property
    const reordered = newItems.map((item, idx) => ({ ...item, order: idx + 1 }));
    updateActiveCategoryItems(reordered);
  };

  // Reset current category to factory initial defaults
  const handleResetCategoryDefaults = () => {
    const defaultOptions = INITIAL_FORM_SELECTORS[
      activeCategory === 'industry'
        ? 'industries'
        : activeCategory === 'department'
        ? 'departments'
        : activeCategory === 'division'
        ? 'divisions'
        : activeCategory === 'role'
        ? 'roles'
        : activeCategory === 'priority'
        ? 'priorities'
        : activeCategory === 'opportunityStatus'
        ? 'opportunityStatuses'
        : activeCategory === 'clientProfile'
        ? 'clientProfiles'
        : 'contractTypes'
    ];

    updateActiveCategoryItems(defaultOptions);
    setShowCategoryResetConfirm(false);
  };

  // Export current category as CSV
  const handleExportCategoryCsv = () => {
    const headers = ['Order', 'Label', 'Value / Code', 'Color Theme', 'Default', 'Status', 'Description'];
    const rows = activeItems.map((item, idx) => [
      `"${idx + 1}"`,
      `"${(item.label || '').replace(/"/g, '""')}"`,
      `"${(item.value || '').replace(/"/g, '""')}"`,
      `"${item.color || 'blue'}"`,
      `"${item.isDefault ? 'YES' : 'NO'}"`,
      `"${item.isActive !== false ? 'ACTIVE' : 'INACTIVE'}"`,
      `"${(item.description || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeCategory}_form_options_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get color badge class helper
  const getColorClass = (colorName?: string) => {
    const found = PRESET_COLORS.find((c) => c.value === colorName);
    return found ? found.bg : 'bg-slate-100 text-slate-800 border-slate-200';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white w-full max-w-6xl h-[92vh] max-h-[860px] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="p-4 sm:px-6 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white tracking-tight">Form Selector & Master Dropdown Admin</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" style={{ animationDuration: '6s' }} />
                  <span>Bidirectional Live Sync</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Centralized control plane for all dropdown options, roles, client profiles, and industry sectors.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden lg:flex items-center space-x-3 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs">
              <span className="text-slate-400">Total Configured:</span>
              <span className="font-bold text-white">{globalStats.totalOptions} options</span>
              <span className="text-slate-600">|</span>
              <span className="text-emerald-400 font-semibold">{globalStats.activeCount} Active</span>
            </div>

            <button
              id="close-form-selector-admin-btn"
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Body: Left Sidebar for Categories + Right Content Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Category Navigation Sidebar */}
          <aside className="w-full md:w-64 lg:w-72 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto">
            <div className="p-3 border-b border-slate-200/80 bg-slate-100/50">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Master Categories</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  {CATEGORIES.length}
                </span>
              </div>
            </div>

            <nav className="p-2 space-y-1 flex-1">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = activeCategory === cat.key;

                let count = 0;
                if (cat.key === 'industry') count = safeConfig.industries.length;
                else if (cat.key === 'department') count = safeConfig.departments.length;
                else if (cat.key === 'division') count = safeConfig.divisions.length;
                else if (cat.key === 'role') count = safeConfig.roles.length;
                else if (cat.key === 'priority') count = safeConfig.priorities.length;
                else if (cat.key === 'opportunityStatus') count = safeConfig.opportunityStatuses.length;
                else if (cat.key === 'clientProfile') count = safeConfig.clientProfiles.length;
                else if (cat.key === 'contractType') count = safeConfig.contractTypes.length;

                return (
                  <button
                    key={cat.key}
                    id={`tab-selector-${cat.key}`}
                    type="button"
                    onClick={() => {
                      setActiveCategory(cat.key);
                      setSearchTerm('');
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between group cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-700 hover:bg-slate-200/70'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200/80 text-slate-600 group-hover:bg-slate-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="truncate text-xs font-bold">{cat.shortTitle}</span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        isSelected
                          ? 'bg-blue-500/30 text-blue-200 border border-blue-400/30'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* Sidebar Footer Info */}
            <div className="p-3 m-2 rounded-xl bg-blue-50/70 border border-blue-200/60 space-y-1.5">
              <div className="flex items-center space-x-1.5 text-blue-900 font-bold text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Bidirectional Sync Engine</span>
              </div>
              <p className="text-[10px] text-blue-800/80 leading-relaxed">
                Custom roles, depts, and industries entered via modals instantly sync into this master registry.
              </p>
            </div>
          </aside>

          {/* Right Main Content Area */}
          <main className="flex-1 flex flex-col min-w-0 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/30">
            {/* Mobile Category Selector Bar (Visible only on small viewports) */}
            <div className="md:hidden flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORIES.map((cat) => {
                const isSelected = activeCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => {
                      setActiveCategory(cat.key);
                      setSearchTerm('');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex items-center space-x-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{cat.shortTitle}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Category Header Card */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-600">
                    <currentCategoryMeta.icon className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{currentCategoryMeta.title}</h4>
                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-blue-50 border border-blue-200 text-blue-700">
                    {activeItems.length} Total Options
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                  {currentCategoryMeta.description}
                </p>
                <div className="flex items-center space-x-2 pt-1">
                  <span className="text-[11px] font-medium text-slate-500">Active Form Integrations:</span>
                  <div className="flex flex-wrap items-center gap-1">
                    {currentCategoryMeta.usedInLocations.map((loc, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 border border-slate-200 text-slate-700 font-medium">
                        {loc}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons for this Category */}
              <div className="flex items-center flex-wrap gap-2 shrink-0">
                <button
                  id="btn-add-form-option"
                  type="button"
                  onClick={handleOpenAdd}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add {currentCategoryMeta.shortTitle}</span>
                </button>

                <button
                  id="btn-export-category-csv"
                  type="button"
                  onClick={handleExportCategoryCsv}
                  title="Export this category as CSV"
                  className="px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 bg-white border border-slate-300 rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span className="hidden sm:inline">Export CSV</span>
                </button>

                <button
                  id="btn-reset-category-defaults"
                  type="button"
                  onClick={() => setShowCategoryResetConfirm(true)}
                  title="Reset this category to default values"
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-red-700 hover:bg-red-50 bg-white border border-slate-300 rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reset Defaults</span>
                </button>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={`Search ${currentCategoryMeta.shortTitle} options...`}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="text-xs text-slate-500 font-medium">
                Showing <strong className="text-slate-800">{filteredItems.length}</strong> of {activeItems.length} options
              </div>
            </div>

            {/* Options Table */}
            <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-xs bg-white">
              <table className="w-full text-left text-xs border-collapse min-w-[720px]">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3 w-14 text-center">Order</th>
                    <th className="py-2.5 px-3">Option Label</th>
                    <th className="py-2.5 px-3">Value / Code</th>
                    <th className="py-2.5 px-3">Color Preview</th>
                    <th className="py-2.5 px-3">Context & Scope</th>
                    <th className="py-2.5 px-3 text-center">Default</th>
                    <th className="py-2.5 px-3 text-center">Active</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Sliders className="w-8 h-8 text-slate-300" />
                          <p className="font-semibold text-slate-700">
                            {searchTerm
                              ? `No options found matching "${searchTerm}"`
                              : `No options configured in ${currentCategoryMeta.shortTitle}`}
                          </p>
                          <div className="flex items-center space-x-2 pt-1">
                            <button
                              type="button"
                              onClick={handleOpenAdd}
                              className="px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 cursor-pointer"
                            >
                              + Add New Option
                            </button>
                            <button
                              type="button"
                              onClick={handleResetCategoryDefaults}
                              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer"
                            >
                              Restore Defaults
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item, idx) => {
                      const isActive = item.isActive !== false;
                      const isFirst = idx === 0;
                      const isLast = idx === filteredItems.length - 1;

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            !isActive ? 'opacity-50 bg-slate-50/40' : ''
                          }`}
                        >
                          {/* Reorder Buttons */}
                          <td className="py-2 px-3 text-center">
                            <div className="flex items-center justify-center space-x-0.5">
                              <button
                                type="button"
                                disabled={isFirst}
                                onClick={() => handleMoveOrder(idx, 'UP')}
                                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer"
                                title="Move Up"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={isLast}
                                onClick={() => handleMoveOrder(idx, 'DOWN')}
                                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer"
                                title="Move Down"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                          {/* Option Label */}
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            <div className="flex items-center space-x-2">
                              <span>{item.label}</span>
                              {item.isDefault && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                  Default
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Stored Value */}
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                            {item.value}
                          </td>

                          {/* Badge Color Preview */}
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getColorClass(
                                item.color
                              )}`}
                            >
                              {item.label}
                            </span>
                          </td>

                          {/* Description */}
                          <td className="py-2.5 px-3 text-slate-500 text-[11px] max-w-xs truncate" title={item.description}>
                            {item.description || <span className="text-slate-300 italic">No notes</span>}
                          </td>

                          {/* Default Toggle */}
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleSetDefault(item.id)}
                              title={item.isDefault ? 'Current default' : 'Set as default'}
                              className={`p-1 rounded-md transition-colors cursor-pointer ${
                                item.isDefault
                                  ? 'text-blue-600 bg-blue-50'
                                  : 'text-slate-300 hover:text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              <Check className={`w-4 h-4 ${item.isDefault ? 'stroke-[3]' : 'stroke-[1.5]'}`} />
                            </button>
                          </td>

                          {/* Active Toggle Switch */}
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleActive(item.id)}
                              className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                isActive ? 'bg-emerald-500' : 'bg-slate-300'
                              }`}
                              title={isActive ? 'Active (visible in forms)' : 'Inactive (hidden from new forms)'}
                            >
                              <span
                                className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  isActive ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(item)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                                title="Edit Option"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.id, item.label)}
                                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                title="Delete Option"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </main>
        </div>

        {/* Footer Summary & Close */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Changes are automatically saved and bidirectionally synchronized across all opportunity, resource, and client modals.</span>
          </div>
          <button
            id="close-form-selector-admin-bottom-btn"
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 bg-white border border-slate-300 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Close Admin
          </button>
        </div>
      </div>

      {/* Edit / Add Item Dialog Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                <h4 className="text-sm font-bold text-white">
                  {editingItem ? `Edit ${currentCategoryMeta.shortTitle} Option` : `Add New ${currentCategoryMeta.shortTitle} Option`}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Option Label */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Option Display Label *
                </label>
                <input
                  type="text"
                  required
                  value={formLabel}
                  onChange={(e) => {
                    setFormLabel(e.target.value);
                    if (!editingItem && !formValue) {
                      setFormValue(e.target.value);
                    }
                  }}
                  placeholder={
                    activeCategory === 'role'
                      ? 'e.g., Enterprise Solutions Architect'
                      : activeCategory === 'industry'
                      ? 'e.g., Financial Technology & Payments'
                      : 'e.g., Option Label'
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Stored Value / Code */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Stored Value / Key Code
                </label>
                <input
                  type="text"
                  value={formValue}
                  onChange={(e) => setFormValue(e.target.value)}
                  placeholder="e.g., Enterprise Solutions Architect"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none font-mono text-xs"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  The value stored in records. Defaults to display label if left empty.
                </p>
              </div>

              {/* Color Theme Selector */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5 flex items-center space-x-1">
                  <Palette className="w-3.5 h-3.5 text-slate-500" />
                  <span>Badge Color Theme</span>
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {PRESET_COLORS.map((col) => {
                    const isSelected = formColor === col.value;
                    return (
                      <button
                        key={col.value}
                        type="button"
                        onClick={() => setFormColor(col.value)}
                        className={`p-1.5 rounded-lg border text-center text-[10px] font-bold transition-all cursor-pointer ${col.bg} ${
                          isSelected ? 'ring-2 ring-blue-600 ring-offset-1 shadow-xs' : 'opacity-80 hover:opacity-100'
                        }`}
                      >
                        {col.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Description & Context (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Provide scope notes or responsibilities for this option..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Default Checkbox */}
              <div className="pt-1">
                <label className="flex items-center space-x-2 text-slate-700 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsDefault}
                    onChange={(e) => setFormIsDefault(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span>Set as default selected option for {currentCategoryMeta.shortTitle}</span>
                </label>
              </div>

              {/* Form Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingItem ? 'Save Changes' : 'Create Option'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Reset Confirmation Dialog */}
      {showCategoryResetConfirm && (
        <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-5 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center space-x-3 text-amber-600">
              <div className="p-3 bg-amber-100 rounded-full">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Reset {currentCategoryMeta.shortTitle} Options?</h4>
                <p className="text-xs text-slate-500">Restore factory baseline configuration</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This will restore all <strong>{currentCategoryMeta.shortTitle}</strong> dropdown options back to the original standard list ({currentCategoryMeta.defaultValuesSummary}).
            </p>

            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowCategoryResetConfirm(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetCategoryDefaults}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Confirm Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
