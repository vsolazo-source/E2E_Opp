import React, { useState, useRef } from 'react';
import { ClientOrganization } from '../types';
import { X, Upload, Download, FileSpreadsheet, CheckCircle2, AlertTriangle, RefreshCw, FileText } from 'lucide-react';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (newClients: ClientOrganization[], mode: 'APPEND' | 'REPLACE') => void;
  existingClients: ClientOrganization[];
}

interface ParsedRow {
  name: string;
  abbreviation: string;
  industry: string;
  primaryContactName: string;
  contactEmail: string;
  contactPhone: string;
  remarks: string;
  isValid: boolean;
  error?: string;
}

const SAMPLE_CSV = `Client / Organization Name,Abbreviation,Industry,Primary Contact person (full name),Contact email / phone,Remarks
Apex Global Retail Group,APEX,Retail & E-Commerce,Gregory Martinez (Head of Digital Experience),greg.martinez@apexretail.example.com / +1 (415) 555-0142,Omnichannel 450+ store expansion
Aegis Cyber Defense LLC,AEGIS,Cybersecurity & Risk,Elena Zhao (VP Information Security),elena.zhao@aegiscyber.example.com / +1 (202) 555-0199,SOC Tier 3 monitoring partner
BioPharm Innovations Inc,BIOPH,Healthcare & Life Sciences,Dr. Alan Turing,alan.turing@biopharm.example.org / +1 (617) 555-0111,FDA validated genomics pipeline
Horizon Media Group,HORIZ,Media & Telecommunications,Chloe Bennett,chloe@horizonmedia.example.com / +1 (310) 555-0177,Multi-cloud streaming distribution`;

export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({
  isOpen,
  onClose,
  onImport,
  existingClients,
}) => {
  const [activeTab, setActiveTab] = useState<'FILE' | 'PASTE'>('FILE');
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pasteText, setPasteText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importMode, setImportMode] = useState<'APPEND' | 'REPLACE'>('APPEND');
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const parseCsvText = (csvString: string) => {
    setParseError(null);
    try {
      const lines = csvString.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length === 0) {
        setParsedRows([]);
        return;
      }

      // Check if first line is header
      let dataLines = lines;
      const firstLineLower = lines[0].toLowerCase();
      if (firstLineLower.includes('name') || firstLineLower.includes('client') || firstLineLower.includes('abbreviation')) {
        dataLines = lines.slice(1);
      }

      if (dataLines.length === 0) {
        setParseError('No data rows found in CSV.');
        setParsedRows([]);
        return;
      }

      const rows: ParsedRow[] = dataLines.map((line, idx) => {
        // Handle quoted CSV cells
        const tokens: string[] = [];
        let cur = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"' || char === "'") {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            tokens.push(cur.trim());
            cur = '';
          } else {
            cur += char;
          }
        }
        tokens.push(cur.trim());

        const name = (tokens[0] || '').replace(/^["']|["']$/g, '').trim();
        const abbreviation = (tokens[1] || (name.slice(0, 5).toUpperCase())).replace(/^["']|["']$/g, '').trim().toUpperCase();
        const industry = (tokens[2] || 'Professional Services & Legal').replace(/^["']|["']$/g, '').trim();
        const primaryContactName = (tokens[3] || '').replace(/^["']|["']$/g, '').trim();
        
        // Contact email / phone might be combined or separate
        const contactInfo = (tokens[4] || '').replace(/^["']|["']$/g, '').trim();
        let contactEmail = '';
        let contactPhone = '';
        if (contactInfo.includes('/')) {
          const parts = contactInfo.split('/');
          contactEmail = parts[0].trim();
          contactPhone = parts[1].trim();
        } else if (contactInfo.includes('@')) {
          contactEmail = contactInfo;
        } else {
          contactPhone = contactInfo;
        }

        const remarks = (tokens[5] || (tokens.slice(5).join(', '))).replace(/^["']|["']$/g, '').trim();

        const isValid = Boolean(name && name.length >= 2);
        let error = undefined;
        if (!name) {
          error = 'Organization Name missing';
        }

        return {
          name,
          abbreviation: abbreviation || 'ORG',
          industry: industry || 'Other',
          primaryContactName,
          contactEmail,
          contactPhone,
          remarks,
          isValid,
          error,
        };
      });

      setParsedRows(rows);
    } catch (err: any) {
      setParseError(err?.message || 'Failed to parse CSV file.');
      setParsedRows([]);
    }
  };

  const parseJsonText = (jsonString: string) => {
    setParseError(null);
    try {
      const data = JSON.parse(jsonString);
      const arrayData = Array.isArray(data) ? data : data.clients || data.organizations || [data];
      const rows: ParsedRow[] = arrayData.map((item: any) => {
        const name = (item.name || item.clientName || '').trim();
        const abbreviation = (item.abbreviation || item.abbr || name.slice(0, 4).toUpperCase()).trim().toUpperCase();
        const industry = (item.industry || item.clientIndustry || 'Other').trim();
        const primaryContactName = (item.primaryContactName || item.contactPerson || item.clientContactName || '').trim();
        const contactEmail = (item.contactEmail || item.clientContactEmail || item.email || '').trim();
        const contactPhone = (item.contactPhone || item.phone || '').trim();
        const remarks = (item.remarks || item.notes || item.description || '').trim();

        return {
          name,
          abbreviation,
          industry,
          primaryContactName,
          contactEmail,
          contactPhone,
          remarks,
          isValid: Boolean(name),
          error: !name ? 'Missing name' : undefined,
        };
      });
      setParsedRows(rows);
    } catch (err: any) {
      setParseError('Invalid JSON format.');
      setParsedRows([]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (file.name.endsWith('.json')) {
        parseJsonText(content);
      } else {
        parseCsvText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (file.name.endsWith('.json')) {
        parseJsonText(content);
      } else {
        parseCsvText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'client_directory_template.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleApplyPaste = () => {
    if (pasteText.trim().startsWith('{') || pasteText.trim().startsWith('[')) {
      parseJsonText(pasteText);
    } else {
      parseCsvText(pasteText);
    }
  };

  const handleCommitImport = () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    const newClients: ClientOrganization[] = validRows.map((r, i) => ({
      id: `cli-${Date.now()}-${i}`,
      name: r.name,
      abbreviation: r.abbreviation,
      industry: r.industry,
      primaryContactName: r.primaryContactName,
      contactEmail: r.contactEmail,
      contactPhone: r.contactPhone,
      remarks: r.remarks,
      createdAt: new Date().toISOString(),
    }));

    onImport(newClients, importMode);
    onClose();
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        id="bulk-upload-modal-card"
        className="bg-white w-full max-w-3xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600/30 rounded-lg border border-blue-500/40 text-blue-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Bulk Upload Clients & Organizations</h3>
              <p className="text-xs text-slate-300">
                Import multiple enterprise accounts via CSV spreadsheet or JSON manifest
              </p>
            </div>
          </div>
          <button
            id="close-bulk-upload-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Controls Bar: Tabs & Download Template */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                id="tab-file-upload-btn"
                onClick={() => setActiveTab('FILE')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  activeTab === 'FILE'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Upload File (.csv / .json)
              </button>
              <button
                type="button"
                id="tab-paste-data-btn"
                onClick={() => setActiveTab('PASTE')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  activeTab === 'PASTE'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Paste CSV Text
              </button>
            </div>

            <button
              id="download-sample-template-btn"
              type="button"
              onClick={handleDownloadTemplate}
              className="flex items-center space-x-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100/80 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Sample CSV Template</span>
            </button>
          </div>

          {/* Tab 1: File Dropzone */}
          {activeTab === 'FILE' && (
            <div>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50/50'
                    : fileName
                    ? 'border-emerald-400 bg-emerald-50/20'
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="p-3 bg-white rounded-full shadow-xs border border-slate-200 text-blue-600">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-800">
                      {fileName ? fileName : 'Click to browse or drag & drop CSV/JSON file here'}
                    </span>
                    <p className="text-xs text-slate-500 mt-1">
                      Supports comma-separated CSV with headers (Name, Abbreviation, Industry, Contact, Phone, Remarks)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Paste Raw Data */}
          {activeTab === 'PASTE' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase text-slate-700">
                  Paste Raw CSV or JSON
                </label>
                <button
                  type="button"
                  onClick={() => setPasteText(SAMPLE_CSV)}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  Load Sample Data
                </button>
              </div>
              <textarea
                rows={5}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Client / Organization Name,Abbreviation,Industry,Primary Contact person (full name),Contact email / phone,Remarks..."
                className="w-full p-3 font-mono text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleApplyPaste}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-colors flex items-center space-x-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Parse Text Input</span>
              </button>
            </div>
          )}

          {/* Parse Error Notification */}
          {parseError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-xs text-red-700">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Parsed Rows Preview */}
          {parsedRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Preview Data ({parsedRows.length} Rows Detected)
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {validCount} Valid
                  </span>
                  {invalidCount > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {invalidCount} Incomplete
                    </span>
                  )}
                </div>

                {/* Import Strategy */}
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-slate-500 font-medium">Mode:</span>
                  <label className="inline-flex items-center space-x-1 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="APPEND"
                      checked={importMode === 'APPEND'}
                      onChange={() => setImportMode('APPEND')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-700">Append ({existingClients.length} existing)</span>
                  </label>
                  <label className="inline-flex items-center space-x-1 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="REPLACE"
                      checked={importMode === 'REPLACE'}
                      onChange={() => setImportMode('REPLACE')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-700">Replace All</span>
                  </label>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-semibold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="p-2 pl-3">Organization Name</th>
                      <th className="p-2">Abbr</th>
                      <th className="p-2">Industry</th>
                      <th className="p-2">Primary Contact</th>
                      <th className="p-2">Email / Phone</th>
                      <th className="p-2 pr-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((row, idx) => (
                      <tr
                        key={idx}
                        className={row.isValid ? 'hover:bg-slate-50/80' : 'bg-red-50/50 hover:bg-red-50'}
                      >
                        <td className="p-2 pl-3 font-semibold text-slate-800">{row.name || '—'}</td>
                        <td className="p-2 font-mono uppercase text-slate-600">{row.abbreviation}</td>
                        <td className="p-2 text-slate-600">{row.industry}</td>
                        <td className="p-2 text-slate-600">{row.primaryContactName || '—'}</td>
                        <td className="p-2 text-slate-500 font-mono text-[11px]">
                          {row.contactEmail || row.contactPhone ? (
                            <span>
                              {row.contactEmail} {row.contactPhone && `(${row.contactPhone})`}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="p-2 pr-3">
                          {row.isValid ? (
                            <span className="text-emerald-600 flex items-center font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Ready
                            </span>
                          ) : (
                            <span className="text-red-600 flex items-center font-medium">
                              <AlertTriangle className="w-3.5 h-3.5 mr-1" /> {row.error || 'Error'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {parsedRows.length === 0
                ? 'Select a file or paste CSV text to preview'
                : `${validCount} clients will be imported.`}
            </span>
            <div className="flex items-center space-x-3">
              <button
                id="cancel-bulk-upload-btn"
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                id="commit-bulk-upload-btn"
                type="button"
                disabled={validCount === 0}
                onClick={handleCommitImport}
                className={`px-5 py-2 text-sm font-semibold text-white rounded-lg shadow-xs transition-colors flex items-center space-x-1.5 ${
                  validCount === 0
                    ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>
                  {importMode === 'APPEND'
                    ? `Append ${validCount} Clients`
                    : `Replace with ${validCount} Clients`}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
