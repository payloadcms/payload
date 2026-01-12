import { ListItemNode, ListNode } from '@lexical/list'

import { createServerFeature } from '../../../../utilities/createServerFeature.js'
import { createNode } from '../../../typeUtilities.js'
import { ListHTMLConverter, ListItemHTMLConverter } from '../../htmlConverter.js'
import { UNORDERED_LIST } from '../markdownTransformer.js'
import { i18n } from './i18n.js'

export const UnorderedListFeature = createServerFeature({
  feature: {
    ClientFeature: '@payloadcms/richtext-lexical/client#UnorderedListFeatureClient',
    i18n,
    markdownTransformers: [UNORDERED_LIST],
    nodes: [
      createNode({
        converters: {
          html: ListHTMLConverter as any, // ListHTMLConverter uses a different generic type than ListNode[exportJSON], thus we need to cast as any
        },
        node: ListNode,
      }),
      createNode({
        converters: {
          html: ListItemHTMLConverter as any,
        },
        node: ListItemNode,
      }),
    ],
  },
  key: 'unorderedList',
})
