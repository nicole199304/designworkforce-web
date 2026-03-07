import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createDatabaseStore } from '../server/database.js';

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'data');
const seedPath = path.join(dataDir, 'workbook-seed.json');
const recordsPath = path.join(dataDir, 'saved-records.json');
const assetsPath = path.join(dataDir, 'assets.json');

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

if (!fs.existsSync(seedPath)) {
  throw new Error('缺少 workbook-seed.json，请先执行 npm run export:excel');
}

const seed = readJson<SeedData>(seedPath);
const store = createDatabaseStore({
  dataDir,
  seed,
  assetsPath,
  recordsPath,
});

const assets = store.listAssets();
const projects = store.listProjects();

console.log(`SQLite database ready: ${store.databasePath}`);
console.log(`Pricing options: ${assets.pricingOptions.length}`);
console.log(`Designers: ${assets.designers.length}`);
console.log(`Saved records: ${projects.length}`);
