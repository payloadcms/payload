import { ListItemNode, ListNode } from '@lexical/list'

import { createServerFeature } from '../../../../utilities/createServerFeature.js'
import { createNode } from '../../../typeUtilities.js'
import { ListHTMLConverter, ListItemHTMLConverter } from '../../htmlConverter.js'
import { ORDERED_LIST } from '../markdownTransformer.js'
import { i18n } from './i18n.js'

export const OrderedListFeature = createServerFeature({
  feature: ({ featureProviderMap }) => {
    return {
      ClientFeature: '@payloadcms/richtext-lexical/client#OrderedListFeatureClient',
      i18n,
      markdownTransformers: [ORDERED_LIST],
      nodes: featureProviderMap.has('unorderedList')
        ? []
        : [
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
    }
  },
  key: 'orderedList',
})
