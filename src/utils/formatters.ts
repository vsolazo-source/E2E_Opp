import { Opportunity, WorkflowStage, StageDefinition } from '../types';
import { STAGE_MAP } from '../data/stages';

export function formatCurrency(amount: number | undefined, currency: string = 'USD'): string {
  if (amount === undefined || isNaN(amount)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string | undefined): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string | undefined): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export function getDaysInCurrentStage(stageEnteredAt: string): number {
  if (!stageEnteredAt) return 0;
  const entered = new Date(stageEnteredAt).getTime();
  const now = new Date().getTime();
  const diffMs = Math.max(0, now - entered);
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function getSlaStatus(
  opp: Opportunity,
  customStageMap?: Record<WorkflowStage, StageDefinition> | StageDefinition[]
): {
  days: number;
  targetDays: number;
  isOverdue: boolean;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
  warningThresholdPercentage: number;
  percentElapsed: number;
} {
  let resolvedMap: Record<string, StageDefinition> = STAGE_MAP;
  if (customStageMap) {
    if (Array.isArray(customStageMap)) {
      resolvedMap = customStageMap.reduce((acc, s) => {
        acc[s.id] = s;
        return acc;
      }, {} as Record<string, StageDefinition>);
    } else {
      resolvedMap = customStageMap as Record<string, StageDefinition>;
    }
  }

  const stageDef = resolvedMap[opp.currentStage] || STAGE_MAP[opp.currentStage];
  const targetDays = stageDef?.targetSlaDays ?? 5;
  const warningPct = stageDef?.warningThresholdPercentage ?? 75;
  const days = getDaysInCurrentStage(opp.stageEnteredAt || opp.createdAt);
  
  if (targetDays === 0 || opp.currentStage === 'DEAL_CLOSED') {
    return {
      days,
      targetDays,
      isOverdue: false,
      status: 'NORMAL',
      warningThresholdPercentage: warningPct,
      percentElapsed: 0,
    };
  }

  const percentElapsed = Math.round((days / targetDays) * 100);

  if (days > targetDays) {
    return {
      days,
      targetDays,
      isOverdue: true,
      status: 'CRITICAL',
      warningThresholdPercentage: warningPct,
      percentElapsed,
    };
  } else if (days >= targetDays * (warningPct / 100)) {
    return {
      days,
      targetDays,
      isOverdue: false,
      status: 'WARNING',
      warningThresholdPercentage: warningPct,
      percentElapsed,
    };
  }
  return {
    days,
    targetDays,
    isOverdue: false,
    status: 'NORMAL',
    warningThresholdPercentage: warningPct,
    percentElapsed,
  };
}
