# SpokenMaster (LanguageMaster)

SpokenMaster is an advanced language learning platform designed to bridge the gap between passive listening and active mastery. It combines local AI models (Whisper) for accurate transcription with remote LLMs (Gemini) for intelligent content analysis, all integrated into a rigorous Spaced Repetition System (FSRS).

## 🚀 Features

### 🎧 Material Studio (素材工坊)
The command center for your learning materials.
- **Smart Import**: Upload audio/video files with automatic format conversion (via `ffmpeg`).
- **AI Transcription**: High-accuracy local speech-to-text using `Whisper Large V3 Turbo`.
- **Structured Management**: Organize content by Year > Section > Test > Part.
- **AI Vocabulary Extraction**: Automatically identifying key vocabulary and phrases using Gemini, with customizable prompts.
- **Draft Editor**: Fine-tune transcriptions and extracted vocabulary before syncing to your learning database.
- **Glossary & Prompts**: Manage global terms and system prompts to refine AI behavior.

### 🧠 Listening Workshop (听力工坊)
A data-driven training ground for mastering spoken language.
- **Dual FSRS Engine**: Separate Spaced Repetition schedules for **Listening** (recognition) and **Spelling** (production).
- **Grind Mode (磨耳朵)**: Passive immersion with customizable repetition logic (Hard/Medium/Easy weights).
- **Exam Mode**: Interactive testing for Listening and Spelling to verify mastery.
- **Analytics**: Detailed tracking of learning progress, future reviews, and retention rates.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **Styling**: Vanilla CSS (modular)
- **State/Routing**: React Router DOM

### Backend
- **Server**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL (SQLAlchemy ORM)
- **AI Models**: 
  - Local: `openai/whisper-large-v3-turbo` (Hugging Face Transformers)
  - Remote: Gemini API (configurable)
- **Audio Processing**: FFmpeg

---

## 📦 Installation & Setup

### Prerequisites
1. **Node.js**: v18+
2. **Python**: v3.11+
3. **PostgreSQL**: Installed and running locally.
4. **FFmpeg**: Installed and added to system PATH.
5. **Hardware**: NVIDIA GPU recommended for faster Whisper transcription (CUDA).

### 1. Backend Setup
Navigate to the root directory (or `Model/` depending on entry point preference, but scripts are in root/Model).

```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate

# Install dependencies (ensure PyTorch matches your CUDA version)
pip install fastapi uvicorn sqlalchemy psycopg2-binary transformers torch torchaudio openai-whisper

# Initialize Database
# Ensure PostgreSQL is running and credentials in Model/database.py matched (default: postgres/liu48694062@localhost:5432/spoken_master)
python Model/database.py
```

### 2. Frontend Setup
Navigate to the project root.

```bash
# Install dependencies
npm install
# or
pnpm install

# Start Development Server
npm run dev
```

### 3. Running the Server
In a new terminal (with venv activated):

```bash
# Run the FastAPI server
python Model/server.py
```
*Note: The server typically runs on `http://localhost:8000`.*

---

## 📂 Project Structure

```text
e:/APP/LanguageMaster/SpokenMaster
├── src/
│   ├── pages/
│   │   ├── Studio/          # Material Studio (Upload, Editor, Tree)
│   │   └── ListeningV2/     # Listening Workshop (FSRS, Exams, Player)
│   ├── components/          # Shared components
│   └── ...
├── Model/
│   ├── server.py            # FastAPI entry point & API endpoints
│   ├── database.py          # Database models (SQLAlchemy) & Init scripts
│   └── ...
├── upgrades/                # Uploaded audio files
└── ...
```

## 🧩 Usage Workflow

1.  **Upload**: Go to **Material Studio**, upload an audio file (e.g., TOEIC listening test).
2.  **Transcribe**: Wait for Whisper to transcribe the audio locally.
3.  **Analyze**: Use the "AI Extraction" feature to identify keywords and phrases.
4.  **Edit**: Review the draft, adjust timestamps or meanings if necessary.
5.  **Sync**: Save the draft to the database.
6.  **Study**: Switch to **Listening Workshop**.
    *   **Grind**: Listen to new/due words in a loop.
    *   **Exam**: Test yourself to update FSRS intervals.

## 🔮 Future Roadmap: Deep Learning Integrations

We are exploring the integration of advanced **PyTorch** and **Deep Learning** models to further enhance the learning experience:

### 🎧 Audio Processing & Enhancement
1.  **Forced Alignment (Wav2Vec 2.0 / MFA)**: Achieve millisecond-level phoneme alignment for precise "looping" and karaoke-style highlighting.
2.  **Speech Enhancement (Demucs / Conv-TasNet)**: Isolate vocals from background noise/music for clearer intensive listening practice.
3.  **Speaker Diarization (pyannote.audio)**: Automatically distinguish and label different speakers (e.g., "Man" vs. "Woman") in conversation exercises.
4.  **Neural VAD (Silero VAD)**: Replace energy-based silence detection with neural networks for perfect sentence segmentation.

### 🗣️ Speaking & Assessment
5.  **Pronunciation Scoring (HuBERT / Wav2Vec2-XLS-R)**: Analyze user recordings to provide phoneme-level accuracy scores and feedback.
6.  **Accent Classification (ResNet / ECAPA-TDNN)**: Automatically tag audio with accents (US, UK, AU) to help users target specific dialect training.

### 🧠 Understanding & NLP
7.  **Semantic Search (Sentence-BERT)**: Enable "meaning-based" searches (e.g., searching for "acquire" finds "get") using vector embeddings.
8.  **Personalized TTS (VITS / Bark)**: Generate high-quality audio for vocabulary/sentences that lack native audio clips.
9.  **Audio Difficulty Estimation (Multimodal)**: Automatically rate audio difficulty (Level 1-5) based on WPM, lexical density, and acoustic clarity.
10. **Deep Knowledge Tracing (LSTM / Transformer)**: Go beyond FSRS logic by using sequence modeling to predict memory states based on complex learning patterns.

## 🤝 Contributing
1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.
