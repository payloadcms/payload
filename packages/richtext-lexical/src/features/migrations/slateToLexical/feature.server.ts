import type { PayloadComponent } from 'payload'

import type { SlateNodeConverterProvider } from './converter/types.js'

import { createServerFeature } from '../../../utilities/createServerFeature.js'
import { defaultSlateConverters } from './converter/defaultConverters.js'
import { UnknownConvertedNode } from './nodes/unknownConvertedNode/index.js'

export type SlateToLexicalFeatureProps = {
  converters?:
    | (({
        defaultConverters,
      }: {
        defaultConverters: SlateNodeConverterProvider[]
      }) => SlateNodeConverterProvider[])
    | SlateNodeConverterProvider[]
}

export const SlateToLexicalFeature = createServerFeature<
  SlateToLexicalFeatureProps,
  {
    converters?: SlateNodeConverterProvider[]
  }
>({
  feature: ({ props }) => {
    if (!props) {
      props = {}
    }

    let converters: SlateNodeConverterProvider[] = []
    if (props?.converters && typeof props?.converters === 'function') {
      converters = props.converters({ defaultConverters: defaultSlateConverters })
    } else if (props.converters && typeof props?.converters !== 'function') {
      converters = props.converters
    } else {
      converters = defaultSlateConverters
    }

    props.converters = converters

    const componentImports: PayloadComponent[] = []
    const componentMap: {
      [key: string]: PayloadComponent
    } = {}
    for (const converter of converters) {
      if (converter.ClientConverter) {
        componentImports.push(converter.ClientConverter)

        const key = converter.converter.nodeTypes.join('-')
        componentMap[key] = converter.ClientConverter
      }
    }

    return {
      ClientFeature: '@payloadcms/richtext-lexical/client#SlateToLexicalFeatureClient',
      componentImports,
      componentMap,
      nodes: [
        {
          node: UnknownConvertedNode,
        },
      ],
      sanitizedServerFeatureProps: {
        converters,
      },
    }
  },
  key: 'slateToLexical',
})
