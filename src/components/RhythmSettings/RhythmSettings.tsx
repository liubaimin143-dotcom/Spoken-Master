// 播放节奏设置面板
import { useState, useEffect } from 'react';
import type { PlaybackRhythm } from '../../pages/Listening/types';
import './RhythmSettings.css';

interface RhythmSettingsProps {
    rhythm: PlaybackRhythm;
    onChange: (rhythm: PlaybackRhythm) => void;
    onSave?: () => void;
}

const MAX_VALUE = 700;

export function RhythmSettings({ rhythm, onChange, onSave }: RhythmSettingsProps) {
    const [localRhythm, setLocalRhythm] = useState(rhythm);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        setLocalRhythm(rhythm);
    }, [rhythm]);

    const handleChange = (key: keyof PlaybackRhythm, value: number) => {
        const clampedValue = Math.max(0, Math.min(MAX_VALUE, value));
        const newRhythm = { ...localRhythm, [key]: clampedValue };
        setLocalRhythm(newRhythm);
        onChange(newRhythm);
    };

    const items: { key: keyof PlaybackRhythm; label: string; description: string }[] = [
        { key: 'english_gap', label: '英语重复间隔', description: '英语播放之间的间隔' },
        { key: 'english_chinese_gap', label: '英中过渡间隔', description: '英语与中文之间的间隔' },
        { key: 'pos_meaning_gap', label: '词性意思间隔', description: '词性与意思之间的间隔（TTS内部）' },
        { key: 'word_switch_gap', label: '单词切换间隔', description: '切换到下一个单词的间隔' },
    ];

    return (
        <div className="rhythm-settings">
            <button
                className="rhythm-settings__toggle"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <span className="rhythm-settings__icon">⏱️</span>
                <span className="rhythm-settings__toggle-label">播放节奏</span>
                <span className={`rhythm-settings__arrow ${isExpanded ? 'rhythm-settings__arrow--expanded' : ''}`}>
                    ▼
                </span>
            </button>

            {isExpanded && (
                <div className="rhythm-settings__content">
                    {items.map((item) => (
                        <div key={item.key} className="rhythm-settings__item">
                            <div className="rhythm-settings__item-header">
                                <label className="rhythm-settings__label">{item.label}</label>
                                <span className="rhythm-settings__value">
                                    {localRhythm[item.key]}ms
                                </span>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={MAX_VALUE}
                                step={50}
                                value={localRhythm[item.key]}
                                onChange={(e) => handleChange(item.key, parseInt(e.target.value))}
                                className="rhythm-settings__slider"
                            />
                            <p className="rhythm-settings__description">{item.description}</p>
                        </div>
                    ))}

                    {onSave && (
                        <button className="rhythm-settings__save" onClick={onSave}>
                            💾 保存设置
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
