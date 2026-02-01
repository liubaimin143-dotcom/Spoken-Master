// 闪卡组件
import { useState, useEffect } from 'react';
import type { VocabularyItem, CardFace } from '../../pages/Listening/types';
import './FlashCard.css';

interface FlashCardProps {
    word: VocabularyItem | null;
    showBack?: boolean;
    isPlaying?: boolean;
    currentPhase?: string;
    onMarkDifficult?: () => void;
    onDelete?: () => void;
    onPrev?: () => void;
    onNext?: () => void;
    canPrev?: boolean;
    canNext?: boolean;
}

export function FlashCard({
    word,
    showBack = false,
    isPlaying = false,
    currentPhase = '',
    onMarkDifficult,
    onDelete,
    onPrev,
    onNext,
    canPrev = true,
    canNext = true,
}: FlashCardProps) {
    const [isFlipped, setIsFlipped] = useState(showBack);

    useEffect(() => {
        setIsFlipped(showBack);
    }, [showBack]);

    // 词性翻译
    const posMap: Record<string, string> = {
        noun: '名词',
        verb: '动词',
        adjective: '形容词',
        adverb: '副词',
        phrase: '短语',
        preposition: '介词',
        conjunction: '连词',
        'n.': '名词',
        'v.': '动词',
        'adj.': '形容词',
        'adv.': '副词',
    };

    const getPos = () => {
        if (!word?.pos) return '';
        return posMap[word.pos.toLowerCase()] || word.pos;
    };

    if (!word) {
        return (
            <div className="flash-card flash-card--empty">
                <div className="flash-card__content">
                    <div className="flash-card__placeholder">
                        <span className="flash-card__icon">🎧</span>
                        <p>选择单词开始学习</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flash-card-container">
            <div className={`flash-card ${isFlipped ? 'flash-card--flipped' : ''}`}>
                {/* 正面 */}
                <div className="flash-card__face flash-card__front">
                    <div className="flash-card__content">
                        {isPlaying ? (
                            <>
                                <div className="flash-card__playing-icon">
                                    <span className="playing-animation">🔊</span>
                                </div>
                                <p className="flash-card__phase">{currentPhase}</p>
                            </>
                        ) : (
                            <>
                                <span className="flash-card__icon-static">🔊</span>
                                <p className="flash-card__hint">点击翻转查看</p>
                            </>
                        )}
                    </div>
                </div>

                {/* 背面 */}
                <div className="flash-card__face flash-card__back">
                    <div className="flash-card__content">
                        <h2 className="flash-card__english">{word.english}</h2>
                        {word.pos && (
                            <span className="flash-card__pos">{getPos()}</span>
                        )}
                        <p className="flash-card__chinese">{word.chinese}</p>
                        {word.context && (
                            <p className="flash-card__context">"{word.context}"</p>
                        )}
                    </div>
                </div>
            </div>

            {/* 控制按钮 */}
            <div className="flash-card__controls">
                <button
                    className="flash-card__btn flash-card__btn--prev"
                    onClick={onPrev}
                    disabled={!canPrev}
                    title="上一个"
                >
                    ◀
                </button>

                <button
                    className="flash-card__btn flash-card__btn--mark"
                    onClick={onMarkDifficult}
                    title="标记为不会"
                >
                    ⭐ 标记不会
                </button>

                <button
                    className="flash-card__btn flash-card__btn--delete"
                    onClick={onDelete}
                    title="删除单词"
                    style={{ marginLeft: '0.5rem', borderColor: '#ef4444', color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}
                >
                    🗑️ 删除
                </button>

                <button
                    className="flash-card__btn flash-card__btn--next"
                    onClick={onNext}
                    disabled={!canNext}
                    title="下一个"
                >
                    ▶
                </button>
            </div>
        </div>
    );
}
