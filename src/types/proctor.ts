export type IncidentType =
  | 'Unauthorized Device Detected'
  | 'Suspicious Head Turning'
  | 'Passing Notes / Materials'
  | 'Multiple Faces in Frame'
  | 'Concealed Audio Device'
  | 'Gaze Aversion & Screen Peeking';

export type Severity = 'critical' | 'warning' | 'advisory';

export type AlertStatus = 'pending' | 'confirmed' | 'dismissed';

export interface StudentInFeed {
  id: string;
  name: string;
  seat: string;
  x: number; // percentage in camera view (0-100)
  y: number; // percentage in camera view (0-100)
  width: number;
  height: number;
  status: 'nominal' | 'suspicious' | 'flagged';
  gazeAngle: number; // degrees (-90 to +90)
  postureScore: number; // 0 - 100
  notes?: string;
}

export interface CameraFeed {
  id: string;
  name: string;
  location: string;
  rtspUrl: string;
  fps: number;
  resolution: string;
  bitrate: string;
  status: 'online' | 'warning' | 'offline';
  students: StudentInFeed[];
  activeAlertCount: number;
  lastAnomaly?: string;
  angleDescription: string;
}

export interface IncidentAlert {
  id: string;
  timestamp: string;
  rawTime: Date;
  sessionId: string;
  cameraId: string;
  cameraName: string;
  studentId: string;
  studentName: string;
  seatNumber: string;
  incidentType: IncidentType;
  severity: Severity;
  confidence: number;
  status: AlertStatus;
  description: string;
  proctorNote?: string;
  aiRationale: string;
  telemetry: {
    gazePitch: number;
    gazeYaw: number;
    objectDetected?: string;
    durationSeconds: number;
    headRotationDeg?: number;
  };
  evidenceClip: {
    durationSec: number;
    keyframeSec: number;
    clipName: string;
    detectedBoundingBox: {
      x: number;
      y: number;
      width: number;
      height: number;
      label: string;
    };
  };
}

export interface ExamSession {
  id: string;
  code: string;
  title: string;
  room: string;
  proctorName: string;
  totalStudents: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  integrityScore: number;
  activeAlerts: number;
  camerasCount: number;
}

export interface VisionOverlaySettings {
  showBoundingBoxes: boolean;
  showGazeVectors: boolean;
  showPoseSkeleton: boolean;
  showHeatmap: boolean;
  showTelemetryFps: boolean;
}
