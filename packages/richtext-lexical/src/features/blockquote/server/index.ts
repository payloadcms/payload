import { QUOTE } from '@lexical/markdown'
import { QuoteNode } from '@lexical/rich-text'

import { createServerFeature } from '../../../utilities/createServerFeature.js'
import { createNode } from '../../typeUtilities.js'
import { i18n } from './i18n.js'
import { quoteNodeJSONSchema } from './schema.js'

export type { SerializedQuoteNode } from './schema.js'

export const BlockquoteFeature = createServerFeature({
  feature: {
    ClientFeature: '@payloadcms/richtext-lexical/client#BlockquoteFeatureClient',
    clientFeatureProps: null,
    i18n,
    markdownTransformers: [QUOTE],
    nodes: [
      createNode({
        jsonSchema: quoteNodeJSONSchema,
        node: QuoteNode,
      }),
    ],
  },
  key: 'blockquote',
})
