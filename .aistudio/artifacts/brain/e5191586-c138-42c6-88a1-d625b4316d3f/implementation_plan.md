# ExamGuard AI: Comprehensive Architecture & Liquid Glass Dashboard

A production-grade, long-term scalable architectural implementation plan for **ExamGuard AI**, directly synthesized from the project's 5 official system diagrams (Hardware Network, Microservices Topology, 10s Highlight Clip Sequence, ONVIF PTZ Control, and SQLite Database Schema) featuring a modern **Liquid Glass** aesthetic with balanced, fluid interactions.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following technical and UX decisions have been finalized based on the project's architectural diagrams and confirmed user selections:

- **Confirmed: Microservices Architecture**: Decoupled service architecture matching Diagram 2 with dedicated ports and endpoints:
  - **API Gateway & WebSocket Hub** (`Port 8000`): Reverse proxy, static asset server, and client WebSocket broadcaster (`ws://.../ws/alerts`).
  - **Auth & Audit Service** (`Port 8001`): JWT session auth, Google OAuth integration, and tamper-evident `audit_logs`.
  - **Camera & PTZ Service** (`Port 8002`): RTSP MJPEG stream ingestion and ONVIF ContinuousMove camera control.
  - **Event & Highlight Service** (`Port 8003`): TCP Socket listener from CiRA CORE (`Port 9999`), 5s Circular Buffer management, and 10s `.mp4` clip compilation.
- **Confirmed: ONVIF PTZ Camera Control**: Interactive on-screen D-Pad overlay (Pan Left/Right, Tilt Up/Down) rendered on each camera feed card and inside the expanded camera view, updating real-time Pan/Tilt coordinates and automatically generating audit log entries (matching Diagram 4).
- **Confirmed: 10-Second Evidence Highlight Clip Player**: Forensic replay modal specifically highlighting the **5s Pre-event Circular Buffer** and **5s Post-event Recording** window (matching Diagram 3), with keyframe indicators, confidence scores, and proctor review actions.
- **Confirmed: Microservices & Database Drawer**: Sliding frosted glass drawer providing real-time visibility into microservice health (Ports 8000–8003), TCP socket telemetry, and live inspection of SQLite tables (`USERS`, `CHEATING_EVENTS`, `AUDIT_LOGS`, `PASSWORD_RESETS` from Diagram 5).
- **Confirmed: Visual Language**: Minimalist **Liquid Glass** aesthetic—translucent frosted layers (`backdrop-blur-xl bg-zinc-950/60`), subtle specular light reflections, hairline gradient borders, and clean typography without color overload.

---

## 1. Overview & Core Concept

### System Workflow
1. **Surveillance & Ingestion**: MERCUSYS MC210 Wi-Fi Pan/Tilt Cameras stream RTSP feeds (Port 554) over the local Wi-Fi router (IP: `10.114.70.249`) to Raspberry Pi 5 edge devices.
2. **AI Inference & Buffer Management**:
   - Camera feeds stream continuously into CiRA CORE running YOLO detection model (`ai mo1`).
   - Simultaneously, frames are stored in an in-memory **Circular Buffer** maintaining the last 5 seconds of footage.
3. **Anomaly Trigger & Clip Compilation**:
   - When CiRA detects suspicious examinee behavior (e.g. `using_phone` with 94% confidence or `looking_sideways`), it transmits a payload via TCP Socket (Port 9999) to Event Service (Port 8003).
   - Event Service extracts the 5s pre-event buffer, captures 5s post-event, and saves a 10s highlight clip (`/highlights/highlight_timestamp.mp4`).
   - Event Service writes the incident to SQLite (`CHEATING_EVENTS`) and broadcasts a WebSocket alert through the API Gateway (Port 8000).
4. **Proctor Triage & PTZ Control**:
   - Proctor receives an instant visual badge and audio chime on the React 19 Liquid Glass Dashboard.
   - Proctor reviews the 10s highlight clip, confirms or dismisses the violation, or uses the on-screen D-Pad to physically reposition the camera via ONVIF commands.

---

## 2. User Experience & Visual Design

### Liquid Glass Design System
- **Surface Geometry**: Ultra-clean frosted glass surfaces (`backdrop-blur-xl bg-zinc-950/65`) paired with delicate specular top reflections (`shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]`) and hairline border borders (`border border-white/10 hover:border-cyan-400/30`).
- **Deep Obsidian Canvas**: High-contrast, fatigue-free dark backdrop (`#090b10`) optimized for proctors monitoring exam sessions over multiple hours.
- **Color Restraint (60-30-10 Rule)**:
  - **60% Obsidian Neutral**: Background and translucent glass base surfaces (`zinc-950`, `zinc-900/70`).
  - **30% Frosted Glass & Monochromatic Structure**: Typography, subtle dividers, and quiet metadata text.
  - **10% High-Intent Semantic Accents**: Crisp Cyan (`#06b6d4`) for nominal status, Amber (`#f59e0b`) for warnings, and Rose/Crimson (`#f43f5e`) strictly for cheating violations.
- **Micro-Interactions (`motion/react`)**:
  - Smooth spring physics (`damping: 24, stiffness: 300`) for alert slide-ins and modal reveals.
  - Gentle cursor-following specular gleam on cards and camera viewports.
  - D-Pad feedback: Tactile button press state with immediate coordinate telemetry readout (`Pan: -15°, Tilt: 0°`).

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Microservices Gateway Emulation with Live Contracts
- **Chosen Approach**: Decoupled, typed client service layers (`/src/services/*`) mirroring the backend ports (8000 Gateway, 8001 Auth/Audit, 8002 Camera/PTZ, 8003 Events) with typed schemas matching Diagram 2.
- **Why**: Allows instant development and seamless transition to production FastAPI/Python services on the Raspberry Pi 5 while maintaining full architectural fidelity.

### Decision 2: On-Feed Interactive PTZ D-Pad Controller
- **Chosen Approach**: A sleek, translucent glass D-Pad widget overlaid in the corner of each camera card and in the expanded camera modal, equipped with a 1-click toggle to prevent accidental touches.
- **Why**: Enables proctors to immediately adjust camera angles during exams without leaving the surveillance dashboard, fulfilling Diagram 4's ONVIF workflow.

### Decision 3: Specialized 10-Second Buffer Replay Interface
- **Chosen Approach**: The evidence player visually segments the 10s video into:
  - `[-5s to 0s] Pre-event Buffer` (Circular Buffer playback)
  - `[0s] AI Anomaly Keyframe Trigger` (CiRA YOLO detection flag)
  - `[0s to +5s] Post-event Recording`
- **Why**: Delivers exact alignment with Diagram 3's sequence specifications, giving proctors complete context of what the student was doing before and after the violation.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram (Synthesized from Diagrams 1 & 2)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      Exam Room (MERCUSYS MC210 Wi-Fi Cameras)                   │
│      RTSP Stream (Port 554)  │  ONVIF PTZ Commands (Port 2020)  │  MicroSD 24h   │
└──────────────────────────────┬──────────────────────────────────────────────────┘
                               │ Local Wi-Fi Router (IP: 10.114.70.249)
┌──────────────────────────────▼──────────────────────────────────────────────────┐
│              Raspberry Pi 5 Edge Device / Microservices Ecosystem               │
│                                                                                 │
│  ┌─────────────────────────┐           ┌──────────────────────────────────────┐ │
│  │   CiRA CORE (Edge AI)   │─TCP 9999─▶│ 3. Event & Highlight Service (8003)  │ │
│  │   YOLO: ai mo1 Detect   │           │ - 5s Circular Buffer & 10s MP4 Rec   │ │
│  └─────────────────────────┘           └──────────────────┬───────────────────┘ │
│                                                           │                     │
│  ┌─────────────────────────┐           ┌──────────────────▼───────────────────┐ │
│  │ 2. Camera & PTZ Service │           │ 1. Auth & Audit Service (Port 8001)  │ │
│  │ (Port 8002) ONVIF PTZ   │           │ - JWT / Google OAuth / Audit Logs    │ │
│  └────────────┬────────────┘           └──────────────────┬───────────────────┘ │
│               │                                           │                     │
│               └─────────────────────┬─────────────────────┘                     │
│                                     ▼                                           │
│                       ┌───────────────────────────┐                             │
│                       │  API Gateway (Port 8000)  │                             │
│                       │  WebSocket Hub / Reverse  │                             │
│                       └─────────────┬─────────────┘                             │
│                                     │                                           │
│  ┌──────────────────────────────────▼────────────────────────────────────────┐   │
│  │ Storage Layer: SQLite (exam_proctor.db) & Local Storage (/highlights/*.mp4)│   │
│  │ Tables: USERS · CHEATING_EVENTS · AUDIT_LOGS · PASSWORD_RESETS             │   │
│  └───────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────┬───────────────────────────────────────────┘
                                      │ HTTP / WebSocket (Port 8000)
┌─────────────────────────────────────▼───────────────────────────────────────────┐
│                 React 19 + TypeScript Liquid Glass Dashboard                   │
│  ┌─────────────────┐ ┌─────────────────┐ ┌──────────────────┐ ┌───────────────┐ │
│  │ Top Glass Nav   │ │ Liquid KPIs     │ │ Multi-Cam + PTZ  │ │ Live Alerts   │ │
│  └─────────────────┘ └─────────────────┘ └──────────────────┘ └───────────────┘ │
│  ┌─────────────────────────────────────┐ ┌────────────────────────────────────┐ │
│  │ 10s Highlight Clip Replay Modal     │ │ Microservices & DB Topology Drawer │ │
│  └─────────────────────────────────────┘ └────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Database Entity Mapping (Synthesized from Diagram 5)
- **`USERS`**: `id`, `username`, `email`, `password_hash`, `google_id`, `role` ('admin' | 'proctor'), `created_at`.
- **`CHEATING_EVENTS`**: `id`, `timestamp`, `event_type` (`using_phone`, `looking_sideways`, etc.), `confidence`, `video_path`, `thumbnail_path`, `status` ('pending' | 'confirmed' | 'false_alarm'), `reviewed_by`, `review_notes`.
- **`AUDIT_LOGS`**: `id`, `user_id`, `username`, `action` (`LOGIN`, `CAMERA_PTZ_LEFT`, `REVIEW_EVENT`), `ip_address`, `details`, `timestamp`.
- **`PASSWORD_RESETS`**: `id`, `user_id`, `token`, `expires_at`, `used`.

### Microservices Directory Layout
- `/src/services/`:
  - `gateway.ts`: API Gateway dispatcher & WebSocket connection manager (`ws://localhost:8000/ws/alerts`).
  - `authAuditService.ts`: Auth management and tamper-evident audit logging (`Port 8001`).
  - `cameraPtzService.ts`: RTSP stream orchestration and ONVIF Pan/Tilt controls (`Port 8002`).
  - `eventHighlightService.ts`: CiRA CORE TCP socket consumer, Circular Buffer, and 10s MP4 generation (`Port 8003`).
  - `databaseService.ts`: SQLite schema repository with table inspection queries.
  - `eventBus.ts`: Typed event bus for real-time frontend reactivity.
- `/src/components/`:
  - `Navbar.tsx`: Liquid glass header with session selector, system status, audio mute, and Architecture & DB Drawer trigger.
  - `CameraFeedCard.tsx`: Liquid glass camera card with ONVIF D-Pad overlay, live telemetry, and CV bounding boxes.
  - `CameraGrid.tsx`: 2x2 grid with multi-channel stream management and PTZ shortcuts.
  - `AlertFeed.tsx` & `AlertCard.tsx`: Real-time incident stream with 1-click review trigger.
  - `EvidencePlayerModal.tsx`: Dedicated 10-second highlight clip player showing 5s pre + 5s post buffer.
  - `ExpandedCameraModal.tsx`: High-resolution camera view with full-size ONVIF PTZ D-Pad controller.
  - `TopologyDrawer.tsx`: Interactive microservices architecture inspector showing real-time latency, throughput, and node health.
  - `SimulateAnomalyModal.tsx`: Live incident injector for end-to-end service testing.
