import type { UIField } from 'payload'

import { withMergedProps } from '@payloadcms/ui/shared'

import { PreviewComponent } from './PreviewComponent.js'

interface FieldFunctionProps {
  /**
   * Path to the description field to use for the preview
   *
   * @default 'meta.description'
   */
  descriptionPath?: string
  /**
   * Tell the component if the generate function is available as configured in the plugin config
   */
  hasGenerateFn?: boolean
  overrides?: Partial<UIField>
  /**
   * Path to the title field to use for the preview
   *
   * @default 'meta.title'
   */
  titlePath?: string
}

type FieldFunction = ({ hasGenerateFn, overrides }: FieldFunctionProps) => UIField

export const PreviewField: FieldFunction = ({
  descriptionPath,
  hasGenerateFn = false,
  overrides,
  titlePath,
}) => {
  return {
    name: 'preview',
    type: 'ui',
    admin: {
      components: {
        Field: withMergedProps({
          Component: PreviewComponent,
          sanitizeServerOnlyProps: true,
          toMergeIntoProps: {
            descriptionPath,
            hasGenerateURLFn: hasGenerateFn,
            titlePath,
          },
        }),
      },
    },
    label: 'Preview',
    ...((overrides as unknown as UIField) ?? {}),
  }
}
