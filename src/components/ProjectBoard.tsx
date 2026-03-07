import React from 'react';
import { Clock, MessageSquare, Paperclip, MoreHorizontal } from 'lucide-react';

const columns = [
  { id: 'todo', title: '待处理', count: 3 },
  { id: 'inprogress', title: '进行中', count: 2 },
  { id: 'review', title: '审核中', count: 1 },
  { id: 'done', title: '已完成', count: 5 },
];

const cards = [
  { id: 1, column: 'todo', title: '电商大促主视觉设计', tag: 'S级', priority: 'High', members: ['ZS', 'LS'] },
  { id: 2, column: 'inprogress', title: '社交平台信息流广告', tag: 'A级', priority: 'Medium', members: ['ZL'] },
  { id: 3, column: 'review', title: '金融支付IP形象升级', tag: 'B级', priority: 'High', members: ['WW'] },
];

export const ProjectBoard = () => {
  return (
    <div className="flex-1 flex flex-col overflow-hidden p-8">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-slate-800">项目看板</h2>
        <p className="text-xs text-slate-500">可视化追踪项目进度与人力借调情况</p>
      </div>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
        {columns.map((col) => (
          <div key={col.id} className="w-72 shrink-0 flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-700">{col.title}</h3>
                <span className="px-2 py-0.5 bg-slate-200 text-slate-500 rounded text-[10px] font-bold">{col.count}</span>
              </div>
              <button className="text-slate-400 hover:text-slate-600">
                <MoreHorizontal size={16} />
              </button>
            </div>

            <div className="flex-1 flex flex-col gap-3 bg-slate-100/50 p-2 rounded-2xl border border-slate-200/50">
              {cards.filter(c => c.column === col.id).map((card) => (
                <div key={card.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      card.tag === 'S级' ? 'bg-rose-100 text-rose-700' :
                      card.tag === 'A级' ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {card.tag}
                    </span>
                    <span className={`text-[10px] font-bold ${card.priority === 'High' ? 'text-rose-500' : 'text-amber-500'}`}>
                      {card.priority}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 mb-4">{card.title}</h4>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {card.members.map((m, i) => (
                        <div key={i} className="w-6 h-6 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-indigo-600">
                          {m}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 text-slate-400">
                      <div className="flex items-center gap-1 text-[10px]">
                        <MessageSquare size={12} />
                        <span>2</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px]">
                        <Paperclip size={12} />
                        <span>1</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button className="w-full py-2 border-2 border-dashed border-slate-200 rounded-xl text-xs font-medium text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-all">
                + 添加任务
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
