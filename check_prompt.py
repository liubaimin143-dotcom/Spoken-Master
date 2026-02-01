import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'Model'))

from database import get_session, GeminiPrompts

def check_prompt():
    session = get_session()
    try:
        prompt = session.query(GeminiPrompts).filter(GeminiPrompts.name == "vocab_extraction").first()
        if prompt:
            print(f"Prompt found: {prompt.name}")
            print(f"Length: {len(prompt.prompt_content)} chars")
            print("=" * 50)
            print(prompt.prompt_content[:500])
            print("...")
            print("=" * 50)
            
            # Check if it's valid
            if not prompt.prompt_content or len(prompt.prompt_content.strip()) < 10:
                print("WARNING: Prompt is too short or empty!")
        else:
            print("WARNING: Prompt 'vocab_extraction' not found in database!")
    finally:
        session.close()

if __name__ == "__main__":
    check_prompt()
