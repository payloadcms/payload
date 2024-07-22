import { ListItemNode, ListNode } from '@lexical/list'

import { createServerFeature } from '../../../utilities/createServerFeature.js'
import { createNode } from '../../typeUtilities.js'
import { ListHTMLConverter, ListItemHTMLConverter } from '../htmlConverter.js'
import { i18n } from './i18n.js'
import { UNORDERED_LIST } from './markdownTransformer.js'

export const UnorderedListFeature = createServerFeature({
  feature: {
    ClientFeature: '../../../exports/client/index.js#UnorderedListFeatureClient',
    i18n,
    markdownTransformers: [UNORDERED_LIST],
    nodes: [
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
  },
  key: 'unorderedList',
})
