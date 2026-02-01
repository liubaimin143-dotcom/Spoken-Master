
import { useState, useEffect, useCallback } from 'react';
import { DirectoryTree } from './DirectoryTree';
import { DraftEditor } from './DraftEditor';
import './Studio.css';

const API_BASE = 'http://localhost:8000';


interface GlossaryItem {
    id: string;
    english: string;
    chinese: string;
    pos?: string;
}

// ===== API 工具函数 (Helpers) =====
async function fetchJson(url: string) {
    const res = await fetch(`${API_BASE}${url}`);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${res.status}`);
    }
    return res.json();
}


async function postJson(url: string, data: unknown) {
    const res = await fetch(`${API_BASE}${url}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return res.json();
}

async function putJson(url: string, data: unknown) {
    const res = await fetch(`${API_BASE}${url}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return res.json();
}

async function deleteJson(url: string) {
    const res = await fetch(`${API_BASE}${url}`, {
        method: 'DELETE',
    });
    return res.json();
}


// ===== 上传面板 (Updated with Hierarchy) =====
function UploadPanel({ isOpen, onClose, onSuccess }: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}) {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState('');

    // Hierarchy Metadata
    const [year, setYear] = useState('2024');
    const [section, setSection] = useState('Listening');
    const [part, setPart] = useState('Part 1');
    const [test, setTest] = useState('Test 1');

    // Helper: 解析 SSE 流并提取完整内容
    const parseSSEStream = async (response: Response): Promise<string> => {
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let fullContent = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                    try {
                        const json = JSON.parse(line.slice(6));
                        const delta = json.choices?.[0]?.delta?.content;
                        if (delta) fullContent += delta;
                    } catch {
                        // Skip non-JSON lines
                    }
                }
            }
        }
        return fullContent;
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setStatus('📤 上传音频文件...');

        try {
            // Step 1: 上传并转写
            const formData = new FormData();
            formData.append('file', file);
            formData.append('year', year);
            formData.append('section', section);
            formData.append('test', test);
            formData.append('part', part);

            setStatus('🎙️ Whisper 转写中...');
            const res = await fetch(`${API_BASE}/transcribe`, { method: 'POST', body: formData });
            if (!res.ok) throw new Error(await res.text());

            const transcribeResult = await res.json();
            const audioId = transcribeResult.id;
            const transcribedText = transcribeResult.text || '';

            // Step 2: 获取提示词
            setStatus('🤖 AI 提取词汇中...');
            const promptRes = await fetchJson('/prompts/vocab_extraction');
            const systemPrompt = promptRes.content || '';

            // Debug logging
            console.log('=== AI Call Debug ===');
            console.log('audioId:', audioId);
            console.log('transcribedText length:', transcribedText.length);
            console.log('transcribedText preview:', transcribedText.substring(0, 200));
            console.log('systemPrompt length:', systemPrompt.length);
            console.log('Condition check:', {
                hasPrompt: !!systemPrompt,
                hasText: !!transcribedText,
                hasAudioId: !!audioId
            });

            if (systemPrompt && transcribedText && audioId) {
                console.log('✓ Calling AI API...');
                try {
                    // Step 3: 调用 AI Chat (SSE 流式)
                    const aiRes = await fetch(`${API_BASE}/ai/chat`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            system_prompt: systemPrompt,
                            user_content: transcribedText,
                            include_glossary: true
                        })
                    });

                    if (aiRes.ok) {
                        const fullContent = await parseSSEStream(aiRes);
                        console.log('AI raw response:', fullContent);

                        // 尝试提取 JSON 数组
                        const jsonMatch = fullContent.match(/\[[\s\S]*\]/);
                        if (jsonMatch) {
                            const vocabItems = JSON.parse(jsonMatch[0]);
                            console.log('Parsed vocab items:', vocabItems);

                            // Step 4: 保存结果 (AI Init)
                            await postJson(`/audio-files/${audioId}/ai-finish`, { items: vocabItems });
                        } else {
                            console.warn('No JSON array found in AI response');
                        }
                    } else {
                        console.warn('AI chat failed:', await aiRes.text());
                    }
                } catch (aiErr) {
                    console.warn('AI extraction error:', aiErr);
                    // 不阻断流程，Whisper 结果仍可用
                }
            } else {
                console.warn('⚠️ AI call skipped! Missing:', {
                    systemPrompt: systemPrompt ? 'OK' : 'MISSING',
                    transcribedText: transcribedText ? 'OK' : 'MISSING',
                    audioId: audioId ? 'OK' : 'MISSING'
                });
            }

            setStatus('');
            onSuccess?.(); // Refresh tree
            onClose();
            alert('✅ 上传并处理成功！');
        } catch (err) {
            setStatus('');
            alert(`上传失败: ${err}`);
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-panel" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>📤 上传素材</h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    <div className="form-group">
                        <label>选择音频文件</label>
                        <input type="file" accept="audio/*" onChange={e => setFile(e.target.files?.[0] || null)} />
                    </div>

                    <div className="form-row">
                        <div className="form-group half">
                            <label>年份 (Year)</label>
                            <select value={year} onChange={e => setYear(e.target.value)}>
                                <option value="2024">2024</option>
                                <option value="2025">2025</option>
                            </select>
                        </div>
                        <div className="form-group half">
                            <label>板块 (Section)</label>
                            <select value={section} onChange={e => setSection(e.target.value)}>
                                <option value="Listening">🎧 Listening</option>
                                <option value="Reading">📖 Reading</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group half">
                            <label>测试 (Test)</label>
                            <select value={test} onChange={e => setTest(e.target.value)}>
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={`Test ${i + 1}`}>Test {i + 1}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group half">
                            <label>部分 (Part)</label>
                            <select value={part} onChange={e => setPart(e.target.value)}>
                                {Array.from({ length: 7 }, (_, i) => (
                                    <option key={i + 1} value={`Part ${i + 1}`}>Part {i + 1}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {status && <div className="upload-status">{status}</div>}
                </div>
                <div className="modal-footer">
                    <button className="btn-cancel" onClick={onClose}>取消</button>
                    <button className="btn-primary" onClick={handleUpload} disabled={!file || uploading}>
                        {uploading ? '⏳ 处理中...' : '开始上传'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ===== API 设置面板 (Keep Original) =====
function ApiSettingsPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [config, setConfig] = useState({ api_base: '', api_key: '', model: 'gemini-3-flash' });

    useEffect(() => {
        if (isOpen) {
            fetchJson('/ai/config').then(data => setConfig({ ...data, api_key: '' }));
        }
    }, [isOpen]);

    const handleSave = async () => {
        await postJson('/ai/config', { ...config, api_key: config.api_key || undefined });
        alert('已保存');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-panel" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>⚙️ API 设置</h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    <div className="form-group">
                        <label>LLM API Base</label>
                        <input value={config.api_base} onChange={e => setConfig({ ...config, api_base: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>API Key</label>
                        <input type="password" value={config.api_key} onChange={e => setConfig({ ...config, api_key: e.target.value })} placeholder="不修改留空" />
                    </div>
                    <div className="form-group">
                        <label>Model</label>
                        <select value={config.model} onChange={e => setConfig({ ...config, model: e.target.value })}>
                            <option value="gemini-3-flash">Gemini 3 Flash</option>
                            <option value="gemini-3-pro-high">Gemini 3 Pro High</option>
                        </select>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn-primary" onClick={handleSave}>保存</button>
                </div>
            </div>
        </div>
    );
}

// ===== 主页面组件 =====
export function Studio() {
    const [showUpload, setShowUpload] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [activeTab, setActiveTab] = useState<'material' | 'prompt' | 'glossary'>('material');

    // Material Data
    const [treeData, setTreeData] = useState({});
    const [selectedFile, setSelectedFile] = useState<any>(null);
    const [selectedPath, setSelectedPath] = useState<string>(''); // For breadcrumb

    // Prompt & Glossary Data
    const [systemPrompt, setSystemPrompt] = useState('');
    const [glossary, setGlossary] = useState<GlossaryItem[]>([]);

    // 加载目录树
    const loadTree = useCallback(async () => {
        try {
            const data = await fetchJson('/audio-files/tree');
            // Ensure data is a valid tree object (not an error with 'detail')
            if (data && typeof data === 'object' && !Array.isArray(data)) {
                setTreeData(data);
            } else {
                setTreeData({});
            }
        } catch (e) {
            console.error('Failed to load tree', e);
            setTreeData({});
        }
    }, []);

    // 加载其他数据
    useEffect(() => {
        loadTree();
        fetchJson('/prompts/vocab_extraction').then(d => setSystemPrompt(d.content || ''));
        fetchJson('/glossary').then(d => setGlossary(d || []));
    }, [loadTree]);

    // Material Actions
    const handleFileSelect = (file: any, path: string[]) => {
        setSelectedFile(file);
        setSelectedPath(path.join(' > '));
    };

    const handleDeletePart = async (path: string[]) => {
        // Path is now: [year, section, test, part]
        const [year, section, test, part] = path;
        try {
            const url = `${API_BASE}/audio-files/part?year=${encodeURIComponent(year)}&section=${encodeURIComponent(section)}&test=${encodeURIComponent(test)}&part=${encodeURIComponent(part)}`;
            console.log('Sending delete request:', url);

            const res = await fetch(url, {
                method: 'DELETE'
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.detail || `删除失败: HTTP ${res.status}`);
            }

            const result = await res.json();
            if (result.deleted_count === 0) {
                alert(`⚠️ 未找到可删除的文件。\n请求参数: ${year} > ${section} > ${test} > ${part}\n请检查数据库记录是否匹配。`);
            } else {
                alert(`✅ 已删除 ${result.deleted_count} 个文件`);
                loadTree(); // Refresh tree immediately
                if (selectedFile) setSelectedFile(null);
            }
        } catch (e: any) {
            alert(`❌ 删除失败: ${e.message}`);
            console.error('Delete error:', e);
        }
    };

    const handleSaveChanges = async (items: any[]) => {
        if (!selectedFile) return;
        try {
            await postJson(`/audio-files/${selectedFile.id}/save`, { items });
            alert(`✅ 修改已保存到数据库 (学习记录已更新)`);
            // 刷新树数据
            loadTree();
        } catch (e) {
            alert('❌ 保存失败: ' + e);
        }
    };

    const handleAddToGlossary = async (item: any) => {
        const english = item.text;
        const chinese = item.meaning;
        if (!english || !chinese) return;

        // 允许用户确认/修改
        const newEn = prompt('Confirm English:', english);
        if (newEn === null) return;
        const newCn = prompt('Confirm Chinese:', chinese);
        if (newCn === null) return;
        const pos = prompt('POS (optional):', item.pos || '');

        try {
            const res = await postJson('/glossary', { english: newEn, chinese: newCn, pos });
            if (res.status === 'success') {
                setGlossary([...glossary, res.item]);
                alert('已加入术语库');
            }
        } catch (e) {
            alert('添加失败: ' + e);
        }
    };

    return (
        <div className="studio-page">
            {/* 顶部 Header (保留) */}
            <header className="studio-header">
                <div className="header-title">
                    <h1>Material Studio</h1>
                    <p>素材工坊 · AI 调教台</p>
                </div>
                <div className="header-actions">
                    <button className="btn-icon" onClick={() => setShowUpload(true)}>
                        <span>📤</span><span>上传素材</span>
                    </button>
                    <button className="btn-icon" onClick={() => setShowSettings(true)}>
                        <span>⚙️</span><span>API</span>
                    </button>
                </div>
            </header>

            {/* Tab 导航 */}
            <div className="studio-tabs">
                <button className={`studio-tab ${activeTab === 'material' ? 'active' : ''}`} onClick={() => setActiveTab('material')}>📂 素材库</button>
                <button className={`studio-tab ${activeTab === 'prompt' ? 'active' : ''}`} onClick={() => setActiveTab('prompt')}>📝 提示词</button>
                <button className={`studio-tab ${activeTab === 'glossary' ? 'active' : ''}`} onClick={() => setActiveTab('glossary')}>📚 术语库</button>
            </div>

            {/* 主内容区 */}
            <main className="studio-main-content">
                {activeTab === 'material' && (
                    <div className="material-layout">
                        {/* 左侧目录树 */}
                        <div className="material-sidebar">
                            <DirectoryTree
                                data={treeData}
                                onSelectFile={handleFileSelect}
                                onDeletePart={handleDeletePart}
                                selectedFileId={selectedFile?.id}
                            />
                        </div>

                        {/* 右侧编辑器 */}
                        <div className="material-workspace">
                            {selectedFile ? (
                                <div className="workspace-container">
                                    <div className="workspace-header">
                                        <span className="file-path">{selectedPath}</span>
                                        <span className={`status-badge ${selectedFile.status}`}>
                                            {selectedFile.status === 'synced' ? '✅ 已入库' : '✏️ 草稿中'}
                                        </span>
                                    </div>

                                    <DraftEditor
                                        fileId={selectedFile.id}
                                        audioUrl={`${API_BASE}/audio/${selectedFile.id}`}
                                        onSaveDraft={handleSaveChanges}
                                        onAddToGlossary={handleAddToGlossary}
                                    />
                                </div>
                            ) : (
                                <div className="empty-workspace">
                                    <div className="empty-icon">👈</div>
                                    <p>请从左侧选择一个音频文件开始编辑</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'prompt' && (
                    <div className="simple-panel">
                        <textarea
                            value={systemPrompt}
                            onChange={e => setSystemPrompt(e.target.value)}
                            className="full-textarea"
                        />
                        <button className="btn-primary" onClick={() => postJson('/prompts/vocab_extraction', { content: systemPrompt })}>保存提示词</button>
                    </div>
                )}

                {activeTab === 'glossary' && (
                    <div className="simple-panel">
                        <div className="glossary-header" style={{ marginBottom: '10px', fontWeight: 'bold' }}>
                            共 {glossary.length} 条术语
                        </div>
                        <div className="editor-table-container">
                            <table className="editor-table">
                                <thead>
                                    <tr>
                                        <th>English</th>
                                        <th>Chinese</th>
                                        <th style={{ width: '100px' }}>POS</th>
                                        <th style={{ width: '120px' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {glossary.map((g, index) => (
                                        <tr key={g.id || index}>
                                            <td>
                                                <input
                                                    className="cell-input en"
                                                    value={g.english}
                                                    onChange={e => {
                                                        const newG = [...glossary];
                                                        newG[index].english = e.target.value;
                                                        setGlossary(newG);
                                                    }}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    className="cell-input cn"
                                                    value={g.chinese}
                                                    onChange={e => {
                                                        const newG = [...glossary];
                                                        newG[index].chinese = e.target.value;
                                                        setGlossary(newG);
                                                    }}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    className="cell-input"
                                                    value={g.pos || ''}
                                                    onChange={e => {
                                                        const newG = [...glossary];
                                                        newG[index].pos = e.target.value;
                                                        setGlossary(newG);
                                                    }}
                                                />
                                            </td>
                                            <td>
                                                <div className="action-cell">
                                                    <button
                                                        className="btn-icon"
                                                        title="保存修改"
                                                        onClick={async () => {
                                                            try {
                                                                await putJson(`/glossary/${g.id}`, g);
                                                                alert('已保存');
                                                            } catch (e) {
                                                                alert('保存失败: ' + e);
                                                            }
                                                        }}
                                                    >
                                                        💾
                                                    </button>
                                                    <button
                                                        className="btn-icon delete"
                                                        title="删除"
                                                        onClick={async () => {
                                                            if (!confirm('确定删除此术语？')) return;
                                                            try {
                                                                await deleteJson(`/glossary/${g.id}`);
                                                                const newG = glossary.filter(i => i.id !== g.id);
                                                                setGlossary(newG);
                                                            } catch (e) {
                                                                alert('删除失败: ' + e);
                                                            }
                                                        }}
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            <UploadPanel isOpen={showUpload} onClose={() => setShowUpload(false)} onSuccess={loadTree} />
            <ApiSettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />
        </div>
    );
}

