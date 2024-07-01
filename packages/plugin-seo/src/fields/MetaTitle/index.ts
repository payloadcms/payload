import type { TextField } from 'payload'

import { withMergedProps } from '@payloadcms/ui/shared'

import { MetaTitleComponent } from './MetaTitleComponent.js'

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
        Field: withMergedProps({
          Component: MetaTitleComponent,
          sanitizeServerOnlyProps: true,
          toMergeIntoProps: {
            hasGenerateTitleFn: hasGenerateFn,
          },
        }),
      },
    },
    localized: true,
    ...((overrides as unknown as TextField) ?? {}),
  }
}
