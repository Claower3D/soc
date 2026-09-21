import os, re
content = open('frontend/src/components/ChatWindowNew.tsx', encoding='utf-8').read()

pattern = r"\{showText && msg\.text && \([\s\S]*?\{msg\.text \|\| \"[^\"]*\"\}\s*</div>\s*\)\}"
replacement = """{showText && (
        <div style={{
          background: isMe ? 'rgba(255,255,255,0.1)' : 'var(--color-bg-card)', 
          padding: '8px 12px', 
          borderRadius: '8px', 
          fontSize: '14px',
          color: isMe ? '#fff' : 'inherit',
          marginTop: '4px',
          border: isMe ? 'none' : '1px solid var(--color-border)'
        }}>
          {msg.text || 'Распознанный текст: Привет! Это голосовое сообщение.'}
        </div>
      )}"""

new_content = re.sub(pattern, replacement, content)
open('frontend/src/components/ChatWindowNew.tsx', 'w', encoding='utf-8').write(new_content)
