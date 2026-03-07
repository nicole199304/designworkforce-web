import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export const EditableCell = ({ value, onSave }: { value: string, onSave: (val: string) => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  if (isEditing) {
    return (
      <input
        autoFocus
        className="w-full bg-white border border-indigo-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={() => {
          setIsEditing(false);
          onSave(tempValue);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            setIsEditing(false);
            onSave(tempValue);
          }
        }}
      />
    );
  }

  return (
    <div 
      onClick={() => setIsEditing(true)}
      className="text-xs text-slate-600 cursor-pointer hover:text-indigo-600 transition-colors min-h-[1.5rem] flex items-center"
    >
      {value || <span className="text-slate-300 italic">点击输入</span>}
    </div>
  );
};

export const EditableNumber = ({ value, onSave, step = 1, min, max }: { value: number, onSave: (val: number) => void, step?: number, min?: number, max?: number }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value.toString());

  if (isEditing) {
    return (
      <input
        type="number"
        step={step}
        autoFocus
        className="w-20 bg-white border border-indigo-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={() => {
          setIsEditing(false);
          const num = parseFloat(tempValue);
          if (!isNaN(num)) onSave(num);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            setIsEditing(false);
            const num = parseFloat(tempValue);
            if (!isNaN(num)) onSave(num);
          }
        }}
      />
    );
  }

  return (
    <div 
      onClick={() => setIsEditing(true)}
      className="text-xs font-mono text-slate-600 cursor-pointer hover:text-indigo-600 transition-colors"
    >
      {value.toLocaleString()}
    </div>
  );
};

export const EditableSelect = ({ value, options, onSave }: { value: string, options: string[], onSave: (val: string) => void }) => {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <select
        autoFocus
        className="w-full bg-white border border-indigo-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        value={value}
        onChange={(e) => {
          onSave(e.target.value);
          setIsEditing(false);
        }}
        onBlur={() => setIsEditing(false)}
      >
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    );
  }

  return (
    <div 
      onClick={() => setIsEditing(true)}
      className="flex items-center justify-between gap-2 text-xs text-slate-600 cursor-pointer hover:text-indigo-600 transition-colors group/select"
    >
      <span>{value}</span>
      <ChevronDown size={12} className="text-slate-300 group-hover/select:text-indigo-400" />
    </div>
  );
};
