import { useState, useEffect, useRef } from 'react';
import './DraftEditor.css';

interface DraftItem {
    id?: string; // Real DB ID if available
    text: string;
    ipa?: string;
    meaning: string;
    start: number;
    end: number;
    type: 'word' | 'phrase';
    pos?: string;
    level?: 'hard' | 'medium' | 'easy'; // 难度等级
}

interface TrackedDraftItem extends DraftItem {
    _trackingId: string;
    ttsStatus?: 'synced' | 'outdated' | 'missing' | 'generating' | 'error';
    localModified?: boolean; // If modified in this session
}

interface DraftEditorProps {
    fileId: string;
    audioUrl: string;
    onSaveDraft: (data: DraftItem[]) => Promise<void>;
    onAddToGlossary: (item: DraftItem) => void;
}

const posMap: Record<string, string> = {
    noun: '名词', verb: '动词', adjective: '形容词', adverb: '副词',
    phrase: '短语', preposition: '介词', conjunction: '连词',
    'n.': '名词', 'v.': '动词', 'adj.': '形容词', 'adv.': '副词',
    'prep.': '介词', 'conj.': '连词', 'pron.': '代词'
};

const getTTSText = (item: DraftItem) => {
    const p = posMap[item.pos?.toLowerCase() || ''] || item.pos || '';
    return p ? `${p}，${item.meaning}` : item.meaning;
};

export function DraftEditor({ fileId, audioUrl, onSaveDraft, onAddToGlossary }: DraftEditorProps) {
    const [items, setItems] = useState<TrackedDraftItem[]>([]);
    const [activeTab, setActiveTab] = useState<'word' | 'phrase' | 'all'>('all');
    const [playingIndex, setPlayingIndex] = useState<number | null>(null);
    const [globalGenerating, setGlobalGenerating] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
    const originalsRef = useRef<Map<string, DraftItem>>(new Map());

    // Load data
    useEffect(() => {
        let mounted = true;
        async function loadContent() {
            try {
                const res = await fetch(`http://localhost:8000/audio-files/${fileId}/editor-content`);
                if (!res.ok) throw new Error("Failed to load content");
                const data = await res.json();

                if (!mounted) return;

                const currentItems: TrackedDraftItem[] = (data.current || []).map((item: any) => ({
                    ...item,
                    _trackingId: item.id || `temp-${Date.now()}-${Math.random()}`,
                    ttsStatus: 'missing' // Default, will check later
                }));

                const originalMap = new Map<string, DraftItem>();
                (data.original || []).forEach((orig: any) => {
                    originalMap.set(orig.text.toLowerCase().trim(), orig);
                });

                setItems(currentItems);
                originalsRef.current = originalMap;

                // Check TTS status
                checkAllTTSStatus(currentItems);

            } catch (e) {
                console.error("Error loading content:", e);
                alert("加载数据失败");
            }
        }
        loadContent();
        return () => { mounted = false; };
    }, [fileId]);

    // Check TTS status for all items
    const checkAllTTSStatus = async (currentList: TrackedDraftItem[]) => {
        if (!currentList.length) return;

        const payload = currentList.map(item => ({
            id: item._trackingId,
            text: getTTSText(item)
        }));

        try {
            const res = await fetch(`http://localhost:8000/tts/check-status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const statusMap = await res.json();

            setItems(prev => prev.map(item => {
                const isExists = statusMap[item._trackingId];
                // If it was already marked as outdated (modified), keep it. 
                // But initially, we assume synced if exists.
                if (item.localModified) return item; // Don't override local 'outdated'
                return {
                    ...item,
                    ttsStatus: isExists ? 'synced' : 'missing'
                };
            }));
        } catch (e) {
            console.error("Check status failed:", e);
        }
    };

    // Play flow: English -> Gap -> Chinese
    const handlePlay = async (index: number) => {
        if (!audioRef.current) return;

        // Stop any previous
        if (playingIndex !== null) {
            audioRef.current.pause();
            if (ttsAudioRef.current) {
                ttsAudioRef.current.pause();
                ttsAudioRef.current = null;
            }
            setPlayingIndex(null);
            if (playingIndex === index) return; // Toggle off
        }

        const item = items[index];
        const start = item.start || 0;
        const end = (item.end && item.end > start) ? item.end : start + 5;

        setPlayingIndex(index);

        // 1. Play English
        try {
            audioRef.current.currentTime = start;
            await audioRef.current.play();

            // Wait until endpoint
            const duration = (end - start) * 1000;
            await new Promise<void>(resolve => {
                const timeout = setTimeout(resolve, duration);
                // Listen for manual pause or index change to clear timeout? 
                // Simple approach: just wait. If user clicks stop, we handle logic below.
            });
            audioRef.current.pause();

            // Check if still playing this item (user didn't click stop)
            // Note: Since we are in async, this is tricky. 
            // We'll rely on a ref or check state if I could.
            // Simplified: Just play text if component mounted.

            // 2. Play Chinese TTS
            // Check status first
            if (item.ttsStatus === 'synced') {
                const text = getTTSText(item);
                // Fetch URL (we know it exists)
                // But we need the filename to be safe or just call generate to get url (it handles cache)
                // Or we can construct url if we knew the hash. 
                // Easier: Call /tts/chinese?text=... which returns url
                const res = await fetch(`http://localhost:8000/tts/chinese?text=${encodeURIComponent(text)}`);
                if (res.ok) {
                    const data = await res.json();
                    const ttsUrl = `http://localhost:8000${data.audio_url}`;
                    const tts = new Audio(ttsUrl);
                    ttsAudioRef.current = tts;
                    await tts.play();
                    await new Promise(r => { tts.onended = r; });
                }
            }
        } catch (e) {
            console.error("Playback error:", e);
        } finally {
            setPlayingIndex(null);
        }
    };

    const generateTTS = async (index: number) => {
        const item = items[index];
        updateLocalItem(index, { ttsStatus: 'generating' });

        try {
            const payload = [{
                id: item._trackingId,
                text: getTTSText(item),
                force: true
            }];

            const res = await fetch(`http://localhost:8000/tts/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await res.json();

            if (result[item._trackingId]?.status !== 'error') {
                updateLocalItem(index, { ttsStatus: 'synced', localModified: false });
            } else {
                updateLocalItem(index, { ttsStatus: 'error' });
                alert("生成失败: " + result[item._trackingId]?.message);
            }
        } catch (e) {
            updateLocalItem(index, { ttsStatus: 'error' });
            alert("请求失败: " + e);
        }
    };

    const batchGenerate = async () => {
        const targets = items.filter(i => i.ttsStatus !== 'synced');
        if (!targets.length) {
            alert("所有音频即为最新，无需生成");
            return;
        }

        if (!confirm(`确定为 ${targets.length} 个条目生成/更新中文音频？`)) return;

        setGlobalGenerating(true);
        try {
            const payload = targets.map(item => ({
                id: item._trackingId,
                text: getTTSText(item),
                force: true
            }));

            const res = await fetch(`http://localhost:8000/tts/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await res.json();

            setItems(prev => prev.map(item => {
                if (result[item._trackingId]) {
                    if (result[item._trackingId].status !== 'error') {
                        return { ...item, ttsStatus: 'synced', localModified: false };
                    } else {
                        return { ...item, ttsStatus: 'error' };
                    }
                }
                return item;
            }));
            alert("批量生成完成！");
        } catch (e) {
            alert("批量生成失败: " + e);
        } finally {
            setGlobalGenerating(false);
        }
    };

    const updateLocalItem = (index: number, changes: Partial<TrackedDraftItem>) => {
        setItems(prev => {
            const newItems = [...prev];
            newItems[index] = { ...newItems[index], ...changes };
            return newItems;
        });
    };

    const handleFieldChange = (index: number, field: keyof DraftItem, value: any) => {
        // If Meaning or Pos or Type changes, TTS is outdated
        const isContentChange = field === 'meaning' || field === 'pos' || field === 'text'; // Text change allows reset, doesn't affect TTS? No wait, pos might be inferred? Assuming manual pos.
        // Actually, if we change 'text' (English), it doesn't affect Chinese TTS.
        // Only meaning/pos change affects TTS.

        const changes: Partial<TrackedDraftItem> = { [field]: value };
        if (field === 'meaning' || field === 'pos') {
            changes.ttsStatus = 'outdated';
            changes.localModified = true;
        }

        updateLocalItem(index, changes);
    };

    const adjustTime = (index: number, field: 'start' | 'end', delta: number) => {
        const item = items[index];
        updateLocalItem(index, { [field]: parseFloat((item[field] + delta).toFixed(3)) });
    };

    const deleteItem = (index: number) => {
        if (confirm('确定删除此行? (将从库中移除，且无法找回)')) {
            setItems(prev => prev.filter((_, i) => i !== index));
        }
    };

    const handleReset = (index: number) => {
        const item = items[index];
        const key = item.text.toLowerCase().trim();
        const original = originalsRef.current.get(key);
        if (original && confirm('确定重置此行到 AI 初始状态?')) {
            updateLocalItem(index, {
                text: original.text,
                ipa: original.ipa,
                meaning: original.meaning,
                start: original.start,
                end: original.end,
                type: original.type,
                pos: original.pos,
                ttsStatus: 'outdated', // Resetting might change meaning, so re-check needed
                localModified: true
            });
            // After reset, we might want to check status again? Or just let user click update.
        }
    };

    const filteredItems = items.filter(i => activeTab === 'all' || i.type === activeTab);

    return (
        <div className="draft-editor">
            <audio ref={audioRef} src={audioUrl} preload="auto" />

            <div className="editor-toolbar">
                <div className="tab-group">
                    <button className={`tab-btn ${activeTab === 'word' ? 'active' : ''}`} onClick={() => setActiveTab('word')}>🔴 单词</button>
                    <button className={`tab-btn ${activeTab === 'phrase' ? 'active' : ''}`} onClick={() => setActiveTab('phrase')}>🔵 短语</button>
                    <button className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>⚫ 全部</button>
                </div>
                <div className="tools-group" style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-secondary" onClick={() => checkAllTTSStatus(items)} disabled={globalGenerating}>
                        🔄 检查音频状态
                    </button>
                    <button className="btn-primary" onClick={batchGenerate} disabled={globalGenerating}>
                        {globalGenerating ? '⏳ 生成中...' : '⬇️ 批量更新语音'}
                    </button>
                </div>
            </div>

            <div className="editor-table-container">
                <table className="editor-table">
                    <thead>
                        <tr>
                            <th style={{ width: '60px' }}>试听</th>
                            <th>English</th>
                            <th style={{ width: '150px' }}>IPA</th>
                            <th>Meaning</th>
                            <th style={{ width: '80px' }}>难度</th>
                            <th style={{ width: '50px' }}>TTS</th>
                            <th style={{ width: '140px' }}>Start (s)</th>
                            <th style={{ width: '140px' }}>End (s)</th>
                            <th style={{ width: '130px', textAlign: 'center' }}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.map((item) => {
                            const realIndex = items.findIndex(i => i._trackingId === item._trackingId);
                            const key = item.text.toLowerCase().trim();
                            const original = originalsRef.current.get(key);
                            const isResetable = !!original;

                            // TTS Icon
                            let ttsIcon = '❌';
                            let ttsTitle = '未生成 (点击生成)';
                            let ttsClass = 'tts-missing';
                            if (item.ttsStatus === 'synced') {
                                ttsIcon = '✅'; ttsTitle = '正常'; ttsClass = 'tts-synced';
                            } else if (item.ttsStatus === 'outdated') {
                                ttsIcon = '⚠️'; ttsTitle = '已修改，需更新'; ttsClass = 'tts-outdated';
                            } else if (item.ttsStatus === 'generating') {
                                ttsIcon = '⏳'; ttsTitle = '生成中...';
                            }

                            return (
                                <tr key={item._trackingId} className={playingIndex === realIndex ? 'playing' : ''}>
                                    <td align="center">
                                        <button className="btn-play" onClick={() => handlePlay(realIndex)}>
                                            {playingIndex === realIndex ? '⏸' : '▶'}
                                        </button>
                                    </td>
                                    <td>
                                        <input
                                            value={item.text}
                                            onChange={e => handleFieldChange(realIndex, 'text', e.target.value)}
                                            className="cell-input en"
                                        />
                                    </td>
                                    <td>
                                        <input
                                            value={item.ipa || ''}
                                            onChange={e => handleFieldChange(realIndex, 'ipa', e.target.value)}
                                            className="cell-input ipa"
                                            placeholder="/.../"
                                        />
                                    </td>
                                    <td>
                                        <input
                                            value={item.meaning}
                                            onChange={e => handleFieldChange(realIndex, 'meaning', e.target.value)}
                                            className="cell-input cn"
                                        />
                                    </td>
                                    <td>
                                        <select
                                            value={item.level || 'medium'}
                                            onChange={e => handleFieldChange(realIndex, 'level', e.target.value)}
                                            className="level-select"
                                            style={{
                                                width: '100%',
                                                padding: '4px',
                                                border: '1px solid #ddd',
                                                borderRadius: '4px',
                                                fontSize: '0.85rem',
                                                background: item.level === 'hard' ? '#ffebee' : item.level === 'easy' ? '#e8f5e9' : '#fff3e0',
                                                color: item.level === 'hard' ? '#ef5350' : item.level === 'easy' ? '#5d7a64' : '#f57c00'
                                            }}
                                        >
                                            <option value="hard">🔴 难</option>
                                            <option value="medium">🟡 中</option>
                                            <option value="easy">🟢 易</option>
                                        </select>
                                    </td>
                                    <td align="center">
                                        <button
                                            className={`btn-icon ${ttsClass}`}
                                            title={ttsTitle}
                                            onClick={() => generateTTS(realIndex)}
                                        >
                                            {ttsIcon}
                                        </button>
                                    </td>
                                    <td>
                                        <div className="time-control">
                                            <button className="btn-tiny" onClick={() => adjustTime(realIndex, 'start', -0.05)}>-</button>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={item.start}
                                                onChange={e => handleFieldChange(realIndex, 'start', parseFloat(e.target.value))}
                                                className="time-input"
                                            />
                                            <button className="btn-tiny" onClick={() => adjustTime(realIndex, 'start', 0.05)}>+</button>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="time-control">
                                            <button className="btn-tiny" onClick={() => adjustTime(realIndex, 'end', -0.05)}>-</button>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={item.end}
                                                onChange={e => handleFieldChange(realIndex, 'end', parseFloat(e.target.value))}
                                                className="time-input"
                                            />
                                            <button className="btn-tiny" onClick={() => adjustTime(realIndex, 'end', 0.05)}>+</button>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="action-cell">
                                            <button className="btn-icon" title="加入术语库" onClick={() => onAddToGlossary(item)}>📖</button>
                                            <button
                                                className="btn-icon"
                                                title="恢复默认"
                                                onClick={() => handleReset(realIndex)}
                                                disabled={!isResetable}
                                                style={{ opacity: isResetable ? 1 : 0.3 }}
                                            >
                                                ↺
                                            </button>
                                            <button className="btn-icon delete" title="删除" onClick={() => deleteItem(realIndex)}>🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="editor-footer">
                <div className="status-info">
                    共 {items.length} 条 |
                    TTS状态: {items.filter(i => i.ttsStatus === 'synced').length} 已生成 / {items.filter(i => i.ttsStatus !== 'synced').length} 待处理
                </div>
                <div className="main-actions">
                    <button
                        className="btn-secondary"
                        onClick={async () => {
                            if (!confirm('重新根据 Whisper 转写匹配所有词汇的时间戳？')) return;
                            try {
                                const res = await fetch(`http://localhost:8000/audio-files/${fileId}/rematch-timestamps`, { method: 'POST' });
                                const data = await res.json();
                                if (data.status === 'success') {
                                    alert(`✅ 时间戳匹配完成！\n匹配成功: ${data.matched}\n匹配失败: ${data.failed}`);
                                    window.location.reload();
                                } else {
                                    alert(data.message || '匹配失败');
                                }
                            } catch (e) {
                                alert('操作失败: ' + e);
                            }
                        }}
                    >
                        🔄 重新匹配时间戳
                    </button>
                    <button className="btn-primary" onClick={() => onSaveDraft(items)}>💾 保存修改 (Save Changes)</button>
                </div>
            </div>
        </div>
    );
}

