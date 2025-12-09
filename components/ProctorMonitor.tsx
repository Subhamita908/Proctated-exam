import React, { useEffect, useRef } from 'react';

interface ProctorMonitorProps {
  stream: MediaStream | null;
  warnings: number;
  maxWarnings: number;
  lastViolation: string | null;
}

const ProctorMonitor: React.FC<ProctorMonitorProps> = ({ stream, warnings, maxWarnings, lastViolation }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const warningPercentage = (warnings / maxWarnings) * 100;
  let statusColor = 'bg-green-500';
  if (warnings > 1) statusColor = 'bg-yellow-500';
  if (warnings > 3) statusColor = 'bg-red-500';

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end pointer-events-none">
      
      {/* Violation Toast */}
      {lastViolation && (
        <div className="mb-4 bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm animate-shake border border-red-400">
          <p className="font-bold text-sm">⚠️ Violation Detected</p>
          <p className="text-xs">{lastViolation}</p>
        </div>
      )}

      {/* Monitor Box */}
      <div className="w-48 bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-700 pointer-events-auto">
        <div className="relative h-32 bg-slate-800">
          {stream ? (
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              playsInline 
              className="w-full h-full object-cover transform scale-x-[-1]" 
            />
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-slate-500">
              Camera Offline
            </div>
          )}
          
          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-md">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-[10px] font-medium text-white tracking-wider">REC</span>
          </div>
        </div>

        <div className="p-3 bg-slate-900 border-t border-slate-700">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold text-slate-400">Proctor Status</span>
            <span className={`text-xs font-bold ${warnings > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {warnings}/{maxWarnings} Warnings
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full transition-all duration-500 ${statusColor}`} 
              style={{ width: `${Math.min(warningPercentage, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProctorMonitor;
