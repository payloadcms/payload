import { ListItemNode, ListNode } from '@lexical/list'

import type { FeatureProviderProviderServer } from '../../types'

import { ListHTMLConverter, ListItemHTMLConverter } from '../htmlConverter'
import { UnorderedListFeatureClientComponent } from './feature.client'
import { UNORDERED_LIST } from './markdownTransformer'

export const UnorderedListFeature: FeatureProviderProviderServer<undefined, undefined> = (
  props,
) => {
  return {
    feature: () => {
      return {
        ClientComponent: UnorderedListFeatureClientComponent,
        markdownTransformers: [UNORDERED_LIST],
        nodes: [
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
    key: 'unorderedlist',
    serverFeatureProps: props,
  }
}
