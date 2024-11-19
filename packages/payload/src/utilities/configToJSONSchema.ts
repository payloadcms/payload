import type { JSONSchema4 } from 'json-schema'

import pluralize from 'pluralize'
const { singular } = pluralize

import type { Auth } from '../auth/types.js'
import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { SanitizedConfig } from '../config/types.js'
import type { Field, FieldAffectingData } from '../fields/config/types.js'
import type { SanitizedGlobalConfig } from '../globals/config/types.js'

import { fieldAffectsData, tabHasName } from '../fields/config/types.js'
import { generateJobsJSONSchemas } from '../queues/config/generateJobsJSONSchemas.js'
import { deepCopyObject } from './deepCopyObject.js'
import { fieldsToJSONSchema } from './fieldsToJSONSchema.js'
import { toWords } from './formatLabels.js'
import { getCollectionIDFieldTypes } from './getCollectionIDFieldTypes.js'

function generateEntitySchemas(
  entities: (SanitizedCollectionConfig | SanitizedGlobalConfig)[],
): JSONSchema4 {
  const properties = [...entities].reduce((acc, { slug }) => {
    acc[slug] = {
      $ref: `#/definitions/${slug}`,
    }

    return acc
  }, {})

  return {
    type: 'object',
    additionalProperties: false,
    properties,
    required: Object.keys(properties),
  }
}

function generateEntitySelectSchemas(
  entities: (SanitizedCollectionConfig | SanitizedGlobalConfig)[],
): JSONSchema4 {
  const properties = [...entities].reduce((acc, { slug }) => {
    acc[slug] = {
      $ref: `#/definitions/${slug}_select`,
    }

    return acc
  }, {})

  return {
    type: 'object',
    additionalProperties: false,
    properties,
    required: Object.keys(properties),
  }
}

function generateCollectionJoinsSchemas(collections: SanitizedCollectionConfig[]): JSONSchema4 {
  const properties = [...collections].reduce<Record<string, JSONSchema4>>(
    (acc, { slug, joins }) => {
      const schema = {
        type: 'object',
        additionalProperties: false,
        properties: {},
        required: [],
      } satisfies JSONSchema4

      for (const collectionSlug in joins) {
        for (const join of joins[collectionSlug]) {
          schema.properties[join.joinPath] = {
            type: 'string',
            enum: [collectionSlug],
          }
          schema.required.push(join.joinPath)
        }
      }

      if (Object.keys(schema.properties).length > 0) {
        acc[slug] = schema
      }

      return acc
    },
    {},
  )

  return {
    type: 'object',
    additionalProperties: false,
    properties,
    required: Object.keys(properties),
  }
}

function generateLocaleEntitySchemas(localization: SanitizedConfig['localization']): JSONSchema4 {
  if (localization && 'locales' in localization && localization?.locales) {
    const localesFromConfig = localization?.locales

    const locales = [...localesFromConfig].map((locale) => {
      return locale.code
    }, [])

    return {
      type: 'string',
      enum: locales,
    }
  }

  return {
    type: 'null',
  }
}

function generateAuthEntitySchemas(entities: SanitizedCollectionConfig[]): JSONSchema4 {
  const properties: JSONSchema4[] = [...entities]
    .filter(({ auth }) => Boolean(auth))
    .map(({ slug }) => {
      return {
        allOf: [
          { $ref: `#/definitions/${slug}` },
          {
            type: 'object',
            additionalProperties: false,
            properties: {
              collection: { type: 'string', enum: [slug] },
            },
            required: ['collection'],
          },
        ],
      }
    }, {})

  return {
    oneOf: properties,
  }
}

/**
 * Generates the JSON Schema for database configuration
 *
 * @example { db: idType: string }
 */
function generateDbEntitySchema(config: SanitizedConfig): JSONSchema4 {
  const defaultIDType: JSONSchema4 =
    config.db?.defaultIDType === 'number' ? { type: 'number' } : { type: 'string' }

  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      defaultIDType,
    },
    required: ['defaultIDType'],
  }
}

// This function is part of the public API and is exported through payload/utilities
export function entityToJSONSchema(
  config: SanitizedConfig,
  incomingEntity: SanitizedCollectionConfig | SanitizedGlobalConfig,
  interfaceNameDefinitions: Map<string, JSONSchema4>,
  defaultIDType: 'number' | 'text',
  collectionIDFieldTypes?: { [key: string]: 'number' | 'string' },
): JSONSchema4 {
  if (!collectionIDFieldTypes) {
    collectionIDFieldTypes = getCollectionIDFieldTypes({ config, defaultIDType })
  }
  const entity: SanitizedCollectionConfig | SanitizedGlobalConfig = deepCopyObject(incomingEntity)
  const title = entity.typescript?.interface
    ? entity.typescript.interface
    : singular(toWords(entity.slug, true))

  const idField: FieldAffectingData = { name: 'id', type: defaultIDType as 'text', required: true }
  const customIdField = entity.fields.find(
    (field) => fieldAffectsData(field) && field.name === 'id',
  ) as FieldAffectingData

  if (customIdField && customIdField.type !== 'group' && customIdField.type !== 'tab') {
    customIdField.required = true
  } else {
    entity.fields.unshift(idField)
  }

  // mark timestamp fields required
  if ('timestamps' in entity && entity.timestamps !== false) {
    entity.fields = entity.fields.map((field) => {
      if (fieldAffectsData(field) && (field.name === 'createdAt' || field.name === 'updatedAt')) {
        return {
          ...field,
          required: true,
        }
      }
      return field
    })
  }

  if ('auth' in entity && entity.auth && !entity.auth?.disableLocalStrategy) {
    entity.fields.push({
      name: 'password',
      type: 'text',
    })
  }

  return {
    type: 'object',
    additionalProperties: false,
    title,
    ...fieldsToJSONSchema(collectionIDFieldTypes, entity.fields, interfaceNameDefinitions, config),
  }
}

export function fieldsToSelectJSONSchema({ fields }: { fields: Field[] }): JSONSchema4 {
  const schema: JSONSchema4 = {
    type: 'object',
    additionalProperties: false,
    properties: {},
  }

  for (const field of fields) {
    switch (field.type) {
      case 'array':
      case 'group':
        schema.properties[field.name] = {
          oneOf: [
            {
              type: 'boolean',
            },
            fieldsToSelectJSONSchema({ fields: field.fields }),
          ],
        }
        break

      case 'blocks': {
        const blocksSchema: JSONSchema4 = {
          type: 'object',
          additionalProperties: false,
          properties: {},
        }

        for (const block of field.blocks) {
          blocksSchema.properties[block.slug] = {
            oneOf: [
              {
                type: 'boolean',
              },
              fieldsToSelectJSONSchema({ fields: block.fields }),
            ],
          }
        }

        schema.properties[field.name] = {
          oneOf: [
            {
              type: 'boolean',
            },
            blocksSchema,
          ],
        }

        break
      }
      case 'collapsible':
      case 'row':
        schema.properties = {
          ...schema.properties,
          ...fieldsToSelectJSONSchema({ fields: field.fields }).properties,
        }

        break

      case 'tabs':
        for (const tab of field.tabs) {
          if (tabHasName(tab)) {
            schema.properties[tab.name] = {
              oneOf: [
                {
                  type: 'boolean',
                },
                fieldsToSelectJSONSchema({ fields: tab.fields }),
              ],
            }
            continue
          }

          schema.properties = {
            ...schema.properties,
            ...fieldsToSelectJSONSchema({ fields: tab.fields }).properties,
          }
        }
        break

      default:
        schema.properties[field.name] = {
          type: 'boolean',
        }
        break
    }
  }

  return schema
}

const fieldType: JSONSchema4 = {
  type: 'string',
  required: false,
}
const generateAuthFieldTypes = ({
  type,
  loginWithUsername,
}: {
  loginWithUsername: Auth['loginWithUsername']
  type: 'forgotOrUnlock' | 'login' | 'register'
}): JSONSchema4 => {
  if (loginWithUsername) {
    switch (type) {
      case 'forgotOrUnlock': {
        if (loginWithUsername.allowEmailLogin) {
          // allow email or username for unlock/forgot-password
          return {
            additionalProperties: false,
            oneOf: [
              {
                additionalProperties: false,
                properties: { email: fieldType },
                required: ['email'],
              },
              {
                additionalProperties: false,
                properties: { username: fieldType },
                required: ['username'],
              },
            ],
          }
        } else {
          // allow only username for unlock/forgot-password
          return {
            additionalProperties: false,
            properties: { username: fieldType },
            required: ['username'],
          }
        }
      }

      case 'login': {
        if (loginWithUsername.allowEmailLogin) {
          // allow username or email and require password for login
          return {
            additionalProperties: false,
            oneOf: [
              {
                additionalProperties: false,
                properties: { email: fieldType, password: fieldType },
                required: ['email', 'password'],
              },
              {
                additionalProperties: false,
                properties: { password: fieldType, username: fieldType },
                required: ['username', 'password'],
              },
            ],
          }
        } else {
          // allow only username and password for login
          return {
            additionalProperties: false,
            properties: {
              password: fieldType,
              username: fieldType,
            },
            required: ['username', 'password'],
          }
        }
      }

      case 'register': {
        const requiredFields: ('email' | 'password' | 'username')[] = ['password']
        const properties: {
          email?: JSONSchema4['properties']
          password?: JSONSchema4['properties']
          username?: JSONSchema4['properties']
        } = {
          password: fieldType,
          username: fieldType,
        }

        if (loginWithUsername.requireEmail) {
          requiredFields.push('email')
        }
        if (loginWithUsername.requireUsername) {
          requiredFields.push('username')
        }
        if (loginWithUsername.requireEmail || loginWithUsername.allowEmailLogin) {
          properties.email = fieldType
        }

        return {
          additionalProperties: false,
          properties,
          required: requiredFields,
        }
      }
    }
  }

  // default email (and password for login/register)
  return {
    additionalProperties: false,
    properties: { email: fieldType, password: fieldType },
    required: ['email', 'password'],
  }
}

export function authCollectionToOperationsJSONSchema(
  config: SanitizedCollectionConfig,
): JSONSchema4 {
  const loginWithUsername = config.auth?.loginWithUsername
  const loginUserFields: JSONSchema4 = generateAuthFieldTypes({ type: 'login', loginWithUsername })
  const forgotOrUnlockUserFields: JSONSchema4 = generateAuthFieldTypes({
    type: 'forgotOrUnlock',
    loginWithUsername,
  })
  const registerUserFields: JSONSchema4 = generateAuthFieldTypes({
    type: 'register',
    loginWithUsername,
  })

  const properties: JSONSchema4['properties'] = {
    forgotPassword: forgotOrUnlockUserFields,
    login: loginUserFields,
    registerFirstUser: registerUserFields,
    unlock: forgotOrUnlockUserFields,
  }

  return {
    type: 'object',
    additionalProperties: false,
    properties,
    required: Object.keys(properties),
    title: `${singular(toWords(`${config.slug}`, true))}AuthOperations`,
  }
}

function generateAuthOperationSchemas(collections: SanitizedCollectionConfig[]): JSONSchema4 {
  const properties = collections.reduce((acc, collection) => {
    if (collection.auth) {
      acc[collection.slug] = {
        $ref: `#/definitions/auth/${collection.slug}`,
      }
    }
    return acc
  }, {})

  return {
    type: 'object',
    additionalProperties: false,
    properties,
    required: Object.keys(properties),
  }
}

/**
 * This is used for generating the TypeScript types (payload-types.ts) with the payload generate:types command.
 */
export function configToJSONSchema(
  config: SanitizedConfig,
  defaultIDType?: 'number' | 'text',
): JSONSchema4 {
  // a mutable Map to store custom top-level `interfaceName` types. Fields with an `interfaceName` property will be moved to the top-level definitions here
  const interfaceNameDefinitions: Map<string, JSONSchema4> = new Map()

  //  Used for relationship fields, to determine whether to use a string or number type for the ID.
  const collectionIDFieldTypes = getCollectionIDFieldTypes({ config, defaultIDType })

  // Collections and Globals have to be moved to the top-level definitions as well. Reason: The top-level type will be the `Config` type - we don't want all collection and global
  // types to be inlined inside the `Config` type

  const entities: {
    entity: SanitizedCollectionConfig | SanitizedGlobalConfig
    type: 'collection' | 'global'
  }[] = [
    ...config.globals.map((global) => ({ type: 'global' as const, entity: global })),
    ...config.collections.map((collection) => ({
      type: 'collection' as const,
      entity: collection,
    })),
  ]

  const entityDefinitions: { [k: string]: JSONSchema4 } = entities.reduce(
    (acc, { type, entity }) => {
      acc[entity.slug] = entityToJSONSchema(
        config,
        entity,
        interfaceNameDefinitions,
        defaultIDType,
        collectionIDFieldTypes,
      )
      const select = fieldsToSelectJSONSchema({ fields: entity.fields })

      if (type === 'global') {
        select.properties.globalType = {
          type: 'boolean',
        }
      }

      acc[`${entity.slug}_select`] = {
        type: 'object',
        additionalProperties: false,
        ...select,
      }

      return acc
    },
    {},
  )

  const authOperationDefinitions = [...config.collections]
    .filter(({ auth }) => Boolean(auth))
    .reduce(
      (acc, authCollection) => {
        acc.auth[authCollection.slug] = authCollectionToOperationsJSONSchema(authCollection)
        return acc
      },
      { auth: {} },
    )

  const jobsSchemas = config.jobs
    ? generateJobsJSONSchemas(config, config.jobs, interfaceNameDefinitions, collectionIDFieldTypes)
    : {}

  let jsonSchema: JSONSchema4 = {
    additionalProperties: false,
    definitions: {
      ...entityDefinitions,
      ...Object.fromEntries(interfaceNameDefinitions),
      ...authOperationDefinitions,
    },
    // These properties here will be very simple, as all the complexity is in the definitions. These are just the properties for the top-level `Config` type
    type: 'object',
    properties: {
      auth: generateAuthOperationSchemas(config.collections),
      collections: generateEntitySchemas(config.collections || []),
      collectionsJoins: generateCollectionJoinsSchemas(config.collections || []),
      collectionsSelect: generateEntitySelectSchemas(config.collections || []),
      db: generateDbEntitySchema(config),
      globals: generateEntitySchemas(config.globals || []),
      globalsSelect: generateEntitySelectSchemas(config.globals || []),
      locale: generateLocaleEntitySchemas(config.localization),
      user: generateAuthEntitySchemas(config.collections),
    },
    required: [
      'user',
      'locale',
      'collections',
      'collectionsSelect',
      'collectionsJoins',
      'globalsSelect',
      'globals',
      'auth',
      'db',
      'jobs',
    ],
    title: 'Config',
  }
  if (jobsSchemas.definitions?.size) {
    for (const [key, value] of jobsSchemas.definitions) {
      jsonSchema.definitions[key] = value
    }
  }
  if (jobsSchemas.properties) {
    jsonSchema.properties.jobs = {
      type: 'object',
      additionalProperties: false,
      properties: jobsSchemas.properties,
      required: ['tasks', 'workflows'],
    }
  }

  if (config?.typescript?.schema?.length) {
    for (const schema of config.typescript.schema) {
      jsonSchema = schema({ jsonSchema })
    }
  }

  return jsonSchema
}
