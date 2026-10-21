import React, { useState, useEffect } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Compass, 
  RotateCcw,
  Sliders,
  Radio
} from 'lucide-react';
import { cameraPtzService } from '../services/cameraPtzService';
import { CameraPTZState } from '../services/types';
import { eventBus } from '../services/eventBus';
import { playActionBlip } from '../utils/audio';

interface CameraPtzOverlayProps {
  cameraId: string;
  isExpandedView?: boolean;
}

export const CameraPtzOverlay: React.FC<CameraPtzOverlayProps> = ({ cameraId, isExpandedView = false }) => {
  const [ptzState, setPtzState] = useState<CameraPTZState>(cameraPtzService.getPTZState(cameraId));
  const [isOpen, setIsOpen] = useState(isExpandedView);

  useEffect(() => {
    const unsub = eventBus.on<CameraPTZState>('PTZ_MOVED', (updated) => {
      if (updated && updated.cameraId === cameraId) {
        setPtzState({ ...updated });
      }
    });
    return () => unsub();
  }, [cameraId]);

  const handleMove = (e: React.MouseEvent, direction: 'left' | 'right' | 'up' | 'down') => {
    e.stopPropagation();
    playActionBlip('click');
    cameraPtzService.move(cameraId, direction, ptzState.speed);
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    playActionBlip('click');
    cameraPtzService.resetToPreset(cameraId);
  };

  return (
    <div 
      className={`absolute z-30 transition-all ${
        isExpandedView ? 'bottom-5 right-5' : 'bottom-2 right-2'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {!isOpen && !isExpandedView ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1 px-2 py-1 rounded-lg liquid-glass text-[10px] font-mono font-medium text-cyan-300 hover:text-white border border-white/10 hover:border-cyan-500/40 shadow-lg transition-transform transform active:scale-95"
          title="Open ONVIF PTZ D-Pad Controller"
        >
          <Compass className="w-3 h-3 text-cyan-400" />
          <span>PTZ ({ptzState.pan}°/{ptzState.tilt}°)</span>
        </button>
      ) : (
        <div className="liquid-glass rounded-xl p-2.5 flex flex-col items-center gap-2 border border-white/15 shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <div className="w-full flex items-center justify-between gap-3 pb-1 border-b border-white/10 text-[10px] font-mono">
            <div className="flex items-center gap-1 text-cyan-300">
              <Radio className="w-2.5 h-2.5 text-rose-500 animate-pulse" />
              <span>ONVIF PTZ</span>
            </div>
            <div className="text-zinc-400 tabular-nums">
              P:{ptzState.pan}° T:{ptzState.tilt}°
            </div>
            {!isExpandedView && (
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs px-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* D-Pad Buttons */}
          <div className="relative w-20 h-20 flex items-center justify-center">
            {/* Center Home Reset */}
            <button
              onClick={handleReset}
              className="w-6 h-6 rounded-full bg-zinc-900/90 hover:bg-cyan-950 border border-white/10 hover:border-cyan-500/50 flex items-center justify-center text-zinc-300 hover:text-cyan-300 transition-colors z-10 shadow-sm"
              title="Reset to Center Preset"
            >
              <RotateCcw className="w-3 h-3" />
            </button>

            {/* Up */}
            <button
              onClick={(e) => handleMove(e, 'up')}
              className="absolute top-0 w-7 h-6 rounded-t-md bg-zinc-900/80 hover:bg-zinc-850 text-zinc-300 hover:text-white border border-white/10 flex items-center justify-center transition-colors active:bg-cyan-900"
              title="Tilt Up"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>

            {/* Down */}
            <button
              onClick={(e) => handleMove(e, 'down')}
              className="absolute bottom-0 w-7 h-6 rounded-b-md bg-zinc-900/80 hover:bg-zinc-850 text-zinc-300 hover:text-white border border-white/10 flex items-center justify-center transition-colors active:bg-cyan-900"
              title="Tilt Down"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {/* Left */}
            <button
              onClick={(e) => handleMove(e, 'left')}
              className="absolute left-0 w-6 h-7 rounded-l-md bg-zinc-900/80 hover:bg-zinc-850 text-zinc-300 hover:text-white border border-white/10 flex items-center justify-center transition-colors active:bg-cyan-900"
              title="Pan Left"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* Right */}
            <button
              onClick={(e) => handleMove(e, 'right')}
              className="absolute right-0 w-6 h-7 rounded-r-md bg-zinc-900/80 hover:bg-zinc-850 text-zinc-300 hover:text-white border border-white/10 flex items-center justify-center transition-colors active:bg-cyan-900"
              title="Pan Right"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
