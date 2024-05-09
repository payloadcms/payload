import type { AdapterArguments, RichTextElement, RichTextLeaf } from '@payloadcms/richtext-slate'
import type { RichTextField } from 'payload/types'

import { slateEditor } from '@payloadcms/richtext-slate'

import deepMerge from '../../utilities/deepMerge'
import link from '../link'
import elements from './elements'
import leaves from './leaves'

type RichText = (
  overrides?: Partial<RichTextField> & { admin?: AdapterArguments['admin'] },
  additions?: {
    elements?: RichTextElement[]
    leaves?: RichTextLeaf[]
  },
) => RichTextField

const richText: RichText = (
  overrides,
  additions = {
    elements: [],
    leaves: [],
  },
) => {
  const slateOptions = deepMerge<AdapterArguments['admin'], AdapterArguments['admin']>(
    overrides?.admin || {},
    {
      elements: [...elements, ...(additions.elements || [])],
      leaves: [...leaves, ...(additions.leaves || [])],
      upload: {
        collections: {
          media: {
            fields: [
              {
                name: 'caption',
                type: 'richText',
                editor: slateEditor({
                  admin: {
                    elements: [...elements],
                    leaves: [...leaves],
                  },
                }),
                label: 'Caption',
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
    },
  )

  const fieldOverrides = {
    ...(overrides || {}),
  }

  delete fieldOverrides.admin

  return deepMerge<RichTextField, Partial<RichTextField>>(
    {
      name: 'richText',
      type: 'richText',
      // editor: slateEditor({
      //   admin: slateOptions,
      // }),
      required: true,
    },
    fieldOverrides || {},
  )
}

export default richText
