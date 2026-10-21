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

        {/* Heatmap Layer */}
        {visionSettings.showHeatmap && (
          <div className="absolute inset-0 pointer-events-none z-15 mix-blend-screen opacity-25 bg-gradient-to-tr from-cyan-500/20 via-rose-500/30 to-amber-500/20 animate-pulse" />
        )}

        {/* Examinee Silhouettes & Computer Vision Bounding Boxes */}
        {feed.students.map((student) => {
          const isFlagged = student.status === 'flagged';
          const isSuspicious = student.status === 'suspicious';

          const boxBorderColor = isFlagged
            ? 'border-rose-500 shadow-rose-500/40'
            : isSuspicious
            ? 'border-amber-400 shadow-amber-500/30'
            : 'border-cyan-500/70 shadow-cyan-500/15';

          const labelBg = isFlagged
            ? 'bg-rose-950/90 text-rose-300 border-rose-600'
            : isSuspicious
            ? 'bg-amber-950/90 text-amber-200 border-amber-600'
            : 'bg-zinc-950/90 text-cyan-300 border-cyan-800/80';

          return (
            <div
              key={student.id}
              className="absolute transition-all duration-300"
              style={{
                left: `${student.x}%`,
                top: `${student.y}%`,
                width: `${student.width}%`,
                height: `${student.height}%`,
              }}
            >
              <div className="relative w-full h-full flex flex-col items-center justify-end pb-1">
                <div 
                  className={`w-4 h-4 rounded-full border mb-1 transition-transform ${
                    isFlagged ? 'bg-rose-950/90 border-rose-400' : isSuspicious ? 'bg-amber-950/90 border-amber-400' : 'bg-zinc-800/80 border-zinc-600'
                  }`}
                  style={{
                    transform: `rotate(${student.gazeAngle * 0.4}deg)`
                  }}
                />
                <div className={`w-8 h-8 rounded-t-md border-t border-x ${
                  isFlagged ? 'bg-rose-950/80 border-rose-600' : isSuspicious ? 'bg-amber-950/80 border-amber-600' : 'bg-zinc-850/80 border-zinc-700'
                }`} />

                {isFlagged && student.id === 'STU-8477' && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-4 h-5 bg-cyan-300 rounded-[2px] shadow-[0_0_12px_#38bdf8] border border-cyan-100 animate-pulse" />
                )}
              </div>

              {visionSettings.showBoundingBoxes && (
                <div
                  className={`absolute inset-0 border-2 rounded-sm shadow-sm transition-all ${boxBorderColor} ${
                    isFlagged ? 'animate-pulse' : ''
                  }`}
                >
                  <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-current" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-current" />
                  <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-current" />
                  <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-current" />

                  <div
                    className={`absolute -top-6 left-0 px-1.5 py-0.2 rounded border text-[9px] font-mono whitespace-nowrap z-20 flex items-center gap-1 ${labelBg}`}
                  >
                    {isFlagged && <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />}
                    <span>{student.seat}</span>
                    <span className="opacity-70">|</span>
                    <span>{student.id}</span>
                  </div>

                  {(isFlagged || isSuspicious) && (
                    <div
                      className={`absolute -bottom-5 left-0 px-1 py-0.2 rounded border text-[8px] font-mono whitespace-nowrap font-bold z-20 ${
                        isFlagged
                          ? 'bg-rose-950 text-rose-200 border-rose-500'
                          : 'bg-amber-950 text-amber-200 border-amber-500'
                      }`}
                    >
                      {isFlagged ? '! PHONE_DETECTED (97%)' : '? HEAD_YAW +58°'}
                    </div>
                  )}
                </div>
              )}

              {visionSettings.showGazeVectors && (
                <svg className="absolute -inset-10 w-[200%] h-[200%] pointer-events-none z-20">
                  <line
                    x1="50%"
                    y1="30%"
                    x2={`${50 + Math.sin((student.gazeAngle * Math.PI) / 180) * 40}%`}
                    y2={`${30 + Math.cos((student.gazeAngle * Math.PI) / 180) * 35}%`}
                    stroke={isFlagged ? '#f43f5e' : isSuspicious ? '#fbbf24' : '#22d3ee'}
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                  <circle
                    cx={`${50 + Math.sin((student.gazeAngle * Math.PI) / 180) * 40}%`}
                    cy={`${30 + Math.cos((student.gazeAngle * Math.PI) / 180) * 35}%`}
                    r="2.5"
                    fill={isFlagged ? '#f43f5e' : isSuspicious ? '#fbbf24' : '#22d3ee'}
                  />
                </svg>
              )}

              {visionSettings.showPoseSkeleton && (
                <div className="absolute inset-x-2 top-2 bottom-3 pointer-events-none z-15 flex flex-col items-center justify-between opacity-80">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <div className="w-4 h-0.5 bg-emerald-400" />
                  <div className="w-full flex justify-between px-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                </div>
              )}
            </div>
          );
        })}

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
