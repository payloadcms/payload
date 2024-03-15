interface Args {
  disableAppearance?: true
  disableLabel?: true
}

export const LINK_FIELDS = ({ disableAppearance, disableLabel }: Args = {}): string => `{
  ${!disableLabel ? 'label' : ''}
  ${!disableAppearance ? 'appearance' : ''}
  type
  newTab
  url
  reference {
    relationTo
    value {
      ...on Page {
        slug
      }
    }
  }
}`
