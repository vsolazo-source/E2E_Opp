import React from 'react';
import { Check, Clock, AlertCircle } from 'lucide-react';
import { Opportunity, WorkflowStage } from '../types';
import { WORKFLOW_STAGES, STAGE_MAP } from '../data/stages';

interface StageProgressBarProps {
  currentStage: WorkflowStage;
  onStageClick?: (stage: WorkflowStage) => void;
  activeSelectedStage?: WorkflowStage;
}

export const StageProgressBar: React.FC<StageProgressBarProps> = ({
  currentStage,
  onStageClick,
  activeSelectedStage,
}) => {
  const currentStageIndex = STAGE_MAP[currentStage]?.index || 1;

  return (
    <div className="w-full overflow-x-auto scrollbar-thin py-1.5 px-1">
      <div className="flex items-center min-w-[940px] px-2">
        {WORKFLOW_STAGES.map((stage, idx) => {
          const isCompleted = stage.index < currentStageIndex;
          const isCurrent = stage.index === currentStageIndex;
          const isSelected = activeSelectedStage === stage.id;
          const isFuture = stage.index > currentStageIndex;

          return (
            <React.Fragment key={stage.id}>
              {/* Step Node */}
              <button
                type="button"
                onClick={() => onStageClick && onStageClick(stage.id)}
                className={`flex flex-col items-center group focus:outline-none transition-all relative ${
                  onStageClick ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                {/* Circle Icon */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-600/30'
                      : isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-500/25 shadow-sm scale-110'
                      : 'bg-slate-100 text-slate-400 border border-slate-300 group-hover:border-slate-400'
                  } ${isSelected ? 'ring-4 ring-indigo-500' : ''}`}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : (
                    <span>{stage.index}</span>
                  )}
                </div>

                {/* Label */}
                <div className="mt-1.5 text-center w-20">
                  <span
                    className={`block text-[11px] leading-tight truncate ${
                      isCurrent
                        ? 'font-bold text-blue-700'
                        : isCompleted
                        ? 'font-semibold text-slate-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {stage.shortLabel}
                  </span>
                  <span className="block text-[9px] text-slate-400 truncate">
                    {stage.actorLabel?.split('/')[0] || ''}
                  </span>
                </div>
              </button>

              {/* Connecting Line */}
              {idx < WORKFLOW_STAGES.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1 transition-colors ${
                    stage.index < currentStageIndex
                      ? 'bg-emerald-500'
                      : 'bg-slate-200'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
