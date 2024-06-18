import type React from 'react'

import type { FeatureProviderProviderServer } from '../../types.js'
import type { SlateNodeConverterProvider } from './converter/types.js'

// eslint-disable-next-line payload/no-imports-from-exports-dir
import { SlateToLexicalFeatureClientComponent } from '../../../../exports/client/index.js'
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

export const SlateToLexicalFeature: FeatureProviderProviderServer<
  SlateToLexicalFeatureProps,
  undefined
> = (props) => {
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
    feature: () => {
      return {
        ClientComponent: SlateToLexicalFeatureClientComponent,
        clientFeatureProps: null,
        generateComponentMap: () => {
          const map: {
            [key: string]: React.FC
          } = {}

          for (const converter of converters) {
            if (converter.ClientComponent) {
              const key = converter.converter.nodeTypes.join('-')
              map[key] = converter.ClientComponent
            }
          }

          return map
        },
        nodes: [
          {
            node: UnknownConvertedNode,
          },
        ],
        serverFeatureProps: props,
      }
    },
    key: 'slateToLexical',
    serverFeatureProps: props,
  }
}
