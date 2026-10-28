import React, { useState } from 'react';
import { 
  Grid2X2, 
  Square, 
  Layers, 
  Eye, 
  Flame, 
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  Compass
} from 'lucide-react';
import { CameraFeed, VisionOverlaySettings } from '../types/proctor';
import { CameraFeedCard } from './CameraFeedCard';

interface CameraGridProps {
  cameras: CameraFeed[];
  onExpandCamera: (camera: CameraFeed) => void;
  onManualFlag: (camera: CameraFeed) => void;
  onSimulateAnomaly: () => void;
}

export const CameraGrid: React.FC<CameraGridProps> = ({
  cameras,
  onExpandCamera,
  onManualFlag,
  onSimulateAnomaly,
}) => {
  const [layoutMode, setLayoutMode] = useState<'2x2' | 'single' | 'focused'>('2x2');
  const [focusedCameraId, setFocusedCameraId] = useState<string>(cameras[0]?.id || 'cam-01');

  const [visionSettings, setVisionSettings] = useState<VisionOverlaySettings>({
    showBoundingBoxes: true,
    showGazeVectors: true,
    showPoseSkeleton: false,
    showHeatmap: false,
    showTelemetryFps: true,
  });

  const toggleVisionSetting = (key: keyof VisionOverlaySettings) => {
    setVisionSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const focusedCamera = cameras.find((c) => c.id === focusedCameraId) || cameras[0];

  return (
    <div className="flex flex-col h-full liquid-glass rounded-xl p-3.5 lg:p-4">
      {/* Camera Grid Controls & AI Vision Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-white/5 text-xs">
        {/* Left: Section Header & Mode */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-100 text-sm tracking-tight">
              Live RTSP Surveillance Feeds
            </span>
            <span className="font-mono text-[11px] text-cyan-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
              4 CHANNELS · ONVIF PTZ
            </span>
          </div>
        </div>

        {/* Right: Layout Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Grid Layout Switcher */}
          <div className="flex items-center gap-1 bg-zinc-950/60 border border-white/5 p-1 rounded-xl">
            <button
              onClick={() => setLayoutMode('2x2')}
              className={`p-1 rounded-lg text-zinc-400 transition-colors ${
                layoutMode === '2x2' ? 'bg-zinc-800 text-white shadow-sm' : 'hover:text-zinc-200'
              }`}
              title="Quad Grid 2x2 View"
            >
              <Grid2X2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setLayoutMode('focused')}
              className={`p-1 rounded-lg text-zinc-400 transition-colors ${
                layoutMode === 'focused' ? 'bg-zinc-800 text-white shadow-sm' : 'hover:text-zinc-200'
              }`}
              title="Focus View (1 Large + 3 Small)"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Simulate Anomaly Button */}
          <button
            onClick={onSimulateAnomaly}
            className="flex items-center gap-1 px-3 py-1 rounded-xl liquid-glass hover:border-cyan-500/50 text-cyan-300 text-[11px] font-semibold transition-all shadow-sm"
          >
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Simulate Anomaly</span>
          </button>
        </div>
      </div>

      {/* Camera Grid Viewports */}
      {layoutMode === '2x2' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4 flex-1">
          {cameras.map((camera) => (
            <CameraFeedCard
              key={camera.id}
              feed={camera}
              visionSettings={visionSettings}
              onExpand={onExpandCamera}
              onManualFlag={onManualFlag}
            />
          ))}
        </div>
      )}

      {layoutMode === 'focused' && (
        <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 flex-1">
          <div className="lg:w-3/4 flex-1">
            <CameraFeedCard
              feed={focusedCamera}
              visionSettings={visionSettings}
              onExpand={onExpandCamera}
              onManualFlag={onManualFlag}
              isFocused={true}
            />
          </div>

          <div className="lg:w-1/4 flex flex-col gap-2.5">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Select Feed
            </span>
            {cameras.map((cam) => (
              <button
                key={cam.id}
                onClick={() => setFocusedCameraId(cam.id)}
                className={`p-2.5 rounded-xl text-left border transition-all flex items-center justify-between ${
                  cam.id === focusedCameraId
                    ? 'liquid-glass border-cyan-500/70 text-white shadow-lg'
                    : 'liquid-glass-card border-white/5 text-zinc-400 hover:border-white/20'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold text-zinc-200">{cam.name}</div>
                  <div className="text-[11px] text-zinc-500 font-mono">{cam.location}</div>
                </div>
                {cam.activeAlertCount > 0 ? (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-950 text-rose-300 border border-rose-500/40">
                    {cam.activeAlertCount} alert
                  </span>
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
