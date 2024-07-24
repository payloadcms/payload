import { ListItemNode, ListNode } from '@lexical/list'

// eslint-disable-next-line payload/no-imports-from-exports-dir
import { UnorderedListFeatureClient } from '../../../exports/client/index.js'
import { createServerFeature } from '../../../utilities/createServerFeature.js'
import { createNode } from '../../typeUtilities.js'
import { ListHTMLConverter, ListItemHTMLConverter } from '../htmlConverter.js'
import { i18n } from './i18n.js'
import { UNORDERED_LIST } from './markdownTransformer.js'

export const UnorderedListFeature = createServerFeature({
  feature: {
    ClientFeature: UnorderedListFeatureClient,
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
