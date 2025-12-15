import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bot,
  Plus,
  Play,
  Pause,
  Settings,
  Trash2,
  Power,
  TrendingUp,
  Eye,
  MessageCircle,
  Calendar,
  BarChart2,
  CheckCircle,
  Search,
  Loader2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useThemeStore } from '../../../stores/themeStore';
import { agentService } from '../../../services/agent';
import { Modal, DropdownMenu, toast } from '../../../components/common';
import {
  AGENT_TYPE_CONFIG,
  AGENT_STATUS_CONFIG,
} from '../../../types';
import type {
  Agent,
  AgentType,
  AgentStatus,
  AgentCreateRequest,
  AgentUpdateRequest,
  ThemeClasses,
} from '../../../types';

const AGENT_TYPE_ICONS: Record<AgentType, React.ReactNode> = {
  trend_monitor: <TrendingUp size={20} />,
  competitor_analyzer: <Eye size={20} />,
  comment_responder: <MessageCircle size={20} />,
  content_scheduler: <Calendar size={20} />,
  performance_tracker: <BarChart2 size={20} />,
  qa_checker: <CheckCircle size={20} />,
  keyword_researcher: <Search size={20} />,
};

interface AgentFormData {
  name: string;
  description: string;
  agentType: AgentType;
  isEnabled: boolean;
  autoExecute: boolean;
  maxConcurrentTasks: number;
  retryCount: number;
  timeoutSeconds: number;
}

const initialFormData: AgentFormData = {
  name: '',
  description: '',
  agentType: 'trend_monitor',
  isEnabled: true,
  autoExecute: false,
  maxConcurrentTasks: 1,
  retryCount: 3,
  timeoutSeconds: 300,
};

export const AgentsTab = () => {
  const { mode, getThemeClasses } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const themeClasses = getThemeClasses();
  const queryClient = useQueryClient();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [formData, setFormData] = useState<AgentFormData>(initialFormData);
  const [filterType, setFilterType] = useState<AgentType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<AgentStatus | 'all'>('all');

  // Fetch agents
  const {
    data: agentsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['agent', 'agents', filterType, filterStatus],
    queryFn: () => agentService.getAgents({
      agentType: filterType === 'all' ? undefined : filterType,
      status: filterStatus === 'all' ? undefined : filterStatus,
    }),
  });

  const agents = agentsData?.agents ?? [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: AgentCreateRequest) => agentService.createAgent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent'] });
      toast.success('エージェントを作成しました');
      handleCloseCreateModal();
    },
    onError: () => {
      toast.error('エージェントの作成に失敗しました');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AgentUpdateRequest }) =>
      agentService.updateAgent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent'] });
      toast.success('エージェントを更新しました');
      handleCloseEditModal();
    },
    onError: () => {
      toast.error('エージェントの更新に失敗しました');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => agentService.deleteAgent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent'] });
      toast.success('エージェントを削除しました');
    },
    onError: () => {
      toast.error('エージェントの削除に失敗しました');
    },
  });

  // Status update mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AgentStatus }) =>
      agentService.updateAgentStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent'] });
      toast.success('ステータスを更新しました');
    },
    onError: () => {
      toast.error('ステータスの更新に失敗しました');
    },
  });

  // Run agent mutation
  const runMutation = useMutation({
    mutationFn: ({ id, taskName }: { id: string; taskName: string }) =>
      agentService.runAgent(id, taskName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent'] });
      toast.success('タスクを開始しました');
    },
    onError: () => {
      toast.error('タスクの開始に失敗しました');
    },
  });

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setFormData(initialFormData);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedAgent(null);
    setFormData(initialFormData);
  };

  const handleEdit = (agent: Agent) => {
    setSelectedAgent(agent);
    setFormData({
      name: agent.name,
      description: agent.description || '',
      agentType: agent.agentType,
      isEnabled: agent.isEnabled,
      autoExecute: agent.autoExecute,
      maxConcurrentTasks: agent.maxConcurrentTasks,
      retryCount: agent.retryCount,
      timeoutSeconds: agent.timeoutSeconds,
    });
    setShowEditModal(true);
  };

  const handleDelete = (agent: Agent) => {
    if (confirm(`${agent.name}を削除してもよろしいですか？`)) {
      deleteMutation.mutate(agent.id);
    }
  };

  const handleToggleEnabled = (agent: Agent) => {
    updateMutation.mutate({
      id: agent.id,
      data: { isEnabled: !agent.isEnabled },
    });
  };

  const handleRunAgent = (agent: Agent) => {
    runMutation.mutate({ id: agent.id, taskName: `手動実行 - ${new Date().toLocaleString()}` });
  };

  const handlePauseAgent = (agent: Agent) => {
    statusMutation.mutate({ id: agent.id, status: 'paused' });
  };

  const handleSubmitCreate = () => {
    if (!formData.name.trim()) {
      toast.error('名前を入力してください');
      return;
    }
    createMutation.mutate({
      name: formData.name,
      description: formData.description || undefined,
      agentType: formData.agentType,
      isEnabled: formData.isEnabled,
      autoExecute: formData.autoExecute,
      maxConcurrentTasks: formData.maxConcurrentTasks,
      retryCount: formData.retryCount,
      timeoutSeconds: formData.timeoutSeconds,
    });
  };

  const handleSubmitEdit = () => {
    if (!selectedAgent) return;
    if (!formData.name.trim()) {
      toast.error('名前を入力してください');
      return;
    }
    updateMutation.mutate({
      id: selectedAgent.id,
      data: {
        name: formData.name,
        description: formData.description || undefined,
        isEnabled: formData.isEnabled,
        autoExecute: formData.autoExecute,
        maxConcurrentTasks: formData.maxConcurrentTasks,
        retryCount: formData.retryCount,
        timeoutSeconds: formData.timeoutSeconds,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-blue-500" />
        <span className={cn('ml-3', themeClasses.textSecondary)}>エージェントを読み込み中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('p-8 rounded-2xl text-center', isDarkMode ? 'bg-red-900/20' : 'bg-red-50')}>
        <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
        <p className="text-red-500">エージェントの読み込みに失敗しました</p>
      </div>
    );
  }

  const stats = {
    total: agents.length,
    active: agents.filter((a) => a.isEnabled).length,
    running: agents.filter((a) => a.status === 'running').length,
    error: agents.filter((a) => a.status === 'error').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={cn('text-xl font-bold', themeClasses.text)}>エージェント一覧</h2>
          <p className={cn('text-sm mt-1', themeClasses.textSecondary)}>
            AI自動化エージェントの管理
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all"
        >
          <Plus size={16} />
          エージェントを追加
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '総数', value: stats.total, color: 'text-blue-500' },
          { label: '有効', value: stats.active, color: 'text-green-500' },
          { label: '稼働中', value: stats.running, color: 'text-purple-500' },
          { label: 'エラー', value: stats.error, color: 'text-red-500' },
        ].map((stat) => (
          <div
            key={stat.label}
            className={cn(
              'p-4 rounded-xl text-center',
              isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'
            )}
          >
            <p className={cn('text-2xl font-bold', stat.color)}>{stat.value}</p>
            <p className={cn('text-xs mt-1', themeClasses.textSecondary)}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as AgentType | 'all')}
          className={cn(
            'px-4 py-2 rounded-xl border text-sm',
            themeClasses.cardBorder,
            isDarkMode ? 'bg-slate-800' : 'bg-white',
            themeClasses.text
          )}
        >
          <option value="all">すべてのタイプ</option>
          {(Object.keys(AGENT_TYPE_CONFIG) as AgentType[]).map((type) => (
            <option key={type} value={type}>
              {AGENT_TYPE_CONFIG[type].label}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as AgentStatus | 'all')}
          className={cn(
            'px-4 py-2 rounded-xl border text-sm',
            themeClasses.cardBorder,
            isDarkMode ? 'bg-slate-800' : 'bg-white',
            themeClasses.text
          )}
        >
          <option value="all">すべてのステータス</option>
          {(Object.keys(AGENT_STATUS_CONFIG) as AgentStatus[]).map((status) => (
            <option key={status} value={status}>
              {AGENT_STATUS_CONFIG[status].label}
            </option>
          ))}
        </select>
      </div>

      {/* Agent Cards */}
      {agents.length === 0 ? (
        <div className={cn('p-8 rounded-2xl text-center', isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50')}>
          <Bot size={48} className={cn('mx-auto mb-4', themeClasses.textSecondary)} />
          <p className={themeClasses.textSecondary}>エージェントがありません</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 text-blue-500 hover:text-blue-600 text-sm"
          >
            最初のエージェントを作成
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {agents.map((agent) => {
            const typeConfig = AGENT_TYPE_CONFIG[agent.agentType];
            const statusConfig = AGENT_STATUS_CONFIG[agent.status];
            const successRate = agent.totalTasksRun > 0
              ? Math.round((agent.successfulTasks / agent.totalTasksRun) * 100)
              : 0;

            return (
              <div
                key={agent.id}
                className={cn(
                  'rounded-2xl border p-5 transition-all',
                  themeClasses.cardBg,
                  themeClasses.cardBorder,
                  !agent.isEnabled && 'opacity-60'
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'p-3 rounded-xl',
                        isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
                      )}
                    >
                      {AGENT_TYPE_ICONS[agent.agentType] || <Bot size={20} />}
                    </div>
                    <div>
                      <h3 className={cn('font-bold', themeClasses.text)}>{agent.name}</h3>
                      <p className={cn('text-xs', themeClasses.textSecondary)}>
                        {typeConfig?.label || agent.agentType}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1',
                        statusConfig?.color || 'text-slate-500',
                        isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
                      )}
                    >
                      {agent.status === 'running' && (
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      )}
                      {statusConfig?.label || agent.status}
                    </span>
                    <DropdownMenu
                      trigger="vertical"
                      items={[
                        {
                          id: 'edit',
                          label: '編集',
                          icon: <Settings size={14} />,
                          onClick: () => handleEdit(agent),
                        },
                        {
                          id: 'toggle',
                          label: agent.isEnabled ? '無効化' : '有効化',
                          icon: <Power size={14} />,
                          onClick: () => handleToggleEnabled(agent),
                        },
                        {
                          id: 'delete',
                          label: '削除',
                          icon: <Trash2 size={14} />,
                          onClick: () => handleDelete(agent),
                          variant: 'danger',
                        },
                      ]}
                    />
                  </div>
                </div>

                {/* Description */}
                {agent.description && (
                  <p className={cn('text-sm mb-4 line-clamp-2', themeClasses.textSecondary)}>
                    {agent.description}
                  </p>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className={cn('p-2 rounded-lg text-center', isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50')}>
                    <p className={cn('text-lg font-bold', themeClasses.text)}>{agent.totalTasksRun}</p>
                    <p className={cn('text-xs', themeClasses.textSecondary)}>総タスク</p>
                  </div>
                  <div className={cn('p-2 rounded-lg text-center', isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50')}>
                    <p className={cn('text-lg font-bold text-green-500')}>{successRate}%</p>
                    <p className={cn('text-xs', themeClasses.textSecondary)}>成功率</p>
                  </div>
                  <div className={cn('p-2 rounded-lg text-center', isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50')}>
                    <p className={cn('text-lg font-bold text-red-500')}>{agent.failedTasks}</p>
                    <p className={cn('text-xs', themeClasses.textSecondary)}>失敗</p>
                  </div>
                </div>

                {/* Last Run */}
                {agent.lastRunAt && (
                  <div className={cn('flex items-center gap-2 text-xs mb-4', themeClasses.textSecondary)}>
                    <Clock size={12} />
                    最終実行: {new Date(agent.lastRunAt).toLocaleString()}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {agent.status === 'running' ? (
                    <button
                      onClick={() => handlePauseAgent(agent)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                      <Pause size={14} />
                      一時停止
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRunAgent(agent)}
                      disabled={!agent.isEnabled}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                        agent.isEnabled
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      )}
                    >
                      <Play size={14} />
                      実行
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(agent)}
                    className={cn(
                      'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                      isDarkMode
                        ? 'bg-slate-700 hover:bg-slate-600 text-white'
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                    )}
                  >
                    <Settings size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={handleCloseCreateModal}
        title="エージェントを追加"
        size="lg"
        footer={
          <div className="flex gap-3">
            <button
              onClick={handleCloseCreateModal}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium',
                isDarkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-200 hover:bg-slate-300',
                themeClasses.text
              )}
            >
              キャンセル
            </button>
            <button
              onClick={handleSubmitCreate}
              disabled={createMutation.isPending}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-50"
            >
              {createMutation.isPending ? '作成中...' : '作成'}
            </button>
          </div>
        }
      >
        <AgentForm
          formData={formData}
          setFormData={setFormData}
          isDarkMode={isDarkMode}
          themeClasses={themeClasses}
          isEdit={false}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        title="エージェントを編集"
        size="lg"
        footer={
          <div className="flex gap-3">
            <button
              onClick={handleCloseEditModal}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium',
                isDarkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-200 hover:bg-slate-300',
                themeClasses.text
              )}
            >
              キャンセル
            </button>
            <button
              onClick={handleSubmitEdit}
              disabled={updateMutation.isPending}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-50"
            >
              {updateMutation.isPending ? '保存中...' : '保存'}
            </button>
          </div>
        }
      >
        <AgentForm
          formData={formData}
          setFormData={setFormData}
          isDarkMode={isDarkMode}
          themeClasses={themeClasses}
          isEdit={true}
        />
      </Modal>
    </div>
  );
};

// Agent Form Component
interface AgentFormProps {
  formData: AgentFormData;
  setFormData: React.Dispatch<React.SetStateAction<AgentFormData>>;
  isDarkMode: boolean;
  themeClasses: ThemeClasses;
  isEdit: boolean;
}

const AgentForm = ({ formData, setFormData, isDarkMode, themeClasses, isEdit }: AgentFormProps) => {
  return (
    <div className="space-y-4">
      {/* Name */}
      <div>
        <label className={cn('block text-sm font-medium mb-1', themeClasses.text)}>
          名前 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="エージェント名"
          className={cn(
            'w-full px-4 py-2 rounded-xl border',
            themeClasses.cardBorder,
            isDarkMode ? 'bg-slate-800' : 'bg-white',
            themeClasses.text
          )}
        />
      </div>

      {/* Type */}
      <div>
        <label className={cn('block text-sm font-medium mb-1', themeClasses.text)}>
          タイプ <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.agentType}
          onChange={(e) => setFormData({ ...formData, agentType: e.target.value as AgentType })}
          disabled={isEdit}
          className={cn(
            'w-full px-4 py-2 rounded-xl border',
            themeClasses.cardBorder,
            isDarkMode ? 'bg-slate-800' : 'bg-white',
            themeClasses.text,
            isEdit && 'opacity-50 cursor-not-allowed'
          )}
        >
          {(Object.keys(AGENT_TYPE_CONFIG) as AgentType[]).map((type) => (
            <option key={type} value={type}>
              {AGENT_TYPE_CONFIG[type].label} - {AGENT_TYPE_CONFIG[type].description}
            </option>
          ))}
        </select>
        {isEdit && (
          <p className={cn('text-xs mt-1', themeClasses.textSecondary)}>
            タイプは変更できません
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className={cn('block text-sm font-medium mb-1', themeClasses.text)}>
          説明
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="エージェントの説明"
          rows={3}
          className={cn(
            'w-full px-4 py-2 rounded-xl border resize-none',
            themeClasses.cardBorder,
            isDarkMode ? 'bg-slate-800' : 'bg-white',
            themeClasses.text
          )}
        />
      </div>

      {/* Toggles */}
      <div className="grid grid-cols-2 gap-4">
        <div className={cn('p-4 rounded-xl', isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50')}>
          <label className="flex items-center justify-between cursor-pointer">
            <span className={cn('text-sm font-medium', themeClasses.text)}>有効化</span>
            <input
              type="checkbox"
              checked={formData.isEnabled}
              onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
              className="w-5 h-5 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
            />
          </label>
          <p className={cn('text-xs mt-1', themeClasses.textSecondary)}>
            エージェントを有効にする
          </p>
        </div>
        <div className={cn('p-4 rounded-xl', isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50')}>
          <label className="flex items-center justify-between cursor-pointer">
            <span className={cn('text-sm font-medium', themeClasses.text)}>自動実行</span>
            <input
              type="checkbox"
              checked={formData.autoExecute}
              onChange={(e) => setFormData({ ...formData, autoExecute: e.target.checked })}
              className="w-5 h-5 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
            />
          </label>
          <p className={cn('text-xs mt-1', themeClasses.textSecondary)}>
            スケジュールに従って自動実行
          </p>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className={cn('p-4 rounded-xl space-y-4', isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50')}>
        <h4 className={cn('text-sm font-medium', themeClasses.text)}>詳細設定</h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={cn('block text-xs mb-1', themeClasses.textSecondary)}>
              同時タスク数
            </label>
            <input
              type="number"
              value={formData.maxConcurrentTasks}
              onChange={(e) => setFormData({ ...formData, maxConcurrentTasks: parseInt(e.target.value) || 1 })}
              min={1}
              max={10}
              className={cn(
                'w-full px-3 py-2 rounded-lg border text-sm',
                themeClasses.cardBorder,
                isDarkMode ? 'bg-slate-700' : 'bg-white',
                themeClasses.text
              )}
            />
          </div>
          <div>
            <label className={cn('block text-xs mb-1', themeClasses.textSecondary)}>
              リトライ回数
            </label>
            <input
              type="number"
              value={formData.retryCount}
              onChange={(e) => setFormData({ ...formData, retryCount: parseInt(e.target.value) || 0 })}
              min={0}
              max={10}
              className={cn(
                'w-full px-3 py-2 rounded-lg border text-sm',
                themeClasses.cardBorder,
                isDarkMode ? 'bg-slate-700' : 'bg-white',
                themeClasses.text
              )}
            />
          </div>
          <div>
            <label className={cn('block text-xs mb-1', themeClasses.textSecondary)}>
              タイムアウト(秒)
            </label>
            <input
              type="number"
              value={formData.timeoutSeconds}
              onChange={(e) => setFormData({ ...formData, timeoutSeconds: parseInt(e.target.value) || 60 })}
              min={30}
              max={3600}
              className={cn(
                'w-full px-3 py-2 rounded-lg border text-sm',
                themeClasses.cardBorder,
                isDarkMode ? 'bg-slate-700' : 'bg-white',
                themeClasses.text
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
