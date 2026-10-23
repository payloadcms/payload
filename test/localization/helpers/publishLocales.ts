import type { Payload } from 'payload'

import type { AllFieldsLocalized } from '../payload-types.js'

import {
  allFieldsLocalizedSlug,
  defaultLocale,
  englishTitle,
  localizedStatusSharedGlobalSlug,
  spanishLocale,
  spanishTitle,
} from '../shared.js'

export async function publishSharedCollectionLocales({
  data = {},
  payload,
}: {
  data?: Partial<AllFieldsLocalized>
  payload: Payload
}) {
  const doc = await payload.create({
    collection: allFieldsLocalizedSlug,
    data: {
      nonLocalizedGroup: { nonLocalizedText: 'shared published' },
      text: 'english published',
      ...data,
      _status: 'published',
    },
    locale: defaultLocale,
    overrideAccess: true,
  })

  await payload.update({
    id: doc.id,
    collection: allFieldsLocalizedSlug,
    data: { _status: 'published', text: 'spanish published' },
    locale: spanishLocale,
    overrideAccess: true,
  })

  return doc
}

export async function publishSharedGlobalLocales({ payload }: { payload: Payload }) {
  for (const [locale, localizedText] of [
    [defaultLocale, englishTitle],
    [spanishLocale, spanishTitle],
  ] as const) {
    await payload.updateGlobal({
      slug: localizedStatusSharedGlobalSlug,
      data: { _status: 'published', localizedText, sharedText: 'shared published' },
      locale,
      overrideAccess: true,
    })
  }
}
