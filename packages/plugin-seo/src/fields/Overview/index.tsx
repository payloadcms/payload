import type { UIField } from 'payload'

interface FieldFunctionProps {
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
  /**
   * Path to the title field to use for the preview
   *
   * @default 'meta.title'
   */
  titlePath?: string
}

type FieldFunction = ({ overrides }: FieldFunctionProps) => UIField

export const OverviewField: FieldFunction = ({
  descriptionPath,
  imagePath,
  overrides,
  titlePath,
}) => {
  return {
    name: 'overview',
    type: 'ui',
    admin: {
      components: {
        Field: {
          clientProps: {
            descriptionPath,
            imagePath,
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
