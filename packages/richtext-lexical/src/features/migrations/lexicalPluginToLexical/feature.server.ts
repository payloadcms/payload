import type { PayloadComponent } from 'payload'
import type React from 'react'

import type { LexicalPluginNodeConverterProvider } from './converter/types.js'

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
        ClientFeature: '@payloadcms/richtext-lexical/client#LexicalPluginToLexicalFeatureClient',
        generateComponentImportMap: ({ addToComponentImportMap }) => {
          for (const converter of converters) {
            if (converter.ClientConverter) {
              addToComponentImportMap(converter.ClientConverter)
            }
          }
        },
        generateComponentMap: () => {
          const map: {
            [key: string]: PayloadComponent
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
