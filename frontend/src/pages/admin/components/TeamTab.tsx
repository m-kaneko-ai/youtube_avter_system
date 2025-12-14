import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  UserPlus,
  Mail,
  Shield,
  MoreHorizontal,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useThemeStore } from '../../../stores/themeStore';
import { adminService, type Role, type MemberStatus } from '../../../services/admin';

const ROLE_CONFIG: Record<Role, { label: string; color: string }> = {
  owner: { label: 'オーナー', color: 'text-purple-500 bg-purple-500/10' },
  team: { label: 'チーム', color: 'text-blue-500 bg-blue-500/10' },
  client_premium_plus: { label: 'Premium+', color: 'text-yellow-500 bg-yellow-500/10' },
  client_premium: { label: 'Premium', color: 'text-orange-500 bg-orange-500/10' },
  client_basic: { label: 'Basic', color: 'text-slate-500 bg-slate-500/10' },
};

const STATUS_CONFIG: Record<MemberStatus, { label: string; color: string; icon: React.ReactNode }> = {
  active: { label: 'アクティブ', color: 'text-green-500', icon: <CheckCircle2 size={14} /> },
  pending: { label: '招待中', color: 'text-yellow-500', icon: <Clock size={14} /> },
  inactive: { label: '無効', color: 'text-slate-400', icon: <Clock size={14} /> },
};

export const TeamTab = () => {
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();

  const [showInviteModal, setShowInviteModal] = useState(false);

  // Team members query
  const {
    data: membersData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin', 'team'],
    queryFn: () => adminService.getTeamMembers(),
  });

  const members = membersData?.members ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-blue-500" />
        <span className={cn('ml-3', themeClasses.textSecondary)}>チームメンバーを読み込み中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('p-8 rounded-2xl text-center', isDarkMode ? 'bg-red-900/20' : 'bg-red-50')}>
        <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
        <p className="text-red-500">チームメンバーの読み込みに失敗しました</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={cn('text-xl font-bold', themeClasses.text)}>チーム管理</h2>
          <p className={cn('text-sm mt-1', themeClasses.textSecondary)}>
            {members.length}名のメンバー
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all"
        >
          <UserPlus size={16} />
          メンバーを招待
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'オーナー', count: members.filter((m) => m.role === 'owner').length, color: 'text-purple-500' },
          { label: 'チーム', count: members.filter((m) => m.role === 'team').length, color: 'text-blue-500' },
          { label: 'アクティブ', count: members.filter((m) => m.status === 'active').length, color: 'text-green-500' },
          { label: '招待中', count: members.filter((m) => m.status === 'pending').length, color: 'text-yellow-500' },
        ].map((stat) => (
          <div
            key={stat.label}
            className={cn(
              'p-4 rounded-xl text-center',
              isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'
            )}
          >
            <p className={cn('text-2xl font-bold', stat.color)}>{stat.count}</p>
            <p className={cn('text-xs mt-1', themeClasses.textSecondary)}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Member List */}
      <div
        className={cn(
          'rounded-2xl border overflow-hidden',
          themeClasses.cardBg,
          themeClasses.cardBorder
        )}
      >
        <table className="w-full">
          <thead>
            <tr className={isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'}>
              <th className={cn('px-6 py-4 text-left text-xs font-medium uppercase tracking-wider', themeClasses.textSecondary)}>メンバー</th>
              <th className={cn('px-6 py-4 text-left text-xs font-medium uppercase tracking-wider', themeClasses.textSecondary)}>ロール</th>
              <th className={cn('px-6 py-4 text-left text-xs font-medium uppercase tracking-wider', themeClasses.textSecondary)}>ステータス</th>
              <th className={cn('px-6 py-4 text-left text-xs font-medium uppercase tracking-wider', themeClasses.textSecondary)}>最終アクティブ</th>
              <th className={cn('px-6 py-4 text-right text-xs font-medium uppercase tracking-wider', themeClasses.textSecondary)}>操作</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: isDarkMode ? '#1e293b' : '#e2e8f0' }}>
            {members.map((member) => (
              <tr key={member.id} className={cn('transition-colors', isDarkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50')}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-10 h-10 rounded-full flex items-center justify-center font-bold', isDarkMode ? 'bg-slate-700' : 'bg-slate-200')}>
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <p className={cn('font-medium', themeClasses.text)}>{member.name}</p>
                      <p className={cn('text-sm', themeClasses.textSecondary)}>{member.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium', ROLE_CONFIG[member.role].color)}>
                    <Shield size={12} />
                    {ROLE_CONFIG[member.role].label}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={cn('inline-flex items-center gap-1 text-sm', STATUS_CONFIG[member.status].color)}>
                    {STATUS_CONFIG[member.status].icon}
                    {STATUS_CONFIG[member.status].label}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={cn('text-sm', themeClasses.textSecondary)}>{member.lastActive}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button className={cn('p-2 rounded-lg transition-colors', isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100')}>
                      <Edit size={16} className={themeClasses.textSecondary} />
                    </button>
                    {member.role !== 'owner' && (
                      <button className={cn('p-2 rounded-lg transition-colors', isDarkMode ? 'hover:bg-red-900/30 text-slate-400 hover:text-red-400' : 'hover:bg-red-50 text-slate-500 hover:text-red-500')}>
                        <Trash2 size={16} />
                      </button>
                    )}
                    <button className={cn('p-2 rounded-lg transition-colors', isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100')}>
                      <MoreHorizontal size={16} className={themeClasses.textSecondary} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite Modal Placeholder */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowInviteModal(false)}>
          <div
            className={cn('w-full max-w-md p-6 rounded-2xl', themeClasses.cardBg)}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={cn('font-bold text-lg mb-4', themeClasses.text)}>メンバーを招待</h3>
            <div className="space-y-4">
              <div>
                <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>メールアドレス</label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  className={cn('w-full px-4 py-2 rounded-xl border', themeClasses.cardBorder, isDarkMode ? 'bg-slate-800' : 'bg-white', themeClasses.text)}
                />
              </div>
              <div>
                <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>ロール</label>
                <select className={cn('w-full px-4 py-2 rounded-xl border', themeClasses.cardBorder, isDarkMode ? 'bg-slate-800' : 'bg-white', themeClasses.text)}>
                  <option value="team">チーム</option>
                  <option value="client_premium_plus">Client Premium+</option>
                  <option value="client_premium">Client Premium</option>
                  <option value="client_basic">Client Basic</option>
                </select>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className={cn('flex-1 px-4 py-2 rounded-xl text-sm font-medium', isDarkMode ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700')}
                >
                  キャンセル
                </button>
                <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold">
                  <Mail size={16} className="inline mr-2" />
                  招待を送信
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
