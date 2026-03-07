import React, { useState, useMemo } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval, 
  isWithinInterval, 
  isAfter, 
  isBefore,
  parseISO
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { 
  Plus, 
  Trash2, 
  Upload,
  ChevronLeft,
  ChevronRight, 
  Target, 
  Clock, 
  RefreshCw, 
  BarChart3,
  Search,
  AlertCircle,
  Calendar as CalendarIcon,
  X,
  Layout,
  Table as TableIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProjectData, ProjectCategory, CalculatedProjectData, PriceLibraryEntry } from '../types';
import { calculateProjectMetrics } from '../utils';
import { ImportModule } from './ImportModule';
import { CategorySelector } from './CategorySelector';
import { BUSINESS_TYPES } from '../constants/categories';

const TabButton = ({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-bold transition-all border-b-2 ${
      active 
        ? 'border-indigo-600 text-indigo-600' 
        : 'border-transparent text-slate-400 hover:text-slate-600'
    }`}
  >
    {label}
  </button>
);

const InputField = ({ label, value, onChange, type = "number", suffix }: { label: string, value: any, onChange: (val: any) => void, type?: string, suffix?: string }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</label>
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
      />
      {suffix && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">{suffix}</span>}
    </div>
  </div>
);

const DateRangePicker = ({ 
  startDate, 
  endDate, 
  onSelect 
}: { 
  startDate: string | null, 
  endDate: string | null, 
  onSelect: (start: string | null, end: string | null) => void 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());

  const presets = [
    { label: '最近一周', days: 7 },
    { label: '最近一个月', days: 30 },
    { label: '最近三个月', days: 90 },
    { label: '全部时间', days: null },
  ];

  const handlePreset = (days: number | null) => {
    if (days === null) {
      onSelect(null, null);
    } else {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - days);
      onSelect(format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd'));
    }
    setIsOpen(false);
  };

  const handleDateClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    if (!startDate || (startDate && endDate)) {
      onSelect(dateStr, null);
    } else {
      const start = parseISO(startDate);
      if (isBefore(date, start)) {
        onSelect(dateStr, startDate);
      } else {
        onSelect(startDate, dateStr);
      }
    }
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(monthStart);
    const startDateCal = startOfWeek(monthStart);
    const endDateCal = endOfWeek(monthEnd);

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDateCal;
    let formattedDate = "";

    const start = startDate ? parseISO(startDate) : null;
    const end = endDate ? parseISO(endDate) : null;

    while (day <= endDateCal) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        
        const isSelected = (start && isSameDay(day, start)) || (end && isSameDay(day, end));
        const isInRange = start && end && isWithinInterval(day, { start, end });
        const isCurrentMonth = isSameMonth(day, monthStart);

        days.push(
          <div
            key={day.toString()}
            className={`relative h-8 flex items-center justify-center text-[10px] cursor-pointer transition-all ${
              !isCurrentMonth ? 'text-slate-200' : 'text-slate-600'
            } ${isSelected ? 'z-10' : ''}`}
            onClick={() => handleDateClick(cloneDay)}
          >
            {isInRange && (
              <div className={`absolute inset-y-1 inset-x-0 bg-indigo-50 ${
                isSameDay(day, start!) ? 'rounded-l-lg ml-1' : ''
              } ${
                isSameDay(day, end!) ? 'rounded-r-lg mr-1' : ''
              }`} />
            )}
            <span className={`relative z-10 w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
              isSelected ? 'bg-indigo-600 text-white font-bold shadow-sm' : 'hover:bg-slate-100'
            }`}>
              {formattedDate}
            </span>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="space-y-1">{rows}</div>;
  };

  const displayText = startDate && endDate 
    ? `${startDate} → ${endDate}` 
    : startDate 
      ? `${startDate} → ...`
      : '选择时间范围';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2 bg-slate-50 border rounded-xl text-xs font-bold transition-all ${
          isOpen ? 'border-indigo-500 ring-2 ring-indigo-500/10' : 'border-slate-200 text-slate-600'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <CalendarIcon size={14} className={startDate ? 'text-indigo-500' : 'text-slate-400'} />
          <span className="truncate">{displayText}</span>
        </div>
        {startDate && (
          <X 
            size={14} 
            className="text-slate-400 hover:text-rose-500 ml-1 shrink-0" 
            onClick={(e) => {
              e.stopPropagation();
              onSelect(null, null);
            }}
          />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              className="absolute left-0 top-full mt-2 w-[320px] bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 flex overflow-hidden"
            >
              {/* Left Presets */}
              <div className="w-24 bg-slate-50/50 border-r border-slate-100 p-2 flex flex-col gap-1">
                {presets.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => handlePreset(p.days)}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-[10px] font-bold text-slate-500 hover:bg-white hover:text-indigo-600 transition-all border border-transparent hover:border-slate-100"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Right Calendar */}
              <div className="flex-1 p-3">
                <div className="flex items-center justify-between mb-3">
                  <button onClick={() => setViewDate(subMonths(viewDate, 1))} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">
                    {format(viewDate, 'yyyy年 MM月', { locale: zhCN })}
                  </span>
                  <button onClick={() => setViewDate(addMonths(viewDate, 1))} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                    <ChevronRight size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-7 mb-1">
                  {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                    <div key={d} className="text-center text-[9px] font-black text-slate-300 uppercase">{d}</div>
                  ))}
                </div>
                
                {renderCalendar()}

                <div className="mt-4 flex gap-2">
                  <button 
                    onClick={() => { onSelect(null, null); setIsOpen(false); }}
                    className="flex-1 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold hover:bg-slate-200 transition-all"
                  >
                    重置
                  </button>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="flex-1 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                  >
                    确定
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export const DemandEstimation = ({ 
  projects, 
  setProjects, 
  priceLibrary 
}: { 
  projects: ProjectData[], 
  setProjects: React.Dispatch<React.SetStateAction<ProjectData[]>>, 
  priceLibrary: PriceLibraryEntry[] 
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(projects[0]?.id || null);
  const [dateRange, setDateRange] = useState<{ start: string | null, end: string | null }>({ start: null, end: null });
  const [viewMode, setViewMode] = useState<'details' | 'table'>('details');
  const [isImportOpen, setIsImportOpen] = useState(false);

  const calculatedProjects = useMemo(() => {
    return projects.map(calculateProjectMetrics);
  }, [projects]);

  const filteredProjects = useMemo(() => {
    if (!dateRange.start && !dateRange.end) return calculatedProjects;
    
    return calculatedProjects.filter(p => {
      const projectDate = new Date(p.date);
      if (dateRange.start && projectDate < new Date(dateRange.start)) return false;
      if (dateRange.end && projectDate > new Date(dateRange.end)) return false;
      return true;
    });
  }, [calculatedProjects, dateRange]);

  const selectedProject = useMemo(() => {
    return calculatedProjects.find(p => p.id === selectedId) || null;
  }, [calculatedProjects, selectedId]);

  const handleAddProject = () => {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    
    // Default to first library entry if available
    const defaultEntry = priceLibrary[0];

    const newProject: ProjectData = {
      id: Math.random().toString(36).substr(2, 9),
      date: currentDate,
      businessType: BUSINESS_TYPES[0],
      businessName: '新项目',
      categoryLevel1: defaultEntry?.categoryLevel1 || '礼物、霸屏、牵手',
      categoryLevel2: defaultEntry?.categoryLevel2 || '中档',
      level: defaultEntry?.level || '5-6秒',
      pricingType: defaultEntry?.pricingType || '插画+动效',
      basePrice: defaultEntry?.price || 0,
      actualPrice: defaultEntry?.price || 0,
      isPriceModified: false,
      baseOutput: defaultEntry?.price || 0,
      avgProductionCycle: 1,
      slicingTime: 0.5,
      revisionRounds: 1,
      strategicValue: 3,
      confidenceScore: 3,
    };
    setProjects([...projects, newProject]);
    setSelectedId(newProject.id);
  };

  const handleUpdateProject = (updates: Partial<ProjectData>) => {
    if (!selectedId) return;
    
    setProjects(prevProjects => prevProjects.map(p => {
      if (p.id !== selectedId) return p;
      
      const updatedProject = { ...p, ...updates };

      // If category or level or type changed, we might need to update basePrice
      const needsPriceSync = updates.categoryLevel1 || updates.categoryLevel2 || updates.level || updates.pricingType;
      
      if (needsPriceSync) {
        const standardEntry = priceLibrary.find(entry => 
          entry.categoryLevel1 === updatedProject.categoryLevel1 &&
          entry.categoryLevel2 === updatedProject.categoryLevel2 &&
          entry.level === updatedProject.level &&
          entry.pricingType === updatedProject.pricingType
        );

        if (standardEntry) {
          updatedProject.basePrice = standardEntry.price;
          // If it wasn't manually modified before, or if we just changed the category, we reset actualPrice
          if (!updatedProject.isPriceModified) {
            updatedProject.actualPrice = standardEntry.price;
          }
        }
      }

      // If actualPrice was manually updated, set isPriceModified to true
      if (updates.actualPrice !== undefined) {
        if (updates.actualPrice !== updatedProject.basePrice) {
          updatedProject.isPriceModified = true;
        } else {
          updatedProject.isPriceModified = false;
        }
      }

      return updatedProject;
    }));
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newProjects = projects.filter(p => p.id !== id);
    setProjects(newProjects);
    if (selectedId === id) {
      setSelectedId(newProjects[0]?.id || null);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#F8FAFC]">
      {/* Left List - More Compact */}
      <div className="w-72 border-r border-slate-100 bg-white flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800">项目列表</h3>
            <div className="flex bg-slate-200/50 p-0.5 rounded-lg">
              <button 
                onClick={() => setViewMode('details')}
                className={`p-1 rounded-md transition-all ${viewMode === 'details' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                title="详情视图"
              >
                <Layout size={14} />
              </button>
              <button 
                onClick={() => setViewMode('table')}
                className={`p-1 rounded-md transition-all ${viewMode === 'table' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                title="表格视图"
              >
                <TableIcon size={14} />
              </button>
            </div>
          </div>
          <button 
            onClick={handleAddProject}
            className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-sm"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Date Range Picker Filter */}
        <div className="p-3 border-b border-slate-100 bg-white">
          <DateRangePicker 
            startDate={dateRange.start}
            endDate={dateRange.end}
            onSelect={(start, end) => setDateRange({ start, end })}
          />
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
          {filteredProjects.length > 0 ? filteredProjects.map((project) => (
            <div
              key={project.id}
              onClick={() => setSelectedId(project.id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer group relative ${
                selectedId === project.id 
                  ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200' 
                  : 'bg-white border-slate-100 hover:border-indigo-100'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <h4 className="text-xs font-bold text-slate-800 truncate pr-4">
                  {project.businessType} - {project.businessName}
                </h4>
                <button 
                  onClick={(e) => handleDeleteProject(project.id, e)}
                  className="p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                    project.suggestedCategory === ProjectCategory.A ? 'bg-emerald-100 text-emerald-700' :
                    project.suggestedCategory === ProjectCategory.B ? 'bg-amber-100 text-amber-700' :
                    'bg-rose-100 text-rose-700'
                  }`}>
                    {project.suggestedCategory}类
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">ROI: {project.roi.toFixed(0)}</span>
                </div>
                <span className="text-[8px] font-bold text-slate-300">{project.date}</span>
              </div>
            </div>
          )) : (
            <div className="py-12 text-center">
              <p className="text-xs text-slate-400">该月份暂无数据</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Details - Bento Grid Layout or Table View */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <AnimatePresence mode="wait">
          {viewMode === 'table' ? (
            <motion.div
              key="table-view"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="h-full flex flex-col"
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">项目总表 (Google Sheets 模式)</h2>
                  <p className="text-xs text-slate-500">直观查看所有项目的 ROI、得分与归类</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400">共 {filteredProjects.length} 个项目</span>
                  <button 
                    onClick={() => setIsImportOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    <Upload size={14} />
                    批量导入
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">
                    <RefreshCw size={14} />
                    同步数据
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100">
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky left-0 bg-slate-50/80 z-10">业务线</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky left-[100px] bg-slate-50/80 z-10">名称</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">日期</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">归类</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">ROI</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">综合得分</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">基准产值</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">总周期</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">战略价值</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredProjects.map((p) => (
                        <tr 
                          key={p.id} 
                          onClick={() => { setSelectedId(p.id); setViewMode('details'); }}
                          className={`hover:bg-indigo-50/30 transition-colors cursor-pointer group ${selectedId === p.id ? 'bg-indigo-50/50' : ''}`}
                        >
                          <td className="px-4 py-3 text-xs font-bold text-slate-700 sticky left-0 bg-white group-hover:bg-indigo-50/30 transition-colors z-10 border-r border-slate-50">
                            {p.businessType}
                          </td>
                          <td className="px-4 py-3 text-xs font-bold text-slate-700 sticky left-[100px] bg-white group-hover:bg-indigo-50/30 transition-colors z-10 border-r border-slate-50">
                            {p.businessName}
                          </td>
                          <td className="px-4 py-3 text-[10px] font-mono text-slate-400">{p.date}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                              p.suggestedCategory === ProjectCategory.A ? 'bg-emerald-100 text-emerald-700' :
                              p.suggestedCategory === ProjectCategory.B ? 'bg-amber-100 text-amber-700' :
                              'bg-rose-100 text-rose-700'
                            }`}>
                              {p.suggestedCategory}类
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs font-black text-indigo-600 text-right">{p.roi.toFixed(1)}</td>
                          <td className="px-4 py-3 text-xs font-bold text-slate-600 text-right">{p.compositeScore.toFixed(3)}</td>
                          <td className="px-4 py-3 text-xs text-slate-500 text-right">{p.baseOutput}</td>
                          <td className="px-4 py-3 text-xs text-slate-500 text-right">{p.totalProductionCycle}d</td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center gap-0.5">
                              {[1, 2, 3, 4, 5].map(v => (
                                <div key={v} className={`w-1.5 h-1.5 rounded-full ${v <= p.strategicValue ? 'bg-amber-400' : 'bg-slate-100'}`} />
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteProject(p.id, e); }}
                              className="p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredProjects.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-300 py-20">
                    <Search size={48} className="mb-4 opacity-20" />
                    <p className="text-sm font-bold">暂无匹配项目</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : selectedProject ? (
            <motion.div
              key={selectedProject.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-5xl mx-auto space-y-6"
            >
              {/* Top Summary Bar */}
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-2 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-lg font-bold text-slate-800 truncate">
                        {selectedProject.businessType} - {selectedProject.businessName}
                      </h2>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold">{selectedProject.date}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                      {selectedProject.categoryLevel1} | {selectedProject.categoryLevel2} | {selectedProject.level}
                    </p>
                  </div>
                  <div className={`px-4 py-2 rounded-xl text-center ${
                    selectedProject.suggestedCategory === ProjectCategory.A ? 'bg-emerald-50 text-emerald-600' :
                    selectedProject.suggestedCategory === ProjectCategory.B ? 'bg-amber-50 text-amber-600' :
                    'bg-rose-50 text-rose-600'
                  }`}>
                    <p className="text-[8px] font-bold uppercase">建议归类</p>
                    <p className="text-xl font-black">{selectedProject.suggestedCategory}类</p>
                  </div>
                </div>
                <div className="bg-indigo-600 p-4 rounded-2xl shadow-lg shadow-indigo-100 flex flex-col justify-center">
                  <p className="text-[8px] font-bold text-indigo-200 uppercase tracking-widest">ROI (自动计算)</p>
                  <p className="text-2xl font-black text-white">{selectedProject.roi.toFixed(1)}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">综合得分</p>
                  <p className="text-2xl font-black text-slate-800">{selectedProject.compositeScore.toFixed(3)}</p>
                </div>
              </div>

              {/* Main Entry Grid */}
              <div className="grid grid-cols-12 gap-6">
                {/* Left Column: Basic & Cycle */}
                <div className="col-span-7 space-y-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1.5 h-4 bg-indigo-600 rounded-full" />
                      <h3 className="text-sm font-bold text-slate-800">基础信息与报价</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">业务线</label>
                        <select 
                          value={selectedProject.businessType}
                          onChange={(e) => handleUpdateProject({ businessType: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                        >
                          {BUSINESS_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      <InputField label="业务名称" type="text" value={selectedProject.businessName} onChange={(val) => handleUpdateProject({ businessName: val })} />
                      <div className="col-span-2 space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">需求分类</label>
                        <CategorySelector 
                          categoryLevel1={selectedProject.categoryLevel1}
                          categoryLevel2={selectedProject.categoryLevel2}
                          level={selectedProject.level}
                          onChange={(updates) => handleUpdateProject(updates)}
                        />
                      </div>
                      <div className="col-span-2 grid grid-cols-2 gap-4">
                        <InputField label="所属日期" type="date" value={selectedProject.date} onChange={(val) => handleUpdateProject({ date: val })} />
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">报价类型</label>
                          <select 
                            value={selectedProject.pricingType}
                            onChange={(e) => handleUpdateProject({ pricingType: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                          >
                            <option value="插画+动效">插画+动效</option>
                            <option value="仅动效">仅动效</option>
                            <option value="仅插画">仅插画</option>
                            <option value="三维设计">三维设计</option>
                          </select>
                        </div>
                      </div>
                      <div className="col-span-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">项目定价</span>
                            {selectedProject.isPriceModified && (
                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-600 text-[8px] font-bold rounded uppercase">已调整</span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">标准价: ¥{selectedProject.basePrice.toLocaleString()}</span>
                        </div>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">¥</span>
                          <input 
                            type="number" 
                            value={selectedProject.actualPrice} 
                            onChange={(e) => handleUpdateProject({ actualPrice: parseFloat(e.target.value) || 0 })}
                            className={`w-full pl-8 pr-4 py-3 bg-white border rounded-2xl text-lg font-black outline-none transition-all ${
                              selectedProject.isPriceModified ? 'border-amber-200 text-amber-600 focus:ring-amber-500/10' : 'border-slate-100 text-indigo-600 focus:ring-indigo-500/10'
                            }`}
                          />
                        </div>
                        {selectedProject.isPriceModified && (
                          <p className="text-[9px] text-amber-500 font-medium">此价格仅影响当前项目，不影响价格库标准定价。</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cycle Section - Moved to Left */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                      <h3 className="text-sm font-bold text-slate-800">制作周期与消耗</h3>
                    </div>
                    <div className="space-y-4">
                      <InputField label="基准产值" value={selectedProject.baseOutput} onChange={(val) => handleUpdateProject({ baseOutput: val })} />
                      <div className="grid grid-cols-2 gap-4">
                        <InputField label="平均制作周期" suffix="人天" value={selectedProject.avgProductionCycle} onChange={(val) => handleUpdateProject({ avgProductionCycle: val })} />
                        <InputField label="切图耗时" suffix="人天" value={selectedProject.slicingTime} onChange={(val) => handleUpdateProject({ slicingTime: val })} />
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">总制作周期</span>
                        <span className="text-lg font-black text-slate-700">{selectedProject.totalProductionCycle} <span className="text-[10px] font-normal">人天</span></span>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">修改轮次</label>
                        <div className="flex items-center gap-3">
                          <input 
                            type="range" min="0" max="10" step="1" 
                            value={selectedProject.revisionRounds} 
                            onChange={(e) => handleUpdateProject({ revisionRounds: parseInt(e.target.value) })}
                            className="flex-1 accent-indigo-600"
                          />
                          <span className="w-8 text-center text-sm font-bold text-indigo-600">{selectedProject.revisionRounds}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                          <span>消耗系数</span>
                          <span className="text-indigo-500">x{selectedProject.revisionCoefficient.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Scoring & Warning */}
                <div className="col-span-5 space-y-6">
                  {/* Value Section */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
                      <h3 className="text-sm font-bold text-slate-800">价值与置信度</h3>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">战略价值 (1-5)</label>
                        <div className="flex justify-between">
                          {[1, 2, 3, 4, 5].map(v => (
                            <button
                              key={v}
                              onClick={() => handleUpdateProject({ strategicValue: v })}
                              className={`w-10 h-10 rounded-xl font-bold transition-all ${
                                selectedProject.strategicValue === v ? 'bg-amber-500 text-white shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                              }`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">置信度评分 (1-5)</label>
                        <div className="flex justify-between">
                          {[1, 2, 3, 4, 5].map(v => (
                            <button
                              key={v}
                              onClick={() => handleUpdateProject({ confidenceScore: v })}
                              className={`w-10 h-10 rounded-xl font-bold transition-all ${
                                selectedProject.confidenceScore === v ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                              }`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* C-Reason Warning - Moved to Right */}
                  {selectedProject.suggestedCategory === ProjectCategory.C && (
                    <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100 shadow-sm">
                      <div className="flex items-center gap-2 mb-4 text-rose-600">
                        <AlertCircle size={18} />
                        <h3 className="text-sm font-bold">C类原因说明 (必填)</h3>
                      </div>
                      <textarea
                        value={selectedProject.cReason || ''}
                        onChange={(e) => handleUpdateProject({ cReason: e.target.value })}
                        placeholder="请输入该项目被判定为C类的原因..."
                        className="w-full h-24 p-4 bg-white border border-rose-200 rounded-2xl text-sm focus:ring-2 focus:ring-rose-500/20 outline-none resize-none"
                      />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-300">
              <Target size={64} className="mb-4 opacity-20" />
              <p className="text-lg font-bold">选择一个项目开始测算</p>
              <button onClick={handleAddProject} className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
                新增测算项目
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isImportOpen && (
          <ImportModule 
            onImport={(newProjects) => {
              setProjects([...projects, ...newProjects]);
              setIsImportOpen(false);
            }} 
            onClose={() => setIsImportOpen(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};
