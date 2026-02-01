/**
 * 统计面板 - 详细学习数据
 */

import React from 'react';
import type { LearningStatusResponse } from '../types';

interface StatsPanelProps {
    status: LearningStatusResponse;
    onBack: () => void;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ status, onBack }) => {
    const { statistics, predictions } = status;

    const maxPrediction = Math.max(...predictions.map(p => p.total), 1);

    return (
        <div className="listening-content" style={{ padding: 24, overflowY: 'auto' }}>
            {/* 返回按钮 */}
            <div style={{ marginBottom: 24 }}>
                <button className="quick-btn secondary" onClick={onBack}>
                    ← 返回总览
                </button>
            </div>

            {/* 总览统计 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
                <div style={{ background: 'white', padding: 24, borderRadius: 12, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 600, color: '#333' }}>{statistics.total}</div>
                    <div style={{ color: '#888', marginTop: 4 }}>总词汇量</div>
                </div>
                <div style={{ background: 'white', padding: 24, borderRadius: 12, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 600, color: '#5d7a64' }}>{statistics.mastered}</div>
                    <div style={{ color: '#888', marginTop: 4 }}>已掌握</div>
                </div>
                <div style={{ background: 'white', padding: 24, borderRadius: 12, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 600, color: '#f57c00' }}>{statistics.grinding}</div>
                    <div style={{ color: '#888', marginTop: 4 }}>学习中</div>
                </div>
                <div style={{ background: 'white', padding: 24, borderRadius: 12, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 600, color: '#888' }}>{statistics.pending}</div>
                    <div style={{ color: '#888', marginTop: 4 }}>待学习</div>
                </div>
            </div>

            {/* 两列布局 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                {/* 左列 - 按难度 */}
                <div style={{ background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginBottom: 20, color: '#333' }}>📚 按难度等级</h3>
                    <div style={{ display: 'flex', gap: 16 }}>
                        <div style={{ flex: 1, background: '#ffebee', padding: 20, borderRadius: 8, textAlign: 'center' }}>
                            <div style={{ fontSize: '1.8rem', fontWeight: 600, color: '#ef5350' }}>
                                {statistics.by_level.hard}
                            </div>
                            <div style={{ color: '#666', marginTop: 4 }}>难</div>
                        </div>
                        <div style={{ flex: 1, background: '#fff3e0', padding: 20, borderRadius: 8, textAlign: 'center' }}>
                            <div style={{ fontSize: '1.8rem', fontWeight: 600, color: '#f57c00' }}>
                                {statistics.by_level.medium}
                            </div>
                            <div style={{ color: '#666', marginTop: 4 }}>中</div>
                        </div>
                        <div style={{ flex: 1, background: '#e8f5e9', padding: 20, borderRadius: 8, textAlign: 'center' }}>
                            <div style={{ fontSize: '1.8rem', fontWeight: 600, color: '#5d7a64' }}>
                                {statistics.by_level.easy}
                            </div>
                            <div style={{ color: '#666', marginTop: 4 }}>易</div>
                        </div>
                    </div>
                </div>

                {/* 右列 - 今日待复习 */}
                <div style={{ background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginBottom: 20, color: '#333' }}>📅 今日状态</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #eee' }}>
                            <span style={{ color: '#666' }}>待听力复习</span>
                            <span style={{ fontWeight: 600, color: statistics.today_due_listening > 0 ? '#ef5350' : '#5d7a64' }}>
                                {statistics.today_due_listening}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #eee' }}>
                            <span style={{ color: '#666' }}>待拼写复习</span>
                            <span style={{ fontWeight: 600, color: statistics.today_due_spelling > 0 ? '#ef5350' : '#5d7a64' }}>
                                {statistics.today_due_spelling}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
                            <span style={{ color: '#666' }}>不会的词</span>
                            <span style={{ fontWeight: 600, color: '#ef5350' }}>
                                {statistics.in_difficult}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 预测图表 */}
            <div style={{ background: 'white', padding: 24, borderRadius: 12, marginTop: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginBottom: 20, color: '#333' }}>📊 未来15天复习预测</h3>
                <div className="prediction-chart">
                    <div className="chart-bars" style={{ height: 120 }}>
                        {predictions.map((p, i) => (
                            <div className="chart-bar" key={p.date}>
                                <div className="bar-value">{p.total}</div>
                                <div
                                    className="bar-fill"
                                    style={{ height: `${(p.total / maxPrediction) * 80 + 4}px` }}
                                />
                                <div className="bar-label">
                                    {i === 0 ? '今' : i === 1 ? '明' : `${i + 1}`}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 详细表格 */}
                <table style={{ width: '100%', marginTop: 24, borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #eee' }}>
                            <th style={{ textAlign: 'left', padding: 12, color: '#666', fontWeight: 500 }}>日期</th>
                            <th style={{ textAlign: 'center', padding: 12, color: '#666', fontWeight: 500 }}>听力</th>
                            <th style={{ textAlign: 'center', padding: 12, color: '#666', fontWeight: 500 }}>拼写</th>
                            <th style={{ textAlign: 'center', padding: 12, color: '#666', fontWeight: 500 }}>合计</th>
                        </tr>
                    </thead>
                    <tbody>
                        {predictions.slice(0, 7).map((p, i) => (
                            <tr key={p.date} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                <td style={{ padding: 12 }}>
                                    {i === 0 ? '今天' : i === 1 ? '明天' : p.date}
                                </td>
                                <td style={{ textAlign: 'center', padding: 12 }}>{p.listening}</td>
                                <td style={{ textAlign: 'center', padding: 12 }}>{p.spelling}</td>
                                <td style={{ textAlign: 'center', padding: 12, fontWeight: 600, color: '#5d7a64' }}>
                                    {p.total}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StatsPanel;
