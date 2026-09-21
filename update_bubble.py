import os, re
content = open('frontend/src/components/ChatWindowNew.tsx', encoding='utf-8').read()

bubble_pattern = r"function VoiceMessageBubble\(\{ msg, isMe \}: \{ msg: Message; isMe: boolean \}\) \{[\s\S]*?return \([\s\S]*?</div>\s*\);\s*\}"

bubble_replacement = """function VoiceMessageBubble({ msg, isMe }: { msg: Message; isMe: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showText, setShowText] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (msg.mediaUrl) {
      audioRef.current = new Audio(msg.mediaUrl);
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setProgress(0);
      };
      audioRef.current.ontimeupdate = () => {
        if (audioRef.current) {
          setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
        }
      };
    }
  }, [msg.mediaUrl]);

  useEffect(() => {
    if (!msg.mediaUrl) {
      // Fake interval for old messages without mediaUrl
      let interval: any;
      if (isPlaying) {
        interval = setInterval(() => {
          setProgress(p => {
            if (p >= 100) {
              setIsPlaying(false);
              return 0;
            }
            return p + 2;
          });
        }, 100);
      }
      return () => clearInterval(interval);
    }
  }, [isPlaying, msg.mediaUrl]);

  const togglePlay = () => {
    if (!isPlaying) {
      if (audioRef.current) audioRef.current.play();
      setIsPlaying(true);
    } else {
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
    }
  };
  
  const toggleText = () => setShowText(!showText);

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '220px', marginBottom: '4px'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
        <div 
          onClick={togglePlay}
          style={{width: '40px', height: '40px', borderRadius: '50%', background: isMe ? 'rgba(255,255,255,0.2)' : 'var(--color-accent, #6C5CE7)22', color: isMe ? '#fff' : 'var(--color-accent, #6C5CE7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', transition: '0.2s'}}
        >
          {isPlaying ? (
            <div style={{width: '12px', height: '12px', background: 'currentColor', borderRadius: '2px'}} />
          ) : (
            <div style={{width: 0, height: 0, borderTop: '7px solid transparent', borderBottom: '7px solid transparent', borderLeft: '11px solid currentColor', marginLeft: '3px'}}></div>
          )}
        </div>
        
        <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '6px'}}>
          <div style={{height: '4px', background: isMe ? 'rgba(255,255,255,0.3)' : 'var(--color-border)', width: '100%', borderRadius: '2px', position: 'relative', overflow: 'hidden'}}>
            <div style={{position: 'absolute', left: 0, top: 0, height: '100%', width: `${progress || 0}%`, background: isMe ? '#fff' : 'var(--color-accent, #6C5CE7)', borderRadius: '2px', transition: 'width 0.1s linear'}}></div>
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span style={{fontSize: '11px', opacity: 0.8}}>{isPlaying ? `0:0${Math.floor((progress||0)/20)}` : '0:05'}</span>
            <button 
              onClick={toggleText}
              style={{
                background: showText ? (isMe ? 'rgba(255,255,255,0.3)' : 'var(--color-accent)') : 'transparent',
                color: showText ? '#fff' : (isMe ? 'rgba(255,255,255,0.8)' : 'var(--color-text-secondary)'),
                border: '1px solid ' + (isMe ? 'rgba(255,255,255,0.4)' : 'var(--color-border)'),
                borderRadius: '6px',
                padding: '2px 6px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: '0.2s'
              }}
            >
              T
            </button>
          </div>
        </div>
      </div>
      {showText && (
        <div style={{
          background: isMe ? 'rgba(255,255,255,0.1)' : 'var(--color-bg-card)', 
          padding: '8px 12px', 
          borderRadius: '8px', 
          fontSize: '14px',
          color: isMe ? '#fff' : 'inherit',
          marginTop: '4px',
          border: isMe ? 'none' : '1px solid var(--color-border)'
        }}>
          {msg.text || 'Распознанный текст: Это голосовое сообщение.'}
        </div>
      )}
    </div>
  );
}"""

new_content = re.sub(bubble_pattern, bubble_replacement, content)
open('frontend/src/components/ChatWindowNew.tsx', 'w', encoding='utf-8').write(new_content)
