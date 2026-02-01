
import os
import sys
from sqlalchemy import text, inspect

def patch_audio_files_schema():
    from Model.database import get_db_engine
    engine = get_db_engine()
    
    with engine.connect() as conn:
        inspector = inspect(engine)
        columns = [c['name'] for c in inspector.get_columns('audio_files')]
        
        # Define new columns to add
        new_columns = {
            "year": "TEXT",
            "section": "TEXT",
            "test": "TEXT",
            "part": "TEXT",
            "draft_content": "JSONB",
            "status": "TEXT DEFAULT 'uploaded'"
        }
        
        for col, col_type in new_columns.items():
            if col not in columns:
                print(f"🔧 Adding column '{col}' to audio_files...")
                conn.execute(text(f"ALTER TABLE audio_files ADD COLUMN {col} {col_type}"))
            else:
                print(f"✓ Column '{col}' already exists.")
                
        conn.commit()
        print("✅ AudioFiles schema patched successfully.")

if __name__ == "__main__":
    patch_audio_files_schema()
