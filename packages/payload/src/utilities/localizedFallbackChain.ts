/**
 * Payload CMS - Localized Field Fallback Chain Evaluator
 */
export function resolveLocalizedFieldFallback(
  fieldTranslations: Record<string, string>,
  preferredLocale: string,
  fallbackChain: string[] = ['en', 'default']
): string | undefined {
  if (fieldTranslations[preferredLocale]) return fieldTranslations[preferredLocale];
  for (const fallback of fallbackChain) {
    if (fieldTranslations[fallback]) return fieldTranslations[fallback];
  }
  return undefined;
}
