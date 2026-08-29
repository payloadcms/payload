import type { FieldBase, RichTextField, RowField } from 'payload'

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

const isEmpty = (node?: { root: any }) => {
  if (!node || !node?.root) {
    return true
  }

  const { root } = node
  const isRoot = root.type === 'root'
  const hasSingleChild = root.children.length < 2
  const hasNestedChild = root.children.some((childNode: any) => {
    if (childNode?.children) {
      return childNode.children.length > 0
    }

    return false
  })

  return isRoot && hasSingleChild && !hasNestedChild
}

/**
 * @param name field name
 * @param lexicalConfig use `simple` for a marks-only editor
 * @returns a tuple of fields: richText field `name`, and string field `name_html`
 */
export const richTextField = (
  {
    name,
    label,
    ...rest
  }: {
    lexicalConfig?: 'simple'
  } & Partial<RichTextField> &
    Pick<FieldBase, 'label' | 'name'> = {
    name: 'content',
    label: 'Content',
    lexicalConfig: undefined,
  },
): RowField => {
  if (!label) {
    label = capitalize(name)
  }

  return {
    type: 'row',
    fields: [
      {
        ...rest,
        name,
        label,
        type: 'richText',
        hooks: {
          ...(rest?.hooks || {}),
          beforeChange: [
            ...(rest?.hooks?.beforeChange || []),
            ({ value }) => {
              // clean up the empty node that dirty lexical editor leaves behind
              if (value && isEmpty(value)) {
                value = null
              }

              return value
            },
          ],
        },
      },
    ],
  }
}
