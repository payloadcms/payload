import { ListItemNode, ListNode } from '@lexical/list'
import { UNORDERED_LIST } from '@lexical/markdown'

import { createServerFeature } from '../../../../utilities/createServerFeature.js'
import { createNode } from '../../../typeUtilities.js'
import { listItemNodeJSONSchema, listNodeJSONSchema } from '../../shared/schema.js'
import { i18n } from './i18n.js'

export const UnorderedListFeature = createServerFeature({
  feature: {
    ClientFeature: '@payloadcms/richtext-lexical/client#UnorderedListFeatureClient',
    i18n,
    markdownTransformers: [UNORDERED_LIST],
    nodes: [
      createNode({
        jsonSchema: listNodeJSONSchema,
        node: ListNode,
      }),
      createNode({
        jsonSchema: listItemNodeJSONSchema,
        node: ListItemNode,
      }),
    ],
  },
  key: 'unorderedList',
})
