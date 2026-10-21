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
import { eventBus } from './services/eventBus';
import { playActionBlip } from './utils/audio';

export default function App() {
  const [sessions, setSessions] = useState<ExamSession[]>(INITIAL_SESSIONS);
  const [currentSession, setCurrentSession] = useState<ExamSession>(INITIAL_SESSIONS[0]);
  const [cameras, setCameras] = useState<CameraFeed[]>(INITIAL_CAMERAS);
  const [alerts, setAlerts] = useState<IncidentAlert[]>(INITIAL_ALERTS);

  // Modals and Drawer state
  const [selectedReviewAlert, setSelectedReviewAlert] = useState<IncidentAlert | null>(null);
  const [expandedCamera, setExpandedCamera] = useState<CameraFeed | null>(null);
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);
  const [isTopologyOpen, setIsTopologyOpen] = useState(false);
  const [kpiFilterStatus, setKpiFilterStatus] = useState<AlertStatus | 'all'>('all');

  // Handle confirming violation (syncs with SQLite CHEATING_EVENTS & AUDIT_LOGS)
  const handleConfirmViolation = (alertId: string, note?: string) => {
    const numericId = parseInt(alertId.replace(/\D/g, '')) || 1042;
    databaseService.updateEventStatus(
      numericId,
      'confirmed',
      'tuna',
      note || 'Confirmed cheating violation via 10-second highlight video review.'
    );

    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId
          ? {
              ...a,
              status: 'confirmed',
              proctorNote: note || a.proctorNote || 'Violation verified and confirmed by chief proctor (tuna).',
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
      'tuna',
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
      description: `Manual inspection flag initiated by proctor (tuna): examinee at ${student.seat} observed showing irregular posture.`,
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
      user_id: 2,
      username: 'tuna',
      action: 'REVIEW_EVENT',
      ip_address: '10.114.70.15',
      details: `Manual flag registered for ${student.name} (${student.seat}) on ${feed.name}`,
    });

    setAlerts((prev) => [manualAlert, ...prev]);
    setExpandedCamera(null);
    playActionBlip('click');
  };

  return (
    <div className="min-h-screen bg-[#080a11] text-zinc-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-x-hidden">
      {/* Ambient background refraction meshes */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] rounded-full pointer-events-none ambient-glow-cyan opacity-40 blur-3xl -z-10" />
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] rounded-full pointer-events-none ambient-glow-rose opacity-30 blur-3xl -z-10" />

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
        onlineCameraCount={cameras.filter((c) => c.status === 'online').length}
        totalCameraCount={cameras.length}
      />

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
            />
          </div>
        </div>

        {/* 4. Bottom Section: Incident History & SQLite Table */}
        <IncidentTable
          alerts={alerts}
          currentSession={currentSession}
          onReviewClip={(alert) => setSelectedReviewAlert(alert)}
          onConfirmViolation={handleConfirmViolation}
          onDismissAlert={handleDismissAlert}
        />
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
              onClick={() => setIsTopologyOpen(true)}
              className="text-cyan-300 hover:text-white underline underline-offset-2 transition-colors"
            >
              Open Architecture Inspector
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
    </div>
  );
}
