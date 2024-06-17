import { ListItemNode, ListNode } from '@lexical/list'

import type { FeatureProviderProviderServer } from '../../types.js'

// eslint-disable-next-line payload/no-imports-from-exports-dir
import { ChecklistFeatureClientComponent } from '../../../../exports/client/index.js'
import { createNode } from '../../typeUtilities.js'
import { ListHTMLConverter, ListItemHTMLConverter } from '../htmlConverter.js'
import { i18n } from './i18n.js'
import { CHECK_LIST } from './markdownTransformers.js'

export const ChecklistFeature: FeatureProviderProviderServer<undefined, undefined> = (props) => {
  return {
    feature: ({ featureProviderMap }) => {
      return {
        ClientComponent: ChecklistFeatureClientComponent,
        i18n,
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
