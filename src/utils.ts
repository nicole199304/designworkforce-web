import { CalculatedProjectData, ProjectCategory, ProjectData } from './types';

export const currency = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  maximumFractionDigits: 0,
});

export const decimal = new Intl.NumberFormat('zh-CN', {
  maximumFractionDigits: 2,
});

export function categoryTone(category: string) {
  switch (category) {
    case 'A类（优先内部）':
      return 'bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/20';
    case 'B类（保留优化）':
      return 'bg-sky-500/15 text-sky-700 ring-1 ring-sky-500/20';
    case 'C类（可外包）':
      return 'bg-amber-500/15 text-amber-700 ring-1 ring-amber-500/20';
    default:
      return 'bg-rose-500/15 text-rose-700 ring-1 ring-rose-500/20';
  }
}

export function calculateProjectMetrics(data: ProjectData): CalculatedProjectData {
  const totalProductionCycle = data.avgProductionCycle + data.slicingTime;
  const revisionCoefficient = Math.max(1 - Math.min(data.revisionRounds, 5) * 0.1, 0.5);
  const rawRoi = totalProductionCycle > 0 ? data.actualPrice / totalProductionCycle : 0;
  const roi = Math.round(rawRoi * 100) / 100;
  const compositeScore = Math.round((Math.min(roi / 1000, 5) * 0.4 + data.strategicValue * 0.4 + revisionCoefficient) * 10) / 10;

  let suggestedCategory: ProjectCategory = ProjectCategory.C;
  if (compositeScore >= 4) suggestedCategory = ProjectCategory.A;
  else if (compositeScore >= 3.5) suggestedCategory = ProjectCategory.B;

  return {
    ...data,
    totalProductionCycle,
    revisionCoefficient,
    roi,
    compositeScore,
    suggestedCategory,
  };
}
