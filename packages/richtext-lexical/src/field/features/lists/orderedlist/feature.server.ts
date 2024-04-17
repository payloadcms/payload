import lexicalListImport from '@lexical/list'
const { ListItemNode, ListNode } = lexicalListImport

import type { FeatureProviderProviderServer } from '../../types.js'

import { createNode } from '../../typeUtilities.js'
import { ListHTMLConverter, ListItemHTMLConverter } from '../htmlConverter.js'
import { OrderedListFeatureClientComponent } from './feature.client.js'
import { ORDERED_LIST } from './markdownTransformer.js'

export const OrderedListFeature: FeatureProviderProviderServer<undefined, undefined> = (props) => {
  return {
    feature: ({ featureProviderMap }) => {
      return {
        ClientComponent: OrderedListFeatureClientComponent,
        markdownTransformers: [ORDERED_LIST],
        nodes: featureProviderMap.has('unorderedlist')
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
    key: 'orderedlist',
    serverFeatureProps: props,
  }
}
