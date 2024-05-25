import type { Locale } from 'date-fns'

export const importDateFNSLocale = async (locale: string): Promise<Locale> => {
  let result

  switch (locale) {
    case 'ar':
      result = await import('date-fns/locale/ar')

      break
    case 'az':
      result = await import('date-fns/locale/az')

      break
    case 'bg':
      result = await import('date-fns/locale/bg')

      break
    case 'cs':
      result = await import('date-fns/locale/cs')

      break
    case 'de':
      result = await import('date-fns/locale/de')

      break
    case 'en-US':
      result = await import('date-fns/locale/en-US')

      break
    case 'es':
      result = await import('date-fns/locale/es')

      break
    case 'fa-IR':
      result = await import('date-fns/locale/fa-IR')

      break
    case 'fr':
      result = await import('date-fns/locale/fr')

      break
    case 'he':
      result = await import('date-fns/locale/he')

      break
    case 'hr':
      result = await import('date-fns/locale/hr')

      break
    case 'hu':
      result = await import('date-fns/locale/hu')

      break
    case 'it':
      result = await import('date-fns/locale/it')

      break
    case 'ja':
      result = await import('date-fns/locale/ja')

      break
    case 'ko':
      result = await import('date-fns/locale/ko')

      break
    case 'nb':
      result = await import('date-fns/locale/nb')

      break
    case 'nl':
      result = await import('date-fns/locale/nl')

      break
    case 'pl':
      result = await import('date-fns/locale/pl')

      break
    case 'pt':
      result = await import('date-fns/locale/pt')

      break
    case 'ro':
      result = await import('date-fns/locale/ro')

      break
    case 'ru':
      result = await import('date-fns/locale/ru')

      break
    case 'sk':
      result = await import('date-fns/locale/sk')

      break
    case 'sv':
      result = await import('date-fns/locale/sv')

      break
    case 'th':
      result = await import('date-fns/locale/th')

      break
    case 'tr':
      result = await import('date-fns/locale/tr')

      break
    case 'uk':
      result = await import('date-fns/locale/uk')

      break
    case 'vi':
      result = await import('date-fns/locale/vi')

      break
    case 'zh-CN':
      result = await import('date-fns/locale/zh-CN')

      break
    case 'zh-TW':
      result = await import('date-fns/locale/zh-TW')

      break
  }

  if (result.default) return result.default

  return result as Locale
}
