// eslint-disable-next-line payload/no-imports-from-exports-dir
import { UnderlineFeatureClient } from '../../../exports/client/index.js'
import { createServerFeature } from '../../../utilities/createServerFeature.js'

export const UnderlineFeature = createServerFeature({
  feature: {
    ClientFeature: UnderlineFeatureClient,
  },
  key: 'underline',
})
