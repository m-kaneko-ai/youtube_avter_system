import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Building,
  CreditCard,
  Eye,
  Settings,
  TrendingUp,
  Video,
  FileText,
  Plus,
  Loader2,
  AlertCircle,
  ExternalLink,
  Edit3,
  Trash2,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useThemeStore } from '../../../stores/themeStore';
import { adminService, type ClientPlan, type ClientStatus } from '../../../services/admin';
import { Modal, DropdownMenu, toast } from '../../../components/common';

const PLAN_CONFIG: Record<ClientPlan, { label: string; color: string }> = {
  premium_plus: { label: 'Premium+', color: 'text-yellow-500 bg-yellow-500/10' },
  premium: { label: 'Premium', color: 'text-orange-500 bg-orange-500/10' },
  basic: { label: 'Basic', color: 'text-slate-500 bg-slate-500/10' },
};

const STATUS_CONFIG: Record<ClientStatus, { label: string; color: string }> = {
  active: { label: 'アクティブ', color: 'text-green-500' },
  inactive: { label: '非アクティブ', color: 'text-slate-400' },
  trial: { label: 'トライアル', color: 'text-blue-500' },
};

export const ClientTab = () => {
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<typeof clients[0] | null>(null);

  // Clients query
  const {
    data: clientsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin', 'clients'],
    queryFn: () => adminService.getClientList(),
  });

  const clients = clientsData?.clients ?? [];
  const totalVideos = clients.reduce((sum, c) => sum + c.videoCount, 0);
  const totalKnowledges = clients.reduce((sum, c) => sum + c.knowledgeCount, 0);

  const handlePortalView = (client: typeof clients[0]) => {
    window.open(`/client-portal/${client.id}`, '_blank');
  };

  const handleGenerateReport = (_client: typeof clients[0]) => {
    toast.info('レポートを生成中');
  };

  const handleSettings = (client: typeof clients[0]) => {
    setSelectedClient(client);
    setShowSettingsModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-blue-500" />
        <span className={cn('ml-3', themeClasses.textSecondary)}>クライアント情報を読み込み中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('p-8 rounded-2xl text-center', isDarkMode ? 'bg-red-900/20' : 'bg-red-50')}>
        <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
        <p className="text-red-500">クライアント情報の読み込みに失敗しました</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={cn('text-xl font-bold', themeClasses.text)}>クライアントポータル</h2>
          <p className={cn('text-sm mt-1', themeClasses.textSecondary)}>
            {clients.length}社のクライアント
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all"
        >
          <Plus size={16} />
          クライアントを追加
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '総クライアント', value: clients.length, icon: <Building size={20} />, color: 'text-blue-500' },
          { label: 'アクティブ', value: clients.filter((c) => c.status === 'active').length, icon: <Users size={20} />, color: 'text-green-500' },
          { label: '総動画数', value: totalVideos, icon: <Video size={20} />, color: 'text-pink-500' },
          { label: '総ナレッジ', value: totalKnowledges, icon: <FileText size={20} />, color: 'text-purple-500' },
        ].map((stat) => (
          <div
            key={stat.label}
            className={cn(
              'p-5 rounded-2xl border',
              themeClasses.cardBg,
              themeClasses.cardBorder
            )}
          >
            <div className={cn('mb-3', stat.color)}>{stat.icon}</div>
            <p className={cn('text-2xl font-bold', themeClasses.text)}>{stat.value}</p>
            <p className={cn('text-xs mt-1', themeClasses.textSecondary)}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Client List */}
      <div className="space-y-4">
        {clients.map((client) => (
          <div
            key={client.id}
            className={cn(
              'p-5 rounded-2xl border transition-all hover:shadow-md',
              themeClasses.cardBg,
              themeClasses.cardBorder
            )}
          >
            <div className="flex items-start gap-4">
              {/* Company Icon */}
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg', isDarkMode ? 'bg-slate-700' : 'bg-slate-200')}>
                {client.companyName.charAt(0)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className={cn('font-bold', themeClasses.text)}>{client.companyName}</h4>
                  <span className={cn('px-2 py-0.5 rounded text-xs font-medium', PLAN_CONFIG[client.plan].color)}>
                    <CreditCard size={12} className="inline mr-1" />
                    {PLAN_CONFIG[client.plan].label}
                  </span>
                  <span className={cn('text-sm', STATUS_CONFIG[client.status].color)}>
                    {STATUS_CONFIG[client.status].label}
                  </span>
                </div>
                <p className={cn('text-sm', themeClasses.textSecondary)}>
                  {client.contactName} • {client.email}
                </p>
                <div className={cn('flex items-center gap-6 mt-3 text-sm', themeClasses.textSecondary)}>
                  <span className="flex items-center gap-1">
                    <FileText size={14} />
                    {client.knowledgeCount} ナレッジ
                  </span>
                  <span className="flex items-center gap-1">
                    <Video size={14} />
                    {client.videoCount} 動画
                  </span>
                  <span>登録日: {client.joinedAt}</span>
                  <span>最終アクティブ: {client.lastActive}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePortalView(client)}
                  className={cn('flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium transition-colors', isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700')}
                >
                  <Eye size={16} />
                  ポータル確認
                </button>
                <button
                  onClick={() => handleGenerateReport(client)}
                  className={cn('flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium transition-colors', isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700')}
                >
                  <TrendingUp size={16} />
                  レポート
                </button>
                <button
                  onClick={() => handleSettings(client)}
                  className={cn('p-2 rounded-lg transition-colors', isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100')}
                >
                  <Settings size={16} className={themeClasses.textSecondary} />
                </button>
                <DropdownMenu
                  items={[
                    {
                      id: 'portal',
                      label: 'ポータル確認',
                      icon: <ExternalLink size={16} />,
                      onClick: () => handlePortalView(client),
                    },
                    {
                      id: 'report',
                      label: 'レポート生成',
                      icon: <TrendingUp size={16} />,
                      onClick: () => handleGenerateReport(client),
                    },
                    {
                      id: 'settings',
                      label: '設定',
                      icon: <Settings size={16} />,
                      onClick: () => handleSettings(client),
                    },
                    {
                      id: 'edit',
                      label: '編集',
                      icon: <Edit3 size={16} />,
                      onClick: () => {
                        setSelectedClient(client);
                        setShowAddModal(true);
                      },
                    },
                    {
                      id: 'delete',
                      label: '削除',
                      icon: <Trash2 size={16} />,
                      onClick: () => {
                        if (confirm(`${client.companyName}を削除してもよろしいですか?`)) {
                          toast.success('クライアントを削除しました');
                        }
                      },
                      variant: 'danger',
                    },
                  ]}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Client Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedClient(null);
        }}
        title={selectedClient ? 'クライアント情報を編集' : 'クライアントを追加'}
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowAddModal(false);
                setSelectedClient(null);
              }}
              className={cn('flex-1 px-4 py-2 rounded-xl text-sm font-medium', isDarkMode ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700')}
            >
              キャンセル
            </button>
            <button
              onClick={() => {
                toast.success(selectedClient ? 'クライアント情報を更新しました' : 'クライアントを追加しました');
                setShowAddModal(false);
                setSelectedClient(null);
              }}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold"
            >
              {selectedClient ? '保存' : '追加'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>会社名</label>
            <input
              type="text"
              defaultValue={selectedClient?.companyName}
              placeholder="会社名を入力"
              className={cn('w-full px-4 py-2 rounded-xl border', themeClasses.cardBorder, isDarkMode ? 'bg-slate-800' : 'bg-white', themeClasses.text)}
            />
          </div>
          <div>
            <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>担当者名</label>
            <input
              type="text"
              defaultValue={selectedClient?.contactName}
              placeholder="担当者名を入力"
              className={cn('w-full px-4 py-2 rounded-xl border', themeClasses.cardBorder, isDarkMode ? 'bg-slate-800' : 'bg-white', themeClasses.text)}
            />
          </div>
          <div>
            <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>メールアドレス</label>
            <input
              type="email"
              defaultValue={selectedClient?.email}
              placeholder="email@example.com"
              className={cn('w-full px-4 py-2 rounded-xl border', themeClasses.cardBorder, isDarkMode ? 'bg-slate-800' : 'bg-white', themeClasses.text)}
            />
          </div>
          <div>
            <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>プラン</label>
            <select
              defaultValue={selectedClient?.plan || 'basic'}
              className={cn('w-full px-4 py-2 rounded-xl border', themeClasses.cardBorder, isDarkMode ? 'bg-slate-800' : 'bg-white', themeClasses.text)}
            >
              <option value="premium_plus">Premium+</option>
              <option value="premium">Premium</option>
              <option value="basic">Basic</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Settings Modal */}
      {selectedClient && (
        <Modal
          isOpen={showSettingsModal}
          onClose={() => {
            setShowSettingsModal(false);
            setSelectedClient(null);
          }}
          title={`${selectedClient.companyName}の設定`}
          footer={
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSettingsModal(false);
                  setSelectedClient(null);
                }}
                className={cn('flex-1 px-4 py-2 rounded-xl text-sm font-medium', isDarkMode ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700')}
              >
                キャンセル
              </button>
              <button
                onClick={() => {
                  toast.success('設定を保存しました');
                  setShowSettingsModal(false);
                  setSelectedClient(null);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold"
              >
                保存
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>ステータス</label>
              <select
                defaultValue={selectedClient.status}
                className={cn('w-full px-4 py-2 rounded-xl border', themeClasses.cardBorder, isDarkMode ? 'bg-slate-800' : 'bg-white', themeClasses.text)}
              >
                <option value="active">アクティブ</option>
                <option value="inactive">非アクティブ</option>
                <option value="trial">トライアル</option>
              </select>
            </div>
            <div>
              <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>月間動画制作上限</label>
              <input
                type="number"
                defaultValue={30}
                className={cn('w-full px-4 py-2 rounded-xl border', themeClasses.cardBorder, isDarkMode ? 'bg-slate-800' : 'bg-white', themeClasses.text)}
              />
            </div>
            <div>
              <label className={cn('block text-sm font-medium mb-2', themeClasses.text)}>ナレッジ数上限</label>
              <input
                type="number"
                defaultValue={5}
                className={cn('w-full px-4 py-2 rounded-xl border', themeClasses.cardBorder, isDarkMode ? 'bg-slate-800' : 'bg-white', themeClasses.text)}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className={cn('text-sm font-medium', themeClasses.text)}>自動承認を有効にする</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
