import lexicalListImport from '@lexical/list'
const { ListItemNode, ListNode } = lexicalListImport

import type { FeatureProviderProviderServer } from '../../types.js'

import { createNode } from '../../typeUtilities.js'
import { ListHTMLConverter, ListItemHTMLConverter } from '../htmlConverter.js'
import { CheckListFeatureClientComponent } from './feature.client.js'
import { CHECK_LIST } from './markdownTransformers.js'

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
