import type { TelemetryContext } from '../types.ts';

// In a real application, this would be a more robust session ID.
const getSessionId = (): string => {
    let sessionId = sessionStorage.getItem('telemetrySessionId');
    if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        sessionStorage.setItem('telemetrySessionId', sessionId);
    }
    return sessionId;
};

/**
 * Tracks a user event. In a real application, this would send data
 * to a telemetry backend (like Google Analytics, Cloud Logging, etc.)
 * via a secure API endpoint. For this demo, it logs a structured event 
 * to the console, which demonstrates the data format.
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
    const telemetryEvent = {
        eventName,
        timestamp: new Date().toISOString(),
        user: {
            isLoggedIn: !!context.user,
            id: context.user ? `${context.user.name}_${context.user.provider}` : getSessionId(),
        },
        context: {
            civilization: context.civilization?.name || null,
            event: context.currentEvent?.id || null,
            viewMode: context.viewMode,
            language: context.language,
            isKidsMode: context.isKidsMode,
        },
        properties,
    };

    // In a real app, you would replace this with a call to your telemetry service.
    // e.g., fetch('/api/telemetry', { method: 'POST', body: JSON.stringify(telemetryEvent) });
    console.log('TELEMETRY EVENT:', JSON.stringify(telemetryEvent, null, 2));
};