import React from 'react';
import { Play, Check, X, ShieldAlert, AlertTriangle, Eye, Video, Lock } from 'lucide-react';
import { IncidentAlert } from '../types/proctor';
import { UserRecord } from '../services/types';
import { playActionBlip } from '../utils/audio';

interface AlertCardProps {
  alert: IncidentAlert;
  onReviewClip: (alert: IncidentAlert) => void;
  onConfirmViolation: (alertId: string) => void;
  onDismissAlert: (alertId: string) => void;
  currentUser?: UserRecord;
}

export const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  onReviewClip,
  onConfirmViolation,
  onDismissAlert,
  currentUser,
}) => {
  const isCritical = alert.severity === 'critical';
  const isPending = alert.status === 'pending';
  const isConfirmed = alert.status === 'confirmed';
  const isDismissed = alert.status === 'dismissed';

  const severityBadge = isCritical ? (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-950/80 text-rose-300 border border-rose-500/30">
      <ShieldAlert className="w-3 h-3 text-rose-400" />
      <span>{alert.incidentType}</span>
    </span>
  ) : (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-500/30">
      <AlertTriangle className="w-3 h-3 text-amber-400" />
      <span>{alert.incidentType}</span>
    </span>
  );

  return (
    <div
      className={`p-3.5 rounded-xl liquid-glass-card transition-all ${
        isPending
          ? isCritical
            ? 'border-rose-500/40 shadow-lg shadow-rose-950/20'
            : 'border-amber-500/30 shadow-md shadow-amber-950/10'
          : isConfirmed
          ? 'border-white/5 opacity-90'
          : 'border-white/5 opacity-60'
      }`}
    >
      {/* Top Header: Time, Status, Confidence */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-zinc-200 tabular-nums">
            {alert.timestamp}
          </span>
          <span className="text-zinc-600">·</span>
          <span className="text-[11px] font-medium text-cyan-400 flex items-center gap-1">
            <Video className="w-3 h-3" />
            <span className="truncate max-w-[110px]">{alert.cameraName}</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border tabular-nums ${
              alert.confidence >= 90
                ? 'bg-rose-950/70 border-rose-500/30 text-rose-300'
                : 'bg-amber-950/70 border-amber-500/30 text-amber-300'
            }`}
          >
            {alert.confidence}% Confident
          </span>

          {isConfirmed && (
            <span className="text-[10px] uppercase font-bold text-rose-300 bg-rose-950/90 px-1.5 py-0.5 rounded border border-rose-800">
              Confirmed
            </span>
          )}
          {isDismissed && (
            <span className="text-[10px] uppercase font-bold text-emerald-300 bg-emerald-950/90 px-1.5 py-0.5 rounded border border-emerald-800">
              Dismissed
            </span>
          )}
        </div>
      </div>

      {/* Middle Content: Student Info & Snapshot Preview */}
      <div className="mt-2.5 flex gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-zinc-100">{alert.studentName}</span>
            <span className="text-zinc-500">·</span>
            <span className="font-mono text-[11px] font-semibold text-cyan-300 bg-cyan-950/50 border border-cyan-800/40 px-1.5 py-0.2 rounded">
              {alert.seatNumber}
            </span>
            <span className="text-zinc-500">·</span>
            <span className="font-mono text-[11px] text-zinc-400">{alert.studentId}</span>
          </div>

          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
            {severityBadge}
          </div>

          <p className="mt-2 text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
            {alert.description}
          </p>

          {alert.proctorNote && (
            <div className="mt-1.5 text-[10px] text-zinc-300 bg-zinc-950/70 p-2 rounded-lg border border-white/5 italic">
              <strong>Proctor:</strong> {alert.proctorNote}
            </div>
          )}
        </div>

        {/* Snapshot Thumbnail Preview */}
        <div
          onClick={() => onReviewClip(alert)}
          className="relative w-24 h-20 shrink-0 rounded-xl bg-zinc-950 border border-white/10 overflow-hidden cursor-pointer group shadow-inner"
          title="Watch 10-second Highlight Evidence Clip"
        >
          <div className="absolute inset-0 cctv-scanlines opacity-40 z-10" />
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-zinc-800/60 border border-zinc-700/60 flex items-center justify-center">
              <Eye className="w-3.5 h-3.5 text-zinc-400" />
            </div>
          </div>

          <div
            className={`absolute border rounded-xs z-20 ${
              isCritical ? 'border-rose-500 bg-rose-500/20' : 'border-amber-400 bg-amber-400/20'
            }`}
            style={{
              left: `${alert.evidenceClip.detectedBoundingBox.x * 0.7}%`,
              top: `${alert.evidenceClip.detectedBoundingBox.y * 0.7}%`,
              width: `${alert.evidenceClip.detectedBoundingBox.width * 0.7}%`,
              height: `${alert.evidenceClip.detectedBoundingBox.height * 0.7}%`,
            }}
          />

          <div className="absolute bottom-1 right-1 px-1.5 py-0.2 bg-black/80 rounded text-[8px] font-mono text-zinc-300 z-20 border border-white/5">
            10s CLIP
          </div>

          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity z-30 flex items-center justify-center">
            <div className="w-7 h-7 rounded-full bg-cyan-500/90 text-white flex items-center justify-center shadow-lg">
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons Row (Diagram 3 Step 12: Watch 10s Clip) */}
      <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between gap-2">
        <button
          onClick={() => onReviewClip(alert)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg liquid-glass text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition-colors"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>Watch 10s Clip</span>
        </button>

        {isPending ? (
          currentUser?.role === 'assistant' ? (
            <div 
              className="text-[10px] text-zinc-500 font-mono flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg border border-white/5" 
              title="สิทธิ์ผู้ช่วยคุมสอบ: ดูได้อย่างเดียว ไม่อนุญาตให้อนุมัติหรือตัดสิทธิ์"
            >
              <Lock className="w-3 h-3 text-amber-400" />
              <span>View Only</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  playActionBlip('confirm');
                  onConfirmViolation(alert.id);
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-xs font-semibold text-rose-200 transition-colors shadow-sm cursor-pointer"
                title="Confirm Cheating Violation"
              >
                <Check className="w-3.5 h-3.5 text-rose-400" />
                <span>Confirm</span>
              </button>

              <button
                onClick={() => {
                  playActionBlip('dismiss');
                  onDismissAlert(alert.id);
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg liquid-glass text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                title="Dismiss as false alarm"
              >
                <X className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dismiss</span>
              </button>
            </div>
          )
        ) : (
          <div className="text-[11px] font-mono text-zinc-500">
            Audit Recorded
          </div>
        )}
      </div>
    </div>
  );
};
