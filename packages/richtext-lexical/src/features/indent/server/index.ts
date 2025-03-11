import { createServerFeature } from '../../../utilities/createServerFeature.js'
import { i18n } from './i18n.js'

export type IndentFeatureProps = {
  /**
   * The nodes that should not be indented. "type" property of the nodes you don't want to be indented.
   * These can be: "paragraph", "heading", "listitem", "quote" or other indentable nodes if they exist.
   */
  disabledNodes?: string[]
}

/**
 * This feature is used to indent and outdent the text in the editor.
 *
 * @param props - The props for the feature.
 * @param props.disabledNodes - The nodes that should not be indented. "type" property of the nodes you don't want to be indented. These can be: "paragraph", "heading", "listitem", "quote" or other indentable nodes if they exist.
 */
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
