import { ListItemNode, ListNode } from '@lexical/list'
import { ORDERED_LIST } from '@lexical/markdown'

import { createServerFeature } from '../../../../utilities/createServerFeature.js'
import { createNode } from '../../../typeUtilities.js'
import { listItemNodeJSONSchema, listNodeJSONSchema } from '../../shared/schema.js'
import { shouldRegisterListBaseNodes } from '../../shared/shouldRegisterListBaseNodes.js'
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
              jsonSchema: listNodeJSONSchema,
              node: ListNode,
            }),
            createNode({
              jsonSchema: listItemNodeJSONSchema,
              node: ListItemNode,
            }),
          ]
        : [],
    }
  },
  key: 'orderedList',
})
