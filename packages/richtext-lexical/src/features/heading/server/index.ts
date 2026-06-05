import type { HeadingTagType } from '@lexical/rich-text'

import { HeadingNode } from '@lexical/rich-text'

import { createServerFeature } from '../../../utilities/createServerFeature.js'
import { createNode } from '../../typeUtilities.js'
import { MarkdownTransformer } from '../markdownTransformer.js'
import { i18n } from './i18n.js'
import { createHeadingJSONSchema } from './schema.js'

export type { SerializedHeadingNode } from './schema.js'

export type HeadingFeatureProps = {
  enabledHeadingSizes?: HeadingTagType[]
}

export const HeadingFeature = createServerFeature<
  HeadingFeatureProps,
  HeadingFeatureProps,
  HeadingFeatureProps
>({
  feature: ({ props }) => {
    if (!props) {
      props = {}
    }

    const { enabledHeadingSizes = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] } = props

    enabledHeadingSizes.sort()

    return {
      ClientFeature: '@payloadcms/richtext-lexical/client#HeadingFeatureClient',
      clientFeatureProps: props,
      i18n,
      markdownTransformers:
        enabledHeadingSizes.length > 0 ? [MarkdownTransformer(enabledHeadingSizes)] : [],
      nodes: [
        createNode({
          jsonSchema: createHeadingJSONSchema(enabledHeadingSizes),
          node: HeadingNode,
        }),
      ],
      sanitizedServerFeatureProps: props,
    }
  },
  key: 'heading',
})
