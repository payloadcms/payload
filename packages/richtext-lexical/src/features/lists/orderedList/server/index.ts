import { ListItemNode, ListNode } from '@lexical/list'

import { createServerFeature } from '../../../../utilities/createServerFeature.js'
import { createNode } from '../../../typeUtilities.js'
import { shouldRegisterListBaseNodes } from '../../shared/shouldRegisterListBaseNodes.js'
import { ORDERED_LIST } from '../markdownTransformer.js'
import { i18n } from './i18n.js'

export const OrderedListFeature = createServerFeature({
  feature: ({ featureProviderMap }) => {
    return {
      ClientFeature: '@payloadcms/richtext-lexical/client#OrderedListFeatureClient',
      i18n,
      markdownTransformers: [ORDERED_LIST],
      nodes: shouldRegisterListBaseNodes('ordered', featureProviderMap)
        ? [
            createNode({
              node: ListNode,
            }),
            createNode({
              node: ListItemNode,
            }),
          ]
        : [],
    }
  },
  key: 'orderedList',
})
