import React, { useState } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Download,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProjectData } from '../types';

interface ImportModuleProps {
  onImport: (data: ProjectData[]) => void;
  onClose: () => void;
}

export const ImportModule = ({ onImport, onClose }: ImportModuleProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [results, setResults] = useState<{ success: number; errors: string[] }>({ success: 0, errors: [] });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setStatus('idle');
    }
  };

  const processFile = () => {
    if (!file) return;
    setStatus('processing');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const rows = text.split('\n').slice(1); // Skip header
        const newProjects: ProjectData[] = [];
        const errors: string[] = [];

        rows.forEach((row, index) => {
          if (!row.trim()) return;
          const cols = row.split(',');
          
          // Basic Template Validation
          if (cols.length < 5) {
            errors.push(`第 ${index + 2} 行：字段缺失`);
            return;
          }

          const project: ProjectData = {
            id: Math.random().toString(36).substr(2, 9),
            date: cols[0]?.trim() || new Date().toISOString().split('T')[0],
            businessType: cols[1]?.trim() || '其他',
            businessName: cols[2]?.trim() || '未命名项目',
            categoryLevel1: cols[3]?.trim() || '分类1',
            categoryLevel2: cols[4]?.trim() || '分类2',
            level: cols[5]?.trim() || '档位',
            pricingType: cols[6]?.trim() || '插画+动效',
            basePrice: parseFloat(cols[7]) || 0,
            actualPrice: parseFloat(cols[7]) || 0,
            isPriceModified: false,
            baseOutput: parseFloat(cols[7]) || 0,
            avgProductionCycle: parseFloat(cols[8]) || 0,
            slicingTime: parseFloat(cols[9]) || 0,
            revisionRounds: parseFloat(cols[10]) || 0,
            strategicValue: parseInt(cols[11]) || 3,
            confidenceScore: parseInt(cols[12]) || 3,
          };

          newProjects.push(project);
        });

        setResults({ success: newProjects.length, errors });
        if (newProjects.length > 0) {
          onImport(newProjects);
          setStatus('success');
        } else {
          setStatus('error');
        }
      } catch (err) {
        setStatus('error');
        setResults({ success: 0, errors: ['文件解析失败，请检查格式'] });
      }
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const header = "日期,业务线,业务名称,一级分类,二级分类,档位,报价类型,价格,平均制作周期,切图耗时,修改轮次,战略价值,置信度\n";
    const example = "2024-02-15,电商,大促活动,礼物,中档,5-6秒,插画+动效,946,1.5,0.5,1,2,4";
    const blob = new Blob([header + example], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'import_template.csv';
    a.click();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Upload size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">批量导入数据</h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          {status === 'idle' && (
            <div className="space-y-6">
              <div 
                className="border-2 border-dashed border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer group"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-indigo-500 transition-all">
                  <FileText size={32} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-700">{file ? file.name : '点击或拖拽文件上传'}</p>
                  <p className="text-xs text-slate-400 mt-1">支持 CSV, Excel (推荐使用 CSV 模板)</p>
                </div>
                <input id="file-upload" type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
              </div>

              <div className="flex items-center justify-between">
                <button 
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                >
                  <Download size={14} />
                  下载导入模板
                </button>
                <button 
                  disabled={!file}
                  onClick={processFile}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200 transition-all"
                >
                  开始导入
                </button>
              </div>
            </div>
          )}

          {status === 'processing' && (
            <div className="py-12 flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-sm font-bold text-slate-600">正在解析文件并匹配价格库...</p>
            </div>
          )}

          {(status === 'success' || status === 'error') && (
            <div className="space-y-6">
              <div className={`p-6 rounded-2xl flex items-start gap-4 ${status === 'success' ? 'bg-emerald-50 border border-emerald-100' : 'bg-rose-50 border border-rose-100'}`}>
                {status === 'success' ? (
                  <CheckCircle2 className="text-emerald-500 shrink-0" size={24} />
                ) : (
                  <XCircle className="text-rose-500 shrink-0" size={24} />
                )}
                <div>
                  <h4 className={`text-sm font-bold ${status === 'success' ? 'text-emerald-800' : 'text-rose-800'}`}>
                    {status === 'success' ? '导入完成' : '导入失败'}
                  </h4>
                  <p className={`text-xs mt-1 ${status === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    成功导入 {results.success} 条记录，发现 {results.errors.length} 个错误。
                  </p>
                </div>
              </div>

              {results.errors.length > 0 && (
                <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-2">
                  {results.errors.map((err, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10px] font-medium text-rose-500 bg-rose-50/50 p-2 rounded-lg">
                      <AlertCircle size={12} />
                      {err}
                    </div>
                  ))}
                </div>
              )}

              <button 
                onClick={onClose}
                className="w-full py-3 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-900 transition-all"
              >
                返回列表
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
