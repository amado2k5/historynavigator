import type { TelemetryContext } from '../types.ts';

/**
 * Tracks a user event. In a real application, this would send data
 * to a telemetry backend (like Google Analytics, Cloud Logging, etc.)
 * via a secure API endpoint. This functionality has been disabled to minimize costs.
 *
 * @param eventName A descriptive name for the event (e.g., 'select_civilization').
 * @param context The current state of the application.
 * @param properties Additional data specific to the event.
 */
export const trackEvent = (
    eventName: string,
    context: TelemetryContext,
    properties: Record<string, any> = {}
) => {
    // Telemetry logging is disabled to minimize costs.
    // The original implementation logged event data to the console for demonstration purposes.
};
