import type { SerializedEditorState } from 'lexical'

import type { FeatureProvider } from '../../types'
import type { HTMLConverter } from './converter/types'

import { convertLexicalToHTML } from './converter'
import { defaultConverters } from './converter/defaultConverters'

export type HTMLConverterFeatureProps = {
  converters?:
    | (({ defaultConverters }: { defaultConverters: HTMLConverter[] }) => HTMLConverter[])
    | HTMLConverter[]
}

/**
 * This feature only manages the converters. They are read and actually run / executed by the
 * Lexical field.
 */
export const HTMLConverterFeature = (props?: HTMLConverterFeatureProps): FeatureProvider => {
  if (!props) {
    props = {}
  }
  /*const defaultConvertersWithConvertersFromFeatures = defaultConverters
  defaultConvertersWithConver    tersFromFeatures.set(props?

  */

  return {
    feature: ({ resolvedFeatures }) => {
      return {
        props,
      }
    },
    key: 'htmlConverter',
  }
}
