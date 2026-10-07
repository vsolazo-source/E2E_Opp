import React from 'react';
import { 
  X, 
  FileText, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Truck, 
  Receipt, 
  AlertTriangle, 
  Calendar, 
  UserCheck, 
  ExternalLink,
  ShieldCheck,
  Building2,
  Layers
} from 'lucide-react';
import { Opportunity } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

interface NonRecurringContractModalProps {
  isOpen: boolean;
  opportunity: Opportunity | null;
  onClose: () => void;
  onOpenOpportunityCockpit: (opp: Opportunity) => void;
}

export const NonRecurringContractModal: React.FC<NonRecurringContractModalProps> = ({
  isOpen,
  opportunity,
  onClose,
  onOpenOpportunityCockpit,
}) => {
  if (!isOpen || !opportunity) return null;

  const contractCode = opportunity.parallelFinance?.contractCode || opportunity.contractDetails?.contractNumber || 'CTR-PENDING';
  const budgetCode = opportunity.parallelFinance?.budgetCode || 'N/A';
  const tcv = opportunity.parallelFinance?.tcv || opportunity.dealValue || 0;
  const currency = opportunity.currency || 'PHP';
  const startDate = opportunity.parallelFinance?.contractStartDate;
  const endDate = opportunity.parallelFinance?.contractEndDate;

  // Calculate validity countdown
  const now = new Date().getTime();
  let daysRemaining = 0;
  let validityStatus: 'EXPIRED' | 'EXPIRING_SOON' | 'ACTIVE' = 'ACTIVE';

  if (endDate) {
    const endMs = new Date(endDate).getTime();
    daysRemaining = Math.ceil((endMs - now) / (1000 * 60 * 60 * 24));
    if (daysRemaining < 0) {
      validityStatus = 'EXPIRED';
    } else if (daysRemaining <= 60) {
      validityStatus = 'EXPIRING_SOON';
    }
  }

  // Delivery Status
  const isDelivered = opportunity.cwcRecord?.isAcceptedByClient || opportunity.currentStage === 'DEAL_CLOSED';
  const cwcNumber = opportunity.cwcRecord?.cwcNumber;
  const progressPct = opportunity.parallelPmo?.progressPercentage || (isDelivered ? 100 : 0);

  // Billing & Invoicing Status
  const billingRecord = opportunity.billingRecord;
  const isBilled = Boolean(billingRecord?.confirmedByFinanceDate || billingRecord?.invoiceNumber);
  const paymentStatus = billingRecord?.paymentStatus || 'DRAFT';
  const invoiceNumber = billingRecord?.invoiceNumber;
  const invoiceAmount = billingRecord?.totalAmount || billingRecord?.invoiceAmount || tcv;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl xl:max-w-5xl 2xl:max-w-6xl 3xl:max-w-7xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center flex-wrap gap-2">
                <span className="font-mono text-xs font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30 px-2 py-0.5 rounded-md">
                  {contractCode}
                </span>
                <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-slate-700 text-slate-200 border border-slate-600">
                  NON-RECURRING CONTRACT
                </span>
                <span className="text-xs text-slate-300">
                  {opportunity.clientName}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
                {opportunity.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* CONTRACT SUMMARY & VALIDITY ALERT */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold">Total Contract Value (TCV)</div>
              <div className="text-lg font-extrabold text-slate-900 mt-0.5">
                {formatCurrency(tcv, currency)}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">Budget: {budgetCode}</div>
            </div>

            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold">Validity Term</div>
              <div className="text-xs font-bold text-slate-800 mt-1">
                {formatDate(startDate)} → {formatDate(endDate)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {opportunity.division} • {opportunity.businessUnit}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold">Validity Status Alert</div>
              <div className="mt-1">
                {validityStatus === 'EXPIRED' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-100 text-red-800 border border-red-300 text-xs font-black">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    Expired ({Math.abs(daysRemaining)}d ago)
                  </span>
                ) : validityStatus === 'EXPIRING_SOON' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 border border-amber-300 text-xs font-black">
                    <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    Expiring in {daysRemaining} days
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    Active ({daysRemaining}d left)
                  </span>
                )}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold">Contract Owner / Lead</div>
              <div className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-blue-500" />
                {opportunity.parallelFinance?.contractOwner || opportunity.salesLead || 'Unassigned'}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                PM: {opportunity.parallelPmo?.projectManager || 'Unassigned PM'}
              </div>
            </div>
          </div>

          {/* 3-PILLAR TRACKING: DELIVERED • BILLED • INVOICED */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* 1. DELIVERY STATUS CARD */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="p-1.5 rounded-lg bg-cyan-100 text-cyan-700">
                    <Truck className="w-4 h-4" />
                  </span>
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                    1. Delivery Status
                  </h4>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                  isDelivered 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : progressPct > 0
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {isDelivered ? 'DELIVERED' : progressPct > 0 ? `${progressPct}% IN PROGRESS` : 'PENDING'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">CWC Signoff Status:</span>
                  <span className="font-semibold text-slate-800">
                    {cwcNumber ? (
                      <span className="text-emerald-700 font-bold">
                        {cwcNumber} {opportunity.cwcRecord?.isAcceptedByClient ? '— Client Accepted' : '— Issued'}
                      </span>
                    ) : (
                      'CWC Not Yet Generated'
                    )}
                  </span>
                </div>

                {opportunity.cwcRecord?.clientApproverName && (
                  <div>
                    <span className="text-slate-400 block text-[10px]">Client Signer:</span>
                    <span className="text-slate-700">{opportunity.cwcRecord.clientApproverName}</span>
                  </div>
                )}

                <div>
                  <span className="text-slate-400 block text-[10px]">Milestones Completed:</span>
                  <span className="text-slate-700">
                    {(opportunity.parallelPmo?.milestones || []).filter((m) => m.status === 'COMPLETED').length} of {(opportunity.parallelPmo?.milestones || []).length || 1} milestones
                  </span>
                </div>
              </div>
            </div>

            {/* 2. BILLED STATUS CARD */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
                    <Receipt className="w-4 h-4" />
                  </span>
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                    2. Billing Status
                  </h4>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                  isBilled
                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {isBilled ? 'BILLED' : 'NOT BILLED'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Finance Endorsement:</span>
                  <span className="font-semibold text-slate-800">
                    {billingRecord?.confirmedByFinanceDate 
                      ? formatDate(billingRecord.confirmedByFinanceDate) 
                      : opportunity.currentStage === 'FINANCE_BILLING_ENDORSEMENT'
                      ? 'Under Finance Review'
                      : 'Awaiting CWC Delivery'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px]">Billing Frequency:</span>
                  <span className="text-slate-700">
                    {opportunity.parallelFinance?.billingFrequency || 'MILESTONE'}
                  </span>
                </div>

                {billingRecord?.endorsementNotes && (
                  <div>
                    <span className="text-slate-400 block text-[10px]">Endorsement Notes:</span>
                    <span className="text-slate-600 line-clamp-2">{billingRecord.endorsementNotes}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 3. INVOICE STATUS CARD */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                    <DollarSign className="w-4 h-4" />
                  </span>
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                    3. Invoice & Payment
                  </h4>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                  paymentStatus === 'PAID'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : paymentStatus === 'ISSUED'
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : paymentStatus === 'OVERDUE'
                    ? 'bg-red-100 text-red-800 border border-red-300'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {paymentStatus}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Invoice Number:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {invoiceNumber || 'Pending Invoice Issue'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px]">Invoice Amount:</span>
                  <span className="font-extrabold text-emerald-700">
                    {formatCurrency(invoiceAmount, currency)}
                  </span>
                </div>

                {billingRecord?.paymentDueDate && (
                  <div>
                    <span className="text-slate-400 block text-[10px]">Payment Due Date:</span>
                    <span className="text-slate-700">{formatDate(billingRecord.paymentDueDate)}</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* MILESTONE LIST */}
          {(opportunity.parallelPmo?.milestones || []).length > 0 && (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Contract Delivery Milestones & Progress
              </h4>
              <div className="space-y-2">
                {opportunity.parallelPmo?.milestones.map((ms) => (
                  <div key={ms.id} className="p-2.5 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${
                        ms.status === 'COMPLETED' ? 'bg-emerald-500' : ms.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-slate-300'
                      }`} />
                      <span className="font-bold text-slate-900">{ms.title}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-slate-500 text-[11px]">
                      <span>Target: {formatDate(ms.targetDate)}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ms.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {ms.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between shrink-0 text-xs">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenOpportunityCockpit(opportunity);
            }}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open Full Opportunity Cockpit
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
