import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()
url = os.getenv('DATABASE_URL')
engine = create_engine(url)

with open('rls_migration.sql', 'r') as f:
    sql = f.read()

# Strip comment lines (-- ...) BEFORE splitting on semicolons to avoid breaking on comments containing semicolons
lines = sql.splitlines()
non_comment_lines = [l for l in lines if not l.strip().startswith('--')]
sql_no_comments = '\n'.join(non_comment_lines)

raw = [s.strip() for s in sql_no_comments.split(';')]
statements = [s for s in raw if s]

errors = []
with engine.connect() as conn:
    for i, stmt in enumerate(statements):
        try:
            conn.execute(text(stmt))
            preview = stmt.replace('\n', ' ')[:90]
            print(f'  OK [{i+1}]: {preview}')
        except Exception as e:
            preview = stmt.replace('\n', ' ')[:90]
            print(f'  ERR [{i+1}]: {preview}')
            print(f'        -> {e}')
            errors.append((i+1, e))
    conn.commit()

print()
if errors:
    print(f'DONE with {len(errors)} error(s). See above.')
else:
    print('DONE - all statements applied successfully!')
