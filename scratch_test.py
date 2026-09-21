import subprocess
for commit in ['2f98ebf', '16410f5', 'de375f2', '0d6b2b7', '2bb3951', '1149961']:
    try:
        out = subprocess.check_output(['git', 'show', f'{commit}:frontend/src/components/ChatWindowNew.tsx'])
        print(f'{commit}: {"Выберите".encode("utf-8") in out}')
    except:
        pass
