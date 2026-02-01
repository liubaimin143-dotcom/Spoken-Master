
import os
import sys
# 添加模块路径
sys.path.append(os.path.join(os.getcwd(), 'Model'))

from database import get_db_engine, text

def patch_db():
    engine = get_db_engine()
    with engine.connect() as conn:
        print("🔧 Patching database schema...")
        
        # 1. 检查并添加 vocabulary.fsrs_data
        try:
            conn.execute(text("ALTER TABLE vocabulary ADD COLUMN fsrs_data JSONB DEFAULT '{}'"))
            print("✅ Added column: vocabulary.fsrs_data")
        except Exception as e:
            if "already exists" in str(e):
                print("ℹ️ Column vocabulary.fsrs_data already exists.")
            else:
                print(f"❌ Error adding fsrs_data: {e}")

        # 2. 检查并添加 vocabulary.word_type
        try:
            conn.execute(text("ALTER TABLE vocabulary ADD COLUMN word_type TEXT"))
            print("✅ Added column: vocabulary.word_type")
        except Exception as e:
            if "already exists" in str(e):
                print("ℹ️ Column vocabulary.word_type already exists.")
            else:
                print(f"❌ Error adding word_type: {e}")
        
        conn.commit()
        print("🎉 Database patch complete.")

if __name__ == "__main__":
    patch_db()
