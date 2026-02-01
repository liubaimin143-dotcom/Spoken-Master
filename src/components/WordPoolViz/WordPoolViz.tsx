// 单词池可视化组件 - 显示新词/复习/已通过/待学等数量
import type { WordStatistics } from '../../pages/Listening/types';
import './WordPoolViz.css';

interface WordPoolVizProps {
    statistics: WordStatistics;
    currentProgress?: {
        completed: number;
        total: number;
        currentRound: number;
        totalRounds: number;
    };
}

export function WordPoolViz({ statistics, currentProgress }: WordPoolVizProps) {
    const items = [
        { key: 'new', label: '新词', count: statistics.new, color: '#3b82f6' },
        { key: 'learning', label: '学习中', count: statistics.learning, color: '#f59e0b' },
        { key: 'review', label: '复习', count: statistics.review, color: '#10b981' },
        { key: 'relearning', label: '重学', count: statistics.relearning, color: '#ef4444' },
    ];

    const totalWithData = items.reduce((sum, item) => sum + item.count, 0);

    return (
        <div className="word-pool-viz">
            <div className="word-pool-viz__header">
                <h3 className="word-pool-viz__title">词汇池</h3>
                <span className="word-pool-viz__total">共 {statistics.total} 词</span>
            </div>

            {/* 进度条 */}
            <div className="word-pool-viz__bar-container">
                <div className="word-pool-viz__bar">
                    {items.map((item) => (
                        <div
                            key={item.key}
                            className="word-pool-viz__segment"
                            style={{
                                width: totalWithData > 0 ? `${(item.count / statistics.total) * 100}%` : '0%',
                                backgroundColor: item.color,
                            }}
                            title={`${item.label}: ${item.count}`}
                        />
                    ))}
                </div>
            </div>

            {/* 图例 */}
            <div className="word-pool-viz__legend">
                {items.map((item) => (
                    <div key={item.key} className="word-pool-viz__legend-item">
                        <span
                            className="word-pool-viz__legend-dot"
                            style={{ backgroundColor: item.color }}
                        />
                        <span className="word-pool-viz__legend-label">{item.label}</span>
                        <span className="word-pool-viz__legend-count">{item.count}</span>
                    </div>
                ))}
            </div>

            {/* 今日进度 */}
            {currentProgress && (
                <div className="word-pool-viz__progress">
                    <div className="word-pool-viz__progress-header">
                        <span>当前进度</span>
                        <span>轮次 {currentProgress.currentRound}/{currentProgress.totalRounds}</span>
                    </div>
                    <div className="word-pool-viz__progress-bar">
                        <div
                            className="word-pool-viz__progress-fill"
                            style={{
                                width: currentProgress.total > 0
                                    ? `${(currentProgress.completed / currentProgress.total) * 100}%`
                                    : '0%',
                            }}
                        />
                    </div>
                    <div className="word-pool-viz__progress-text">
                        {currentProgress.completed} / {currentProgress.total}
                    </div>
                </div>
            )}

            {/* 额外统计 */}
            <div className="word-pool-viz__stats">
                <div className="word-pool-viz__stat">
                    <span className="word-pool-viz__stat-label">今日到期</span>
                    <span className="word-pool-viz__stat-value">{statistics.due_today}</span>
                </div>
                <div className="word-pool-viz__stat">
                    <span className="word-pool-viz__stat-label">平均难度</span>
                    <span className="word-pool-viz__stat-value">
                        {statistics.avg_difficulty?.toFixed(2) || '-'}
                    </span>
                </div>
                <div className="word-pool-viz__stat">
                    <span className="word-pool-viz__stat-label">平均稳定性</span>
                    <span className="word-pool-viz__stat-value">
                        {statistics.avg_stability?.toFixed(2) || '-'}
                    </span>
                </div>
            </div>
        </div>
    );
}
