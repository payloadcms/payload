const PLACEHOLDER_REGEX = /\{\{.*?\}\}/g

/**
 * Numbered tags rendered by the `<Translation>` component (e.g. `<0>`, `</1>`) and the HTML tags
 * used in email strings (e.g. `<a href="...">`, `<br>`). Angle brackets around plain words such as
 * `<No {{label}}>` are literal text and are intentionally not matched.
 */
const TAG_REGEX = /<\/?(\d+|[abip]|br|code|em|span|strong)(?:\s[^>]*)?\/?>/gi

/**
 * Translations longer than this many times the source text (and longer than MIN_SUSPICIOUS_LENGTH)
 * are rejected. This catches responses where the model returned (a translation of) its own
 * instructions instead of translating the input.
 */
const MAX_LENGTH_RATIO = 4
const MIN_SUSPICIOUS_LENGTH = 80

/**
 * Returns a list of problems that would make a machine translation render incorrectly.
 * An empty list means the translation can be written to the language file.
 */
export function validateTranslation({
  sourceText,
  translatedText,
}: {
  sourceText: string
  translatedText: string | undefined
}): string[] {
  if (!translatedText?.trim()) {
    return ['translation is empty']
  }

  if (translatedText.includes('[SKIPPED]')) {
    return ['translation was skipped by the model']
  }

  const problems: string[] = []

  const sourcePlaceholders = getSortedMatches({ regex: PLACEHOLDER_REGEX, text: sourceText })
  const translatedPlaceholders = getSortedMatches({
    regex: PLACEHOLDER_REGEX,
    text: translatedText,
  })

  if (sourcePlaceholders.join() !== translatedPlaceholders.join()) {
    problems.push(
      `placeholders differ: expected [${sourcePlaceholders.join(', ')}], got [${translatedPlaceholders.join(', ')}]`,
    )
  }

  const unbalancedBraces =
    (translatedText.match(/\{\{/g)?.length ?? 0) !== (translatedText.match(/\}\}/g)?.length ?? 0)

  if (unbalancedBraces) {
    problems.push('unbalanced {{ }} braces')
  }

  const sourceTags = getSortedMatches({ regex: TAG_REGEX, text: sourceText, toTagName: true })
  const translatedTags = getSortedMatches({
    regex: TAG_REGEX,
    text: translatedText,
    toTagName: true,
  })

  if (sourceTags.join() !== translatedTags.join()) {
    problems.push(
      `tags differ: expected [${sourceTags.join(', ')}], got [${translatedTags.join(', ')}]`,
    )
  }

  if (
    translatedText.length > MIN_SUSPICIOUS_LENGTH &&
    translatedText.length > sourceText.length * MAX_LENGTH_RATIO
  ) {
    problems.push(
      `translation is ${translatedText.length} characters long for a ${sourceText.length} character source`,
    )
  }

  if (translatedText.startsWith('`') && !sourceText.startsWith('`')) {
    problems.push('translation starts with a stray backtick')
  }

  return problems
}

function getSortedMatches({
  regex,
  text,
  toTagName = false,
}: {
  regex: RegExp
  text: string
  toTagName?: boolean
}): string[] {
  return Array.from(text.matchAll(regex), (match) =>
    toTagName ? `${match[0].startsWith('</') ? '/' : ''}${match[1]!.toLowerCase()}` : match[0],
  ).sort()
}
