import type { SerializedLexicalNode } from 'lexical'
import type { FieldSchemaMap, RichTextAdapter } from 'payload'

import type { SanitizedServerFeatures } from '../features/typesServer.js'

export const getGetBuildFormState =
  (args: { features: SanitizedServerFeatures }): RichTextAdapter['buildFormState'] =>
  async ({ data, fieldSchemaMap, iterateFields, iterateFieldsArgs, path, schemaPath }) => {
    if (!data?.root?.children?.length) {
      return
    }

    await walkLexicalNodes({
      features: args.features,
      fieldSchemaMap,
      iterateFields,
      iterateFieldsArgs,
      nodes: data.root.children as SerializedLexicalNode[],
      parentData: data,
      path,
      schemaPath,
    })
  }

async function walkLexicalNodes({
  features,
  fieldSchemaMap,
  iterateFields,
  iterateFieldsArgs,
  nodes,
  parentData,
  path,
  schemaPath,
}: {
  features: SanitizedServerFeatures
  fieldSchemaMap: FieldSchemaMap
  iterateFields: Parameters<NonNullable<RichTextAdapter['buildFormState']>>[0]['iterateFields']
  iterateFieldsArgs: Parameters<
    NonNullable<RichTextAdapter['buildFormState']>
  >[0]['iterateFieldsArgs']
  nodes: SerializedLexicalNode[]
  parentData: any
  path: string
  schemaPath: string
}): Promise<void> {
  const promises: Promise<void>[] = []

  for (const node of nodes) {
    if ('children' in node && Array.isArray((node as any).children)) {
      promises.push(
        walkLexicalNodes({
          features,
          fieldSchemaMap,
          iterateFields,
          iterateFieldsArgs,
          nodes: (node as any).children as SerializedLexicalNode[],
          parentData,
          path,
          schemaPath,
        }),
      )
    }

    const nodeId = getNodeId(node, features)
    if (!nodeId) {
      continue
    }

    const schemaFieldsPath = getSchemaFieldsPath(node, schemaPath, features)
    if (!schemaFieldsPath) {
      continue
    }

    const schemaEntry = fieldSchemaMap.get(schemaFieldsPath)
    if (!schemaEntry || !('fields' in schemaEntry) || !schemaEntry.fields) {
      continue
    }

    const nodeFieldData = getNodeFieldData(node, parentData, nodeId, features)

    promises.push(
      iterateFields({
        ...iterateFieldsArgs,
        blockData: nodeFieldData,
        data: nodeFieldData,
        fields: schemaEntry.fields,
        parentIndexPath: '',
        parentPassesCondition: true,
        parentPath: `${path}.${nodeId}`,
        parentSchemaPath: schemaFieldsPath,
        permissions: true,
      }),
    )
  }

  await Promise.all(promises)
}

function getNodeId(
  node: SerializedLexicalNode,
  features: SanitizedServerFeatures,
): string | undefined {
  const getSubFieldsDataFn = features.getSubFieldsData?.get(node.type)
  if (!getSubFieldsDataFn) {
    return undefined
  }

  const fieldData = getSubFieldsDataFn({ node, req: undefined as any })
  if (fieldData?.id) {
    return String(fieldData.id)
  }

  if ((node as any).id) {
    return String((node as any).id)
  }

  return undefined
}

function getSchemaFieldsPath(
  node: SerializedLexicalNode,
  schemaPath: string,
  features: SanitizedServerFeatures,
): string | undefined {
  const getSchemaPathFn = features.getSchemaPath?.get(node.type)
  if (!getSchemaPathFn) {
    return undefined
  }

  const schemaSuffix = getSchemaPathFn({ node })
  if (!schemaSuffix) {
    return undefined
  }

  const featureKey = features.nodeTypeToFeatureKey?.get(node.type)
  if (!featureKey) {
    return undefined
  }

  return `${schemaPath}.lexical_internal_feature.${featureKey}.${schemaSuffix}`
}

function getNodeFieldData(
  node: SerializedLexicalNode,
  parentData: any,
  nodeId: string,
  features: SanitizedServerFeatures,
): Record<string, any> {
  if (parentData?.[nodeId] && typeof parentData[nodeId] === 'object') {
    return parentData[nodeId]
  }

  const getSubFieldsDataFn = features.getSubFieldsData?.get(node.type)
  if (getSubFieldsDataFn) {
    return getSubFieldsDataFn({ node, req: undefined as any }) ?? {}
  }

  return {}
}
