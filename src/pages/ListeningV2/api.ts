/**
 * 听力工坊 V2 API 服务
 */

import type {
    LearningStatusResponse,
    VocabularyV2,
    ReviewRequest,
    ReviewResponse,
    GrindProgressRequest,
    GrindProgressResponse,
    GrindSettings,
    PlaybackRhythm
} from './types';

const API_BASE = 'http://localhost:8000';

// ==================== 状态 API ====================

export async function getListeningStatus(): Promise<LearningStatusResponse> {
    const res = await fetch(`${API_BASE}/listening/v2/status`);
    if (!res.ok) throw new Error('Failed to get status');
    return res.json();
}

export async function getDueReviews(): Promise<{
    listening: VocabularyV2[];
    spelling: VocabularyV2[];
}> {
    const res = await fetch(`${API_BASE}/listening/v2/due-reviews`);
    if (!res.ok) throw new Error('Failed to get due reviews');
    return res.json();
}

export async function getGrindQueue(): Promise<VocabularyV2[]> {
    const res = await fetch(`${API_BASE}/listening/v2/grind-queue`);
    if (!res.ok) throw new Error('Failed to get grind queue');
    return res.json();
}

export async function getAllVocabulary(): Promise<VocabularyV2[]> {
    const res = await fetch(`${API_BASE}/listening/v2/all-vocabulary`);
    if (!res.ok) throw new Error('Failed to get vocabulary');
    return res.json();
}

// ==================== 学习操作 API ====================

export async function updateGrindProgress(
    req: GrindProgressRequest
): Promise<GrindProgressResponse> {
    const res = await fetch(`${API_BASE}/listening/v2/grind-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
    });
    if (!res.ok) throw new Error('Failed to update grind progress');
    return res.json();
}

export async function reviewVocabulary(
    req: ReviewRequest
): Promise<ReviewResponse> {
    const res = await fetch(`${API_BASE}/listening/v2/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
    });
    if (!res.ok) throw new Error('Failed to review');
    return res.json();
}

export async function updateVocabularyLevel(
    vocabularyId: string,
    level: 'hard' | 'medium' | 'easy'
): Promise<void> {
    const res = await fetch(`${API_BASE}/listening/v2/level`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vocabulary_id: vocabularyId, level })
    });
    if (!res.ok) throw new Error('Failed to update level');
}

// ==================== 设置 API ====================

export async function getGrindSettings(): Promise<GrindSettings> {
    const res = await fetch(`${API_BASE}/settings/grind-counts`);
    if (!res.ok) throw new Error('Failed to get grind settings');
    return res.json();
}

export async function updateGrindSettings(
    settings: GrindSettings
): Promise<void> {
    const res = await fetch(`${API_BASE}/settings/grind-counts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error('Failed to update grind settings');
}

export async function getPlaybackRhythm(): Promise<PlaybackRhythm> {
    const res = await fetch(`${API_BASE}/settings/playback-rhythm`);
    if (!res.ok) throw new Error('Failed to get playback rhythm');
    return res.json();
}

export async function updatePlaybackRhythm(
    rhythm: PlaybackRhythm
): Promise<void> {
    const res = await fetch(`${API_BASE}/settings/playback-rhythm`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rhythm)
    });
    if (!res.ok) throw new Error('Failed to update playback rhythm');
}

// ==================== TTS API ====================

export async function getTTSUrl(text: string): Promise<string> {
    const res = await fetch(
        `${API_BASE}/tts/chinese?text=${encodeURIComponent(text)}`
    );
    if (!res.ok) throw new Error('Failed to get TTS');
    const data = await res.json();
    return `${API_BASE}${data.audio_url}`;
}

// ==================== 音频 API ====================

export function getAudioUrl(audioFileId: string): string {
    return `${API_BASE}/audio/${audioFileId}`;
}
