import type { HTMLConverter } from './converter/types.js'

import { createServerFeature } from '../../../utilities/createServerFeature.js'

export type HTMLConverterFeatureProps = {
  converters?:
    | (({ defaultConverters }: { defaultConverters: HTMLConverter<any>[] }) => HTMLConverter<any>[])
    | HTMLConverter<any>[]
}

// This is just used to save the props on the richText field
/**
 * @deprecated - will be removed in 4.0. Please refer to https://payloadcms.com/docs/rich-text/converting-html
 * to see all the ways to convert lexical to HTML.
 */
export const HTMLConverterFeature = createServerFeature<HTMLConverterFeatureProps>({
  feature: {},
  key: 'htmlConverter',
})
