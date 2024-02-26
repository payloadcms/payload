import type { Metadata } from 'next'

import type { GenerateEditViewMetadata } from '../Document'

import { meta } from '../../utilities/meta'

export const generateMetadata: GenerateEditViewMetadata = async ({
  config,
  isEditing,
}): Promise<Metadata> => {
  // Globals:
  // description={getTranslation(label, i18n)}
  // keywords={`${getTranslation(label, i18n)}, Payload, CMS`}
  // title={getTranslation(label, i18n)}

  return meta({
    config,
    // description: `${isEditing ? t('editing') : t('creating')} - ${getTranslation(
    //   collection.labels.singular,
    //   i18n,
    // )}`,
    // keywords: `${getTranslation(collection.labels.singular, i18n)}, Payload, CMS`,
    // title: `${isEditing ? t('editing') : t('creating')} - ${getTranslation(
    //   collection.labels.singular,
    //   i18n,
    // )}`,
  })
}
