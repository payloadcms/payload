import type { Field } from 'payload/types'

import payload from 'payload'

import type { HTMLConverter } from '../converters/html/converter/types'
import type { FeatureProvider } from '../types'
import type { SerializedUploadNode } from './nodes/UploadNode'

import { SlashMenuOption } from '../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/types'
import { INSERT_UPLOAD_WITH_DRAWER_COMMAND } from './drawer'
import { UploadNode } from './nodes/UploadNode'
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
            converters: {
              html: {
                converter: async ({ node }) => {
                  const uploadDocument = await payload.findByID({
                    id: node.value.id,
                    collection: node.relationTo,
                  })
                  const url = (payload?.config?.serverURL || '') + uploadDocument?.url

                  if (!(uploadDocument?.mimeType as string)?.startsWith('image')) {
                    return `<a href="${url}" rel="noopener noreferrer">Upload node which is not an image</a>`
                  }

                  return `<img src="${url}" alt="${uploadDocument?.filename}" width="${uploadDocument?.width}"  height="${uploadDocument?.height}"/>`
                },
                nodeTypes: [UploadNode.getType()],
              } as HTMLConverter<SerializedUploadNode>,
            },
            node: UploadNode,
            populationPromises: [uploadPopulationPromiseHOC(props)],
            type: UploadNode.getType(),
            validations: [uploadValidation()],
          },
        ],
        plugins: [
          {
            Component: () =>
              // @ts-expect-error
              import('./plugin').then((module) => module.UploadPlugin),
            position: 'normal',
          },
        ],
        props: props,
        slashMenu: {
          options: [
            {
              displayName: 'Basic',
              key: 'basic',
              options: [
                new SlashMenuOption('upload', {
                  Icon: () =>
                    // @ts-expect-error
                    import('../../lexical/ui/icons/Upload').then((module) => module.UploadIcon),
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
      }
    },
    key: 'upload',
  }
}
