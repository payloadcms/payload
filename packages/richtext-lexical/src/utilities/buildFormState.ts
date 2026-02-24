import type { SerializedLexicalNode } from 'lexical'
import type { RichTextAdapter, RichTextField } from 'payload'
import type { AddFieldStatePromiseArgs, FormStateIterateFieldsArgs } from 'payload/internal'

import { addBlockMetaToFormState } from 'payload'

import type { SanitizedServerFeatures } from '../features/typesServer.js'

export const getGetBuildFormState =
  (args: { features: SanitizedServerFeatures }): RichTextAdapter['buildFormState'] =>
  async (buildFormStateArgs) => {
    const { data: documentData, field } = buildFormStateArgs
    const value = documentData[field.name]

    if (!value?.root?.children?.length) {
      return
    }

    await walkLexicalNodes({
      ...buildFormStateArgs,
      features: args.features,
      nodes: value.root.children as SerializedLexicalNode[],
      parentData: value,
    })
  }

async function walkLexicalNodes(
  args: {
    features: SanitizedServerFeatures
    iterateFields: (args: FormStateIterateFieldsArgs) => Promise<void>
    nodes: SerializedLexicalNode[]
    parentData: any
  } & AddFieldStatePromiseArgs<RichTextField>,
): Promise<void> {
  const {
    features,
    fieldSchemaMap,
    includeSchema,
    iterateFields,
    nodes,
    parentData,
    parentPermissions,
    passesCondition,
    path,
    previousFormState,
    renderAllFields,
    schemaPath,
    state,
  } = args
  const promises: Promise<void>[] = []

  for (const node of nodes) {
    if ('children' in node && Array.isArray((node as any).children)) {
      promises.push(
        walkLexicalNodes({
          ...args,
          nodes: (node as any).children as SerializedLexicalNode[],
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
    const nodePath = `${path}.${nodeId}`

    if (nodeFieldData.blockType) {
      const addedByServer = !renderAllFields && !previousFormState?.[`${nodePath}.blockType`]

      addBlockMetaToFormState({
        addedByServer: addedByServer || undefined,
        blockFields: schemaEntry.fields,
        blockName: nodeFieldData.blockName,
        blockType: nodeFieldData.blockType,
        includeSchema,
        path: nodePath,
        state,
      })
    }

    promises.push(
      iterateFields({
        ...args,
        blockData: nodeFieldData,
        data: nodeFieldData,
        fields: schemaEntry.fields,
        parentIndexPath: '',
        parentPassesCondition: passesCondition,
        parentPath: nodePath,
        parentSchemaPath: schemaFieldsPath,
        permissions: parentPermissions, // TODO: verify if this is correct
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
  const getSubFieldsDataFn = features.getSubFieldsData?.get(node.type)
  const nodeFieldData = getSubFieldsDataFn?.({ node, req: undefined as any }) ?? {}
  const formStateData =
    parentData?.[nodeId] && typeof parentData[nodeId] === 'object' ? parentData[nodeId] : {}

  return { ...nodeFieldData, ...formStateData }
}
