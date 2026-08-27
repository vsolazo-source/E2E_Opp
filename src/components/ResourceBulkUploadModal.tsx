import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Layers,
  ArrowRight,
  User,
} from 'lucide-react';
import { ResourceMember } from '../types';

interface ResourceBulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (resources: ResourceMember[], mode: 'APPEND' | 'REPLACE') => void;
  existingResources?: ResourceMember[];
}

interface ParsedRow {
  name: string;
  role: string;
  division?: string;
  department: string;
  email: string;
  contactNumber?: string;
  remarks?: string;
  isValid: boolean;
  errors: string[];
}

const SAMPLE_CSV_CONTENT = `Resource Name,Role,Division,Business Unit,Email Address,Contact Number,Remarks
Marcus Sterling,Principal Enterprise Account Executive,Commercial Banking,Financial Services,marcus.sterling@enterprise-solutions.com,+1 (555) 234-8901,Lead deal owner for Tier-1 Strategic Accounts
Vikram Patel,Lead Cloud Solutions Architect,Public Sector & Infrastructure,Cloud Engineering,vikram.patel@enterprise-solutions.com,+1 (555) 456-7890,Kubernetes and multi-region infrastructure lead
Elena Rostova,Finance Director & Deal Desk Lead,Corporate Advisory,Finance & Operations,elena.rostova@enterprise-solutions.com,+1 (555) 789-0123,Enterprise deal margin and pricing committee
Arthur Pendelton,Commercial Counsel & EVP,Legal & Governance,Corporate Legal,arthur.pendelton@enterprise-solutions.com,+1 (555) 678-9012,MSA and SOW contract sign-off authority
Carlos Mendez,Senior PMO Program Director,Global Delivery,PMO & Project Delivery,carlos.mendez@enterprise-solutions.com,+1 (555) 901-2345,PMO kickoff and CWC delivery sign-off`;

export const ResourceBulkUploadModal: React.FC<ResourceBulkUploadModalProps> = ({
  isOpen,
  onClose,
  onImport,
  existingResources = [],
}) => {
  const [activeTab, setActiveTab] = useState<'FILE' | 'PASTE'>('FILE');
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importMode, setImportMode] = useState<'APPEND' | 'REPLACE'>('APPEND');
  const [parseError, setParseError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const parseCsvText = (text: string) => {
    try {
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (lines.length === 0) {
        setParseError('Provided CSV data is empty.');
        setParsedRows([]);
        return;
      }

      // Check if line 0 is a header
      const headerLine = lines[0].toLowerCase();
      const hasHeader =
        headerLine.includes('name') ||
        headerLine.includes('role') ||
        headerLine.includes('division') ||
        headerLine.includes('unit') ||
        headerLine.includes('email') ||
        headerLine.includes('department');

      const is7ColFormat = headerLine.includes('division') || (lines[0].split(',').length >= 7);

      const startIndex = hasHeader ? 1 : 0;

      const dataLines = lines.slice(startIndex);
      if (dataLines.length === 0) {
        setParseError('No data rows found in CSV.');
        setParsedRows([]);
        return;
      }

      const rows: ParsedRow[] = [];
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      dataLines.forEach((line) => {
        const cols = line
          .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
          .map((col) => col.trim().replace(/^"(.*)"$/, '$1').trim());

        let name = '';
        let role = '';
        let division = '';
        let department = '';
        let email = '';
        let contactNumber = '';
        let remarks = '';

        if (cols.length >= 7 || is7ColFormat) {
          name = cols[0] || '';
          role = cols[1] || '';
          division = cols[2] || '';
          department = cols[3] || '';
          email = (cols[4] || '').toLowerCase();
          contactNumber = cols[5] || '';
          remarks = cols[6] || '';
        } else {
          name = cols[0] || '';
          role = cols[1] || '';
          division = 'General Operations';
          department = cols[2] || '';
          email = (cols[3] || '').toLowerCase();
          contactNumber = cols[4] || '';
          remarks = cols[5] || '';
        }

        const errors: string[] = [];
        if (!name) errors.push('Missing Name');
        if (!role) errors.push('Missing Role');
        if (!department) errors.push('Missing Business Unit');
        if (!email) {
          errors.push('Missing Email');
        } else if (!emailRegex.test(email)) {
          errors.push('Invalid Email');
        }

        rows.push({
          name,
          role,
          division: division || 'General Operations',
          department,
          email,
          contactNumber: contactNumber || undefined,
          remarks: remarks || undefined,
          isValid: errors.length === 0,
          errors,
        });
      });

      setParsedRows(rows);
      setParseError(null);
    } catch (err: any) {
      setParseError(`Failed to parse CSV: ${err.message || 'Unknown formatting error'}`);
      setParsedRows([]);
    }
  };

  const parseJsonText = (text: string) => {
    try {
      const data = JSON.parse(text);
      const items = Array.isArray(data) ? data : [data];
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      const rows: ParsedRow[] = items.map((item: any) => {
        const name = item.name || item.resourceName || item['Resource Name'] || '';
        const role = item.role || item.title || item['Role'] || '';
        const division = item.division || item.Division || item['Division'] || 'General Operations';
        const department = item.department || item.dept || item.businessUnit || item['Business Unit'] || item['Department'] || '';
        const email = (item.email || item.emailAddress || item['Email Address'] || item.contactEmail || '').toLowerCase();
        const contactNumber = item.contactNumber || item.phone || item['Contact Number'] || '';
        const remarks = item.remarks || item.notes || item['Remarks'] || '';

        const errors: string[] = [];
        if (!name) errors.push('Missing Name');
        if (!role) errors.push('Missing Role');
        if (!department) errors.push('Missing Business Unit');
        if (!email) {
          errors.push('Missing Email');
        } else if (!emailRegex.test(email)) {
          errors.push('Invalid Email');
        }

        return {
          name,
          role,
          division,
          department,
          email,
          contactNumber: contactNumber || undefined,
          remarks: remarks || undefined,
          isValid: errors.length === 0,
          errors,
        };
      });

      setParsedRows(rows);
      setParseError(null);
    } catch (err: any) {
      setParseError(`Failed to parse JSON: ${err.message}`);
      setParsedRows([]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (selected.name.endsWith('.json')) {
        parseJsonText(content);
      } else {
        parseCsvText(content);
      }
    };
    reader.readAsText(selected);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;
    setFile(droppedFile);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (droppedFile.name.endsWith('.json')) {
        parseJsonText(content);
      } else {
        parseCsvText(content);
      }
    };
    reader.readAsText(droppedFile);
  };

  const handlePasteChange = (val: string) => {
    setPastedText(val);
    if (!val.trim()) {
      setParsedRows([]);
      setParseError(null);
      return;
    }

    if (val.trim().startsWith('{') || val.trim().startsWith('[')) {
      parseJsonText(val);
    } else {
      parseCsvText(val);
    }
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'resources_bulk_upload_template.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const validRowsCount = parsedRows.filter((r) => r.isValid).length;

  const handleExecuteImport = () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    const newResources: ResourceMember[] = validRows.map((r, idx) => ({
      id: `res-bulk-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
      name: r.name,
      role: r.role,
      division: r.division || 'General Operations',
      department: r.department,
      email: r.email,
      contactNumber: r.contactNumber,
      remarks: r.remarks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    onImport(newResources, importMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        id="resource-bulk-upload-modal-container"
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Bulk Upload Team & Stakeholder Resources
              </h3>
              <p className="text-xs text-slate-300">
                Import multiple team members, enterprise architects, legal counsel, and project directors from CSV or JSON
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

        {/* Tab Selector & Template Download */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('FILE')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'FILE'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Upload File (.csv / .json)</span>
            </button>
            <button
              onClick={() => setActiveTab('PASTE')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'PASTE'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Paste Text</span>
            </button>
          </div>

          <button
            type="button"
            id="download-resource-csv-template-btn"
            onClick={handleDownloadTemplate}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-200 transition-colors flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Sample CSV Template</span>
          </button>
        </div>

        {/* Modal Main Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm">
          {activeTab === 'FILE' ? (
            <div>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-blue-500 bg-blue-50/50'
                    : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-white'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Upload className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                <p className="font-semibold text-slate-800">
                  {file ? file.name : 'Click to select or drag and drop CSV or JSON file'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supported formats: comma-delimited .csv or array of resource objects .json
                </p>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Paste CSV or JSON Rows
              </label>
              <textarea
                rows={5}
                value={pastedText}
                onChange={(e) => handlePasteChange(e.target.value)}
                placeholder={`Resource Name,Role,Department,Email Address,Contact Number,Remarks\nRachel Green,Senior Account Executive,Sales & Commercial,rachel@enterprise-solutions.com,+1 (555) 123-4567,Enterprise retail lead`}
                className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
              />
            </div>
          )}

          {parseError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Parsed Rows Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-800 flex items-center space-x-2">
                  <span>Data Preview ({parsedRows.length} Rows Detected)</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                    {validRowsCount} Valid
                  </span>
                  {parsedRows.length - validRowsCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                      {parsedRows.length - validRowsCount} Invalid
                    </span>
                  )}
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Resource Name</th>
                      <th className="py-2 px-3">Role</th>
                      <th className="py-2 px-3">Division</th>
                      <th className="py-2 px-3">Business Unit</th>
                      <th className="py-2 px-3">Email Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className={row.isValid ? 'hover:bg-slate-50' : 'bg-red-50/50'}>
                        <td className="py-2 px-3">
                          {row.isValid ? (
                            <span className="inline-flex items-center text-emerald-600 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              Ready
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-red-600 font-semibold" title={row.errors.join(', ')}>
                              <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                              {row.errors.join(', ')}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-800">{row.name || '—'}</td>
                        <td className="py-2 px-3 text-slate-600">{row.role || '—'}</td>
                        <td className="py-2 px-3 text-slate-600">
                          <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 text-[10px]">
                            {row.division || '—'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px]">
                            {row.department || '—'}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-500">{row.email || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import Mode Radio selection */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Import Mode Strategy
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label
                className={`p-2.5 rounded-lg border flex items-center space-x-2.5 cursor-pointer transition-colors ${
                  importMode === 'APPEND'
                    ? 'bg-blue-50 border-blue-400 text-blue-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="resourceImportMode"
                  value="APPEND"
                  checked={importMode === 'APPEND'}
                  onChange={() => setImportMode('APPEND')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-bold text-xs">Append to Existing ({existingResources.length})</div>
                  <div className="text-[11px] text-slate-500">
                    Add new members and keep existing roster
                  </div>
                </div>
              </label>

              <label
                className={`p-2.5 rounded-lg border flex items-center space-x-2.5 cursor-pointer transition-colors ${
                  importMode === 'REPLACE'
                    ? 'bg-red-50 border-red-400 text-red-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="resourceImportMode"
                  value="REPLACE"
                  checked={importMode === 'REPLACE'}
                  onChange={() => setImportMode('REPLACE')}
                  className="text-red-600 focus:ring-red-500"
                />
                <div>
                  <div className="font-bold text-xs">Replace All Resources</div>
                  <div className="text-[11px] text-slate-500">
                    Overwrite complete directory with imported rows
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          <div className="text-xs text-slate-500">
            {validRowsCount > 0
              ? `${validRowsCount} valid resource records ready to be loaded`
              : 'Upload a CSV or paste data to proceed'}
          </div>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              id="execute-resource-bulk-import-btn"
              disabled={validRowsCount === 0}
              onClick={handleExecuteImport}
              className={`px-5 py-2 text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer ${
                validRowsCount > 0
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import {validRowsCount} Resources</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
