import type { HTMLConverter } from '@payloadcms/richtext-lexical'

import type { FeatureProviderProviderServer } from '../../types'

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
