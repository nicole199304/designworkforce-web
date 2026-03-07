export type PricingType = '插画+动效' | '仅动效' | '仅插画' | '三维设计';

export interface PricingOption {
  id: string;
  label: string;
  prices: Partial<Record<PricingType, number>>;
}

export interface DesignerOption {
  id: string;
  name: string;
  efficiency: number;
}

export interface RevisionCoefficient {
  round: number;
  coefficient: number;
}

export interface ProjectInput {
  businessLine: string;
  demandName?: string;
  demandLabel: string;
  pricingType: PricingType;
  baseValue: number;
  designer: string;
  efficiency: number;
  avgProductionDays: number;
  slicingDays: number;
  revisionRounds: number;
  strategicValue: number;
  confidenceScore: number;
}

export interface EvaluationResult {
  selectedPrice: number;
  totalCost: number;
  rawRoi: number;
  roiScore: number;
  compositeScore: number;
  suggestedCategory: string;
  revisionCoefficient: number;
  strategicValue: number;
  confidenceScore: number;
}

export interface ProjectRecord extends ProjectInput, EvaluationResult {
  id: string;
  createdAt: string;
}

export interface BootstrapPayload {
  pricingOptions: PricingOption[];
  designers: DesignerOption[];
  revisionCoefficients: RevisionCoefficient[];
  sampleRecords: ProjectRecord[];
  savedRecords: ProjectRecord[];
  summaries: {
    totalPricingOptions: number;
    totalDesigners: number;
    totalSamples: number;
    categoryBreakdown: Record<string, number>;
  };
}

export enum ProjectCategory {
  A = 'A',
  B = 'B',
  C = 'C',
}

export interface ProjectData {
  id: string;
  date: string;
  businessType: string;
  businessName: string;
  categoryLevel1: string;
  categoryLevel2: string;
  level: string;
  pricingType: string;
  basePrice: number;
  actualPrice: number;
  isPriceModified: boolean;
  baseOutput: number;
  avgProductionCycle: number;
  slicingTime: number;
  revisionRounds: number;
  strategicValue: number;
  confidenceScore: number;
  cReason?: string;
}

export interface CalculatedProjectData extends ProjectData {
  totalProductionCycle: number;
  revisionCoefficient: number;
  roi: number;
  compositeScore: number;
  suggestedCategory: ProjectCategory;
}

export interface PriceLibraryEntry {
  id: string;
  categoryLevel1: string;
  categoryLevel2: string;
  level: string;
  pricingType: string;
  price: number;
  updatedAt: string;
}

export interface WorkforceConfig {
  safeUtilization: number;
  illustrationHeadcount: number;
  motionHeadcount: number;
  comboSplitIllustration: number;
  comboSplitMotion: number;
  averageMonthlyTotal: number;
  totalHeadcount: number;
  actualPerCapitaMonthly: number;
  baselinePerCapitaMonthly: number;
}

export interface WorkforceMonthlyTotal {
  month: string;
  totalAmount: number;
  illustrationAmount: number;
  motionAmount: number;
  unmappedRows: number;
}

export interface WorkforceBusinessInput {
  businessLine: string;
  month: string;
  illustrationAmount: number;
  motionAmount: number;
  totalAmount: number;
  concentrationFactor: number;
  qualityFactor: number;
}

export interface WorkforceResultRow {
  businessLine: string;
  month: string;
  adjustedIllustrationAmount: number;
  adjustedMotionAmount: number;
  adjustedTotalAmount: number;
  illustrationFte: number;
  motionFte: number;
  totalFte: number;
  recommendedHeadcount: number;
  recommendedIllustrationHeadcount: number;
  recommendedMotionHeadcount: number;
  illustrationFraction: number;
  motionFraction: number;
  remainderSlots: number;
  illustrationBonus: number;
}

export interface WorkforceBusinessSummary {
  businessLine: string;
  peakHeadcount: number;
  valleyHeadcount: number;
  averageHeadcount: number;
  peakMonth: string;
  valleyMonth: string;
  averageFte: number;
  totalAdjustedAmount: number;
  recommendationText: string;
}

export interface WorkforceSeedPayload {
  config: WorkforceConfig;
  monthlyTotals: WorkforceMonthlyTotal[];
  businessInputs: WorkforceBusinessInput[];
  defaultBusinessLine: string;
}

export interface WorkforceEvaluationPayload {
  config: WorkforceConfig;
  monthlyTotals: WorkforceMonthlyTotal[];
  businessInputs: WorkforceBusinessInput[];
  results: WorkforceResultRow[];
  businessSummaries: WorkforceBusinessSummary[];
  defaultBusinessLine: string;
}
