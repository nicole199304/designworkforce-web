import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createDatabaseStore } from './database.js';

type PricingType = '插画+动效' | '仅动效' | '仅插画' | '三维设计';

interface ProjectInput {
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

interface ProjectRecord extends ProjectInput {
  id: string;
  createdAt: string;
  selectedPrice: number;
  totalCost: number;
  rawRoi: number;
  roiScore: number;
  compositeScore: number;
  suggestedCategory: string;
  revisionCoefficient: number;
}

interface SeedData {
  pricingOptions: Array<{ label: string; prices: Partial<Record<PricingType, number>> }>;
  designers: Array<{ name: string; efficiency: number }>;
  revisionCoefficients: Array<{ round: number; coefficient: number }>;
  sampleRecords: ProjectRecord[];
  summaries: {
    totalPricingOptions: number;
    totalDesigners: number;
    totalSamples: number;
    categoryBreakdown: Record<string, number>;
  };
}

interface WorkforceConfig {
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

interface WorkforceMonthlyTotal {
  month: string;
  totalAmount: number;
  illustrationAmount: number;
  motionAmount: number;
  unmappedRows: number;
}

interface WorkforceBusinessInput {
  businessLine: string;
  month: string;
  illustrationAmount: number;
  motionAmount: number;
  totalAmount: number;
  concentrationFactor: number;
  qualityFactor: number;
}

interface WorkforceResultRow {
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

interface WorkforceBusinessSummary {
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

interface WorkforceSeedData {
  config: WorkforceConfig;
  monthlyTotals: WorkforceMonthlyTotal[];
  businessInputs: WorkforceBusinessInput[];
  defaultBusinessLine: string;
  businessLines?: string[];
}

interface WorkforceEvaluationPayload {
  config?: Partial<WorkforceConfig>;
  businessInputs?: WorkforceBusinessInput[];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'data');
const seedPath = path.join(dataDir, 'workbook-seed.json');
const workforceSeedPath = path.join(dataDir, 'workforce-seed.json');
const recordsPath = path.join(dataDir, 'saved-records.json');
const assetsPath = path.join(dataDir, 'assets.json');
let store: ReturnType<typeof createDatabaseStore> | null = null;

function getStore(seed: SeedData) {
  if (!store) {
    store = createDatabaseStore({
      dataDir,
      seed,
      assetsPath,
      recordsPath,
    });
  }

  return store;
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function revisionCoefficient(rounds: number, coefficients: SeedData['revisionCoefficients']) {
  const exact = coefficients.find((item) => item.round === rounds);
  if (exact) {
    return exact.coefficient;
  }

  if (rounds <= 0) {
    return 1;
  }

  const fallback = Number((1 - Math.min(rounds, 5) * 0.1).toFixed(1));
  return Math.max(fallback, 0.5);
}

function roiScore(rawRoi: number) {
  if (rawRoi >= 3000) return 5;
  if (rawRoi >= 2000) return 4;
  if (rawRoi >= 1000) return 3;
  if (rawRoi >= 500) return 2;
  return 1;
}

function strategicValue(totalCost: number, revisionRounds: number) {
  const value = 1 + 4 * (0.6 * Math.min(2 / totalCost, 1) + 0.4 * (1 - Math.min(revisionRounds / 5, 1)));
  return Math.round(value);
}

function compositeScore(baseValue: number, avgProductionDays: number, slicingDays: number, totalCost: number, revisionRounds: number, rawRoi: number, strategy: number) {
  const cycleFactor =
    totalCost <= 2 ? 1 :
    totalCost <= 3 ? 0.85 :
    totalCost <= 5 ? 0.7 :
    totalCost <= 7 ? 0.5 :
    0.3;

  const revisionFactor =
    revisionRounds <= 1 ? 1 :
    revisionRounds <= 2 ? 0.85 :
    revisionRounds <= 3 ? 0.6 :
    0.35;

  const fastBonus =
    avgProductionDays <= 2 && revisionRounds <= 1 ? 0.12 :
    avgProductionDays <= 2 && revisionRounds <= 2 ? 0.08 :
    0;

  const slicingBonus =
    slicingDays === 0 ? 0.03 :
    slicingDays <= 0.5 ? 0.01 :
    0;

  return Number((
    0.32 * cycleFactor +
    0.32 * revisionFactor +
    0.2 * Math.min(rawRoi / 1500, 1) +
    0.1 * Math.min(baseValue / 20000, 1) +
    0.06 * (strategy / 5) +
    fastBonus +
    slicingBonus
  ).toFixed(3));
}

function confidenceScore(strategy: number, revisionCoefficientValue: number, totalCost: number) {
  return Math.round((((strategy / 5) * 0.4 + revisionCoefficientValue * 0.3 + Math.min(2.5 / totalCost, 1) * 0.3) * 5));
}

function suggestedCategory(score: number, confidence: number, revisionRounds: number) {
  if (score >= 0.9 && confidence >= 4 && revisionRounds <= 1) return 'A类（优先内部）';
  if (score >= 0.75 && confidence >= 3 && revisionRounds <= 2) return 'B类（保留优化）';
  return 'C类（可外包）';
}

function toFixedNumber(value: number, digits = 2) {
  return Number(value.toFixed(digits));
}

function deriveWorkforceConfig(baseConfig: WorkforceConfig, monthlyTotals: WorkforceMonthlyTotal[]): WorkforceConfig {
  const averageMonthlyTotal = monthlyTotals.length
    ? monthlyTotals.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0) / monthlyTotals.length
    : Number(baseConfig.averageMonthlyTotal || 0);
  const totalHeadcount = Number(baseConfig.illustrationHeadcount || 0) + Number(baseConfig.motionHeadcount || 0);
  const actualPerCapitaMonthly = totalHeadcount > 0 ? averageMonthlyTotal / totalHeadcount : 0;
  const baselinePerCapitaMonthly = Number(baseConfig.safeUtilization || 0) > 0 ? actualPerCapitaMonthly / Number(baseConfig.safeUtilization) : 0;

  return {
    safeUtilization: toFixedNumber(Number(baseConfig.safeUtilization || 0), 2),
    illustrationHeadcount: Number(baseConfig.illustrationHeadcount || 0),
    motionHeadcount: Number(baseConfig.motionHeadcount || 0),
    comboSplitIllustration: toFixedNumber(Number(baseConfig.comboSplitIllustration || 0), 2),
    comboSplitMotion: toFixedNumber(Number(baseConfig.comboSplitMotion || 0), 2),
    averageMonthlyTotal: toFixedNumber(averageMonthlyTotal, 2),
    totalHeadcount: Number(totalHeadcount),
    actualPerCapitaMonthly: toFixedNumber(actualPerCapitaMonthly, 2),
    baselinePerCapitaMonthly: toFixedNumber(baselinePerCapitaMonthly, 2),
  };
}

function summarizeBusinessLine(businessLine: string, rows: WorkforceResultRow[]): WorkforceBusinessSummary {
  const sortedByHeadcount = [...rows].sort((left, right) => right.recommendedHeadcount - left.recommendedHeadcount);
  const peak = sortedByHeadcount[0];
  const valley = [...rows].sort((left, right) => left.recommendedHeadcount - right.recommendedHeadcount)[0];
  const averageHeadcount = rows.reduce((sum, item) => sum + item.recommendedHeadcount, 0) / rows.length;
  const averageFte = rows.reduce((sum, item) => sum + item.totalFte, 0) / rows.length;
  const totalAdjustedAmount = rows.reduce((sum, item) => sum + item.adjustedTotalAmount, 0);

  return {
    businessLine,
    peakHeadcount: peak?.recommendedHeadcount ?? 0,
    valleyHeadcount: valley?.recommendedHeadcount ?? 0,
    averageHeadcount: toFixedNumber(averageHeadcount, 1),
    peakMonth: peak?.month ?? '',
    valleyMonth: valley?.month ?? '',
    averageFte: toFixedNumber(averageFte, 2),
    totalAdjustedAmount: toFixedNumber(totalAdjustedAmount, 2),
    recommendationText: `建议按 ${valley?.recommendedHeadcount ?? 0}-${peak?.recommendedHeadcount ?? 0} 人区间准备，均值 ${toFixedNumber(averageHeadcount, 1)} 人。`,
  };
}

function evaluateWorkforce(seed: WorkforceSeedData, payload?: WorkforceEvaluationPayload) {
  const monthlyTotals = seed.monthlyTotals.map((item) => ({
    ...item,
    totalAmount: Number(item.totalAmount || 0),
    illustrationAmount: Number(item.illustrationAmount || 0),
    motionAmount: Number(item.motionAmount || 0),
    unmappedRows: Number(item.unmappedRows || 0),
  }));
  const businessInputs = (payload?.businessInputs ?? seed.businessInputs).map((item) => ({
    businessLine: item.businessLine,
    month: item.month,
    illustrationAmount: Number(item.illustrationAmount || 0),
    motionAmount: Number(item.motionAmount || 0),
    totalAmount: Number(item.totalAmount || 0),
    concentrationFactor: Number(item.concentrationFactor || 1),
    qualityFactor: Number(item.qualityFactor || 1),
  }));

  const config = deriveWorkforceConfig(
    {
      ...seed.config,
      ...(payload?.config ?? {}),
    },
    monthlyTotals,
  );

  const denominator = config.baselinePerCapitaMonthly || 1;
  const results = businessInputs.map<WorkforceResultRow>((item) => {
    const adjustedIllustrationAmount = item.illustrationAmount * item.concentrationFactor * item.qualityFactor;
    const adjustedMotionAmount = item.motionAmount * item.concentrationFactor * item.qualityFactor;
    const adjustedTotalAmount = adjustedIllustrationAmount + adjustedMotionAmount;
    const illustrationFte = adjustedIllustrationAmount / denominator;
    const motionFte = adjustedMotionAmount / denominator;
    const totalFte = adjustedTotalAmount / denominator;
    const recommendedHeadcount = Math.ceil(totalFte);
    const illustrationFloor = Math.floor(illustrationFte);
    const motionFloor = Math.floor(motionFte);
    const illustrationFraction = illustrationFte - illustrationFloor;
    const motionFraction = motionFte - motionFloor;
    const remainderSlots = Math.max(recommendedHeadcount - (illustrationFloor + motionFloor), 0);
    const illustrationBonus = remainderSlots <= 0 ? 0 : illustrationFraction >= motionFraction ? 1 : 0;
    const recommendedIllustrationHeadcount = illustrationFloor + illustrationBonus;
    const recommendedMotionHeadcount = Math.max(recommendedHeadcount - recommendedIllustrationHeadcount, 0);

    return {
      businessLine: item.businessLine,
      month: item.month,
      adjustedIllustrationAmount: toFixedNumber(adjustedIllustrationAmount, 2),
      adjustedMotionAmount: toFixedNumber(adjustedMotionAmount, 2),
      adjustedTotalAmount: toFixedNumber(adjustedTotalAmount, 2),
      illustrationFte: toFixedNumber(illustrationFte, 4),
      motionFte: toFixedNumber(motionFte, 4),
      totalFte: toFixedNumber(totalFte, 4),
      recommendedHeadcount,
      recommendedIllustrationHeadcount,
      recommendedMotionHeadcount,
      illustrationFraction: toFixedNumber(illustrationFraction, 4),
      motionFraction: toFixedNumber(motionFraction, 4),
      remainderSlots,
      illustrationBonus,
    };
  });

  const businessSummaries = Array.from(new Set(results.map((item) => item.businessLine)))
    .map((businessLine) => summarizeBusinessLine(businessLine, results.filter((item) => item.businessLine === businessLine)));

  return {
    config,
    monthlyTotals,
    businessInputs,
    results,
    businessSummaries,
    defaultBusinessLine: seed.defaultBusinessLine,
  };
}

function evaluate(input: ProjectInput, seed: SeedData, assets: {
  pricingOptions: Array<{ id: string; label: string; prices: Partial<Record<PricingType, number>> }>;
  designers: Array<{ id: string; name: string; efficiency: number }>;
}) {
  const pricing = assets.pricingOptions.find((item) => item.label === input.demandLabel);
  const selectedPrice = Number(pricing?.prices[input.pricingType] ?? input.baseValue ?? 0);
  const modifier = revisionCoefficient(Number(input.revisionRounds || 0), seed.revisionCoefficients);
  const totalCost = Number(input.avgProductionDays || 0) + Number(input.slicingDays || 0) + Number(input.revisionRounds || 0) * modifier;
  const rawRoi = totalCost > 0 ? (Number(input.baseValue || 0) / totalCost) * modifier : 0;
  const roi = roiScore(rawRoi);
  const strategy = strategicValue(totalCost, Number(input.revisionRounds || 0));
  const score = compositeScore(
    Number(input.baseValue || 0),
    Number(input.avgProductionDays || 0),
    Number(input.slicingDays || 0),
    totalCost,
    Number(input.revisionRounds || 0),
    rawRoi,
    strategy,
  );
  const confidence = confidenceScore(strategy, modifier, totalCost || 1);

  return {
    selectedPrice,
    totalCost: Number(totalCost.toFixed(2)),
    rawRoi: Number(rawRoi.toFixed(2)),
    roiScore: roi,
    compositeScore: score,
    suggestedCategory: suggestedCategory(score, confidence, Number(input.revisionRounds || 0)),
    revisionCoefficient: modifier,
    strategicValue: strategy,
    confidenceScore: confidence,
  };
}

const app = express();
app.use(express.json());
app.use((_, response, next) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  next();
});

app.get('/api/health', (_, response) => {
  response.json({ ok: true });
});

app.get('/api/bootstrap', (_, response) => {
  if (!fs.existsSync(seedPath)) {
    response.status(500).json({ message: '缺少 workbook-seed.json，请先执行 npm run export:excel' });
    return;
  }

  const seed = readJson<SeedData>(seedPath);
  const assets = getStore(seed).listAssets();
  const savedRecords = getStore(seed).listProjects();
  response.json({
    ...seed,
    pricingOptions: assets.pricingOptions,
    designers: assets.designers,
    summaries: {
      ...seed.summaries,
      totalPricingOptions: assets.pricingOptions.length,
      totalDesigners: assets.designers.length,
    },
    savedRecords,
  });
});

app.get('/api/assets', (_, response) => {
  const seed = readJson<SeedData>(seedPath);
  response.json(getStore(seed).listAssets());
});

app.get('/api/workforce/bootstrap', (_, response) => {
  if (!fs.existsSync(workforceSeedPath)) {
    response.status(500).json({ message: '缺少 workforce-seed.json，请先执行 npm run export:workforce' });
    return;
  }

  const seed = readJson<WorkforceSeedData>(workforceSeedPath);
  response.json(evaluateWorkforce(seed));
});

app.post('/api/workforce/evaluate', (request, response) => {
  if (!fs.existsSync(workforceSeedPath)) {
    response.status(500).json({ message: '缺少 workforce-seed.json，请先执行 npm run export:workforce' });
    return;
  }

  const seed = readJson<WorkforceSeedData>(workforceSeedPath);
  response.json(evaluateWorkforce(seed, request.body as WorkforceEvaluationPayload));
});

app.put('/api/assets', (request, response) => {
  const seed = readJson<SeedData>(seedPath);
  const payload = request.body as {
    pricingOptions: Array<{ id: string; label: string; prices: Partial<Record<PricingType, number>> }>;
    designers: Array<{ id: string; name: string; efficiency: number }>;
  };

  const sanitized = {
    pricingOptions: (payload.pricingOptions ?? []).map((item, index) => ({
      id: item.id || `price-${Date.now()}-${index}`,
      label: item.label,
      prices: item.prices ?? {},
    })),
    designers: (payload.designers ?? []).map((item, index) => ({
      id: item.id || `designer-${Date.now()}-${index}`,
      name: item.name,
      efficiency: Number(item.efficiency ?? 1),
    })),
  };

  const savedAssets = getStore(seed).saveAssets(sanitized);
  response.json({
    pricingOptions: savedAssets.pricingOptions,
    designers: savedAssets.designers,
    revisionCoefficients: seed.revisionCoefficients,
  });
});

app.post('/api/evaluate', (request, response) => {
  const seed = readJson<SeedData>(seedPath);
  response.json(evaluate(request.body as ProjectInput, seed, getStore(seed).listAssets()));
});

app.get('/api/projects', (_, response) => {
  const seed = readJson<SeedData>(seedPath);
  response.json(getStore(seed).listProjects());
});

app.post('/api/projects', (request, response) => {
  const seed = readJson<SeedData>(seedPath);
  const input = request.body as ProjectInput;
  const record: ProjectRecord = {
    ...input,
    ...evaluate(input, seed, getStore(seed).listAssets()),
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  response.status(201).json(getStore(seed).createProject(record));
});

app.delete('/api/projects/:id', (request, response) => {
  const seed = readJson<SeedData>(seedPath);
  const recordId = request.params.id;
  if (!getStore(seed).deleteProject(recordId)) {
    response.status(404).json({ message: '未找到对应项目记录' });
    return;
  }

  response.status(204).send();
});

const port = Number(process.env.PORT || 3001);
app.listen(port, '0.0.0.0', () => {
  console.log(`Design Workforce API listening on http://0.0.0.0:${port}`);
});
