import sys
import os
import json
sys.path.append(os.path.join(os.getcwd(), 'Model'))

from database import get_session, AudioFiles

def check_tree():
    session = get_session()
    try:
        files = session.query(AudioFiles).all()
        tree = {}
        for f in files:
            y = f.year or "Uncategorized"
            s = f.section or "General"
            t = f.test or "Unknown"
            p = f.part or "Unknown"
            
            print(f"Raw DB values: year={y}, section={s}, test={t}, part={p}")
            
            if y not in tree: tree[y] = {}
            if s not in tree[y]: tree[y][s] = {}
            if t not in tree[y][s]: tree[y][s][t] = {}
            if p not in tree[y][s][t]: tree[y][s][t][p] = []
            
            tree[y][s][t][p].append({
                "id": str(f.id),
                "filename": f.filename
            })
        
        print("\nGenerated Tree:")
        print(json.dumps(tree, indent=2, ensure_ascii=False))
    finally:
        session.close()

if __name__ == "__main__":
    check_tree()
