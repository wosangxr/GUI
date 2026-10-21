import { MicroserviceNode } from './types';
import { eventBus } from './eventBus';

// Diagram 2: API Gateway (Port 8000) & Microservices Manager
class GatewayService {
  private services: MicroserviceNode[] = [
    {
      id: 'gateway',
      name: 'API Gateway & Reverse Proxy',
      port: 8000,
      protocol: 'HTTP',
      status: 'healthy',
      latencyMs: 12.4,
      uptimeSec: 3600 * 4 + 120,
      requestCount: 14820,
      errorCount: 0,
      version: 'v2.6.4',
      description: 'Central ingress router, static asset server, and WebSocket broadcaster',
      endpoints: ['/', '/ws/alerts', '/api/v1/*'],
      lastHeartbeat: 'Just now',
    },
    {
      id: 'auth_audit',
      name: '1. Auth & Audit Service',
      port: 8001,
      protocol: 'HTTP',
      status: 'healthy',
      latencyMs: 18.2,
      uptimeSec: 3600 * 4 + 118,
      requestCount: 4210,
      errorCount: 0,
      version: 'v1.4.1',
      description: 'JWT session tokens, Google OAuth, and SQLite audit_logs ledger',
      endpoints: ['/api/auth/login', '/api/auth/verify', '/api/audit/logs'],
      lastHeartbeat: '1s ago',
    },
    {
      id: 'cam_ptz',
      name: '2. Camera & PTZ Service',
      port: 8002,
      protocol: 'ONVIF',
      status: 'healthy',
      latencyMs: 24.6,
      uptimeSec: 3600 * 4 + 115,
      requestCount: 8940,
      errorCount: 2,
      version: 'v2.1.0',
      description: 'RTSP multi-feed transcoding, ONVIF ContinuousMove PTZ control',
      endpoints: ['/api/camera/stream', '/api/camera/ptz', '/api/camera/presets'],
      lastHeartbeat: 'Just now',
    },
    {
      id: 'event_highlight',
      name: '3. Event & Highlight Service',
      port: 8003,
      protocol: 'HTTP',
      status: 'healthy',
      latencyMs: 15.8,
      uptimeSec: 3600 * 4 + 110,
      requestCount: 6520,
      errorCount: 0,
      version: 'v2.0.8',
      description: 'TCP Socket (Port 9999) consumer, 5s circular buffer, 10s MP4 generation',
      endpoints: ['/api/events', '/api/events/:id/status', '/highlights/*'],
      lastHeartbeat: 'Just now',
    },
    {
      id: 'cira_core',
      name: 'CiRA CORE Edge AI Engine',
      port: 9999,
      protocol: 'TCP Socket',
      status: 'healthy',
      latencyMs: 22.0,
      uptimeSec: 3600 * 4 + 95,
      requestCount: 24500,
      errorCount: 1,
      version: 'v4.2-Edge',
      description: 'YOLO ai mo1 deep detection running on Raspberry Pi 5 hardware',
      endpoints: ['tcp://10.114.70.249:9999'],
      lastHeartbeat: 'Just now',
    },
  ];

  getServices(): MicroserviceNode[] {
    return [...this.services];
  }

  // Periodic heartbeat jitter to simulate live production telemetry
  tickTelemetry() {
    this.services = this.services.map((svc) => {
      const jitter = (Math.random() * 2 - 1) * 0.8;
      return {
        ...svc,
        latencyMs: Number(Math.max(4, svc.latencyMs + jitter).toFixed(1)),
        requestCount: svc.requestCount + Math.floor(Math.random() * 3),
      };
    });
    eventBus.emit('GATEWAY_TELEMETRY_UPDATED', this.services);
  }
}

export const gatewayService = new GatewayService();
