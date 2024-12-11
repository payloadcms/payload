import { createServerFeature } from '../../index.js'

export type TextColorFeatureProps = {
  bgColors?: { classSuffix: string; label: string }[]
  /**
   * TO-DO: see i18n patterns. The user should provide it in label
   */
  colors?: { classSuffix: string; label: string }[]
}

/**
 *
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
