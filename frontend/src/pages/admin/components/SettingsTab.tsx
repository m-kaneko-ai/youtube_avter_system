import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings as SettingsIcon,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useThemeStore } from '../../../stores/themeStore';
import { adminService } from '../../../services/admin';
import { toast } from '../../../components/common';

interface SystemSetting {
  id: string;
  key: string;
  value?: string;
  value_type: string;
  description?: string;
  is_public: boolean;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export const SettingsTab = () => {
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();
  const queryClient = useQueryClient();

  const [editingSettings, setEditingSettings] = useState<Record<string, string>>({});
  const [showPrivate, setShowPrivate] = useState(false);

  // Settings query
  const {
    data: settingsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin', 'settings', showPrivate],
    queryFn: () => adminService.getSettings(showPrivate),
  });

  const settings = settingsData?.settings ?? [];

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      adminService.updateSetting(key, value),
    onSuccess: () => {
      toast.success('設定を更新しました');
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      setEditingSettings({});
    },
    onError: (error: Error) => {
      toast.error(`設定の更新に失敗しました: ${error.message}`);
    },
  });

  const handleEditChange = (key: string, value: string) => {
    setEditingSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = (setting: SystemSetting) => {
    const newValue = editingSettings[setting.key] ?? setting.value ?? '';
    updateMutation.mutate({ key: setting.key, value: newValue });
  };

  const handleCancel = (key: string) => {
    setEditingSettings(prev => {
      const { [key]: _, ...rest } = prev;
      return rest;
    });
  };

  const isEditing = (key: string) => key in editingSettings;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-blue-500" />
        <span className={cn('ml-3', themeClasses.textSecondary)}>設定を読み込み中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('p-8 rounded-2xl text-center', isDarkMode ? 'bg-red-900/20' : 'bg-red-50')}>
        <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
        <p className="text-red-500">設定の読み込みに失敗しました</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center',
              isDarkMode ? 'bg-blue-500/20' : 'bg-blue-500/10'
            )}
          >
            <SettingsIcon size={24} className="text-blue-500" />
          </div>
          <div>
            <h1 className={cn('text-2xl font-bold', themeClasses.textPrimary)}>
              システム設定
            </h1>
            <p className={themeClasses.textSecondary}>
              システム全体の設定を管理します
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl transition-all',
              isDarkMode
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200'
            )}
          >
            <RefreshCw size={18} />
            <span>更新</span>
          </button>

          <button
            onClick={() => setShowPrivate(!showPrivate)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl transition-all',
              showPrivate
                ? 'bg-blue-500 text-white'
                : isDarkMode
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200'
            )}
          >
            <span>{showPrivate ? '非公開設定を表示中' : '公開設定のみ'}</span>
          </button>
        </div>
      </div>

      {/* Settings List */}
      <div
        className={cn(
          'rounded-2xl overflow-hidden',
          isDarkMode ? 'bg-slate-800' : 'bg-white border border-slate-200'
        )}
      >
        <table className="w-full">
          <thead className={isDarkMode ? 'bg-slate-900/50' : 'bg-slate-50'}>
            <tr>
              <th
                className={cn(
                  'text-left px-6 py-4 text-sm font-semibold',
                  themeClasses.textSecondary
                )}
              >
                設定キー
              </th>
              <th
                className={cn(
                  'text-left px-6 py-4 text-sm font-semibold',
                  themeClasses.textSecondary
                )}
              >
                説明
              </th>
              <th
                className={cn(
                  'text-left px-6 py-4 text-sm font-semibold',
                  themeClasses.textSecondary
                )}
              >
                値
              </th>
              <th
                className={cn(
                  'text-left px-6 py-4 text-sm font-semibold',
                  themeClasses.textSecondary
                )}
              >
                型
              </th>
              <th
                className={cn(
                  'text-right px-6 py-4 text-sm font-semibold',
                  themeClasses.textSecondary
                )}
              >
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {settings.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className={cn('text-center py-12', themeClasses.textSecondary)}
                >
                  設定がありません
                </td>
              </tr>
            ) : (
              settings.map((setting) => (
                <tr
                  key={setting.id}
                  className={cn(
                    'border-t transition-colors',
                    isDarkMode
                      ? 'border-slate-700 hover:bg-slate-700/30'
                      : 'border-slate-100 hover:bg-slate-50'
                  )}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <code
                        className={cn(
                          'text-sm font-mono px-2 py-1 rounded',
                          isDarkMode ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-700'
                        )}
                      >
                        {setting.key}
                      </code>
                      {!setting.is_public && (
                        <span
                          className={cn(
                            'text-xs px-2 py-0.5 rounded-full',
                            isDarkMode
                              ? 'bg-yellow-500/20 text-yellow-300'
                              : 'bg-yellow-100 text-yellow-700'
                          )}
                        >
                          非公開
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={cn('px-6 py-4 text-sm', themeClasses.textSecondary)}>
                    {setting.description || '-'}
                  </td>
                  <td className="px-6 py-4">
                    {isEditing(setting.key) ? (
                      <input
                        type="text"
                        value={editingSettings[setting.key] ?? setting.value ?? ''}
                        onChange={(e) => handleEditChange(setting.key, e.target.value)}
                        className={cn(
                          'w-full px-3 py-1.5 text-sm rounded-lg border focus:outline-none focus:ring-2',
                          isDarkMode
                            ? 'bg-slate-700 border-slate-600 text-slate-200 focus:ring-blue-500/50'
                            : 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500'
                        )}
                      />
                    ) : (
                      <code
                        className={cn(
                          'text-sm font-mono',
                          themeClasses.textPrimary
                        )}
                      >
                        {setting.value || '(未設定)'}
                      </code>
                    )}
                  </td>
                  <td className={cn('px-6 py-4 text-sm', themeClasses.textSecondary)}>
                    {setting.value_type}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {isEditing(setting.key) ? (
                        <>
                          <button
                            onClick={() => handleSave(setting)}
                            disabled={updateMutation.isPending}
                            className={cn(
                              'p-2 rounded-lg transition-colors',
                              'bg-blue-500 hover:bg-blue-600 text-white',
                              updateMutation.isPending && 'opacity-50 cursor-not-allowed'
                            )}
                          >
                            {updateMutation.isPending ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <CheckCircle2 size={16} />
                            )}
                          </button>
                          <button
                            onClick={() => handleCancel(setting.key)}
                            disabled={updateMutation.isPending}
                            className={cn(
                              'p-2 rounded-lg transition-colors',
                              isDarkMode
                                ? 'hover:bg-slate-700 text-slate-400'
                                : 'hover:bg-slate-100 text-slate-600'
                            )}
                          >
                            ×
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleEditChange(setting.key, setting.value ?? '')}
                          className={cn(
                            'p-2 rounded-lg transition-colors',
                            isDarkMode
                              ? 'hover:bg-slate-700 text-slate-400'
                              : 'hover:bg-slate-100 text-slate-600'
                          )}
                        >
                          <Save size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
