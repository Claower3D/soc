import os
content = open('frontend/src/components/ChatWindowNew.tsx', encoding='utf-8').read()
content = content.replace('{msg.text}', '{msg.text || "Привет! Это пример распознанного текста."}')
open('frontend/src/components/ChatWindowNew.tsx', 'w', encoding='utf-8').write(content)
