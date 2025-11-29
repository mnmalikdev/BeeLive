# Toast Notifications

Production-grade toast notification system with sound alerts for BeeLive.

## Features

- ✅ shadcn-svelte style components using bits-ui
- ✅ Auto-dismiss with configurable duration
- ✅ Sound alerts for critical notifications
- ✅ Multiple variants: default, destructive, success, warning, info
- ✅ Follows existing codebase patterns
- ✅ TypeScript support
- ✅ Accessible (ARIA labels, keyboard navigation)

## Usage

### Basic Usage

```typescript
import { toastStore } from '$lib/stores/toast.store.js';
import { showAlertToast, showSuccessToast } from '$lib/utils/toast.js';

// Show a success toast
toastStore.success('Operation completed successfully');

// Show an error toast
toastStore.error('Something went wrong', 'Error');

// Show with custom duration
toastStore.warning('This will disappear in 10 seconds', 'Warning', 10000);

// Show alert toast (for backend alerts)
showAlertToast('TEMP_HIGH', 'Temperature exceeded threshold: 38.7°C', true);
```

### Helper Functions

```typescript
import {
  showAlertToast,
  showTelemetryUpdateToast,
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
} from '$lib/utils/toast.js';

// Alert toast (for WebSocket alerts)
showAlertToast('SWARM_RISK', 'Swarm risk very high: 92/100', true);

// Telemetry update (no sound, short duration)
showTelemetryUpdateToast('New telemetry data received');

// Standard toasts
showSuccessToast('Settings saved');
showErrorToast('Failed to connect');
showWarningToast('Battery level low');
showInfoToast('System update available');
```

### Advanced Usage

```typescript
import { toastStore } from '$lib/stores/toast.store.js';

// Custom toast with sound
const toastId = toastStore.add({
  title: 'Critical Alert',
  description: 'Hive temperature critical: 38.7°C',
  variant: 'destructive',
  duration: 8000, // 8 seconds
  playSound: true, // Play sound alert
});

// Dismiss programmatically
toastStore.dismiss(toastId);

// Clear all toasts
toastStore.clear();
```

## Sound Alerts

Sound alerts are automatically played for:
- **Destructive toasts** (critical alerts) - Higher frequency, urgent tone
- **Warning toasts** - Medium frequency
- **Success toasts** - Pleasant tone
- **Info toasts** - Subtle beep

Sound is only played if `playSound: true` is set (default for critical alerts).

## Toast Variants

- `default` - Standard notification
- `destructive` - Critical errors/alerts (red)
- `success` - Success messages (green)
- `warning` - Warnings (yellow)
- `info` - Informational (blue)

## Integration with WebSocket

When WebSocket alerts are received, use `showAlertToast()`:

```typescript
// In WebSocket handler
socket.on('alert', (data) => {
  if (data.action === 'triggered') {
    showAlertToast(data.alert.type, data.alert.message, true);
  } else if (data.action === 'cleared') {
    showAlertToast(`${data.alert.type}_CLEARED`, data.alert.message, false);
  }
});
```

## Styling

Toasts use Tailwind CSS and follow the existing design system. Colors are defined in `toast.svelte` using the `toastVariants` function.

