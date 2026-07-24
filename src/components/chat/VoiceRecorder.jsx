import React, { useState } from 'react';

export default function VoiceRecorder({ onRecordComplete }) {
  const [isRecording, setIsRecording] = useState(false);

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (isRecording && onRecordComplete) {
      // Placeholder simulation for voice memo payload
      onRecordComplete({
        originalName: 'voice_memo.mp3',
        mimeType: 'audio/mp3',
        url: '#voice-placeholder',
        size: 45000
      });
    }
  };

  return (
    <button
      type="button"
      onClick={toggleRecording}
      className={`p-2.5 rounded-2xl transition-all flex items-center justify-center ${
        isRecording
          ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30'
          : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
      }`}
      title={isRecording ? 'Click to finish voice memo' : 'Record Voice Memo'}
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    </button>
  );
}
