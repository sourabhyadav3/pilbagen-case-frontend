import React from 'react';

export default function FileAttachment({ attachments = [] }) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="space-y-2 mt-2">
      {attachments.map((att, idx) => {
        const isImage = att.mimeType?.startsWith('image/') || att.url?.match(/\.(jpeg|jpg|gif|png|webp)$/i);
        const baseUrl = import.meta.env.VITE_API_URL
          ? import.meta.env.VITE_API_URL.replace('/api', '')
          : window.location.origin.includes('5173')
          ? 'http://localhost:5000'
          : '';
        const fileUrl = att.url?.startsWith('http') ? att.url : `${baseUrl}${att.url}`;

        if (isImage) {
          return (
            <div key={idx} className="relative rounded-2xl overflow-hidden border border-white/10 max-w-sm group">
              <img src={fileUrl} alt={att.originalName || 'Attachment'} className="w-full h-auto max-h-60 object-cover" />
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                download
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Image
              </a>
            </div>
          );
        }

        return (
          <a
            key={idx}
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            download
            className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/20 transition-all text-white text-xs font-semibold max-w-xs group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#0057c7]/20 border border-[#0057c7]/30 flex items-center justify-center text-[#38bdf8] flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                <path d="M13 3v5a1 1 0 001 1h5" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-white font-700">{att.originalName || 'Document Attachment'}</p>
              <p className="text-[10px] text-white/60 uppercase font-800">{(att.size ? (att.size / 1024).toFixed(1) + ' KB' : 'File')}</p>
            </div>
            <svg className="w-4 h-4 text-white/50 group-hover:text-white transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </a>
        );
      })}
    </div>
  );
}
