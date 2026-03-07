import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

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
}

interface AssetPayload {
  pricingOptions: Array<{ id: string; label: string; prices: Partial<Record<PricingType, number>> }>;
  designers: Array<{ id: string; name: string; efficiency: number }>;
}

interface DatabaseStoreOptions {
  dataDir: string;
  seed: SeedData;
  assetsPath: string;
  recordsPath: string;
}

interface ProjectRecordRow {
  id: string;
  created_at: string;
  business_line: string;
  demand_name: string | null;
  demand_label: string;
  pricing_type: PricingType;
  base_value: number;
  designer: string;
  efficiency: number;
  avg_production_days: number;
  slicing_days: number;
  revision_rounds: number;
  strategic_value: number;
  confidence_score: number;
  selected_price: number;
  total_cost: number;
  raw_roi: number;
  roi_score: number;
  composite_score: number;
  suggested_category: string;
  revision_coefficient: number;
}

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function assetDefaults(seed: SeedData): AssetPayload {
  return {
    pricingOptions: seed.pricingOptions.map((item, index) => ({
      id: `price-${index + 1}`,
      label: item.label,
      prices: item.prices,
    })),
    designers: seed.designers.map((item, index) => ({
      id: `designer-${index + 1}`,
      name: item.name,
      efficiency: item.efficiency,
    })),
  };
}

function normalizeProjectRecord(row: ProjectRecordRow): ProjectRecord {
  return {
    id: row.id,
    createdAt: row.created_at,
    businessLine: row.business_line,
    demandName: row.demand_name ?? '',
    demandLabel: row.demand_label,
    pricingType: row.pricing_type,
    baseValue: Number(row.base_value),
    designer: row.designer,
    efficiency: Number(row.efficiency),
    avgProductionDays: Number(row.avg_production_days),
    slicingDays: Number(row.slicing_days),
    revisionRounds: Number(row.revision_rounds),
    strategicValue: Number(row.strategic_value),
    confidenceScore: Number(row.confidence_score),
    selectedPrice: Number(row.selected_price),
    totalCost: Number(row.total_cost),
    rawRoi: Number(row.raw_roi),
    roiScore: Number(row.roi_score),
    compositeScore: Number(row.composite_score),
    suggestedCategory: row.suggested_category,
    revisionCoefficient: Number(row.revision_coefficient),
  };
}

export function createDatabaseStore(options: DatabaseStoreOptions) {
  ensureDir(options.dataDir);
  const databasePath = path.join(options.dataDir, 'designworkforce.sqlite');
  const db = new Database(databasePath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS pricing_options (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pricing_option_prices (
      pricing_option_id TEXT NOT NULL,
      pricing_type TEXT NOT NULL,
      price REAL NOT NULL,
      PRIMARY KEY (pricing_option_id, pricing_type),
      FOREIGN KEY (pricing_option_id) REFERENCES pricing_options(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS designers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      efficiency REAL NOT NULL,
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS project_records (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      business_line TEXT NOT NULL,
      demand_name TEXT,
      demand_label TEXT NOT NULL,
      pricing_type TEXT NOT NULL,
      base_value REAL NOT NULL,
      designer TEXT NOT NULL,
      efficiency REAL NOT NULL,
      avg_production_days REAL NOT NULL,
      slicing_days REAL NOT NULL,
      revision_rounds INTEGER NOT NULL,
      strategic_value INTEGER NOT NULL,
      confidence_score INTEGER NOT NULL,
      selected_price REAL NOT NULL,
      total_cost REAL NOT NULL,
      raw_roi REAL NOT NULL,
      roi_score INTEGER NOT NULL,
      composite_score REAL NOT NULL,
      suggested_category TEXT NOT NULL,
      revision_coefficient REAL NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_project_records_created_at ON project_records(created_at DESC);
  `);

  const insertPricingOption = db.prepare(`
    INSERT INTO pricing_options (id, label, sort_order)
    VALUES (@id, @label, @sortOrder)
  `);
  const insertPricingPrice = db.prepare(`
    INSERT INTO pricing_option_prices (pricing_option_id, pricing_type, price)
    VALUES (@pricingOptionId, @pricingType, @price)
  `);
  const insertDesigner = db.prepare(`
    INSERT INTO designers (id, name, efficiency, sort_order)
    VALUES (@id, @name, @efficiency, @sortOrder)
  `);
  const insertProjectRecord = db.prepare(`
    INSERT INTO project_records (
      id, created_at, business_line, demand_name, demand_label, pricing_type, base_value, designer,
      efficiency, avg_production_days, slicing_days, revision_rounds, strategic_value, confidence_score,
      selected_price, total_cost, raw_roi, roi_score, composite_score, suggested_category, revision_coefficient
    )
    VALUES (
      @id, @createdAt, @businessLine, @demandName, @demandLabel, @pricingType, @baseValue, @designer,
      @efficiency, @avgProductionDays, @slicingDays, @revisionRounds, @strategicValue, @confidenceScore,
      @selectedPrice, @totalCost, @rawRoi, @roiScore, @compositeScore, @suggestedCategory, @revisionCoefficient
    )
  `);

  const seedAssetsTransaction = db.transaction((payload: AssetPayload) => {
    db.prepare('DELETE FROM pricing_option_prices').run();
    db.prepare('DELETE FROM pricing_options').run();
    db.prepare('DELETE FROM designers').run();

    payload.pricingOptions.forEach((item, index) => {
      insertPricingOption.run({
        id: item.id,
        label: item.label,
        sortOrder: index,
      });

      (['插画+动效', '仅动效', '仅插画', '三维设计'] as const).forEach((pricingType) => {
        if (item.prices[pricingType] === undefined) return;
        insertPricingPrice.run({
          pricingOptionId: item.id,
          pricingType,
          price: Number(item.prices[pricingType]),
        });
      });
    });

    payload.designers.forEach((item, index) => {
      insertDesigner.run({
        id: item.id,
        name: item.name,
        efficiency: Number(item.efficiency ?? 1),
        sortOrder: index,
      });
    });
  });

  const seedProjectRecordsTransaction = db.transaction((records: ProjectRecord[]) => {
    db.prepare('DELETE FROM project_records').run();
    records.forEach((record) => {
      insertProjectRecord.run({
        id: record.id,
        createdAt: record.createdAt,
        businessLine: record.businessLine,
        demandName: record.demandName ?? '',
        demandLabel: record.demandLabel,
        pricingType: record.pricingType,
        baseValue: Number(record.baseValue),
        designer: record.designer,
        efficiency: Number(record.efficiency),
        avgProductionDays: Number(record.avgProductionDays),
        slicingDays: Number(record.slicingDays),
        revisionRounds: Number(record.revisionRounds),
        strategicValue: Number(record.strategicValue),
        confidenceScore: Number(record.confidenceScore),
        selectedPrice: Number(record.selectedPrice),
        totalCost: Number(record.totalCost),
        rawRoi: Number(record.rawRoi),
        roiScore: Number(record.roiScore),
        compositeScore: Number(record.compositeScore),
        suggestedCategory: record.suggestedCategory,
        revisionCoefficient: Number(record.revisionCoefficient),
      });
    });
  });

  const pricingCount = Number(db.prepare('SELECT COUNT(*) AS count FROM pricing_options').get().count);
  if (pricingCount === 0) {
    const payload = fs.existsSync(options.assetsPath) ? readJson<AssetPayload>(options.assetsPath) : assetDefaults(options.seed);
    seedAssetsTransaction(payload);
  }

  const projectCount = Number(db.prepare('SELECT COUNT(*) AS count FROM project_records').get().count);
  if (projectCount === 0 && fs.existsSync(options.recordsPath)) {
    seedProjectRecordsTransaction(readJson<ProjectRecord[]>(options.recordsPath));
  }

  function listAssets(): AssetPayload {
    const pricingRows = db.prepare('SELECT id, label, sort_order FROM pricing_options ORDER BY sort_order, label').all() as Array<{ id: string; label: string }>;
    const priceRows = db.prepare('SELECT pricing_option_id, pricing_type, price FROM pricing_option_prices').all() as Array<{
      pricing_option_id: string;
      pricing_type: PricingType;
      price: number;
    }>;
    const designers = (db.prepare('SELECT id, name, efficiency FROM designers ORDER BY sort_order, name').all() as Array<{
      id: string;
      name: string;
      efficiency: number;
    }>).map((item) => ({
      id: item.id,
      name: item.name,
      efficiency: Number(item.efficiency),
    }));

    const pricesByOption = new Map<string, Partial<Record<PricingType, number>>>();
    priceRows.forEach((row) => {
      const current = pricesByOption.get(row.pricing_option_id) ?? {};
      current[row.pricing_type] = Number(row.price);
      pricesByOption.set(row.pricing_option_id, current);
    });

    return {
      pricingOptions: pricingRows.map((item) => ({
        id: item.id,
        label: item.label,
        prices: pricesByOption.get(item.id) ?? {},
      })),
      designers,
    };
  }

  const replaceAssetsTransaction = db.transaction((payload: AssetPayload) => {
    seedAssetsTransaction(payload);
  });

  function saveAssets(payload: AssetPayload): AssetPayload {
    replaceAssetsTransaction(payload);
    return listAssets();
  }

  function listProjects(): ProjectRecord[] {
    const rows = db
      .prepare('SELECT * FROM project_records ORDER BY datetime(created_at) DESC, rowid DESC')
      .all() as ProjectRecordRow[];
    return rows.map(normalizeProjectRecord);
  }

  function createProject(record: ProjectRecord): ProjectRecord {
    insertProjectRecord.run({
      id: record.id,
      createdAt: record.createdAt,
      businessLine: record.businessLine,
      demandName: record.demandName ?? '',
      demandLabel: record.demandLabel,
      pricingType: record.pricingType,
      baseValue: Number(record.baseValue),
      designer: record.designer,
      efficiency: Number(record.efficiency),
      avgProductionDays: Number(record.avgProductionDays),
      slicingDays: Number(record.slicingDays),
      revisionRounds: Number(record.revisionRounds),
      strategicValue: Number(record.strategicValue),
      confidenceScore: Number(record.confidenceScore),
      selectedPrice: Number(record.selectedPrice),
      totalCost: Number(record.totalCost),
      rawRoi: Number(record.rawRoi),
      roiScore: Number(record.roiScore),
      compositeScore: Number(record.compositeScore),
      suggestedCategory: record.suggestedCategory,
      revisionCoefficient: Number(record.revisionCoefficient),
    });
    return record;
  }

  function deleteProject(recordId: string): boolean {
    const result = db.prepare('DELETE FROM project_records WHERE id = ?').run(recordId);
    return result.changes > 0;
  }

  return {
    databasePath,
    listAssets,
    saveAssets,
    listProjects,
    createProject,
    deleteProject,
  };
}
