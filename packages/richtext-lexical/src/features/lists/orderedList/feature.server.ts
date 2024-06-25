import { ListItemNode, ListNode } from '@lexical/list'

// eslint-disable-next-line payload/no-imports-from-exports-dir
import { OrderedListFeatureClient } from '../../../exports/client/index.js'
import { createServerFeature } from '../../../utilities/createServerFeature.js'
import { createNode } from '../../typeUtilities.js'
import { ListHTMLConverter, ListItemHTMLConverter } from '../htmlConverter.js'
import { i18n } from './i18n.js'
import { ORDERED_LIST } from './markdownTransformer.js'

export const OrderedListFeature = createServerFeature({
  feature: ({ featureProviderMap }) => {
    return {
      ClientFeature: OrderedListFeatureClient,
      i18n,
      markdownTransformers: [ORDERED_LIST],
      nodes: featureProviderMap.has('unorderedList')
        ? []
        : [
            createNode({
              converters: {
                html: ListHTMLConverter,
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
