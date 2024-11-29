import { createServerFeature } from '../../index.js'

export type TextAttributesFeatureProps = {
  /**
   * TO-DO: see i18n patterns. The user should provide it in label
   */
  colors: { label: string; value: string }[]
  /**
   * Needed for two reasons:
   * 1. Pasting text with color from other sources.
   * 2. Making backwards compatible changes
   *
   * TO-DO: see how to implement it, because you can't send functions to the server.
   */
  normalizeColor?: (color: string) => string
}

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
