import React, { useState, useEffect } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  Download, 
  Check, 
  ShieldAlert, 
  Activity, 
  Send, 
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Clock,
  Layers,
  Database,
  Radio,
  Lock
} from 'lucide-react';
import { IncidentAlert } from '../types/proctor';
import { UserRecord } from '../services/types';
import { databaseService } from '../services/databaseService';
import { playActionBlip } from '../utils/audio';

interface EvidencePlayerModalProps {
  alert: IncidentAlert | null;
  onClose: () => void;
  onConfirmViolation: (alertId: string, note?: string) => void;
  onDismissAlert: (alertId: string, note?: string) => void;
  currentUser?: UserRecord;
  lang?: 'en' | 'th';
}

export const EvidencePlayerModal: React.FC<EvidencePlayerModalProps> = ({
  alert,
  onClose,
  onConfirmViolation,
  onDismissAlert,
  currentUser,
  lang = 'th',
}) => {
  if (!alert) return null;

  // Diagram 3: 10-second clip (5s pre-event buffer + 5s post-event recording)
  const totalDuration = 10;
  const triggerPointSec = 5.0; // Event trigger occurs at 5.0s

  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState<number>(triggerPointSec);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showOverlays, setShowOverlays] = useState(true);
  const [proctorNote, setProctorNote] = useState(alert.proctorNote || '');
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= totalDuration) {
            return 0; // loop
          }
          return Number((prev + 0.1 * playbackSpeed).toFixed(1));
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, totalDuration]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    playActionBlip('click');
  };

  const handleSeek = (val: number) => {
    setCurrentTime(val);
  };

  const handleStepFrame = (delta: number) => {
    setIsPlaying(false);
    setCurrentTime((prev) => Math.min(totalDuration, Math.max(0, Number((prev + delta * 0.1).toFixed(1)))));
    playActionBlip('click');
  };

  const handleDispatchProctor = () => {
    setDispatchSuccess(true);
    databaseService.addAuditLog({
      user_id: 1,
      username: 'admin',
      action: 'DISPATCH_PROCTOR',
      ip_address: '10.114.70.15',
      details: `Assistant proctor dispatched to examinee ${alert.studentName} at ${alert.seatNumber}`,
    });
    playActionBlip('confirm');
    setTimeout(() => setDispatchSuccess(false), 3000);
  };

  const handleDownloadClip = () => {
    const content = `ExamGuard AI Evidence Clip Metadata
Clip File: ${alert.evidenceClip.clipName}
Total Duration: 10.0 seconds (5s Pre-event Buffer + 5s Post-event Recording)
Event Trigger: 00:05.00
Incident Type: ${alert.incidentType}
Confidence: ${alert.confidence}%
Student: ${alert.studentName} (${alert.studentId})
Seat: ${alert.seatNumber}
Camera: ${alert.cameraName}
Host Node: Raspberry Pi 5 (IP: 10.114.70.249)
Storage Path: /highlights/${alert.evidenceClip.clipName}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = alert.evidenceClip.clipName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    playActionBlip('click');
  };

  // Check if playhead is around the anomaly trigger point (+/- 1.8 seconds)
  const isAnomalyWindow = Math.abs(currentTime - triggerPointSec) <= 1.8;
  const isPreBuffer = currentTime < triggerPointSec;

  return (
    <div 
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto overscroll-contain"
      onWheel={(e) => e.stopPropagation()}
    >
      <div 
        className="relative w-full max-w-5xl rounded-2xl liquid-glass-modal shadow-2xl flex flex-col overflow-hidden max-h-[92vh] overscroll-contain my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-white/10 bg-zinc-950/40 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-950/80 border border-rose-500/30 text-rose-400 shadow-inner">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white tracking-tight">
                  10s Highlight Clip Replay (5s Pre + 5s Post Buffer)
                </span>
                <span className="font-mono text-[11px] text-cyan-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
                  Diagram 3 · Port 8003
                </span>
              </div>
              <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5 font-mono">
                <span>{alert.cameraName}</span>
                <span>·</span>
                <span className="text-cyan-400">{alert.seatNumber}</span>
                <span>·</span>
                <span>{alert.studentName} ({alert.studentId})</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadClip}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg liquid-glass text-zinc-200 text-xs font-medium hover:border-cyan-500/40 transition-colors"
              title="Download 10s MP4 Evidence"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Export 10s MP4</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row">
          {/* Left: Replay Video Screen & 10s Buffer Timeline */}
          <div className="lg:w-7/12 p-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10">
            {/* Surveillance Screen */}
            <div className="relative aspect-video w-full rounded-xl bg-gradient-to-b from-zinc-950 via-zinc-900/80 to-zinc-950 border border-white/10 overflow-hidden shadow-2xl flex items-center justify-center select-none">
              <div className="absolute inset-0 cctv-scanlines opacity-40 z-10 pointer-events-none" />
              <div className="absolute inset-0 cctv-grid-pattern opacity-15 pointer-events-none" />

              {/* Buffer Phase Badge */}
              <div className="absolute top-3 left-3 z-20 flex items-center gap-2 font-mono text-[11px] bg-black/70 px-2.5 py-1 rounded-md backdrop-blur-md border border-white/10">
                <span className={`w-2 h-2 rounded-full ${isPreBuffer ? 'bg-cyan-400' : 'bg-rose-500 animate-pulse'}`} />
                <span className={isPreBuffer ? 'text-cyan-300' : 'text-rose-300 font-bold'}>
                  {isPreBuffer ? 'CIRCULAR BUFFER (-5s)' : 'POST-EVENT RECORDING (+5s)'}
                </span>
              </div>

              <div className="absolute top-3 right-3 z-20 font-mono text-[11px] text-zinc-300 bg-black/70 px-2 py-1 rounded-md backdrop-blur-md border border-white/10">
                00:{Math.floor(currentTime).toString().padStart(2, '0')}.{Math.floor((currentTime % 1) * 10)} / 00:10.0
              </div>

              {/* Anomaly Detection Trigger Callout */}
              {isAnomalyWindow && (
                <div className="absolute top-12 left-1/2 -translate-x-1/2 z-20 bg-rose-950/90 border border-rose-500/80 text-rose-200 text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>CiRA TRIGGER: {alert.incidentType.toUpperCase()} ({alert.confidence}%)</span>
                </div>
              )}

              {/* Classroom Scene Graphic */}
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="w-3/4 h-24 rounded-lg bg-zinc-850/80 border border-zinc-700/60 shadow-2xl relative flex items-center justify-center">
                  <div className="w-20 h-16 bg-zinc-200 rounded-sm shadow-md border border-zinc-400 flex flex-col p-1.5 space-y-1">
                    <div className="w-full h-1 bg-zinc-400 rounded-xs" />
                    <div className="w-3/4 h-1 bg-zinc-400 rounded-xs" />
                    <div className="w-5/6 h-1 bg-zinc-400 rounded-xs" />
                  </div>
                  <div className="absolute -top-3 left-10 w-12 h-6 bg-zinc-700 rounded-full border border-zinc-600" />
                  <div className="absolute -top-3 right-10 w-12 h-6 bg-zinc-700 rounded-full border border-zinc-600" />

                  {alert.incidentType.includes('Device') && (
                    <div className={`absolute bottom-2 right-14 w-8 h-12 rounded-sm border transition-all ${
                      isAnomalyWindow
                        ? 'bg-cyan-300 shadow-[0_0_24px_#38bdf8] border-white animate-pulse'
                        : 'bg-zinc-950 border-zinc-700'
                    }`} />
                  )}
                </div>

                <div className="absolute -top-6 flex flex-col items-center">
                  <div 
                    className={`w-14 h-14 rounded-full border-2 transition-transform duration-300 flex items-center justify-center ${
                      isAnomalyWindow 
                        ? 'bg-rose-950/90 border-rose-500 shadow-lg shadow-rose-950/50' 
                        : 'bg-zinc-800 border-zinc-600'
                    }`}
                    style={{
                      transform: isAnomalyWindow ? `rotate(${alert.telemetry.headRotationDeg || 45}deg)` : 'rotate(0deg)'
                    }}
                  >
                    <div className="w-2 h-2 rounded-full bg-zinc-400" />
                  </div>
                  <div className="w-32 h-16 rounded-t-xl bg-zinc-800 border-t border-x border-zinc-700 mt-1" />
                </div>

                {showOverlays && (
                  <div 
                    className={`absolute border-2 rounded-sm z-30 transition-all ${
                      isAnomalyWindow
                        ? 'border-rose-500 bg-rose-500/15 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                        : 'border-cyan-500/60 bg-cyan-500/5'
                    }`}
                    style={{
                      left: `${alert.evidenceClip.detectedBoundingBox.x}%`,
                      top: `${alert.evidenceClip.detectedBoundingBox.y}%`,
                      width: `${alert.evidenceClip.detectedBoundingBox.width}%`,
                      height: `${alert.evidenceClip.detectedBoundingBox.height}%`,
                    }}
                  >
                    <div className="absolute -top-5 left-0 px-1.5 py-0.2 bg-black/90 border border-current rounded text-[9px] font-mono text-white font-bold whitespace-nowrap">
                      {alert.evidenceClip.detectedBoundingBox.label}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 10s Highlight Buffer Visual Scrub Bar (Diagram 3) */}
            <div className="mt-4 space-y-2">
              {/* Dual-color buffer bar showing pre-buffer vs post-recording */}
              <div className="relative pt-4">
                {/* Visual split indicators */}
                <div className="w-full flex h-2 rounded-full overflow-hidden bg-zinc-900 border border-white/10">
                  <div className="w-1/2 bg-cyan-900/60 relative border-r border-white/20" title="5s Circular Buffer (Pre-event)">
                    <span className="absolute inset-0 flex items-center justify-center text-[8px] font-mono text-cyan-300 font-bold tracking-wider">
                      PRE-BUFFER (5s)
                    </span>
                  </div>
                  <div className="w-1/2 bg-rose-950/60 relative" title="5s Active Recording (Post-event)">
                    <span className="absolute inset-0 flex items-center justify-center text-[8px] font-mono text-rose-300 font-bold tracking-wider">
                      POST-RECORD (5s)
                    </span>
                  </div>
                </div>

                {/* Actual Range Input for Smooth Scrubbing */}
                <input
                  type="range"
                  min={0}
                  max={totalDuration}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => handleSeek(parseFloat(e.target.value))}
                  className="w-full -mt-2.5 relative z-10 accent-cyan-400 cursor-pointer h-2 bg-transparent appearance-none"
                />

                {/* Keyframe Trigger Marker at 5.0s */}
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none"
                >
                  <span className="w-2 h-3 bg-rose-500 rounded-sm shadow-md" />
                  <span className="text-[9px] font-mono font-bold text-rose-300 bg-rose-950 px-1.5 py-0.2 rounded border border-rose-500/50 mt-1 whitespace-nowrap">
                    AI TRIGGER (00:05.0)
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between text-xs pt-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={togglePlay}
                    className="p-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all shadow-md active:scale-95"
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                  </button>

                  <button
                    onClick={() => handleStepFrame(-1)}
                    className="p-1.5 rounded-lg liquid-glass text-zinc-300 hover:text-white"
                    title="Previous Frame (-0.1s)"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleStepFrame(1)}
                    className="p-1.5 rounded-lg liquid-glass text-zinc-300 hover:text-white"
                    title="Next Frame (+0.1s)"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      setCurrentTime(0);
                      playActionBlip('click');
                    }}
                    className="p-1.5 rounded-lg liquid-glass text-zinc-400 hover:text-white"
                    title="Restart from 00:00"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  <span className="font-mono text-zinc-300 tabular-nums ml-2">
                    00:{Math.floor(currentTime).toString().padStart(2, '0')}.{Math.floor((currentTime % 1) * 10)}
                  </span>
                </div>

                <div className="flex items-center gap-1 p-0.5 rounded-lg liquid-glass text-[11px] font-mono">
                  {[0.5, 1, 2].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setPlaybackSpeed(speed)}
                      className={`px-2 py-0.5 rounded-md transition-colors ${
                        playbackSpeed === speed
                          ? 'bg-zinc-800 text-cyan-300 font-bold'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowOverlays(!showOverlays)}
                  className={`px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 border ${
                    showOverlays
                      ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                      : 'bg-zinc-900 border-white/5 text-zinc-500'
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  <span>CV Box</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right: Forensics, Rationale & Decision Suite */}
          <div className="lg:w-5/12 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              {/* Classification Summary Card */}
              <div className="p-4 rounded-xl liquid-glass-card space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Violation Category
                  </span>
                  <span className="text-xs font-mono font-bold text-rose-300 bg-rose-950/80 border border-rose-500/40 px-2 py-0.5 rounded-md">
                    {alert.confidence}% AI Confidence
                  </span>
                </div>

                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span>{alert.incidentType}</span>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  {alert.description}
                </p>
              </div>

              {/* Edge AI Telemetry Breakdown */}
              <div className="p-4 rounded-xl liquid-glass-card space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  <span>CiRA CORE Model Rationale (Port 9999)</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-white/5">
                    <span className="text-zinc-500 text-[10px] block">Gaze Yaw / Pitch</span>
                    <span className="text-zinc-200 font-bold">
                      {alert.telemetry.gazeYaw}° / {alert.telemetry.gazePitch}°
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-white/5">
                    <span className="text-zinc-500 text-[10px] block">Highlight File</span>
                    <span className="text-cyan-400 font-bold truncate block">
                      {alert.evidenceClip.clipName}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-zinc-400 bg-zinc-950/60 p-2.5 rounded-lg border border-white/5">
                  <strong className="text-zinc-300">Model Pipeline:</strong> {alert.aiRationale}
                </div>
              </div>

              {/* Proctor Notation Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Proctor Integrity Review Notes
                </label>
                <textarea
                  value={proctorNote}
                  onChange={(e) => setProctorNote(e.target.value)}
                  placeholder="Record formal observation notes into audit_logs table..."
                  rows={2}
                  className="w-full bg-zinc-950/80 border border-white/10 rounded-xl p-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 resize-none shadow-inner"
                />
              </div>
            </div>

            {/* Bottom Decision Actions Suite (Diagram 3 Steps 14-16) */}
            <div className="pt-3 border-t border-white/10 space-y-2.5">
              {currentUser?.role === 'assistant' ? (
                <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold flex items-center gap-1.5">
                      <span>{lang === 'th' ? 'สิทธิ์ผู้ช่วยคุมสอบ (Assistant - View Only)' : 'Assistant Privilege (Read-Only)'}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-500/40 font-mono">
                        LOCKED
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                      {lang === 'th'
                        ? 'บัญชีของคุณอยู่ในยศล่างสุด สามารถดูภาพหลักฐานคลิป 10 วินาทีได้เท่านั้น แต่ไม่มีสิทธิ์อนุมัติ ยืนยัน หรือยกเลิกผลการทุจริต โปรดแจ้งหัวหน้าคุมสอบหรือแอดมินเพื่อดำเนินการ'
                        : 'Your account has view-only privileges. You cannot confirm, dismiss, or dispatch proctors. Please contact a Chief Proctor or Admin.'}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleDispatchProctor}
                    className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                      dispatchSuccess
                        ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                        : 'liquid-glass text-zinc-200 hover:border-cyan-500/40'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5 text-cyan-400" />
                    <span>
                      {dispatchSuccess
                        ? 'Proctor Dispatched & Logged in audit_logs!'
                        : 'Dispatch Hall Proctor to ' + alert.seatNumber}
                    </span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        playActionBlip('confirm');
                        onConfirmViolation(alert.id, proctorNote);
                        onClose();
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-rose-950/50 transition-colors active:scale-95 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirm Cheating Violation</span>
                    </button>

                    <button
                      onClick={() => {
                        playActionBlip('dismiss');
                        onDismissAlert(alert.id, proctorNote);
                        onClose();
                      }}
                      className="px-4 py-2.5 rounded-xl liquid-glass text-zinc-300 hover:text-white font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Dismiss False Alarm
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
