import { ListItemNode, ListNode } from '@lexical/list'

import type { FeatureProviderProviderServer } from '../../types'

import { ListHTMLConverter, ListItemHTMLConverter } from '../htmlConverter'
import { CheckListFeatureClientComponent } from './feature.client'
import { CHECK_LIST } from './markdownTransformers'

export const CheckListFeature: FeatureProviderProviderServer<undefined, undefined> = (props) => {
  return {
    feature: ({ featureProviderMap }) => {
      return {
        ClientComponent: CheckListFeatureClientComponent,
        markdownTransformers: [CHECK_LIST],
        nodes:
          featureProviderMap.has('unorderedlist') || featureProviderMap.has('orderedlist')
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
    key: 'checklist',
    serverFeatureProps: props,
  }
}
