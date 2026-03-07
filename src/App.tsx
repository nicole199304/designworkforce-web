import { CalendarRange, ChevronLeft, ChevronRight, BarChart3, Bell, Database, LayoutGrid, LoaderCircle, Plus, Save, Settings, ShieldCheck, Table2, Trash2 } from 'lucide-react';
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
import { useEffect, useMemo, useRef, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { ValueWorkbench } from './components/ValueWorkbench';
import { WorkforceAnalysis } from './components/WorkforceAnalysis';
import { BootstrapPayload, DesignerOption, PricingOption, ProjectRecord } from './types';

interface SidebarSummary {
  metrics: Array<{ label: string; value: string; hint: string }>;
  rules: string[];
}

const navItems = [
  { label: '需求测算', icon: Table2 },
  { label: '数据资产', icon: Database },
  { label: '人力分析', icon: BarChart3 },
  { label: '分析看板', icon: BarChart3 },
  { label: '系统设置', icon: Settings },
];

const dashboardCategoryStyles = {
  A: { label: 'A类', color: '#26b46c', bg: 'bg-emerald-100 text-emerald-700' },
  B: { label: 'B类', color: '#e4a51b', bg: 'bg-amber-100 text-amber-700' },
  C: { label: 'C类', color: '#ea7c33', bg: 'bg-orange-100 text-orange-700' },
  D: { label: 'D类', color: '#e75170', bg: 'bg-rose-100 text-rose-700' },
} as const;

const canonicalBusinessLines = [
  { label: 'wowchat', patterns: [/wowchat/i] },
  { label: 'veeka', patterns: [/veeka/i] },
  { label: '不夜', patterns: [/不夜/] },
  { label: 'PT', patterns: [/(^|[\s-])PT($|[\s-])/i, /^PT/i] },
  { label: 'PA', patterns: [/(^|[\s-])PA($|[\s-])/i, /^PA/i] },
  { label: 'PS', patterns: [/(^|[\s-])PS($|[\s-])/i, /^PS/i] },
  { label: '凶手', patterns: [/凶手/] },
  { label: 'hatta', patterns: [/hatta/i] },
  { label: 'Utlas', patterns: [/utlas/i] },
  { label: 'majlis', patterns: [/majlis/i] },
];

function normalizeCategory(category: string) {
  if (category.startsWith('A')) return 'A';
  if (category.startsWith('B')) return 'B';
  if (category.startsWith('C')) return 'C';
  return 'D';
}

function extractBusinessLine(rawBusinessLine: string) {
  const value = (rawBusinessLine || '').trim();
  for (const candidate of canonicalBusinessLines) {
    if (candidate.patterns.some((pattern) => pattern.test(value))) {
      return candidate.label;
    }
  }
  return '其他';
}

function formatCategoryShare(count: number, total: number) {
  const percentage = total ? Math.round((count / total) * 100) : 0;
  return `${count} · ${percentage}%`;
}

function recordDate(record: ProjectRecord) {
  return (record.createdAt || '').slice(0, 10);
}

function DashboardDateRangePicker({
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
    <div ref={containerRef} className={`relative ${isOpen ? 'z-[120]' : 'z-10'}`}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className={`flex w-full max-w-[560px] items-center gap-3 rounded-[26px] border bg-white/62 px-5 py-4 text-left text-sm font-semibold text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition ${
          isOpen ? 'border-indigo-500 ring-2 ring-indigo-500/15' : 'border-slate-300/45 hover:border-indigo-300'
        }`}
      >
        <CalendarRange size={19} className="text-slate-400" />
        <span>{displayValue}</span>
      </button>

      {isOpen ? (
        <div className="absolute left-0 top-full z-[140] mt-3 flex w-[640px] max-w-[calc(100vw-3rem)] overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_30px_80px_rgba(95,120,136,0.2)]">
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

function AnalysisDashboard({ records }: { records: ProjectRecord[] }) {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [businessPage, setBusinessPage] = useState(1);
  const businessRowsPerPage = 8;
  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const date = recordDate(record);
      if (dateRange.start && date < dateRange.start) return false;
      if (dateRange.end && date > dateRange.end) return false;
      return true;
    });
  }, [dateRange.end, dateRange.start, records]);

  const businessRows = useMemo(() => {
    const grouped = new Map<string, { businessLine: string; A: number; B: number; C: number; D: number; total: number }>();

    filteredRecords.forEach((record) => {
      const key = extractBusinessLine(record.businessLine || '');
      const current = grouped.get(key) ?? { businessLine: key, A: 0, B: 0, C: 0, D: 0, total: 0 };
      const categoryKey = normalizeCategory(record.suggestedCategory);
      current[categoryKey] += 1;
      current.total += 1;
      grouped.set(key, current);
    });

    return Array.from(grouped.values()).sort((left, right) => right.total - left.total);
  }, [filteredRecords]);

  const totals = useMemo(() => {
    return businessRows.reduce(
      (accumulator, row) => ({
        total: accumulator.total + row.total,
        A: accumulator.A + row.A,
        B: accumulator.B + row.B,
        C: accumulator.C + row.C,
        D: accumulator.D + row.D,
      }),
      { total: 0, A: 0, B: 0, C: 0, D: 0 },
    );
  }, [businessRows]);

  const totalBusinessPages = Math.max(1, Math.ceil(businessRows.length / businessRowsPerPage));
  const visibleBusinessRows = useMemo(() => {
    const start = (businessPage - 1) * businessRowsPerPage;
    return businessRows.slice(start, start + businessRowsPerPage);
  }, [businessPage, businessRows]);

  const pieData = [
    { name: 'A类', value: totals.A, color: dashboardCategoryStyles.A.color },
    { name: 'B类', value: totals.B, color: dashboardCategoryStyles.B.color },
    { name: 'C类', value: totals.C, color: dashboardCategoryStyles.C.color },
    { name: 'D类', value: totals.D, color: dashboardCategoryStyles.D.color },
  ].filter((item) => item.value > 0);

  const [selectedBusinessLine, setSelectedBusinessLine] = useState<string>('');

  useEffect(() => {
    const hasSelectedBusiness = businessRows.some((row) => row.businessLine === selectedBusinessLine);
    if ((!selectedBusinessLine || !hasSelectedBusiness) && businessRows[0]?.businessLine) {
      setSelectedBusinessLine(businessRows[0].businessLine);
    }
  }, [businessRows, selectedBusinessLine]);

  useEffect(() => {
    setBusinessPage(1);
  }, [dateRange.end, dateRange.start]);

  const selectedBusinessRecords = useMemo(
    () => filteredRecords.filter((record) => extractBusinessLine(record.businessLine || '') === selectedBusinessLine),
    [filteredRecords, selectedBusinessLine],
  );

  const designCategoryRows = useMemo(() => {
    const grouped = new Map<string, { label: string; A: number; B: number; C: number; D: number; total: number }>();
    selectedBusinessRecords.forEach((record) => {
      const key = (record.demandLabel || '未分类需求').replaceAll('\n', ' / ');
      const current = grouped.get(key) ?? { label: key, A: 0, B: 0, C: 0, D: 0, total: 0 };
      const categoryKey = normalizeCategory(record.suggestedCategory);
      current[categoryKey] += 1;
      current.total += 1;
      grouped.set(key, current);
    });

    return Array.from(grouped.values()).sort((left, right) => right.total - left.total).slice(0, 12);
  }, [selectedBusinessRecords]);

  return (
    <section className="space-y-5">
      <div className={`glass-panel p-5 ${dateRange.start || dateRange.end ? 'relative z-[110]' : 'relative z-20'}`}>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">时间范围筛选</h3>
            <p className="mt-1 text-sm text-slate-600">默认展示全部数据。你也可以按记录时间检索，历史导入数据已补月度标记，后续新增数据则按实际保存时间进入看板。</p>
          </div>
          <DashboardDateRangePicker startDate={dateRange.start} endDate={dateRange.end} onChange={setDateRange} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        <div className="glass-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">总记录数</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{totals.total}</p>
          <p className="mt-2 text-sm text-slate-600">{dateRange.start || dateRange.end ? '当前时间范围内的有效项目数。' : '当前全量数据的有效项目数。'}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">业务线数量</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{businessRows.length}</p>
          <p className="mt-2 text-sm text-slate-600">当前筛选范围内已出现分类结果的业务线。</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">优先内部占比</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{totals.total ? `${Math.round((totals.A / totals.total) * 100)}%` : '0%'}</p>
          <p className="mt-2 text-sm text-slate-600">A类在全部项目中的占比。</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">可外包/淘汰占比</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{totals.total ? `${Math.round(((totals.C + totals.D) / totals.total) * 100)}%` : '0%'}</p>
          <p className="mt-2 text-sm text-slate-600">C类与D类项目合计占比。</p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="glass-panel p-5">
          <h3 className="text-lg font-semibold text-slate-900">各业务线 ABCD 占比</h3>
          <p className="mt-1 text-sm text-slate-600">按业务线汇总项目数，并换算成占比，方便看不同业务的内部承接倾向。</p>

          <div className="custom-scrollbar mt-5 overflow-x-auto">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
              <span>共 {businessRows.length} 条业务线，当前第 {businessPage} / {totalBusinessPages} 页</span>
              <div className="flex items-center gap-2 rounded-2xl border border-white/40 bg-white/45 p-1.5">
                <button
                  type="button"
                  onClick={() => setBusinessPage((current) => Math.max(1, current - 1))}
                  disabled={businessPage === 1}
                  className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-white/70 disabled:opacity-40"
                >
                  上一页
                </button>
                <button
                  type="button"
                  onClick={() => setBusinessPage((current) => Math.min(totalBusinessPages, current + 1))}
                  disabled={businessPage === totalBusinessPages}
                  className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-white/70 disabled:opacity-40"
                >
                  下一页
                </button>
              </div>
            </div>
            <table className="min-w-[940px] table-fixed border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <th className="w-[18%] px-4 pb-2">业务线</th>
                  <th className="w-[8%] px-4 pb-2">总数</th>
                  <th className="w-[12%] px-4 pb-2">A类</th>
                  <th className="w-[12%] px-4 pb-2">B类</th>
                  <th className="w-[12%] px-4 pb-2">C类</th>
                  <th className="w-[12%] px-4 pb-2">D类</th>
                  <th className="w-[26%] px-4 pb-2">占比条</th>
                </tr>
              </thead>
              <tbody>
                {visibleBusinessRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="rounded-2xl bg-white/40 px-4 py-8 text-center text-sm text-slate-500">
                      当前时间范围内还没有可统计的项目。
                    </td>
                  </tr>
                ) : null}
                {visibleBusinessRows.map((row) => (
                  <tr key={row.businessLine} className="bg-white/45 text-sm text-slate-700">
                    <td className="rounded-l-2xl px-4 py-4 font-medium text-slate-900">{row.businessLine}</td>
                    <td className="px-4 py-4 text-base font-medium text-slate-800">{row.total}</td>
                    {(['A', 'B', 'C', 'D'] as const).map((key) => (
                      <td key={key} className="px-4 py-4">
                        <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold ${dashboardCategoryStyles[key].bg}`}>
                          {formatCategoryShare(row[key], row.total)}
                        </span>
                      </td>
                    ))}
                    <td className="rounded-r-2xl px-4 py-4">
                      <div className="flex h-5 overflow-hidden rounded-full bg-slate-100 shadow-[inset_0_1px_2px_rgba(148,163,184,0.14)]">
                        {(['A', 'B', 'C', 'D'] as const).map((key) => (
                          <div
                            key={key}
                            style={{
                              width: `${row.total ? (row[key] / row.total) * 100 : 0}%`,
                              backgroundColor: dashboardCategoryStyles[key].color,
                            }}
                          />
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-5 xl:self-start">
          <div className="glass-panel p-5">
            <h3 className="text-lg font-semibold text-slate-900">整体分类结构</h3>
            <p className="mt-1 text-sm text-slate-600">所有业务线合并后的 A/B/C/D 分布。</p>
            <div className="mt-4 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={56} outerRadius={92} paddingAngle={3}>
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [`${value} 条`, name]}
                    contentStyle={{
                      borderRadius: '18px',
                      border: '1px solid rgba(255,255,255,0.55)',
                      background: 'rgba(255,255,255,0.92)',
                      boxShadow: '0 20px 40px rgba(95,120,136,0.18)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {(['A', 'B', 'C', 'D'] as const).map((key) => (
                <div key={key} className="rounded-2xl border border-white/40 bg-white/40 p-4">
                  <div className="flex items-center justify-between">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${dashboardCategoryStyles[key].bg}`}>
                      {dashboardCategoryStyles[key].label}
                    </span>
                    <span className="text-sm font-medium text-slate-700">{totals[key]} 条</span>
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-slate-900">{totals.total ? `${Math.round((totals[key] / totals.total) * 100)}%` : '0%'}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-5">
            <h3 className="text-lg font-semibold text-slate-900">业务判断</h3>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <p>A类占比高的业务线，更适合建立稳定内部承接能力。</p>
              <p>B类占比较高，说明这条业务线还有优化空间，适合阶段性保留。</p>
              <p>C/D类占比高的业务线，说明更偏外包缓冲或应收缩内部资源投入。</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="glass-panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/35 pb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">具体业务设计分类看板</h3>
              <p className="mt-1 text-sm text-slate-600">按业务线下钻到具体需求项，查看每类设计内容的项目数量与分类倾向。</p>
            </div>
            <select className="input-shell w-[220px]" value={selectedBusinessLine} onChange={(event) => setSelectedBusinessLine(event.target.value)}>
              {businessRows.map((row) => (
                <option key={row.businessLine} value={row.businessLine}>
                  {row.businessLine}
                </option>
              ))}
            </select>
          </div>

          <div className="custom-scrollbar mt-5 overflow-x-auto">
            <table className="min-w-[940px] table-fixed border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <th className="w-[34%] px-4 pb-2">设计分类</th>
                  <th className="w-[8%] px-4 pb-2">总数</th>
                  <th className="w-[12%] px-4 pb-2">A类</th>
                  <th className="w-[12%] px-4 pb-2">B类</th>
                  <th className="w-[12%] px-4 pb-2">C类</th>
                  <th className="w-[12%] px-4 pb-2">D类</th>
                  <th className="w-[10%] px-4 pb-2">占比条</th>
                </tr>
              </thead>
              <tbody>
                {designCategoryRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="rounded-2xl bg-white/40 px-4 py-8 text-center text-sm text-slate-500">
                      当前业务线在所选时间范围内暂无项目。
                    </td>
                  </tr>
                ) : null}
                {designCategoryRows.map((row) => (
                  <tr key={row.label} className="bg-white/45 text-sm text-slate-700">
                    <td className="rounded-l-2xl px-4 py-4 font-medium text-slate-900">{row.label}</td>
                    <td className="px-4 py-4 text-base font-medium text-slate-800">{row.total}</td>
                    {(['A', 'B', 'C', 'D'] as const).map((key) => (
                      <td key={key} className="px-4 py-4">
                        <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold ${dashboardCategoryStyles[key].bg}`}>
                          {formatCategoryShare(row[key], row.total)}
                        </span>
                      </td>
                    ))}
                    <td className="rounded-r-2xl px-4 py-4">
                      <div className="flex h-5 overflow-hidden rounded-full bg-slate-100 shadow-[inset_0_1px_2px_rgba(148,163,184,0.14)]">
                        {(['A', 'B', 'C', 'D'] as const).map((key) => (
                          <div
                            key={key}
                            style={{
                              width: `${row.total ? (row[key] / row.total) * 100 : 0}%`,
                              backgroundColor: dashboardCategoryStyles[key].color,
                            }}
                          />
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-panel p-5 xl:self-start">
          <h3 className="text-lg font-semibold text-slate-900">{selectedBusinessLine || '业务线'} 看板摘要</h3>
          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <p>当前业务线共 {selectedBusinessRecords.length} 条项目记录。</p>
            <p>已展示项目数最多的前 {designCategoryRows.length} 个设计分类。</p>
            <p>这里的“设计分类”当前按 `需求项` 聚合，后续如果你有更正式的分类字段，可以直接替换成真实分类维度。</p>
            <p>当前所有统计都以记录时间 `createdAt` 为检索源。历史导入数据已按 11 月、12 月、1 月补标，后续新数据则按填写保存时间进入分析看板。</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function DataAssetsView({
  pricingOptions,
  designers,
  onChangePricingOptions,
  onChangeDesigners,
  onSave,
  isSaving,
}: {
  pricingOptions: PricingOption[];
  designers: DesignerOption[];
  onChangePricingOptions: (items: PricingOption[]) => void;
  onChangeDesigners: (items: DesignerOption[]) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
}) {
  return (
    <section className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_340px]">
        <div className="glass-panel overflow-hidden p-5">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/35 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-slate-900">报价模板</h3>
                <span className="rounded-full border border-white/45 bg-white/55 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {pricingOptions.length} 条
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">紧凑维护需求项与四类报价，保存后会同步到需求测算页。</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  onChangePricingOptions([
                    ...pricingOptions,
                    { id: crypto.randomUUID(), label: '新需求项', prices: { '插画+动效': 0, '仅动效': 0, '仅插画': 0, '三维设计': 0 } },
                  ])
                }
                className="inline-flex h-10 items-center gap-2 rounded-2xl border border-white/45 bg-white/60 px-4 text-sm font-medium text-slate-800"
              >
                <Plus size={15} />
                新增报价
              </button>
              <button
                type="button"
                onClick={onSave}
                className="inline-flex h-10 items-center gap-2 rounded-2xl bg-slate-900 px-4 text-sm font-medium text-white"
              >
                {isSaving ? <LoaderCircle className="animate-spin" size={15} /> : <Save size={15} />}
                保存
              </button>
            </div>
          </div>

          <div className="custom-scrollbar mt-4 overflow-auto">
            <table className="min-w-[860px] table-fixed border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <th className="w-[20%] px-2 pb-1">需求项</th>
                  <th className="w-[16%] px-2 pb-1">插画+动效</th>
                  <th className="w-[16%] px-2 pb-1">仅动效</th>
                  <th className="w-[16%] px-2 pb-1">仅插画</th>
                  <th className="w-[16%] px-2 pb-1">三维设计</th>
                  <th className="w-[10%] px-2 pb-1 text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                {pricingOptions.map((item) => (
                  <tr key={item.id} className="bg-white/42 text-sm text-slate-700">
                    <td className="rounded-l-[22px] px-2 py-2.5">
                      <input
                        className="input-shell px-3 py-2.5"
                        value={item.label}
                        onChange={(event) =>
                          onChangePricingOptions(
                            pricingOptions.map((current) => (current.id === item.id ? { ...current, label: event.target.value } : current)),
                          )
                        }
                      />
                    </td>
                    {(['插画+动效', '仅动效', '仅插画', '三维设计'] as const).map((type) => (
                      <td key={type} className="px-2 py-2.5">
                        <input
                          className="input-shell px-3 py-2.5"
                          type="number"
                          value={item.prices[type] ?? 0}
                          onChange={(event) =>
                            onChangePricingOptions(
                              pricingOptions.map((current) =>
                                current.id === item.id
                                  ? { ...current, prices: { ...current.prices, [type]: Number(event.target.value) || 0 } }
                                  : current,
                              ),
                            )
                          }
                        />
                      </td>
                    ))}
                    <td className="rounded-r-[22px] px-2 py-2.5">
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => onChangePricingOptions(pricingOptions.filter((current) => current.id !== item.id))}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600"
                          aria-label={`删除 ${item.label}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-panel p-5">
            <div className="flex items-start justify-between gap-3 border-b border-white/35 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-slate-900">设计师名单</h3>
                  <span className="rounded-full border border-white/45 bg-white/55 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {designers.length} 人
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">这里只维护名字，测算页会直接同步下拉选项。</p>
              </div>
              <button
                type="button"
                onClick={() => onChangeDesigners([...designers, { id: crypto.randomUUID(), name: '新设计师', efficiency: 1 }])}
                className="inline-flex h-10 items-center gap-2 rounded-2xl border border-white/45 bg-white/60 px-4 text-sm font-medium text-slate-800"
              >
                <Plus size={15} />
                新增
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {designers.map((designer, index) => (
                <div key={designer.id} className="grid grid-cols-[28px_minmax(0,1fr)_40px] items-center gap-2 rounded-2xl border border-white/40 bg-white/44 px-3 py-2.5">
                  <span className="text-xs font-semibold text-slate-400">{String(index + 1).padStart(2, '0')}</span>
                  <input
                    className="input-shell px-3 py-2.5"
                    value={designer.name}
                    onChange={(event) =>
                      onChangeDesigners(designers.map((current) => (current.id === designer.id ? { ...current, name: event.target.value } : current)))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => onChangeDesigners(designers.filter((current) => current.id !== designer.id))}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600"
                    aria-label={`删除 ${designer.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">联动说明</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              报价模板会更新需求项与基准产值，设计师名单会更新测算页下拉。修改完成后统一点一次保存。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('需求测算');
  const [bootstrap, setBootstrap] = useState<BootstrapPayload | null>(null);
  const [assetDraft, setAssetDraft] = useState<{ pricingOptions: PricingOption[]; designers: DesignerOption[] }>({
    pricingOptions: [],
    designers: [],
  });
  const [isAssetSaving, setIsAssetSaving] = useState(false);
  const [sidebarSummary, setSidebarSummary] = useState<SidebarSummary>({
    metrics: [],
    rules: [],
  });

  const headerCopy =
    activeTab === '数据资产'
      ? {
          title: '数据资产',
          description: '管理需求测算依赖的报价模板与设计师基础信息。',
        }
      : activeTab === '人力分析'
        ? {
            title: '人力分析',
            description: '按月度金额、基准产值和业务调整系数推算 FTE 与整人借调。',
          }
      : activeTab === '分析看板'
        ? {
            title: '分析看板',
            description: '预留给后续跨模块图表和经营视图。',
          }
      : {
          title: '需求测算工作台',
          description: '报价匹配、ROI 评分、综合得分和建议归类都由后端统一计算。',
        };

  useEffect(() => {
    let active = true;

    async function loadBootstrap() {
      const response = await fetch('/api/bootstrap');
      const payload = (await response.json()) as BootstrapPayload;
      if (!active) return;
      setBootstrap(payload);
      setAssetDraft({
        pricingOptions: payload.pricingOptions,
        designers: payload.designers,
      });
    }

    loadBootstrap();
    return () => {
      active = false;
    };
  }, []);

  async function handleSaveAssets() {
    setIsAssetSaving(true);
    const response = await fetch('/api/assets', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assetDraft),
    });
    const saved = await response.json();
    setAssetDraft(saved);
    setBootstrap((current) =>
      current
        ? {
            ...current,
            pricingOptions: saved.pricingOptions,
            designers: saved.designers,
            summaries: {
              ...current.summaries,
              totalPricingOptions: saved.pricingOptions.length,
              totalDesigners: saved.designers.length,
            },
          }
        : current,
    );
    setIsAssetSaving(false);
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#dbe4ea_0%,_#eef3f7_18%,_#d4dde5_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-5 px-4 py-4 lg:px-6 lg:py-6">
        <aside className="glass-panel hidden w-[290px] flex-col overflow-hidden lg:flex">
          <div className="border-b border-white/35 px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_rgba(255,255,255,0.92),_rgba(190,212,222,0.78))] text-slate-800 shadow-[0_12px_30px_rgba(96,124,141,0.18)]">
                <LayoutGrid size={22} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Design Workforce</p>
                <h1 className="text-lg font-semibold text-slate-900">需求价值测算</h1>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-5 overflow-auto px-4 py-5">
            <div className="space-y-3">
              {navItems.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  onClick={() => setActiveTab(label)}
                  type="button"
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition ${
                    activeTab === label
                      ? 'border border-white/40 bg-white/52 font-semibold text-slate-900 shadow-[0_14px_28px_rgba(96,124,141,0.12)]'
                      : 'border border-transparent bg-white/10 text-slate-500 hover:bg-white/26 hover:text-slate-800'
                  }`}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <section className="rounded-[24px] border border-white/40 bg-white/30 p-4">
              <div className="mb-3 flex items-center gap-2">
                <ShieldCheck size={16} className="text-slate-500" />
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">判定规则</p>
              </div>
              <div className="space-y-3 text-sm leading-6 text-slate-600">
                {(activeTab === '需求测算' ? sidebarSummary.rules : []).map((rule) => (
                  <p key={rule}>{rule}</p>
                ))}
              </div>
            </section>
          </div>

          <div className="border-t border-white/35 px-5 py-5">
            <div className="rounded-[24px] border border-white/40 bg-white/34 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Current Module</p>
              <p className="mt-2 text-base font-semibold text-slate-900">Excel 线上化</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">沿用本地项目结构，接入后端 API 和报价数据。</p>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="glass-panel flex h-full min-h-screen flex-col">
            <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/35 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Workspace</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">{headerCopy.title}</h2>
                <p className="mt-1 text-sm text-slate-600">{headerCopy.description}</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/40 bg-white/45 text-slate-600"
                >
                  <Bell size={18} />
                </button>
                <div className="flex items-center gap-3 rounded-[22px] border border-white/40 bg-white/45 px-4 py-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">N</div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Nicole</p>
                    <p className="text-xs text-slate-500">Design Ops</p>
                  </div>
                </div>
              </div>
            </header>

            <div className={`flex-1 px-5 py-5 sm:px-6 ${activeTab === '分析看板' ? 'overflow-visible' : 'overflow-auto'}`}>
              {bootstrap && activeTab === '需求测算' ? (
                <ValueWorkbench bootstrap={bootstrap} onSidebarSummaryChange={setSidebarSummary} />
              ) : activeTab === '数据资产' ? (
                <DataAssetsView
                  pricingOptions={assetDraft.pricingOptions}
                  designers={assetDraft.designers}
                  onChangePricingOptions={(pricingOptions) => setAssetDraft((current) => ({ ...current, pricingOptions }))}
                  onChangeDesigners={(designers) => setAssetDraft((current) => ({ ...current, designers }))}
                  onSave={handleSaveAssets}
                  isSaving={isAssetSaving}
                />
              ) : activeTab === '人力分析' ? (
                <WorkforceAnalysis />
              ) : activeTab === '分析看板' ? (
                <AnalysisDashboard records={[...(bootstrap?.savedRecords ?? []), ...(bootstrap?.sampleRecords ?? [])]} />
              ) : !bootstrap ? (
                <div className="flex h-full items-center justify-center text-slate-500">正在加载数据...</div>
              ) : null}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
