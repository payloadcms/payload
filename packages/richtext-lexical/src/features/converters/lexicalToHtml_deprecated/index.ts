import type { HTMLConverter } from './converter/types.js'

import { createServerFeature } from '../../../utilities/createServerFeature.js'

export type HTMLConverterFeatureProps = {
  converters?:
    | (({ defaultConverters }: { defaultConverters: HTMLConverter<any>[] }) => HTMLConverter<any>[])
    | HTMLConverter<any>[]
}

// This is just used to save the props on the richText field
/**
 * @deprecated - will be removed in 4.0
 */
export const HTMLConverterFeature = createServerFeature<HTMLConverterFeatureProps>({
  feature: {},
  key: 'htmlConverter',
})
