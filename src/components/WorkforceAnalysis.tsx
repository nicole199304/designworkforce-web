import { BarChart3, FileSpreadsheet, LoaderCircle, ShieldAlert, TrendingUp, Upload, Users } from 'lucide-react';
import Papa from 'papaparse';
import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { apiFetch } from '../lib/api';
import type { ProjectRecord, WorkforceBusinessInput, WorkforceBusinessSummary, WorkforceConfig, WorkforceEvaluationPayload, WorkforceResultRow } from '../types';

const currency = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  maximumFractionDigits: 0,
});

const percent = new Intl.NumberFormat('zh-CN', {
  style: 'percent',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function formatMoney(value: number) {
  return currency.format(value || 0);
}

function formatNumber(value: number, digits = 2) {
  return Number(value || 0).toFixed(digits);
}

function monthRank(month: string) {
  const match = month.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

function InputField({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
}) {
  return (
    <label className="field-block">
      <span className="field-label">{label}</span>
      <input className="input-shell" type="number" value={value} min={min} step={step} onChange={(event) => onChange(Number(event.target.value) || 0)} />
    </label>
  );
}

function SummaryCard({
  title,
  value,
  hint,
  icon: Icon,
}: {
  title: string;
  value: string;
  hint: string;
  icon: typeof TrendingUp;
}) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{hint}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/45 bg-white/55 text-slate-600">
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

export const WorkforceAnalysis = () => {
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<WorkforceEvaluationPayload | null>(null);
  const [configDraft, setConfigDraft] = useState<WorkforceConfig | null>(null);
  const [businessInputsDraft, setBusinessInputsDraft] = useState<WorkforceBusinessInput[]>([]);
  const [selectedBusinessLine, setSelectedBusinessLine] = useState('');
  const [projectRecords, setProjectRecords] = useState<ProjectRecord[]>([]);
  const [executionInputs, setExecutionInputs] = useState({
    illustrationDays: 42,
    motionDays: 18,
    revisionLossFactor: 1.15,
    illustrationCapacity: 18,
    motionCapacity: 16,
  });
  const [riskInputs, setRiskInputs] = useState({
    volatility: 1,
    concentration: 1,
    rework: 1,
    change: 1,
  });

  useEffect(() => {
    let active = true;

    async function load() {
      const [workforceResponse, projectResponse] = await Promise.all([apiFetch('/api/workforce/bootstrap'), apiFetch('/api/projects')]);
      const workforcePayload = (await workforceResponse.json()) as WorkforceEvaluationPayload;
      const projectsPayload = (await projectResponse.json()) as ProjectRecord[];
      if (!active) return;

      setEvaluation(workforcePayload);
      setConfigDraft(workforcePayload.config);
      setBusinessInputsDraft(workforcePayload.businessInputs);
      setSelectedBusinessLine(workforcePayload.defaultBusinessLine || workforcePayload.businessSummaries[0]?.businessLine || '');
      setProjectRecords(projectsPayload);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!configDraft || businessInputsDraft.length === 0) return;
    let active = true;
    setEvaluating(true);

    async function recalculate() {
      const response = await apiFetch('/api/workforce/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: configDraft, businessInputs: businessInputsDraft }),
      });
      const payload = (await response.json()) as WorkforceEvaluationPayload;
      if (!active) return;
      setEvaluation(payload);
      setEvaluating(false);
    }

    recalculate();
    return () => {
      active = false;
    };
  }, [configDraft, businessInputsDraft]);

  const businessLines = useMemo(() => Array.from(new Set(businessInputsDraft.map((item) => item.businessLine))), [businessInputsDraft]);

  const filteredInputs = useMemo(
    () =>
      businessInputsDraft
        .filter((item) => item.businessLine === selectedBusinessLine)
        .sort((left, right) => monthRank(left.month) - monthRank(right.month)),
    [businessInputsDraft, selectedBusinessLine],
  );

  const filteredResults = useMemo(
    () =>
      (evaluation?.results ?? [])
        .filter((item) => item.businessLine === selectedBusinessLine)
        .sort((left, right) => monthRank(left.month) - monthRank(right.month)),
    [evaluation?.results, selectedBusinessLine],
  );

  const selectedSummary = useMemo<WorkforceBusinessSummary | undefined>(
    () => evaluation?.businessSummaries.find((item) => item.businessLine === selectedBusinessLine),
    [evaluation?.businessSummaries, selectedBusinessLine],
  );

  const selectedProjectRecords = useMemo(
    () => projectRecords.filter((item) => item.businessLine === selectedBusinessLine),
    [projectRecords, selectedBusinessLine],
  );

  const categoryBreakdown = useMemo(() => {
    const breakdown = { A: 0, B: 0, C: 0, D: 0 };
    selectedProjectRecords.forEach((item) => {
      if (item.suggestedCategory.startsWith('A')) breakdown.A += 1;
      else if (item.suggestedCategory.startsWith('B')) breakdown.B += 1;
      else if (item.suggestedCategory.startsWith('C')) breakdown.C += 1;
      else breakdown.D += 1;
    });
    return breakdown;
  }, [selectedProjectRecords]);

  const moneyModelFte = selectedSummary?.averageFte ?? 0;
  const actualTotalDays = (executionInputs.illustrationDays + executionInputs.motionDays) * executionInputs.revisionLossFactor;
  const illustrationDayFte = executionInputs.illustrationCapacity > 0 ? executionInputs.illustrationDays / executionInputs.illustrationCapacity : 0;
  const motionDayFte = executionInputs.motionCapacity > 0 ? executionInputs.motionDays / executionInputs.motionCapacity : 0;
  const dayModelFte = illustrationDayFte + motionDayFte;
  const diffRate = moneyModelFte > 0 || dayModelFte > 0 ? Math.abs(moneyModelFte - dayModelFte) / Math.max((moneyModelFte + dayModelFte) / 2, 0.0001) : 0;
  const calibratedFte = (moneyModelFte + dayModelFte) / 2;
  const riskScore = riskInputs.volatility + riskInputs.concentration + riskInputs.rework + riskInputs.change;
  const riskLevel = riskScore <= 6 ? 'A' : riskScore <= 9 ? 'B' : 'C';
  const riskBuffer = riskLevel === 'A' ? 0 : riskLevel === 'B' ? 1 : 2;
  const finalSuggestedHeadcount = Math.ceil(calibratedFte + riskBuffer);

  const chartData = useMemo(
    () =>
      filteredResults.map((item) => ({
        month: item.month,
        FTE: Number(item.totalFte.toFixed(2)),
        借调人数: item.recommendedHeadcount,
      })),
    [filteredResults],
  );

  function handleImport(file: File) {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data }) => {
        const imported = data
          .map((row) => ({
            businessLine: row.businessLine?.trim() || selectedBusinessLine,
            month: row.month?.trim() || '',
            illustrationAmount: Number(row.illustrationAmount ?? 0),
            motionAmount: Number(row.motionAmount ?? 0),
            totalAmount: Number(row.totalAmount ?? Number(row.illustrationAmount ?? 0) + Number(row.motionAmount ?? 0)),
            concentrationFactor: Number(row.concentrationFactor ?? 1) || 1,
            qualityFactor: Number(row.qualityFactor ?? 1) || 1,
          }))
          .filter((row) => row.businessLine && row.month);

        if (imported.length === 0) return;
        setBusinessInputsDraft(imported);
        setSelectedBusinessLine(imported[0].businessLine);
      },
    });
  }

  if (loading || !configDraft || !evaluation) {
    return (
      <div className="glass-panel flex min-h-[480px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <LoaderCircle className="animate-spin" size={18} />
          <span>正在加载人力分析模型...</span>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Human Analysis</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">人力分析</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            这里只保留真正需要操作的输入项，其他公式全部自动计算。支持导入业务月表，并结合需求测算页的建议归类做辅助判断。
          </p>
        </div>
        <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-2xl border border-white/45 bg-white/60 px-4 text-sm font-medium text-slate-800">
          <Upload size={16} />
          导入业务月表 CSV
          <input type="file" accept=".csv" className="hidden" onChange={(event) => event.target.files?.[0] && handleImport(event.target.files[0])} />
        </label>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        <SummaryCard title="金额模型 FTE" value={formatNumber(moneyModelFte)} hint="来自业务月度金额和满载基准产值。" icon={TrendingUp} />
        <SummaryCard title="人天模型 FTE" value={formatNumber(dayModelFte)} hint="来自你填写的人天和可承载能力。" icon={Users} />
        <SummaryCard title="校准后 FTE" value={formatNumber(calibratedFte)} hint={`双模型差异 ${percent.format(diffRate || 0)}。`} icon={BarChart3} />
        <SummaryCard title="最终建议借调" value={`${finalSuggestedHeadcount} 人`} hint={`风险等级 ${riskLevel}，冗余 +${riskBuffer}。`} icon={ShieldAlert} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          <div className="glass-panel p-5">
            <div className="flex items-center gap-3 border-b border-white/35 pb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/45 bg-white/55 text-slate-600">
                <FileSpreadsheet size={18} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">需要填写</h3>
                <p className="mt-1 text-sm text-slate-600">只保留会影响结果的输入项，其他全部自动算。</p>
              </div>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-2">
              <div className="space-y-4 rounded-[24px] border border-sky-200 bg-sky-50/45 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">金额口径输入</p>
                <label className="field-block">
                  <span className="field-label">业务线</span>
                  <select className="input-shell" value={selectedBusinessLine} onChange={(event) => setSelectedBusinessLine(event.target.value)}>
                    {businessLines.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <InputField label="安全利用率" value={configDraft.safeUtilization} step={0.05} min={0.1} onChange={(value) => setConfigDraft((current) => (current ? { ...current, safeUtilization: value } : current))} />
                  <InputField label="插画人数" value={configDraft.illustrationHeadcount} onChange={(value) => setConfigDraft((current) => (current ? { ...current, illustrationHeadcount: value } : current))} />
                  <InputField label="动效人数" value={configDraft.motionHeadcount} onChange={(value) => setConfigDraft((current) => (current ? { ...current, motionHeadcount: value } : current))} />
                </div>
              </div>

              <div className="space-y-4 rounded-[24px] border border-emerald-200 bg-emerald-50/45 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">执行校验输入</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <InputField label="插画制作人天" value={executionInputs.illustrationDays} onChange={(value) => setExecutionInputs((current) => ({ ...current, illustrationDays: value }))} />
                  <InputField label="动效制作人天" value={executionInputs.motionDays} onChange={(value) => setExecutionInputs((current) => ({ ...current, motionDays: value }))} />
                  <InputField label="修改损耗系数" value={executionInputs.revisionLossFactor} step={0.05} min={0.5} onChange={(value) => setExecutionInputs((current) => ({ ...current, revisionLossFactor: value }))} />
                  <InputField label="插画可承载人天" value={executionInputs.illustrationCapacity} onChange={(value) => setExecutionInputs((current) => ({ ...current, illustrationCapacity: value }))} />
                  <InputField label="动效可承载人天" value={executionInputs.motionCapacity} onChange={(value) => setExecutionInputs((current) => ({ ...current, motionCapacity: value }))} />
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-[24px] border border-amber-200 bg-amber-50/45 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">风险输入</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {[
                  ['需求波动率', 'volatility'],
                  ['交付集中度', 'concentration'],
                  ['返工率', 'rework'],
                  ['需求变更率', 'change'],
                ].map(([label, key]) => (
                  <label key={label} className="field-block">
                    <span className="field-label">{label}</span>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="1"
                      value={riskInputs[key as keyof typeof riskInputs]}
                      onChange={(event) => setRiskInputs((current) => ({ ...current, [key]: Number(event.target.value) || 1 }))}
                      className="w-full accent-amber-500"
                    />
                    <span className="text-sm font-medium text-slate-600">{riskInputs[key as keyof typeof riskInputs]} 分</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-panel p-5">
            <div className="flex items-center justify-between gap-4 border-b border-white/35 pb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">导入后的业务月表</h3>
                <p className="mt-1 text-sm text-slate-600">支持 CSV，列名建议使用 `businessLine,month,illustrationAmount,motionAmount,totalAmount,concentrationFactor,qualityFactor`。</p>
              </div>
              {evaluating ? <LoaderCircle className="animate-spin text-slate-400" size={18} /> : null}
            </div>

            <div className="custom-scrollbar mt-4 overflow-auto">
              <table className="min-w-full table-fixed border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    <th className="w-[14%] px-2 pb-2">月份</th>
                    <th className="w-[18%] px-2 pb-2">插画金额</th>
                    <th className="w-[18%] px-2 pb-2">动效金额</th>
                    <th className="w-[18%] px-2 pb-2">集中系数</th>
                    <th className="w-[18%] px-2 pb-2">损耗系数</th>
                    <th className="w-[14%] px-2 pb-2">借调</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInputs.map((item) => {
                    const result = filteredResults.find((row) => row.month === item.month) as WorkforceResultRow | undefined;
                    return (
                      <tr key={`${item.businessLine}-${item.month}`} className="bg-white/42 text-sm text-slate-700">
                        <td className="rounded-l-[22px] px-2 py-2.5 font-medium text-slate-900">{item.month}</td>
                        <td className="px-2 py-2.5">{formatMoney(item.illustrationAmount)}</td>
                        <td className="px-2 py-2.5">{formatMoney(item.motionAmount)}</td>
                        <td className="px-2 py-2.5">
                          <input
                            className="input-shell px-3 py-2.5"
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={item.concentrationFactor}
                            onChange={(event) =>
                              setBusinessInputsDraft((current) =>
                                current.map((row) =>
                                  row.businessLine === item.businessLine && row.month === item.month
                                    ? { ...row, concentrationFactor: Number(event.target.value) || 0 }
                                    : row,
                                ),
                              )
                            }
                          />
                        </td>
                        <td className="px-2 py-2.5">
                          <input
                            className="input-shell px-3 py-2.5"
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={item.qualityFactor}
                            onChange={(event) =>
                              setBusinessInputsDraft((current) =>
                                current.map((row) =>
                                  row.businessLine === item.businessLine && row.month === item.month
                                    ? { ...row, qualityFactor: Number(event.target.value) || 0 }
                                    : row,
                                ),
                              )
                            }
                          />
                        </td>
                        <td className="rounded-r-[22px] px-2 py-2.5 font-medium text-slate-900">{result?.recommendedHeadcount ?? '-'} 人</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="glass-panel p-5">
            <h3 className="text-lg font-semibold text-slate-900">自动计算结果</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl border border-white/40 bg-white/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">金额口径</p>
                <p className="mt-2">月均全量金额：{formatMoney(evaluation.config.averageMonthlyTotal)}</p>
                <p>人均月实际产值：{formatMoney(evaluation.config.actualPerCapitaMonthly)}</p>
                <p>人均满载基准产值：{formatMoney(evaluation.config.baselinePerCapitaMonthly)}</p>
              </div>
              <div className="rounded-2xl border border-white/40 bg-white/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">执行校验</p>
                <p className="mt-2">真实总人天：{formatNumber(actualTotalDays)} 天</p>
                <p>插画 FTE：{formatNumber(illustrationDayFte)}</p>
                <p>动效 FTE：{formatNumber(motionDayFte)}</p>
                <p>人天模型 FTE：{formatNumber(dayModelFte)}</p>
              </div>
              <div className="rounded-2xl border border-white/40 bg-white/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">校准与风险</p>
                <p className="mt-2">双模型差异：{percent.format(diffRate || 0)}</p>
                <p>校准后 FTE：{formatNumber(calibratedFte)}</p>
                <p>风险总分：{riskScore} 分，{riskLevel} 类</p>
                <p>最终建议借调人数：{finalSuggestedHeadcount} 人</p>
              </div>
            </div>
          </div>

          <div className="glass-panel p-5">
            <h3 className="text-lg font-semibold text-slate-900">需求测算联动洞察</h3>
            <p className="mt-1 text-sm text-slate-600">读取已保存的需求测算结果，帮助判断这条业务线是否偏内部消化还是外包缓冲。</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/40 bg-white/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">已保存需求</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{selectedProjectRecords.length}</p>
              </div>
              <div className="rounded-2xl border border-white/40 bg-white/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">建议口径</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {categoryBreakdown.A + categoryBreakdown.B >= categoryBreakdown.C + categoryBreakdown.D
                    ? '当前需求测算更偏向内部消化，可优先保留稳定借调。'
                    : '当前需求测算更偏向外包/淘汰，建议保守配置内部借调。'}
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {[
                ['A类', categoryBreakdown.A, 'bg-emerald-100 text-emerald-700'],
                ['B类', categoryBreakdown.B, 'bg-sky-100 text-sky-700'],
                ['C类', categoryBreakdown.C, 'bg-amber-100 text-amber-700'],
                ['D类', categoryBreakdown.D, 'bg-rose-100 text-rose-700'],
              ].map(([label, count, tone]) => (
                <div key={label} className="flex items-center justify-between rounded-2xl border border-white/40 bg-white/40 px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-sm font-semibold ${tone}`}>{label}</span>
                  <span className="text-sm font-medium text-slate-700">{count} 条</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-5">
            <h3 className="text-lg font-semibold text-slate-900">公式说明</h3>
            <div className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
              <p>1. 月均全量金额 = 三个月全量金额 ÷ 3</p>
              <p>2. 人均月实际产值 = 月均金额 ÷ 总人数</p>
              <p>3. 人均满载基准产值 = 人均月实际产值 ÷ 安全利用率</p>
              <p>4. 金额模型 FTE = 调整后金额 ÷ 人均满载基准产值</p>
              <p>5. 人天模型 FTE = 插画 FTE + 动效 FTE</p>
              <p>6. 校准后 FTE = (金额模型 FTE + 人天模型 FTE) ÷ 2</p>
              <p>7. 最终建议借调人数 = 向上取整(校准后 FTE + 风险冗余)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel p-5">
        <div className="flex items-center justify-between gap-4 border-b border-white/35 pb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">金额口径月度结果</h3>
            <p className="mt-1 text-sm text-slate-600">{selectedBusinessLine || '当前业务线'} 的月度 FTE 和建议借调趋势。</p>
          </div>
        </div>
        <div className="mt-5 h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid stroke="rgba(125,145,159,0.18)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#5f7082', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#5f7082', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.3)' }}
                contentStyle={{
                  borderRadius: '18px',
                  border: '1px solid rgba(255,255,255,0.55)',
                  background: 'rgba(255,255,255,0.92)',
                  boxShadow: '0 20px 40px rgba(95,120,136,0.18)',
                }}
              />
              <Bar dataKey="FTE" fill="#8ea7ff" radius={[8, 8, 0, 0]} />
              <Bar dataKey="借调人数" fill="#95d7ca" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
};
