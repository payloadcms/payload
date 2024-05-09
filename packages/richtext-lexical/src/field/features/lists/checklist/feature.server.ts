import { ListItemNode, ListNode } from '@lexical/list'

import type { FeatureProviderProviderServer } from '../../types.js'

import { createNode } from '../../typeUtilities.js'
import { ListHTMLConverter, ListItemHTMLConverter } from '../htmlConverter.js'
import { ChecklistFeatureClientComponent } from './feature.client.js'
import { CHECK_LIST } from './markdownTransformers.js'

export const ChecklistFeature: FeatureProviderProviderServer<undefined, undefined> = (props) => {
  return {
    feature: ({ featureProviderMap }) => {
      return {
        ClientComponent: ChecklistFeatureClientComponent,
        markdownTransformers: [CHECK_LIST],
        nodes:
          featureProviderMap.has('unorderedList') || featureProviderMap.has('orderedList')
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
    key: 'checklist',
    serverFeatureProps: props,
  }
}
