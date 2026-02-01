/**
 * 听力工坊 V2 - 主页面
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { LearningStatusResponse, GrindSettings } from './types';
import * as api from './api';
import './ListeningV2.css';

// 子面板
import {
    OverviewPanel,
    GrindPanel,
    ExamPanel,
    StatsPanel
} from './components';

type TabType = 'overview' | 'grind' | 'exam' | 'stats';

const ListeningV2: React.FC = () => {
    // 状态
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [status, setStatus] = useState<LearningStatusResponse | null>(null);
    const [grindSettings, setGrindSettings] = useState<GrindSettings>({ hard: 15, medium: 8, easy: 3 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 考核类型
    const [examType, setExamType] = useState<'listening' | 'spelling'>('listening');
    // 磨耳朵模式
    const [grindMode, setGrindMode] = useState<'normal' | 'free'>('normal');

    // 加载数据
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [statusData, settingsData] = await Promise.all([
                api.getListeningStatus(),
                api.getGrindSettings()
            ]);
            setStatus(statusData);
            setGrindSettings(settingsData);
            setError(null);
        } catch (err) {
            setError('加载失败，请刷新重试');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // 切换 Tab
    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
    };

    // 开始考核
    const handleStartExam = (type: 'listening' | 'spelling') => {
        setExamType(type);
        setActiveTab('exam');
    };

    // 开始磨耳朵
    const handleStartGrind = (mode: 'normal' | 'free') => {
        setGrindMode(mode);
        setActiveTab('grind');
    };

    // 完成后返回
    const handleComplete = () => {
        setActiveTab('overview');
        loadData();
    };

    // 渲染加载状态
    if (loading) {
        return (
            <div className="listening-page">
                <div className="loading-container">
                    <div className="loading-spinner" />
                    <p style={{ marginTop: 16, color: '#888' }}>加载中...</p>
                </div>
            </div>
        );
    }

    // 渲染错误状态
    if (error || !status) {
        return (
            <div className="listening-page">
                <div className="loading-container">
                    <p style={{ color: '#ef5350' }}>{error || '数据加载失败'}</p>
                    <button className="quick-btn" onClick={loadData} style={{ marginTop: 16 }}>
                        重试
                    </button>
                </div>
            </div>
        );
    }

    // 计算待处理数
    const dueCount = status.due_counts.listening + status.due_counts.spelling;

    return (
        <div className="listening-page">
            {/* 页面头部 */}
            <div className="listening-header">
                <div className="header-title">
                    <h1>听力工坊</h1>
                    <p>Listening Workshop · 突击模式</p>
                </div>
                <div className="header-actions">
                    <button className="quick-btn secondary" onClick={loadData}>
                        🔄 刷新
                    </button>
                </div>
            </div>

            {/* 二级 Tab 导航 */}
            <div className="listening-tabs">
                <button
                    className={`listening-tab ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => handleTabChange('overview')}
                >
                    📊 总览
                </button>
                <button
                    className={`listening-tab ${activeTab === 'grind' ? 'active' : ''}`}
                    onClick={() => handleTabChange('grind')}
                >
                    🎵 磨耳朵
                    {status.due_counts.grind > 0 && (
                        <span className="tab-badge green">{status.due_counts.grind}</span>
                    )}
                </button>
                <button
                    className={`listening-tab ${activeTab === 'exam' ? 'active' : ''}`}
                    onClick={() => handleTabChange('exam')}
                >
                    📝 考核
                    {dueCount > 0 && <span className="tab-badge">{dueCount}</span>}
                </button>
                <button
                    className={`listening-tab ${activeTab === 'stats' ? 'active' : ''}`}
                    onClick={() => handleTabChange('stats')}
                >
                    📈 统计
                </button>
            </div>

            {/* 主内容区 */}
            <div className="listening-main">
                {activeTab === 'overview' && (
                    <OverviewPanel
                        status={status}
                        grindSettings={grindSettings}
                        onStartExam={handleStartExam}
                        onStartGrind={handleStartGrind}
                        onViewStats={() => handleTabChange('stats')}
                        onRefreshData={loadData}
                    />
                )}

                {activeTab === 'grind' && (
                    <GrindPanel
                        mode={grindMode}
                        onComplete={handleComplete}
                        onModeChange={setGrindMode}
                    />
                )}

                {activeTab === 'exam' && (
                    <ExamPanel
                        examType={examType}
                        onComplete={handleComplete}
                        onTypeChange={setExamType}
                        dueCounts={status.due_counts}
                    />
                )}

                {activeTab === 'stats' && (
                    <StatsPanel
                        status={status}
                        onBack={() => handleTabChange('overview')}
                    />
                )}
            </div>
        </div>
    );
};

export default ListeningV2;
