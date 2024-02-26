import type { Metadata } from 'next'

import type { GenerateEditViewMetadata } from '../Document'

import { meta } from '../../utilities/meta'

export const generateMetadata: GenerateEditViewMetadata = async ({
  config,
  t,
}): Promise<Metadata> => {
  // const useAsTitle = collection?.admin?.useAsTitle || 'id'
  // metaTitle = `${t('version')} - ${formattedCreatedAt} - ${doc[useAsTitle]} - ${entityLabel}`
  // metaDesc = t('viewingVersion', { documentTitle: doc[useAsTitle], entityLabel })

  // metaTitle = `${t('version')} - ${formattedCreatedAt} - ${entityLabel}`
  // metaDesc = t('viewingVersionGlobal', { entityLabel })

  return meta({
    config,
    description: '',
    keywords: '',
    title: '',
  })
}
