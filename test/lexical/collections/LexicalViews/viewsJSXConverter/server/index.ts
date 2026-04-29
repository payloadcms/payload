import { createServerFeature } from '@payloadcms/richtext-lexical'

export type DebugViewsJSXConverterFeatureProps = {
  type: 'default' | 'frontend'
}

export const DebugViewsJSXConverterFeature = createServerFeature<
  DebugViewsJSXConverterFeatureProps,
  DebugViewsJSXConverterFeatureProps,
  DebugViewsJSXConverterFeatureProps
>({
  feature: ({ props: _props }) => {
    return {
      ClientFeature:
        './collections/LexicalViews/viewsJSXConverter/client/index.js#DebugViewsJsxConverterFeatureClient',
      sanitizedServerFeatureProps: _props,
      clientFeatureProps: _props,
    }
  },
  key: 'jsxViewsConverter',
})
