import { createServerFeature } from '../../index.js'

export type TextAttributesFeatureProps = {
  [T in string]: (key: T) => string | undefined
}

/**
 * It allows you to enable styles on text nodes in a way that is:
 * - Safe: add, modify or delete styles without fear of getting runtime breaking changes with editorStates you stored previously.
 * - Clipboard compatible: the setters you define will also be used when pasting text from the clipboard (by default styles are not imported when pasting).
 * - Flexible: Do you want to accept only a specific red? You can convert similar reds of other shades to the one you support, or simply ignore them.
 */
export const TextAttributesFeature = createServerFeature<
  TextAttributesFeatureProps,
  TextAttributesFeatureProps,
  TextAttributesFeatureProps
>({
  feature: ({ props }) => {
    return {
      ClientFeature: '@payloadcms/richtext-lexical/client#TextAttributesFeatureClient',
      clientFeatureProps: props,
    }
  },
  key: 'textAttributes',
})
