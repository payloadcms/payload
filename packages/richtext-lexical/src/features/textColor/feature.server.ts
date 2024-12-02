import { createServerFeature } from '../../index.js'

export type TextColorFeatureProps = {
  backgroundColors?: { inDarkMode: string; inLightMode: string; label: string }[]
  /**
   * TO-DO: see i18n patterns. The user should provide it in label
   */
  colors: { inDarkMode: string; inLightMode: string; label: string }[]
  /**
   * Needed for two reasons:
   * 1. Pasting text with color from other sources.
   * 2. Making backwards compatible changes
   *
   * TO-DO: see how to implement it, because you can't send functions to the server.
   */
  normalizeColor?: (color: string) => string
}

/**
 * Allows you to add colors to the text and to the text background.
 *
 * @remarks
 * - If you modify or remove a color, the old color will remain where it was used. You can avoid its use with a TextNode Transform (see https://lexical.dev/docs/concepts/transforms).
 * - If you paste content that was copied from external sources into the Payload editor itself, the colors will not be pasted. For that you will have to modify the HTML -> TextNode serialization. This is not necessary if the text was copied inside the Payload editor.
 */
export const TextColorFeature = createServerFeature<
  TextColorFeatureProps,
  TextColorFeatureProps,
  TextColorFeatureProps
>({
  feature: ({ props }) => {
    return {
      ClientFeature: '@payloadcms/richtext-lexical/client#TextColorFeatureClient',
      clientFeatureProps: props,
    }
  },
  key: 'textColor',
})
