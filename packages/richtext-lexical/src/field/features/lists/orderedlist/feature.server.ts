import { ListItemNode, ListNode } from '@lexical/list'

import type { FeatureProviderProviderServer } from '../../types'

import { ListHTMLConverter, ListItemHTMLConverter } from '../htmlConverter'
import { OrderedListFeatureClientComponent } from './feature.client'
import { ORDERED_LIST } from './markdownTransformer'

export const OrderedListFeature: FeatureProviderProviderServer<undefined, undefined> = (props) => {
  return {
    feature: ({ featureProviderMap }) => {
      return {
        ClientComponent: OrderedListFeatureClientComponent,
        markdownTransformers: [ORDERED_LIST],
        nodes: featureProviderMap.has('unorderedlist')
          ? []
          : [
              {
                converters: {
                  html: ListHTMLConverter,
                },
                node: ListNode,
              },
              {
                converters: {
                  html: ListItemHTMLConverter,
                },
                node: ListItemNode,
              },
            ],
        serverFeatureProps: props,
      }
    },
    key: 'orderedlist',
    serverFeatureProps: props,
  }
}
