import type { GenerateEditViewMetadata } from '../Document/getMetaBySegment.js'

import { meta } from '../../utilities/meta.js'

export const generateMetadata: GenerateEditViewMetadata = async ({ config }) =>
  meta({
    config,
    description: 'API',
    keywords: 'API',
    title: 'API',
  })
