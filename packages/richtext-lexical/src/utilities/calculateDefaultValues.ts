import type { SerializedLexicalNode } from 'lexical'
import type { RichTextAdapter } from 'payload'

import type { SanitizedServerFeatures } from '../features/typesServer.js'

export const getGetCalculateDefaultValues =
  (args: { features: SanitizedServerFeatures }): RichTextAdapter['calculateDefaultValues'] =>
  async ({ id, data, iterateFields, locale, req, user }) => {
    if (!data?.root?.children?.length) {
      return
    }

    await walkForDefaults({
      id,
      features: args.features,
      iterateFields,
      locale,
      nodes: data.root.children as SerializedLexicalNode[],
      req,
      user,
    })
  }

async function walkForDefaults({
  id,
  features,
  iterateFields,
  locale,
  nodes,
  req,
  user,
}: {
  features: SanitizedServerFeatures
  id?: number | string
  iterateFields: Parameters<
    NonNullable<RichTextAdapter['calculateDefaultValues']>
  >[0]['iterateFields']
  locale: string | undefined
  nodes: SerializedLexicalNode[]
  req: Parameters<NonNullable<RichTextAdapter['calculateDefaultValues']>>[0]['req']
  user: Parameters<NonNullable<RichTextAdapter['calculateDefaultValues']>>[0]['user']
}): Promise<void> {
  const promises: Promise<void>[] = []

  for (const node of nodes) {
    if ('children' in node && Array.isArray((node as any).children)) {
      promises.push(
        walkForDefaults({
          id,
          features,
          iterateFields,
          locale,
          nodes: (node as any).children as SerializedLexicalNode[],
          req,
          user,
        }),
      )
    }

    const getSubFieldsFn = features.getSubFields?.get(node.type)
    const getSubFieldsDataFn = features.getSubFieldsData?.get(node.type)
    if (!getSubFieldsFn || !getSubFieldsDataFn) {
      continue
    }

    const fields = getSubFieldsFn({ node, req })
    if (!fields?.length) {
      continue
    }

    const nodeData = getSubFieldsDataFn({ node, req }) ?? {}

    promises.push(
      iterateFields({
        id,
        data: nodeData,
        fields,
        locale,
        req,
        siblingData: nodeData,
        user,
      }),
    )
  }

  await Promise.all(promises)
}
