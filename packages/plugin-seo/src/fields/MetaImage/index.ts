import type { UploadField } from '@ruya.sa/payload'

interface FieldFunctionProps {
  /**
   * Tell the component if the generate function is available as configured in the plugin config
   */
  hasGenerateFn?: boolean
  overrides?: Partial<UploadField>
  relationTo: string
}

type FieldFunction = ({ hasGenerateFn, overrides }: FieldFunctionProps) => UploadField

export const MetaImageField: FieldFunction = ({ hasGenerateFn = false, overrides, relationTo }) => {
  const imageField = {
    name: 'image',
    type: 'upload',
    admin: {
      components: {
        Field: {
          clientProps: {
            hasGenerateImageFn: hasGenerateFn,
          },
          path: '@ruya.sa/plugin-seo/client#MetaImageComponent',
        },
      },
      description: 'Maximum upload file size: 12MB. Recommended file size for images is <500KB.',
    },
    label: 'Meta Image',
    localized: true,
    relationTo,
    ...((overrides ?? {}) as { hasMany: boolean } & Partial<UploadField>),
  } as UploadField

  return imageField
}
