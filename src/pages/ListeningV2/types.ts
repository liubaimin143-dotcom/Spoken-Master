/**
 * 听力工坊 V2 类型定义
 * 支持双 FSRS、磨耳朵次数、考核模式
 */

// ==================== 基础类型 ====================

export type DifficultyLevel = 'hard' | 'medium' | 'easy';

export type LearningStatus = 
  | 'pending'        // 待磨耳朵
  | 'grinding'       // 磨耳朵中
  | 'exam_listening' // 听力考核
  | 'exam_spelling'  // 拼写考核
  | 'mastered';      // 已掌握

export type ExamType = 'listening' | 'spelling';

export type Rating = 'again' | 'good';

// ==================== FSRS 数据 ====================

export interface FSRSData {
  due: string | null;
  stability: number;
  difficulty: number;
  state: number;  // 0=New, 1=Learning, 2=Review, 3=Relearning
  step: number;
  last_review: string | null;
}

// ==================== 词汇类型 ====================

export interface VocabularyV2 {
  id: string;
  english: string;
  chinese: string;
  ipa?: string;
  pos?: string;
  word_type?: 'word' | 'phrase';
  level: DifficultyLevel;
  learning_status: LearningStatus;
  grind_count: number;
  grind_target: number;
  in_difficult_group: boolean;
  audio_file_id?: string;
  audio_start?: number;
  audio_end?: number;
  fsrs_listening?: FSRSData;
  fsrs_spelling?: FSRSData;
  added_at?: string;
}

// ==================== 统计类型 ====================

export interface LearningStatistics {
  total: number;
  pending: number;
  grinding: number;
  exam_listening: number;
  exam_spelling: number;
  mastered: number;
  in_difficult: number;
  by_level: {
    hard: number;
    medium: number;
    easy: number;
  };
  today_due_listening: number;
  today_due_spelling: number;
}

export interface DayPrediction {
  date: string;
  listening: number;
  spelling: number;
  total: number;
}

export interface DueCounts {
  listening: number;
  spelling: number;
  grind: number;
}

export interface LearningStatusResponse {
  status: string;
  statistics: LearningStatistics;
  predictions: DayPrediction[];
  due_counts: DueCounts;
  has_due_reviews: boolean;
  grind_locked: boolean;
}

// ==================== 请求/响应类型 ====================

export interface ReviewRequest {
  vocabulary_id: string;
  exam_type: ExamType;
  rating: Rating;
  user_input?: string;
}

export interface ReviewResponse {
  status: string;
  exam_type: ExamType;
  rating: Rating;
  learning_status: LearningStatus;
  next_review_display: string;
  fsrs_after: FSRSData;
}

export interface GrindProgressRequest {
  vocabulary_id: string;
  increment?: number;
}

export interface GrindProgressResponse {
  status: string;
  grind_count: number;
  grind_target: number;
  completed: boolean;
  learning_status: LearningStatus;
}

export interface GrindSettings {
  hard: number;
  medium: number;
  easy: number;
}

// ==================== UI 状态类型 ====================

export type ViewMode = 'home' | 'grind_normal' | 'grind_free' | 'exam_listening' | 'exam_spelling' | 'stats';

export interface PlaybackRhythm {
  english_gap: number;
  english_chinese_gap: number;
  pos_meaning_gap: number;
  word_switch_gap: number;
}

// 当前播放的单词信息
export interface CurrentWord {
  vocabulary: VocabularyV2;
  phase: 'english' | 'chinese' | 'waiting';
  repeat: number;  // 当前是第几遍英语
}

// 考核状态
export interface ExamState {
  type: ExamType;
  queue: VocabularyV2[];
  currentIndex: number;
  results: {
    vocabulary_id: string;
    rating: Rating;
    next_review_display: string;
  }[];
  spellingInput?: string;
  showAnswer?: boolean;
}

// 磨耳朵状态
export interface GrindState {
  mode: 'normal' | 'free';
  queue: VocabularyV2[];
  currentIndex: number;
  isPlaying: boolean;
  isPaused: boolean;
}
