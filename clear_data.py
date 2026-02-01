
import os
import os
import sys
from sqlalchemy import text

# We will import database modules inside the function or after fixing path


def clear_all_data():
    from database import get_session
    session = get_session()
    try:
        print("🗑️ Correctly clearing all data from key tables...")
        
        # Disable constraints temporarily if needed, or just delete in order based on foreign keys
        # Order: Child tables first -> Parent tables last
        
        print("   - Deleting ReviewLogs...")
        session.execute(text("TRUNCATE TABLE review_logs CASCADE"))
        
        print("   - Deleting LearningRecords...")
        session.execute(text("TRUNCATE TABLE learning_records CASCADE"))
        
        print("   - Deleting WordMarks...")
        session.execute(text("TRUNCATE TABLE word_marks CASCADE"))
        
        print("   - Deleting Vocabulary...")
        session.execute(text("TRUNCATE TABLE vocabulary CASCADE"))
        
        print("   - Deleting AudioFiles...")
        session.execute(text("TRUNCATE TABLE audio_files CASCADE"))

        session.commit()
        print("✅ All old data cleared successfully.")
        
    except Exception as e:
        session.rollback()
        print(f"❌ Error clearing data: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    # Add model directory to path to import database
    sys.path.append(os.path.join(os.path.dirname(__file__), 'Model'))
    # Re-import inside main after path fix, or use the database from sys.modules if it worked differently.
    # Actually, the best way for this standalone script relative to the project root:
    from database import get_session
    clear_all_data()
