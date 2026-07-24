import React, { useState, useRef } from 'react';
import VoiceRecorder from './VoiceRecorder';

export default function MessageComposer({ onSendMessage, onTypingStart, onTypingStop, onUploadAttachment }) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const typingTimerRef = useRef(null);

  const EMOJIS = ['👍', '⚖️', '📜', '📁', '✍️', '✅', '🛡️', '📅', '💼', '🤝', '🔒', '✉️'];

  const handleTextChange = (e) => {
    setText(e.target.value);
    if (onTypingStart) onTypingStart();

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      if (onTypingStop) onTypingStop();
    }, 1500);
  };

  const handleAddEmoji = (emoji) => {
    setText(prev => prev + emoji);
    setShowEmoji(false);
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    uploadFiles(files);
  };

  const uploadFiles = async (files) => {
    setIsUploading(true);
    try {
      for (const file of files) {
        if (onUploadAttachment) {
          const res = await onUploadAttachment(file);
          if (res?.data) {
            setAttachments(prev => [...prev, res.data]);
          }
        }
      }
    } catch (err) {
      console.error('File upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if ((!text.trim() && attachments.length === 0) || isUploading) return;

    if (onTypingStop) onTypingStop();
    onSendMessage({ text: text.trim(), attachments });
    setText('');
    setAttachments([]);
    setShowEmoji(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length) uploadFiles(files);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`p-4 bg-[#0a0f1d]/90 border-t border-white/10 relative backdrop-blur-2xl transition-all ${
        isDragging ? 'bg-[#0057c7]/20 border-[#0057c7] ring-4 ring-[#0057c7]/30' : ''
      }`}
    >
      {isDragging && (
        <div className="absolute inset-0 bg-[#0057c7]/30 backdrop-blur-md flex items-center justify-center text-white font-extrabold text-sm z-30 pointer-events-none">
          📥 Drop file to attach to encrypted message
        </div>
      )}

      {/* Attachment Previews */}
      {attachments.length > 0 && (
        <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-2 custom-scrollbar">
          {attachments.map((att, idx) => (
            <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-xs text-white">
              <span className="truncate max-w-[120px] font-bold">{att.originalName}</span>
              <button
                type="button"
                onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                className="text-red-400 font-extrabold hover:text-white ml-1"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmoji && (
        <div className="absolute bottom-20 left-4 p-3 bg-[#1a2233] border border-white/10 rounded-2xl shadow-2xl z-20 flex gap-2">
          {EMOJIS.map(em => (
            <button
              key={em}
              type="button"
              onClick={() => handleAddEmoji(em)}
              className="text-xl hover:scale-125 transition-transform p-1"
            >
              {em}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        {/* Attachment Upload Button */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="p-3 rounded-2xl bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-all border border-white/10 flex-shrink-0"
          title="Attach File / Document"
        >
          {isUploading ? (
            <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          )}
        </button>

        {/* Emoji Button */}
        <button
          type="button"
          onClick={() => setShowEmoji(!showEmoji)}
          className="p-3 rounded-2xl bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-all border border-white/10 flex-shrink-0"
          title="Add Emoji"
        >
          😊
        </button>

        {/* Voice Recorder Widget */}
        <VoiceRecorder onRecordComplete={(att) => setAttachments(prev => [...prev, att])} />

        {/* Main Text Input */}
        <input
          type="text"
          value={text}
          onChange={handleTextChange}
          placeholder="Type an encrypted message..."
          className="flex-1 bg-white/[0.04] border border-white/10 rounded-2xl px-5 py-3.5 text-white text-sm outline-none focus:border-[#0057c7] focus:ring-4 focus:ring-[#0057c7]/20 transition-all font-medium placeholder:text-slate-500 shadow-inner"
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={(!text.trim() && attachments.length === 0) || isUploading}
          className="px-6 py-3.5 bg-gradient-to-r from-[#0057c7] to-[#38bdf8] text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl hover:shadow-xl hover:shadow-[#0057c7]/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 flex items-center gap-2 flex-shrink-0"
        >
          <span>Send</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  );
}
