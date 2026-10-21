import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ChevronDown, 
  Bell, 
  Volume2, 
  VolumeX, 
  Video, 
  Server,
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  ExternalLink,
  Cpu
} from 'lucide-react';
import { ExamSession, IncidentAlert } from '../types/proctor';
import { getSoundMuted, setSoundMuted, playActionBlip } from '../utils/audio';

interface NavbarProps {
  currentSession: ExamSession;
  allSessions: ExamSession[];
  onSelectSession: (session: ExamSession) => void;
  alerts: IncidentAlert[];
  onSelectAlert: (alert: IncidentAlert) => void;
  onOpenSimulateModal: () => void;
  onOpenTopologyDrawer: () => void;
  onlineCameraCount: number;
  totalCameraCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentSession,
  allSessions,
  onSelectSession,
  alerts,
  onSelectAlert,
  onOpenSimulateModal,
  onOpenTopologyDrawer,
  onlineCameraCount,
  totalCameraCount,
}) => {
  const [sessionDropdownOpen, setSessionDropdownOpen] = useState(false);
  const [bellDropdownOpen, setBellDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isMuted, setIsMutedState] = useState(getSoundMuted());
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const pendingAlerts = alerts.filter((a) => a.status === 'pending');

  const toggleMute = () => {
    const next = !isMuted;
    setSoundMuted(next);
    setIsMutedState(next);
    playActionBlip('click');
  };

  return (
    <header className="sticky top-0 z-40 w-full liquid-glass border-b border-white/10 px-4 lg:px-6 py-2.5">
      <div className="flex items-center justify-between gap-4 max-w-[1800px] mx-auto">
        {/* Left: Brand & Architecture Badges */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 shadow-inner">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
                ExamGuard AI
              </span>
              <span className="hidden sm:inline-block text-[10px] text-cyan-300 font-mono bg-cyan-950/70 border border-cyan-500/30 px-1.5 py-0.2 rounded">
                Microservices v2.6
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden md:block">
              Raspberry Pi 5 Edge · CiRA CORE YOLO · ONVIF PTZ
            </p>
          </div>
        </div>

        {/* Center: Exam Session Selector & Status Badges */}
        <div className="flex items-center gap-3">
          {/* Session Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setSessionDropdownOpen(!sessionDropdownOpen);
                setBellDropdownOpen(false);
                setProfileDropdownOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl liquid-glass hover:border-cyan-500/40 text-xs text-zinc-200 font-medium transition-all"
            >
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="font-semibold text-zinc-100">{currentSession.room}:</span>
              <span className="max-w-[130px] sm:max-w-[200px] md:max-w-[260px] truncate text-zinc-300">
                {currentSession.title}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            </button>

            {sessionDropdownOpen && (
              <div className="absolute left-0 mt-2 w-80 rounded-2xl liquid-glass-modal p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Active Examination Sessions
                </div>
                <div className="space-y-1">
                  {allSessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => {
                        onSelectSession(session);
                        setSessionDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl transition-colors flex items-start justify-between ${
                        session.id === currentSession.id
                          ? 'bg-cyan-950/70 border border-cyan-500/50 text-cyan-200'
                          : 'hover:bg-white/5 text-zinc-300'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5">
                          <span>{session.room}</span>
                          <span className="text-zinc-500">·</span>
                          <span className="text-zinc-400 font-mono text-[11px]">{session.code}</span>
                        </div>
                        <div className="text-xs text-zinc-400 truncate mt-0.5">{session.title}</div>
                        <div className="text-[11px] text-zinc-500 mt-1 flex items-center gap-2">
                          <span>{session.totalStudents} examinees</span>
                          <span>·</span>
                          <span>{session.startTime} - {session.endTime}</span>
                        </div>
                      </div>
                      {session.id === currentSession.id && (
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Microservices Topology Drawer Trigger Button */}
          <button
            onClick={() => {
              playActionBlip('click');
              onOpenTopologyDrawer();
            }}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl liquid-glass hover:border-cyan-500/40 text-xs font-medium text-cyan-300 transition-colors"
            title="Inspect Microservices (Ports 8000-8003) and SQLite database"
          >
            <Server className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline">Architecture & DB</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              Ports 8000-8003
            </span>
          </button>
        </div>

        {/* Right: Quick Actions, Notification Bell & Profile */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Simulation Trigger */}
          <button
            onClick={onOpenSimulateModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl liquid-glass hover:border-amber-500/40 text-zinc-200 transition-colors"
            title="Inject simulated anomaly to test detection pipeline"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Test Anomaly</span>
          </button>

          {/* Audio Chime Mute Toggle */}
          <button
            onClick={toggleMute}
            className={`p-2 rounded-xl border transition-colors ${
              isMuted
                ? 'liquid-glass text-zinc-500 hover:text-zinc-400'
                : 'liquid-glass text-cyan-400 hover:border-cyan-500/40'
            }`}
            title={isMuted ? 'Unmute Audio Alert Chimes' : 'Mute Audio Alert Chimes'}
            aria-label="Toggle Alert Audio"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Bell Notification with unread badge */}
          <div className="relative">
            <button
              onClick={() => {
                setBellDropdownOpen(!bellDropdownOpen);
                setSessionDropdownOpen(false);
                setProfileDropdownOpen(false);
              }}
              className="relative p-2 rounded-xl liquid-glass text-zinc-300 hover:text-white hover:border-white/20 transition-colors"
              title="Recent Cheating Alerts"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {pendingAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-600 rounded-full ring-2 ring-zinc-950 shadow-md">
                  {pendingAlerts.length}
                </span>
              )}
            </button>

            {bellDropdownOpen && (
              <div className="absolute right-0 mt-2 w-88 rounded-2xl liquid-glass-modal p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2.5 border-b border-white/10 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-200">Pending Alerts</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-500/30">
                      {pendingAlerts.length} Urgent
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-400 font-mono">WS Hub 8000</span>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {alerts.slice(0, 5).map((alert) => (
                    <div
                      key={alert.id}
                      onClick={() => {
                        onSelectAlert(alert);
                        setBellDropdownOpen(false);
                      }}
                      className="p-2.5 rounded-xl liquid-glass-card hover:border-cyan-500/40 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-100">{alert.studentName}</span>
                        <span className="font-mono text-[11px] text-zinc-400">{alert.timestamp}</span>
                      </div>
                      <div className="text-[11px] text-rose-300 font-medium mt-0.5 truncate">
                        {alert.incidentType}
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-1 flex items-center justify-between">
                        <span>{alert.seatNumber} · {alert.cameraName}</span>
                        <span className="text-cyan-400 flex items-center gap-1 font-medium">
                          Review 10s Clip <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Admin Profile Avatar (Diagram 5: USERS table user 'tuna' or 'K. Reynolds') */}
          <div className="relative">
            <button
              onClick={() => {
                setProfileDropdownOpen(!profileDropdownOpen);
                setSessionDropdownOpen(false);
                setBellDropdownOpen(false);
              }}
              className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl liquid-glass hover:border-white/20 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white text-xs font-bold shadow-md">
                TU
              </div>
              <div className="text-left hidden xl:block">
                <div className="text-xs font-semibold text-zinc-100 leading-tight">
                  tuna (Proctor)
                </div>
                <div className="text-[10px] text-zinc-400 font-mono leading-tight">
                  JWT Authenticated
                </div>
              </div>
              <ChevronDown className="w-3 h-3 text-zinc-400 hidden sm:block" />
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-68 rounded-2xl liquid-glass-modal p-4 z-50">
                <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                  <div className="w-10 h-10 rounded-xl bg-cyan-700 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    TU
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-100">tuna (ID: 2)</div>
                    <div className="text-[11px] text-zinc-400">Chief Examination Proctor</div>
                    <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active Session
                    </div>
                  </div>
                </div>
                <div className="py-2.5 text-xs space-y-1.5 text-zinc-300 font-mono">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Auth Token:</span>
                    <span className="text-cyan-300">JWT (Port 8001)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Node IP:</span>
                    <span className="text-zinc-300">10.114.70.15</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-white/10">
                  <button
                    onClick={() => {
                      onOpenTopologyDrawer();
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full py-1.5 text-center text-xs font-medium text-cyan-300 hover:text-cyan-200 transition-colors"
                  >
                    View Audit Logs & Topology →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
