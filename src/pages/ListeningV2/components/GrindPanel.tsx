/**
 * 磨耳朵面板 - 左侧词汇列表 + 右侧闪卡
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { VocabularyV2 } from '../types';
import * as api from '../api';

interface GrindPanelProps {
    mode: 'normal' | 'free';
    onComplete: () => void;
    onModeChange: (mode: 'normal' | 'free') => void;
}

const GrindPanel: React.FC<GrindPanelProps> = ({
    mode,
    onComplete,
    onModeChange
}) => {
    const [queue, setQueue] = useState<VocabularyV2[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showChinese, setShowChinese] = useState(false);
    const [loading, setLoading] = useState(true);
    const [phase, setPhase] = useState<'idle' | 'english' | 'chinese'>('idle');
    const [repeatCount, setRepeatCount] = useState(0);
    const [filter, setFilter] = useState<'all' | 'pending' | 'difficult'>('pending');

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const playingRef = useRef(false);

    // 加载队列
    useEffect(() => {
        const loadQueue = async () => {
            setLoading(true);
            try {
                let data: VocabularyV2[];
                if (mode === 'normal') {
                    data = await api.getGrindQueue();
                } else {
                    data = await api.getAllVocabulary();
                }
                setQueue(shuffleArray(data));
                setCurrentIndex(0);
            } catch (err) {
                console.error('加载队列失败', err);
            }
            setLoading(false);
        };
        loadQueue();
    }, [mode]);

    // 随机打乱
    const shuffleArray = <T,>(arr: T[]): T[] => {
        const result = [...arr];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    };

    // 过滤后的队列
    const filteredQueue = queue.filter(v => {
        if (filter === 'all') return true;
        if (filter === 'pending') return v.grind_count < v.grind_target;
        if (filter === 'difficult') return v.in_difficult_group;
        return true;
    });

    const currentWord = filteredQueue[currentIndex];

    // 播放音频
    const playAudio = useCallback(async (url: string): Promise<void> => {
        return new Promise((resolve) => {
            if (audioRef.current) {
                audioRef.current.src = url;
                audioRef.current.onended = () => resolve();
                audioRef.current.onerror = () => resolve();
                audioRef.current.play().catch(() => resolve());
            } else {
                resolve();
            }
        });
    }, []);

    // 等待
    const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

    // 播放序列
    const playSequence = useCallback(async () => {
        if (!currentWord) return;

        playingRef.current = true;
        setShowChinese(false);

        // 英语播放3遍
        for (let i = 1; i <= 3; i++) {
            if (!playingRef.current) return;
            setPhase('english');
            setRepeatCount(i);

            if (currentWord.audio_file_id) {
                const url = api.getAudioUrl(currentWord.audio_file_id);
                await playAudio(url);
            }
            await wait(500);
        }

        if (!playingRef.current) return;

        // 显示中文
        setPhase('chinese');
        setShowChinese(true);
        await wait(700);

        // 播放中文 TTS
        if (currentWord.chinese) {
            try {
                const text = `${currentWord.pos || ''}，${currentWord.chinese}`;
                const ttsUrl = await api.getTTSUrl(text);
                await playAudio(ttsUrl);
            } catch (err) {
                console.error('TTS 失败', err);
            }
        }
        await wait(600);

        // 更新进度（正常模式）
        if (mode === 'normal' && playingRef.current) {
            try {
                const result = await api.updateGrindProgress({
                    vocabulary_id: currentWord.id,
                    increment: 1
                });

                if (result.completed) {
                    setQueue(prev => prev.filter(v => v.id !== currentWord.id));
                } else {
                    setQueue(prev => prev.map(v =>
                        v.id === currentWord.id
                            ? { ...v, grind_count: result.grind_count }
                            : v
                    ));
                }
            } catch (err) {
                console.error('更新进度失败', err);
            }
        }

        // 下一个
        if (playingRef.current) {
            if (currentIndex < filteredQueue.length - 1) {
                setCurrentIndex(prev => prev + 1);
            } else if (mode === 'free') {
                setCurrentIndex(0);
                setQueue(shuffleArray(queue));
            } else {
                setIsPlaying(false);
                playingRef.current = false;
                setPhase('idle');
                if (filteredQueue.length <= 1) {
                    onComplete();
                }
            }
        }
    }, [currentWord, currentIndex, filteredQueue.length, mode, queue, playAudio, onComplete]);

    // 自动播放
    useEffect(() => {
        if (isPlaying && currentWord && playingRef.current) {
            playSequence();
        }
    }, [isPlaying, currentIndex]);

    // 控制函数
    const handlePlay = () => {
        playingRef.current = true;
        setIsPlaying(true);
        playSequence();
    };

    const handlePause = () => {
        playingRef.current = false;
        setIsPlaying(false);
        setPhase('idle');
        if (audioRef.current) {
            audioRef.current.pause();
        }
    };

    const handleNext = () => {
        if (currentIndex < filteredQueue.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setShowChinese(false);
            setPhase('idle');
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setShowChinese(false);
            setPhase('idle');
        }
    };

    const handleSelectWord = (index: number) => {
        handlePause();
        setCurrentIndex(index);
        setShowChinese(false);
    };

    if (loading) {
        return (
            <div className="listening-content">
                <div className="loading-container">
                    <div className="loading-spinner" />
                    <p style={{ marginTop: 16, color: '#888' }}>加载中...</p>
                </div>
            </div>
        );
    }

    if (filteredQueue.length === 0) {
        return (
            <>
                <div className="listening-sidebar">
                    <div className="sidebar-card">
                        <div className="sidebar-card-title">🎵 模式</div>
                        <div className="filter-options">
                            <label className="filter-option">
                                <input
                                    type="radio"
                                    checked={mode === 'normal'}
                                    onChange={() => onModeChange('normal')}
                                />
                                正常流程
                            </label>
                            <label className="filter-option">
                                <input
                                    type="radio"
                                    checked={mode === 'free'}
                                    onChange={() => onModeChange('free')}
                                />
                                自由循环
                            </label>
                        </div>
                    </div>
                </div>
                <div className="listening-content">
                    <div className="content-panel">
                        <div className="empty-state">
                            <div className="empty-icon">🎉</div>
                            <div className="empty-text">没有待磨耳朵的词汇</div>
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
            {/* 隐藏音频 */}
            <audio ref={audioRef} />

            {/* 左侧边栏 - 词汇列表 */}
            <div className="listening-sidebar">
                {/* 模式选择 */}
                <div className="sidebar-card">
                    <div className="sidebar-card-title">🎵 模式</div>
                    <div className="filter-options">
                        <label className="filter-option">
                            <input
                                type="radio"
                                checked={mode === 'normal'}
                                onChange={() => onModeChange('normal')}
                            />
                            正常流程
                        </label>
                        <label className="filter-option">
                            <input
                                type="radio"
                                checked={mode === 'free'}
                                onChange={() => onModeChange('free')}
                            />
                            自由循环
                        </label>
                    </div>
                </div>

                {/* 筛选 */}
                {mode === 'free' && (
                    <div className="sidebar-card">
                        <div className="sidebar-card-title">🔍 筛选</div>
                        <div className="filter-options">
                            <label className="filter-option">
                                <input
                                    type="radio"
                                    checked={filter === 'all'}
                                    onChange={() => setFilter('all')}
                                />
                                全部 ({queue.length})
                            </label>
                            <label className="filter-option">
                                <input
                                    type="radio"
                                    checked={filter === 'pending'}
                                    onChange={() => setFilter('pending')}
                                />
                                未完成
                            </label>
                            <label className="filter-option">
                                <input
                                    type="radio"
                                    checked={filter === 'difficult'}
                                    onChange={() => setFilter('difficult')}
                                />
                                不会的
                            </label>
                        </div>
                    </div>
                )}

                {/* 词汇列表 */}
                <div className="sidebar-card" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div className="sidebar-card-title">📋 播放列表 ({filteredQueue.length})</div>
                    <ul className="vocab-list" style={{ flex: 1, overflowY: 'auto' }}>
                        {filteredQueue.map((v, i) => (
                            <li
                                key={v.id}
                                className={`vocab-item ${i === currentIndex ? 'active' : ''}`}
                                onClick={() => handleSelectWord(i)}
                            >
                                <span className="vocab-english">{v.english}</span>
                                <span className="vocab-progress">{v.grind_count}/{v.grind_target}</span>
                                <span className={`vocab-status ${v.grind_count >= v.grind_target ? 'complete' : v.grind_count > 0 ? 'grinding' : 'pending'}`} />
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* 右侧主内容 - 闪卡 */}
            <div className="listening-content">
                <div className="content-panel">
                    <div className="panel-header">
                        <span className="panel-title">
                            {mode === 'normal' ? '🎵 正常流程' : '🔄 自由循环'}
                        </span>
                        <span style={{ color: '#888', fontSize: '0.9rem' }}>
                            {currentIndex + 1} / {filteredQueue.length}
                        </span>
                    </div>
                    <div className="panel-body">
                        <div className="flashcard-container">
                            {/* 闪卡 */}
                            {currentWord && (
                                <div className="flashcard">
                                    <div className="flashcard-english">{currentWord.english}</div>
                                    {currentWord.ipa && (
                                        <div className="flashcard-ipa">{currentWord.ipa}</div>
                                    )}
                                    {showChinese && (
                                        <>
                                            <div className="flashcard-divider" />
                                            <div className="flashcard-pos">{currentWord.pos}</div>
                                            <div className="flashcard-chinese">{currentWord.chinese}</div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* 进度 */}
                            <div className="progress-indicator">
                                <div className="progress-item">
                                    <div className="progress-value">
                                        {currentWord?.grind_count || 0}/{currentWord?.grind_target || 8}
                                    </div>
                                    <div className="progress-label">本词进度</div>
                                </div>
                                {isPlaying && (
                                    <div className="progress-item">
                                        <div className="progress-value">
                                            {phase === 'english' ? `E${repeatCount}` : phase === 'chinese' ? 'C' : '-'}
                                        </div>
                                        <div className="progress-label">播放阶段</div>
                                    </div>
                                )}
                            </div>

                            {/* 控制按钮 */}
                            <div className="control-buttons">
                                <button className="ctrl-btn" onClick={handlePrev} disabled={currentIndex === 0}>
                                    ⏮
                                </button>
                                {!isPlaying ? (
                                    <button className="ctrl-btn play" onClick={handlePlay}>
                                        ▶
                                    </button>
                                ) : (
                                    <button className="ctrl-btn play" onClick={handlePause}>
                                        ⏸
                                    </button>
                                )}
                                <button className="ctrl-btn" onClick={handleNext} disabled={currentIndex >= filteredQueue.length - 1}>
                                    ⏭
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default GrindPanel;
