import { UserRecord, CheatingEventRecord, AuditLogRecord, PasswordResetRecord } from './types';
import { eventBus } from './eventBus';

// Diagram 5: SQLite Database Repository (exam_proctor.db)
class DatabaseService {
  private users: UserRecord[] = [
    { id: 1, username: 'admin', email: 'admin@examguard.ai', role: 'admin', created_at: '2026-09-01 08:00:00' },
    { id: 2, username: 'tuna', email: 'tuna.proctor@university.edu', role: 'proctor', created_at: '2026-10-01 09:30:00' },
    { id: 3, username: 'k_reynolds', email: 'reynolds@university.edu', role: 'proctor', created_at: '2026-10-05 11:15:00' },
  ];

  private cheatingEvents: CheatingEventRecord[] = [
    {
      id: 1042,
      timestamp: '10:42:15 AM',
      event_type: 'using_phone',
      confidence: 0.97,
      video_path: '/highlights/highlight_20261021_104215_B04.mp4',
      thumbnail_path: '/highlights/thumb_104215_B04.jpg',
      status: 'pending',
      student_name: 'David Kim',
      student_id: 'STU-8477',
      seat_number: 'Seat B-04',
      camera_id: 'cam-01',
    },
    {
      id: 1040,
      timestamp: '10:40:02 AM',
      event_type: 'looking_sideways',
      confidence: 0.94,
      video_path: '/highlights/highlight_20261021_104002_C02.mp4',
      thumbnail_path: '/highlights/thumb_104002_C02.jpg',
      status: 'pending',
      student_name: 'Julian Vance',
      student_id: 'STU-8492',
      seat_number: 'Seat C-02',
      camera_id: 'cam-02',
    },
    {
      id: 1036,
      timestamp: '10:36:18 AM',
      event_type: 'paper_passing',
      confidence: 0.89,
      video_path: '/highlights/highlight_20261021_103618_D04.mp4',
      thumbnail_path: '/highlights/thumb_103618_D04.jpg',
      status: 'confirmed',
      reviewed_by: 'tuna',
      review_notes: 'Physical scrap sheet exchange observed across aisle.',
      student_name: 'Ryan Patel',
      student_id: 'STU-8519',
      seat_number: 'Seat D-04',
      camera_id: 'cam-03',
    },
    {
      id: 1029,
      timestamp: '10:29:44 AM',
      event_type: 'concealed_earbud',
      confidence: 0.91,
      video_path: '/highlights/highlight_20261021_102944_B02.mp4',
      thumbnail_path: '/highlights/thumb_102944_B02.jpg',
      status: 'pending',
      student_name: 'Sophia Becker',
      student_id: 'STU-8483',
      seat_number: 'Seat B-02',
      camera_id: 'cam-04',
    },
  ];

  private auditLogs: AuditLogRecord[] = [
    {
      id: 501,
      user_id: 2,
      username: 'tuna',
      action: 'LOGIN',
      ip_address: '10.114.70.15',
      details: 'Proctor console session authenticated via JWT',
      timestamp: '2026-10-21 10:00:12',
    },
    {
      id: 502,
      user_id: 2,
      username: 'tuna',
      action: 'CAMERA_PTZ_LEFT',
      ip_address: '10.114.70.15',
      details: 'ONVIF ContinuousMove pan velocity -0.5 on CAM 01',
      timestamp: '2026-10-21 10:15:30',
    },
    {
      id: 503,
      user_id: 2,
      username: 'tuna',
      action: 'REVIEW_EVENT',
      ip_address: '10.114.70.15',
      details: 'Confirmed violation Event #1036 (Ryan Patel)',
      timestamp: '2026-10-21 10:38:00',
    },
  ];

  private passwordResets: PasswordResetRecord[] = [
    { id: 1, user_id: 2, token: 'rst_8f29c0a1', expires_at: '2026-10-21 18:00:00', used: 1 },
  ];

  // Database Accessors
  getUsers(): UserRecord[] {
    return [...this.users];
  }

  getCheatingEvents(): CheatingEventRecord[] {
    return [...this.cheatingEvents];
  }

  getAuditLogs(): AuditLogRecord[] {
    return [...this.auditLogs];
  }

  getPasswordResets(): PasswordResetRecord[] {
    return [...this.passwordResets];
  }

  // Mutations with Event Broadcasts
  addAuditLog(entry: Omit<AuditLogRecord, 'id' | 'timestamp'>): AuditLogRecord {
    const newLog: AuditLogRecord = {
      id: this.auditLogs.length + 501,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      ...entry,
    };
    this.auditLogs.unshift(newLog);
    eventBus.emit('AUDIT_LOG_ADDED', newLog);
    return newLog;
  }

  addCheatingEvent(event: Omit<CheatingEventRecord, 'id'>): CheatingEventRecord {
    const newEvent: CheatingEventRecord = {
      id: Math.floor(1000 + Math.random() * 9000),
      ...event,
    };
    this.cheatingEvents.unshift(newEvent);
    eventBus.emit('EVENT_CREATED', newEvent);
    return newEvent;
  }

  updateEventStatus(
    eventId: number,
    status: 'confirmed' | 'false_alarm',
    reviewedBy: string,
    notes?: string
  ): CheatingEventRecord | null {
    const item = this.cheatingEvents.find((e) => e.id === eventId);
    if (item) {
      item.status = status;
      item.reviewed_by = reviewedBy;
      if (notes) item.review_notes = notes;

      // Also record in audit log (matching Diagram 3 steps 14-16)
      this.addAuditLog({
        user_id: 2,
        username: reviewedBy,
        action: 'REVIEW_EVENT',
        ip_address: '10.114.70.15',
        details: `Updated Event #${eventId} status to ${status}. Notes: ${notes || 'None'}`,
      });

      eventBus.emit('EVENT_UPDATED', item);
      return item;
    }
    return null;
  }
}

export const databaseService = new DatabaseService();
