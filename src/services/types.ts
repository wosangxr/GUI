// Microservices Domain Types and Telemetry Contracts
// Corresponds to Diagrams 1, 2, 3, 4, 5 of ExamGuard AI System

export type ServiceStatus = 'healthy' | 'degraded' | 'offline';

export interface MicroserviceNode {
  id: string;
  name: string;
  port: number;
  protocol: 'HTTP' | 'WebSocket' | 'TCP Socket' | 'ONVIF';
  status: ServiceStatus;
  latencyMs: number;
  uptimeSec: number;
  requestCount: number;
  errorCount: number;
  version: string;
  description: string;
  endpoints: string[];
  lastHeartbeat: string;
}

// Diagram 5: SQLite Database Entities
export interface UserRecord {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'proctor';
  created_at: string;
}

export interface CheatingEventRecord {
  id: number;
  timestamp: string;
  event_type: 'using_phone' | 'looking_sideways' | 'paper_passing' | 'concealed_earbud' | 'second_person';
  confidence: number; // 0.0 - 1.0
  video_path: string; // /highlights/*.mp4
  thumbnail_path: string; // /highlights/*.jpg
  status: 'pending' | 'confirmed' | 'false_alarm';
  reviewed_by?: string;
  review_notes?: string;
  student_name: string;
  student_id: string;
  seat_number: string;
  camera_id: string;
}

export interface AuditLogRecord {
  id: number;
  user_id: number;
  username: string;
  action: 'LOGIN' | 'CAMERA_PTZ_LEFT' | 'CAMERA_PTZ_RIGHT' | 'CAMERA_PTZ_UP' | 'CAMERA_PTZ_DOWN' | 'REVIEW_EVENT' | 'DISPATCH_PROCTOR' | 'EXPORT_AUDIT_REPORT';
  ip_address: string;
  details: string;
  timestamp: string;
}

export interface PasswordResetRecord {
  id: number;
  user_id: number;
  token: string;
  expires_at: string;
  used: number; // 0 or 1
}

// Diagram 4: ONVIF PTZ State
export interface CameraPTZState {
  cameraId: string;
  pan: number; // -180 to +180 degrees
  tilt: number; // -90 to +90 degrees
  zoom: number; // 1x to 4x
  speed: number; // 0.1 to 1.0
  isMoving: boolean;
  onvifProfile: string;
  lastCommand?: string;
  lastCommandTime?: string;
}

// Diagram 3: 10s Highlight Clip Sequence Timing
export interface HighlightClipSequence {
  clipId: string;
  fileName: string;
  preBufferSeconds: number; // 5 seconds (Circular Buffer)
  postBufferSeconds: number; // 5 seconds (Active Recording)
  totalDurationSeconds: number; // 10 seconds
  triggerTimestamp: string;
  eventType: string;
  confidence: number;
  videoUrl: string;
  thumbnailUrl: string;
}
