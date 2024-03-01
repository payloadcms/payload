import type { FeatureProviderProviderServer } from '../../types'
import type { SlateNodeConverter } from './converter/types'
import type { SlateToLexicalFeatureClientProps } from './feature.client'

import { defaultSlateConverters } from './converter/defaultConverters'
import { SlateToLexicalFeatureClientComponent } from './feature.client'
import { UnknownConvertedNode } from './nodes/unknownConvertedNode'

export type SlateToLexicalFeatureProps = {
  converters?:
    | (({ defaultConverters }: { defaultConverters: SlateNodeConverter[] }) => SlateNodeConverter[])
    | SlateNodeConverter[]
}

export const SlateToLexicalFeature: FeatureProviderProviderServer<
  SlateToLexicalFeatureProps,
  SlateToLexicalFeatureClientProps
> = (props) => {
  if (!props) {
    props = {}
  }

  props.converters =
    props?.converters && typeof props?.converters === 'function'
      ? props.converters({ defaultConverters: defaultSlateConverters })
      : (props?.converters as SlateNodeConverter[]) || defaultSlateConverters

  const clientProps: SlateToLexicalFeatureClientProps = {
    converters: props.converters,
  }

  return {
    feature: () => {
      return {
        ClientComponent: SlateToLexicalFeatureClientComponent,
        clientFeatureProps: clientProps,
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
