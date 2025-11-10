import { translateText } from '../services/translation.service';

export async function translateString(
  text: string,
  targetLanguage: string,
  context: string
): Promise<string> {
  if (!text || targetLanguage === 'en') {
    return text;
  }

  const result = await translateText({
    text,
    targetLanguage,
    sourceLanguage: 'en',
    context,
  });

  return result.translatedText;
}

export async function translateStringArray(
  values: string[],
  targetLanguage: string,
  contextPrefix: string
): Promise<string[]> {
  return Promise.all(
    values.map((value, index) =>
      translateString(
        value,
        targetLanguage,
        `${contextPrefix} ${index + 1}`
      )
    )
  );
}
