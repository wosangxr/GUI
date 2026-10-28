import { UserRecord, CheatingEventRecord, AuditLogRecord, PasswordResetRecord } from './types';
import { eventBus } from './eventBus';

// Diagram 5: SQLite Database Repository (exam_proctor.db)
class DatabaseService {
  private users: UserRecord[] = [
    { id: 1, username: 'admin', email: 'admin@examguard.ai', role: 'admin', password: 'admin', name: 'System Administrator', avatar: 'AD', created_at: '2026-09-01 08:00:00' },
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
      reviewed_by: 'admin',
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
    {
      id: 1025,
      timestamp: '10:25:10 AM',
      event_type: 'using_phone',
      confidence: 0.96,
      video_path: '/highlights/highlight_20261021_102510_A03.mp4',
      thumbnail_path: '/highlights/thumb_102510_A03.jpg',
      status: 'confirmed',
      reviewed_by: 'admin',
      review_notes: 'Smartphone detected beneath desk edge.',
      student_name: 'Alex Rivera',
      student_id: 'STU-8411',
      seat_number: 'Seat A-03',
      camera_id: 'cam-01',
    },
    {
      id: 1018,
      timestamp: '10:18:32 AM',
      event_type: 'looking_sideways',
      confidence: 0.88,
      video_path: '/highlights/highlight_20261021_101832_C01.mp4',
      thumbnail_path: '/highlights/thumb_101832_C01.jpg',
      status: 'false_alarm',
      reviewed_by: 'admin',
      review_notes: 'Examinee stretching neck toward clock.',
      student_name: 'Chloe Zhao',
      student_id: 'STU-8439',
      seat_number: 'Seat C-01',
      camera_id: 'cam-02',
    },
    {
      id: 1012,
      timestamp: '10:12:05 AM',
      event_type: 'paper_passing',
      confidence: 0.93,
      video_path: '/highlights/highlight_20261021_101205_D02.mp4',
      thumbnail_path: '/highlights/thumb_101205_D02.jpg',
      status: 'confirmed',
      reviewed_by: 'admin',
      review_notes: 'Index card formula note passing confirmed.',
      student_name: 'Marcus Bell',
      student_id: 'STU-8520',
      seat_number: 'Seat D-02',
      camera_id: 'cam-03',
    },
    {
      id: 1005,
      timestamp: '10:05:40 AM',
      event_type: 'concealed_earbud',
      confidence: 0.87,
      video_path: '/highlights/highlight_20261021_100540_A01.mp4',
      thumbnail_path: '/highlights/thumb_100540_A01.jpg',
      status: 'false_alarm',
      reviewed_by: 'admin',
      review_notes: 'Hearing aid verified against proctor manifest.',
      student_name: 'Emma Watson',
      student_id: 'STU-8402',
      seat_number: 'Seat A-01',
      camera_id: 'cam-01',
    },
  ];

  private auditLogs: AuditLogRecord[] = [
    {
      id: 501,
      user_id: 1,
      username: 'admin',
      action: 'LOGIN',
      ip_address: '10.114.70.15',
      details: 'Administrator console session authenticated via JWT',
      timestamp: '2026-10-21 10:00:12',
    },
    {
      id: 502,
      user_id: 1,
      username: 'admin',
      action: 'CAMERA_PTZ_LEFT',
      ip_address: '10.114.70.15',
      details: 'ONVIF ContinuousMove pan velocity -0.5 on CAM 01',
      timestamp: '2026-10-21 10:15:30',
    },
    {
      id: 503,
      user_id: 1,
      username: 'admin',
      action: 'REVIEW_EVENT',
      ip_address: '10.114.70.15',
      details: 'Confirmed violation Event #1036 (Ryan Patel)',
      timestamp: '2026-10-21 10:38:00',
    },
    {
      id: 504,
      user_id: 1,
      username: 'admin',
      action: 'REVIEW_EVENT',
      ip_address: '10.114.70.15',
      details: 'Confirmed violation Event #1025 (Alex Rivera)',
      timestamp: '2026-10-21 10:40:15',
    },
    {
      id: 505,
      user_id: 1,
      username: 'admin',
      action: 'DISMISS_EVENT',
      ip_address: '10.114.70.15',
      details: 'Dismissed Event #1018 as false alarm (stretching)',
      timestamp: '2026-10-21 10:41:00',
    },
  ];

  private passwordResets: PasswordResetRecord[] = [
    { id: 1, user_id: 1, token: 'rst_8f29c0a1', expires_at: '2026-10-21 18:00:00', used: 1 },
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

  // Admin exclusive user rank and role management
  updateUserRole(
    userId: number,
    newRole: 'admin' | 'chief_proctor' | 'proctor' | 'assistant',
    assignedRoom?: string,
    adminUsername: string = 'admin'
  ): UserRecord | null {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return null;
    if (user.username === 'admin' || user.id === 1) {
      // System Root Admin is permanent and locked
      return user;
    }
    const oldRole = user.role;
    user.role = newRole;
    if (assignedRoom !== undefined) user.assigned_room = assignedRoom;

    this.addAuditLog({
      user_id: 1,
      username: adminUsername,
      action: 'UPDATE_USER_ROLE',
      ip_address: '10.114.70.15',
      details: `Admin changed role of ${user.username} from '${oldRole}' to '${newRole}' (Assigned: ${user.assigned_room || 'All Rooms'})`,
    });

    eventBus.emit('USERS_UPDATED', [...this.users]);
    return user;
  }

  addUser(
    newUser: Omit<UserRecord, 'id' | 'created_at'>,
    adminUsername: string = 'admin'
  ): UserRecord {
    const record: UserRecord = {
      id: this.users.length + 1,
      ...newUser,
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    this.users.push(record);

    this.addAuditLog({
      user_id: 1,
      username: adminUsername,
      action: 'CREATE_USER',
      ip_address: '10.114.70.15',
      details: `Admin created new proctor account '${record.username}' with rank '${record.role}'`,
    });

    eventBus.emit('USERS_UPDATED', [...this.users]);
    return record;
  }

  deleteUser(userId: number, adminUsername: string = 'admin'): boolean {
    const target = this.users.find((u) => u.id === userId);
    if (!target) return false;
    if (target.username === 'admin' || target.id === 1) {
      // Cannot delete root admin
      return false;
    }
    this.users = this.users.filter((u) => u.id !== userId);

    this.addAuditLog({
      user_id: 1,
      username: adminUsername,
      action: 'DELETE_USER',
      ip_address: '10.114.70.15',
      details: `Admin deleted user account '${target.username}' (${target.role})`,
    });

    eventBus.emit('USERS_UPDATED', [...this.users]);
    return true;
  }

  // Google OAuth Sign-In & Self-Registration
  // Any brand new Google user receives the lowest rank: 'assistant' (cannot edit or approve)
  loginWithGoogle(email: string, name?: string, googleId?: string): UserRecord {
    const existing = this.users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (existing) {
      this.addAuditLog({
        user_id: existing.id,
        username: existing.username,
        action: 'GOOGLE_SIGN_IN',
        ip_address: '10.114.70.15',
        details: `User '${existing.username}' signed in via Google OAuth with role '${existing.role}'`,
      });
      return existing;
    }

    // New Google user provisioned with lowest rank 'assistant'
    const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const newUser: UserRecord = {
      id: this.users.length + 1,
      username,
      name: name || (email.split('@')[0].replace('.', ' ').replace(/\b\w/g, (c) => c.toUpperCase())),
      email: email.trim(),
      role: 'assistant', // Lowest rank: no edit or approval privileges
      assigned_room: 'Unassigned',
      avatar: (name || username).slice(0, 2).toUpperCase(),
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };

    this.users.push(newUser);
    this.addAuditLog({
      user_id: newUser.id,
      username: newUser.username,
      action: 'GOOGLE_SIGN_UP_REGISTER',
      ip_address: '10.114.70.15',
      details: `New Google account '${newUser.email}' registered with lowest role 'assistant' (Read-Only / No Approval Privileges)`,
    });

    eventBus.emit('USERS_UPDATED', [...this.users]);
    return newUser;
  }
}

export const databaseService = new DatabaseService();
