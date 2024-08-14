import type { TextareaField } from 'payload'

interface FieldFunctionProps {
  /**
   * Tell the component if the generate function is available as configured in the plugin config
   */
  hasGenerateFn?: boolean
  overrides?: Partial<TextareaField>
}

type FieldFunction = ({ hasGenerateFn, overrides }: FieldFunctionProps) => TextareaField

export const MetaDescriptionField: FieldFunction = ({ hasGenerateFn = false, overrides }) => {
  return {
    name: 'description',
    type: 'textarea',
    admin: {
      components: {
        Field: {
          clientProps: {
            hasGenerateDescriptionFn: hasGenerateFn,
          },
          path: '@payloadcms/plugin-seo/client#MetaDescriptionComponent',
        },
      },
    },
    localized: true,
    ...((overrides as unknown as TextareaField) ?? {}),
  }
}
