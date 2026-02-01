import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'Model'))

from database import get_session, AudioFiles, Vocabulary

def check_file_status():
    session = get_session()
    try:
        files = session.query(AudioFiles).all()
        print(f"Total audio files: {len(files)}\n")
        
        for f in files:
            print(f"=== File: {f.filename} ===")
            print(f"  ID: {f.id}")
            print(f"  Status: {f.status}")
            print(f"  Transcription sentences: {len(f.transcription) if f.transcription else 0}")
            if f.transcription and len(f.transcription) > 0:
                # Show first sentence
                first = f.transcription[0]
                print(f"  First sentence: {first.get('text', '')[:80]}...")
                # Check if it has word-level timestamps
                words = first.get('words', [])
                print(f"  Words in first sentence: {len(words)}")
            
            print(f"  Original extraction items: {len(f.original_extraction) if f.original_extraction else 0}")
            
            # Check vocabulary
            vocabs = session.query(Vocabulary).filter(Vocabulary.audio_file_id == f.id).all()
            print(f"  Vocabulary count: {len(vocabs)}")
            print()
    finally:
        session.close()

if __name__ == "__main__":
    check_file_status()
