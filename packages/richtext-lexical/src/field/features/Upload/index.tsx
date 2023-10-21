import type { Field } from 'payload/types'

import type { FeatureProvider } from '../types'

import { SlashMenuOption } from '../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/LexicalMenu'
import { UploadIcon } from '../../lexical/ui/icons/Upload'
import { INSERT_UPLOAD_WITH_DRAWER_COMMAND } from './drawer'
import './index.scss'
import { UploadNode } from './nodes/UploadNode'
import { UploadPlugin } from './plugin'
import { uploadPopulationPromiseHOC } from './populationPromise'
import { uploadValidation } from './validate'

export type UploadFeatureProps = {
  collections: {
    [collection: string]: {
      fields: Field[]
    }
  }
}

export const UploadFeature = (props?: UploadFeatureProps): FeatureProvider => {
  return {
    feature: () => {
      return {
        nodes: [
          {
            node: UploadNode,
            populationPromises: [uploadPopulationPromiseHOC(props)],
            type: UploadNode.getType(),
            validations: [uploadValidation()],
          },
        ],
        plugins: [
          {
            Component: UploadPlugin,
            position: 'normal',
          },
        ],
        props: props,
        slashMenu: {
          options: [
            {
              options: [
                new SlashMenuOption('Upload', {
                  Icon: UploadIcon,
                  keywords: ['upload', 'image', 'file', 'img', 'picture', 'photo', 'media'],
                  onSelect: ({ editor }) => {
                    editor.dispatchCommand(INSERT_UPLOAD_WITH_DRAWER_COMMAND, {
                      replace: false,
                    })
                  },
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
