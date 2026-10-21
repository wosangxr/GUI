import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Play, 
  Check, 
  X, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { IncidentAlert, IncidentType, ExamSession } from '../types/proctor';
import { exportProctorReportPDF, exportAlertsCSV } from '../utils/exportReport';
import { playActionBlip } from '../utils/audio';

interface IncidentTableProps {
  alerts: IncidentAlert[];
  currentSession: ExamSession;
  onReviewClip: (alert: IncidentAlert) => void;
  onConfirmViolation: (alertId: string) => void;
  onDismissAlert: (alertId: string) => void;
}

export const IncidentTable: React.FC<IncidentTableProps> = ({
  alerts,
  currentSession,
  onReviewClip,
  onConfirmViolation,
  onDismissAlert,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  const cheatTypes: IncidentType[] = [
    'Unauthorized Device Detected',
    'Suspicious Head Turning',
    'Passing Notes / Materials',
    'Multiple Faces in Frame',
    'Concealed Audio Device',
    'Gaze Aversion & Screen Peeking',
  ];

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch =
      !searchQuery ||
      alert.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.seatNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.incidentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.cameraName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType === 'all' || alert.incidentType === selectedType;
    const matchesStatus = selectedStatus === 'all' || alert.status === selectedStatus;
    const matchesSeverity = selectedSeverity === 'all' || alert.severity === selectedSeverity;

    return matchesSearch && matchesType && matchesStatus && matchesSeverity;
  });

  const handleDownloadPDF = () => {
    playActionBlip('click');
    exportProctorReportPDF(currentSession, filteredAlerts);
  };

  const handleExportCSV = () => {
    playActionBlip('click');
    exportAlertsCSV(currentSession, filteredAlerts);
  };

  return (
    <div className="liquid-glass rounded-xl p-4 lg:p-5 shadow-sm mt-4">
      {/* Top Toolbar: Title, Search, Filters, and Export Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight">
              Incident History & SQLite Audit Log
            </h2>
            <span className="font-mono text-xs text-cyan-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
              {filteredAlerts.length} CHEATING_EVENTS
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Synchronized with SQLite database <code className="text-cyan-300">exam_proctor.db</code> & 10s highlight clips
          </p>
        </div>

        {/* Action Controls: PDF & CSV Export */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl liquid-glass text-xs font-semibold text-zinc-200 hover:border-cyan-500/40 transition-colors shadow-sm"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Download Audit PDF</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl liquid-glass text-xs font-semibold text-zinc-200 hover:border-emerald-500/40 transition-colors shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-white/5 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student, seat, ID..."
            className="w-full bg-zinc-950/80 border border-white/5 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 shadow-inner"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 text-[11px] font-semibold hidden md:inline">Type:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-zinc-950 border border-white/10 text-zinc-300 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Violation Types</option>
              {cheatTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 text-[11px] font-semibold hidden md:inline">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-zinc-950 border border-white/10 text-zinc-300 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Review</option>
              <option value="confirmed">Confirmed Violations</option>
              <option value="dismissed">Dismissed / False Alarms</option>
            </select>
          </div>

          {(selectedType !== 'all' || selectedStatus !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedType('all');
                setSelectedStatus('all');
                setSearchQuery('');
              }}
              className="px-2.5 py-1.5 text-zinc-400 hover:text-zinc-200 text-xs font-medium"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Table Responsive Container */}
      <div className="overflow-x-auto mt-2">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-white/5 text-zinc-400 uppercase text-[10px] tracking-wider font-semibold bg-zinc-950/40">
              <th className="py-2.5 px-3">Time & ID</th>
              <th className="py-2.5 px-3">Examinee Details</th>
              <th className="py-2.5 px-3">Camera Source</th>
              <th className="py-2.5 px-3">Violation Category</th>
              <th className="py-2.5 px-3">AI Confidence</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">10s Highlight Clip</th>
              <th className="py-2.5 px-3 text-right">Proctor Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-medium">
            {filteredAlerts.length > 0 ? (
              filteredAlerts.map((alert) => {
                const isCritical = alert.severity === 'critical';
                const isPending = alert.status === 'pending';

                return (
                  <tr
                    key={alert.id}
                    className="hover:bg-white/5 transition-colors group"
                  >
                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-zinc-200 tabular-nums">
                        {alert.timestamp}
                      </div>
                      <div className="font-mono text-[10px] text-zinc-500">
                        {alert.id}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-zinc-100">{alert.studentName}</div>
                      <div className="text-[11px] text-zinc-400 font-mono mt-0.5 flex items-center gap-1.5">
                        <span className="text-cyan-400 bg-cyan-950/60 px-1 py-0.2 rounded border border-cyan-800/40 font-semibold">
                          {alert.seatNumber}
                        </span>
                        <span>{alert.studentId}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-zinc-300 font-mono text-[11px]">
                      {alert.cameraName}
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                          isCritical
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {isCritical ? (
                          <ShieldAlert className="w-3 h-3 text-rose-400" />
                        ) : (
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                        )}
                        <span>{alert.incidentType}</span>
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 font-mono tabular-nums">
                        <span className="font-bold text-zinc-200">{alert.confidence}%</span>
                        <div className="w-12 bg-zinc-900 rounded-full h-1.5 hidden sm:block">
                          <div
                            className={`h-1.5 rounded-full ${
                              alert.confidence >= 90 ? 'bg-rose-500' : 'bg-amber-400'
                            }`}
                            style={{ width: `${alert.confidence}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          alert.status === 'confirmed'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : alert.status === 'pending'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {alert.status}
                      </span>
                    </td>

                    {/* 10s Highlight Clip Replay Button */}
                    <td className="py-3 px-3">
                      <button
                        onClick={() => onReviewClip(alert)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg liquid-glass text-cyan-300 text-xs font-semibold hover:border-cyan-500/40 transition-colors"
                        title={`Watch 10s clip: ${alert.evidenceClip.clipName}`}
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span className="font-mono text-[11px] truncate max-w-[120px]">
                          10s Highlight
                        </span>
                      </button>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onReviewClip(alert)}
                          className="px-2.5 py-1 rounded-lg liquid-glass text-zinc-300 text-xs font-medium hover:border-white/20 transition-colors"
                        >
                          Review
                        </button>

                        {isPending && (
                          <>
                            <button
                              onClick={() => {
                                playActionBlip('confirm');
                                onConfirmViolation(alert.id);
                              }}
                              className="p-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/30"
                              title="Confirm Cheating"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                playActionBlip('dismiss');
                                onDismissAlert(alert.id);
                              }}
                              className="p-1 rounded-lg liquid-glass text-zinc-400 hover:text-white"
                              title="Dismiss False Alarm"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="py-10 text-center text-zinc-500">
                  <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-zinc-600" />
                  No incidents match the selected search or filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
