import type { Locale } from 'date-fns'

export const importDateFNSLocale = async (locale: string): Promise<Locale> => {
  let result

  switch (locale) {
    case 'ar':
      result = (await import('date-fns/locale/ar')).ar

      break
    case 'az':
      result = (await import('date-fns/locale/az')).az

      break
    case 'bg':
      result = (await import('date-fns/locale/bg')).bg

      break
    case 'ca':
      result = (await import('date-fns/locale/ca')).ca

      break
    case 'cs':
      result = (await import('date-fns/locale/cs')).cs

      break
    case 'da':
      result = (await import('date-fns/locale/da')).da

      break
    case 'de':
      result = (await import('date-fns/locale/de')).de

      break
    case 'en-US':
      result = (await import('date-fns/locale/en-US')).enUS

      break
    case 'es':
      result = (await import('date-fns/locale/es')).es

      break
    case 'et':
      result = (await import('date-fns/locale/et')).et

      break
    case 'fa-IR':
      result = (await import('date-fns/locale/fa-IR')).faIR

      break
    case 'fr':
      result = (await import('date-fns/locale/fr')).fr

      break
    case 'he':
      result = (await import('date-fns/locale/he')).he

      break
    case 'hr':
      result = (await import('date-fns/locale/hr')).hr

      break
    case 'hu':
      result = (await import('date-fns/locale/hu')).hu

      break
    case 'it':
      result = (await import('date-fns/locale/it')).it

      break
    case 'ja':
      result = (await import('date-fns/locale/ja')).ja

      break
    case 'ko':
      result = (await import('date-fns/locale/ko')).ko

      break
    case 'lt':
      result = (await import('date-fns/locale/lt')).lt

      break
    case 'nb':
      result = (await import('date-fns/locale/nb')).nb

      break
    case 'nl':
      result = (await import('date-fns/locale/nl')).nl

      break
    case 'pl':
      result = (await import('date-fns/locale/pl')).pl

      break
    case 'pt':
      result = (await import('date-fns/locale/pt')).pt

      break
    case 'ro':
      result = (await import('date-fns/locale/ro')).ro

      break
    case 'rs':
      result = (await import('date-fns/locale/sr')).sr

      break
    case 'rs-Latin':
      result = (await import('date-fns/locale/sr-Latn')).srLatn

      break
    case 'ru':
      result = (await import('date-fns/locale/ru')).ru

      break
    case 'sk':
      result = (await import('date-fns/locale/sk')).sk

      break
    case 'sl-SI':
      result = (await import('date-fns/locale/sl')).sl

      break
    case 'sv':
      result = (await import('date-fns/locale/sv')).sv

      break
    case 'th':
      result = (await import('date-fns/locale/th')).th

      break
    case 'tr':
      result = (await import('date-fns/locale/tr')).tr

      break
    case 'uk':
      result = (await import('date-fns/locale/uk')).uk

      break
    case 'vi':
      result = (await import('date-fns/locale/vi')).vi

      break
    case 'zh-CN':
      result = (await import('date-fns/locale/zh-CN')).zhCN

      break
    case 'zh-TW':
      result = (await import('date-fns/locale/zh-TW')).zhTW

      break
  }

  // @ts-expect-error - I'm not sure if this is still necessary.
  if (result?.default) {
    // @ts-expect-error - I'm not sure if this is still necessary.
    return result.default
  }

  return result as Locale
}
