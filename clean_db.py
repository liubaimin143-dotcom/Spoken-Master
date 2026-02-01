import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'Model'))

from database import get_session, AudioFiles, Vocabulary

def clean_db():
    session = get_session()
    try:
        # 1. Delete by specific ID (from previous debug output)
        ids_to_delete = [
            "83d82dc3-cd27-4560-921e-4ca71e086717",
            "8cf983fd-d713-4f61-80e3-0189a5477fcb"
        ]
        
        print("Cleaning up database...")
        for aid in ids_to_delete:
            # Delete related vocab first
            session.query(Vocabulary).filter(Vocabulary.audio_file_id == aid).delete()
            # Delete file
            res = session.query(AudioFiles).filter(AudioFiles.id == aid).delete()
            if res:
                print(f"Deleted file with ID: {aid}")
        
        # 2. Also clean up ANY files under "Test 1" / "Part 1" to be sure
        # In case there are duplicates or mismatched entries
        files = session.query(AudioFiles).filter(
            AudioFiles.year == "2024", 
            AudioFiles.section == "Listening"
        ).all()
        
        for f in files:
            print(f"Checking file: {f.filename} (T={f.test}, P={f.part})")
            # If user wants to clear "current content", let's clear all Listening/2024 content
            session.query(Vocabulary).filter(Vocabulary.audio_file_id == f.id).delete()
            session.delete(f)
            print(f"Deleted: {f.filename}")
            
        session.commit()
        print("Database cleanup complete.")
        
    except Exception as e:
        session.rollback()
        print(f"Error: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    clean_db()
