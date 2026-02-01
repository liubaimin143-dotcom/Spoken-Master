
import os
import sys
# 添加模块路径
sys.path.append(os.path.join(os.getcwd(), 'Model'))

from database import get_session, GeminiPrompts

def check_prompt():
    session = get_session()
    try:
        name = 'vocab_extraction'
        prompt = session.query(GeminiPrompts).filter(GeminiPrompts.name == name).first()
        if prompt:
            print(f"✅ Found prompt '{name}' in DB:")
            print(f"Content length: {len(prompt.prompt_content)}")
            print(f"Sample: {prompt.prompt_content[:50]}...")
        else:
            print(f"❌ Prompt '{name}' NOT found in DB.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    check_prompt()
