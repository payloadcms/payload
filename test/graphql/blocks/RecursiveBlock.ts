import type { Block, Field } from 'payload'

export const recursiveBlockSlug = 'recursiveItem'

export const recursiveBlockInterfaceName = 'RecursiveItemBlock'

/**
 * Depth-limited recursive block factory: every nesting level returns a distinct
 * block config object sharing the same `slug` and `interfaceName`, with the
 * deepest level omitting the `children` field. This is the documented community
 * pattern for recursive block structures (navigation trees, nested form
 * fieldsets, ...) and must produce a single GraphQL type instead of one
 * duplicate type per nesting level.
 */
export const buildRecursiveBlock = (depth: number): Block => {
  const fields: Field[] = [
    {
      name: 'label',
      type: 'text',
      required: true,
    },
  ]

  if (depth > 1) {
    fields.push({
      name: 'children',
      type: 'blocks',
      blocks: [buildRecursiveBlock(depth - 1)],
    })
  }

  return {
    slug: recursiveBlockSlug,
    fields,
    interfaceName: recursiveBlockInterfaceName,
  }
}
