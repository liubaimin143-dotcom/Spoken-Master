// Tab 分组组件 - 用于切换不同类型的单词
import type { TabType, VocabularyItem } from '../../pages/Listening/types';
import './WordTabs.css';

interface TabItem {
    key: TabType;
    label: string;
    words: VocabularyItem[];
}

interface WordTabsProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    tabs: TabItem[];
}

export function WordTabs({ activeTab, onTabChange, tabs }: WordTabsProps) {
    return (
        <div className="word-tabs">
            {tabs.map((tab) => (
                <button
                    key={tab.key}
                    className={`word-tabs__tab ${activeTab === tab.key ? 'word-tabs__tab--active' : ''}`}
                    onClick={() => onTabChange(tab.key)}
                >
                    <span className="word-tabs__label">{tab.label}</span>
                    <span className="word-tabs__count">{tab.words.length}</span>
                </button>
            ))}
        </div>
    );
}
