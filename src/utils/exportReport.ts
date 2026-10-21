import { ExamSession, IncidentAlert } from '../types/proctor';

export function exportProctorReportPDF(session: ExamSession, alerts: IncidentAlert[]) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const confirmedCount = alerts.filter(a => a.status === 'confirmed').length;
  const pendingCount = alerts.filter(a => a.status === 'pending').length;
  const dismissedCount = alerts.filter(a => a.status === 'dismissed').length;

  const rowsHtml = alerts
    .map(
      (a, idx) => `
    <tr style="border-bottom: 1px solid #e2e8f0; font-size: 12px;">
      <td style="padding: 8px 10px; font-family: monospace; font-weight: 600;">${idx + 1}</td>
      <td style="padding: 8px 10px; font-family: monospace;">${a.timestamp}</td>
      <td style="padding: 8px 10px;"><strong>${a.studentName}</strong><br/><span style="color:#64748b; font-size:11px;">${a.studentId} · ${a.seatNumber}</span></td>
      <td style="padding: 8px 10px;">${a.cameraName}</td>
      <td style="padding: 8px 10px;">
        <span style="display:inline-block; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600; 
          background: ${a.severity === 'critical' ? '#fee2e2; color:#b91c1c' : a.severity === 'warning' ? '#fef3c7; color:#b45309' : '#f1f5f9; color:#475569'};">
          ${a.incidentType}
        </span>
      </td>
      <td style="padding: 8px 10px; font-family: monospace; font-weight: 600;">${a.confidence}%</td>
      <td style="padding: 8px 10px; text-transform: uppercase; font-size: 11px; font-weight: 700; color: ${a.status === 'confirmed' ? '#b91c1c' : a.status === 'pending' ? '#b45309' : '#15803d'};">
        ${a.status}
      </td>
      <td style="padding: 8px 10px; font-size: 11px; color: #334155;">
        ${a.description}
        ${a.proctorNote ? `<br/><em style="color:#0f172a; font-weight:600;">Proctor Note: ${a.proctorNote}</em>` : ''}
      </td>
    </tr>
  `
    )
    .join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Exam Integrity Audit Report - ${session.code}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 40px; line-height: 1.5; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
    .title { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0; }
    .sub { font-size: 13px; color: #64748b; margin-top: 4px; }
    .kpis { display: flex; gap: 20px; margin-bottom: 24px; }
    .kpi { flex: 1; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px 16px; background: #f8fafc; }
    .kpi-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 600; }
    .kpi-val { font-size: 22px; font-weight: 800; font-family: monospace; color: #0f172a; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th { text-align: left; padding: 10px; background: #f1f5f9; font-size: 11px; text-transform: uppercase; color: #475569; font-weight: 700; border-bottom: 1px solid #cbd5e1; }
    .signature-box { margin-top: 48px; display: flex; justify-content: space-between; }
    .sig-line { width: 220px; border-top: 1px solid #0f172a; margin-top: 40px; font-size: 12px; font-weight: 600; text-align: center; }
    @media print {
      body { margin: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px; display: flex; justify-content: flex-end; gap: 10px;">
    <button onclick="window.print()" style="background: #0f172a; color: white; border: none; padding: 8px 16px; border-radius: 4px; font-weight: 600; cursor: pointer;">
      Print / Save as PDF
    </button>
  </div>

  <div class="header">
    <div>
      <h1 class="title">ExamGuard AI · Incident Audit & Integrity Report</h1>
      <div class="sub">Official Proctoring Record · Automated Computer Vision & Academic Integrity Forensics</div>
    </div>
    <div style="text-align: right; font-size: 12px; color: #475569;">
      <strong>Session:</strong> ${session.code}<br/>
      <strong>Room:</strong> ${session.room} · ${session.title}<br/>
      <strong>Generated:</strong> ${new Date().toLocaleString()}
    </div>
  </div>

  <div class="kpis">
    <div class="kpi">
      <div class="kpi-title">Room Integrity Index</div>
      <div class="kpi-val" style="color: #0284c7;">${session.integrityScore}%</div>
    </div>
    <div class="kpi">
      <div class="kpi-title">Examinees Monitored</div>
      <div class="kpi-val">${session.totalStudents} Students</div>
    </div>
    <div class="kpi">
      <div class="kpi-title">Confirmed Violations</div>
      <div class="kpi-val" style="color: #b91c1c;">${confirmedCount}</div>
    </div>
    <div class="kpi">
      <div class="kpi-title">Pending Proctor Review</div>
      <div class="kpi-val" style="color: #d97706;">${pendingCount}</div>
    </div>
    <div class="kpi">
      <div class="kpi-title">Dismissed / False Alarms</div>
      <div class="kpi-val" style="color: #16a34a;">${dismissedCount}</div>
    </div>
  </div>

  <h3 style="font-size: 15px; margin-bottom: 8px; font-weight: 700;">Chronological Incident Log</h3>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Time</th>
        <th>Examinee</th>
        <th>Camera Source</th>
        <th>Violation Category</th>
        <th>AI Conf.</th>
        <th>Status</th>
        <th>Forensic Details & Proctor Notes</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="signature-box">
    <div>
      <div class="sig-line">Chief Proctor Signature</div>
      <div style="font-size: 11px; text-align: center; color: #64748b; margin-top: 4px;">${session.proctorName}</div>
    </div>
    <div>
      <div class="sig-line">Academic Dean / Integrity Board</div>
      <div style="font-size: 11px; text-align: center; color: #64748b; margin-top: 4px;">Date: ________________________</div>
    </div>
  </div>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

export function exportAlertsCSV(session: ExamSession, alerts: IncidentAlert[]) {
  const headers = ['IncidentID', 'Timestamp', 'StudentName', 'StudentID', 'Seat', 'Camera', 'ViolationType', 'Severity', 'Confidence', 'Status', 'Description', 'ProctorNote'];
  
  const rows = alerts.map(a => [
    a.id,
    `"${a.timestamp}"`,
    `"${a.studentName}"`,
    `"${a.studentId}"`,
    `"${a.seatNumber}"`,
    `"${a.cameraName}"`,
    `"${a.incidentType}"`,
    a.severity,
    `${a.confidence}%`,
    a.status,
    `"${a.description.replace(/"/g, '""')}"`,
    `"${(a.proctorNote || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `ExamGuard_Incident_Log_${session.code}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
