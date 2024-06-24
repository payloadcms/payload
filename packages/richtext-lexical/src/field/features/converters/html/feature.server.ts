import type { FeatureProviderProviderServer } from '../../types.js'
import type { HTMLConverter } from './converter/types.js'

export type HTMLConverterFeatureProps = {
  converters?:
    | (({ defaultConverters }: { defaultConverters: HTMLConverter[] }) => HTMLConverter[])
    | HTMLConverter[]
}

export const HTMLConverterFeature: FeatureProviderProviderServer<
  HTMLConverterFeatureProps,
  undefined
> = (props) => {
  return {
    feature: () => {
      return {
        clientFeatureProps: null,
        serverFeatureProps: props,
      }
    },
    key: 'htmlConverter',
    serverFeatureProps: props,
  }
}
