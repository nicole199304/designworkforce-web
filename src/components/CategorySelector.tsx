import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CATEGORY_HIERARCHY, CategoryNode } from '../constants/categories';

interface CategorySelectorProps {
  categoryLevel1: string;
  categoryLevel2: string;
  level: string;
  onChange: (updates: { categoryLevel1: string; categoryLevel2: string; level: string }) => void;
}

export const CategorySelector = ({ categoryLevel1, categoryLevel2, level, onChange }: CategorySelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempSelection, setTempSelection] = useState({ l1: categoryLevel1, l2: categoryLevel2, l3: level });
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleConfirm = () => {
    onChange({
      categoryLevel1: tempSelection.l1,
      categoryLevel2: tempSelection.l2,
      level: tempSelection.l3
    });
    setIsOpen(false);
  };

  const l1Nodes = CATEGORY_HIERARCHY;
  const l2Nodes = l1Nodes.find(n => n.label === tempSelection.l1)?.children || [];
  const l3Nodes = l2Nodes.find(n => n.label === tempSelection.l2)?.children || [];

  const displayValue = [categoryLevel1, categoryLevel2, level].filter(Boolean).join('/');

  return (
    <div className="relative" ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm cursor-pointer hover:border-indigo-300 transition-all flex items-center justify-between"
      >
        <span className={displayValue ? 'text-slate-700 font-medium' : 'text-slate-400'}>
          {displayValue || '请选择分类'}
        </span>
        <ChevronRight size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 mt-2 w-[600px] bg-white rounded-2xl shadow-2xl border border-slate-100 z-[100] overflow-hidden flex flex-col"
          >
            {/* Search Bar */}
            <div className="p-4 border-b border-slate-50 relative">
              <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <input 
                type="text" 
                placeholder="请输入要搜索的内容"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/10"
              />
            </div>

            {/* Cascader Content */}
            <div className="flex h-64">
              {/* Level 1 */}
              <div className="w-1/3 border-r border-slate-50 overflow-y-auto custom-scrollbar py-2">
                {l1Nodes.map(node => (
                  <div 
                    key={node.label}
                    onClick={() => setTempSelection({ l1: node.label, l2: '', l3: '' })}
                    className={`px-4 py-2 text-xs cursor-pointer flex items-center justify-between transition-colors ${
                      tempSelection.l1 === node.label ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{node.label}</span>
                    {node.children && <ChevronRight size={12} className="opacity-40" />}
                  </div>
                ))}
                <div className="px-4 py-2 mt-2 border-t border-slate-50 flex items-center gap-2 text-xs text-slate-400">
                  <input type="checkbox" className="rounded border-slate-300" />
                  <span>父需求</span>
                </div>
              </div>

              {/* Level 2 */}
              <div className="w-1/3 border-r border-slate-50 overflow-y-auto custom-scrollbar py-2 bg-slate-50/30">
                {l2Nodes.map(node => (
                  <div 
                    key={node.label}
                    onClick={() => setTempSelection(prev => ({ ...prev, l2: node.label, l3: '' }))}
                    className={`px-4 py-2 text-xs cursor-pointer flex items-center justify-between transition-colors ${
                      tempSelection.l2 === node.label ? 'bg-white text-indigo-600 font-bold shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{node.label}</span>
                    {node.children && <ChevronRight size={12} className="opacity-40" />}
                  </div>
                ))}
              </div>

              {/* Level 3 */}
              <div className="w-1/3 overflow-y-auto custom-scrollbar py-2">
                {l3Nodes.map(node => (
                  <div 
                    key={node.label}
                    onClick={() => setTempSelection(prev => ({ ...prev, l3: node.label }))}
                    className={`px-4 py-2 text-xs cursor-pointer flex items-center gap-2 transition-colors ${
                      tempSelection.l3 === node.label ? 'text-indigo-600 font-bold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                      tempSelection.l3 === node.label ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'
                    }`}>
                      {tempSelection.l3 === node.label && <Check size={10} className="text-white" />}
                    </div>
                    <span>{node.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-50 flex justify-end gap-3 bg-slate-50/50">
              <button 
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-all"
              >
                取消
              </button>
              <button 
                onClick={handleConfirm}
                className="px-6 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
              >
                确定
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
