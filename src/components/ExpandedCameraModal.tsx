import React, { useState } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Users, 
  Flag,
  Video,
  Compass
} from 'lucide-react';
import { CameraFeed, VisionOverlaySettings, StudentInFeed } from '../types/proctor';
import { CameraPtzOverlay } from './CameraPtzOverlay';
import { playActionBlip } from '../utils/audio';

interface ExpandedCameraModalProps {
  feed: CameraFeed | null;
  onClose: () => void;
  onFlagStudent: (student: StudentInFeed, feed: CameraFeed) => void;
}

export const ExpandedCameraModal: React.FC<ExpandedCameraModalProps> = ({
  feed,
  onClose,
  onFlagStudent,
}) => {
  if (!feed) return null;

  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [ciraData, setCiraData] = useState<{
    counts?: Record<string, number>;
    has_anomaly?: boolean;
    objects?: Array<{ class_name: string; confidence: number }>;
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
  const [visionSettings, setVisionSettings] = useState<VisionOverlaySettings>({
    showBoundingBoxes: true,
    showGazeVectors: true,
    showPoseSkeleton: true,
    showHeatmap: false,
    showTelemetryFps: true,
  });

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(3, Math.max(1, Number((prev + delta).toFixed(1)))));
    playActionBlip('click');
  };

  const toggleVision = (key: keyof VisionOverlaySettings) => {
    setVisionSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    playActionBlip('click');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto overscroll-contain"
      onWheel={(e) => e.stopPropagation()}
    >
      <div 
        className="relative w-full max-w-6xl rounded-2xl liquid-glass-modal shadow-2xl flex flex-col overflow-hidden max-h-[94vh] overscroll-contain my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-white/10 bg-zinc-950/40 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 shadow-inner">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white tracking-tight">
                  {feed.name}
                </span>
                <span className="font-mono text-[11px] text-emerald-300 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                  MERCUSYS MC210 · ONVIF PTZ
                </span>
              </div>
              <div className="text-[11px] text-zinc-400 mt-0.5 font-mono">
                {feed.location} · {feed.rtspUrl}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 bg-zinc-950/60 border border-white/10 p-1 rounded-xl">
              <button
                onClick={() => handleZoom(-0.5)}
                className="p-1 text-zinc-400 hover:text-white"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-zinc-300 px-1.5">{zoomLevel}x</span>
              <button
                onClick={() => handleZoom(0.5)}
                className="p-1 text-zinc-400 hover:text-white"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="p-1 text-zinc-400 hover:text-white"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row">
          {/* Left: Expanded Surveillance Viewport with Full PTZ D-Pad */}
          <div className="lg:w-8/12 p-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10">
            <div className="relative aspect-video w-full rounded-xl bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 border border-white/10 overflow-hidden shadow-2xl flex items-center justify-center">
              <div className="absolute inset-0 cctv-scanlines opacity-40 z-10 pointer-events-none" />

              <div 
                className="relative w-full h-full transition-transform duration-200 origin-center"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                {feed.id === 'cam-01' ? (
                  <>
                    <img 
                      src="http://172.20.10.4:5000/video_feed" 
                      alt="AI Processed Live Feed (MERCUSYS MC210)" 
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    {/* CiRA CORE Detection HUD in Expanded View */}
                    <div className="absolute top-3.5 left-3.5 z-20 flex flex-wrap items-center gap-2 pointer-events-none">
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/80 border border-cyan-500/50 text-xs font-mono text-cyan-300 backdrop-blur-md shadow-lg">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        CiRA CORE AI DeepDetect
                      </span>
                      {ciraData?.counts && (
                        <>
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold backdrop-blur-md border ${
                            (ciraData.counts['phone'] || 0) > 0
                              ? 'bg-rose-950/90 border-rose-500 text-rose-200 animate-pulse'
                              : 'bg-black/70 border-white/10 text-zinc-400'
                          }`}>
                            📱 Phone: {ciraData.counts['phone'] || 0}
                          </span>
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold backdrop-blur-md border ${
                            (ciraData.counts['Monitor'] || 0) > 0
                              ? 'bg-amber-950/90 border-amber-500 text-amber-200'
                              : 'bg-black/70 border-white/10 text-zinc-400'
                          }`}>
                            🖥️ Monitor: {ciraData.counts['Monitor'] || 0}
                          </span>
                          <span className="px-2.5 py-1 rounded-lg text-xs font-mono bg-black/70 border-white/10 text-emerald-400 backdrop-blur-md">
                            👤 Normal: {ciraData.counts['normal'] || 0}
                          </span>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <svg className="absolute inset-0 w-full h-full text-zinc-800/40" viewBox="0 0 400 225" preserveAspectRatio="none">
                    <line x1="0" y1="225" x2="160" y2="40" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 3" />
                    <line x1="400" y1="225" x2="240" y2="40" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 3" />
                    <path d="M 40 180 L 150 180 L 140 215 L 30 215 Z" fill="#11131a" stroke="#1f2430" strokeWidth="1" />
                    <path d="M 210 180 L 320 180 L 330 215 L 220 215 Z" fill="#11131a" stroke="#1f2430" strokeWidth="1" />
                    <path d="M 70 120 L 160 120 L 152 145 L 62 145 Z" fill="#11131a" stroke="#1f2430" strokeWidth="1" />
                    <path d="M 210 120 L 300 120 L 308 145 L 218 145 Z" fill="#11131a" stroke="#1f2430" strokeWidth="1" />
                  </svg>
                )}

                {feed.id !== 'cam-01' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                    <div className="px-4 py-2.5 rounded-xl liquid-glass border border-white/10 text-center space-y-1.5 backdrop-blur-sm shadow-xl">
                      <div className="flex items-center justify-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        <span className="font-mono text-sm font-semibold text-zinc-100 tracking-wider">
                          {feed.name.split(' ? ')[0]} ? STANDBY
                        </span>
                      </div>
                      <div className="font-mono text-xs text-zinc-400">
                        MERCUSYS MC210 ? Ready for camera connection
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Embed D-Pad in Expanded View */}
              <CameraPtzOverlay cameraId={feed.id} isExpandedView={true} />

              <div className="absolute bottom-3 left-3 z-20 font-mono text-[10px] text-zinc-400 bg-black/70 px-2 py-0.5 rounded border border-white/5">
                ONVIF PTZ ACTIVE · RESOLUTION: {feed.resolution} · CODEC: H.265
              </div>
            </div>

            {/* Camera Status Footer */}
            <div className="mt-2.5 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className={`flex items-center gap-1.5 font-mono text-[11px] px-2 py-0.5 rounded-md border ${
                  feed.id === 'cam-01'
                    ? 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30'
                    : 'text-cyan-400 bg-cyan-950/60 border-cyan-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                    feed.id === 'cam-01' ? 'bg-emerald-400' : 'bg-cyan-400'
                  }`} />
                  {feed.id === 'cam-01' ? 'REAL CAMERA STREAM' : 'STANDBY STREAM ? READY FOR LINK'}
                </span>
              </div>

              <div className="text-[11px] text-zinc-400 font-mono">
                {feed.angleDescription}
              </div>
            </div>
          </div>

                    {/* Right: Camera Diagnostics & Controls */}
          <div className="lg:w-4/12 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    {feed.id === 'cam-01' ? 'Live Camera Feed' : `${feed.name.split(' ? ')[0]} Diagnostics`}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-zinc-500">
                  {feed.id === 'cam-01' ? 'Real-time RTSP' : 'Standby Channel'}
                </span>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                <div className="p-3.5 rounded-xl liquid-glass-card text-xs font-mono space-y-2 border border-white/10">
                  <div className="flex justify-between items-center font-semibold">
                    <span className="text-zinc-400">STATUS:</span>
                    <span className={`flex items-center gap-1.5 ${
                      feed.id === 'cam-01' ? 'text-emerald-400' : 'text-cyan-300'
                    }`}>
                      <span className={`w-2 h-2 rounded-full animate-pulse ${
                        feed.id === 'cam-01' ? 'bg-emerald-400' : 'bg-cyan-400'
                      }`}></span>
                      {feed.id === 'cam-01' ? 'LIVE CONNECTED' : 'STANDBY ? READY'}
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>DEVICE:</span>
                    <span className="text-zinc-200">MERCUSYS MC210</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>ENDPOINT:</span>
                    <span className="text-cyan-300 truncate max-w-[170px]">{feed.rtspUrl}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>AI ENGINE:</span>
                    <span className="text-amber-300">CiRA CORE / YOLOv4-tiny</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>RESOLUTION:</span>
                    <span className="text-zinc-200">{feed.resolution}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>PTZ CONTROL:</span>
                    <span className="text-emerald-300">ONVIF ContinuousMove</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/40 text-[11px] text-zinc-400 border border-white/5 mt-2">
                    {feed.id === 'cam-01'
                      ? '?? ????? 1 ??????????????????????????? PTZ ?????????????'
                      : '?? ??????????????????????????????????????? (RTSP & ONVIF PTZ ???????????)'}
                  </div>
                </div>
              </div>

              {/* Stream Telemetry Diagnostics */}
              <div className="p-3.5 rounded-xl liquid-glass-card text-xs font-mono space-y-1.5">
                <div className="text-[10px] uppercase font-bold text-zinc-400 pb-1 border-b border-white/5">
                  ONVIF & Network Telemetry
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Packet Latency:</span>
                  <span className="text-cyan-400">18.4 ms (Nominal)</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Jitter Buffer:</span>
                  <span className="text-zinc-200">2.1 ms</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Edge AI Inference:</span>
                  <span className="text-zinc-200">CiRA CORE / 22ms</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10">
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl liquid-glass text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
              >
                Close Full Camera View
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
