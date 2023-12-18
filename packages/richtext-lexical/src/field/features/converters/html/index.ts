import type { FeatureProvider } from '../../types'
import type { HTMLConverter } from './converter/types'

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

  return {
    feature: () => {
      return {
        props,
      }
    },
    key: 'htmlConverter',
  }
}
