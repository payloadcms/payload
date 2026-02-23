import type { SerializedLexicalNode } from 'lexical'
import type { FieldSchemaMap, RichTextAdapter } from 'payload'

import { addBlockMetaToFormState } from 'payload'

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
    const nodePath = `${path}.${nodeId}`

    if (nodeFieldData.blockType) {
      const addedByServer =
        !iterateFieldsArgs.renderAllFields &&
        !iterateFieldsArgs.previousFormState?.[`${nodePath}.blockType`]

      addBlockMetaToFormState({
        addedByServer: addedByServer || undefined,
        blockFields: schemaEntry.fields,
        blockName: nodeFieldData.blockName,
        blockType: nodeFieldData.blockType,
        includeSchema: iterateFieldsArgs.includeSchema,
        path: nodePath,
        state: iterateFieldsArgs.state,
      })
    }

    promises.push(
      iterateFields({
        ...iterateFieldsArgs,
        blockData: nodeFieldData,
        data: nodeFieldData,
        fields: schemaEntry.fields,
        parentIndexPath: '',
        parentPassesCondition: true,
        parentPath: nodePath,
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
  const getSubFieldsDataFn = features.getSubFieldsData?.get(node.type)
  const nodeFieldData = getSubFieldsDataFn?.({ node, req: undefined as any }) ?? {}
  const formStateData =
    parentData?.[nodeId] && typeof parentData[nodeId] === 'object' ? parentData[nodeId] : {}

  return { ...nodeFieldData, ...formStateData }
}
