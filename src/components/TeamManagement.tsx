import React, { useState } from 'react';
import { Mail, Phone, MoreVertical, ShieldCheck, UserPlus, Trash2, Save, X } from 'lucide-react';

interface Member {
  id: number | string;
  name: string;
  role: string;
  dept: string;
  status: string;
  avatar: string;
  email: string;
}

const INITIAL_MEMBERS: Member[] = [
  { id: 1, name: '张三', role: '高级插画师', dept: '营销活动组', status: '忙碌', avatar: 'ZS', email: 'zhangsan@company.com' },
  { id: 2, name: '李四', role: '动效设计师', dept: '产品研发组', status: '空闲', avatar: 'LS', email: 'lisi@company.com' },
  { id: 3, name: '王五', role: '三维设计师', dept: '品牌建设组', status: '休假', avatar: 'WW', email: 'wangwu@company.com' },
  { id: 4, name: '赵六', role: '视觉设计师', dept: '日常运营组', status: '空闲', avatar: 'ZL', email: 'zhaoliu@company.com' },
];

export const TeamManagement = () => {
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [editForm, setEditForm] = useState<Member | null>(null);

  const handleAddMember = () => {
    const newMember: Member = {
      id: Math.random().toString(36).substr(2, 9),
      name: '新成员',
      role: '设计师',
      dept: '设计部',
      status: '空闲',
      avatar: '新',
      email: 'new_member@company.com'
    };
    setMembers([...members, newMember]);
    startEditing(newMember);
  };

  const startEditing = (member: Member) => {
    setEditingId(member.id);
    setEditForm({ ...member });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const saveEditing = () => {
    if (!editForm) return;
    setMembers(members.map(m => m.id === editingId ? editForm : m));
    setEditingId(null);
    setEditForm(null);
  };

  const handleDeleteMember = (id: number | string) => {
    setMembers(members.filter(m => m.id !== id));
  };

  const updateEditForm = (updates: Partial<Member>) => {
    if (!editForm) return;
    setEditForm({ ...editForm, ...updates });
    if (updates.name) {
      setEditForm(prev => prev ? { ...prev, avatar: updates.name?.charAt(0).toUpperCase() || '?' } : null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#F8FAFC]">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">团队成员管理</h2>
            <p className="text-xs text-slate-500 mt-1">查看成员实时状态与技能分布，支持手动添加与编辑。</p>
          </div>
          <button 
            onClick={handleAddMember}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95"
          >
            <UserPlus size={18} />
            新增成员
          </button>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">成员信息</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">职位</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">所属部门</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">当前状态</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {members.map((member) => (
                <tr key={member.id} className={`hover:bg-slate-50/50 transition-colors group ${editingId === member.id ? 'bg-indigo-50/30' : ''}`}>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-sm shadow-sm">
                        {editingId === member.id ? editForm?.avatar : member.avatar}
                      </div>
                      <div className="flex-1">
                        {editingId === member.id ? (
                          <div className="space-y-1">
                            <input 
                              type="text" 
                              value={editForm?.name} 
                              onChange={(e) => updateEditForm({ name: e.target.value })}
                              className="w-full px-2 py-1 bg-white border border-indigo-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/10"
                            />
                            <input 
                              type="email" 
                              value={editForm?.email} 
                              onChange={(e) => updateEditForm({ email: e.target.value })}
                              className="w-full px-2 py-1 bg-white border border-indigo-200 rounded-lg text-[10px] outline-none focus:ring-2 focus:ring-indigo-500/10"
                            />
                          </div>
                        ) : (
                          <>
                            <p className="text-sm font-bold text-slate-800">{member.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{member.email}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    {editingId === member.id ? (
                      <input 
                        type="text" 
                        value={editForm?.role} 
                        onChange={(e) => updateEditForm({ role: e.target.value })}
                        className="w-full px-2 py-1 bg-white border border-indigo-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/10"
                      />
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                        <ShieldCheck size={14} className="text-indigo-500" />
                        {member.role}
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-5">
                    {editingId === member.id ? (
                      <input 
                        type="text" 
                        value={editForm?.dept} 
                        onChange={(e) => updateEditForm({ dept: e.target.value })}
                        className="w-full px-2 py-1 bg-white border border-indigo-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/10"
                      />
                    ) : (
                      <span className="text-xs font-medium text-slate-500">{member.dept}</span>
                    )}
                  </td>
                  <td className="px-8 py-5">
                    {editingId === member.id ? (
                      <select 
                        value={editForm?.status}
                        onChange={(e) => updateEditForm({ status: e.target.value })}
                        className="w-full px-2 py-1 bg-white border border-indigo-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/10"
                      >
                        <option value="空闲">空闲</option>
                        <option value="忙碌">忙碌</option>
                        <option value="休假">休假</option>
                      </select>
                    ) : (
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        member.status === '空闲' ? 'bg-emerald-100 text-emerald-700' :
                        member.status === '忙碌' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {member.status}
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center justify-end gap-2">
                      {editingId === member.id ? (
                        <>
                          <button 
                            onClick={saveEditing}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                            title="保存"
                          >
                            <Save size={18} />
                          </button>
                          <button 
                            onClick={cancelEditing}
                            className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-all"
                            title="取消"
                          >
                            <X size={18} />
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button 
                              onClick={() => startEditing(member)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                              title="编辑"
                            >
                              <MoreVertical size={18} />
                            </button>
                            <button 
                              onClick={() => handleDeleteMember(member.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                              title="删除"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {members.length === 0 && (
            <div className="py-20 text-center text-slate-300">
              <UserPlus size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-sm font-bold">暂无团队成员，请点击右上角新增</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
