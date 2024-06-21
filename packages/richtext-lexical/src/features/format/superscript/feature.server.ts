// eslint-disable-next-line payload/no-imports-from-exports-dir
import { SuperscriptFeatureClient } from '../../../exports/client/index.js'
import { createServerFeature } from '../../../utilities/createServerFeature.js'

export const SuperscriptFeature = createServerFeature({
  feature: {
    ClientFeature: SuperscriptFeatureClient,
  },
  key: 'superscript',
})
