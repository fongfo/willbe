type AnalyticsEventName =
  | 'website_cta_clicked'
  | 'website_language_changed'
  | 'website_faq_opened'
  | 'website_ai_launcher_opened'
  | 'website_security_section_viewed';

type AnalyticsProperties = Record<string, string>;

export function trackWebsiteEvent(name: AnalyticsEventName, properties: AnalyticsProperties): void {
  void name;
  void properties;
}
