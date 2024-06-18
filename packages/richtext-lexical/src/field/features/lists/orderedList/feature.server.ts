import { ListItemNode, ListNode } from '@lexical/list'

import type { FeatureProviderProviderServer } from '../../types.js'

// eslint-disable-next-line payload/no-imports-from-exports-dir
import { OrderedListFeatureClientComponent } from '../../../../exports/client/index.js'
import { createNode } from '../../typeUtilities.js'
import { ListHTMLConverter, ListItemHTMLConverter } from '../htmlConverter.js'
import { i18n } from './i18n.js'
import { ORDERED_LIST } from './markdownTransformer.js'

export const OrderedListFeature: FeatureProviderProviderServer<undefined, undefined> = (props) => {
  return {
    feature: ({ featureProviderMap }) => {
      return {
        ClientComponent: OrderedListFeatureClientComponent,
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
                  html: ListItemHTMLConverter,
                },
                node: ListItemNode,
              }),
            ],
        serverFeatureProps: props,
      }
    },
    key: 'orderedList',
    serverFeatureProps: props,
  }
}
