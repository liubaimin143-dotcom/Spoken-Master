// Gemini 智能面板组件
import { useState } from 'react';
import type { GeminiPlan, GeminiQueue } from '../../pages/Listening/types';
import './GeminiPanel.css';

interface GeminiPanelProps {
    plan?: GeminiPlan | null;
    queue?: GeminiQueue | null;
    isLoading?: boolean;
    onRefreshPlan?: () => void;
    onRefreshQueue?: () => void;
}

export function GeminiPanel({
    plan,
    queue,
    isLoading = false,
    onRefreshPlan,
    onRefreshQueue,
}: GeminiPanelProps) {
    const [activeSection, setActiveSection] = useState<'plan' | 'queue'>('plan');

    return (
        <div className="gemini-panel">
            <div className="gemini-panel__header">
                <div className="gemini-panel__icon">✨</div>
                <h3 className="gemini-panel__title">Gemini 智能助手</h3>
            </div>

            {/* 切换选项卡 */}
            <div className="gemini-panel__tabs">
                <button
                    className={`gemini-panel__tab ${activeSection === 'plan' ? 'gemini-panel__tab--active' : ''}`}
                    onClick={() => setActiveSection('plan')}
                >
                    学习规划
                </button>
                <button
                    className={`gemini-panel__tab ${activeSection === 'queue' ? 'gemini-panel__tab--active' : ''}`}
                    onClick={() => setActiveSection('queue')}
                >
                    队列优化
                </button>
            </div>

            {/* 内容区域 */}
            <div className="gemini-panel__content">
                {isLoading ? (
                    <div className="gemini-panel__loading">
                        <span className="gemini-panel__spinner">⏳</span>
                        <p>AI 分析中...</p>
                    </div>
                ) : activeSection === 'plan' ? (
                    <div className="gemini-panel__section">
                        {plan ? (
                            <>
                                <div className="gemini-panel__metrics">
                                    <div className="gemini-panel__metric">
                                        <span className="gemini-panel__metric-label">推荐轮数</span>
                                        <span className="gemini-panel__metric-value">
                                            {plan.recommended_rounds}
                                        </span>
                                    </div>
                                    <div className="gemini-panel__metric">
                                        <span className="gemini-panel__metric-label">预测通过率</span>
                                        <span className="gemini-panel__metric-value">
                                            {Math.round(plan.predicted_pass_rate * 100)}%
                                        </span>
                                    </div>
                                    <div className="gemini-panel__metric">
                                        <span className="gemini-panel__metric-label">最少轮数</span>
                                        <span className="gemini-panel__metric-value">
                                            {plan.min_rounds}
                                        </span>
                                    </div>
                                </div>

                                {plan.high_risk_words.length > 0 && (
                                    <div className="gemini-panel__alert">
                                        <span className="gemini-panel__alert-icon">⚠️</span>
                                        <div>
                                            <strong>高风险词汇</strong>
                                            <p>{plan.high_risk_words.join(', ')}</p>
                                        </div>
                                    </div>
                                )}

                                {plan.suggestion && (
                                    <div className="gemini-panel__suggestion">
                                        <strong>💡 建议</strong>
                                        <p>{plan.suggestion}</p>
                                    </div>
                                )}

                                <button
                                    className="gemini-panel__refresh"
                                    onClick={onRefreshPlan}
                                >
                                    🔄 重新分析
                                </button>
                            </>
                        ) : (
                            <div className="gemini-panel__empty">
                                <p>暂无学习规划</p>
                                <button
                                    className="gemini-panel__generate"
                                    onClick={onRefreshPlan}
                                >
                                    生成规划
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="gemini-panel__section">
                        {queue ? (
                            <>
                                <div className="gemini-panel__queue-info">
                                    <p className="gemini-panel__queue-count">
                                        队列中 <strong>{queue.play_order.length}</strong> 个单词
                                    </p>
                                </div>

                                {queue.reason && (
                                    <div className="gemini-panel__reason">
                                        <strong>优化理由</strong>
                                        <p>{queue.reason}</p>
                                    </div>
                                )}

                                <button
                                    className="gemini-panel__refresh"
                                    onClick={onRefreshQueue}
                                >
                                    🔄 重新优化
                                </button>
                            </>
                        ) : (
                            <div className="gemini-panel__empty">
                                <p>暂无队列优化</p>
                                <button
                                    className="gemini-panel__generate"
                                    onClick={onRefreshQueue}
                                >
                                    优化队列
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
