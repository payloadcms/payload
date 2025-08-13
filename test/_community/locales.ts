import { Locale } from 'payload'

const locales: Locale[] = [
  {
    code: 'en',
    label: 'English',
  },
  {
    code: 'en-dk',
    label: 'English - Denmark',
  },
  {
    code: 'da-dk',
    label: 'Danish - Denmark',
  },
  {
    code: 'sq-al',
    label: 'Albanian - Albania',
  },
  {
    code: 'de-de',
    label: 'German - Germany',
  },
  {
    code: 'en-de',
    label: 'English - Germany',
  },
  {
    code: 'nl-nl',
    label: 'Dutch - Netherlands',
  },
  {
    code: 'en-nl',
    label: 'English - Netherlands',
  },
  {
    code: 'es-es',
    label: 'Spanish - Spain',
  },
  {
    code: 'en-es',
    label: 'English - Spain',
  },
  {
    code: 'fr-fr',
    label: 'French - France',
  },
  {
    code: 'en-fr',
    label: 'English - France',
  },
  {
    code: 'fr-be',
    label: 'French - Belgium',
  },
  {
    code: 'nl-be',
    label: 'Dutch - Belgium',
  },
  {
    code: 'en-be',
    label: 'English - Belgium',
  },
  {
    code: 'de-ch',
    label: 'German - Switzerland',
  },
  {
    code: 'fr-ch',
    label: 'French - Switzerland',
  },
  {
    code: 'en-ch',
    label: 'English - Switzerland',
  },
  {
    code: 'it-it',
    label: 'Italian - Italy',
  },
  {
    code: 'en-it',
    label: 'English - Italy',
  },
  {
    code: 'nb-no',
    label: 'Norwegian - Norway',
  },
  {
    code: 'en-no',
    label: 'English - Norway',
  },
  {
    code: 'sv-se',
    label: 'Swedish - Sweden',
  },
  {
    code: 'en-se',
    label: 'English - Sweden',
  },
  {
    code: 'fi-fi',
    label: 'Finnish - Finland',
  },
  {
    code: 'en-fi',
    label: 'English - Finland',
  },
  {
    code: 'de-at',
    label: 'German - Austria',
  },
  {
    code: 'en-at',
    label: 'English - Austria',
  },
  {
    code: 'en-gb',
    label: 'English - United Kingdom',
  },
  {
    code: 'en-ie',
    label: 'English - Ireland',
  },
  {
    code: 'pl-pl',
    label: 'Polish - Poland',
  },
  {
    code: 'en-us',
    label: 'English - United States',
  },
  {
    code: 'pt-pt',
    label: 'Portuguese - Portugal',
  },
  {
    code: 'en-pt',
    label: 'English - Portugal',
  },
  {
    code: 'fr-lu',
    label: 'French - Luxembourg',
  },
  {
    code: 'de-lu',
    label: 'German - Luxembourg',
  },
  {
    code: 'en-lu',
    label: 'English - Luxembourg',
  },
  {
    code: 'el-gr',
    label: 'Greek - Greece',
  },
  {
    code: 'en-gr',
    label: 'English - Greece',
  },
  {
    code: 'lt-lt',
    label: 'Lithuanian - Lithuania',
  },
  {
    code: 'hu-hu',
    label: 'Hungarian - Hungary',
  },
  {
    code: 'cs-cz',
    label: 'Czech - Czech Republic',
  },
  {
    code: 'et-ee',
    label: 'Estonian - Estonia',
  },
  {
    code: 'ro-ro',
    label: 'Romanian - Romania',
  },
  {
    code: 'lv-lv',
    label: 'Latvian - Latvia',
  },
  {
    code: 'bg-bg',
    label: 'Bulgarian - Bulgaria',
  },
  {
    code: 'sk-sk',
    label: 'Slovak - Slovakia',
  },
  {
    code: 'el-cy',
    label: 'Greek - Cyprus',
  },
  {
    code: 'ar-ae',
    label: 'Arabic - United Arab Emirates',
  },
  {
    code: 'sl-si',
    label: 'Slovenian - Slovenia',
  },
  {
    code: 'hr-hr',
    label: 'Croatian - Croatia',
  },
  {
    code: 'mt-mt',
    label: 'Maltese - Malta',
  },
  {
    code: 'bs-ba',
    label: 'Bosnian - Bosnia & Herzegovina',
  },
  {
    code: 'sr-rs',
    label: 'Serbian - Serbia',
  },
  {
    code: 'es-ad',
    label: 'Spanish - Andorra',
  },
  {
    code: 'fr-ma',
    label: 'French - Morocco',
  },
  {
    code: 'fr-mc',
    label: 'French - Monaco',
  },
  {
    code: 'ar-eg',
    label: 'Arabic - Egypt',
  },
  {
    code: 'ar-sa',
    label: 'Arabic - Saudi Arabia',
  },
  {
    code: 'ar-kw',
    label: 'Arabic - Kuwait',
  },
  {
    code: 'ar-qa',
    label: 'Arabic - Qatar',
  },
  {
    code: 'sr-me',
    label: 'Serbian - Montenegro',
  },
  {
    code: 'ar-jo',
    label: 'Arabic - Jordan',
  },
  {
    code: 'fr-dz',
    label: 'French - Algeria',
  },
  {
    code: 'hy-am',
    label: 'Armenian - Armenia',
  },
  {
    code: 'mk-mk',
    label: 'Macedonian - North Macedonia',
  },
  {
    code: 'fr-tn',
    label: 'French - Tunesia',
  },
  {
    code: 'uk-ua',
    label: 'Ukranian - Ukraine',
  },
]

const sortedLocales = locales.sort((a, b) => {
  if (a.code === 'en' || b.code === 'en') {
    return 1
  }
  if (a.label < b.label) {
    return -1
  }
  if (a.label > b.label) {
    return 1
  }
  return 0
})

export default sortedLocales
