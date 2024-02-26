import type { GenerateEditViewMetadata } from '../Document'

import { meta } from '../../utilities/meta'

export const generateMetadata: GenerateEditViewMetadata = async ({ config }) => {
  return meta({
    config,
    description: 'API',
    keywords: 'API',
    title: 'API',
  })
}
