import {
  BarChart3,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Database,
  Eye,
  FolderKanban,
  LoaderCircle,
  Save,
  Settings2,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch } from '../lib/api';
import { BootstrapPayload, EvaluationResult, PricingType, ProjectInput, ProjectRecord } from '../types';
import { categoryTone, currency, decimal } from '../utils';

const pricingTypes: PricingType[] = ['插画+动效', '仅动效', '仅插画', '三维设计'];
const businessLines = ['PS', 'veeka', '不夜', 'PA', 'PT', '凶手', 'wowchat', 'hatta', 'Utlas', 'majlis'];

const emptyResult: EvaluationResult = {
  selectedPrice: 0,
  totalCost: 0,
  rawRoi: 0,
  roiScore: 0,
  compositeScore: 0,
  suggestedCategory: 'C类（可外包）',
  revisionCoefficient: 1,
  strategicValue: 0,
  confidenceScore: 0,
};

function PanelHeader({ title, description, icon: Icon }: { title: string; description: string; icon: typeof BarChart3 }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      </div>
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/40 bg-white/45 text-slate-700">
        <Icon size={18} />
      </div>
    </div>
  );
}

function DateRangePicker({
  startDate,
  endDate,
  onChange,
}: {
  startDate: string;
  endDate: string;
  onChange: (range: { start: string; end: string }) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const presets = [
    { label: '最近一周', days: 7 },
    { label: '最近一个月', days: 30 },
    { label: '最近三个月', days: 90 },
    { label: '全部时间', days: null },
  ];

  function applyPreset(days: number | null) {
    if (days === null) {
      onChange({ start: '', end: '' });
      return;
    }

    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days + 1);
    onChange({
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd'),
    });
  }

  function onDateClick(date: Date) {
    const clicked = format(date, 'yyyy-MM-dd');
    if (!startDate || (startDate && endDate)) {
      onChange({ start: clicked, end: '' });
      return;
    }

    const start = parseISO(startDate);
    if (isBefore(date, start)) {
      onChange({ start: clicked, end: startDate });
      return;
    }

    onChange({ start: startDate, end: clicked });
  }

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const rows = [];
  let days = [];
  let day = calendarStart;
  const parsedStart = startDate ? parseISO(startDate) : null;
  const parsedEnd = endDate ? parseISO(endDate) : null;

  while (day <= calendarEnd) {
    for (let index = 0; index < 7; index += 1) {
      const current = day;
      const selected = (parsedStart && isSameDay(current, parsedStart)) || (parsedEnd && isSameDay(current, parsedEnd));
      const inRange = parsedStart && parsedEnd && isWithinInterval(current, { start: parsedStart, end: parsedEnd });
      const currentMonth = isSameMonth(current, viewDate);

      days.push(
        <button
          key={current.toISOString()}
          type="button"
          onClick={() => onDateClick(current)}
          className={`relative flex h-11 items-center justify-center text-base transition ${
            currentMonth ? 'text-slate-700' : 'text-slate-300'
          }`}
        >
          {inRange ? <span className="absolute inset-x-0 top-1/2 h-9 -translate-y-1/2 bg-indigo-100/70" /> : null}
          <span
            className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-xl ${
              selected ? 'bg-indigo-600 font-semibold text-white shadow-[0_10px_24px_rgba(79,70,229,0.28)]' : 'hover:bg-slate-100'
            }`}
          >
            {format(current, 'd')}
          </span>
        </button>,
      );
      day = addDays(day, 1);
    }

    rows.push(
      <div key={day.toISOString()} className="grid grid-cols-7">
        {days}
      </div>,
    );
    days = [];
  }

  const displayValue =
    startDate && endDate ? `${startDate} 至 ${endDate}` : startDate ? `${startDate} 至 ...` : '选择时间范围';

  return (
    <div ref={containerRef} className="relative mb-5">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className={`flex w-full items-center gap-3 rounded-[26px] border bg-white/62 px-5 py-4 text-left text-sm font-semibold text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition ${
          isOpen ? 'border-indigo-500 ring-2 ring-indigo-500/15' : 'border-slate-300/45 hover:border-indigo-300'
        }`}
      >
        <CalendarRange size={19} className="text-slate-400" />
        <span>{displayValue}</span>
      </button>

      {isOpen ? (
        <div className="absolute left-0 z-30 mt-3 flex w-[640px] max-w-[calc(100vw-3rem)] overflow-hidden rounded-[28px] border border-white/50 bg-white/96 shadow-[0_30px_80px_rgba(95,120,136,0.2)]">
          <div className="w-[185px] border-r border-slate-200/80 bg-slate-50/70 p-4">
            <div className="space-y-2">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset.days)}
                  className="flex w-full items-center rounded-2xl px-4 py-3 text-left text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-indigo-600"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 p-5">
            <div className="mb-5 flex items-center justify-between">
              <button type="button" onClick={() => setViewDate(subMonths(viewDate, 1))} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100">
                <ChevronLeft size={18} />
              </button>
              <div className="text-[18px] font-semibold tracking-[0.16em] text-slate-700">{format(viewDate, 'yyyy年 MM月', { locale: zhCN })}</div>
              <button type="button" onClick={() => setViewDate(addMonths(viewDate, 1))} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100">
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="mb-2 grid grid-cols-7 text-center text-sm font-semibold text-slate-300">
              {['日', '一', '二', '三', '四', '五', '六'].map((weekday) => (
                <div key={weekday}>{weekday}</div>
              ))}
            </div>

            <div className="space-y-1">{rows}</div>

            <div className="mt-5 flex gap-4">
              <button
                type="button"
                onClick={() => onChange({ start: '', end: '' })}
                className="flex-1 rounded-2xl bg-slate-100 py-3 text-base font-semibold text-slate-600 transition hover:bg-slate-200"
              >
                重置
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 rounded-2xl bg-indigo-600 py-3 text-base font-semibold text-white shadow-[0_18px_36px_rgba(79,70,229,0.28)] transition hover:bg-indigo-700"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ValueWorkbench({
  bootstrap,
  onSidebarSummaryChange,
}: {
  bootstrap: BootstrapPayload;
  onSidebarSummaryChange?: (summary: {
    metrics: Array<{ label: string; value: string; hint: string }>;
    rules: string[];
  }) => void;
}) {
  const [form, setForm] = useState<ProjectInput | null>(null);
  const [result, setResult] = useState<EvaluationResult>(emptyResult);
  const [records, setRecords] = useState<ProjectRecord[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [recordPage, setRecordPage] = useState(1);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [deletingRecordId, setDeletingRecordId] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<ProjectRecord | null>(null);
  const recordsPerPage = 20;
  const detailPanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const firstOption = bootstrap.pricingOptions[0];
    const firstType = pricingTypes.find((type) => firstOption?.prices[type] !== undefined) ?? '插画+动效';
    const firstDesigner = bootstrap.designers[0];
    const firstSample = bootstrap.sampleRecords[0];

    setRecords(bootstrap.savedRecords);
    setHasUnsavedChanges(false);
    setForm((current) =>
      current
        ? (() => {
            const nextDemandLabel = bootstrap.pricingOptions.some((item) => item.label === current.demandLabel) ? current.demandLabel : firstOption?.label ?? '';
            const matchedPricing = bootstrap.pricingOptions.find((item) => item.label === nextDemandLabel);
            return {
              ...current,
              demandLabel: nextDemandLabel,
              demandName: current.demandName ?? '',
              designer: bootstrap.designers.some((item) => item.name === current.designer) ? current.designer : firstDesigner?.name ?? '',
              baseValue: Number(matchedPricing?.prices[current.pricingType] ?? current.baseValue),
            };
          })()
        : {
            businessLine: firstSample?.businessLine ?? 'PA',
            demandName: '',
            demandLabel: firstOption?.label ?? '',
            pricingType: firstType,
            baseValue: Number(firstOption?.prices[firstType] ?? 0),
            designer: firstDesigner?.name ?? '',
            efficiency: firstType === '插画+动效' ? 1.2 : firstType === '仅动效' ? 1.1 : firstType === '三维设计' ? 1.3 : 1,
            avgProductionDays: firstSample?.avgProductionDays ?? 4,
            slicingDays: firstSample?.slicingDays ?? 2,
            revisionRounds: firstSample?.revisionRounds ?? 2,
            strategicValue: 0,
            confidenceScore: 0,
          },
    );
  }, [bootstrap]);

  const deferredForm = useDeferredValue(form);

  useEffect(() => {
    if (!deferredForm) return;

    const controller = new AbortController();

    async function evaluate() {
      try {
        const response = await apiFetch('/api/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(deferredForm),
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error('测算失败');
        }
        const nextResult = (await response.json()) as EvaluationResult;
        startTransition(() => {
          setResult(nextResult);
          setForm((current) =>
            current
              ? {
                  ...current,
                  strategicValue: nextResult.strategicValue,
                  confidenceScore: nextResult.confidenceScore,
                }
              : current,
          );
        });
      } catch (evaluateError) {
        if (!controller.signal.aborted) {
          setError(evaluateError instanceof Error ? evaluateError.message : '测算失败');
        }
      }
    }

    evaluate();
    return () => controller.abort();
  }, [deferredForm]);

  const selectedPricing = useMemo(() => {
    return bootstrap?.pricingOptions.find((item) => item.label === form?.demandLabel) ?? null;
  }, [bootstrap, form?.demandLabel]);

  const sampleRecords = bootstrap?.sampleRecords ?? [];

  const filteredRecords = useMemo(() => {
    const all = [...records, ...sampleRecords];
    if (!dateRange.start && !dateRange.end) {
      return all;
    }

    return all
      .filter((record) => {
        const date = (record.createdAt || '').slice(0, 10);
        if (dateRange.start && date < dateRange.start) return false;
        if (dateRange.end && date > dateRange.end) return false;
        return true;
      });
  }, [dateRange.end, dateRange.start, records, sampleRecords]);

  const totalRecordPages = Math.max(1, Math.ceil(filteredRecords.length / recordsPerPage));
  const visibleRecords = useMemo(() => {
    const start = (recordPage - 1) * recordsPerPage;
    return filteredRecords.slice(start, start + recordsPerPage);
  }, [filteredRecords, recordPage]);

  useEffect(() => {
    setRecordPage(1);
  }, [dateRange.end, dateRange.start]);

  useEffect(() => {
    if (recordPage > totalRecordPages) {
      setRecordPage(totalRecordPages);
    }
  }, [recordPage, totalRecordPages]);

  useEffect(() => {
    if (!selectedRecord || !detailPanelRef.current) return;
    detailPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [selectedRecord]);

  const selectedRecordInsights = useMemo(() => {
    if (!selectedRecord) return [];

    const insights: Array<{ label: string; tone: string }> = [];

    if (selectedRecord.slicingDays >= 1) {
      insights.push({ label: `切图耗时偏长（${decimal.format(selectedRecord.slicingDays)} 天）`, tone: 'bg-amber-100 text-amber-700' });
    }
    if (selectedRecord.revisionRounds >= 3) {
      insights.push({ label: `返工次数偏多（${selectedRecord.revisionRounds} 轮）`, tone: 'bg-rose-100 text-rose-700' });
    } else if (selectedRecord.revisionRounds >= 1) {
      insights.push({ label: `存在返工（${selectedRecord.revisionRounds} 轮）`, tone: 'bg-orange-100 text-orange-700' });
    }
    if (selectedRecord.avgProductionDays >= 3) {
      insights.push({ label: `制作周期偏长（${decimal.format(selectedRecord.avgProductionDays)} 天）`, tone: 'bg-amber-100 text-amber-700' });
    } else if (selectedRecord.avgProductionDays <= 1.5) {
      insights.push({ label: `制作周期较短（${decimal.format(selectedRecord.avgProductionDays)} 天）`, tone: 'bg-emerald-100 text-emerald-700' });
    }
    if (selectedRecord.rawRoi < 1000) {
      insights.push({ label: `ROI 偏低（${decimal.format(selectedRecord.rawRoi)}）`, tone: 'bg-rose-100 text-rose-700' });
    } else if (selectedRecord.rawRoi >= 2000) {
      insights.push({ label: `ROI 表现较强（${decimal.format(selectedRecord.rawRoi)}）`, tone: 'bg-emerald-100 text-emerald-700' });
    }
    if (selectedRecord.confidenceScore <= 3) {
      insights.push({ label: `置信度偏低（${selectedRecord.confidenceScore} 分）`, tone: 'bg-amber-100 text-amber-700' });
    }
    if (selectedRecord.strategicValue >= 4) {
      insights.push({ label: `战略价值较高（${selectedRecord.strategicValue} 分）`, tone: 'bg-sky-100 text-sky-700' });
    }

    return insights;
  }, [selectedRecord]);

  const dashboardStats = bootstrap
    ? [
        {
          label: '报价模版',
          value: String(bootstrap.summaries.totalPricingOptions),
          hint: '从 Excel 报价表同步到线上',
        },
        {
          label: '设计师',
          value: String(bootstrap.summaries.totalDesigners),
          hint: '可直接匹配效率系数',
        },
        {
          label: '样本记录',
          value: String(bootstrap.summaries.totalSamples),
          hint: '用于校验规则一致性',
        },
        {
          label: '建议归类',
          value: result.suggestedCategory,
          hint: '根据当前参数实时计算',
        },
      ]
    : [];

  useEffect(() => {
    if (!bootstrap || !onSidebarSummaryChange) return;

    onSidebarSummaryChange({
      metrics: dashboardStats,
      rules: [
        '战略价值会随总制作周期缩短、修改轮次减少而自动提高。',
        '综合得分按 demo 页公式综合周期、修改、ROI、基准产值与战略价值。',
        '高价值、周期短、修改少的项目更偏向内部承接，否则更偏向外包。',
      ],
    });
  }, [bootstrap, dashboardStats, onSidebarSummaryChange]);

  function patchForm(patch: Partial<ProjectInput>) {
    setHasUnsavedChanges(true);
    setForm((current) => (current ? { ...current, ...patch } : current));
  }

  function syncPrice(nextLabel: string, nextType: PricingType) {
    const option = bootstrap?.pricingOptions.find((item) => item.label === nextLabel);
    if (!option) return;

    setHasUnsavedChanges(true);
    patchForm({
      demandLabel: nextLabel,
      pricingType: nextType,
      baseValue: Number(option.prices[nextType] ?? 0),
      efficiency: nextType === '插画+动效' ? 1.2 : nextType === '仅动效' ? 1.1 : nextType === '三维设计' ? 1.3 : 1,
    });
  }

  async function handleSave() {
    if (!form) return;

    try {
      setIsSaving(true);
      setError('');
      const response = await apiFetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        throw new Error('保存失败');
      }

      const record = (await response.json()) as ProjectRecord;
      setRecords((current) => [record, ...current]);
      setHasUnsavedChanges(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '保存失败');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteRecord(recordId: string) {
    setError('');
    setDeletingRecordId(recordId);

    try {
      const response = await apiFetch(`/api/projects/${recordId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('删除失败');
      }

      setRecords((current) => current.filter((record) => record.id !== recordId));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : '删除失败');
    } finally {
      setDeletingRecordId('');
    }
  }

  if (!form) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <LoaderCircle className="animate-spin" size={20} />
          <span className="text-sm">正在加载测算模型…</span>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_380px]">
        <div className="glass-panel p-5 sm:p-6">
          <PanelHeader
            title="项目参数录入"
            description="延续原版 designworkforce 的录入逻辑，把核心字段集中在一个清晰表单里。"
            icon={Settings2}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <label className="field-block">
              <span className="field-label">业务线</span>
              <select className="input-shell" value={form.businessLine} onChange={(e) => patchForm({ businessLine: e.target.value })}>
                {businessLines.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-block">
              <span className="field-label">需求名称</span>
              <input
                className="input-shell"
                type="text"
                value={form.demandName ?? ''}
                placeholder="填写业务内需求名称"
                onChange={(e) => patchForm({ demandName: e.target.value })}
              />
            </label>

            <label className="field-block">
              <span className="field-label">报价类型</span>
              <select
                className="input-shell"
                value={form.pricingType}
                onChange={(e) => syncPrice(form.demandLabel, e.target.value as PricingType)}
              >
                {pricingTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-block md:col-span-2">
              <span className="field-label">需求项</span>
              <select className="input-shell" value={form.demandLabel} onChange={(e) => syncPrice(e.target.value, form.pricingType)}>
                {bootstrap.pricingOptions.map((item) => (
                  <option key={item.label} value={item.label}>
                    {item.label.replaceAll('\n', ' / ')}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-block">
              <span className="field-label">基准产值</span>
              <input
                className="input-shell"
                type="number"
                value={form.baseValue}
                onChange={(e) => patchForm({ baseValue: Number(e.target.value) || 0 })}
              />
            </label>

            <label className="field-block">
              <span className="field-label">设计师</span>
              <select
                className="input-shell"
                value={form.designer}
                onChange={(e) => {
                  patchForm({ designer: e.target.value });
                }}
              >
                {bootstrap.designers.map((designer) => (
                  <option key={designer.name} value={designer.name}>
                    {designer.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-block">
              <span className="field-label">平均制作周期</span>
              <input
                className="input-shell"
                type="number"
                step="0.1"
                value={form.avgProductionDays}
                onChange={(e) => patchForm({ avgProductionDays: Number(e.target.value) || 0 })}
              />
            </label>

            <label className="field-block">
              <span className="field-label">切图耗时</span>
              <input
                className="input-shell"
                type="number"
                step="0.1"
                value={form.slicingDays}
                onChange={(e) => patchForm({ slicingDays: Number(e.target.value) || 0 })}
              />
            </label>

            <label className="field-block">
              <span className="field-label">修改轮次</span>
              <input
                className="input-shell"
                type="number"
                value={form.revisionRounds}
                onChange={(e) => patchForm({ revisionRounds: Number(e.target.value) || 0 })}
              />
            </label>

            <label className="field-block">
              <span className="field-label">战略价值</span>
              <input
                className="input-shell"
                type="number"
                value={form.strategicValue}
                readOnly
              />
            </label>

            <label className="field-block">
              <span className="field-label">置信度评分</span>
              <input
                className="input-shell"
                type="number"
                value={form.confidenceScore}
                readOnly
              />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-white/40 bg-white/38 px-4 py-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">当前报价匹配</p>
              <p className="text-sm text-slate-700">{selectedPricing?.label.replaceAll('\n', ' / ')}</p>
              {hasUnsavedChanges ? <p className="text-sm font-medium text-amber-600">当前修改尚未保存，请点击右侧按钮。</p> : null}
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
                hasUnsavedChanges
                  ? 'border border-amber-300 bg-[linear-gradient(135deg,_#f59e0b,_#f97316)] text-white shadow-[0_18px_36px_rgba(245,158,11,0.28)] hover:brightness-105'
                  : 'border border-white/40 bg-white/55 text-slate-800 hover:bg-white/75'
              }`}
            >
              {isSaving ? <LoaderCircle className="animate-spin" size={16} /> : <Save size={16} />}
              {hasUnsavedChanges ? '立即保存项目' : '保存项目'}
            </button>
          </div>
        </div>

        <div className="space-y-5">
          <div className="glass-panel p-5 sm:p-6">
            <PanelHeader
              title="测算结果"
              description="右侧固定展示当前项目的核心结果，避免录入时上下跳转。"
              icon={BarChart3}
            />

            <div className="space-y-3">
              <div className="rounded-[24px] border border-white/40 bg-white/45 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">建议归类</p>
                <div className="mt-3 flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${categoryTone(result.suggestedCategory)}`}>
                    {result.suggestedCategory}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[22px] border border-white/40 bg-white/45 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">选用报价</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">{currency.format(result.selectedPrice)}</p>
                </div>
                <div className="rounded-[22px] border border-white/40 bg-white/45 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">总消耗</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">{decimal.format(result.totalCost)}</p>
                </div>
                <div className="rounded-[22px] border border-white/40 bg-white/45 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">原始 ROI</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">{decimal.format(result.rawRoi)}</p>
                </div>
                <div className="rounded-[22px] border border-white/40 bg-white/45 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">ROI 分档</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">{decimal.format(result.roiScore)} / 5</p>
                </div>
              </div>

              <div className="rounded-[24px] border border-white/40 bg-white/45 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">综合得分</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{decimal.format(result.compositeScore)}</p>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-600">
                <span>修改系数 {decimal.format(result.revisionCoefficient)}</span>
                <span>置信度 {decimal.format(result.confidenceScore)}</span>
              </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="grid gap-5">
        <div className="glass-panel p-5 sm:p-6">
          <PanelHeader title="项目记录" description="上方录入、右侧测算、下方查看历史，路径和原版更接近。" icon={FolderKanban} />

          {error ? (
            <div className="mb-4 rounded-2xl border border-rose-300/35 bg-rose-100/45 px-4 py-3 text-sm text-rose-700">{error}</div>
          ) : null}

          <DateRangePicker startDate={dateRange.start} endDate={dateRange.end} onChange={setDateRange} />

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
            <span>共 {filteredRecords.length} 条记录，当前第 {recordPage} / {totalRecordPages} 页</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRecordPage((current) => Math.max(1, current - 1))}
                disabled={recordPage === 1}
                className="rounded-xl border border-white/40 bg-white/55 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-40"
              >
                上一页
              </button>
              <button
                type="button"
                onClick={() => setRecordPage((current) => Math.min(totalRecordPages, current + 1))}
                disabled={recordPage === totalRecordPages}
                className="rounded-xl border border-white/40 bg-white/55 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-40"
              >
                下一页
              </button>
            </div>
          </div>

          <div className="custom-scrollbar overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2 table-fixed">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <th className="w-[10%] px-4 pb-2">业务线</th>
                  <th className="w-[18%] px-4 pb-2">需求名称</th>
                  <th className="w-[22%] px-4 pb-2">需求项</th>
                  <th className="w-[12%] px-4 pb-2">报价类型</th>
                  <th className="w-[12%] px-4 pb-2">ROI</th>
                  <th className="w-[10%] px-4 pb-2">综合得分</th>
                  <th className="w-[10%] px-4 pb-2">归类</th>
                  <th className="w-[6%] px-4 pb-2 text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                {visibleRecords.map((record) => (
                  <tr key={record.id} className="bg-white/45 text-sm text-slate-700 transition hover:bg-white/65">
                    <td className="rounded-l-2xl px-4 py-4 align-middle">{record.businessLine}</td>
                    <td className="px-4 py-4 align-middle">{record.demandName?.trim() ? record.demandName : '—'}</td>
                    <td className="px-4 py-4 align-middle">{record.demandLabel.replaceAll('\n', ' / ')}</td>
                    <td className="px-4 py-4 align-middle">{record.pricingType}</td>
                    <td className="px-4 py-4 align-middle">{decimal.format(record.rawRoi)}</td>
                    <td className="px-4 py-4 align-middle">{decimal.format(record.compositeScore)}</td>
                    <td className="px-4 py-4 align-middle">
                      <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${categoryTone(record.suggestedCategory)}`}>
                        {record.suggestedCategory}
                      </span>
                    </td>
                    <td className="rounded-r-2xl px-4 py-4 align-middle">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedRecord(record)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sky-600 transition hover:bg-sky-100"
                          aria-label="查看项目详情"
                        >
                          <Eye size={14} />
                        </button>
                        {record.id.startsWith('seed-') ? (
                          <span className="inline-flex whitespace-nowrap rounded-full border border-white/45 bg-white/55 px-2.5 py-1 text-xs font-semibold text-slate-500">
                            样本
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDeleteRecord(record.id)}
                            disabled={deletingRecordId === record.id}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
                            aria-label="删除项目记录"
                          >
                            {deletingRecordId === record.id ? <LoaderCircle className="animate-spin" size={14} /> : <Trash2 size={14} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedRecord ? (
        <div ref={detailPanelRef} className="glass-panel p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">项目记录详情</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                展示该项目的原始录入值、测算结果和可读诊断，方便判断是不是切图耗时长、返工次数多或 ROI 偏低。
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedRecord(null)}
              className="rounded-2xl border border-white/40 bg-white/55 px-4 py-2 text-sm font-medium text-slate-700"
            >
              关闭
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${categoryTone(selectedRecord.suggestedCategory)}`}>
              {selectedRecord.suggestedCategory}
            </span>
            <span className="inline-flex rounded-full border border-white/45 bg-white/55 px-3 py-1 text-xs font-semibold text-slate-600">
              保存时间 {selectedRecord.createdAt.slice(0, 10)}
            </span>
            {selectedRecord.id.startsWith('seed-') ? (
              <span className="inline-flex rounded-full border border-white/45 bg-white/55 px-3 py-1 text-xs font-semibold text-slate-600">历史导入样本</span>
            ) : (
              <span className="inline-flex rounded-full border border-white/45 bg-white/55 px-3 py-1 text-xs font-semibold text-slate-600">手动保存记录</span>
            )}
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_380px]">
            <div className="space-y-5">
              <div className="rounded-[24px] border border-white/40 bg-white/42 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">原始录入数据</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/35 bg-white/50 p-3"><p className="text-xs text-slate-500">业务线</p><p className="mt-1 font-semibold text-slate-900">{selectedRecord.businessLine}</p></div>
                  <div className="rounded-2xl border border-white/35 bg-white/50 p-3"><p className="text-xs text-slate-500">需求名称</p><p className="mt-1 font-semibold text-slate-900">{selectedRecord.demandName?.trim() || '—'}</p></div>
                  <div className="rounded-2xl border border-white/35 bg-white/50 p-3 md:col-span-2"><p className="text-xs text-slate-500">需求项</p><p className="mt-1 font-semibold text-slate-900">{selectedRecord.demandLabel.replaceAll('\n', ' / ')}</p></div>
                  <div className="rounded-2xl border border-white/35 bg-white/50 p-3"><p className="text-xs text-slate-500">报价类型</p><p className="mt-1 font-semibold text-slate-900">{selectedRecord.pricingType}</p></div>
                  <div className="rounded-2xl border border-white/35 bg-white/50 p-3"><p className="text-xs text-slate-500">设计师</p><p className="mt-1 font-semibold text-slate-900">{selectedRecord.designer || '—'}</p></div>
                  <div className="rounded-2xl border border-white/35 bg-white/50 p-3"><p className="text-xs text-slate-500">基准产值</p><p className="mt-1 font-semibold text-slate-900">{currency.format(selectedRecord.baseValue)}</p></div>
                  <div className="rounded-2xl border border-white/35 bg-white/50 p-3"><p className="text-xs text-slate-500">选用报价</p><p className="mt-1 font-semibold text-slate-900">{currency.format(selectedRecord.selectedPrice)}</p></div>
                  <div className="rounded-2xl border border-white/35 bg-white/50 p-3"><p className="text-xs text-slate-500">平均制作周期</p><p className="mt-1 font-semibold text-slate-900">{decimal.format(selectedRecord.avgProductionDays)} 天</p></div>
                  <div className="rounded-2xl border border-white/35 bg-white/50 p-3"><p className="text-xs text-slate-500">切图耗时</p><p className="mt-1 font-semibold text-slate-900">{decimal.format(selectedRecord.slicingDays)} 天</p></div>
                  <div className="rounded-2xl border border-white/35 bg-white/50 p-3"><p className="text-xs text-slate-500">修改轮次</p><p className="mt-1 font-semibold text-slate-900">{selectedRecord.revisionRounds} 轮</p></div>
                  <div className="rounded-2xl border border-white/35 bg-white/50 p-3"><p className="text-xs text-slate-500">修改系数</p><p className="mt-1 font-semibold text-slate-900">{decimal.format(selectedRecord.revisionCoefficient)}</p></div>
                  <div className="rounded-2xl border border-white/35 bg-white/50 p-3"><p className="text-xs text-slate-500">战略价值</p><p className="mt-1 font-semibold text-slate-900">{selectedRecord.strategicValue} 分</p></div>
                  <div className="rounded-2xl border border-white/35 bg-white/50 p-3"><p className="text-xs text-slate-500">置信度评分</p><p className="mt-1 font-semibold text-slate-900">{selectedRecord.confidenceScore} 分</p></div>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-[24px] border border-white/40 bg-white/42 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">测算结果</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/35 bg-white/50 p-3"><p className="text-xs text-slate-500">总消耗</p><p className="mt-1 text-xl font-semibold text-slate-900">{decimal.format(selectedRecord.totalCost)}</p></div>
                  <div className="rounded-2xl border border-white/35 bg-white/50 p-3"><p className="text-xs text-slate-500">原始 ROI</p><p className="mt-1 text-xl font-semibold text-slate-900">{decimal.format(selectedRecord.rawRoi)}</p></div>
                  <div className="rounded-2xl border border-white/35 bg-white/50 p-3"><p className="text-xs text-slate-500">ROI 分档</p><p className="mt-1 text-xl font-semibold text-slate-900">{selectedRecord.roiScore} / 5</p></div>
                  <div className="rounded-2xl border border-white/35 bg-white/50 p-3"><p className="text-xs text-slate-500">综合得分</p><p className="mt-1 text-xl font-semibold text-slate-900">{decimal.format(selectedRecord.compositeScore)}</p></div>
                </div>
              </div>

              <div className="rounded-[24px] border border-white/40 bg-white/42 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">诊断提示</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedRecordInsights.length > 0 ? (
                    selectedRecordInsights.map((insight) => (
                      <span key={insight.label} className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${insight.tone}`}>
                        {insight.label}
                      </span>
                    ))
                  ) : (
                    <span className="inline-flex rounded-full border border-white/45 bg-white/55 px-3 py-1.5 text-xs font-semibold text-slate-600">
                      当前没有明显异常项
                    </span>
                  )}
                </div>
                <div className="mt-4 rounded-2xl border border-white/35 bg-white/50 p-3 text-sm leading-6 text-slate-600">
                  如果这里显示“切图耗时偏长”“返工次数偏多”，说明这条历史记录更适合回看流程问题，而不是只看最终归类结果。
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
