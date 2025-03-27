import { createServerFeature } from '../../index.js'

export type TextStylesFeatureProps = {
  styles: { [key: string]: { [possibleValue: string]: { css: string; label: string } } }
}

/**
 * TODO
 */
export const TextStylesFeature = createServerFeature<
  TextStylesFeatureProps,
  TextStylesFeatureProps,
  TextStylesFeatureProps
>({
  feature: ({ props }) => {
    return {
      ClientFeature: '@payloadcms/richtext-lexical/client#TextStylesFeatureClient',
      clientFeatureProps: {
        styles: props.styles,
      },
    }
  },
  key: 'textStyles',
})
