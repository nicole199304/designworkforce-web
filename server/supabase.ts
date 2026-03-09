import type { AppStore, AssetPayload, ProjectRecord } from './database.js';

interface SupabaseStoreOptions {
  url: string;
  serviceRoleKey: string;
}

interface PricingOptionRow {
  id: string;
  label: string;
  sort_order: number;
  pricing_option_prices?: Array<{
    pricing_type: '插画+动效' | '仅动效' | '仅插画' | '三维设计';
    price: number;
  }>;
}

interface DesignerRow {
  id: string;
  name: string;
  efficiency: number;
  sort_order: number;
}

interface ProjectRecordRow {
  id: string;
  created_at: string;
  business_line: string;
  demand_name: string | null;
  demand_label: string;
  pricing_type: '插画+动效' | '仅动效' | '仅插画' | '三维设计';
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

export function createSupabaseStore(options: SupabaseStoreOptions): AppStore {
  const baseUrl = `${options.url.replace(/\/$/, '')}/rest/v1`;
  const baseHeaders = {
    apikey: options.serviceRoleKey,
    Authorization: `Bearer ${options.serviceRoleKey}`,
    'Content-Type': 'application/json',
  };

  async function request<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...init,
      headers: {
        ...baseHeaders,
        ...(init.headers ?? {}),
      },
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || `Supabase request failed: ${response.status}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  return {
    async listAssets() {
      const [pricingOptions, designers] = await Promise.all([
        request<PricingOptionRow[]>(
          '/pricing_options?select=id,label,sort_order,pricing_option_prices(pricing_type,price)&order=sort_order.asc',
        ),
        request<DesignerRow[]>('/designers?select=id,name,efficiency,sort_order&order=sort_order.asc'),
      ]);

      return {
        pricingOptions: pricingOptions.map((item) => {
          const prices: Record<string, number> = {};
          (item.pricing_option_prices ?? []).forEach((price) => {
            prices[price.pricing_type] = Number(price.price);
          });

          return {
            id: item.id,
            label: item.label,
            prices,
          };
        }),
        designers: designers.map((item) => ({
          id: item.id,
          name: item.name,
          efficiency: Number(item.efficiency),
        })),
      };
    },

    async saveAssets(payload: AssetPayload) {
      await request('/pricing_option_prices', { method: 'DELETE' });
      await request('/pricing_options', { method: 'DELETE' });
      await request('/designers', { method: 'DELETE' });

      if (payload.pricingOptions.length > 0) {
        await request('/pricing_options', {
          method: 'POST',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify(
            payload.pricingOptions.map((item, index) => ({
              id: item.id,
              label: item.label,
              sort_order: index,
            })),
          ),
        });

        const priceRows = payload.pricingOptions.flatMap((item) =>
          (['插画+动效', '仅动效', '仅插画', '三维设计'] as const)
            .filter((pricingType) => item.prices[pricingType] !== undefined)
            .map((pricingType) => ({
              pricing_option_id: item.id,
              pricing_type: pricingType,
              price: Number(item.prices[pricingType]),
            })),
        );

        if (priceRows.length > 0) {
          await request('/pricing_option_prices', {
            method: 'POST',
            headers: { Prefer: 'return=minimal' },
            body: JSON.stringify(priceRows),
          });
        }
      }

      if (payload.designers.length > 0) {
        await request('/designers', {
          method: 'POST',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify(
            payload.designers.map((item, index) => ({
              id: item.id,
              name: item.name,
              efficiency: Number(item.efficiency ?? 1),
              sort_order: index,
            })),
          ),
        });
      }

      return this.listAssets();
    },

    async listProjects() {
      const rows = await request<ProjectRecordRow[]>(
        '/project_records?select=*&order=created_at.desc',
      );
      return rows.map(normalizeProjectRecord);
    },

    async createProject(record: ProjectRecord) {
      await request('/project_records', {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({
          id: record.id,
          created_at: record.createdAt,
          business_line: record.businessLine,
          demand_name: record.demandName ?? '',
          demand_label: record.demandLabel,
          pricing_type: record.pricingType,
          base_value: Number(record.baseValue),
          designer: record.designer,
          efficiency: Number(record.efficiency),
          avg_production_days: Number(record.avgProductionDays),
          slicing_days: Number(record.slicingDays),
          revision_rounds: Number(record.revisionRounds),
          strategic_value: Number(record.strategicValue),
          confidence_score: Number(record.confidenceScore),
          selected_price: Number(record.selectedPrice),
          total_cost: Number(record.totalCost),
          raw_roi: Number(record.rawRoi),
          roi_score: Number(record.roiScore),
          composite_score: Number(record.compositeScore),
          suggested_category: record.suggestedCategory,
          revision_coefficient: Number(record.revisionCoefficient),
        }),
      });
      return record;
    },

    async deleteProject(recordId: string) {
      const response = await fetch(`${baseUrl}/project_records?id=eq.${encodeURIComponent(recordId)}`, {
        method: 'DELETE',
        headers: baseHeaders,
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || 'Supabase delete failed');
      }

      const count = response.headers.get('content-range');
      return count !== '*/0';
    },
  };
}
