import sqlite3
import os
import sys

# Add Model directory to sys.path to ensure we can import database if needed, 
# but for now we'll access sqlite directly if it's sqlite, or use the ORM if it's PG.
# The user mentioned PostgreSQL integration in previous turns.
# Let's check imports in server.py. It uses `from database import ...`.
# We should use the ORM to be safe and compatible with whatever DB is running.

sys.path.append(os.path.join(os.getcwd(), 'Model'))

try:
    from database import get_session, AudioFiles
    
    session = get_session()
    files = session.query(AudioFiles).all()
    
    print(f"{'ID':<36} | {'Year':<6} | {'Section':<10} | {'Test':<10} | {'Part':<10} | {'Filename'}")
    print("-" * 100)
    
    for f in files:
        print(f"{str(f.id):<36} | {str(f.year):<6} | {str(f.section):<10} | {str(f.test):<10} | {str(f.part):<10} | {f.filename}")

    session.close()

except Exception as e:
    print(f"Error: {e}")
