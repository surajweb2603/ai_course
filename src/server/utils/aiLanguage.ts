export function isLanguageOverrideError(message?: string): boolean {
  if (!message) {
    return false;
  }

  const normalized = message.toLowerCase();
  return (
    normalized.includes('language override unsupported') ||
    normalized.includes('language override is unsupported')
  );
}
