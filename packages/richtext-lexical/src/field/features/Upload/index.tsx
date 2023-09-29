import type { Field } from 'payload/types'

import type { FeatureProvider } from '../types'

import { SlashMenuOption } from '../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/LexicalMenu'
import { UploadIcon } from '../../lexical/ui/icons/Upload'
import './index.scss'

export type UploadFeatureProps = {
  collections: {
    [collection: string]: {
      fields: Field[]
    }
  }
}

export const UploadFeature = (props?: UploadFeatureProps): FeatureProvider => {
  return {
    feature: ({ resolvedFeatures, unsanitizedEditorConfig }) => {
      return {
        nodes: [],
        plugins: [],
        slashMenu: {
          options: [
            {
              options: [
                new SlashMenuOption('Upload', {
                  Icon: UploadIcon,
                  keywords: ['upload', 'image', 'file', 'img', 'picture', 'photo', 'media'],
                  onSelect: ({ editor }) => {},
                }),
              ],
              title: 'Basic',
            },
          ],
        },
      }
    },
    key: 'upload',
  }
}
