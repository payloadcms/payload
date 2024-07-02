import type { HTMLConverter } from './converter/types.js'

import { createServerFeature } from '../../../utilities/createServerFeature.js'

export type HTMLConverterFeatureProps = {
  converters?:
    | (({ defaultConverters }: { defaultConverters: HTMLConverter[] }) => HTMLConverter[])
    | HTMLConverter[]
}

// This is just used to save the props on the richText field
export const HTMLConverterFeature = createServerFeature<HTMLConverterFeatureProps>({
  feature: {},
  key: 'htmlConverter',
})
