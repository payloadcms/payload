import type { SerializedEditorState } from 'lexical'

import type { FeatureProvider } from '../../types'
import type { HTMLConverter } from './converter/types'

import { convertLexicalToHTML } from './converter'
import { defaultConverters } from './converter/defaultConverters'

type Props = {
  converters?:
    | (({ defaultConverters }: { defaultConverters: HTMLConverter[] }) => HTMLConverter[])
    | HTMLConverter[]
  /**
   * @default '_html'
   */
  htmlFieldSuffix?: string
}

export const HTMLConverterFeature = (props?: Props): FeatureProvider => {
  if (!props) {
    props = {}
  }

  props.converters =
    props?.converters && typeof props?.converters === 'function'
      ? props.converters({ defaultConverters: defaultConverters })
      : (props?.converters as HTMLConverter[]) || defaultConverters
  if (!props.htmlFieldSuffix) {
    props.htmlFieldSuffix = '_html'
  }

  return {
    feature: () => {
      return {
        hooks: {
          // eslint-disable-next-line @typescript-eslint/require-await
          afterReadPromise: async ({ field, siblingDoc }) => {
            const data: SerializedEditorState = siblingDoc[field.name] as SerializedEditorState
            if (data) {
              siblingDoc[field.name + props.htmlFieldSuffix] = convertLexicalToHTML({
                converters: props?.converters as HTMLConverter[],
                data,
              })
            }

            return
          },
        },

        props,
      }
    },
    key: 'htmlConverter',
  }
}
