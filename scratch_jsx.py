import re
content = open('frontend/src/components/ChatWindowNew.tsx', encoding='utf-8').read()
# Find all JSX expressions like {variable}
matches = re.findall(r'>\{([^}]+)\}<', content)
for m in matches:
    print(m)
