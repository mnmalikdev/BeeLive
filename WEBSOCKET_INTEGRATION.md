# WebSocket Integration ✅

## Overview

Complete WebSocket client integration for real-time telemetry and alert updates from the backend.

## Features

- ✅ Socket.IO client connection
- ✅ Real-time telemetry updates (delta updates)
- ✅ Alert notifications with toast + sound
- ✅ Auto-reconnection with exponential backoff
- ✅ Connection state management
- ✅ Event-driven architecture
- ✅ TypeScript support
- ✅ Follows existing codebase patterns

## Architecture

### Components

1. **WebSocket Service** (`websocket.service.ts`)
   - Manages Socket.IO connection
   - Handles reconnection logic
   - Processes telemetry and alert events
   - Emits custom DOM events for components

2. **WebSocket Store** (`websocket.store.ts`)
   - Tracks connection status
   - Stores last known telemetry
   - Error state management

3. **WebSocket Types** (`types/websocket.ts`)
   - Matches backend payload structures
   - Type-safe event handling

### Event Flow

```
Backend Gateway → Socket.IO → WebSocket Service → Custom Events → Components
                                                      ↓
                                                 Toast System
```

## Events

### Telemetry Events

**Event:** `telemetry`
**Payload:**
```typescript
{
  type: 'telemetry',
  data: { ...changedFields },  // Delta update
  full?: TelemetryFullPayload   // Full object on first connection
}
```

**Handler:** Updates dashboard metrics in real-time

### Alert Events

**Event:** `alert`
**Payload:**
```typescript
{
  type: 'alert',
  action: 'triggered' | 'cleared',
  alert: {
    type: string,
    message: string,
    createdAt: Date,
    value?: number,
    hiveId: string
  }
}
```

**Handler:** Shows toast notification with sound (for critical alerts)

## Usage

### Automatic Connection

WebSocket connects automatically when the app loads (in `+layout.svelte`).

### Manual Control

```typescript
import { websocketService } from '$lib/services/websocket.service.js';

// Connect manually
websocketService.connect();

// Disconnect
websocketService.disconnect();

// Check connection status
const isConnected = websocketService.isConnected();
```

### Listening to Updates

#### In Components (Dashboard)

The dashboard automatically listens to `telemetry-update` events:

```typescript
window.addEventListener('telemetry-update', (event: CustomEvent) => {
  const update = event.detail;
  // Update metrics...
});
```

#### Connection Status

```typescript
import { websocketStore } from '$lib/stores/websocket.store.js';

// Subscribe to connection status
websocketStore.subscribe((state) => {
  console.log('Status:', state.status); // 'disconnected' | 'connecting' | 'connected' | 'error'
  console.log('Last telemetry:', state.lastTelemetry);
});
```

## Configuration

### WebSocket URL

The service automatically derives the WebSocket URL from `VITE_API_BASE_URL`:

- If `VITE_API_BASE_URL=http://localhost:3000`, WebSocket connects to `http://localhost:3000`
- Removes `/api` suffix if present

### Reconnection

- **Max attempts:** 5
- **Delay:** 3 seconds
- **Transports:** websocket, polling (fallback)

## Integration Points

### 1. Layout (`+layout.svelte`)
- Connects on mount
- Disconnects on destroy

### 2. Dashboard (`+page.svelte`)
- Listens to `telemetry-update` events
- Updates metrics in real-time
- Merges delta updates with current state

### 3. Toast System
- Alert events automatically trigger toasts
- Critical alerts play sound
- Cleared alerts show success toast

## Testing

### Manual Test

1. Start backend: `cd beelive-backend && npm run start:dev`
2. Start frontend: `cd beelive-frontend && npm run dev`
3. Open browser console
4. Navigate to dashboard
5. Should see: `✅ WebSocket connected`
6. Wait for telemetry simulator (every 3 minutes in dev)
7. Watch dashboard update in real-time
8. Trigger alerts by exceeding thresholds
9. See toast notifications appear

### Verify Events

In browser console:
```javascript
// Listen to custom events
window.addEventListener('telemetry-update', (e) => console.log('Telemetry:', e.detail));
window.addEventListener('alert-update', (e) => console.log('Alert:', e.detail));
```

## Troubleshooting

### Connection Issues

- **Check backend is running** on port 3000
- **Verify CORS** is enabled in backend
- **Check WebSocket URL** in browser console
- **Network tab** should show WebSocket connection

### No Updates

- **Check backend logs** for WebSocket events
- **Verify telemetry simulator** is running (dev mode)
- **Check browser console** for errors
- **Verify event listeners** are registered

### Toast Not Showing

- **Check ToastProvider** is in layout
- **Verify toast store** is working
- **Check browser console** for errors

## Next Steps

- [ ] Add connection status indicator in UI
- [ ] Add manual reconnect button
- [ ] Add WebSocket connection quality metrics
- [ ] Add offline/online detection
- [ ] Add message queuing for offline state

