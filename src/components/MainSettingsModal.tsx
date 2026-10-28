import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  Globe, 
  Calendar, 
  FileText, 
  ShieldAlert, 
  Camera, 
  Sliders, 
  Download, 
  CheckCircle2, 
  Radio, 
  Volume2, 
  VolumeX, 
  ExternalLink,
  Database,
  Cpu,
  Layers,
  Sparkles,
  Server,
  Play,
  Sun,
  Moon,
  Crown,
  UserCog,
  UserPlus,
  ShieldCheck,
  Save,
  User,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  Trash2
} from 'lucide-react';
import { ExamSession, IncidentAlert } from '../types/proctor';
import { exportProctorReportPDF } from '../utils/exportReport';
import { playActionBlip, playAlertChime, setSoundMuted, getSoundMuted } from '../utils/audio';
import { databaseService } from '../services/databaseService';
import { gatewayService } from '../services/gateway';
import { CheatingEventRecord, AuditLogRecord, UserRecord, MicroserviceNode } from '../services/types';
import { eventBus } from '../services/eventBus';

interface MainSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'th';
  onToggleLang: () => void;
  theme: 'dark' | 'light';
  onSelectTheme: (theme: 'dark' | 'light') => void;
  sessions: ExamSession[];
  currentSession: ExamSession;
  onSelectSession: (s: ExamSession) => void;
  alerts: IncidentAlert[];
  onReviewAlert?: (alert: IncidentAlert) => void;
  onOpenTopology: () => void;
  currentUser: UserRecord;
  defaultTab?: string;
}

export const MainSettingsModal: React.FC<MainSettingsModalProps> = ({
  isOpen,
  onClose,
  lang,
  onToggleLang,
  theme,
  onSelectTheme,
  sessions,
  currentSession,
  onSelectSession,
  alerts,
  onReviewAlert,
  onOpenTopology,
  currentUser,
  defaultTab,
}) => {
  const [activeTab, setActiveTab] = useState<'proctors' | 'sessions' | 'ai' | 'reports' | 'notifications' | 'camera' | 'logs'>(
    (defaultTab as any) || (currentUser.role === 'admin' ? 'proctors' : 'sessions')
  );

  // Sync tab if defaultTab changes when opening
  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab as any);
    }
  }, [defaultTab]);

  // Live database records & microservice nodes
  const [dbEvents, setDbEvents] = useState<CheatingEventRecord[]>(databaseService.getCheatingEvents());
  const [dbAuditLogs, setDbAuditLogs] = useState<AuditLogRecord[]>(databaseService.getAuditLogs());
  const [dbUsers, setDbUsers] = useState<UserRecord[]>(databaseService.getUsers());
  const [services, setServices] = useState<MicroserviceNode[]>(gatewayService.getServices());

  // Proctor Roles Management State (Admin exclusive)
  const [userRolesDraft, setUserRolesDraft] = useState<Record<number, { role: UserRecord['role']; room: string }>>({});
  const [roleUpdateMsg, setRoleUpdateMsg] = useState<string>('');

  // New proctor registration form state (empty fields ready to fill)
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRecord['role']>('proctor');
  const [newRoom, setNewRoom] = useState('Room 402');
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);

  // Initialize draft roles from dbUsers
  useEffect(() => {
    const draft: Record<number, { role: UserRecord['role']; room: string }> = {};
    dbUsers.forEach((u) => {
      draft[u.id] = { role: u.role, room: u.assigned_room || 'All Rooms' };
    });
    setUserRolesDraft(draft);
  }, [dbUsers]);

  // Listen for live database updates & telemetry
  useEffect(() => {
    if (!isOpen) return;

    const unsubEvents = eventBus.on('EVENT_CREATED', () => {
      setDbEvents(databaseService.getCheatingEvents());
    });
    const unsubEventUpdate = eventBus.on('EVENT_UPDATED', () => {
      setDbEvents(databaseService.getCheatingEvents());
      setDbAuditLogs(databaseService.getAuditLogs());
    });
    const unsubAudit = eventBus.on('AUDIT_LOG_ADDED', () => {
      setDbAuditLogs(databaseService.getAuditLogs());
    });
    const unsubUsers = eventBus.on<UserRecord[]>('USERS_UPDATED', (data) => {
      if (data) setDbUsers([...data]);
    });
    const unsubTelemetry = eventBus.on<MicroserviceNode[]>('GATEWAY_TELEMETRY_UPDATED', (data) => {
      if (data) setServices([...data]);
    });

    return () => {
      unsubEvents();
      unsubEventUpdate();
      unsubAudit();
      unsubUsers();
      unsubTelemetry();
    };
  }, [isOpen]);

  // AI settings
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(80);
  const [detectCheat, setDetectCheat] = useState<boolean>(true);
  const [detectWatching, setDetectWatching] = useState<boolean>(true);
  const [detectPhone, setDetectPhone] = useState<boolean>(true);

  // Sound chime settings (LINE Notify removed)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(!getSoundMuted());
  const [soundTestPlayed, setSoundTestPlayed] = useState<boolean>(false);

  // Camera settings
  const [cameraIp, setCameraIp] = useState<string>('10.114.70.75');
  const [rtspPort, setRtspPort] = useState<string>('554');
  const [onvifPort, setOnvifPort] = useState<string>('2020');

  // Logs / DB sub-view state (matches Diagram 5)
  const [logViewMode, setLogViewMode] = useState<'database' | 'microservices'>('database');
  const [selectedDbTable, setSelectedDbTable] = useState<'CHEATING_EVENTS' | 'AUDIT_LOGS' | 'USERS'>('CHEATING_EVENTS');

  if (!isOpen) return null;

  const t = {
    en: {
      title: 'System Settings & Controls',
      subtitle: 'ExamGuard AI Smart Proctoring Configuration',
      close: 'Close',
      tabProctors: 'Proctor Roles',
      tabSessions: 'Exam Sessions',
      tabAI: 'AI Detection Rules',
      tabReports: 'Evidence Reports',
      tabNotifications: 'Alerts & Theme',
      tabCamera: 'Camera & PTZ',
      tabLogs: 'Logs & Database',
      langLabel: 'Language',
      switchLang: 'Switch to ภาษาไทย',
      // Proctors Role Management
      proctorsHeading: 'Proctor Roles & Permissions Management',
      proctorsDesc: 'Admin Only: Manage proctor ranks, assigned examination rooms, and authority.',
      staffTotal: 'Total Staff',
      activeAdmins: 'System Admins',
      activeChiefs: 'Chief Proctors',
      activeRoomProctors: 'Room Proctors',
      thUser: 'Staff Member',
      thRole: 'Current Rank / Role',
      thRoom: 'Assigned Exam Room',
      thAction: 'Save Changes',
      btnSaveRole: 'Save Rank',
      btnAddNew: '+ Add Proctor',
      roleAdmin: 'System Administrator (Admin)',
      roleChief: 'Chief Proctor',
      roleProctor: 'Room Proctor',
      roleAssistant: 'Assistant Proctor',
      // User & Password Creation
      createSectionTitle: 'Create New User & Password',
      createSectionDesc: 'Add a new proctor account with login credentials, initial rank, and assigned room.',
      usernameLabel: 'Username',
      usernamePlaceholder: 'Enter username (e.g. somchai_p)',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Enter password (e.g. Pass@1234)',
      nameLabel: 'Full Name',
      namePlaceholder: 'Enter full name (e.g. Somchai Prasert)',
      emailLabel: 'Email (Optional)',
      emailPlaceholder: 'Enter email (e.g. somchai@university.edu)',
      roleLabel: 'Rank / Role',
      roomLabel: 'Assigned Exam Room',
      btnCreateUser: 'Create User Account',
      // Sessions
      sessionsHeading: 'Active Examination Sessions',
      sessionsDesc: 'Select an active exam room or manage proctoring sessions.',
      currentActive: 'CURRENT ACTIVE',
      selectRoom: 'Select Room',
      // AI
      aiHeading: 'AI Detection Sensitivity & Rules',
      aiDesc: 'Fine-tune YOLOv4-tiny inference thresholds and active cheating act categories.',
      modelName: 'Active Edge AI Model',
      thresholdLabel: 'Confidence Threshold',
      classesLabel: 'Monitored Classes',
      // Reports
      reportsHeading: 'Integrity Audit Reports & Export',
      reportsDesc: 'Download comprehensive cheating logs with timestamped evidence clips.',
      exportPdf: 'Export Official PDF Report',
      exportCsv: 'Export CSV / Excel Sheet',
      totalIncidents: 'Total Flagged Incidents',
      confirmedViolations: 'Confirmed Violations',
      // Sound & Theme
      notifHeading: 'Audio Alert Chime & Theme Settings',
      notifDesc: 'Configure acoustic alarm chime and select dashboard appearance theme.',
      soundAlert: 'Audible Beep on Cheating Detection',
      soundAlertDesc: '1200Hz Frequency Alert Audio Chime triggered on critical incidents',
      testSoundBtn: 'Test Alert Chime',
      soundPlayedMsg: 'Chime sounded!',
      themeHeading: 'Dashboard Theme (#FFFFFF System / #1C1C1E Secondary)',
      themeDesc: 'Configure interface theme: Light (#FFFFFF System Background) or Dark (#1C1C1E Secondary System).',
      themeLight: 'Light Theme (#FFFFFF)',
      themeLightDesc: 'System Background (#FFFFFF)',
      themeDark: 'Dark Theme (#1C1C1E)',
      themeDarkDesc: 'Secondary System (#1C1C1E)',
      themeActive: 'Active',
      // Camera
      cameraHeading: 'Camera Network & ONVIF Setup',
      cameraDesc: 'Configure IP camera endpoints for MERCUSYS MC210 Pan/Tilt stream.',
      camIpLabel: 'Camera IP Address',
      rtspPortLabel: 'RTSP Stream Port',
      onvifPortLabel: 'ONVIF PTZ Port',
      camStatusOnline: 'Online & Streaming',
      // Logs / DB
      logsHeading: 'System Logs & SQLite Database',
      logsDesc: 'View real-time cheating incident logs, proctor audit trail, and microservices status.',
      btnMicroservices: 'Microservices Grid (Ports 8000-8003)',
      btnSqlite: 'SQLite Schema (exam_proctor.db)',
    },
    th: {
      title: 'การตั้งค่าระบบหลัก (System Settings)',
      subtitle: 'ศูนย์ควบคุมและปรับแต่งระบบคุมสอบอัจฉริยะ ExamGuard AI',
      close: 'ปิดหน้าต่าง',
      tabProctors: 'จัดการสิทธิ์ผู้คุมสอบ',
      tabSessions: 'ตารางรอบการสอบ',
      tabAI: 'เกณฑ์ความไว AI',
      tabReports: 'รายงานหลักฐาน',
      tabNotifications: 'ระบบเสียง & ธีม',
      tabCamera: 'จัดการกล้อง & PTZ',
      tabLogs: 'ช่อง Log & ฐานข้อมูล',
      langLabel: 'ภาษา (Language)',
      switchLang: 'สลับเป็น English',
      // Proctors Role Management
      proctorsHeading: 'จัดการสิทธิ์ผู้คุมสอบ (Proctor Roles Management)',
      proctorsDesc: 'เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถกำหนดสิทธิ์และห้องสอบของบุคลากรในระบบได้',
      staffTotal: 'บุคลากรทั้งหมด',
      activeAdmins: 'ผู้ดูแลระบบ (Admin)',
      activeChiefs: 'หัวหน้าผู้คุมสอบ',
      activeRoomProctors: 'กรรมการประจำห้อง',
      thUser: 'ผู้คุมสอบ (Staff)',
      thRole: 'สิทธิ์การใช้งาน (Role)',
      thRoom: 'ห้องสอบที่มอบหมาย',
      thAction: 'การดำเนินการ',
      btnSaveRole: 'บันทึกยศ',
      btnAddNew: '+ เพิ่มผู้คุมสอบใหม่',
      roleAdmin: 'ผู้ดูแลระบบ (Admin)',
      roleChief: 'หัวหน้าผู้คุมสอบ (Chief Proctor)',
      roleProctor: 'กรรมการคุมสอบ (Room Proctor)',
      roleAssistant: 'ผู้ช่วยคุมสอบ (Assistant)',
      // User & Password Creation
      createSectionTitle: 'สร้างบัญชีผู้ใช้และกำหนดรหัสผ่าน (Add User & Password)',
      createSectionDesc: 'กำหนดชื่อผู้ใช้ รหัสผ่าน ระดับสิทธิ์ และห้องสอบที่มอบหมายเพื่อเพิ่มเข้าสู่ระบบ',
      usernameLabel: 'ชื่อผู้ใช้ (Username)',
      usernamePlaceholder: 'กรอกชื่อผู้ใช้ เช่น somchai_p',
      passwordLabel: 'รหัสผ่าน (Password)',
      passwordPlaceholder: 'กำหนดรหัสผ่านเข้าสู่ระบบ',
      nameLabel: 'ชื่อ-นามสกุล (Full Name)',
      namePlaceholder: 'กรอกชื่อ-นามสกุล เช่น สมชาย ประเสริฐ',
      emailLabel: 'อีเมลสถาบัน (Email) (ไม่บังคับ)',
      emailPlaceholder: 'กรอกอีเมล เช่น somchai@university.edu',
      roleLabel: 'ระดับสิทธิ์การใช้งาน',
      roomLabel: 'ห้องสอบที่มอบหมาย',
      btnCreateUser: 'สร้างบัญชีผู้ใช้',
      // Sessions
      sessionsHeading: 'รอบการสอบที่กำลังดำเนินการ',
      sessionsDesc: 'เลือกรอบการสอบ หรือสลับมุมมองห้องสอบที่กำลังคุมอยู่',
      currentActive: 'ห้องที่คุมอยู่ปัจจุบัน',
      selectRoom: 'เลือกห้องนี้',
      // AI
      aiHeading: 'การตั้งค่าเกณฑ์ตรวจจับของ AI (YOLOv4-tiny)',
      aiDesc: 'กำหนดค่าความมั่นใจขั้นต่ำ และเปิด/ปิดคลาสพฤติกรรมที่ต้องการให้ AI ตรวจจับ',
      modelName: 'โมเดล AI ที่กำลังทำงาน',
      thresholdLabel: 'เกณฑ์ความมั่นใจขั้นต่ำ (Confidence)',
      classesLabel: 'คลาสพฤติกรรมที่ตรวจจับ',
      // Reports
      reportsHeading: 'รายงานการทุจริตและหลักฐาน',
      reportsDesc: 'ดาวน์โหลดเอกสารสรุปเหตุการณ์ทุจริตพร้อมประทับเวลาส่งคณะกรรมการ',
      exportPdf: 'ดาวน์โหลดรายงาน PDF ทางการ',
      exportCsv: 'ดาวน์โหลดไฟล์ CSV / Excel',
      totalIncidents: 'เหตุการณ์ที่ระบบตรวจพบทั้งหมด',
      confirmedViolations: 'ยืนยันการทุจริตแล้ว',
      // Sound & Theme
      notifHeading: 'ระบบเสียงเตือน & การเปลี่ยนธีม (Audio & Theme)',
      notifDesc: 'ตั้งค่าเสียงสัญญาณเตือนบี๊บ และเลือกธีมแสดงผล ขาว หรือ ดำ',
      soundAlert: 'เปิดเสียงเตือนเมื่อพบการทุจริต',
      soundAlertDesc: 'เสียงสัญญาณความถี่ 1200Hz แจ้งเตือนกรรมการคุมสอบทันทีเมื่อเกิดเหตุการณ์',
      testSoundBtn: 'ทดสอบเสียงเตือน (Test Chime)',
      soundPlayedMsg: 'ส่งเสียงเตือนทดสอบแล้ว!',
      themeHeading: 'เปลี่ยนธีมสีระบบ (#FFFFFF System / #1C1C1E Secondary)',
      themeDesc: 'เลือกธีมแสดงผล: ธีมขาว System Background (#FFFFFF) หรือ ธีมมืด Secondary System (#1C1C1E)',
      themeLight: 'ธีมขาว (#FFFFFF)',
      themeLightDesc: 'System Background สีขาวบริสุทธิ์ สบายตา',
      themeDark: 'ธีมมืด (#1C1C1E)',
      themeDarkDesc: 'Secondary System โทนเข้ม สไตล์ Apple Dark',
      themeActive: 'เลือกใช้อยู่',
      // Camera
      cameraHeading: 'การตั้งค่ากล้องวงจรปิดและระบบ PTZ',
      cameraDesc: 'กำหนด IP และพอร์ตสำหรับการเชื่อมต่อกล้อง MERCUSYS MC210',
      camIpLabel: 'IP Address ของกล้อง',
      rtspPortLabel: 'พอร์ต RTSP Stream',
      onvifPortLabel: 'พอร์ต ONVIF PTZ',
      camStatusOnline: 'เชื่อมต่อภาพสดสำเร็จ (Online)',
      // Logs / DB
      logsHeading: 'บันทึกเหตุการณ์ (Logs) & โครงสร้างฐานข้อมูล SQLite',
      logsDesc: 'ตรวจสอบตารางบันทึกการทุจริต (CHEATING_EVENTS), Audit Logs และสถานะ Microservices',
      btnMicroservices: 'Microservices Grid (Ports 8000-8003)',
      btnSqlite: 'SQLite Schema (exam_proctor.db)',
    }
  }[lang];

  const handleToggleSound = (enabled: boolean) => {
    setSoundEnabled(enabled);
    setSoundMuted(!enabled);
  };

  const handleTestChime = () => {
    playAlertChime('critical');
    setSoundTestPlayed(true);
    setTimeout(() => setSoundTestPlayed(false), 2000);
  };

  const handleReviewEventClip = (e: CheatingEventRecord) => {
    playActionBlip('click');
    if (!onReviewAlert) return;

    const existing = alerts.find((a) => a.studentName === e.student_name || a.seatNumber === e.seat_number);
    if (existing) {
      onReviewAlert(existing);
    } else {
      const reconstructedAlert: IncidentAlert = {
        id: `alt-${e.id}`,
        timestamp: e.timestamp,
        rawTime: new Date(),
        sessionId: currentSession.id,
        cameraId: e.camera_id || 'cam-01',
        cameraName:
          e.camera_id === 'cam-02'
            ? 'CAM 02 - Left Wing'
            : e.camera_id === 'cam-03'
            ? 'CAM 03 - Center Front'
            : e.camera_id === 'cam-04'
            ? 'CAM 04 - Back Overview'
            : 'CAM 01 - Smart PTZ (MC210)',
        studentId: e.student_id,
        studentName: e.student_name,
        seatNumber: e.seat_number,
        incidentType:
          e.event_type === 'using_phone'
            ? 'Smartphone Detected'
            : e.event_type === 'looking_sideways'
            ? 'Suspicious Head Turning'
            : e.event_type === 'paper_passing'
            ? 'Passing Unauthorized Material'
            : 'Concealed Electronic Earbud',
        severity: e.event_type === 'using_phone' ? 'critical' : 'warning',
        confidence: Math.round(e.confidence * 100),
        status: e.status,
        description: `Automated CiRA CORE YOLO detection: examinee at ${e.seat_number} flagged for ${e.event_type}.`,
        aiRationale: `Darknet YOLOv4-tiny bounding box confirmed with ${(e.confidence * 100).toFixed(1)}% confidence score.`,
        proctorNote: e.review_notes,
        telemetry: {
          gazePitch: -18,
          gazeYaw: 32,
          durationSeconds: 10.0,
          headRotationDeg: 35,
        },
        evidenceClip: {
          durationSec: 10,
          keyframeSec: 5,
          clipName: e.video_path.split('/').pop() || `highlight_${e.id}.mp4`,
          detectedBoundingBox: {
            x: 35,
            y: 42,
            width: 28,
            height: 32,
            label: `${e.event_type} (${Math.round(e.confidence * 100)}%)`,
          },
        },
      };
      onReviewAlert(reconstructedAlert);
    }
  };

  // Save role change for a specific user
  const handleSaveUserRole = (userId: number) => {
    const target = dbUsers.find((u) => u.id === userId);
    if (target?.username === 'admin') {
      // Root Admin is fixed and permanently locked
      return;
    }
    const draft = userRolesDraft[userId];
    if (!draft) return;
    playActionBlip('confirm');
    const updated = databaseService.updateUserRole(userId, draft.role, draft.room, currentUser.username);
    if (updated) {
      setRoleUpdateMsg(
        lang === 'th'
          ? `ตั้งยศใหม่ให้ '${updated.username}' เป็น '${draft.role}' สำเร็จแล้ว!`
          : `Updated rank of '${updated.username}' to '${draft.role}' successfully!`
      );
      setTimeout(() => setRoleUpdateMsg(''), 3000);
    }
  };

  // Delete user (Admin only, cannot delete Root Admin)
  const handleDeleteUser = (userId: number, username: string) => {
    if (username === 'admin' || userId === 1) return;
    const confirmText = lang === 'th'
      ? `คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีผู้ใช้ '${username}' ออกจากระบบ?`
      : `Are you sure you want to delete user account '${username}'?`;
    if (!window.confirm(confirmText)) return;

    playActionBlip('click');
    const success = databaseService.deleteUser(userId, currentUser.username);
    if (success) {
      setRoleUpdateMsg(
        lang === 'th'
          ? `ลบบัญชีผู้ใช้ '${username}' เรียบร้อยแล้ว!`
          : `Deleted user account '${username}' successfully!`
      );
      setTimeout(() => setRoleUpdateMsg(''), 3000);
    }
  };

  // Add new proctor / user with password
  const handleRegisterProctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;
    playActionBlip('confirm');
    const created = databaseService.addUser(
      {
        username: newUsername.trim(),
        password: newPassword.trim() || undefined,
        name: newName.trim() || newUsername.trim(),
        email: newEmail.trim() || `${newUsername.trim()}@university.edu`,
        role: newRole,
        assigned_room: newRoom,
        avatar: newUsername.trim().slice(0, 2).toUpperCase(),
      },
      currentUser.username
    );
    setRoleUpdateMsg(
      lang === 'th'
        ? `สร้างบัญชีผู้ใช้ '${created.username}' พร้อมรหัสผ่านและยศ '${created.role}' สำเร็จแล้ว!`
        : `Created user account '${created.username}' with password & role '${created.role}' successfully!`
    );
    // Reset all fields back to blank ("ทำเป็นช่องว่างเอาไว้กรอก")
    setNewUsername('');
    setNewPassword('');
    setShowNewPassword(false);
    setNewName('');
    setNewEmail('');
    setNewRole('proctor');
    setNewRoom('Room 402');
    setIsCreateUserModalOpen(false);
    setTimeout(() => setRoleUpdateMsg(''), 4000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none overflow-hidden overscroll-contain"
      onWheel={(e) => e.stopPropagation()}
    >
      <div 
        className="relative w-full max-w-4xl rounded-2xl liquid-glass-modal shadow-2xl flex flex-col overflow-hidden max-h-[92vh] border border-white/15 overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-zinc-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 shadow-inner">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-base font-bold text-white tracking-tight">
                  {t.title}
                </span>
                <span className="font-mono text-[10px] text-cyan-300 bg-cyan-950/80 border border-cyan-500/30 px-2 py-0.5 rounded-md">
                  v2.6
                </span>
                {currentUser.role === 'admin' && (
                  <span className="font-mono text-[10px] text-amber-300 bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded-md flex items-center gap-1 font-bold">
                    <Crown className="w-3 h-3 text-amber-400" />
                    ADMIN
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {t.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Language Switcher Button */}
            <button
              onClick={() => {
                playActionBlip('click');
                onToggleLang();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl liquid-glass text-xs font-medium text-cyan-300 hover:text-white border border-white/10 hover:border-cyan-500/40 transition-colors cursor-pointer"
              title={t.switchLang}
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-mono font-semibold">
                {lang === 'th' ? 'ไทย (TH)' : 'English (EN)'}
              </span>
            </button>

            {/* Close Button */}
            <button
              onClick={() => {
                playActionBlip('click');
                onClose();
              }}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title={t.close}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Tabs + Content */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-[480px]">
          {/* Left Navigation Sidebar - Proctor Roles is placed directly ABOVE Exam Sessions */}
          <div className="md:w-56 p-3 border-b md:border-b-0 md:border-r border-white/10 bg-zinc-950/30 flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible shrink-0">
            {[
              // 👑 PROCTOR ROLES TAB (ABOVE EXAM SESSIONS, Admin Exclusive)
              ...(currentUser.role === 'admin'
                ? [
                    {
                      id: 'proctors',
                      label: t.tabProctors,
                      icon: Crown,
                      isAdminBadge: true,
                    },
                  ]
                : []),
              { id: 'sessions', label: t.tabSessions, icon: Calendar },
              { id: 'ai', label: t.tabAI, icon: ShieldAlert },
              { id: 'reports', label: t.tabReports, icon: FileText },
              { id: 'notifications', label: t.tabNotifications, icon: Volume2 },
              { id: 'camera', label: t.tabCamera, icon: Camera },
              { id: 'logs', label: t.tabLogs, icon: Database },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isAdminSpecial = (tab as any).isAdminBadge;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    playActionBlip('click');
                    setActiveTab(tab.id as typeof activeTab);
                  }}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left whitespace-nowrap cursor-pointer ${
                    isActive
                      ? isAdminSpecial
                        ? 'bg-amber-950/70 border border-amber-500/50 text-amber-200 shadow-sm'
                        : 'bg-cyan-950/70 border border-cyan-500/40 text-cyan-200 shadow-sm'
                      : isAdminSpecial
                      ? 'text-amber-300/80 hover:text-amber-200 hover:bg-amber-950/20'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive
                          ? isAdminSpecial ? 'text-amber-400' : 'text-cyan-400'
                          : isAdminSpecial ? 'text-amber-500' : 'text-zinc-500'
                      }`}
                    />
                    <span>{tab.label}</span>
                  </div>
                  {isAdminSpecial && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      ADMIN
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Content Area */}
          <div className="flex-1 p-5 overflow-y-auto max-h-[75vh] overscroll-contain">
            {/* 👑 TAB 0: PROCTOR ROLES MANAGEMENT (Positioned above Exam Sessions, Admin Only) */}
            {activeTab === 'proctors' && currentUser.role === 'admin' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span>{t.proctorsHeading}</span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">{t.proctorsDesc}</p>
                  </div>

                  <button
                    onClick={() => {
                      setIsCreateUserModalOpen(true);
                      playActionBlip('click');
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs font-bold transition-all shadow-md hover:shadow-amber-500/25 cursor-pointer self-start sm:self-auto active:scale-95"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{t.btnAddNew}</span>
                  </button>
                </div>

                {roleUpdateMsg && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{roleUpdateMsg}</span>
                  </div>
                )}

                {/* Staff KPI Statistics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
                  <div className="p-3 rounded-xl liquid-glass-card border border-white/10 text-center">
                    <div className="text-xl font-bold text-white">{dbUsers.length}</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">{t.staffTotal}</div>
                  </div>
                  <div className="p-3 rounded-xl liquid-glass-card border border-amber-500/20 text-center">
                    <div className="text-xl font-bold text-amber-400">
                      {dbUsers.filter((u) => u.role === 'admin').length}
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">{t.activeAdmins}</div>
                  </div>
                  <div className="p-3 rounded-xl liquid-glass-card border border-cyan-500/20 text-center">
                    <div className="text-xl font-bold text-cyan-400">
                      {dbUsers.filter((u) => u.role === 'chief_proctor').length}
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">{t.activeChiefs}</div>
                  </div>
                  <div className="p-3 rounded-xl liquid-glass-card border border-white/10 text-center">
                    <div className="text-xl font-bold text-emerald-400">
                      {dbUsers.filter((u) => u.role === 'proctor' || u.role === 'assistant').length}
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">{t.activeRoomProctors}</div>
                  </div>
                </div>

                {/* Proctors Role Assignment Table */}
                <div className="liquid-glass-card rounded-xl p-3.5 space-y-2 border border-white/10">
                  <div className="flex items-center justify-between pb-2 border-b border-white/5 text-xs">
                    <span className="font-mono text-amber-300 font-bold tracking-tight">
                      STAFF ROLES & PRIVILEGES LEDGER
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500">SQLite: users</span>
                  </div>

                  <div className="overflow-x-auto rounded-xl">
                    <table className="w-full text-left text-xs font-mono min-w-[720px]">
                      <thead>
                        <tr className="border-b border-white/10 text-zinc-400 uppercase text-[9px]">
                          <th className="py-2.5 px-3 whitespace-nowrap min-w-[210px]">{t.thUser}</th>
                          <th className="py-2.5 px-3 whitespace-nowrap min-w-[210px]">{t.thRole}</th>
                          <th className="py-2.5 px-3 whitespace-nowrap min-w-[170px]">{t.thRoom}</th>
                          <th className="py-2.5 px-3 text-right whitespace-nowrap min-w-[130px]">{t.thAction}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-zinc-300">
                        {dbUsers.map((user) => {
                          const currentDraft = userRolesDraft[user.id] || { role: user.role, room: user.assigned_room || 'All Rooms' };
                          const isSelf = user.id === currentUser.id;
                          const isRootAdmin = user.username === 'admin' || user.id === 1;

                          return (
                            <tr key={user.id} className="hover:bg-white/5 transition-colors">
                              {/* User Info */}
                              <td className="py-3 px-3 whitespace-nowrap min-w-[210px]">
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shadow-sm text-white shrink-0 ${
                                      user.role === 'admin'
                                        ? 'bg-gradient-to-br from-amber-500 to-yellow-600'
                                        : user.role === 'chief_proctor'
                                        ? 'bg-gradient-to-br from-cyan-600 to-blue-700'
                                        : 'bg-zinc-800 border border-white/15'
                                    }`}
                                  >
                                    {user.avatar || user.username.slice(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="font-bold text-zinc-100 flex items-center gap-1.5 font-sans text-xs whitespace-nowrap">
                                      <span>{user.name || user.username}</span>
                                      {isSelf && (
                                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 whitespace-nowrap shrink-0">
                                          {lang === 'th' ? 'คุณ' : 'You'}
                                        </span>
                                      )}
                                      {isRootAdmin && (
                                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-500/40 flex items-center gap-0.5 whitespace-nowrap shrink-0">
                                          <Lock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                                          {lang === 'th' ? 'ผู้ดูแลหลัก' : 'Root'}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-zinc-400 font-mono whitespace-nowrap">
                                      @{user.username} · {user.email}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Role Selector (Admin can change anyone's role, except Root Admin which is fixed) */}
                              <td className="py-3 px-3 whitespace-nowrap min-w-[210px]">
                                {isRootAdmin ? (
                                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-500/40 text-xs font-semibold text-amber-300 whitespace-nowrap shrink-0">
                                    <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                    <span className="whitespace-nowrap">{t.roleAdmin}</span>
                                    <span className="text-[10px] text-amber-300 font-mono inline-flex items-center gap-1 ml-1 bg-amber-900/80 px-1.5 py-0.5 rounded border border-amber-500/50 whitespace-nowrap shrink-0">
                                      <Lock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                                      {lang === 'th' ? 'ล็อกห้ามเปลี่ยน' : 'Locked'}
                                    </span>
                                  </div>
                                ) : (
                                  <select
                                    value={currentDraft.role}
                                    onChange={(e) => {
                                      const nextRole = e.target.value as UserRecord['role'];
                                      setUserRolesDraft((prev) => ({
                                        ...prev,
                                        [user.id]: { ...prev[user.id], role: nextRole },
                                      }));
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/15 text-xs text-zinc-200 font-medium focus:outline-none focus:border-amber-400 cursor-pointer whitespace-nowrap"
                                  >
                                    <option value="admin">{t.roleAdmin}</option>
                                    <option value="chief_proctor">{t.roleChief}</option>
                                    <option value="proctor">{t.roleProctor}</option>
                                    <option value="assistant">{t.roleAssistant}</option>
                                  </select>
                                )}
                              </td>

                              {/* Assigned Room */}
                              <td className="py-3 px-3 whitespace-nowrap min-w-[170px]">
                                {isRootAdmin ? (
                                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-white/10 text-xs text-zinc-300 font-mono whitespace-nowrap shrink-0">
                                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                    <span className="whitespace-nowrap">{lang === 'th' ? 'ทุกห้องสอบ (All Rooms)' : 'All Rooms'}</span>
                                  </div>
                                ) : (
                                  <select
                                    value={currentDraft.room}
                                    onChange={(e) => {
                                      const nextRoom = e.target.value;
                                      setUserRolesDraft((prev) => ({
                                        ...prev,
                                        [user.id]: { ...prev[user.id], room: nextRoom },
                                      }));
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/15 text-xs text-zinc-300 font-mono focus:outline-none focus:border-cyan-400 cursor-pointer whitespace-nowrap"
                                  >
                                    <option value="All Rooms">{lang === 'th' ? 'ทุกห้องสอบ (All Rooms)' : 'All Rooms'}</option>
                                    <option value="Room 402">Room 402</option>
                                    <option value="Room 405">Room 405</option>
                                    <option value="Room 408">Room 408</option>
                                  </select>
                                )}
                              </td>

                              {/* Save Action */}
                              <td className="py-3 px-3 text-right whitespace-nowrap min-w-[130px]">
                                {isRootAdmin ? (
                                  <div
                                    className="inline-flex items-center justify-end gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono text-zinc-400 bg-white/5 border border-white/10 whitespace-nowrap shrink-0"
                                    title={lang === 'th' ? 'ตำแหน่งผู้ดูแลระบบสูงสุดตั้งเป็นค่าตายตัว ล็อกห้ามเปลี่ยน' : 'System Administrator is fixed and locked'}
                                  >
                                    <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                                    <span className="whitespace-nowrap">{lang === 'th' ? 'ค่าตายตัว (ล็อก)' : 'Fixed (Locked)'}</span>
                                  </div>
                                ) : (
                                  <div className="inline-flex items-center justify-end gap-1.5 whitespace-nowrap shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handleSaveUserRole(user.id)}
                                      className="inline-flex items-center justify-end gap-1 px-2.5 py-1.5 rounded-lg bg-amber-950/70 hover:bg-amber-900 border border-amber-500/40 text-amber-300 hover:text-white text-[11px] font-semibold transition-colors cursor-pointer shadow-sm whitespace-nowrap shrink-0"
                                      title={lang === 'th' ? 'บันทึกยศ' : 'Save rank and room assignment'}
                                    >
                                      <Save className="w-3 h-3 text-amber-400 shrink-0" />
                                      <span className="whitespace-nowrap">{t.btnSaveRole}</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteUser(user.id, user.username)}
                                      className="inline-flex items-center justify-end p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 hover:text-white text-[11px] transition-colors cursor-pointer shadow-sm shrink-0"
                                      title={lang === 'th' ? `ลบบัญชี '${user.username}'` : `Delete user '${user.username}'`}
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Dedicated Modal Dialog: Add New Proctor Account (Option 1 Standard - Formal & Clean) */}
                {isCreateUserModalOpen && (
                  <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 select-none overflow-y-auto overscroll-contain"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCreateUserModalOpen(false);
                    }}
                  >
                    <div 
                      className="relative w-full max-w-lg rounded-2xl liquid-glass-modal shadow-2xl p-6 sm:p-7 border border-white/15 overflow-hidden my-auto animate-in zoom-in-95 duration-150"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Modal Header */}
                      <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-cyan-950/70 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-sm shrink-0">
                            <UserPlus className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight">
                                {lang === 'th' ? 'สร้างบัญชีผู้คุมสอบใหม่' : 'Create Proctor Account'}
                              </h3>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400 font-medium tracking-wide">
                                ADMIN
                              </span>
                            </div>
                            <p className="text-xs text-zinc-400 mt-0.5">
                              {lang === 'th' ? 'กำหนดข้อมูลการเข้าสู่ระบบและมอบหมายสิทธิ์การคุมสอบ' : 'Enter credentials and assign proctoring permissions'}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setIsCreateUserModalOpen(false)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Form with formal, unified styling */}
                      <form onSubmit={handleRegisterProctor} className="space-y-4 font-sans">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {/* 1. Username */}
                          <div>
                            <label className="text-xs text-zinc-300 block mb-1.5 font-medium">
                              {lang === 'th' ? 'ชื่อผู้ใช้ (Username)' : 'Username'}
                              <span className="text-rose-400 ml-1">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              autoFocus
                              value={newUsername}
                              onChange={(e) => setNewUsername(e.target.value)}
                              placeholder={lang === 'th' ? 'เช่น somchai_p' : 'e.g. somchai_p'}
                              className="w-full h-10 px-3.5 rounded-xl bg-zinc-900/90 border border-white/10 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all font-sans"
                            />
                          </div>

                          {/* 2. Password */}
                          <div>
                            <label className="text-xs text-zinc-300 block mb-1.5 font-medium">
                              {lang === 'th' ? 'รหัสผ่าน (Password)' : 'Password'}
                              <span className="text-rose-400 ml-1">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type={showNewPassword ? 'text' : 'password'}
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder={lang === 'th' ? 'กำหนดรหัสผ่านเข้าสู่ระบบ' : 'Enter account password'}
                                className="w-full h-10 pl-3.5 pr-10 rounded-xl bg-zinc-900/90 border border-white/10 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all font-sans"
                              />
                              <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors p-1 cursor-pointer"
                                tabIndex={-1}
                                title={showNewPassword ? 'Hide password' : 'Show password'}
                              >
                                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          {/* 3. Full Name */}
                          <div>
                            <label className="text-xs text-zinc-300 block mb-1.5 font-medium">
                              {lang === 'th' ? 'ชื่อ-นามสกุล (Full Name)' : 'Full Name'}
                            </label>
                            <input
                              type="text"
                              value={newName}
                              onChange={(e) => setNewName(e.target.value)}
                              placeholder={lang === 'th' ? 'เช่น สมชาย ประเสริฐ' : 'e.g. Somchai Prasert'}
                              className="w-full h-10 px-3.5 rounded-xl bg-zinc-900/90 border border-white/10 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all font-sans"
                            />
                          </div>

                          {/* 4. Email */}
                          <div>
                            <label className="text-xs text-zinc-300 block mb-1.5 font-medium">
                              {lang === 'th' ? 'อีเมลสถาบัน (Email)' : 'Institutional Email'}
                            </label>
                            <input
                              type="email"
                              value={newEmail}
                              onChange={(e) => setNewEmail(e.target.value)}
                              placeholder={lang === 'th' ? 'เช่น somchai@university.edu' : 'e.g. somchai@university.edu'}
                              className="w-full h-10 px-3.5 rounded-xl bg-zinc-900/90 border border-white/10 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all font-sans"
                            />
                          </div>

                          {/* 5. Role */}
                          <div>
                            <label className="text-xs text-zinc-300 block mb-1.5 font-medium">
                              {lang === 'th' ? 'สิทธิ์การใช้งาน (Role)' : 'Assigned Role'}
                            </label>
                            <select
                              value={newRole}
                              onChange={(e) => setNewRole(e.target.value as any)}
                              className="w-full h-10 px-3 rounded-xl bg-zinc-900 border border-white/10 text-xs text-zinc-100 font-medium focus:outline-none focus:border-cyan-500/60 cursor-pointer font-sans"
                            >
                              <option value="proctor">{t.roleProctor}</option>
                              <option value="chief_proctor">{t.roleChief}</option>
                              <option value="assistant">{t.roleAssistant}</option>
                              <option value="admin">{t.roleAdmin}</option>
                            </select>
                          </div>

                          {/* 6. Assigned Room */}
                          <div>
                            <label className="text-xs text-zinc-300 block mb-1.5 font-medium">
                              {lang === 'th' ? 'ห้องสอบที่มอบหมาย (Exam Room)' : 'Assigned Exam Room'}
                            </label>
                            <select
                              value={newRoom}
                              onChange={(e) => setNewRoom(e.target.value)}
                              className="w-full h-10 px-3 rounded-xl bg-zinc-900 border border-white/10 text-xs text-zinc-100 font-medium focus:outline-none focus:border-cyan-500/60 cursor-pointer font-sans"
                            >
                              <option value="All Rooms">{lang === 'th' ? 'ทุกห้องสอบ (All Rooms)' : 'All Rooms'}</option>
                              <option value="Room 402">Room 402 (Main Floor)</option>
                              <option value="Room 405">Room 405 (Aisle Center)</option>
                              <option value="Room 408">Room 408 (West Wing)</option>
                            </select>
                          </div>
                        </div>

                        {/* Dialog Footer Actions */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                          <button
                            type="button"
                            onClick={() => setIsCreateUserModalOpen(false)}
                            className="px-4 py-2 rounded-xl border border-white/10 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
                          >
                            {lang === 'th' ? 'ยกเลิก' : 'Cancel'}
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-all shadow-sm hover:shadow-cyan-500/20 flex items-center gap-2 cursor-pointer active:scale-98"
                          >
                            <UserPlus className="w-4 h-4" />
                            <span>{lang === 'th' ? 'สร้างบัญชีผู้ใช้' : 'Create Account'}</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 1. Exam Sessions Tab */}
            {activeTab === 'sessions' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white">{t.sessionsHeading}</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">{t.sessionsDesc}</p>
                </div>

                <div className="space-y-2.5">
                  {sessions.map((sess) => {
                    const isSelected = sess.id === currentSession.id;
                    return (
                      <div
                        key={sess.id}
                        onClick={() => {
                          playActionBlip('click');
                          onSelectSession(sess);
                        }}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-cyan-950/60 border-cyan-500/50 shadow-md ring-1 ring-cyan-500/30'
                            : 'liquid-glass-card hover:border-white/20'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{sess.room}</span>
                            <span className="text-zinc-500">·</span>
                            <span className="text-xs text-cyan-300 font-mono font-semibold">{sess.code}</span>
                            {isSelected && (
                              <span className="text-[9px] font-mono font-bold bg-cyan-900/60 border border-cyan-400/30 text-cyan-200 px-2 py-0.5 rounded-full">
                                {t.currentActive}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-zinc-300 font-medium">{sess.title}</div>
                          <div className="text-[11px] text-zinc-400 flex items-center gap-2">
                            <span>{sess.totalStudents} {lang === 'th' ? 'ผู้เข้าสอบ' : 'examinees'}</span>
                            <span>·</span>
                            <span>{sess.startTime} - {sess.endTime}</span>
                          </div>
                        </div>

                        <button
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            isSelected
                              ? 'bg-cyan-500 text-black font-semibold'
                              : 'bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10'
                          }`}
                        >
                          {isSelected ? (lang === 'th' ? 'กำลังคุมอยู่' : 'Active') : t.selectRoom}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. AI Detection Rules Tab */}
            {activeTab === 'ai' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white">{t.aiHeading}</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">{t.aiDesc}</p>
                </div>

                <div className="p-4 rounded-xl liquid-glass-card space-y-4 border border-white/10">
                  {/* Model Card */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <div>
                      <div className="text-xs font-semibold text-zinc-200">{t.modelName}</div>
                      <div className="text-[11px] text-cyan-300 font-mono mt-0.5">
                        CiRA CORE Darknet · yolo-obj_last.weights (23.5 MB)
                      </div>
                    </div>
                    <span className="font-mono text-[10px] bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded-full">
                      YOLOv4-tiny
                    </span>
                  </div>

                  {/* Confidence Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-zinc-300">{t.thresholdLabel}</span>
                      <span className="font-mono text-cyan-400 font-bold text-sm">{confidenceThreshold}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="95"
                      value={confidenceThreshold}
                      onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                      <span>50% (High Sensitivity)</span>
                      <span>80% (Recommended)</span>
                      <span>95% (Strict Verification)</span>
                    </div>
                  </div>

                  {/* Detection Classes Toggles */}
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <div className="text-xs font-medium text-zinc-300">{t.classesLabel}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <label className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-950/40 border border-white/5 cursor-pointer hover:border-cyan-500/30">
                        <input
                          type="checkbox"
                          checked={detectCheat}
                          onChange={(e) => setDetectCheat(e.target.checked)}
                          className="accent-cyan-400 rounded cursor-pointer"
                        />
                        <span className="text-xs text-rose-300 font-semibold font-mono">cheat</span>
                      </label>
                      <label className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-950/40 border border-white/5 cursor-pointer hover:border-cyan-500/30">
                        <input
                          type="checkbox"
                          checked={detectWatching}
                          onChange={(e) => setDetectWatching(e.target.checked)}
                          className="accent-cyan-400 rounded cursor-pointer"
                        />
                        <span className="text-xs text-amber-300 font-semibold font-mono">Watching</span>
                      </label>
                      <label className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-950/40 border border-white/5 cursor-pointer hover:border-cyan-500/30">
                        <input
                          type="checkbox"
                          checked={detectPhone}
                          onChange={(e) => setDetectPhone(e.target.checked)}
                          className="accent-cyan-400 rounded cursor-pointer"
                        />
                        <span className="text-xs text-zinc-300 font-semibold font-mono">Normal</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Evidence Reports Tab */}
            {activeTab === 'reports' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white">{t.reportsHeading}</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">{t.reportsDesc}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl liquid-glass-card text-center border border-white/10">
                    <div className="text-2xl font-bold font-mono text-cyan-400">{alerts.length}</div>
                    <div className="text-[11px] text-zinc-400 mt-1">{t.totalIncidents}</div>
                  </div>
                  <div className="p-3.5 rounded-xl liquid-glass-card text-center border border-white/10">
                    <div className="text-2xl font-bold font-mono text-rose-400">
                      {alerts.filter(a => a.status === 'confirmed').length}
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-1">{t.confirmedViolations}</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl liquid-glass-card space-y-3 border border-white/10">
                  <button
                    onClick={() => {
                      playActionBlip('click');
                      exportProctorReportPDF(currentSession, alerts);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>{t.exportPdf}</span>
                  </button>

                  <button
                    onClick={() => {
                      playActionBlip('click');
                      const csvContent = "data:text/csv;charset=utf-8," 
                        + ["ID,Time,Student,Seat,Camera,Incident,Status,Confidence", ...alerts.map(a => `${a.id},${a.timestamp},${a.studentName},${a.seatNumber},${a.cameraName},${a.incidentType},${a.status},${a.confidence}%`)].join("\n");
                      const encodedUri = encodeURI(csvContent);
                      const link = document.createElement("a");
                      link.setAttribute("href", encodedUri);
                      link.setAttribute("download", `exam_audit_${currentSession.code}.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl liquid-glass hover:bg-white/10 text-zinc-200 text-xs font-medium border border-white/10 transition-colors cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <span>{t.exportCsv}</span>
                  </button>
                </div>
              </div>
            )}

            {/* 4. Alert Sounds & Theme Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white">{t.notifHeading}</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">{t.notifDesc}</p>
                </div>

                {/* Section A: Audible Chime Controls */}
                <div className="p-4 rounded-xl liquid-glass-card space-y-3 border border-white/10">
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                        {soundEnabled ? (
                          <Volume2 className="w-5 h-5 text-cyan-400" />
                        ) : (
                          <VolumeX className="w-5 h-5 text-zinc-500" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-zinc-100">{t.soundAlert}</div>
                        <div className="text-[11px] text-zinc-400 font-mono mt-0.5">{t.soundAlertDesc}</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={soundEnabled}
                      onChange={(e) => handleToggleSound(e.target.checked)}
                      className="accent-cyan-400 w-5 h-5 rounded cursor-pointer"
                    />
                  </div>

                  {/* Audio Chime Test Action */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-zinc-300">
                      {lang === 'th' ? 'ทดสอบระดับเสียงและสัญญาณเตือน' : 'Test alarm chime output audio'}
                    </span>
                    <button
                      onClick={handleTestChime}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
                      <span>{t.testSoundBtn}</span>
                    </button>
                  </div>

                  {soundTestPlayed && (
                    <div className="text-[11px] text-emerald-400 flex items-center gap-1.5 font-mono pt-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{t.soundPlayedMsg}</span>
                    </div>
                  )}
                </div>

                {/* Section B: Theme Selection (Divided Left = White Theme | Right = Black Theme) */}
                <div className="p-4 rounded-xl liquid-glass-card space-y-3 border border-white/10">
                  <div>
                    <div className="text-xs font-bold text-zinc-100 flex items-center gap-2">
                      <span>{t.themeHeading}</span>
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-1.5 py-0.2 rounded">
                        {theme === 'light' ? (lang === 'th' ? 'ธีมขาว' : 'White') : (lang === 'th' ? 'ธีมดำ' : 'Black')}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{t.themeDesc}</p>
                  </div>

                  {/* 2-Column Split: Left = White (#FFFFFF), Right = Dark (#1C1C1E) */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-1">
                    {/* Left Column: White Theme (Light - #FFFFFF System Background) */}
                    <button
                      type="button"
                      onClick={() => {
                        playActionBlip('click');
                        onSelectTheme('light');
                      }}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                        theme === 'light'
                          ? 'bg-[#FFFFFF] border-cyan-500 shadow-xl ring-2 ring-cyan-500/40 text-slate-900'
                          : 'bg-zinc-950/40 border-white/10 hover:border-white/30 text-zinc-300'
                      }`}
                    >
                      {/* Active Pill Badge */}
                      {theme === 'light' && (
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 text-[10px] font-bold text-cyan-700 bg-cyan-100 border border-cyan-300 px-2 py-0.5 rounded-full shadow-sm">
                          <CheckCircle2 className="w-3 h-3 text-cyan-600" />
                          <span>{t.themeActive}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-[#FFFFFF] border border-slate-300 flex items-center justify-center text-amber-500 shadow-sm shrink-0">
                          <Sun className="w-4 h-4 text-amber-500" />
                        </div>
                        <div>
                          <div className={`text-xs font-bold ${theme === 'light' ? 'text-slate-900' : 'text-zinc-100'}`}>
                            {t.themeLight}
                          </div>
                          <div className={`text-[10px] ${theme === 'light' ? 'text-slate-600' : 'text-zinc-400'}`}>
                            {t.themeLightDesc}
                          </div>
                        </div>
                      </div>

                      {/* Visual UI Preview Thumbnail (Light Mode Mock - #FFFFFF) */}
                      <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-slate-200 shadow-inner space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="w-14 h-2 rounded bg-slate-300" />
                          <div className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <div className="h-4 rounded bg-[#F2F2F7] border border-slate-200" />
                          <div className="h-4 rounded bg-[#F2F2F7] border border-slate-200" />
                          <div className="h-4 rounded bg-[#F2F2F7] border border-slate-200" />
                        </div>
                      </div>
                    </button>

                    {/* Right Column: Dark Theme (#1C1C1E Secondary System) */}
                    <button
                      type="button"
                      onClick={() => {
                        playActionBlip('click');
                        onSelectTheme('dark');
                      }}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                        theme === 'dark'
                          ? 'bg-[#1C1C1E] border-cyan-500 shadow-xl ring-2 ring-cyan-500/40 text-white'
                          : 'bg-zinc-950/40 border-white/10 hover:border-white/30 text-zinc-300'
                      }`}
                    >
                      {/* Active Pill Badge */}
                      {theme === 'dark' && (
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 text-[10px] font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 rounded-full shadow-sm">
                          <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                          <span>{t.themeActive}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-[#1C1C1E] border border-white/15 flex items-center justify-center text-cyan-400 shadow-sm shrink-0">
                          <Moon className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-zinc-100">
                            {t.themeDark}
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            {t.themeDarkDesc}
                          </div>
                        </div>
                      </div>

                      {/* Visual UI Preview Thumbnail (Dark Mode Mock - #1C1C1E) */}
                      <div className="p-2.5 rounded-lg bg-[#1C1C1E] border border-cyan-500/20 shadow-inner space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="w-14 h-2 rounded bg-zinc-600" />
                          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <div className="h-4 rounded bg-[#2C2C2E] border border-white/5" />
                          <div className="h-4 rounded bg-[#2C2C2E] border border-white/5" />
                          <div className="h-4 rounded bg-[#2C2C2E] border border-white/5" />
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 5. Camera & ONVIF Setup Tab */}
            {activeTab === 'camera' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white">{t.cameraHeading}</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">{t.cameraDesc}</p>
                </div>

                <div className="p-4 rounded-xl liquid-glass-card space-y-4 border border-white/10">
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <div>
                      <div className="text-xs font-bold text-zinc-100">MERCUSYS MC210 (Tapo PTZ)</div>
                      <div className="text-[10px] text-zinc-400 font-mono">Firmware: 1.1.4 · ONVIF Profile S</div>
                    </div>
                    <span className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {t.camStatusOnline}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-zinc-400 font-mono block mb-1">{t.camIpLabel}</label>
                      <input
                        type="text"
                        value={cameraIp}
                        onChange={(e) => setCameraIp(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-zinc-950/60 border border-white/10 text-xs font-mono text-zinc-200"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-zinc-400 font-mono block mb-1">{t.rtspPortLabel}</label>
                      <input
                        type="text"
                        value={rtspPort}
                        onChange={(e) => setRtspPort(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-zinc-950/60 border border-white/10 text-xs font-mono text-zinc-200"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-zinc-400 font-mono block mb-1">{t.onvifPortLabel}</label>
                      <input
                        type="text"
                        value={onvifPort}
                        onChange={(e) => setOnvifPort(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-zinc-950/60 border border-white/10 text-xs font-mono text-zinc-200"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 6. LOGS & DATABASE TAB */}
            {activeTab === 'logs' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white">{t.logsHeading}</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">{t.logsDesc}</p>
                </div>

                {/* Top Segmented Mode Selector: Microservices Grid vs SQLite Schema */}
                <div className="flex items-center gap-2 p-1 rounded-xl bg-zinc-950/70 border border-white/10">
                  <button
                    onClick={() => {
                      setLogViewMode('microservices');
                      playActionBlip('click');
                    }}
                    className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                      logViewMode === 'microservices'
                        ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-500/50 shadow-sm font-semibold'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{t.btnMicroservices}</span>
                  </button>

                  <button
                    onClick={() => {
                      setLogViewMode('database');
                      playActionBlip('click');
                    }}
                    className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                      logViewMode === 'database'
                        ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-500/50 shadow-sm font-semibold'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Database className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{t.btnSqlite}</span>
                  </button>
                </div>

                {/* VIEW A: SQLite Schema & Table Logs */}
                {logViewMode === 'database' && (
                  <div className="space-y-3">
                    {/* Database Table Selectors: CHEATING_EVENTS | AUDIT_LOGS | USERS */}
                    <div className="flex gap-2 p-1 rounded-xl bg-zinc-950/70 border border-white/10 text-xs font-mono">
                      {(['CHEATING_EVENTS', 'AUDIT_LOGS', 'USERS'] as const).map((table) => (
                        <button
                          key={table}
                          onClick={() => {
                            setSelectedDbTable(table);
                            playActionBlip('click');
                          }}
                          className={`flex-1 py-1.5 px-2 rounded-lg font-mono font-medium transition-colors text-center cursor-pointer ${
                            selectedDbTable === table
                              ? 'bg-zinc-800 text-cyan-300 shadow-sm border border-zinc-700 font-bold'
                              : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {table}
                        </button>
                      ))}
                    </div>

                    {/* Table 1: CHEATING_EVENTS */}
                    {selectedDbTable === 'CHEATING_EVENTS' && (
                      <div className="liquid-glass-card rounded-xl p-3.5 space-y-2 border border-white/10">
                        <div className="flex items-center justify-between pb-2 border-b border-white/5 text-xs">
                          <span className="font-mono text-cyan-300 font-bold tracking-tight">
                            TABLE: CHEATING_EVENTS ({dbEvents.length} records)
                          </span>
                          <span className="text-[11px] font-mono text-zinc-500">Diagram 5</span>
                        </div>

                        {/* Scroll Container */}
                        <div className="overflow-y-auto overflow-x-auto max-h-[195px] scrollbar-log-visible pr-1 rounded-lg border border-white/5 bg-zinc-950/40">
                          <table className="w-full text-left text-[11px] font-mono">
                            <thead className="sticky top-0 bg-[#0d121f] z-10 shadow-sm">
                              <tr className="border-b border-white/10 text-zinc-400 uppercase text-[9px]">
                                <th className="py-2 px-2.5 bg-[#0d121f]">ID</th>
                                <th className="py-2 px-2 bg-[#0d121f]">TIMESTAMP</th>
                                <th className="py-2 px-2 bg-[#0d121f]">EVENT_TYPE</th>
                                <th className="py-2 px-2 bg-[#0d121f]">CONF</th>
                                <th className="py-2 px-2 bg-[#0d121f]">STATUS</th>
                                <th className="py-2 px-2.5 bg-[#0d121f] text-cyan-300 font-semibold whitespace-nowrap">
                                  10s Highlight
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-zinc-300">
                              {dbEvents.map((e) => (
                                <tr key={e.id} className="hover:bg-white/5 transition-colors">
                                  <td className="py-2 px-2.5 font-bold text-zinc-100">{e.id}</td>
                                  <td className="py-2 px-2 text-zinc-300">{e.timestamp}</td>
                                  <td className="py-2 px-2 text-rose-300 font-semibold">{e.event_type}</td>
                                  <td className="py-2 px-2 text-zinc-300">{e.confidence.toFixed(2)}</td>
                                  <td className="py-2 px-2">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                        e.status === 'confirmed'
                                          ? 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                                          : e.status === 'pending'
                                          ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                                          : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                                      }`}
                                    >
                                      {e.status}
                                    </span>
                                  </td>
                                  <td className="py-1.5 px-2.5 whitespace-nowrap">
                                    <button
                                      type="button"
                                      onClick={() => handleReviewEventClip(e)}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white text-[10px] font-semibold transition-all cursor-pointer shadow-sm group"
                                      title={lang === 'th' ? `ดูไฮไลต์ย้อนหลัง 10 วินาที (${e.video_path})` : `Watch 10-second highlight clip (${e.video_path})`}
                                    >
                                      <Play className="w-2.5 h-2.5 fill-cyan-400 text-cyan-400 group-hover:scale-110 transition-transform" />
                                      <span>{lang === 'th' ? 'ดูไฮไลต์ย้อนหลัง' : 'Review 10s'}</span>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Table 2: AUDIT_LOGS */}
                    {selectedDbTable === 'AUDIT_LOGS' && (
                      <div className="liquid-glass-card rounded-xl p-3.5 space-y-2 border border-white/10">
                        <div className="flex items-center justify-between pb-2 border-b border-white/5 text-xs">
                          <span className="font-mono text-cyan-300 font-bold tracking-tight">
                            TABLE: AUDIT_LOGS ({dbAuditLogs.length} entries)
                          </span>
                          <span className="text-[11px] font-mono text-zinc-500">Diagram 4 & 5</span>
                        </div>

                        {/* Scroll Container */}
                        <div className="overflow-y-auto overflow-x-auto max-h-[195px] scrollbar-log-visible pr-1 rounded-lg border border-white/5 bg-zinc-950/40">
                          <table className="w-full text-left text-[11px] font-mono">
                            <thead className="sticky top-0 bg-[#0d121f] z-10 shadow-sm">
                              <tr className="border-b border-white/10 text-zinc-400 uppercase text-[9px]">
                                <th className="py-2 px-2.5 bg-[#0d121f]">ID</th>
                                <th className="py-2 px-2 bg-[#0d121f]">USER</th>
                                <th className="py-2 px-2 bg-[#0d121f]">ACTION</th>
                                <th className="py-2 px-2 bg-[#0d121f]">IP</th>
                                <th className="py-2 px-2 bg-[#0d121f]">TIMESTAMP</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-zinc-300">
                              {dbAuditLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                  <td className="py-2 px-2.5 font-bold text-zinc-100">{log.id}</td>
                                  <td className="py-2 px-2 text-cyan-300 font-semibold">{log.username}</td>
                                  <td className="py-2 px-2 text-zinc-200">{log.action}</td>
                                  <td className="py-2 px-2 text-zinc-400 font-mono">{log.ip_address}</td>
                                  <td className="py-2 px-2 text-zinc-400">{log.timestamp}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Table 3: USERS */}
                    {selectedDbTable === 'USERS' && (
                      <div className="liquid-glass-card rounded-xl p-3.5 space-y-2 border border-white/10">
                        <div className="flex items-center justify-between pb-2 border-b border-white/5 text-xs">
                          <span className="font-mono text-cyan-300 font-bold tracking-tight">
                            TABLE: USERS ({dbUsers.length} proctors)
                          </span>
                          <span className="text-[11px] font-mono text-zinc-500">Diagram 5</span>
                        </div>

                        {/* Scroll Container */}
                        <div className="overflow-y-auto overflow-x-auto max-h-[195px] scrollbar-log-visible pr-1 rounded-lg border border-white/5 bg-zinc-950/40">
                          <table className="w-full text-left text-[11px] font-mono">
                            <thead className="sticky top-0 bg-[#0d121f] z-10 shadow-sm">
                              <tr className="border-b border-white/10 text-zinc-400 uppercase text-[9px]">
                                <th className="py-2 px-2.5 bg-[#0d121f]">ID</th>
                                <th className="py-2 px-2 bg-[#0d121f]">USERNAME</th>
                                <th className="py-2 px-2 bg-[#0d121f]">EMAIL</th>
                                <th className="py-2 px-2 bg-[#0d121f]">ROLE</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-zinc-300">
                              {dbUsers.map((u) => (
                                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                  <td className="py-2 px-2.5 font-bold text-zinc-100">{u.id}</td>
                                  <td className="py-2 px-2 text-white font-semibold">{u.username}</td>
                                  <td className="py-2 px-2 text-zinc-400">{u.email}</td>
                                  <td className="py-2 px-2">
                                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-cyan-300 text-[10px] font-semibold border border-zinc-700">
                                      {u.role}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* VIEW B: Microservices Grid */}
                {logViewMode === 'microservices' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[250px] overflow-y-auto scrollbar-log-visible pr-1">
                    {services.map((svc) => (
                      <div key={svc.id} className="p-3.5 rounded-xl liquid-glass-card border border-white/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-xs font-bold text-zinc-100">{svc.name}</span>
                          </div>
                          <span className="font-mono text-[11px] text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                            :{svc.port}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-tight">{svc.description}</p>
                        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-zinc-400">
                          <span>Latency: <strong className="text-emerald-300">{svc.latencyMs}ms</strong></span>
                          <span>Uptime: <strong className="text-zinc-200">{Math.floor(svc.uptimeSec / 60)}m</strong></span>
                          <span>Requests: <strong className="text-cyan-300">{svc.requestCount}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-white/10 bg-zinc-950/40">
          <button
            onClick={() => {
              playActionBlip('click');
              onClose();
            }}
            className="px-5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
