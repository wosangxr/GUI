import React, { useState, useEffect } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Compass, 
  RotateCcw,
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
  // Default to collapsed so the live camera view is clean and unobstructed
  const [isOpen, setIsOpen] = useState(false);

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

  const displayPan = Math.round(ptzState.pan);
  const displayTilt = Math.round(ptzState.tilt);

  return (
    <div 
      className={`absolute z-30 select-none ${
        isExpandedView ? 'bottom-4 right-4' : 'bottom-2 right-2'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {!isOpen ? (
        /* Collapsed Minimalist Pill Button - strictly fixed and never wraps */
        <button
          onClick={() => {
            playActionBlip('click');
            setIsOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg liquid-glass text-[11px] font-mono font-medium text-cyan-300 hover:text-white border border-white/10 hover:border-cyan-500/40 shadow-lg transition-colors active:bg-cyan-950 backdrop-blur-md whitespace-nowrap"
          title="คลิกเพื่อเปิดแผงควบคุมทิศทางกล้อง PTZ"
        >
          <Compass className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
          <span className="whitespace-nowrap">PTZ ({displayPan}°/{displayTilt}°)</span>
        </button>
      ) : (
        /* Expanded D-Pad Panel - strictly fixed width (w-52) with NO wrapping or layout expansion */
        <div className="w-52 min-w-[208px] max-w-[208px] liquid-glass rounded-xl p-3 flex flex-col items-center gap-2.5 border border-white/15 shadow-2xl backdrop-blur-xl select-none">
          {/* Header Bar with Fixed Width & No Wrapping */}
          <div className="w-full flex items-center justify-between pb-1.5 border-b border-white/10 text-[10px] font-mono whitespace-nowrap">
            <div className="flex items-center gap-1.5 text-cyan-300 flex-shrink-0">
              <Radio className="w-2.5 h-2.5 text-rose-500 animate-pulse flex-shrink-0" />
              <span className="font-semibold tracking-wider whitespace-nowrap">ONVIF PTZ</span>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-zinc-400 tabular-nums font-mono text-[10px] text-right whitespace-nowrap">
                {displayPan}°/{displayTilt}°
              </span>
              <button
                onClick={() => {
                  playActionBlip('click');
                  setIsOpen(false);
                }}
                className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center flex-shrink-0"
                title="ซ่อนแผงควบคุม"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Symmetrical Equal-sized 3x3 D-Pad */}
          <div className="grid grid-cols-3 grid-rows-3 gap-1.5 w-28 h-28 place-items-center select-none">
            <div />
            <button
              onClick={(e) => handleMove(e, 'up')}
              className="w-8 h-8 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 flex items-center justify-center transition-colors active:bg-cyan-900 shadow-sm"
              title="Tilt Up"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <div />

            <button
              onClick={(e) => handleMove(e, 'left')}
              className="w-8 h-8 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 flex items-center justify-center transition-colors active:bg-cyan-900 shadow-sm"
              title="Pan Left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleReset}
              className="w-8 h-8 rounded-lg bg-zinc-900/90 hover:bg-cyan-950 border border-white/10 hover:border-cyan-500/50 flex items-center justify-center text-zinc-300 hover:text-cyan-300 transition-colors shadow-sm"
              title="Reset to Center Preset"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={(e) => handleMove(e, 'right')}
              className="w-8 h-8 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 flex items-center justify-center transition-colors active:bg-cyan-900 shadow-sm"
              title="Pan Right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div />
            <button
              onClick={(e) => handleMove(e, 'down')}
              className="w-8 h-8 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 flex items-center justify-center transition-colors active:bg-cyan-900 shadow-sm"
              title="Tilt Down"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <div />
          </div>
        </div>
      )}
    </div>
  );
};
