export interface LanguageInfo {
  code: string;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
];

export function getLanguageInfo(code?: string): LanguageInfo | undefined {
  if (!code) {
    return SUPPORTED_LANGUAGES.find((lang) => lang.code === 'en');
  }

  return SUPPORTED_LANGUAGES.find(
    (lang) => lang.code.toLowerCase() === code.toLowerCase()
  );
}

export interface LanguageDetails extends LanguageInfo {
  display: string;
}

export function getLanguageDisplayName(code?: string): string {
  return getLanguageDetails(code).display;
}

export function getLanguageCodeOrDefault(code?: string): string {
  return getLanguageDetails(code).code;
}

export function getLanguageDetails(code?: string): LanguageDetails {
  const info =
    SUPPORTED_LANGUAGES.find(
      (lang) => lang.code.toLowerCase() === (code || 'en').toLowerCase()
    ) || SUPPORTED_LANGUAGES.find((lang) => lang.code === 'en')!;

  const display =
    info.nativeName && info.nativeName !== info.name
      ? `${info.name} (${info.nativeName})`
      : info.name;

  return {
    ...info,
    display,
  };
}
