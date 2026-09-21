import os, re
content = open('frontend/src/components/ChatWindowNew.tsx', encoding='utf-8').read()
pattern = r"\{msg\.mediaType === 'voice' && \([\s\S]*?\{text && <div className=\"cw-bubble-text\">\{text\}</div>\}"

replacement = """{msg.mediaType === 'voice' ? (
                    <VoiceMessageBubble msg={msg} isMe={isMe} />
                  ) : (
                    text && <div className=\"cw-bubble-text\">{text}</div>
                  )}"""

new_content = re.sub(pattern, replacement, content)
open('frontend/src/components/ChatWindowNew.tsx', 'w', encoding='utf-8').write(new_content)
