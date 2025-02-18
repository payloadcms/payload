// @ts-strict-ignore
import type { CollectionPermission, FieldsPermissions, GlobalPermission } from '../auth/types.js'
import type { SanitizedCollectionConfig, TypeWithID } from '../collections/config/types.js'
import type { Access } from '../config/types.js'
import type { Field, FieldAccess } from '../fields/config/types.js'
import type { SanitizedGlobalConfig } from '../globals/config/types.js'
import type { AllOperations, JsonObject, Payload, PayloadRequest, Where } from '../types/index.js'

import { combineQueries } from '../database/combineQueries.js'
import { tabHasName } from '../fields/config/types.js'

type Args = {
  entity: SanitizedCollectionConfig | SanitizedGlobalConfig
  id?: number | string
  operations: AllOperations[]
  req: PayloadRequest
  type: 'collection' | 'global'
}

type ReturnType<T extends Args> = T['type'] extends 'global'
  ? GlobalPermission
  : CollectionPermission

type CreateAccessPromise = (args: {
  access: Access | FieldAccess
  accessLevel: 'entity' | 'field'
  disableWhere?: boolean
  operation: AllOperations
  policiesObj: CollectionPermission | GlobalPermission
}) => Promise<void>

type EntityDoc = JsonObject | TypeWithID

/**
 * Build up permissions object for an entity (collection or global)
 */
export async function getEntityPolicies<T extends Args>(args: T): Promise<ReturnType<T>> {
  const { id, type, entity, operations, req } = args
  const { data, locale, payload, user } = req
  const isLoggedIn = !!user

  const policies = {
    fields: {},
  } as ReturnType<T>

  let docBeingAccessed: EntityDoc | Promise<EntityDoc | undefined> | undefined

  async function getEntityDoc({ where }: { where?: Where } = {}): Promise<EntityDoc | undefined> {
    if (!entity.slug) {
      return undefined
    }

    if (type === 'global') {
      return payload.findGlobal({
        slug: entity.slug,
        depth: 0,
        fallbackLocale: null,
        locale,
        overrideAccess: true,
        req,
      })
    }

    if (type === 'collection' && id) {
      if (typeof where === 'object') {
        const paginatedRes = await payload.find({
          collection: entity.slug,
          depth: 0,
          fallbackLocale: null,
          limit: 1,
          locale,
          overrideAccess: true,
          pagination: false,
          req,
          where: combineQueries(where, { id: { equals: id } }),
        })

        return paginatedRes?.docs?.[0] || undefined
      }

      return payload.findByID({
        id,
        collection: entity.slug,
        depth: 0,
        fallbackLocale: null,
        locale,
        overrideAccess: true,
        req,
      })
    }
  }

  const createAccessPromise: CreateAccessPromise = async ({
    access,
    accessLevel,
    disableWhere = false,
    operation,
    policiesObj: mutablePolicies,
  }) => {
    if (accessLevel === 'field' && docBeingAccessed === undefined) {
      // assign docBeingAccessed first as the promise to avoid multiple calls to getEntityDoc
      docBeingAccessed = getEntityDoc().then((doc) => {
        docBeingAccessed = doc
      })
    }
    // awaiting the promise to ensure docBeingAccessed is assigned before it is used
    await docBeingAccessed

    // https://payloadcms.slack.com/archives/C048Z9C2BEX/p1702054928343769
    const accessResult = await access({ id, data, doc: docBeingAccessed, req })

    // Where query was returned from access function => check if document is returned when querying with where
    if (typeof accessResult === 'object' && !disableWhere) {
      mutablePolicies[operation] = {
        permission:
          id || type === 'global' ? !!(await getEntityDoc({ where: accessResult })) : true,
        where: accessResult,
      }
    } else if (mutablePolicies[operation]?.permission !== false) {
      mutablePolicies[operation] = {
        permission: !!accessResult,
      }
    }
  }

  for (const operation of operations) {
    if (typeof entity.access[operation] === 'function') {
      await createAccessPromise({
        access: entity.access[operation],
        accessLevel: 'entity',
        operation,
        policiesObj: policies,
      })
    } else {
      policies[operation] = {
        permission: isLoggedIn,
      }
    }

    await executeFieldPolicies({
      createAccessPromise,
      entityPermission: policies[operation].permission as boolean,
      fields: entity.fields,
      operation,
      payload,
      policiesObj: policies,
    })
  }

  return policies
}

/**
 * Build up permissions object and run access functions for each field of an entity
 */
const executeFieldPolicies = async ({
  createAccessPromise,
  entityPermission,
  fields,
  operation,
  payload,
  policiesObj,
}: {
  createAccessPromise: CreateAccessPromise
  entityPermission: boolean
  fields: Field[]
  operation: AllOperations
  payload: Payload
  policiesObj: CollectionPermission | FieldsPermissions | GlobalPermission
}) => {
  const mutablePolicies = policiesObj.fields

  // Fields don't have all operations of a collection
  if (operation === 'delete' || operation === 'readVersions' || operation === 'unlock') {
    return
  }

  await Promise.all(
    fields.map(async (field) => {
      if ('name' in field && field.name) {
        if (!mutablePolicies[field.name]) {
          mutablePolicies[field.name] = {}
        }

        if ('access' in field && field.access && typeof field.access[operation] === 'function') {
          await createAccessPromise({
            access: field.access[operation],
            accessLevel: 'field',
            disableWhere: true,
            operation,
            policiesObj: mutablePolicies[field.name],
          })
        } else {
          mutablePolicies[field.name][operation] = {
            permission: policiesObj[operation]?.permission,
          }
        }

        if ('fields' in field && field.fields) {
          if (!mutablePolicies[field.name].fields) {
            mutablePolicies[field.name].fields = {}
          }

          await executeFieldPolicies({
            createAccessPromise,
            entityPermission,
            fields: field.fields,
            operation,
            payload,
            policiesObj: mutablePolicies[field.name],
          })
        }

        if (
          ('blocks' in field && field.blocks?.length) ||
          ('blockReferences' in field && field.blockReferences?.length)
        ) {
          if (!mutablePolicies[field.name]?.blocks) {
            mutablePolicies[field.name].blocks = {}
          }

          await Promise.all(
            (field.blockReferences ?? field.blocks).map(async (_block) => {
              const block = typeof _block === 'string' ? payload.blocks[_block] : _block // TODO: Skip over string blocks

              if (!mutablePolicies[field.name].blocks?.[block.slug]) {
                mutablePolicies[field.name].blocks[block.slug] = {
                  fields: {},
                  [operation]: { permission: entityPermission },
                }
              } else if (!mutablePolicies[field.name].blocks[block.slug][operation]) {
                mutablePolicies[field.name].blocks[block.slug][operation] = {
                  permission: entityPermission,
                }
              }

              await executeFieldPolicies({
                createAccessPromise,
                entityPermission,
                fields: block.fields,
                operation,
                payload,
                policiesObj: mutablePolicies[field.name].blocks[block.slug],
              })
            }),
          )
        }
      } else if ('fields' in field && field.fields) {
        await executeFieldPolicies({
          createAccessPromise,
          entityPermission,
          fields: field.fields,
          operation,
          payload,
          policiesObj,
        })
      } else if (field.type === 'tabs') {
        await Promise.all(
          field.tabs.map(async (tab) => {
            if (tabHasName(tab)) {
              if (!mutablePolicies[tab.name]) {
                mutablePolicies[tab.name] = {
                  fields: {},
                  [operation]: { permission: entityPermission },
                }
              } else if (!mutablePolicies[tab.name][operation]) {
                mutablePolicies[tab.name][operation] = { permission: entityPermission }
              }
              await executeFieldPolicies({
                createAccessPromise,
                entityPermission,
                fields: tab.fields,
                operation,
                payload,
                policiesObj: mutablePolicies[tab.name],
              })
            } else {
              await executeFieldPolicies({
                createAccessPromise,
                entityPermission,
                fields: tab.fields,
                operation,
                payload,
                policiesObj,
              })
            }
          }),
        )
      }
    }),
  )
}
