import type { PayloadComponent } from 'payload'

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
        ClientFeature: '@payloadcms/richtext-lexical/client#LexicalPluginToLexicalFeatureClient',
        componentImports,
        componentMap,
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
