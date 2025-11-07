
/**
 * Format date for certificate display
 */
export function formatDateForCert(date: Date, locale: string = 'en-IN'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date));
}
