import type React from 'react'

import type { SlateNodeConverterProvider } from './converter/types.js'

// eslint-disable-next-line payload/no-imports-from-exports-dir
import { SlateToLexicalFeatureClient } from '../../../exports/client/index.js'
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

export const SlateToLexicalFeature = createServerFeature<SlateToLexicalFeatureProps>({
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

    return {
      ClientFeature: SlateToLexicalFeatureClient,
      generateComponentMap: () => {
        const map: {
          [key: string]: React.FC
        } = {}

        for (const converter of converters) {
          if (converter.ClientConverter) {
            const key = converter.converter.nodeTypes.join('-')
            map[key] = converter.ClientConverter
          }
        }

        return map
      },
      nodes: [
        {
          node: UnknownConvertedNode,
        },
      ],
      sanitizedServerFeatureProps: props,
    }
  },
  key: 'slateToLexical',
})
