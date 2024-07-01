import type { UploadField } from 'payload'

import { withMergedProps } from '@payloadcms/ui/shared'

import { MetaImageComponent } from './MetaImageComponent.js'

interface FieldFunctionProps {
  hasGenerateFn?: boolean
  overrides?: Partial<UploadField>
  relationTo: string
}

type FieldFunction = ({ hasGenerateFn, overrides }: FieldFunctionProps) => UploadField

export const MetaImage: FieldFunction = ({ hasGenerateFn = false, overrides, relationTo }) => {
  return {
    name: 'image',
    type: 'upload',
    admin: {
      components: {
        Field: withMergedProps({
          Component: MetaImageComponent,
          sanitizeServerOnlyProps: true,
          toMergeIntoProps: {
            hasGenerateImageFn: hasGenerateFn,
          },
        }),
      },
      description: 'Maximum upload file size: 12MB. Recommended file size for images is <500KB.',
    },
    label: 'Meta Image',
    localized: true,
    relationTo,
    ...((overrides as unknown as UploadField) ?? {}),
  }
}
