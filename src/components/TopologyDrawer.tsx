import React, { useState, useEffect } from 'react';
import { 
  X, 
  Server, 
  Database, 
  Cpu, 
  Wifi, 
  Activity, 
  Shield, 
  Video, 
  Layers, 
  RefreshCw,
  ExternalLink,
  Table,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';
import { gatewayService } from '../services/gateway';
import { databaseService } from '../services/databaseService';
import { MicroserviceNode, CheatingEventRecord, AuditLogRecord, UserRecord } from '../services/types';
import { eventBus } from '../services/eventBus';
import { playActionBlip } from '../utils/audio';

interface TopologyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TopologyDrawer: React.FC<TopologyDrawerProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'topology' | 'database'>('topology');
  const [selectedDbTable, setSelectedDbTable] = useState<'CHEATING_EVENTS' | 'AUDIT_LOGS' | 'USERS'>('CHEATING_EVENTS');
  const [services, setServices] = useState<MicroserviceNode[]>(gatewayService.getServices());
  const [events, setEvents] = useState<CheatingEventRecord[]>(databaseService.getCheatingEvents());
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>(databaseService.getAuditLogs());
  const [users, setUsers] = useState<UserRecord[]>(databaseService.getUsers());

  // Listen to live database and telemetry mutations
  useEffect(() => {
    const unsubTelemetry = eventBus.on<MicroserviceNode[]>('GATEWAY_TELEMETRY_UPDATED', (data) => {
      if (data) setServices([...data]);
    });
    const unsubEvents = eventBus.on('EVENT_CREATED', () => {
      setEvents(databaseService.getCheatingEvents());
    });
    const unsubEventUpdate = eventBus.on('EVENT_UPDATED', () => {
      setEvents(databaseService.getCheatingEvents());
      setAuditLogs(databaseService.getAuditLogs());
    });
    const unsubAudit = eventBus.on('AUDIT_LOG_ADDED', () => {
      setAuditLogs(databaseService.getAuditLogs());
    });

    const interval = setInterval(() => {
      gatewayService.tickTelemetry();
    }, 2500);

    return () => {
      unsubTelemetry();
      unsubEvents();
      unsubEventUpdate();
      unsubAudit();
      clearInterval(interval);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl h-full liquid-glass-modal flex flex-col shadow-2xl border-l border-white/10 animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-zinc-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Microservices & Database Topology
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Cluster Healthy
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Raspberry Pi 5 Edge Device · IP: 10.114.70.249
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                gatewayService.tickTelemetry();
                setEvents(databaseService.getCheatingEvents());
                setAuditLogs(databaseService.getAuditLogs());
                playActionBlip('click');
              }}
              className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
              title="Refresh Telemetry"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-white/5 text-xs">
          <button
            onClick={() => setActiveTab('topology')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'topology'
                ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Microservices Grid (Ports 8000-8003)</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeTab === 'database'
                ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>SQLite Schema (exam_proctor.db)</span>
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeTab === 'topology' ? (
            <div className="space-y-4">
              {/* Edge Physical Hardware Card (Diagram 1) */}
              <div className="liquid-glass-card rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-zinc-100">Physical Edge Network</span>
                  </div>
                  <span className="font-mono text-[11px] text-zinc-400">Wi-Fi Router IP: 10.114.70.249</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                  <div className="p-2 rounded-lg bg-zinc-950/50 border border-white/5">
                    <span className="text-[10px] text-zinc-500 block">Host Device</span>
                    <span className="font-bold text-zinc-200">Raspberry Pi 5</span>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-950/50 border border-white/5">
                    <span className="text-[10px] text-zinc-500 block">Camera Hardware</span>
                    <span className="font-bold text-zinc-200">MERCUSYS MC210</span>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-950/50 border border-white/5">
                    <span className="text-[10px] text-zinc-500 block">Continuous Stream</span>
                    <span className="font-bold text-cyan-400">RTSP 554 / ONVIF</span>
                  </div>
                </div>
              </div>

              {/* Service Cards (Diagram 2) */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Active Microservices Subsystem
                </span>

                {services.map((svc) => (
                  <div
                    key={svc.id}
                    className="liquid-glass-card rounded-xl p-3.5 hover:border-cyan-500/30 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-100 text-xs">{svc.name}</span>
                        <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-700 text-cyan-300">
                          Port {svc.port}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500 bg-zinc-950 px-1.5 py-0.2 rounded">
                          {svc.protocol}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 font-mono text-[11px] tabular-nums">
                        <span className="text-emerald-400">{svc.latencyMs} ms</span>
                        <span className="text-zinc-600">|</span>
                        <span className="text-zinc-400">{svc.requestCount} reqs</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      {svc.description}
                    </p>

                    <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-white/5">
                      <span className="text-[10px] text-zinc-500 font-mono">Endpoints:</span>
                      {svc.endpoints.map((ep) => (
                        <span
                          key={ep}
                          className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-zinc-950/80 border border-white/5 text-zinc-300"
                        >
                          {ep}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Database Table Selectors */}
              <div className="flex items-center gap-1 p-1 bg-zinc-950/60 rounded-xl border border-white/10 text-xs">
                {(['CHEATING_EVENTS', 'AUDIT_LOGS', 'USERS'] as const).map((table) => (
                  <button
                    key={table}
                    onClick={() => {
                      setSelectedDbTable(table);
                      playActionBlip('click');
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-mono font-medium transition-colors text-center ${
                      selectedDbTable === table
                        ? 'bg-zinc-800 text-cyan-300 shadow-sm border border-zinc-700'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {table}
                  </button>
                ))}
              </div>

              {/* Table Renderings */}
              {selectedDbTable === 'CHEATING_EVENTS' && (
                <div className="liquid-glass-card rounded-xl p-3 overflow-x-auto space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-white/5 text-xs">
                    <span className="font-mono text-cyan-300 font-bold">
                      TABLE: CHEATING_EVENTS ({events.length} records)
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500">Diagram 5</span>
                  </div>
                  <table className="w-full text-left text-[11px] font-mono">
                    <thead>
                      <tr className="border-b border-white/10 text-zinc-500 uppercase text-[9px]">
                        <th className="py-1 px-2">id</th>
                        <th className="py-1 px-2">timestamp</th>
                        <th className="py-1 px-2">event_type</th>
                        <th className="py-1 px-2">conf</th>
                        <th className="py-1 px-2">status</th>
                        <th className="py-1 px-2">video_path</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-zinc-300">
                      {events.map((e) => (
                        <tr key={e.id} className="hover:bg-white/5">
                          <td className="py-1.5 px-2 font-bold">{e.id}</td>
                          <td className="py-1.5 px-2">{e.timestamp}</td>
                          <td className="py-1.5 px-2 text-rose-300">{e.event_type}</td>
                          <td className="py-1.5 px-2">{e.confidence}</td>
                          <td className="py-1.5 px-2">
                            <span
                              className={`px-1 rounded text-[10px] ${
                                e.status === 'confirmed'
                                  ? 'bg-rose-950 text-rose-300'
                                  : e.status === 'pending'
                                  ? 'bg-amber-950 text-amber-300'
                                  : 'bg-emerald-950 text-emerald-300'
                              }`}
                            >
                              {e.status}
                            </span>
                          </td>
                          <td className="py-1.5 px-2 text-zinc-500 truncate max-w-[120px]">{e.video_path}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {selectedDbTable === 'AUDIT_LOGS' && (
                <div className="liquid-glass-card rounded-xl p-3 overflow-x-auto space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-white/5 text-xs">
                    <span className="font-mono text-cyan-300 font-bold">
                      TABLE: AUDIT_LOGS ({auditLogs.length} entries)
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500">Diagram 4 & 5</span>
                  </div>
                  <table className="w-full text-left text-[11px] font-mono">
                    <thead>
                      <tr className="border-b border-white/10 text-zinc-500 uppercase text-[9px]">
                        <th className="py-1 px-2">id</th>
                        <th className="py-1 px-2">user</th>
                        <th className="py-1 px-2">action</th>
                        <th className="py-1 px-2">ip</th>
                        <th className="py-1 px-2">timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-zinc-300">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-white/5">
                          <td className="py-1.5 px-2 font-bold">{log.id}</td>
                          <td className="py-1.5 px-2 text-cyan-300">{log.username}</td>
                          <td className="py-1.5 px-2 text-zinc-200">{log.action}</td>
                          <td className="py-1.5 px-2 text-zinc-500">{log.ip_address}</td>
                          <td className="py-1.5 px-2 text-zinc-400">{log.timestamp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {selectedDbTable === 'USERS' && (
                <div className="liquid-glass-card rounded-xl p-3 overflow-x-auto space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-white/5 text-xs">
                    <span className="font-mono text-cyan-300 font-bold">
                      TABLE: USERS ({users.length} proctors)
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500">Diagram 5</span>
                  </div>
                  <table className="w-full text-left text-[11px] font-mono">
                    <thead>
                      <tr className="border-b border-white/10 text-zinc-500 uppercase text-[9px]">
                        <th className="py-1 px-2">id</th>
                        <th className="py-1 px-2">username</th>
                        <th className="py-1 px-2">email</th>
                        <th className="py-1 px-2">role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-zinc-300">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-white/5">
                          <td className="py-1.5 px-2 font-bold">{u.id}</td>
                          <td className="py-1.5 px-2 text-white">{u.username}</td>
                          <td className="py-1.5 px-2 text-zinc-400">{u.email}</td>
                          <td className="py-1.5 px-2">
                            <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-cyan-300 text-[10px]">
                              {u.role}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
