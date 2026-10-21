import { CheatingEventRecord, HighlightClipSequence } from './types';
import { databaseService } from './databaseService';
import { eventBus } from './eventBus';
import { playAlertChime } from '../utils/audio';

// Diagram 2 & Diagram 3: Event & Highlight Service (Port 8003)
class EventHighlightService {
  private circularBufferSeconds = 5;
  private postEventSeconds = 5;
  private tcpSocketConnected = true;

  getBufferConfig() {
    return {
      preBufferSeconds: this.circularBufferSeconds,
      postBufferSeconds: this.postEventSeconds,
      totalDuration: this.circularBufferSeconds + this.postEventSeconds,
      tcpSocketPort: 9999,
      aiModel: 'CiRA CORE (ai mo1 YOLOv10)',
    };
  }

  // Diagram 3 Steps 4-11: AI detects -> TCP 9999 -> Pull 5s buffer + 5s post -> save .mp4 -> SQLite -> WS
  processCiRADetection(payload: {
    studentName: string;
    studentId: string;
    seatNumber: string;
    cameraId: string;
    eventType: 'using_phone' | 'looking_sideways' | 'paper_passing' | 'concealed_earbud' | 'second_person';
    confidence: number;
    description: string;
  }): { event: CheatingEventRecord; clip: HighlightClipSequence } {
    const timestamp = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    const fileTimestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const videoFileName = `highlight_${fileTimestamp}_${payload.seatNumber.replace(/[^a-zA-Z0-9]/g, '')}.mp4`;
    const videoPath = `/highlights/${videoFileName}`;
    const thumbnailPath = `/highlights/thumb_${fileTimestamp}.jpg`;

    // 1. Record event in SQLite (Diagram 3 Step 9)
    const newEvent = databaseService.addCheatingEvent({
      timestamp,
      event_type: payload.eventType,
      confidence: payload.confidence,
      video_path: videoPath,
      thumbnail_path: thumbnailPath,
      status: 'pending',
      student_name: payload.studentName,
      student_id: payload.studentId,
      seat_number: payload.seatNumber,
      camera_id: payload.cameraId,
    });

    // 2. Compile Highlight Clip Metadata (Diagram 3 Steps 6-8)
    const clip: HighlightClipSequence = {
      clipId: `clip-${newEvent.id}`,
      fileName: videoFileName,
      preBufferSeconds: this.circularBufferSeconds,
      postBufferSeconds: this.postEventSeconds,
      totalDurationSeconds: this.circularBufferSeconds + this.postEventSeconds,
      triggerTimestamp: timestamp,
      eventType: payload.eventType,
      confidence: payload.confidence,
      videoUrl: videoPath,
      thumbnailUrl: thumbnailPath,
    };

    // 3. Play proctor audio chime and fire WebSocket broadcast (Diagram 3 Step 11)
    playAlertChime(payload.confidence >= 0.9 ? 'critical' : 'warning');
    eventBus.emit('WEBSOCKET_ALERT_BROADCAST', { event: newEvent, clip });

    return { event: newEvent, clip };
  }
}

export const eventHighlightService = new EventHighlightService();
