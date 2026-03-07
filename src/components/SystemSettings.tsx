import React from 'react';
import { Save, Bell, Lock, Globe, Database, Palette } from 'lucide-react';

export const SystemSettings = () => {
  return (
    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-slate-800">系统设置</h2>
        <p className="text-xs text-slate-500">配置测算逻辑、权限与个性化选项</p>
      </div>

      <div className="max-w-3xl space-y-8">
        {/* Section: Calculation Logic */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Database size={20} />
            </div>
            <h3 className="text-sm font-bold text-slate-800">测算逻辑配置</h3>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">修改轮次消耗系数</label>
                <input type="number" defaultValue={0.1} step={0.01} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">基准产值权重</label>
                <input type="number" defaultValue={0.6} step={0.1} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">A类判定阈值 (综合评分)</label>
              <input type="range" min="0" max="1" step="0.01" defaultValue={0.95} className="w-full accent-indigo-600" />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-bold">
                <span>0.0</span>
                <span>0.95</span>
                <span>1.0</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Notifications */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Bell size={20} />
            </div>
            <h3 className="text-sm font-bold text-slate-800">通知与预警</h3>
          </div>
          
          <div className="space-y-4">
            {[
              { label: '项目风险预警', desc: '当综合评分低于 0.6 时发送通知', active: true },
              { label: '人力借调申请', desc: '当有新的借调需求时通知部门负责人', active: true },
              { label: '周报自动生成', desc: '每周五下午 6:00 自动生成效能周报', active: false },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-bold text-slate-700">{item.label}</p>
                  <p className="text-xs text-slate-400">{item.desc}</p>
                </div>
                <div className={`w-10 h-5 rounded-full p-1 cursor-pointer transition-colors ${item.active ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                  <div className={`w-3 h-3 bg-white rounded-full transition-transform ${item.active ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button className="px-6 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">取消</button>
          <button className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">
            <Save size={16} />
            保存配置
          </button>
        </div>
      </div>
    </div>
  );
};
