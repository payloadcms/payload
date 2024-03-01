import type React from 'react'

import type { FeatureProviderProviderServer } from '../../types'
import type { LexicalPluginNodeConverterProvider } from './converter/types'

import { defaultConverters } from './converter/defaultConverters'
import { LexicalPluginToLexicalFeatureClientComponent } from './feature.client'
import { UnknownConvertedNode } from './nodes/unknownConvertedNode'

export type LexicalPluginToLexicalFeatureProps = {
  converters?:
    | (({
        defaultConverters,
      }: {
        defaultConverters: LexicalPluginNodeConverterProvider[]
      }) => LexicalPluginNodeConverterProvider[])
    | LexicalPluginNodeConverterProvider[]
}

export const LexicalPluginToLexicalFeature: FeatureProviderProviderServer<
  LexicalPluginToLexicalFeatureProps,
  null
> = (props) => {
  if (!props) {
    props = {}
  }

  let converters: LexicalPluginNodeConverterProvider[] = []

  if (props?.converters && typeof props?.converters === 'function') {
    converters = props.converters({ defaultConverters })
  } else if (props.converters && typeof props?.converters !== 'function') {
    converters = props.converters
  } else {
    converters = defaultConverters
  }

  props.converters = converters

  return {
    feature: () => {
      return {
        ClientComponent: LexicalPluginToLexicalFeatureClientComponent,
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
    key: 'lexicalPluginToLexical',
    serverFeatureProps: props,
  }
}
