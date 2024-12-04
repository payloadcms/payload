import { createServerFeature } from '../../index.js'

type TextClassSetting = {
  childComponent: string
  classPrefix: string
  classSuffixes: string[]
  toolbarFixed?: boolean
  toolbarInline?: boolean
}

export type TextClassesFeatureProps = {
  settings: TextClassSetting[]
}

/**
 * It allows you to enable styles on text nodes in a way that is:
 * - Safe: add, modify or delete styles without fear of getting runtime breaking changes with editorStates you stored previously.
 * - Clipboard compatible: the setters you define will also be used when pasting text from the clipboard (by default styles are not imported when pasting).
 * - Flexible: Do you want to accept only a specific red? You can convert similar reds of other shades to the one you support, or simply ignore them.
 */
export const TextClassesFeature = createServerFeature<
  TextClassesFeatureProps,
  TextClassesFeatureProps,
  TextClassesFeatureProps
>({
  feature: ({ props }) => {
    return {
      ClientFeature: '@payloadcms/richtext-lexical/client#TextClassesFeatureClient',
      clientFeatureProps: props,
    }
  },
  key: 'TextClasses',
})
