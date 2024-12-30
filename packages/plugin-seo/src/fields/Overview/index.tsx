import type { UIField } from 'payload'

interface FieldFunctionProps {
  descriptionOverrides?: {
    maxLength?: number
    minLength?: number
  }
  /**
   * Path to the description field to use for the preview
   *
   * @default 'meta.description'
   */
  descriptionPath?: string
  /**
   * Path to the image field to use for the preview
   *
   * @default 'meta.image'
   */
  imagePath?: string
  overrides?: Partial<UIField>
  titleOverrides?: {
    maxLength?: number
    minLength?: number
  }
  /**
   * Path to the title field to use for the preview
   *
   * @default 'meta.title'
   */
  titlePath?: string
}

type FieldFunction = ({ overrides }: FieldFunctionProps) => UIField

export const OverviewField: FieldFunction = ({
  descriptionOverrides,
  descriptionPath,
  imagePath,
  overrides,
  titleOverrides,
  titlePath,
}) => {
  return {
    name: 'overview',
    type: 'ui',
    admin: {
      components: {
        Field: {
          clientProps: {
            descriptionOverrides,
            descriptionPath,
            imagePath,
            titleOverrides,
            titlePath,
          },
          path: '@payloadcms/plugin-seo/client#OverviewComponent',
        },
      },
    },
    label: 'Overview',
    ...((overrides as unknown as UIField) ?? {}),
  }
}
