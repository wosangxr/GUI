import React, { useState, useEffect } from 'react';
import { Maximize2, Flag, AlertCircle, Compass } from 'lucide-react';
import { CameraFeed, VisionOverlaySettings } from '../types/proctor';
import { CameraPtzOverlay } from './CameraPtzOverlay';

interface CameraFeedCardProps {
  feed: CameraFeed;
  visionSettings: VisionOverlaySettings;
  onExpand: (feed: CameraFeed) => void;
  onManualFlag: (feed: CameraFeed) => void;
  isFocused?: boolean;
}

export const CameraFeedCard: React.FC<CameraFeedCardProps> = ({
  feed,
  visionSettings,
  onExpand,
  onManualFlag,
  isFocused = false,
}) => {
  const [timeMs, setTimeMs] = useState<string>('');
  const [liveFps, setLiveFps] = useState<number>(feed.fps);
  const [ciraData, setCiraData] = useState<{
    counts?: Record<string, number>;
    has_anomaly?: boolean;
    objects?: Array<{ class_name: string; confidence: number }>;
    last_updated?: number;
  } | null>(null);

  useEffect(() => {
    if (feed.id !== 'cam-01') return;
    const fetchTelemetry = async () => {
      try {
        const res = await fetch('/api/cira/telemetry');
        if (res.ok) {
          const data = await res.json();
          setCiraData(data);
        }
      } catch {}
    };
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 800);
    return () => clearInterval(interval);
  }, [feed.id]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const ms = Math.floor(now.getMilliseconds() / 10).toString().padStart(2, '0');
      setTimeMs(`${timeStr}.${ms}`);
      const jitter = (Math.random() * 0.4 - 0.2);
      setLiveFps(Number((feed.fps + jitter).toFixed(1)));
    }, 100);

    return () => clearInterval(timer);
  }, [feed.fps]);

  return (
    <div className={`relative flex flex-col rounded-xl liquid-glass-card transition-all overflow-hidden ${
      feed.activeAlertCount > 0 
        ? 'border-rose-500/40 shadow-lg shadow-rose-950/30' 
        : 'hover:border-cyan-500/30'
    } ${isFocused ? 'ring-2 ring-cyan-500/50' : ''}`}>
      {/* Top Feed HUD with Liquid Glass Refraction */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-white/5 bg-zinc-950/40 text-xs">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 font-semibold text-zinc-100">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="truncate max-w-[170px] sm:max-w-[210px]">{feed.name}</span>
          </span>
          <span className="hidden sm:inline-block text-[10px] font-mono text-zinc-400 bg-white/5 px-1.5 py-0.2 rounded border border-white/5">
            MERCUSYS MC210
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400 tabular-nums">
          <span className="hidden md:inline-block text-zinc-500">{feed.resolution}</span>
          <span className="text-zinc-600">|</span>
          <span className="text-cyan-400 font-medium">{liveFps} FPS</span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-300">{timeMs || '10:42:15.00'}</span>
        </div>
      </div>

      {/* Main Video Viewport */}
      <div 
        onClick={() => onExpand(feed)}
        className="relative aspect-video w-full bg-gradient-to-b from-zinc-950/90 via-zinc-900/60 to-zinc-950/90 overflow-hidden cursor-pointer group"
      >
        {/* CCTV Scanlines & Subtle Liquid Grid */}
        <div className="absolute inset-0 pointer-events-none cctv-scanlines opacity-35 z-10" />
        <div className="absolute inset-0 pointer-events-none cctv-grid-pattern opacity-10" />

        {/* Real Live Video Feed สำหรับกล้องที่ต่อ AI แล้ว (Port 5000) */}
        {feed.id === 'cam-01' ? (
          <>
            <img 
              src="http://10.114.70.161:5000/video_feed" 
              alt="AI Processed Live Feed (MERCUSYS MC210)"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* CiRA CORE Real-Time Detection HUD Overlay */}
            <div className="absolute top-2.5 left-2.5 z-20 flex flex-wrap items-center gap-1.5 pointer-events-none">
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-black/80 border border-cyan-500/40 text-[10px] font-mono text-cyan-300 backdrop-blur-md shadow-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                CiRA CORE AI
              </span>
              {ciraData?.counts && (
                <>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold backdrop-blur-md border ${
                    (ciraData.counts['phone'] || 0) > 0
                      ? 'bg-rose-950/90 border-rose-500 text-rose-200 animate-pulse'
                      : 'bg-black/70 border-white/10 text-zinc-400'
                  }`}>
                    📱 Phone: {ciraData.counts['phone'] || 0}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold backdrop-blur-md border ${
                    (ciraData.counts['Monitor'] || 0) > 0
                      ? 'bg-amber-950/90 border-amber-500 text-amber-200'
                      : 'bg-black/70 border-white/10 text-zinc-400'
                  }`}>
                    🖥️ Monitor: {ciraData.counts['Monitor'] || 0}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-black/70 border-white/10 text-emerald-400 backdrop-blur-md">
                    👤 Normal: {ciraData.counts['normal'] || 0}
                  </span>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Ambient Room Perspective & Desk Layout */}
            <svg 
              className="absolute inset-0 w-full h-full text-zinc-800/40 select-none" 
              viewBox="0 0 400 225" 
              preserveAspectRatio="none"
            >
              <line x1="0" y1="225" x2="160" y2="40" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 3" />
              <line x1="80" y1="225" x2="180" y2="40" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 3" />
              <line x1="320" y1="225" x2="220" y2="40" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 3" />
              <line x1="400" y1="225" x2="240" y2="40" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 3" />
              
              <path d="M 40 180 L 150 180 L 140 215 L 30 215 Z" fill="#11131a" stroke="#1f2430" strokeWidth="1" />
              <path d="M 210 180 L 320 180 L 330 215 L 220 215 Z" fill="#11131a" stroke="#1f2430" strokeWidth="1" />
              <path d="M 70 120 L 160 120 L 152 145 L 62 145 Z" fill="#11131a" stroke="#1f2430" strokeWidth="1" />
              <path d="M 210 120 L 300 120 L 308 145 L 218 145 Z" fill="#11131a" stroke="#1f2430" strokeWidth="1" />
              <path d="M 100 70 L 170 70 L 165 90 L 95 90 Z" fill="#11131a" stroke="#1f2430" strokeWidth="0.8" />
              <path d="M 210 70 L 280 70 L 285 90 L 215 90 Z" fill="#11131a" stroke="#1f2430" strokeWidth="0.8" />
            </svg>

            {/* Clean Standby Badge */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
              <div className="px-3.5 py-2 rounded-xl liquid-glass border border-white/10 text-center space-y-1 backdrop-blur-sm">
                <div className="flex items-center justify-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="font-mono text-xs font-semibold text-zinc-200 tracking-wide">
                    {feed.name.split(' ? ')[0]} ? STANDBY
                  </span>
                </div>
                <div className="font-mono text-[10px] text-zinc-500">
                  Ready for camera connection
                </div>
              </div>
            </div>
          </>
        )}

        {/* Hover Action Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-25 flex items-center justify-center gap-3 backdrop-blur-[1px]">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onExpand(feed);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg liquid-glass text-xs text-white border border-white/20 shadow-lg font-medium transition-transform transform active:scale-95"
          >
            <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Expand Camera</span>
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onManualFlag(feed);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-xs text-rose-200 border border-rose-500/40 shadow-lg font-medium transition-transform transform active:scale-95"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Flag Anomaly</span>
          </button>
        </div>

        {/* ONVIF PTZ D-Pad Controller Overlay (Diagram 4) */}
        <CameraPtzOverlay cameraId={feed.id} isExpandedView={false} />
      </div>

      {/* Bottom Camera Metadata Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-zinc-950/50 border-t border-white/5 text-xs">
        <div className="flex items-center gap-2 truncate max-w-[65%]">
          <span className="font-mono text-[10px] text-zinc-500 truncate">
            {feed.rtspUrl}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {feed.activeAlertCount > 0 ? (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-300 bg-rose-950/70 border border-rose-500/40 px-2 py-0.5 rounded-md">
              <AlertCircle className="w-3 h-3 text-rose-400" />
              <span>{feed.activeAlertCount} Detected</span>
            </span>
          ) : (
            <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Nominal</span>
            </span>
          )}

          <button
            onClick={() => onExpand(feed)}
            className="p-1 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors ml-1"
            title="Full Camera Analysis"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
