import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { 
  Plus, 
  Trash2, 
  Save, 
  RefreshCw, 
  Search,
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PriceLibraryEntry } from '../types';

interface PriceLibraryManagementProps {
  priceLibrary: PriceLibraryEntry[];
  onUpdateLibrary: (newLibrary: PriceLibraryEntry[]) => void;
}

export const PriceLibraryManagement = ({ priceLibrary, onUpdateLibrary }: PriceLibraryManagementProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredLibrary = priceLibrary.filter(entry => 
    entry.categoryLevel1.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.categoryLevel2.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.level.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpdatePrice = (id: string, newPrice: number) => {
    const newLibrary = priceLibrary.map(entry => 
      entry.id === id ? { ...entry, price: newPrice, updatedAt: new Date().toISOString() } : entry
    );
    onUpdateLibrary(newLibrary);
  };

  const handleAddEntry = () => {
    const newEntry: PriceLibraryEntry = {
      id: Math.random().toString(36).substr(2, 9),
      categoryLevel1: '新分类',
      categoryLevel2: '新二级分类',
      level: '新档位',
      pricingType: '插画+动效',
      price: 0,
      updatedAt: new Date().toISOString(),
    };
    onUpdateLibrary([...priceLibrary, newEntry]);
  };

  const handleDeleteEntry = (id: string) => {
    onUpdateLibrary(priceLibrary.filter(entry => entry.id !== id));
  };

  const handleSave = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const newEntries: PriceLibraryEntry[] = results.data.map((row: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          categoryLevel1: row['一级分类'] || row['categoryLevel1'] || '未命名',
          categoryLevel2: row['二级分类'] || row['categoryLevel2'] || '未命名',
          level: row['档位'] || row['level'] || '未命名',
          pricingType: row['报价类型'] || row['pricingType'] || '插画+动效',
          price: parseFloat(row['标准单价'] || row['price']) || 0,
          updatedAt: new Date().toISOString(),
        }));

        if (newEntries.length > 0) {
          // Merge or overwrite? Let's append for now as it's safer, or user can delete old ones.
          // Actually, usually users want to replace or add. Let's append.
          onUpdateLibrary([...priceLibrary, ...newEntries]);
          handleSave();
        }
        
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
      error: (error) => {
        console.error('CSV Parsing Error:', error);
        alert('CSV 解析失败，请检查格式');
      }
    });
  };

  const downloadTemplate = () => {
    const header = "一级分类,二级分类,档位,报价类型,标准单价\n";
    const example = "礼物,中档,5-6秒,插画+动效,946\n礼物,高档,8-10秒,插画+动效,1500";
    const blob = new Blob([header + example], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "price_library_template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[#F8FAFC]">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">价格库管理</h2>
            <p className="text-xs text-slate-500 mt-1">全局标准定价源，修改后将同步更新未锁定的项目价格。</p>
          </div>
          <div className="flex items-center gap-3">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".csv" 
              onChange={handleCsvImport} 
            />
            <button 
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              <Download size={16} />
              下载模板
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              <Upload size={16} />
              导入 CSV
            </button>
            <button 
              onClick={handleAddEntry}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              <Plus size={16} />
              新增标准价
            </button>
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
            >
              <Save size={16} />
              保存并发布
            </button>
          </div>
        </div>

        {/* Success Message */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 text-emerald-700"
            >
              <CheckCircle2 size={20} />
              <div>
                <p className="text-sm font-bold">标准价格已更新</p>
                <p className="text-xs opacity-80">未锁定（未手动修改）的项目将自动同步最新价格。</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search & Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-3 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="搜索分类、档位..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all shadow-sm"
            />
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">总条目</span>
            <span className="text-xl font-black text-slate-800">{priceLibrary.length}</span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">一级分类</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">二级分类</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">档位</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">报价类型</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">标准单价 (¥)</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">最后更新</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLibrary.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <input 
                      type="text" 
                      value={entry.categoryLevel1} 
                      onChange={(e) => onUpdateLibrary(priceLibrary.map(en => en.id === entry.id ? { ...en, categoryLevel1: e.target.value } : en))}
                      className="bg-transparent text-xs font-bold text-slate-700 outline-none focus:text-indigo-600"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input 
                      type="text" 
                      value={entry.categoryLevel2} 
                      onChange={(e) => onUpdateLibrary(priceLibrary.map(en => en.id === entry.id ? { ...en, categoryLevel2: e.target.value } : en))}
                      className="bg-transparent text-xs font-bold text-slate-700 outline-none focus:text-indigo-600"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input 
                      type="text" 
                      value={entry.level} 
                      onChange={(e) => onUpdateLibrary(priceLibrary.map(en => en.id === entry.id ? { ...en, level: e.target.value } : en))}
                      className="bg-transparent text-xs font-bold text-slate-700 outline-none focus:text-indigo-600"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      value={entry.pricingType}
                      onChange={(e) => onUpdateLibrary(priceLibrary.map(en => en.id === entry.id ? { ...en, pricingType: e.target.value } : en))}
                      className="bg-transparent text-xs font-bold text-slate-700 outline-none focus:text-indigo-600 appearance-none"
                    >
                      <option value="插画+动效">插画+动效</option>
                      <option value="仅动效">仅动效</option>
                      <option value="仅插画">仅插画</option>
                      <option value="三维设计">三维设计</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-300">¥</span>
                      <input 
                        type="number" 
                        value={entry.price} 
                        onChange={(e) => handleUpdatePrice(entry.id, parseFloat(e.target.value) || 0)}
                        className="w-24 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-xs font-black text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500/10"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Clock size={12} />
                      <span className="text-[10px] font-medium">{new Date(entry.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLibrary.length === 0 && (
            <div className="py-20 text-center text-slate-300">
              <AlertCircle size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-sm font-bold">未找到相关定价条目</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
