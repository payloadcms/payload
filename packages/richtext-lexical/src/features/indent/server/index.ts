import { createServerFeature } from '../../../utilities/createServerFeature.js'
import { i18n } from './i18n.js'

export type IndentFeatureProps = {
  /**
   * The nodes that should not be indented. "type" property of the nodes you don't want to be indented.
   * These can be: "paragraph", "heading", "listitem", "quote" or other indentable nodes if they exist.
   */
  disabledNodes?: string[]
  /**
   * If true, pressing Tab in the middle of a block such as a paragraph or heading will not insert a tabNode.
   * Instead, Tab will only be used for block-level indentation.
   *
   * @default false
   */
  disableTabNode?: boolean
}

export const IndentFeature = createServerFeature<
  IndentFeatureProps,
  IndentFeatureProps,
  IndentFeatureProps
>({
  feature: ({ props }) => {
    return {
      ClientFeature: '@payloadcms/richtext-lexical/client#IndentFeatureClient',
      clientFeatureProps: props,
      i18n,
    }
  },
  key: 'indent',
})
