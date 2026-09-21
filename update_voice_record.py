import os, re
content = open('frontend/src/components/ChatWindowNew.tsx', encoding='utf-8').read()

refs_addition = """const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);"""

content = content.replace('const fileInputRef = useRef<HTMLInputElement>(null);', refs_addition)

voice_record_pattern = r"const handleVoiceRecord = \(\) => \{[\s\S]*?\}, 2000\); // Fake 2 seconds recording\s*\};"
voice_record_replacement = """const handleVoiceRecord = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);

        setIsRecording(false);
        const newMsg: Message = {
          id: `msg_${Date.now()}`,
          text: 'Распознанный текст: Это тестовое голосовое сообщение.',
          fromMe: true,
          time: formatTime(),
          status: 'sent',
          mediaType: 'voice',
          mediaUrl: audioUrl, // Pass real audio URL
        };
        const updatedMessages = [...messages, newMsg];
        setMessages(updatedMessages);
        saveMessages(updatedMessages);

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Mic error:', err);
      alert('Ошибка доступа к микрофону. Проверьте разрешения браузера.');
      setIsRecording(false);
    }
  };"""

content = re.sub(voice_record_pattern, voice_record_replacement, content)

disabled_pattern = r"<button className=\"cw-input-icon\" onClick=\{handleVoiceRecord\} disabled=\{isRecording\}>"
disabled_replacement = """<button className="cw-input-icon" onClick={handleVoiceRecord} style={isRecording ? {color: '#ff3b30'} : {}}>"""

content = content.replace(disabled_pattern, disabled_replacement)

open('frontend/src/components/ChatWindowNew.tsx', 'w', encoding='utf-8').write(content)
