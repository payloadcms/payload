import type { TextField } from '@ruya.sa/payload'

interface FieldFunctionProps {
  /**
   * Tell the component if the generate function is available as configured in the plugin config
   */
  hasGenerateFn?: boolean
  overrides?: Partial<TextField>
}

type FieldFunction = ({ hasGenerateFn, overrides }: FieldFunctionProps) => TextField

export const MetaTitleField: FieldFunction = ({ hasGenerateFn = false, overrides }) => {
  return {
    name: 'title',
    type: 'text',
    admin: {
      components: {
        Field: {
          clientProps: {
            hasGenerateTitleFn: hasGenerateFn,
          },
          path: '@ruya.sa/plugin-seo/client#MetaTitleComponent',
        },
      },
    },
    localized: true,
    ...((overrides ?? {}) as { hasMany: boolean } & Partial<TextField>),
  }
}
