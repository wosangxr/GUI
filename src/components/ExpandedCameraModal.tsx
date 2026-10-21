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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-6xl rounded-2xl liquid-glass-modal shadow-2xl flex flex-col overflow-hidden max-h-[94vh]"
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
                <svg className="absolute inset-0 w-full h-full text-zinc-800/40" viewBox="0 0 400 225" preserveAspectRatio="none">
                  <line x1="0" y1="225" x2="160" y2="40" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 3" />
                  <line x1="400" y1="225" x2="240" y2="40" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 3" />
                  <path d="M 40 180 L 150 180 L 140 215 L 30 215 Z" fill="#11131a" stroke="#1f2430" strokeWidth="1" />
                  <path d="M 210 180 L 320 180 L 330 215 L 220 215 Z" fill="#11131a" stroke="#1f2430" strokeWidth="1" />
                  <path d="M 70 120 L 160 120 L 152 145 L 62 145 Z" fill="#11131a" stroke="#1f2430" strokeWidth="1" />
                  <path d="M 210 120 L 300 120 L 308 145 L 218 145 Z" fill="#11131a" stroke="#1f2430" strokeWidth="1" />
                </svg>

                {feed.students.map((student) => {
                  const isFlagged = student.status === 'flagged';
                  const isSuspicious = student.status === 'suspicious';
                  return (
                    <div
                      key={student.id}
                      className="absolute"
                      style={{
                        left: `${student.x}%`,
                        top: `${student.y}%`,
                        width: `${student.width}%`,
                        height: `${student.height}%`,
                      }}
                    >
                      {visionSettings.showBoundingBoxes && (
                        <div
                          className={`absolute inset-0 border-2 rounded-sm ${
                            isFlagged
                              ? 'border-rose-500 bg-rose-500/10'
                              : isSuspicious
                              ? 'border-amber-400 bg-amber-400/10'
                              : 'border-cyan-500 bg-cyan-500/5'
                          }`}
                        >
                          <div className="absolute -top-6 left-0 px-1.5 py-0.2 bg-black/90 border border-current rounded text-[9px] font-mono text-white whitespace-nowrap">
                            {student.seat} | {student.id} | {student.postureScore}%
                          </div>
                        </div>
                      )}

                      {visionSettings.showGazeVectors && (
                        <svg className="absolute -inset-10 w-[200%] h-[200%] pointer-events-none z-20">
                          <line
                            x1="50%"
                            y1="30%"
                            x2={`${50 + Math.sin((student.gazeAngle * Math.PI) / 180) * 35}%`}
                            y2={`${30 + Math.cos((student.gazeAngle * Math.PI) / 180) * 30}%`}
                            stroke={isFlagged ? '#f43f5e' : isSuspicious ? '#fbbf24' : '#22d3ee'}
                            strokeWidth="2"
                            strokeDasharray="2 2"
                          />
                        </svg>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Embed D-Pad in Expanded View */}
              <CameraPtzOverlay cameraId={feed.id} isExpandedView={true} />

              <div className="absolute bottom-3 left-3 z-20 font-mono text-[10px] text-zinc-400 bg-black/70 px-2 py-0.5 rounded border border-white/5">
                ONVIF PTZ ACTIVE · RESOLUTION: {feed.resolution} · CODEC: H.265
              </div>
            </div>

            {/* Vision Controls Toolbar */}
            <div className="mt-3 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-zinc-400">CV Layers:</span>
                <button
                  onClick={() => toggleVision('showBoundingBoxes')}
                  className={`px-2.5 py-1 rounded-lg text-xs border ${
                    visionSettings.showBoundingBoxes
                      ? 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300'
                      : 'bg-zinc-900 border-white/5 text-zinc-500'
                  }`}
                >
                  Bounding Boxes
                </button>
                <button
                  onClick={() => toggleVision('showGazeVectors')}
                  className={`px-2.5 py-1 rounded-lg text-xs border ${
                    visionSettings.showGazeVectors
                      ? 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300'
                      : 'bg-zinc-900 border-white/5 text-zinc-500'
                  }`}
                >
                  Gaze Rays
                </button>
                <button
                  onClick={() => toggleVision('showPoseSkeleton')}
                  className={`px-2.5 py-1 rounded-lg text-xs border ${
                    visionSettings.showPoseSkeleton
                      ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                      : 'bg-zinc-900 border-white/5 text-zinc-500'
                  }`}
                >
                  Pose Skeleton
                </button>
              </div>

              <div className="text-[11px] text-zinc-400 font-mono">
                {feed.angleDescription}
              </div>
            </div>
          </div>

          {/* Right: Examinee Roster & Stream Diagnostics */}
          <div className="lg:w-4/12 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Examinees in View ({feed.students.length})
                  </span>
                </div>
                <span className="text-[11px] font-mono text-zinc-500">Frustum Tracking</span>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {feed.students.map((student) => {
                  const isFlagged = student.status === 'flagged';
                  const isSuspicious = student.status === 'suspicious';

                  return (
                    <div
                      key={student.id}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-colors ${
                        isFlagged
                          ? 'bg-rose-950/60 border-rose-500/40 text-rose-200'
                          : isSuspicious
                          ? 'bg-amber-950/60 border-amber-500/40 text-amber-200'
                          : 'liquid-glass-card text-zinc-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5 font-semibold text-zinc-100">
                          <span>{student.seat}</span>
                          <span className="text-zinc-500">·</span>
                          <span>{student.name}</span>
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                          ID: {student.id} · Posture: {student.postureScore}%
                        </div>
                        {student.notes && (
                          <div className="text-[10px] text-rose-400 font-medium mt-1">
                            {student.notes}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => onFlagStudent(student, feed)}
                        className="px-2.5 py-1 rounded-lg liquid-glass text-[11px] text-rose-300 hover:text-rose-200 flex items-center gap-1 transition-colors"
                      >
                        <Flag className="w-3 h-3 text-rose-400" />
                        <span>Flag</span>
                      </button>
                    </div>
                  );
                })}
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
