/**
 * 总览面板 - 左侧边栏 + 右侧主内容
 */

import React from 'react';
import type { LearningStatusResponse, GrindSettings } from '../types';

interface OverviewPanelProps {
    status: LearningStatusResponse;
    grindSettings: GrindSettings;
    onStartExam: (type: 'listening' | 'spelling') => void;
    onStartGrind: (mode: 'normal' | 'free') => void;
    onViewStats: () => void;
    onRefreshData: () => void;
}

const OverviewPanel: React.FC<OverviewPanelProps> = ({
    status,
    grindSettings,
    onStartExam,
    onStartGrind,
    onViewStats,
    onRefreshData
}) => {
    const { statistics, predictions, due_counts, has_due_reviews, grind_locked } = status;

    // 计算图表最大值
    const maxPrediction = Math.max(...predictions.map(p => p.total), 1);

    // 设置弹窗状态
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
    const [editingSettings, setEditingSettings] = React.useState<GrindSettings>(grindSettings);
    const [isSaving, setIsSaving] = React.useState(false);

    // 打开设置时初始化数据
    const handleOpenSettings = () => {
        setEditingSettings({ ...grindSettings });
        setIsSettingsOpen(true);
    };

    // 保存设置
    const handleSaveSettings = async () => {
        try {
            setIsSaving(true);
            const { updateGrindSettings } = await import('../api');
            await updateGrindSettings(editingSettings);
            onRefreshData(); // 刷新父组件数据
            setIsSettingsOpen(false);
        } catch (err) {
            console.error('Failed to save settings:', err);
            alert('保存失败，请重试');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            {/* 左侧边栏 */}
            <div className="listening-sidebar">
                {/* 待复习状态 */}
                <div className="sidebar-card">
                    <div className="sidebar-card-title">🔴 待复习</div>
                    <div className="stat-row">
                        <span className="stat-label">听力考核</span>
                        <span className={`stat-value ${due_counts.listening > 0 ? 'danger' : ''}`}>
                            {due_counts.listening}
                        </span>
                    </div>
                    <div className="stat-row">
                        <span className="stat-label">拼写考核</span>
                        <span className={`stat-value ${due_counts.spelling > 0 ? 'danger' : ''}`}>
                            {due_counts.spelling}
                        </span>
                    </div>
                </div>

                {/* 学习中状态 */}
                <div className="sidebar-card">
                    <div className="sidebar-card-title">🟡 学习中</div>
                    <div className="stat-row">
                        <span className="stat-label">磨耳朵</span>
                        <span className={`stat-value ${due_counts.grind > 0 ? 'warning' : ''}`}>
                            {due_counts.grind}
                        </span>
                    </div>
                    <div className="stat-row">
                        <span className="stat-label">考核中</span>
                        <span className="stat-value">
                            {statistics.exam_listening + statistics.exam_spelling}
                        </span>
                    </div>
                </div>

                {/* 已掌握 */}
                <div className="sidebar-card">
                    <div className="sidebar-card-title">🟢 已掌握</div>
                    <div className="stat-row">
                        <span className="stat-label">词汇量</span>
                        <span className="stat-value success">{statistics.mastered}</span>
                    </div>
                    <div className="stat-row">
                        <span className="stat-label">总计</span>
                        <span className="stat-value">{statistics.total}</span>
                    </div>
                </div>

                {/* 快捷操作 */}
                <div className="sidebar-card">
                    <div className="sidebar-card-title">⚡ 快捷操作</div>
                    <div className="quick-actions">
                        {has_due_reviews && (
                            <>
                                {due_counts.listening > 0 && (
                                    <button className="quick-btn" onClick={() => onStartExam('listening')}>
                                        👂 听力考核 ({due_counts.listening})
                                    </button>
                                )}
                                {due_counts.spelling > 0 && (
                                    <button className="quick-btn" onClick={() => onStartExam('spelling')}>
                                        ✍️ 拼写考核 ({due_counts.spelling})
                                    </button>
                                )}
                            </>
                        )}
                        <button
                            className="quick-btn"
                            onClick={() => onStartGrind('normal')}
                            disabled={grind_locked}
                        >
                            🎵 开始磨耳朵 ({due_counts.grind})
                        </button>
                        <button className="quick-btn secondary" onClick={() => onStartGrind('free')}>
                            🔄 自由模式
                        </button>
                    </div>
                    {grind_locked && has_due_reviews && (
                        <p style={{ fontSize: '0.75rem', color: '#f57c00', marginTop: 8 }}>
                            ⚠️ 请先完成复习考核
                        </p>
                    )}
                </div>

                {/* 设置按钮 */}
                <div className="sidebar-card">
                    <button className="settings-btn" onClick={handleOpenSettings}>
                        ⚙️ 磨耳朵次数设置
                    </button>
                </div>
            </div>

            {/* 右侧主内容 */}
            <div className="listening-content">
                <div className="content-panel">
                    <div className="panel-header">
                        <span className="panel-title">📊 未来15天复习预测</span>
                        <button className="quick-btn secondary" onClick={onViewStats}>
                            查看详情
                        </button>
                    </div>
                    <div className="panel-body">
                        {/* 预测图表 */}
                        <div className="prediction-chart">
                            <div className="chart-bars">
                                {predictions.slice(0, 15).map((p, i) => (
                                    <div className="chart-bar" key={p.date}>
                                        <div className="bar-value">{p.total}</div>
                                        <div
                                            className="bar-fill"
                                            style={{ height: `${(p.total / maxPrediction) * 60 + 4}px` }}
                                        />
                                        <div className="bar-label">
                                            {i === 0 ? '今' : i === 1 ? '明' : `${i + 1}`}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 统计概览 */}
                        <div style={{ marginTop: 32 }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: 16, color: '#333' }}>按难度分布</h3>
                            <div style={{ display: 'flex', gap: 24 }}>
                                <div style={{ flex: 1, background: '#ffebee', padding: 16, borderRadius: 8, textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#ef5350' }}>
                                        {statistics.by_level.hard}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#666', marginTop: 4 }}>难</div>
                                </div>
                                <div style={{ flex: 1, background: '#fff3e0', padding: 16, borderRadius: 8, textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#f57c00' }}>
                                        {statistics.by_level.medium}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#666', marginTop: 4 }}>中</div>
                                </div>
                                <div style={{ flex: 1, background: '#e8f5e9', padding: 16, borderRadius: 8, textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#5d7a64' }}>
                                        {statistics.by_level.easy}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#666', marginTop: 4 }}>易</div>
                                </div>
                            </div>
                        </div>

                        {/* 今日任务 */}
                        <div style={{ marginTop: 32 }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: 16, color: '#333' }}>今日任务</h3>
                            <div style={{ display: 'flex', gap: 16 }}>
                                <div style={{
                                    flex: 1,
                                    background: has_due_reviews ? '#ffebee' : '#e8f5e9',
                                    padding: 20,
                                    borderRadius: 8,
                                    border: has_due_reviews ? '2px solid #ef5350' : '2px solid #5d7a64'
                                }}>
                                    {has_due_reviews ? (
                                        <>
                                            <div style={{ fontSize: '2rem', fontWeight: 600, color: '#ef5350' }}>
                                                {due_counts.listening + due_counts.spelling}
                                            </div>
                                            <div style={{ color: '#666', marginTop: 4 }}>个词待复习</div>
                                        </>
                                    ) : (
                                        <>
                                            <div style={{ fontSize: '2rem' }}>✅</div>
                                            <div style={{ color: '#5d7a64', marginTop: 4 }}>复习已完成</div>
                                        </>
                                    )}
                                </div>
                                <div style={{
                                    flex: 1,
                                    background: '#f5f5f5',
                                    padding: 20,
                                    borderRadius: 8,
                                    border: '2px solid #e0e0e0'
                                }}>
                                    <div style={{ fontSize: '2rem', fontWeight: 600, color: '#5d7a64' }}>
                                        {due_counts.grind}
                                    </div>
                                    <div style={{ color: '#666', marginTop: 4 }}>个词待磨耳朵</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 设置弹窗 */}
            {isSettingsOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>⚙️ 磨耳朵次数设置</h3>
                            <button className="close-btn" onClick={() => setIsSettingsOpen(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="setting-item">
                                <label>
                                    <div className="label-main">
                                        <span className="level-tag hard">难</span>
                                        <span style={{ fontWeight: 500 }}>不认识</span>
                                    </div>
                                    <span className="label-desc">完全陌生的词汇</span>
                                </label>
                                <div className="number-input">
                                    <button onClick={() => setEditingSettings(s => ({ ...s, hard: Math.max(1, s.hard - 1) }))}>-</button>
                                    <span>{editingSettings.hard}</span>
                                    <button onClick={() => setEditingSettings(s => ({ ...s, hard: s.hard + 1 }))}>+</button>
                                </div>
                            </div>
                            <div className="setting-item">
                                <label>
                                    <div className="label-main">
                                        <span className="level-tag medium">中</span>
                                        <span style={{ fontWeight: 500 }}>听不懂</span>
                                    </div>
                                    <span className="label-desc">认识但听不出来的词</span>
                                </label>
                                <div className="number-input">
                                    <button onClick={() => setEditingSettings(s => ({ ...s, medium: Math.max(1, s.medium - 1) }))}>-</button>
                                    <span>{editingSettings.medium}</span>
                                    <button onClick={() => setEditingSettings(s => ({ ...s, medium: s.medium + 1 }))}>+</button>
                                </div>
                            </div>
                            <div className="setting-item">
                                <label>
                                    <div className="label-main">
                                        <span className="level-tag easy">易</span>
                                        <span style={{ fontWeight: 500 }}>巩固</span>
                                    </div>
                                    <span className="label-desc">加深印象，防止遗忘</span>
                                </label>
                                <div className="number-input">
                                    <button onClick={() => setEditingSettings(s => ({ ...s, easy: Math.max(1, s.easy - 1) }))}>-</button>
                                    <span>{editingSettings.easy}</span>
                                    <button onClick={() => setEditingSettings(s => ({ ...s, easy: s.easy + 1 }))}>+</button>
                                </div>
                            </div>
                            <p className="setting-hint">注：修改后将应用于所有新开始磨耳朵的单词</p>
                        </div>
                        <div className="modal-footer">
                            <button className="cancel-btn" onClick={() => setIsSettingsOpen(false)}>取消</button>
                            <button className="confirm-btn" onClick={handleSaveSettings} disabled={isSaving}>
                                {isSaving ? '保存中...' : '保存更改'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default OverviewPanel;
