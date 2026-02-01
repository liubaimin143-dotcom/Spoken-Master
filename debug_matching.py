
import re

def clean_word(text: str) -> str:
    """仅保留字母和数字，转小写"""
    return re.sub(r'[^a-z0-9]', '', text.lower())

def find_phrase_timestamps(phrase: str, word_timestamps: list) -> tuple:
    """
    Copy of the function from server.py for testing
    """
    if not word_timestamps or not phrase:
        print(f"[TimestampMatch] Empty input")
        return (None, None)
    
    # 1. 预处理目标短语
    phrase_tokens = [clean_word(w) for w in re.split(r'\s+|-', phrase) if clean_word(w)]
    if not phrase_tokens:
        print(f"[TimestampMatch] No valid tokens from phrase: '{phrase}'")
        return (None, None)
    
    # 2. 预处理源单词列表
    source_tokens = []
    for idx, w in enumerate(word_timestamps):
        cleaned = clean_word(w.get("text", ""))
        if cleaned:
            source_tokens.append((cleaned, idx))
    
    if not source_tokens:
        print(f"[TimestampMatch] No valid source tokens")
        return (None, None)
    
    # 3. 匹配函数
    def tokens_match(source_token: str, target_token: str) -> bool:
        if source_token == target_token:
            return True
        min_len = min(len(source_token), len(target_token))
        if min_len >= 3 and source_token[:min_len] == target_token[:min_len]:
            return True
        if len(target_token) >= 4:
            if target_token in source_token or source_token in target_token:
                return True
        return False
    
    # 4. 滑动窗口搜索
    n_phrase = len(phrase_tokens)
    n_source = len(source_tokens)
    
    print(f"Searching for: {phrase_tokens}")
    
    for i in range(n_source - n_phrase + 1):
        match = True
        for j in range(n_phrase):
            if not tokens_match(source_tokens[i + j][0], phrase_tokens[j]):
                match = False
                break
        
        if match:
            start_idx = source_tokens[i][1]
            end_idx = source_tokens[i + n_phrase - 1][1]
            
            start_ts_obj = word_timestamps[start_idx].get("timestamp", [0, 0])
            end_ts_obj = word_timestamps[end_idx].get("timestamp", [0, 0])
            
            start_time = start_ts_obj[0] if isinstance(start_ts_obj, list) else 0.0
            end_time = end_ts_obj[1] if isinstance(end_ts_obj, list) else 0.0
            
            return (float(start_time), float(end_time))
    
    # 5. Fallback
    if n_phrase == 1:
        target = phrase_tokens[0]
        for cleaned, idx in source_tokens:
            if tokens_match(cleaned, target):
                ts = word_timestamps[idx].get("timestamp", [0, 0])
                start_time = ts[0] if isinstance(ts, list) else 0.0
                end_time = ts[1] if isinstance(ts, list) else 0.0
                return (float(start_time), float(end_time))
            
    return (None, None)

# Mock Data
mock_timestamps = [
    {"text": "Usually", "timestamp": [0.0, 0.5]},
    {"text": "we", "timestamp": [0.5, 0.7]},
    {"text": "are", "timestamp": [0.7, 0.9]},
    {"text": "eating", "timestamp": [2.3, 2.46]},  # Match 1
    {"text": "on", "timestamp": [2.46, 2.6]},
    {"text": "a", "timestamp": [2.6, 2.7]},
    {"text": "plate", "timestamp": [2.7, 2.9]},     # Match 2 (near eating)
    {"text": "but", "timestamp": [3.0, 3.5]},
    {"text": "sometimes", "timestamp": [3.5, 4.0]},
    {"text": "we", "timestamp": [4.0, 4.2]},
    {"text": "throw", "timestamp": [7.9, 8.1]},    # Match 3
    {"text": "it", "timestamp": [8.1, 8.2]},
    {"text": "away", "timestamp": [8.2, 8.24]},
    {"text": "in", "timestamp": [8.3, 8.4]},
    {"text": "the", "timestamp": [8.4, 8.5]},
    {"text": "picnic", "timestamp": [8.24, 8.8]},  # Match 4
    {"text": "area", "timestamp": [8.8, 9.48]},
    {"text": "near", "timestamp": [9.5, 9.6]},
    {"text": "the", "timestamp": [9.6, 9.7]},
    {"text": "bench", "timestamp": [9.98, 10.74]}, # Match 5
    {"text": "waiting", "timestamp": [11.52, 12.0]}, # Match 6
    {"text": "in", "timestamp": [12.0, 12.2]},
    {"text": "line", "timestamp": [12.2, 12.42]},
    {"text": "for", "timestamp": [12.5, 12.6]},
    {"text": "the", "timestamp": [12.6, 12.7]},
    {"text": "food", "timestamp": [12.76, 13.2]}, # Match 7
    {"text": "truck", "timestamp": [13.2, 13.8]},
    {"text": "wiping", "timestamp": [15.76, 16.0]}, # Match 8
    {"text": "off", "timestamp": [16.0, 16.36]},
]

test_phrases = [
    "eating",
    "picnic area",
    "waiting in line",
    "food truck",
    "wiping off",
    "bench",
    "throwing away", # stem/fuzzy match? throw away
    "plate"
]

print("--- Testing Matches ---")
results = []
for p in test_phrases:
    start, end = find_phrase_timestamps(p, mock_timestamps)
    print(f"'{p}': {start} - {end}")
    results.append((p, start))

print("\n--- Check Order ---")
for p, s in results:
    print(f"{p}: {s}")

print("\n--- Sorted Order ---")
sorted_results = sorted(results, key=lambda x: x[1] if x[1] is not None else 0)
for p, s in sorted_results:
    print(f"{p}: {s}")
