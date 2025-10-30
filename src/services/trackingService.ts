/**
 * A mock tracking service for logging user events.
 * In a real application, this would integrate with an analytics service
 * like Google Analytics, Mixpanel, or a custom backend.
 */
class TrackingService {
  private isEnabled: boolean;

  constructor() {
    // Disable tracking in development environments for this example
    this.isEnabled = process.env.NODE_ENV !== 'development';
    if (!this.isEnabled) {
      console.log('Tracking service is enabled (dev mode).');
    }
  }

  /**
   * Tracks a specific event with optional properties.
   * @param eventName - The name of the event to track (e.g., 'add_task', 'complete_habit').
   * @param properties - An object containing additional data about the event.
   */
  public trackEvent(eventName: string, properties: Record<string, any> = {}): void {
    if (!this.isEnabled) {
      console.log('[TRACKING DISABLED]', { event: eventName, ...properties });
      return;
    }

    // In a real implementation, you would send this data to your analytics service.
    // For this mock, we'll just log it to the console.
    console.log('[TRACKING EVENT]', {
      event: eventName,
      ...properties,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Tracks a page view or screen view.
   * @param screenName - The name of the screen or page being viewed (e.g., 'Dashboard', 'Calendar').
   */
  public trackScreenView(screenName: string): void {
    this.trackEvent('screen_view', { screen_name: screenName });
  }
}

// Export a singleton instance of the service
const trackingService = new TrackingService();
export default trackingService;
