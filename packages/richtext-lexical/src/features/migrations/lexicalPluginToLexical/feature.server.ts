import type React from 'react'

import type { LexicalPluginNodeConverterProvider } from './converter/types.js'

// eslint-disable-next-line payload/no-imports-from-exports-dir
import { LexicalPluginToLexicalFeatureClient } from '../../../exports/client/index.js'
import { createServerFeature } from '../../../utilities/createServerFeature.js'
import { defaultConverters } from './converter/defaultConverters.js'
import { UnknownConvertedNode } from './nodes/unknownConvertedNode/index.js'

export type LexicalPluginToLexicalFeatureProps = {
  converters?:
    | (({
        defaultConverters,
      }: {
        defaultConverters: LexicalPluginNodeConverterProvider[]
      }) => LexicalPluginNodeConverterProvider[])
    | LexicalPluginNodeConverterProvider[]
}

export const LexicalPluginToLexicalFeature =
  createServerFeature<LexicalPluginToLexicalFeatureProps>({
    feature: ({ props }) => {
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
        ClientFeature: LexicalPluginToLexicalFeatureClient,
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
    key: 'lexicalPluginToLexical',
  })
