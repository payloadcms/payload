import type { Field } from 'payload/types'

import payload from 'payload'

import type { HTMLConverter } from '../converters/html/converter/types'
import type { FeatureProvider } from '../types'
import type { SerializedUploadNode } from './nodes/UploadNode'

import { SlashMenuOption } from '../../lexical/plugins/SlashMenu/LexicalTypeaheadMenuPlugin/types'
import { basicSlashMenuGroup } from '../common/basicSlashMenuGroup'
import { INSERT_UPLOAD_WITH_DRAWER_COMMAND } from './drawer/commands'
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

/**
 * Get the absolute URL for an upload URL by potentially prepending the serverURL
 */
function getAbsoluteURL(url: string): string {
  return url?.startsWith('http') ? url : (payload?.config?.serverURL || '') + url
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
                  const uploadDocument: any = await payload.findByID({
                    id: node.value.id,
                    collection: node.relationTo,
                  })
                  const url: string = getAbsoluteURL(uploadDocument?.url as string)

                  /**
                   * If the upload is not an image, return a link to the upload
                   */
                  if (!(uploadDocument?.mimeType as string)?.startsWith('image')) {
                    return `<a href="${url}" rel="noopener noreferrer">${uploadDocument.filename}</a>`
                  }

                  /**
                   * If the upload is a simple image with no different sizes, return a simple img tag
                   */
                  if (!uploadDocument?.sizes || !Object.keys(uploadDocument?.sizes).length) {
                    return `<img src="${url}" alt="${uploadDocument?.filename}" width="${uploadDocument?.width}"  height="${uploadDocument?.height}"/>`
                  }

                  /**
                   * If the upload is an image with different sizes, return a picture element
                   */
                  let pictureHTML = '<picture>'

                  // Iterate through each size in the data.sizes object
                  for (const size in uploadDocument.sizes) {
                    const imageSize = uploadDocument.sizes[size]

                    // Skip if any property of the size object is null
                    if (
                      !imageSize.width ||
                      !imageSize.height ||
                      !imageSize.mimeType ||
                      !imageSize.filesize ||
                      !imageSize.filename ||
                      !imageSize.url
                    ) {
                      continue
                    }
                    const imageSizeURL: string = getAbsoluteURL(imageSize?.url as string)

                    pictureHTML += `<source srcset="${imageSizeURL}" media="(max-width: ${imageSize.width}px)" type="${imageSize.mimeType}">`
                  }

                  // Add the default img tag
                  pictureHTML += `<img src="${url}" alt="Image" width="${uploadDocument.width}" height="${uploadDocument.height}">`
                  pictureHTML += '</picture>'

                  return pictureHTML
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
              ...basicSlashMenuGroup,
              options: [
                new SlashMenuOption('upload', {
                  Icon: () =>
                    // @ts-expect-error
                    import('../../lexical/ui/icons/Upload').then((module) => module.UploadIcon),
                  keywords: ['upload', 'image', 'file', 'img', 'picture', 'photo', 'media'],
                  label: 'Upload',
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
