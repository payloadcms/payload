'use client'

import type { FeatureProviderProviderClient } from '../types'

import { SlashMenuOption } from '../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/types'
import { UploadIcon } from '../../lexical/ui/icons/Upload'
import { createClientComponent } from '../createClientComponent'
import { INSERT_UPLOAD_WITH_DRAWER_COMMAND } from './drawer/commands'
import { UploadNode } from './nodes/UploadNode'
import { UploadPlugin } from './plugin'

export type UploadFeaturePropsClient = {
  collections: {
    [collection: string]: {
      hasExtraFields: boolean
    }
  }
}

const UploadFeatureClient: FeatureProviderProviderClient<UploadFeaturePropsClient> = (props) => {
  return {
    clientFeatureProps: props,
    feature: () => ({
      clientFeatureProps: props,
      nodes: [UploadNode],
      plugins: [
        {
          Component: UploadPlugin,
          position: 'normal',
        },
      ],
      slashMenu: {
        options: [
          {
            displayName: 'Basic',
            key: 'basic',
            options: [
              new SlashMenuOption('upload', {
                Icon: UploadIcon,
                displayName: 'Upload',
                keywords: ['upload', 'image', 'file', 'img', 'picture', 'photo', 'media'],
                onSelect: ({ editor }) => {
                  editor.dispatchCommand(INSERT_UPLOAD_WITH_DRAWER_COMMAND, {
                    replace: false,
                  })
                },
              }),
            ],
          },
        ],
      },
    }),
  }
}

export const UploadFeatureClientComponent = createClientComponent(UploadFeatureClient)
