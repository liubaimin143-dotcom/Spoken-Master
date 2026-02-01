/**
 * 考核面板 - 左侧类型选择 + 右侧考核卡片
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { VocabularyV2, Rating } from '../types';
import * as api from '../api';

interface ExamPanelProps {
    examType: 'listening' | 'spelling';
    onComplete: () => void;
    onTypeChange: (type: 'listening' | 'spelling') => void;
    dueCounts: { listening: number; spelling: number; grind: number };
}

interface ExamResult {
    vocabulary_id: string;
    english: string;
    rating: Rating;
    next_review_display: string;
}

const ExamPanel: React.FC<ExamPanelProps> = ({
    examType,
    onComplete,
    onTypeChange,
    dueCounts
}) => {
    const [queue, setQueue] = useState<VocabularyV2[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [results, setResults] = useState<ExamResult[]>([]);
    const [showComplete, setShowComplete] = useState(false);

    // 拼写专用
    const [spellingInput, setSpellingInput] = useState('');
    const [showAnswer, setShowAnswer] = useState(false);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    // 加载考核队列
    useEffect(() => {
        const loadQueue = async () => {
            setLoading(true);
            setShowComplete(false);
            setResults([]);
            setCurrentIndex(0);
            try {
                const data = await api.getDueReviews();
                const queueData = examType === 'listening' ? data.listening : data.spelling;
                setQueue(queueData);
            } catch (err) {
                console.error('加载考核队列失败', err);
            }
            setLoading(false);
        };
        loadQueue();
    }, [examType]);

    const currentWord = queue[currentIndex];

    // 播放音频
    const playAudio = useCallback(async () => {
        if (!currentWord?.audio_file_id) return;
        try {
            const url = api.getAudioUrl(currentWord.audio_file_id);
            if (audioRef.current) {
                audioRef.current.src = url;
                await audioRef.current.play();
            }
        } catch (err) {
            console.error('播放失败', err);
        }
    }, [currentWord]);

    // 听力考核自动播放
    useEffect(() => {
        if (examType === 'listening' && currentWord && !showComplete) {
            playAudio();
        }
    }, [examType, currentWord, playAudio, showComplete]);

    // 拼写考核聚焦
    useEffect(() => {
        if (examType === 'spelling' && inputRef.current && !showAnswer) {
            inputRef.current.focus();
        }
    }, [examType, currentIndex, showAnswer]);

    // 处理评分
    const handleRating = async (rating: Rating) => {
        if (!currentWord) return;

        try {
            const response = await api.reviewVocabulary({
                vocabulary_id: currentWord.id,
                exam_type: examType,
                rating,
                user_input: examType === 'spelling' ? spellingInput : undefined
            });

            setResults(prev => [...prev, {
                vocabulary_id: currentWord.id,
                english: currentWord.english,
                rating,
                next_review_display: response.next_review_display
            }]);

            if (currentIndex < queue.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setSpellingInput('');
                setShowAnswer(false);
                setIsCorrect(null);
            } else {
                setShowComplete(true);
            }
        } catch (err) {
            console.error('提交评分失败', err);
        }
    };

    // 拼写提交
    const handleSpellingSubmit = () => {
        if (!currentWord) return;
        const correct = spellingInput.trim().toLowerCase() === currentWord.english.toLowerCase();
        setIsCorrect(correct);
        setShowAnswer(true);
    };

    // 键盘事件
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (examType === 'spelling' && e.key === 'Enter' && !showAnswer) {
            handleSpellingSubmit();
        }
    };

    if (loading) {
        return (
            <div className="listening-content" style={{ display: 'flex', flex: 1 }}>
                <div className="loading-container" style={{ flex: 1 }}>
                    <div className="loading-spinner" />
                    <p style={{ marginTop: 16, color: '#888' }}>加载中...</p>
                </div>
            </div>
        );
    }

    // 完成界面
    if (showComplete) {
        const goodCount = results.filter(r => r.rating === 'good').length;
        const againCount = results.filter(r => r.rating === 'again').length;

        return (
            <>
                <div className="listening-sidebar">
                    <div className="sidebar-card">
                        <div className="sidebar-card-title">📝 考核类型</div>
                        <div className="filter-options">
                            <label className="filter-option">
                                <input
                                    type="radio"
                                    checked={examType === 'listening'}
                                    onChange={() => onTypeChange('listening')}
                                />
                                听力考核 ({dueCounts.listening})
                            </label>
                            <label className="filter-option">
                                <input
                                    type="radio"
                                    checked={examType === 'spelling'}
                                    onChange={() => onTypeChange('spelling')}
                                />
                                拼写考核 ({dueCounts.spelling})
                            </label>
                        </div>
                    </div>
                </div>
                <div className="listening-content">
                    <div className="content-panel">
                        <div className="panel-header">
                            <span className="panel-title">✅ 考核完成</span>
                        </div>
                        <div className="panel-body">
                            <div style={{ textAlign: 'center', padding: 40 }}>
                                <div style={{ fontSize: '3rem', marginBottom: 24 }}>🎉</div>
                                <h2 style={{ marginBottom: 16, color: '#333' }}>
                                    {examType === 'listening' ? '听力' : '拼写'}考核完成！
                                </h2>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 32 }}>
                                    <div>
                                        <div style={{ fontSize: '2rem', fontWeight: 600, color: '#5d7a64' }}>{goodCount}</div>
                                        <div style={{ color: '#888' }}>通过</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '2rem', fontWeight: 600, color: '#ef5350' }}>{againCount}</div>
                                        <div style={{ color: '#888' }}>不会</div>
                                    </div>
                                </div>

                                {/* 结果列表 */}
                                <div style={{ maxWidth: 400, margin: '0 auto', textAlign: 'left' }}>
                                    {results.slice(0, 8).map(r => (
                                        <div key={r.vocabulary_id} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            padding: '8px 0',
                                            borderBottom: '1px solid #eee'
                                        }}>
                                            <span>{r.english}</span>
                                            <span style={{ color: r.rating === 'good' ? '#5d7a64' : '#ef5350' }}>
                                                {r.rating === 'good' ? '✓' : '✗'} {r.next_review_display}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <button className="quick-btn" onClick={onComplete} style={{ marginTop: 32 }}>
                                    返回总览
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (queue.length === 0) {
        return (
            <>
                <div className="listening-sidebar">
                    <div className="sidebar-card">
                        <div className="sidebar-card-title">📝 考核类型</div>
                        <div className="filter-options">
                            <label className="filter-option">
                                <input
                                    type="radio"
                                    checked={examType === 'listening'}
                                    onChange={() => onTypeChange('listening')}
                                />
                                听力考核 ({dueCounts.listening})
                            </label>
                            <label className="filter-option">
                                <input
                                    type="radio"
                                    checked={examType === 'spelling'}
                                    onChange={() => onTypeChange('spelling')}
                                />
                                拼写考核 ({dueCounts.spelling})
                            </label>
                        </div>
                    </div>
                </div>
                <div className="listening-content">
                    <div className="content-panel">
                        <div className="empty-state">
                            <div className="empty-icon">✅</div>
                            <div className="empty-text">没有待考核的词汇</div>
                            <button className="quick-btn" onClick={onComplete}>
                                返回总览
                            </button>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <audio ref={audioRef} />

            {/* 左侧边栏 */}
            <div className="listening-sidebar">
                <div className="sidebar-card">
                    <div className="sidebar-card-title">📝 考核类型</div>
                    <div className="filter-options">
                        <label className="filter-option">
                            <input
                                type="radio"
                                checked={examType === 'listening'}
                                onChange={() => onTypeChange('listening')}
                            />
                            听力考核 ({dueCounts.listening})
                        </label>
                        <label className="filter-option">
                            <input
                                type="radio"
                                checked={examType === 'spelling'}
                                onChange={() => onTypeChange('spelling')}
                            />
                            拼写考核 ({dueCounts.spelling})
                        </label>
                    </div>
                </div>

                {/* 进度 */}
                <div className="sidebar-card">
                    <div className="sidebar-card-title">📊 进度</div>
                    <div className="stat-row">
                        <span className="stat-label">当前</span>
                        <span className="stat-value">{currentIndex + 1} / {queue.length}</span>
                    </div>
                    <div className="stat-row">
                        <span className="stat-label">通过</span>
                        <span className="stat-value success">
                            {results.filter(r => r.rating === 'good').length}
                        </span>
                    </div>
                    <div className="stat-row">
                        <span className="stat-label">不会</span>
                        <span className="stat-value danger">
                            {results.filter(r => r.rating === 'again').length}
                        </span>
                    </div>
                </div>
            </div>

            {/* 右侧主内容 */}
            <div className="listening-content">
                <div className="content-panel">
                    <div className="panel-header">
                        <span className="panel-title">
                            {examType === 'listening' ? '👂 听力考核' : '✍️ 拼写考核'}
                        </span>
                        <span style={{ color: '#888', fontSize: '0.9rem' }}>
                            {currentIndex + 1} / {queue.length}
                        </span>
                    </div>
                    <div className="panel-body">
                        <div className="flashcard-container">
                            {/* 考核卡片 */}
                            {currentWord && (
                                <div className="flashcard">
                                    {examType === 'listening' ? (
                                        // 听力考核
                                        <>
                                            <div style={{ color: '#888', marginBottom: 16 }}>听音频，想出中文意思</div>
                                            <button
                                                className="ctrl-btn play"
                                                onClick={playAudio}
                                                style={{ margin: '0 auto 16px' }}
                                            >
                                                🔊
                                            </button>
                                            {currentWord.ipa && (
                                                <div className="flashcard-ipa">{currentWord.ipa}</div>
                                            )}
                                        </>
                                    ) : (
                                        // 拼写考核
                                        <>
                                            <div style={{ color: '#888', marginBottom: 16 }}>看中文，拼写英文</div>
                                            <div className="flashcard-chinese" style={{ marginBottom: 8 }}>
                                                {currentWord.chinese}
                                            </div>
                                            <div className="flashcard-pos">{currentWord.pos}</div>

                                            <input
                                                ref={inputRef}
                                                type="text"
                                                className="spelling-input"
                                                value={spellingInput}
                                                onChange={e => setSpellingInput(e.target.value)}
                                                onKeyDown={handleKeyDown}
                                                placeholder="输入英文..."
                                                disabled={showAnswer}
                                            />

                                            {showAnswer && (
                                                <div className={`spelling-result ${isCorrect ? 'correct' : 'incorrect'}`}>
                                                    {isCorrect ? '✅ 正确!' : (
                                                        <>❌ 正确答案: <strong>{currentWord.english}</strong></>
                                                    )}
                                                </div>
                                            )}

                                            {!showAnswer && (
                                                <button className="quick-btn" onClick={handleSpellingSubmit}>
                                                    提交
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {/* 评分按钮 */}
                            {(examType === 'listening' || showAnswer) && (
                                <div className="exam-buttons">
                                    <button className="exam-btn again" onClick={() => handleRating('again')}>
                                        ❌ 不会
                                    </button>
                                    <button className="exam-btn good" onClick={() => handleRating('good')}>
                                        ✅ 会
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ExamPanel;
