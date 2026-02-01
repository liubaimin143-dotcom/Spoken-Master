# 🎧 听力工坊 - 磨耳朵模块 实现计划

> 📅 创建日期：2026年1月29日  
> 📝 状态：待执行  
> 🔧 技术栈：React + TypeScript + FastAPI + PostgreSQL + py-fsrs 6.3.0 + Edge-TTS + Gemini API

---

## 📋 需求确认清单

| 项目 | 确认内容 |
|------|----------|
| 每日流程 | 复习旧卡 → 磨新卡 → 考核 → 循环直到全过 |
| 考核评分 | 2级：正常(Good) / 想不起(Again) |
| 模块1磨耳朵 | 连续播放，无需操作，可手动标记「不会」(点击按钮) |
| Tab分组 | 词组搭配 / 动词名词 / 不会的 / 全部 |
| 英语音频 | Whisper 时间戳定位原声 |
| 中文音频 | Edge-TTS 合成 `"词性，中文"` |
| FSRS版本 | py-fsrs 6.3.0 |
| Gemini参与 | 学习规划器 + 队列优化器 + 考核分析器 + 每日报告 |
| 提示词管理 | 热同步 + 前端可编辑 |
| 随机顺序 | Gemini控制，高权重词多出现 |
| 播放节奏 | 可调节面板，最大700ms，细分4种间隔 |
| 单词库可视化 | 显示新学/复习数量，考核后减少 |
| 结束条件 | 全部通过 或 手动结束 |

---

## 🎨 UI 设计

### 主界面布局

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🎧 听力工坊 - 磨耳朵          [⚙️ 播放节奏] [进度: 5/20] [结束今日学习] │
├─────────────────────────────────────────────────────────────────────────┤
│  [词组/搭配 (12)] [动词/名词 (8)] [不会的 (3)] [全部 (20)]               │
├────────────────────────────────────┬────────────────────────────────────┤
│                                    │                                    │
│       ┌────────────────────┐       │   📊 单词库可视化                   │
│       │                    │       │   ┌──────────────────────────┐    │
│       │     📇 闪卡区域     │       │   │ 🆕 新学: 15个             │    │
│       │                    │       │   │ 🔄 复习: 28个             │    │
│       │  ┌──────────────┐  │       │   │ ✅ 已通过: 8个            │    │
│       │  │              │  │       │   │ ❌ 待处理: 35个           │    │
│       │  │   正面: 🔊    │  │       │   │                          │    │
│       │  │   背面:      │  │       │   │  [可视化进度条/网格]       │    │
│       │  │   budget     │  │       │   └──────────────────────────┘    │
│       │  │   n. 预算    │  │       │                                    │
│       │  │              │  │       │   📊 Gemini 智能面板               │
│       │  │  [⭐ 标记不会] │  │       │   ┌──────────────────────────┐    │
│       │  └──────────────┘  │       │   │ 🎯 本轮建议：5轮           │    │
│       │                    │       │   │ 📈 预测通过率：78%         │    │
│       │  [◀ 上一个] [下一个 ▶]│       │   └──────────────────────────┘    │
│       └────────────────────┘       │                                    │
│                                    │   📝 提示词配置 (可编辑/折叠)       │
│   ═══════════════●════════════════ │                                    │
│   轮次: 2/5  当前轮进度: 12/20      │   [💾 保存提示词]                  │
├────────────────────────────────────┴────────────────────────────────────┤
│  模块1: [⏸️ 暂停] [完成磨耳朵 ✅]                                        │
│  模块2: [播放中文 ↑] [正常 ↑] [想不起 ↓]                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

### 播放节奏调节面板

```
┌──────────────────────────────────────┐
│  ⚙️ 播放节奏设置                      │
├──────────────────────────────────────┤
│                                      │
│  英语之间间隔     ═══════●═══  500ms │
│  英语与中文间隔   ═══════════●  700ms │
│  词性与意思间隔   ═══●═══════  200ms │
│  单词切换间隔     ═════════●═  600ms │
│                                      │
│         [重置默认] [保存]             │
└──────────────────────────────────────┘
```

### 考核模块交互流程

```
1. 播放一遍英语 (自动)
2. 等待用户操作：
   - 鼠标上侧键 第1次 → 播放中文 (Edge-TTS: "词性，中文意思")
   - 鼠标上侧键 第2次 → 正常(Good) → FSRS更新 → 下一个
   - 鼠标下侧键 → 想不起(Again) → 标记「不会的」→ FSRS更新 → 下一个
```

---

## 🔊 音频播放逻辑

### 磨耳朵模式 (模块1)

```
每个单词播放循环：

1. 🔊 英语 (原声素材，Whisper时间戳定位)
2. ⏸️ [英语之间间隔] (默认500ms，可调0-700ms)
3. 🔊 英语 (第2遍)
4. ⏸️ [英语之间间隔]
5. 🔊 英语 (第3遍)
6. ⏸️ [英语与中文间隔] (默认700ms，可调0-700ms)
7. 🔊 中文 (Edge-TTS: "{词性}")
8. ⏸️ [词性与意思间隔] (默认200ms，可调0-700ms)
9. 🔊 中文 (Edge-TTS: "{中文意思}")
10. ⏸️ [单词切换间隔] (默认600ms，可调0-700ms)
11. → 自动下一个单词

闪卡显示：
- 播放英语时：正面（只显示🔊图标 + 播放动画）
- 播放中文后：自动翻转到背面（显示单词、词性、中文）
- 切换下一个前：短暂显示背面，然后翻回正面
```

---

## 🤖 Gemini 参与方案

### 1. 学习规划器 (Learning Planner)

**触发时机**：用户进入磨耳朵模块时

**提示词模板**（存储在数据库，可前端编辑）：

```
你是一个专业的间隔复习算法专家。根据用户的学习历史和今日待学单词，给出个性化学习建议。

## 用户学习历史（过去30天）
${LEARNING_HISTORY}

## 今日待学单词
${TODAY_WORDS}

## FSRS 卡片数据
${FSRS_DATA}

请分析并输出JSON格式的建议：
{
    "recommended_rounds": 5,        // 推荐磨耳朵轮数
    "min_rounds": 3,                // 最少轮数
    "predicted_pass_rate": 0.78,    // 预测首次通过率
    "high_risk_words": [...],       // 高风险单词ID
    "word_frequency_weights": {...}, // 各单词权重
    "suggestion": "...",            // 文字建议
    "reasoning": "..."              // 推理过程
}
```

### 2. 播放队列优化器 (Queue Optimizer)

**触发时机**：每轮磨耳朵开始时

### 3. 考核结果分析器 (Assessment Analyzer)

**触发时机**：每次考核结束后

### 4. 每日学习报告生成器 (Daily Report Generator)

**触发时机**：用户点击「结束今日学习」

---

## 💾 数据库设计

### 新增/修改的表

```sql
-- =====================================================
-- 1. 扩展 vocabulary 表
-- =====================================================
ALTER TABLE vocabulary ADD COLUMN IF NOT EXISTS fsrs_data JSONB DEFAULT '{
    "due": null,
    "stability": 0,
    "difficulty": 0,
    "elapsed_days": 0,
    "scheduled_days": 0,
    "reps": 0,
    "lapses": 0,
    "state": "new",
    "last_review": null
}';

ALTER TABLE vocabulary ADD COLUMN IF NOT EXISTS word_type TEXT;
-- word_type: 'phrase' | 'verb' | 'noun' | 'adjective' | 'adverb' | 'other'

-- =====================================================
-- 2. Gemini 提示词表
-- =====================================================
CREATE TABLE IF NOT EXISTS gemini_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    prompt_content TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 预置提示词
INSERT INTO gemini_prompts (name, prompt_content, description) VALUES
('learning_planner', '...', '学习规划器提示词'),
('queue_optimizer', '...', '播放队列优化器提示词'),
('assessment_analyzer', '...', '考核结果分析器提示词'),
('daily_report', '...', '每日报告生成器提示词')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 3. 每日学习记录
-- =====================================================
CREATE TABLE IF NOT EXISTS daily_learning_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE UNIQUE NOT NULL,
    new_cards_count INTEGER DEFAULT 0,
    review_cards_count INTEGER DEFAULT 0,
    grinding_rounds INTEGER DEFAULT 0,
    first_pass_rate REAL,
    final_pass_rate REAL,
    total_time_seconds INTEGER,
    details JSONB,
    gemini_report TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 4. 学习会话
-- =====================================================
CREATE TABLE IF NOT EXISTS learning_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    session_type TEXT NOT NULL,  -- 'grinding' | 'assessment'
    gemini_plan JSONB,
    gemini_queue JSONB,
    words JSONB,
    results JSONB,
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 5. 复习日志
-- =====================================================
CREATE TABLE IF NOT EXISTS review_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vocabulary_id UUID REFERENCES vocabulary(id),
    session_id UUID REFERENCES learning_sessions(id),
    rating TEXT NOT NULL,  -- 'good' | 'again'
    response_time_ms INTEGER,
    fsrs_before JSONB,
    fsrs_after JSONB,
    reviewed_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 6. 单词标记
-- =====================================================
CREATE TABLE IF NOT EXISTS word_marks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vocabulary_id UUID REFERENCES vocabulary(id),
    mark_type TEXT NOT NULL,  -- 'difficult' | 'skip' | 'favorite'
    source TEXT,  -- 'grinding' | 'assessment' | 'manual'
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(vocabulary_id, mark_type)
);

-- =====================================================
-- 7. 用户设置（播放节奏等）
-- =====================================================
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 预置播放节奏设置
INSERT INTO user_settings (key, value) VALUES
('playback_rhythm', '{
    "english_gap": 500,
    "english_chinese_gap": 700,
    "pos_meaning_gap": 200,
    "word_switch_gap": 600
}')
ON CONFLICT (key) DO NOTHING;
```

---

## 📦 依赖安装

### Python 后端

```bash
pip install fsrs==6.3.0
pip install edge-tts
```

### 前端

无需额外依赖，使用现有 React + TypeScript

---

## 🚀 实现步骤（按Phase分阶段执行）

### Phase 1: 基础设施 ✅ 完成 (2026-01-29)

| 步骤 | 任务 | 文件 |
|------|------|------|
| 1.1 | 执行数据库迁移SQL | Model/migrations/ |
| 1.2 | 安装 py-fsrs 和 edge-tts | - |
| 1.3 | 创建 FSRS 服务封装 | Model/fsrs_service.py |
| 1.4 | 创建 Edge-TTS 服务 | Model/tts_service.py |
| 1.5 | 创建 Gemini 提示词 API | Model/server.py |

### Phase 2: 后端 API ✅ 完成 (2026-01-29)

| 步骤 | 任务 | 端点 |
|------|------|------|
| 2.1 | 今日学习词汇获取 | GET /listening/today-words |
| 2.2 | FSRS 卡片更新 | POST /listening/review |
| 2.3 | 学习会话管理 | POST/GET /listening/sessions |
| 2.4 | Gemini 学习规划 | POST /listening/plan |
| 2.5 | Gemini 队列优化 | POST /listening/optimize-queue |
| 2.6 | 播放节奏设置 | GET/PUT /settings/playback-rhythm |
| 2.7 | 单词标记 | POST/DELETE /listening/marks |
| 2.8 | TTS 合成 | GET /tts/chinese?text=... |

### Phase 3: 前端组件 ✅ 完成 (2026-01-29)

| 步骤 | 任务 | 文件 |
|------|------|------|
| 3.1 | 创建 Listening 页面路由 | src/pages/Listening/ |
| 3.2 | 闪卡组件 | src/components/FlashCard/ |
| 3.3 | Tab 分组组件 | src/components/WordTabs/ |
| 3.4 | 播放节奏设置面板 | src/components/RhythmSettings/ |
| 3.5 | 单词库可视化面板 | src/components/WordPoolViz/ |
| 3.6 | Gemini 智能面板 | src/components/GeminiPanel/ |
| 3.7 | 提示词编辑器 | src/components/PromptEditor/ |
| 3.8 | 进度条组件 | src/components/ProgressBar/ |

### Phase 4: 核心逻辑 ✅ 完成 (2026-01-29)

| 步骤 | 任务 | 说明 |
|------|------|------|
| 4.1 | 音频播放控制器 | 英语原声 + TTS 中文播放 |
| 4.2 | 磨耳朵循环逻辑 | 自动播放、翻卡、切换 |
| 4.3 | 考核模块逻辑 | 鼠标侧键捕获、评分 |
| 4.4 | FSRS 状态同步 | 前后端状态一致 |
| 4.5 | 热同步机制 | 提示词编辑实时同步 |

### Phase 5: 集成测试 (预计1小时)

| 步骤 | 任务 |
|------|------|
| 5.1 | 完整流程测试：复习 → 磨耳朵 → 考核 → 循环 |
| 5.2 | Gemini API 集成测试 |
| 5.3 | 鼠标侧键交互测试 |
| 5.4 | Edge-TTS 音频测试 |

---

## 📁 文件结构预览

```
SpokenMaster/
├── src/
│   ├── components/
│   │   ├── FlashCard/
│   │   │   ├── FlashCard.tsx
│   │   │   └── FlashCard.css
│   │   ├── WordTabs/
│   │   │   ├── WordTabs.tsx
│   │   │   └── WordTabs.css
│   │   ├── RhythmSettings/
│   │   │   ├── RhythmSettings.tsx
│   │   │   └── RhythmSettings.css
│   │   ├── WordPoolViz/
│   │   │   ├── WordPoolViz.tsx
│   │   │   └── WordPoolViz.css
│   │   ├── GeminiPanel/
│   │   │   ├── GeminiPanel.tsx
│   │   │   └── GeminiPanel.css
│   │   └── PromptEditor/
│   │       ├── PromptEditor.tsx
│   │       └── PromptEditor.css
│   ├── pages/
│   │   ├── Studio/           # 已有
│   │   └── Listening/
│   │       ├── Listening.tsx
│   │       ├── Listening.css
│   │       ├── hooks/
│   │       │   ├── useAudioPlayer.ts
│   │       │   ├── useFSRS.ts
│   │       │   ├── useGemini.ts
│   │       │   └── useMouseButtons.ts
│   │       └── types.ts
│   └── App.tsx
├── Model/
│   ├── server.py             # 扩展 API
│   ├── fsrs_service.py       # FSRS 封装
│   ├── tts_service.py        # Edge-TTS 封装
│   ├── gemini_service.py     # Gemini API 封装
│   └── migrations/
│       └── 002_listening.sql # 数据库迁移
└── ...
```

---

## ✅ 执行检查点

每完成一个 Phase，检查以下内容：

### Phase 1 完成检查
- [ ] 数据库表创建成功
- [ ] py-fsrs 导入正常
- [ ] edge-tts 可以生成音频

### Phase 2 完成检查
- [ ] 所有 API 端点可访问
- [ ] FSRS 计算结果正确
- [ ] Gemini API 调用成功

### Phase 3 完成检查
- [ ] 页面可正常渲染
- [ ] 组件样式正确
- [ ] Tab 切换正常

### Phase 4 完成检查
- [ ] 音频可正常播放
- [ ] 鼠标侧键可捕获
- [ ] 热同步工作正常

### Phase 5 完成检查
- [ ] 完整流程无报错
- [ ] 数据正确保存到数据库
- [ ] 每日报告正常生成

---

## 🔄 换号继续执行说明

如果额度用完需要换号，请告诉新的 AI：

```
请阅读 E:\APP\LanguageMaster\YBM\LISTENING_WORKSHOP_PLAN.md 文件，
这是听力工坊磨耳朵模块的实现计划。

当前执行进度：Phase X，步骤 X.X
请从这里继续执行。
```

---

## 📝 备注

- 本计划基于 2026年1月29日 的讨论确定
- 所有 Gemini 提示词都可以通过前端编辑
- 播放节奏设置存储在数据库，用户可自定义
- FSRS 使用 py-fsrs 6.3.0 版本

---

**准备就绪，等待您确认后开始执行！** 🚀
