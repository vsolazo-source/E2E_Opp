import React, { useState, useMemo } from 'react';
import { ClientOrganization, Opportunity, FormSelectorsConfig } from '../types';
import {
  Building2,
  Plus,
  Upload,
  Search,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Download,
  AlertTriangle,
  Mail,
  Phone,
  Briefcase,
  ExternalLink,
  ShieldCheck,
  X,
  Layers,
  FileCheck2,
} from 'lucide-react';
import { ClientModal } from './ClientModal';
import { BulkUploadModal } from './BulkUploadModal';

interface ClientDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: ClientOrganization[];
  opportunities: Opportunity[];
  formSelectors?: FormSelectorsConfig;
  onAddClient: (client: ClientOrganization) => void;
  onUpdateClient: (client: ClientOrganization) => void;
  onDeleteClient: (clientId: string) => void;
  onBulkImport: (newClients: ClientOrganization[], mode: 'APPEND' | 'REPLACE') => void;
  onSelectOpportunity?: (opportunity: Opportunity) => void;
}

const CONTRACT_STAGES = new Set([
  'CONTRACT_CONVERSION',
  'FINAL_FINANCE_APPROVAL',
  'DOCUSIGN_CLIENT_ROUTING',
  'WIN_NOTIFICATION',
  'PARALLEL_EXECUTION',
  'CWC_DELIVERY',
  'FINANCE_BILLING_ENDORSEMENT',
  'DEAL_CLOSED',
]);

export const ClientDirectoryModal: React.FC<ClientDirectoryModalProps> = ({
  isOpen,
  onClose,
  clients,
  opportunities,
  formSelectors,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  onBulkImport,
  onSelectOpportunity,
}) => {
  // Filters & State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('ALL');
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);

  // Modals State
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<ClientOrganization | null>(null);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<ClientOrganization | null>(null);

  // Unique industries for filter
  const industries = useMemo(() => {
    const set = new Set<string>();
    clients.forEach((c) => {
      if (c.industry) set.add(c.industry);
    });
    return Array.from(set).sort();
  }, [clients]);

  // Compute metrics per client (Opportunities, Contracts, Contract Value)
  const clientStatsMap = useMemo(() => {
    const map = new Map<
      string,
      {
        totalOpps: number;
        activeOpps: number;
        contractCount: number;
        totalContractValue: number;
        linkedOpps: Opportunity[];
      }
    >();

    clients.forEach((c) => {
      const matchedOpps = opportunities.filter((o) => {
        if (!o.clientName || !c?.name) return false;
        const normOpp = (o.clientName || '').trim().toLowerCase();
        const normCli = (c.name || '').trim().toLowerCase();
        return (
          normOpp === normCli ||
          normOpp.includes(normCli) ||
          normCli.includes(normOpp) ||
          Boolean(c.abbreviation && o.trackingCode?.toUpperCase().includes(c.abbreviation.toUpperCase()))
        );
      });

      let contractCount = 0;
      let totalContractValue = 0;
      let activeOpps = 0;

      matchedOpps.forEach((opp) => {
        if (opp.currentStage !== 'DEAL_CLOSED') {
          activeOpps++;
        }

        const isContractPhase =
          CONTRACT_STAGES.has(opp.currentStage) || Boolean(opp.contractDetails?.contractNumber);

        if (isContractPhase) {
          contractCount++;
          const val =
            opp.finalFinanceApproval?.finalTcv ||
            opp.clientNegotiation?.finalAgreedValue ||
            opp.dealValue ||
            0;
          totalContractValue += val;
        } else {
          totalContractValue += opp.dealValue || 0;
        }
      });

      map.set(c.id, {
        totalOpps: matchedOpps.length,
        activeOpps,
        contractCount,
        totalContractValue,
        linkedOpps: matchedOpps,
      });
    });

    return map;
  }, [clients, opportunities]);

  // Filtered Clients list
  const filteredClients = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return clients.filter((client) => {
      const matchesSearch =
        q === '' ||
        (client?.name || '').toLowerCase().includes(q) ||
        (client?.abbreviation || '').toLowerCase().includes(q) ||
        (client?.industry || '').toLowerCase().includes(q) ||
        Boolean(client?.primaryContactName && client.primaryContactName.toLowerCase().includes(q)) ||
        Boolean(client?.contactEmail && client.contactEmail.toLowerCase().includes(q)) ||
        Boolean(client?.remarks && client.remarks.toLowerCase().includes(q));

      const matchesIndustry = selectedIndustry === 'ALL' || client?.industry === selectedIndustry;

      return matchesSearch && matchesIndustry;
    });
  }, [clients, searchTerm, selectedIndustry]);

  // Summary Metrics for the Directory
  const totalDirectoryContractValue = useMemo(() => {
    let total = 0;
    clientStatsMap.forEach((stats) => {
      total += stats.totalContractValue;
    });
    return total;
  }, [clientStatsMap]);

  const totalContractsCount = useMemo(() => {
    let total = 0;
    clientStatsMap.forEach((stats) => {
      total += stats.contractCount;
    });
    return total;
  }, [clientStatsMap]);

  if (!isOpen) return null;

  const handleOpenAddModal = () => {
    setClientToEdit(null);
    setIsClientModalOpen(true);
  };

  const handleOpenEditModal = (client: ClientOrganization, e: React.MouseEvent) => {
    e.stopPropagation();
    setClientToEdit(client);
    setIsClientModalOpen(true);
  };

  const handleOpenDeleteConfirm = (client: ClientOrganization, e: React.MouseEvent) => {
    e.stopPropagation();
    setClientToDelete(client);
  };

  const handleConfirmDelete = () => {
    if (clientToDelete) {
      onDeleteClient(clientToDelete.id);
      setClientToDelete(null);
      if (expandedClientId === clientToDelete.id) {
        setExpandedClientId(null);
      }
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'Client / Organization Name',
      'Abbreviation',
      'Industry',
      'Primary Contact Person',
      'Contact Email',
      'Contact Phone',
      'No. of Opportunities',
      'No. of Contracts',
      'Contract Value (USD)',
      'Remarks',
    ];

    const rows = filteredClients.map((c) => {
      const stats = clientStatsMap.get(c.id) || {
        totalOpps: 0,
        contractCount: 0,
        totalContractValue: 0,
      };
      return [
        `"${(c.name || '').replace(/"/g, '""')}"`,
        `"${c.abbreviation || ''}"`,
        `"${(c.industry || '').replace(/"/g, '""')}"`,
        `"${(c.primaryContactName || '').replace(/"/g, '""')}"`,
        `"${c.contactEmail || ''}"`,
        `"${c.contactPhone || ''}"`,
        stats.totalOpps,
        stats.contractCount,
        stats.totalContractValue,
        `"${(c.remarks || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `client_organization_directory_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div
        id="client-directory-modal"
        className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Top Header Banner */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white border-b border-slate-800 flex-shrink-0">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400 mt-0.5">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2.5">
                  <h2 className="text-xl font-extrabold tracking-tight text-white">
                    Client / Organization Directory
                  </h2>
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    Master Records
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                  Centralized registry of client organizations, corporate accounts, industry classifications, buyer contacts, and active contracts.
                </p>
              </div>
            </div>

            {/* Action Buttons & Close */}
            <div className="flex items-center space-x-2.5 self-end lg:self-center">
              <button
                id="modal-bulk-upload-clients-btn"
                onClick={() => setIsBulkUploadOpen(true)}
                className="px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-all flex items-center space-x-1.5 shadow-xs cursor-pointer"
              >
                <Upload className="w-4 h-4 text-blue-400" />
                <span>Bulk Upload</span>
              </button>

              <button
                id="modal-add-client-org-btn"
                onClick={handleOpenAddModal}
                className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Client / Organization</span>
              </button>

              <button
                id="close-client-directory-modal-btn"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick KPI Strip inside Admin Directory */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/80">
            <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Total Organizations
              </div>
              <div className="text-lg font-bold text-white mt-0.5">
                {clients.length}
              </div>
            </div>
            <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Active Contracts
              </div>
              <div className="text-lg font-bold text-blue-400 mt-0.5">
                {totalContractsCount}
              </div>
            </div>
            <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Total Portfolio Value
              </div>
              <div className="text-lg font-bold text-emerald-400 mt-0.5">
                ${totalDirectoryContractValue.toLocaleString()} USD
              </div>
            </div>
            <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Industry Sectors
              </div>
              <div className="text-lg font-bold text-slate-200 mt-0.5">
                {industries.length} Sectors
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 flex-shrink-0">
          <div className="flex flex-1 items-center gap-3">
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                id="search-client-directory-input"
                type="text"
                placeholder="Search by client name, abbreviation, industry, or contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Industry Filter Dropdown */}
            <div className="relative min-w-[180px]">
              <select
                id="filter-client-industry-select"
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="w-full pl-3 pr-8 py-1.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
              >
                <option value="ALL">All Industries ({clients.length})</option>
                {industries.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Export CSV button */}
          <div className="flex items-center space-x-2">
            <button
              id="export-client-csv-btn"
              onClick={handleExportCsv}
              title="Export Directory to CSV"
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors flex items-center space-x-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Directory Table Area */}
        <div className="overflow-y-auto flex-1">
          <table id="client-directory-table" className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-100 text-slate-700 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200 shadow-2xs">
                <th className="py-3 px-4">Client / Organization Name</th>
                <th className="py-3 px-4">Industry</th>
                <th className="py-3 px-4 text-center">No. of Opportunities</th>
                <th className="py-3 px-4 text-center">No. of Contracts</th>
                <th className="py-3 px-4 text-right">Contract Value</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Building2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">No client organizations found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {searchTerm || selectedIndustry !== 'ALL'
                        ? 'Try adjusting your search criteria or industry filters.'
                        : 'Click "Add Client / Organization" or "Bulk Upload" to populate the directory.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const stats = clientStatsMap.get(client.id) || {
                    totalOpps: 0,
                    activeOpps: 0,
                    contractCount: 0,
                    totalContractValue: 0,
                    linkedOpps: [],
                  };
                  const isExpanded = expandedClientId === client.id;

                  return (
                    <React.Fragment key={client.id}>
                      <tr
                        id={`client-row-${client.id}`}
                        onClick={() => setExpandedClientId(isExpanded ? null : client.id)}
                        className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                          isExpanded ? 'bg-blue-50/40' : ''
                        }`}
                      >
                        {/* Client / Org Name */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-2.5">
                            <button
                              type="button"
                              className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                              aria-label="Expand client details"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-blue-600" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-slate-900 hover:text-blue-600 transition-colors">
                                  {client.name}
                                </span>
                                {client.abbreviation && (
                                  <span className="px-1.5 py-0.5 font-mono text-[10px] font-bold rounded bg-slate-200 text-slate-800 tracking-wider">
                                    {client.abbreviation}
                                  </span>
                                )}
                              </div>
                              {client.primaryContactName && (
                                <div className="text-[11px] text-slate-500 flex items-center space-x-1.5 mt-0.5">
                                  <span>{client.primaryContactName}</span>
                                  {client.contactEmail && (
                                    <>
                                      <span>•</span>
                                      <span className="font-mono text-slate-400">{client.contactEmail}</span>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Industry */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                            <Briefcase className="w-3 h-3 mr-1 text-slate-500" />
                            {client.industry || 'General Industry'}
                          </span>
                        </td>

                        {/* No. of Opportunities */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center space-x-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                stats.totalOpps > 0
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {stats.totalOpps}
                            </span>
                            {stats.activeOpps > 0 && stats.activeOpps !== stats.totalOpps && (
                              <span className="text-[10px] text-slate-400 font-medium">
                                ({stats.activeOpps} active)
                              </span>
                            )}
                          </div>
                        </td>

                        {/* No. of Contracts */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              stats.contractCount > 0
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {stats.contractCount}
                          </span>
                        </td>

                        {/* Contract Value */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="font-mono font-bold text-slate-900 text-sm">
                            ${stats.totalContractValue.toLocaleString()} USD
                          </div>
                        </td>

                        {/* Actions: Edit & Delete */}
                        <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              id={`edit-client-${client.id}`}
                              onClick={(e) => handleOpenEditModal(client, e)}
                              title="Edit Client / Organization"
                              className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              id={`delete-client-${client.id}`}
                              onClick={(e) => handleOpenDeleteConfirm(client, e)}
                              title="Delete Client / Organization"
                              className="p-1.5 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Details Drawer */}
                      {isExpanded && (
                        <tr className="bg-blue-50/20 border-b border-slate-200">
                          <td colSpan={6} className="p-4 sm:p-5">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                              {/* Contact & Organization Overview */}
                              <div className="space-y-2 border-r-0 md:border-r border-slate-200 md:pr-4">
                                <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Contact Details</span>
                                </div>
                                <div className="space-y-1 text-xs">
                                  <p className="font-semibold text-slate-800">
                                    {client.primaryContactName || 'No primary contact listed'}
                                  </p>
                                  {client.contactEmail && (
                                    <div className="flex items-center space-x-1 text-slate-600">
                                      <Mail className="w-3 h-3 text-slate-400" />
                                      <a
                                        href={`mailto:${client.contactEmail}`}
                                        className="hover:underline text-blue-600 font-mono"
                                      >
                                        {client.contactEmail}
                                      </a>
                                    </div>
                                  )}
                                  {client.contactPhone && (
                                    <div className="flex items-center space-x-1 text-slate-600">
                                      <Phone className="w-3 h-3 text-slate-400" />
                                      <span>{client.contactPhone}</span>
                                    </div>
                                  )}
                                  <div className="text-[11px] text-slate-400 pt-1">
                                    Registered on: {new Date(client.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>

                              {/* Remarks & Notes */}
                              <div className="space-y-2 border-r-0 md:border-r border-slate-200 md:pr-4">
                                <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                  Administrative Remarks
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200/70 italic">
                                  {client.remarks || 'No specific administrative remarks recorded for this organization.'}
                                </p>
                              </div>

                              {/* Linked Opportunities */}
                              <div className="space-y-2">
                                <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                                  <span>Linked Pipeline Deals ({stats.linkedOpps.length})</span>
                                </div>
                                {stats.linkedOpps.length === 0 ? (
                                  <p className="text-xs text-slate-400 italic">No active or historic opportunities linked yet.</p>
                                ) : (
                                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                                    {stats.linkedOpps.map((opp) => (
                                      <div
                                        key={opp.id}
                                        onClick={() => {
                                          if (onSelectOpportunity) {
                                            onSelectOpportunity(opp);
                                            onClose();
                                          }
                                        }}
                                        className="p-1.5 rounded bg-slate-50 hover:bg-blue-50 border border-slate-200 text-xs flex items-center justify-between cursor-pointer transition-colors"
                                      >
                                        <div className="truncate mr-2">
                                          <span className="font-mono text-[10px] text-slate-500 font-semibold mr-1.5">
                                            {opp.trackingCode}
                                          </span>
                                          <span className="font-medium text-slate-800">{opp.title}</span>
                                        </div>
                                        <div className="flex items-center space-x-1.5 flex-shrink-0">
                                          <span className="font-mono font-bold text-slate-700 text-[11px]">
                                            ${(opp.dealValue || 0).toLocaleString()}
                                          </span>
                                          <ExternalLink className="w-3 h-3 text-slate-400" />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Directory Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 flex-shrink-0">
          <div>
            Showing <span className="font-bold text-slate-700">{filteredClients.length}</span> of{' '}
            <span className="font-bold text-slate-700">{clients.length}</span> client organizations
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 text-slate-400 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Master records synced with Opportunity Lifecycle & Finance Registry</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-900 text-white transition-colors"
            >
              Done
            </button>
          </div>
        </div>

        {/* Add / Edit Client Modal */}
        <ClientModal
          isOpen={isClientModalOpen}
          onClose={() => setIsClientModalOpen(false)}
          onSave={(savedClient) => {
            if (clientToEdit) {
              onUpdateClient(savedClient);
            } else {
              onAddClient(savedClient);
            }
          }}
          clientToEdit={clientToEdit}
          existingClients={clients}
          formSelectors={formSelectors}
        />

        {/* Bulk Upload Modal */}
        <BulkUploadModal
          isOpen={isBulkUploadOpen}
          onClose={() => setIsBulkUploadOpen(false)}
          onImport={onBulkImport}
          existingClients={clients}
        />

        {/* Delete Confirmation Modal */}
        {clientToDelete && (
          <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-slate-200 overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-150 space-y-4">
              <div className="flex items-center space-x-3 text-red-600">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Delete Organization?</h4>
                  <p className="text-xs text-slate-500">This action cannot be undone.</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to delete{' '}
                <strong className="text-slate-900">{clientToDelete.name}</strong> ({clientToDelete.abbreviation}) from the Client Directory?
              </p>

              {clientStatsMap.get(clientToDelete.id)?.totalOpps ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                  ⚠️ This client has{' '}
                  <strong>{clientStatsMap.get(clientToDelete.id)?.totalOpps} active/historic opportunities</strong>.
                  Deleting the directory profile will not delete historical transaction records.
                </div>
              ) : null}

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setClientToDelete(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="confirm-delete-client-btn"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Organization</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
