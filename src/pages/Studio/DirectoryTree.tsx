
import { useState, useEffect } from 'react';
import './DirectoryTree.css';

interface FileNode {
    id: string;
    filename: string;
    status: string;
    draft_content: any;
    created_at: string;
}

interface TreeStructure {
    [year: string]: {
        [section: string]: {
            [test: string]: {
                [part: string]: FileNode[]
            }
        }
    }
}

interface DirectoryTreeProps {
    data: TreeStructure;
    onSelectFile: (file: FileNode, path: string[]) => void;
    onDeletePart: (path: string[]) => void;
    selectedFileId?: string;
}

export function DirectoryTree({ data, onSelectFile, onDeletePart, selectedFileId }: DirectoryTreeProps) {
    // Expanded state key: "year/section/test/part"
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [activeLevel, setActiveLevel] = useState<number>(0);

    // Initial load & persistence
    useEffect(() => {
        // Only trigger auto-expand if data is loaded
        if (Object.keys(data).length > 0) {
            const savedLevel = localStorage.getItem('studio.expandLevel');
            if (savedLevel) {
                const level = parseInt(savedLevel, 10);
                if (level > 0) {
                    setActiveLevel(level);
                    expandToLevel(level);
                }
            }
        }
    }, [data]);

    const toggle = (path: string) => {
        const newExpanded = new Set(expanded);
        if (newExpanded.has(path)) {
            newExpanded.delete(path);
        } else {
            newExpanded.add(path);
        }
        setExpanded(newExpanded);
        setActiveLevel(0); // Reset to custom state
    };

    // Helper to calculate expansion keys without state side-effects (unless we want to set them)
    // Actually, let's keep it simple and just have one function that does the work.

    const expandToLevel = (level: number) => {
        const newExpanded = new Set<string>();
        Object.keys(data).forEach(year => {
            if (level >= 1) {
                newExpanded.add(year);
                if (level >= 2) {
                    Object.keys(data[year]).forEach(section => {
                        const sectionKey = `${year}/${section}`;
                        newExpanded.add(sectionKey);
                        if (level >= 3) {
                            Object.keys(data[year][section]).forEach(test => {
                                const testKey = `${sectionKey}/${test}`;
                                newExpanded.add(testKey);
                                if (level >= 4) {
                                    Object.keys(data[year][section][test]).forEach(part => {
                                        const partKey = `${testKey}/${part}`;
                                        newExpanded.add(partKey);
                                    });
                                }
                            });
                        }
                    });
                }
            }
        });
        setExpanded(newExpanded);
    };

    const handleExpandLevel = (level: number) => {
        setActiveLevel(level);
        localStorage.setItem('studio.expandLevel', level.toString());
        expandToLevel(level);
    };

    const renderTree = () => {
        return Object.keys(data).sort().reverse().map(year => (
            <div key={year} className="tree-node year-node">
                <div className="tree-label" onClick={() => toggle(year)}>
                    <span className="tree-arrow">{expanded.has(year) ? '▼' : '▶'}</span>
                    📂 {year}
                </div>
                {expanded.has(year) && (
                    <div className="tree-children">
                        {Object.keys(data[year]).map(section => {
                            const sectionKey = `${year}/${section}`;
                            return (
                                <div key={section} className="tree-node section-node">
                                    <div className="tree-label" onClick={() => toggle(sectionKey)}>
                                        <span className="tree-arrow">{expanded.has(sectionKey) ? '▼' : '▶'}</span>
                                        📂 {section}
                                    </div>
                                    {expanded.has(sectionKey) && (
                                        <div className="tree-children">
                                            {Object.keys(data[year][section]).sort().map(test => {
                                                const testKey = `${sectionKey}/${test}`;
                                                return (
                                                    <div key={test} className="tree-node test-node">
                                                        <div className="tree-label" onClick={() => toggle(testKey)}>
                                                            <span className="tree-arrow">{expanded.has(testKey) ? '▼' : '▶'}</span>
                                                            📂 {test}
                                                        </div>
                                                        {expanded.has(testKey) && (
                                                            <div className="tree-children">
                                                                {Object.keys(data[year][section][test]).sort().map(part => {
                                                                    const partKey = `${testKey}/${part}`;
                                                                    const files = data[year][section][test][part];
                                                                    return (
                                                                        <div key={part} className="tree-node part-node">
                                                                            <div className="tree-label-group">
                                                                                <div className="tree-label" onClick={() => toggle(partKey)}>
                                                                                    <span className="tree-arrow">{expanded.has(partKey) ? '▼' : '▶'}</span>
                                                                                    📂 {part}
                                                                                </div>
                                                                                <button className="btn-icon-tiny" title="删除整个 Part" onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    if (confirm(`确定删除 ${year} > ${section} > ${test} > ${part} 下的所有文件吗?`)) {
                                                                                        // 注意：这里传回的 path 顺序现在是 [year, section, test, part]
                                                                                        onDeletePart([year, section, test, part]);
                                                                                    }
                                                                                }}>🗑️</button>
                                                                            </div>
                                                                            {expanded.has(partKey) && (
                                                                                <div className="tree-children file-list">
                                                                                    {files.map(f => (
                                                                                        <div
                                                                                            key={f.id}
                                                                                            className={`tree-file ${selectedFileId === f.id ? 'active' : ''}`}
                                                                                            onClick={() => onSelectFile(f, [year, section, test, part])}
                                                                                        >
                                                                                            <span className="file-icon">
                                                                                                {f.status === 'synced' ? '✅' : '📄'}
                                                                                            </span>
                                                                                            <span className="file-name">{f.filename}</span>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        ));
    };

    return (
        <div className="directory-tree-container">
            <div className="tree-controls">
                <span className="control-label">展开:</span>
                <button className={`btn-tiny-control ${activeLevel === 1 ? 'active' : ''}`} onClick={() => handleExpandLevel(1)}>1</button>
                <button className={`btn-tiny-control ${activeLevel === 2 ? 'active' : ''}`} onClick={() => handleExpandLevel(2)}>2</button>
                <button className={`btn-tiny-control ${activeLevel === 3 ? 'active' : ''}`} onClick={() => handleExpandLevel(3)}>3</button>
                <button className={`btn-tiny-control ${activeLevel === 4 ? 'active' : ''}`} onClick={() => handleExpandLevel(4)}>All</button>
                <button className="btn-tiny-control" onClick={() => { setExpanded(new Set()); setActiveLevel(0); }} title="收起全部">×</button>
            </div>
            <div className="directory-tree-content">
                {renderTree()}
            </div>
        </div>
    );
}
