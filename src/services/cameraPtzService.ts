import { CameraPTZState } from './types';
import { databaseService } from './databaseService';
import { eventBus } from './eventBus';

// Diagram 2 & Diagram 4: Camera & PTZ Service (Port 8002)
class CameraPtzService {
  private ptzStates: Map<string, CameraPTZState> = new Map([
    [
      'cam-01',
      {
        cameraId: 'cam-01',
        pan: -15,
        tilt: 0,
        zoom: 1,
        speed: 0.5,
        isMoving: false,
        onvifProfile: 'Profile_1 (1080p60)',
        lastCommand: 'STOP',
      },
    ],
    [
      'cam-02',
      {
        cameraId: 'cam-02',
        pan: 0,
        tilt: -35,
        zoom: 1,
        speed: 0.5,
        isMoving: false,
        onvifProfile: 'Profile_1 (1440p30)',
        lastCommand: 'STOP',
      },
    ],
    [
      'cam-03',
      {
        cameraId: 'cam-03',
        pan: 45,
        tilt: -10,
        zoom: 1,
        speed: 0.5,
        isMoving: false,
        onvifProfile: 'Profile_1 (1080p60)',
        lastCommand: 'STOP',
      },
    ],
    [
      'cam-04',
      {
        cameraId: 'cam-04',
        pan: 120,
        tilt: -5,
        zoom: 1,
        speed: 0.5,
        isMoving: false,
        onvifProfile: 'Profile_1 (1080p60)',
        lastCommand: 'STOP',
      },
    ],
  ]);

  getPTZState(cameraId: string): CameraPTZState {
    if (!this.ptzStates.has(cameraId)) {
      this.ptzStates.set(cameraId, {
        cameraId,
        pan: 0,
        tilt: 0,
        zoom: 1,
        speed: 0.5,
        isMoving: false,
        onvifProfile: 'Profile_1 (1080p60)',
      });
    }
    return { ...this.ptzStates.get(cameraId)! };
  }

  // Diagram 4 Step 2-4: POST /camera/ptz & ONVIF ContinuousMove command
  move(cameraId: string, direction: 'left' | 'right' | 'up' | 'down' | 'zoom_in' | 'zoom_out', speed = 0.5): CameraPTZState {
    const current = this.getPTZState(cameraId);
    let deltaPan = 0;
    let deltaTilt = 0;
    let deltaZoom = 0;
    let auditAction: 'CAMERA_PTZ_LEFT' | 'CAMERA_PTZ_RIGHT' | 'CAMERA_PTZ_UP' | 'CAMERA_PTZ_DOWN' = 'CAMERA_PTZ_LEFT';

    switch (direction) {
      case 'left':
        deltaPan = -5 * speed;
        auditAction = 'CAMERA_PTZ_LEFT';
        break;
      case 'right':
        deltaPan = 5 * speed;
        auditAction = 'CAMERA_PTZ_RIGHT';
        break;
      case 'up':
        deltaTilt = 5 * speed;
        auditAction = 'CAMERA_PTZ_UP';
        break;
      case 'down':
        deltaTilt = -5 * speed;
        auditAction = 'CAMERA_PTZ_DOWN';
        break;
      case 'zoom_in':
        deltaZoom = 0.2;
        break;
      case 'zoom_out':
        deltaZoom = -0.2;
        break;
    }

    const updated: CameraPTZState = {
      ...current,
      pan: Math.max(-180, Math.min(180, Number((current.pan + deltaPan).toFixed(1)))),
      tilt: Math.max(-90, Math.min(90, Number((current.tilt + deltaTilt).toFixed(1)))),
      zoom: Math.max(1, Math.min(4, Number((current.zoom + deltaZoom).toFixed(1)))),
      isMoving: true,
      lastCommand: `MOVE_${direction.toUpperCase()}`,
      lastCommandTime: new Date().toLocaleTimeString(),
    };

    this.ptzStates.set(cameraId, updated);

    // Send real ONVIF hardware command to backend
    fetch('/api/camera/ptz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ direction, speed }),
    }).catch((e) => console.warn('PTZ fetch error:', e));

    // Diagram 4 Step 6-7: Record in SQLite Audit Log
    databaseService.addAuditLog({
      user_id: 1,
      username: 'admin',
      action: auditAction,
      ip_address: '10.114.70.15',
      details: `ONVIF PTZ ${direction.toUpperCase()} (speed: ${speed}) on ${cameraId}. New coords: Pan ${updated.pan}°, Tilt ${updated.tilt}°`,
    });

    eventBus.emit('PTZ_MOVED', updated);

    // Stop moving after 200ms
    setTimeout(() => {
      const stopped = { ...updated, isMoving: false };
      this.ptzStates.set(cameraId, stopped);
      eventBus.emit('PTZ_MOVED', stopped);
    }, 200);

    return updated;
  }

  resetToPreset(cameraId: string): CameraPTZState {
    const resetState: CameraPTZState = {
      cameraId,
      pan: 0,
      tilt: 0,
      zoom: 1,
      speed: 0.5,
      isMoving: false,
      onvifProfile: 'Profile_1 (1080p60)',
      lastCommand: 'PRESET_HOME',
      lastCommandTime: new Date().toLocaleTimeString(),
    };
    this.ptzStates.set(cameraId, resetState);
    fetch('/api/camera/ptz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ direction: 'home', speed: 0.5 }),
    }).catch((e) => console.warn('PTZ Home error:', e));
    eventBus.emit('PTZ_MOVED', resetState);
    return resetState;
  }
}

export const cameraPtzService = new CameraPtzService();
