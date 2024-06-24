import { ListItemNode, ListNode } from '@lexical/list'

// eslint-disable-next-line payload/no-imports-from-exports-dir
import { ChecklistFeatureClient } from '../../../exports/client/index.js'
import { createServerFeature } from '../../../utilities/createServerFeature.js'
import { createNode } from '../../typeUtilities.js'
import { ListHTMLConverter, ListItemHTMLConverter } from '../htmlConverter.js'
import { i18n } from './i18n.js'
import { CHECK_LIST } from './markdownTransformers.js'

export const ChecklistFeature = createServerFeature({
  feature: ({ featureProviderMap }) => {
    return {
      ClientFeature: ChecklistFeatureClient,
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
    }
  },
  key: 'checklist',
})
