import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { KpiMetrics } from './components/KpiMetrics';
import { CameraGrid } from './components/CameraGrid';
import { AlertFeed } from './components/AlertFeed';
import { IncidentTable } from './components/IncidentTable';
import { EvidencePlayerModal } from './components/EvidencePlayerModal';
import { ExpandedCameraModal } from './components/ExpandedCameraModal';
import { SimulateAnomalyModal } from './components/SimulateAnomalyModal';
import { TopologyDrawer } from './components/TopologyDrawer';
import { MainSettingsModal } from './components/MainSettingsModal';
import { LoginModal } from './components/LoginModal';

import { 
  CameraFeed, 
  ExamSession, 
  IncidentAlert, 
  StudentInFeed, 
  AlertStatus 
} from './types/proctor';
import { 
  INITIAL_SESSIONS, 
  INITIAL_CAMERAS, 
  INITIAL_ALERTS 
} from './data/mockData';
import { databaseService } from './services/databaseService';
import { UserRecord } from './services/types';
import { eventBus } from './services/eventBus';
import { playActionBlip } from './utils/audio';

export default function App() {
  const [sessions, setSessions] = useState<ExamSession[]>(INITIAL_SESSIONS);
  const [currentSession, setCurrentSession] = useState<ExamSession>(INITIAL_SESSIONS[0]);
  const [cameras, setCameras] = useState<CameraFeed[]>(INITIAL_CAMERAS);
  const [alerts, setAlerts] = useState<IncidentAlert[]>(INITIAL_ALERTS);

  // Authentication & RBAC User State (Stored in localStorage, default to admin if first run)
  const [currentUser, setCurrentUser] = useState<UserRecord | null>(() => {
    const saved = localStorage.getItem('examguard_logged_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.username) return parsed;
      } catch {}
    }
    const users = databaseService.getUsers();
    const admin = users.find((u) => u.role === 'admin') || users[0] || null;
    if (admin) {
      localStorage.setItem('examguard_logged_user', JSON.stringify(admin));
    }
    return admin;
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Handle Logout (Sign out completely - terminates session and locks console behind login gate)
  const handleLogout = () => {
    if (currentUser) {
      databaseService.addAuditLog({
        user_id: currentUser.id,
        username: currentUser.username,
        action: 'LOGOUT',
        ip_address: '10.114.70.15',
        details: `User '${currentUser.username}' logged out of ExamGuard proctor console`,
      });
    }
    localStorage.removeItem('examguard_logged_user');
    setCurrentUser(null);
    setIsLoginModalOpen(false);
    setIsMainSettingsOpen(false);
    setSelectedReviewAlert(null);
    setExpandedCamera(null);
    playActionBlip('click');

    try {
      (window as any).google?.accounts?.id?.disableAutoSelect?.();
    } catch {}
  };

  // Handle Switch Account (Signs out current user immediately and locks console behind login gate)
  const handleSwitchAccount = () => {
    if (currentUser) {
      databaseService.addAuditLog({
        user_id: currentUser.id,
        username: currentUser.username,
        action: 'SWITCH_ACCOUNT_LOGOUT',
        ip_address: '10.114.70.15',
        details: `User '${currentUser.username}' initiated account switch - active session terminated immediately`,
      });
    }
    localStorage.removeItem('examguard_logged_user');
    setCurrentUser(null);
    setIsLoginModalOpen(false);
    setIsMainSettingsOpen(false);
    setSelectedReviewAlert(null);
    setExpandedCamera(null);
    playActionBlip('click');

    try {
      (window as any).google?.accounts?.id?.disableAutoSelect?.();
    } catch {}
  };

  // Handle Login or Switch Success
  const handleLoginSuccess = (user: UserRecord) => {
    const prevUser = currentUser?.username;
    setCurrentUser(user);
    localStorage.setItem('examguard_logged_user', JSON.stringify(user));
    setIsLoginModalOpen(false);
    playActionBlip('confirm');

    if (prevUser && prevUser !== user.username) {
      databaseService.addAuditLog({
        user_id: user.id,
        username: user.username,
        action: 'SWITCH_ACCOUNT',
        ip_address: '10.114.70.15',
        details: `Switched active proctor account from '${prevUser}' to '${user.username}' (${user.role})`,
      });
    }
  };

  // Modals and Drawer state
  const [selectedReviewAlert, setSelectedReviewAlert] = useState<IncidentAlert | null>(null);
  const [expandedCamera, setExpandedCamera] = useState<CameraFeed | null>(null);
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);
  const [isTopologyOpen, setIsTopologyOpen] = useState(false);
  const [isMainSettingsOpen, setIsMainSettingsOpen] = useState(false);
  const [mainSettingsTab, setMainSettingsTab] = useState<string | undefined>(undefined);
  const [lang, setLang] = useState<'en' | 'th'>('th'); // Default to Thai for smooth user experience
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [kpiFilterStatus, setKpiFilterStatus] = useState<AlertStatus | 'all'>('all');

  // Prevent background scrolling when any modal or drawer is open
  const isAnyModalOpen =
    isMainSettingsOpen ||
    isLoginModalOpen ||
    Boolean(selectedReviewAlert) ||
    Boolean(expandedCamera) ||
    isSimulateOpen ||
    isTopologyOpen;

  useEffect(() => {
    if (isAnyModalOpen) {
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isAnyModalOpen]);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  }, [theme]);

  // Handle confirming violation (syncs with SQLite CHEATING_EVENTS & AUDIT_LOGS)
  const handleConfirmViolation = (alertId: string, note?: string) => {
    const numericId = parseInt(alertId.replace(/\D/g, '')) || 1042;
    databaseService.updateEventStatus(
      numericId,
      'confirmed',
      currentUser.username,
      note || 'Confirmed cheating violation via 10-second highlight video review.'
    );

    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId
          ? {
              ...a,
              status: 'confirmed',
              proctorNote: note || a.proctorNote || `Violation verified and confirmed by proctor (${currentUser.username}).`,
            }
          : a
      )
    );
  };

  // Handle dismissing alert as false alarm
  const handleDismissAlert = (alertId: string, note?: string) => {
    const numericId = parseInt(alertId.replace(/\D/g, '')) || 1042;
    databaseService.updateEventStatus(
      numericId,
      'false_alarm',
      currentUser.username,
      note || 'Dismissed as benign examinee posture or paper movement.'
    );

    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId
          ? {
              ...a,
              status: 'dismissed',
              proctorNote: note || a.proctorNote || 'Dismissed as false alarm in SQLite audit ledger.',
            }
          : a
      )
    );
  };

  // Handle simulating a live anomaly
  const handleTriggerAnomaly = (
    newAlert: IncidentAlert,
    targetCameraId: string,
    studentId: string
  ) => {
    setAlerts((prev) => [newAlert, ...prev]);

    setCameras((prev) =>
      prev.map((cam) => {
        if (cam.id === targetCameraId) {
          return {
            ...cam,
            activeAlertCount: cam.activeAlertCount + 1,
            students: cam.students.map((stu) =>
              stu.id === studentId ? { ...stu, status: 'flagged' } : stu
            ),
          };
        }
        return cam;
      })
    );
  };

  // Handle manually flagging a student from expanded camera modal
  const handleFlagStudentFromCamera = (student: StudentInFeed, feed: CameraFeed) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    const manualAlert: IncidentAlert = {
      id: `alt-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: timeStr,
      rawTime: now,
      sessionId: currentSession.id,
      cameraId: feed.id,
      cameraName: feed.name,
      studentId: student.id,
      studentName: student.name,
      seatNumber: student.seat,
      incidentType: 'Suspicious Head Turning',
      severity: 'warning',
      confidence: 86,
      status: 'pending',
      description: `Manual inspection flag initiated by proctor (${currentUser.username}): examinee at ${student.seat} observed showing irregular posture.`,
      aiRationale: 'Proctor-initiated manual camera inspection flag logged into SQLite audit ledger.',
      telemetry: {
        gazePitch: -15,
        gazeYaw: 35,
        durationSeconds: 10.0,
        headRotationDeg: 35,
      },
      evidenceClip: {
        durationSec: 10,
        keyframeSec: 5,
        clipName: `MANUAL_${student.seat.replace('-', '')}_10S_CLIP.mp4`,
        detectedBoundingBox: {
          x: 35,
          y: 40,
          width: 25,
          height: 28,
          label: `MANUAL_FLAG [${student.seat}]`,
        },
      },
    };

    databaseService.addAuditLog({
      user_id: currentUser.id,
      username: currentUser.username,
      action: 'REVIEW_EVENT',
      ip_address: '10.114.70.15',
      details: `Manual flag registered for ${student.name} (${student.seat}) on ${feed.name}`,
    });

    setAlerts((prev) => [manualAlert, ...prev]);
    setExpandedCamera(null);
    playActionBlip('click');
  };

  // If user is signed out, lock the console completely behind the Login Gateway (ทำให้ออกจริงๆ)
  if (!currentUser) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center font-sans relative overflow-hidden select-none ${theme === 'light' ? 'bg-[#FFFFFF] text-slate-900' : 'bg-[#000000] text-zinc-100'}`}>
        <div className={`fixed top-0 left-1/4 w-[500px] h-[500px] rounded-full pointer-events-none ambient-glow-cyan blur-3xl -z-10 ${theme === 'light' ? 'opacity-15' : 'opacity-30'}`} />
        <div className={`fixed bottom-0 right-1/4 w-[600px] h-[600px] rounded-full pointer-events-none ambient-glow-rose blur-3xl -z-10 ${theme === 'light' ? 'opacity-10' : 'opacity-20'}`} />
        <LoginModal
          isOpen={true}
          canClose={false}
          onClose={() => {}}
          onLogin={handleLoginSuccess}
          lang={lang}
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-x-hidden ${theme === 'light' ? 'bg-[#FFFFFF] text-slate-900' : 'bg-[#000000] text-zinc-100'}`}>
      {/* Ambient background refraction meshes */}
      <div className={`fixed top-0 left-1/4 w-[500px] h-[500px] rounded-full pointer-events-none ambient-glow-cyan blur-3xl -z-10 ${theme === 'light' ? 'opacity-15' : 'opacity-40'}`} />
      <div className={`fixed bottom-0 right-1/4 w-[600px] h-[600px] rounded-full pointer-events-none ambient-glow-rose blur-3xl -z-10 ${theme === 'light' ? 'opacity-10' : 'opacity-30'}`} />

      {/* 1. Top Glass Navbar */}
      <Navbar
        currentSession={currentSession}
        allSessions={sessions}
        onSelectSession={(sess) => {
          setCurrentSession(sess);
          playActionBlip('click');
        }}
        alerts={alerts}
        onSelectAlert={(alert) => setSelectedReviewAlert(alert)}
        onOpenSimulateModal={() => setIsSimulateOpen(true)}
        onOpenTopologyDrawer={() => setIsTopologyOpen(true)}
        onOpenMainSettings={(tab?: string) => {
          setMainSettingsTab(tab);
          setIsMainSettingsOpen(true);
        }}
        lang={lang}
        onToggleLang={() => setLang((prev) => (prev === 'en' ? 'th' : 'en'))}
        onlineCameraCount={cameras.filter((c) => c.status === 'online').length}
        totalCameraCount={cameras.length}
        currentUser={currentUser}
        onOpenLoginModal={handleSwitchAccount}
        onLogout={handleLogout}
        onSwitchAccount={handleSwitchAccount}
      />

      {/* Fixed Navbar Spacer to ensure main content is never covered */}
      <div className="h-[58px] sm:h-[62px] w-full shrink-0" aria-hidden="true" />

      {/* Main Dashboard Body */}
      <main className="flex-1 p-3.5 sm:p-4 lg:p-6 max-w-[1800px] w-full mx-auto space-y-4">
        {/* 2. Summary Liquid Glass KPI Cards */}
        <KpiMetrics
          session={currentSession}
          alerts={alerts}
          onFilterByStatus={(status) => {
            if (status === 'critical') {
              setKpiFilterStatus('pending');
            } else {
              setKpiFilterStatus('all');
            }
            playActionBlip('click');
          }}
        />

        {/* 3. Main Center Split View (65% Cameras with PTZ | 35% Real-Time Alerts) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
          {/* Left Side (65% = 8 cols) */}
          <div className="xl:col-span-8 flex flex-col min-h-[580px]">
            <CameraGrid
              cameras={cameras}
              onExpandCamera={(cam) => setExpandedCamera(cam)}
              onManualFlag={(cam) => setExpandedCamera(cam)}
              onSimulateAnomaly={() => setIsSimulateOpen(true)}
            />
          </div>

          {/* Right Side (35% = 4 cols) */}
          <div className="xl:col-span-4 flex flex-col min-h-[580px]">
            <AlertFeed
              alerts={alerts}
              onReviewClip={(alert) => setSelectedReviewAlert(alert)}
              onConfirmViolation={handleConfirmViolation}
              onDismissAlert={handleDismissAlert}
              initialFilterStatus={kpiFilterStatus}
              currentUser={currentUser}
            />
          </div>
        </div>
      </main>

      {/* Modern Liquid Glass Footer with Real-Time Architecture Diagnostics */}
      <footer className="w-full liquid-glass border-t border-white/5 px-5 py-3 text-xs text-zinc-400">
        <div className="max-w-[1800px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-semibold text-zinc-200">ExamGuard AI System</span>
            <span>·</span>
            <span className="font-mono text-cyan-300">Gateway Port 8000</span>
            <span>·</span>
            <span className="font-mono text-zinc-400">Auth 8001 · Cam PTZ 8002 · Events 8003 · CiRA 9999</span>
          </div>
          <div className="flex items-center gap-3 text-zinc-400 font-mono text-[11px]">
            <span>SQLite: exam_proctor.db</span>
            <span>·</span>
            <button
              onClick={() => setIsMainSettingsOpen(true)}
              className="text-cyan-300 hover:text-white underline underline-offset-2 transition-colors cursor-pointer"
            >
              {lang === 'th' ? 'เปิดการตั้งค่าระบบ & ช่อง Log' : 'Open Settings & System Logs'}
            </button>
            <span>·</span>
            <span className="text-zinc-500">MERCUSYS MC210 ONVIF</span>
          </div>
        </div>
      </footer>

      {/* 10-Second Highlight Clip Evidence Replay Modal (Diagram 3) */}
      {selectedReviewAlert && (
        <EvidencePlayerModal
          alert={selectedReviewAlert}
          onClose={() => setSelectedReviewAlert(null)}
          onConfirmViolation={handleConfirmViolation}
          onDismissAlert={handleDismissAlert}
          currentUser={currentUser}
          lang={lang}
        />
      )}

      {/* Expanded Camera Modal with Full PTZ D-Pad (Diagram 4) */}
      {expandedCamera && (
        <ExpandedCameraModal
          feed={expandedCamera}
          onClose={() => setExpandedCamera(null)}
          onFlagStudent={handleFlagStudentFromCamera}
        />
      )}

      {/* Microservices & SQLite Database Topology Drawer (Diagram 2 & 5) */}
      <TopologyDrawer
        isOpen={isTopologyOpen}
        onClose={() => setIsTopologyOpen(false)}
      />

      {/* Simulate Cheating Anomaly Modal */}
      {isSimulateOpen && (
        <SimulateAnomalyModal
          cameras={cameras}
          onClose={() => setIsSimulateOpen(false)}
          onTriggerAnomaly={handleTriggerAnomaly}
        />
      )}

      {/* Comprehensive System Settings Modal (AI, Camera, Sessions, Reports, Alerts, Topology, Proctor Roles) */}
      <MainSettingsModal
        isOpen={isMainSettingsOpen}
        onClose={() => {
          setIsMainSettingsOpen(false);
          setMainSettingsTab(undefined);
        }}
        lang={lang}
        onToggleLang={() => setLang((prev) => (prev === 'en' ? 'th' : 'en'))}
        theme={theme}
        onSelectTheme={setTheme}
        sessions={sessions}
        currentSession={currentSession}
        onSelectSession={(sess) => {
          setCurrentSession(sess);
          playActionBlip('click');
        }}
        alerts={alerts}
        onReviewAlert={(alert) => setSelectedReviewAlert(alert)}
        onOpenTopology={() => {
          setIsMainSettingsOpen(false);
          setIsTopologyOpen(true);
        }}
        currentUser={currentUser}
        defaultTab={mainSettingsTab}
      />

      {/* RBAC Login & Account Switcher Modal (Terminates session on close/cancel) */}
      <LoginModal
        isOpen={isLoginModalOpen}
        canClose={false}
        onClose={handleLogout}
        onLogin={handleLoginSuccess}
        lang={lang}
      />
    </div>
  );
}
