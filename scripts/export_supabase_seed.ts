import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'data');
const sqlitePath = path.join(dataDir, 'designworkforce.sqlite');
const outputDir = path.join(rootDir, 'supabase');
const outputPath = path.join(outputDir, 'seed.sql');

function sqlValue(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return `'${String(value).replaceAll("'", "''")}'`;
}

function insertStatement(table: string, columns: string[], rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) return '';
  const valueLines = rows.map((row) => `  (${columns.map((column) => sqlValue(row[column])).join(', ')})`);
  return `insert into public.${table} (${columns.join(', ')}) values\n${valueLines.join(',\n')}\non conflict do nothing;\n`;
}

if (!fs.existsSync(sqlitePath)) {
  throw new Error(`缺少 SQLite 数据库文件：${sqlitePath}`);
}

const db = new Database(sqlitePath, { readonly: true });
const pricingOptions = db.prepare('select id, label, sort_order from pricing_options order by sort_order, label').all() as Array<Record<string, unknown>>;
const pricingOptionPrices = db
  .prepare('select pricing_option_id, pricing_type, price from pricing_option_prices order by pricing_option_id, pricing_type')
  .all() as Array<Record<string, unknown>>;
const designers = db.prepare('select id, name, efficiency, sort_order from designers order by sort_order, name').all() as Array<Record<string, unknown>>;
const projectRecords = db
  .prepare(`
    select
      id,
      created_at,
      business_line,
      demand_name,
      demand_label,
      pricing_type,
      base_value,
      designer,
      efficiency,
      avg_production_days,
      slicing_days,
      revision_rounds,
      strategic_value,
      confidence_score,
      selected_price,
      total_cost,
      raw_roi,
      roi_score,
      composite_score,
      suggested_category,
      revision_coefficient
    from project_records
    order by datetime(created_at) desc, rowid desc
  `)
  .all() as Array<Record<string, unknown>>;

const sql = [
  '-- Generated from local SQLite live data',
  '-- Run schema.sql first, then run this seed.sql in Supabase SQL editor',
  '',
  'begin;',
  'delete from public.pricing_option_prices;',
  'delete from public.pricing_options;',
  'delete from public.designers;',
  'delete from public.project_records;',
  '',
  insertStatement('pricing_options', ['id', 'label', 'sort_order'], pricingOptions),
  insertStatement('pricing_option_prices', ['pricing_option_id', 'pricing_type', 'price'], pricingOptionPrices),
  insertStatement('designers', ['id', 'name', 'efficiency', 'sort_order'], designers),
  insertStatement(
    'project_records',
    [
      'id',
      'created_at',
      'business_line',
      'demand_name',
      'demand_label',
      'pricing_type',
      'base_value',
      'designer',
      'efficiency',
      'avg_production_days',
      'slicing_days',
      'revision_rounds',
      'strategic_value',
      'confidence_score',
      'selected_price',
      'total_cost',
      'raw_roi',
      'roi_score',
      'composite_score',
      'suggested_category',
      'revision_coefficient',
    ],
    projectRecords,
  ),
  'commit;',
  '',
].join('\n');

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, sql, 'utf8');

console.log(`Supabase seed exported: ${outputPath}`);
console.log(`Pricing options: ${pricingOptions.length}`);
console.log(`Designers: ${designers.length}`);
console.log(`Project records: ${projectRecords.length}`);
