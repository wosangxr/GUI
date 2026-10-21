import React from 'react';
import { Users, AlertTriangle, ShieldAlert, Activity, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { ExamSession, IncidentAlert } from '../types/proctor';

interface KpiMetricsProps {
  session: ExamSession;
  alerts: IncidentAlert[];
  onFilterByStatus?: (status: 'all' | 'pending' | 'critical') => void;
}

export const KpiMetrics: React.FC<KpiMetricsProps> = ({ session, alerts, onFilterByStatus }) => {
  const totalAlerts = alerts.length;
  const criticalPending = alerts.filter(
    (a) => a.severity === 'critical' && a.status === 'pending'
  ).length;
  const allPending = alerts.filter((a) => a.status === 'pending').length;
  const confirmedViolations = alerts.filter((a) => a.status === 'confirmed').length;

  const calculatedIntegrity = Math.max(
    82,
    Number((100 - (confirmedViolations * 2.2 + allPending * 0.8)).toFixed(1))
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-4">
      {/* 1. Total Examinees */}
      <div className="p-4 rounded-xl liquid-glass-card relative overflow-hidden group hover:border-cyan-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">Total Examinees</span>
          <div className="p-2 rounded-xl bg-cyan-950/70 border border-cyan-500/30 text-cyan-400 shadow-inner">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-2xl lg:text-3xl font-bold font-mono tracking-tight text-white tabular-nums">
            {session.totalStudents}
          </span>
          <span className="text-xs text-zinc-500 font-medium">Students</span>
        </div>
        <div className="mt-2.5 flex items-center justify-between text-xs border-t border-white/5 pt-2 text-zinc-400">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>45 Present · 100% Attendance</span>
          </div>
          <span className="text-zinc-500 font-mono text-[11px]">{session.room}</span>
        </div>
      </div>

      {/* 2. Total Alerts Detected */}
      <div 
        onClick={() => onFilterByStatus?.('all')}
        className="p-4 rounded-xl liquid-glass-card relative overflow-hidden group hover:border-amber-500/40 cursor-pointer transition-all"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">Total Alerts Detected</span>
          <div className="p-2 rounded-xl bg-amber-950/70 border border-amber-500/30 text-amber-400 shadow-inner">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-2xl lg:text-3xl font-bold font-mono tracking-tight text-amber-300 tabular-nums">
            {totalAlerts}
          </span>
          <span className="text-xs text-amber-500/80 font-medium">incidents</span>
        </div>
        <div className="mt-2.5 flex items-center justify-between text-xs border-t border-white/5 pt-2 text-zinc-400">
          <span className="text-zinc-400">
            <strong className="text-zinc-200">{confirmedViolations}</strong> confirmed ·{' '}
            <strong className="text-zinc-200">{allPending}</strong> under review
          </span>
          <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-amber-400 transition-colors" />
        </div>
      </div>

      {/* 3. Critical Flags Pending Review */}
      <div 
        onClick={() => onFilterByStatus?.('critical')}
        className="p-4 rounded-xl liquid-glass-card relative overflow-hidden group hover:border-rose-500/40 cursor-pointer transition-all"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">Critical Flags Pending</span>
          <div className="p-2 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-400 shadow-inner">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-2xl lg:text-3xl font-bold font-mono tracking-tight text-rose-400 tabular-nums">
            {criticalPending}
          </span>
          <span className="text-xs text-rose-400/90 font-medium">cases pending</span>
        </div>
        <div className="mt-2.5 flex items-center justify-between text-xs border-t border-white/5 pt-2">
          <span className="text-rose-400/90 font-medium">
            Requires Proctor Review
          </span>
          <span className="text-[11px] font-mono text-zinc-500">Seat B-04, C-02</span>
        </div>
      </div>

      {/* 4. Average Room Integrity Score */}
      <div className="p-4 rounded-xl liquid-glass-card relative overflow-hidden group hover:border-emerald-500/40 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">Room Integrity Score</span>
          <div className="p-2 rounded-xl bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 shadow-inner">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-2xl lg:text-3xl font-bold font-mono tracking-tight text-emerald-400 tabular-nums">
            {calculatedIntegrity}%
          </span>
          <span className="text-xs text-emerald-500/80 font-medium">Nominal Trust</span>
        </div>
        <div className="mt-2.5 flex items-center justify-between text-xs border-t border-white/5 pt-2 text-zinc-400">
          <div className="w-full flex items-center gap-2">
            <div className="flex-1 bg-zinc-900 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500 shadow-[0_0_8px_#10b981]" 
                style={{ width: `${calculatedIntegrity}%` }}
              />
            </div>
            <span className="text-[11px] font-mono text-emerald-400 tabular-nums">
              High Confidence
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
