import { createServerFeature } from '../../index.js'
import { payloadDefaultColors } from './defaultColors.js'

type Color = { dark: string; label?: string; light: string; name: string }
// OR MAYBE:
// type Color = { label?: string; name: string, css:"color:red;--payload-dark:red2" }

type ColorsCallback = ({
  defaultColors,
  // t,
}: {
  defaultColors: typeof payloadDefaultColors
  // t: TFunction
}) => Color[]

export type TextColorFeatureProps = {
  backgroundColors?: Color[] | ColorsCallback
  textColors?: Color[] | ColorsCallback
}

export type TextColorSanitizedProps = {
  backgroundColors: Color[]
  textColors: Color[]
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
  TextColorSanitizedProps,
  TextColorFeatureProps
>({
  feature: ({ props }) => {
    const backgroundColors =
      typeof props.backgroundColors === 'function'
        ? props.backgroundColors({ defaultColors: payloadDefaultColors })
        : props.backgroundColors
    const textColors =
      typeof props.textColors === 'function'
        ? props.textColors({ defaultColors: payloadDefaultColors })
        : props.textColors

    return {
      ClientFeature: '@payloadcms/richtext-lexical/client#TextColorFeatureClient',
      clientFeatureProps: {
        backgroundColors,
        textColors,
      },
    }
  },
  key: 'textColor',
})
