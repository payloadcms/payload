import type { Metadata } from 'next'

import type { GenerateEditViewMetadata } from '../Document'

import { meta } from '../../utilities/meta'

export const generateMetadata: GenerateEditViewMetadata = async ({
  config,
  t,
}): Promise<Metadata> => {
  // const useAsTitle = collection?.admin?.useAsTitle || 'id'
  // metaTitle = `${t('versions')} - ${data[useAsTitle]} - ${entityLabel}`
  // metaDesc = t('viewingVersions', { documentTitle: data[useAsTitle], entityLabel })

  // metaTitle = `${t('versions')} - ${entityLabel}`
  // metaDesc = t('viewingVersionsGlobal', { entityLabel })

  return meta({
    config,
    description: '',
    keywords: '',
    title: '',
  })
}
