import { ListItemNode, ListNode } from '@lexical/list'

import { createServerFeature } from '../../../../utilities/createServerFeature.js'
import { createNode } from '../../../typeUtilities.js'
import { UNORDERED_LIST } from '../markdownTransformer.js'
import { i18n } from './i18n.js'

export const UnorderedListFeature = createServerFeature({
  feature: {
    ClientFeature: '@payloadcms/richtext-lexical/client#UnorderedListFeatureClient',
    i18n,
    markdownTransformers: [UNORDERED_LIST],
    nodes: [
      createNode({
        node: ListNode,
      }),
      createNode({
        node: ListItemNode,
      }),
    ],
  },
  key: 'unorderedList',
})
