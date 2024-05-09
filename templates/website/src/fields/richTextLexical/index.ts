import type {
  BlocksFeatureProps,
  FeatureProviderServer,
  HeadingFeatureProps,
  LinkFeatureServerProps,
  UploadFeatureProps,
} from '@payloadcms/richtext-lexical'
import type { RichTextField } from 'payload/types'

import {
  BlocksFeature,
  BoldFeature,
  FixedToolbarFeature,
  InlineToolbarFeature,
  ItalicFeature,
  LinkFeature,
  StrikethroughFeature,
  UploadFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { HeadingFeature } from '@payloadcms/richtext-lexical'

import deepMerge from '../../utilities/deepMerge'
import { link } from '../link'

type AvailableFeatures = {
  blocks?: BlocksFeatureProps['blocks']
  bold?: boolean
  heading?: HeadingFeatureProps['enabledHeadingSizes']
  italic?: boolean
  link?: LinkFeatureServerProps | false
  strikethrough?: boolean
  upload?: UploadFeatureProps | false
}

type RichText = (
  overrides?: Partial<RichTextField>,
  additions?: {
    features?: AvailableFeatures
  },
) => RichTextField

export const richText: RichText = (overrides = {}, additions = {}) => {
  const defaultFeatures: AvailableFeatures = {
    blocks: [],
    bold: true,
    heading: ['h1', 'h2', 'h3', 'h4'],
    italic: true,
    link: {
      enabledCollections: ['pages', 'posts'],
    },
    strikethrough: true,
    upload: {
      collections: {
        media: {
          fields: [
            {
              name: 'caption',
              type: 'richText',
              editor: lexicalEditor({
                features() {
                  return [
                    BoldFeature(),
                    ItalicFeature(),
                    LinkFeature({
                      enabledCollections: ['pages'],
                    }),
                  ]
                },
              }),
            },
            {
              name: 'alignment',
              type: 'radio',
              label: 'Alignment',
              options: [
                {
                  label: 'Left',
                  value: 'left',
                },
                {
                  label: 'Center',
                  value: 'center',
                },
                {
                  label: 'Right',
                  value: 'right',
                },
              ],
            },
            {
              name: 'enableLink',
              type: 'checkbox',
              label: 'Enable Link',
            },
            link({
              appearances: false,
              disableLabel: true,
              overrides: {
                admin: {
                  condition: (_, data) => Boolean(data?.enableLink),
                },
              },
            }),
          ],
        },
      },
    },
  }

  const features = deepMerge<AvailableFeatures, AvailableFeatures>(
    defaultFeatures,
    additions.features,
  )

  const enabledFeatures: FeatureProviderServer<any, any>[] = [
    FixedToolbarFeature(),
    InlineToolbarFeature(),
    ...(features.heading ? [HeadingFeature({ enabledHeadingSizes: features.heading })] : []),
    ...(features.blocks && features.blocks.length > 0
      ? [BlocksFeature({ blocks: features.blocks })]
      : []),
    ...(features.strikethrough ? [StrikethroughFeature()] : []),
    ...(features.bold ? [BoldFeature()] : []),
    ...(features.italic ? [ItalicFeature()] : []),
    ...(features.link ? [LinkFeature(features.link)] : []),
    ...(features.upload ? [UploadFeature(features.upload)] : []),
  ]

  return deepMerge<RichTextField, Partial<RichTextField>>(
    {
      name: 'richText',
      type: 'richText',
      editor: lexicalEditor({
        features() {
          return enabledFeatures
        },
      }),
      required: true,
    },
    overrides,
  )
}
