import React, { useState } from 'react';
import { 
  Bell, 
  Search, 
  CheckCircle2, 
  ShieldAlert,
  Radio
} from 'lucide-react';
import { IncidentAlert, AlertStatus } from '../types/proctor';
import { AlertCard } from './AlertCard';

interface AlertFeedProps {
  alerts: IncidentAlert[];
  onReviewClip: (alert: IncidentAlert) => void;
  onConfirmViolation: (alertId: string) => void;
  onDismissAlert: (alertId: string) => void;
  initialFilterStatus?: AlertStatus | 'all';
}

export const AlertFeed: React.FC<AlertFeedProps> = ({
  alerts,
  onReviewClip,
  onConfirmViolation,
  onDismissAlert,
  initialFilterStatus = 'all',
}) => {
  const [activeTab, setActiveTab] = useState<AlertStatus | 'all'>(initialFilterStatus);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAlerts = alerts.filter((alert) => {
    const matchesTab = activeTab === 'all' || alert.status === activeTab;
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      alert.studentName.toLowerCase().includes(query) ||
      alert.studentId.toLowerCase().includes(query) ||
      alert.seatNumber.toLowerCase().includes(query) ||
      alert.incidentType.toLowerCase().includes(query) ||
      alert.cameraName.toLowerCase().includes(query);

    return matchesTab && matchesQuery;
  });

  const pendingCount = alerts.filter((a) => a.status === 'pending').length;
  const confirmedCount = alerts.filter((a) => a.status === 'confirmed').length;
  const dismissedCount = alerts.filter((a) => a.status === 'dismissed').length;

  return (
    <div className="flex flex-col h-full liquid-glass rounded-xl p-3.5 lg:p-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-rose-950/80 text-rose-400 border border-rose-500/30">
            <Bell className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-100 tracking-tight">
              Real-Time Alert Feed
            </h2>
            <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 font-mono">
              <Radio className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
              <span>ws://.../ws/alerts (Port 8000)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-xs">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span className="text-rose-400 font-bold">{pendingCount}</span>
          <span className="text-zinc-500 text-[11px]">pending</span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="py-2.5 space-y-2 border-b border-white/5">
        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1 p-1 bg-zinc-950/50 rounded-xl border border-white/5 text-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-1 px-2 rounded-lg font-medium transition-colors text-center ${
              activeTab === 'all'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All ({alerts.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-1 px-2 rounded-lg font-medium transition-colors text-center ${
              activeTab === 'pending'
                ? 'bg-rose-950/80 text-rose-200 border border-rose-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setActiveTab('confirmed')}
            className={`flex-1 py-1 px-2 rounded-lg font-medium transition-colors text-center ${
              activeTab === 'confirmed'
                ? 'bg-zinc-800 text-rose-300 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Confirmed ({confirmedCount})
          </button>
          <button
            onClick={() => setActiveTab('dismissed')}
            className={`flex-1 py-1 px-2 rounded-lg font-medium transition-colors text-center ${
              activeTab === 'dismissed'
                ? 'bg-zinc-800 text-emerald-300 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Dismissed ({dismissedCount})
          </button>
        </div>

        {/* Quick Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search examinee, seat, violation type..."
            className="w-full bg-zinc-950/80 border border-white/5 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Alert List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 mt-2 min-h-[380px] max-h-[640px]">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onReviewClip={onReviewClip}
              onConfirmViolation={onConfirmViolation}
              onDismissAlert={onDismissAlert}
            />
          ))
        ) : (
          <div className="h-60 flex flex-col items-center justify-center text-center p-6 text-zinc-500">
            <CheckCircle2 className="w-8 h-8 text-zinc-600 mb-2" />
            <div className="text-xs font-semibold text-zinc-400">
              No matching alerts found
            </div>
            <p className="text-[11px] text-zinc-500 max-w-xs mt-1">
              {searchQuery
                ? 'Try adjusting your search criteria or changing status filter.'
                : 'No incidents recorded in this category. Room is operating normally.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
