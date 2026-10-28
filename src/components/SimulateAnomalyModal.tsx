import React, { useState } from 'react';
import { X, Sparkles, AlertTriangle, Video } from 'lucide-react';
import { CameraFeed, IncidentType, Severity, IncidentAlert } from '../types/proctor';
import { eventHighlightService } from '../services/eventHighlightService';
import { playAlertChime } from '../utils/audio';

interface SimulateAnomalyModalProps {
  cameras: CameraFeed[];
  onClose: () => void;
  onTriggerAnomaly: (newAlert: IncidentAlert, targetCameraId: string, studentId: string) => void;
}

export const SimulateAnomalyModal: React.FC<SimulateAnomalyModalProps> = ({
  cameras,
  onClose,
  onTriggerAnomaly,
}) => {
  const [selectedIncident, setSelectedIncident] = useState<IncidentType>(
    'Unauthorized Device Detected'
  );
  const [selectedCameraId, setSelectedCameraId] = useState<string>(cameras[0]?.id || 'cam-01');
  const [confidence, setConfidence] = useState<number>(94);
  const [customNote, setCustomNote] = useState<string>('Simulated CiRA CORE anomaly detection on Raspberry Pi 5.');

  const selectedCam = cameras.find((c) => c.id === selectedCameraId) || cameras[0];
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    selectedCam?.students[0]?.id || 'STU-8477'
  );

  const incidentOptions: {
    type: IncidentType;
    dbType: 'using_phone' | 'looking_sideways' | 'paper_passing' | 'concealed_earbud' | 'second_person';
    severity: Severity;
    desc: string;
  }[] = [
    {
      type: 'Unauthorized Device Detected',
      dbType: 'using_phone',
      severity: 'critical',
      desc: 'CiRA CORE detects smartphone chassis and glowing screen under test booklet (Diagram 3).',
    },
    {
      type: 'Suspicious Head Turning',
      dbType: 'looking_sideways',
      severity: 'critical',
      desc: 'Head yaw rotated +54° toward adjacent student paper sustained for > 5 seconds.',
    },
    {
      type: 'Passing Notes / Materials',
      dbType: 'paper_passing',
      severity: 'critical',
      desc: 'Arm extension trajectory crossing aisle boundary with physical paper slip.',
    },
    {
      type: 'Concealed Audio Device',
      dbType: 'concealed_earbud',
      severity: 'warning',
      desc: 'Acoustic micro-transceiver detected in right ear with frequent ear touches.',
    },
    {
      type: 'Multiple Faces in Frame',
      dbType: 'second_person',
      severity: 'advisory',
      desc: 'Secondary unregistered face entered camera frustum perimeter.',
    },
  ];

  const handleTrigger = () => {
    const activeStudent = selectedCam.students.find((s) => s.id === selectedStudentId) || selectedCam.students[0];
    const option = incidentOptions.find((o) => o.type === selectedIncident) || incidentOptions[0];

    // Trigger through EventHighlightService (matching Diagram 3 steps 4-11)
    const { event, clip } = eventHighlightService.processCiRADetection({
      studentName: activeStudent.name,
      studentId: activeStudent.id,
      seatNumber: activeStudent.seat,
      cameraId: selectedCam.id,
      eventType: option.dbType,
      confidence: confidence / 100,
      description: `${option.desc} (${customNote})`,
    });

    const now = new Date();
    const newAlert: IncidentAlert = {
      id: `alt-${event.id}`,
      timestamp: event.timestamp,
      rawTime: now,
      sessionId: 'sess-phys101',
      cameraId: selectedCam.id,
      cameraName: selectedCam.name,
      studentId: activeStudent.id,
      studentName: activeStudent.name,
      seatNumber: activeStudent.seat,
      incidentType: selectedIncident,
      severity: option.severity,
      confidence: confidence,
      status: 'pending',
      description: `${option.desc} (${customNote})`,
      aiRationale: `CiRA CORE Edge YOLO model (ai mo1) transmitted detection over TCP Port 9999. Compiled 10s highlight clip (5s pre + 5s post buffer).`,
      telemetry: {
        gazePitch: -18,
        gazeYaw: 46,
        objectDetected: selectedIncident.includes('Device') ? 'Smartphone' : 'Anomaly Gesture',
        durationSeconds: 10.0,
        headRotationDeg: 46,
      },
      evidenceClip: {
        durationSec: 10,
        keyframeSec: 5,
        clipName: clip.fileName,
        detectedBoundingBox: {
          x: 40,
          y: 45,
          width: 20,
          height: 25,
          label: `${selectedIncident.toUpperCase().slice(0, 18)} [${confidence}%]`,
        },
      },
    };

    onTriggerAnomaly(newAlert, selectedCam.id, activeStudent.id);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto overscroll-contain"
      onWheel={(e) => e.stopPropagation()}
    >
      <div 
        className="relative w-full max-w-lg rounded-2xl liquid-glass-modal shadow-2xl p-6 space-y-4 overscroll-contain my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 shadow-inner">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Simulate CiRA CORE Cheating Event
              </h3>
              <p className="text-xs text-zinc-400">
                Fires TCP 9999 → Pulls 5s Pre-buffer → 10s MP4 (Diagram 3)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Anomaly Type Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-300">
            Select Detected Behavior
          </label>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {incidentOptions.map((opt) => (
              <div
                key={opt.type}
                onClick={() => setSelectedIncident(opt.type)}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  selectedIncident === opt.type
                    ? 'liquid-glass border-cyan-500/70 text-white shadow-md'
                    : 'liquid-glass-card border-white/5 text-zinc-400 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-200">{opt.type}</span>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.2 rounded-md ${
                      opt.severity === 'critical'
                        ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                        : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {opt.severity}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 mt-1">{opt.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Camera Feed & Student Target */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-zinc-300 font-semibold mb-1">Target Camera</label>
            <select
              value={selectedCameraId}
              onChange={(e) => {
                setSelectedCameraId(e.target.value);
                const cam = cameras.find((c) => c.id === e.target.value);
                if (cam && cam.students[0]) {
                  setSelectedStudentId(cam.students[0].id);
                }
              }}
              className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2.5 text-zinc-200 text-xs focus:outline-none focus:border-cyan-500"
            >
              {cameras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name.split('·')[0]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">Target Examinee</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2.5 text-zinc-200 text-xs focus:outline-none focus:border-cyan-500"
            >
              {selectedCam.students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.seat}: {s.name} ({s.id})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Confidence Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-300 font-semibold">CiRA Detection Confidence</span>
            <span className="font-mono font-bold text-cyan-400">{confidence}%</span>
          </div>
          <input
            type="range"
            min={75}
            max={99}
            value={confidence}
            onChange={(e) => setConfidence(parseInt(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-zinc-900 rounded-lg"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-xl liquid-glass text-zinc-400 text-xs font-medium hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleTrigger}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-950/60 transition-colors active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Simulate CiRA 10s Clip Event</span>
          </button>
        </div>
      </div>
    </div>
  );
};
