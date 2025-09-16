import type {
  BaseDatabaseAdapter,
  Config,
  Count,
  CountGlobalVersions,
  CountVersions,
  Create,
  CreateGlobal,
  CreateGlobalVersion,
  CreateVersion,
  DatabaseAdapterObj,
  DeleteMany,
  DeleteOne,
  DeleteVersions,
  Find,
  FindGlobal,
  FindGlobalVersions,
  FindOne,
  FindVersions,
  FlattenedField,
  QueryDrafts,
  SanitizedConfig,
  SanitizedGlobalConfig,
  UpdateGlobal,
  UpdateGlobalVersion,
  UpdateMany,
  UpdateOne,
  UpdateVersion,
  Upsert,
  Where,
} from 'payload'

import {
  buildVersionCollectionFields,
  buildVersionGlobalFields,
  combineQueries,
  createArrayFromCommaDelineated,
  createDatabaseAdapter,
  getFieldByPath,
} from 'payload'
import { fieldShouldBeLocalized } from 'payload/shared'

interface ContentAPIDatabaseAdapterOptions {
  cmsID?: number
  contentAPIURL: string
}

export type ContentAPIAdapter = {
  cmsID: number
  contentAPIURL: string
  request<T = any>(path: string, body?: any): Promise<T>
} & BaseDatabaseAdapter

const slugIsGlobal = (slug: string) => slug.startsWith('_global-')

const getGlobalSlug = (slug: string) => `_global-${slug}`

async function init(this: ContentAPIAdapter) {
  if (!this.cmsID) {
    this.payload.logger.info('cmsID was not provided, creating a CMS...')
    const { id } = await this.request('/create-cms')
    this.payload.logger.info(`Created CMS, ID=${id}`)
    this.cmsID = id
  }

  for (const collection of this.payload.config.collections) {
    const { id, status } = await this.request('/create-collection', {
      collectionSlug: collection.slug,
    })
    if (status === 'inserted') {
      this.payload.logger.info(`Collection ${collection.slug} was inserted with ID=${id}`)
    } else {
      this.payload.logger.info(`Collection ${collection.slug} already exists with ID=${id}`)
    }
  }

  for (const globalConfig of this.payload.config.globals) {
    const { id, status } = await this.request('/create-collection', {
      collectionSlug: getGlobalSlug(globalConfig.slug),
    })
    if (status === 'inserted') {
      this.payload.logger.info(`Global ${globalConfig.slug} was inserted with ID=${id}`)
    } else {
      this.payload.logger.info(`Global ${globalConfig.slug} already exists with ID=${id}`)
    }
  }
}

export type ContentAPIField = {
  path: string
  type: 'boolean' | 'date' | 'json' | 'number' | 'text'
  value: unknown
}

const transformField = ({
  config,
  data,
  field,
  key,
  keyPrefix,
  parentIsLocalized,
  result,
}: {
  config: SanitizedConfig
  data: any
  field: FlattenedField
  key: string
  keyPrefix: string
  parentIsLocalized: boolean
  result: ContentAPIField[]
}) => {
  const fieldData = data[key]

  if (field.type === 'tab' || field.type === 'group') {
    if (!(fieldData && typeof fieldData === 'object')) {
      return
    }

    const tabResult = transformDataIntoContentAPIFields({
      config,
      data: fieldData,
      fields: field.flattenedFields,
      keyPrefix: `${keyPrefix}${key}.`,
      parentIsLocalized: field.localized || field.localized,
    })

    result.push(...tabResult)
    return
  }

  if (field.type === 'array' || field.type === 'blocks') {
    if (!(fieldData && Array.isArray(fieldData))) {
      return
    }

    for (const [i, item] of fieldData.entries()) {
      let fieldsToUse: FlattenedField[]

      if (field.type === 'array') {
        fieldsToUse = field.flattenedFields
      } else {
        const block = field.blocks.find((each) => each.slug === item.blockType)
        if (!block) {
          continue
        }

        fieldsToUse = [...block.flattenedFields, { name: 'blockType', type: 'text' }]
      }

      if (item && typeof item === 'object') {
        const itemResult = transformDataIntoContentAPIFields({
          config,
          data: item,
          fields: fieldsToUse,
          keyPrefix: `${keyPrefix}${key}.${i}.`,
          parentIsLocalized: field.localized || parentIsLocalized,
        })

        result.push(...itemResult)
      }
    }

    return
  }

  if (field.type === 'checkbox') {
    if (typeof fieldData === 'boolean' || fieldData === undefined || fieldData === null) {
      result.push({ type: 'boolean', path: `${keyPrefix}${key}`, value: fieldData })
    }
    return
  }

  if (field.type === 'date') {
    if (
      fieldData instanceof Date ||
      typeof fieldData === 'string' ||
      fieldData === undefined ||
      fieldData === null
    ) {
      result.push({
        type: 'date',
        path: `${keyPrefix}${field.name}`,
        value: fieldData instanceof Date ? fieldData.toISOString() : fieldData,
      })
    }
    return
  }

  if (field.type === 'json' || field.type === 'richText') {
    result.push({ type: 'json', path: `${keyPrefix}${key}`, value: fieldData })
    return
  }

  if (field.type === 'number') {
    if (typeof fieldData === 'number' || fieldData === undefined || fieldData === null) {
      result.push({ type: 'number', path: `${keyPrefix}${key}`, value: fieldData })
    }
    return
  }

  if (
    field.type === 'email' ||
    field.type === 'text' ||
    field.type === 'textarea' ||
    field.type === 'code' ||
    field.type === 'radio'
  ) {
    if (typeof fieldData === 'string' || fieldData === undefined || fieldData === null) {
      result.push({ type: 'text', path: `${keyPrefix}${key}`, value: fieldData })
    }
    return
  }

  if (field.type === 'upload' || field.type === 'relationship') {
    if (field.hasMany) {
      if (!Array.isArray(fieldData)) {
        return
      }

      for (const [i, value] of fieldData.entries()) {
        if (!value) {
          continue
        }

        if (Array.isArray(field.relationTo)) {
          if (!(typeof value === 'object' && 'relationTo' in value && 'value' in value)) {
            continue
          }

          result.push({
            type: 'text',
            path: `${keyPrefix}${key}.${i}.relationTo`,
            value: value.relationTo,
          })
          result.push({
            type: 'number',
            path: `${keyPrefix}${key}.${i}.value`,
            value: value.value,
          })
        } else {
          result.push({ type: 'number', path: `${keyPrefix}${key}.${i}`, value })
        }
      }

      return
    }

    if (Array.isArray(field.relationTo)) {
      if (!(typeof fieldData === 'object' && 'relationTo' in fieldData && 'value' in fieldData)) {
        return
      }

      result.push({
        type: 'text',
        path: `${keyPrefix}${field.name}.relationTo`,
        value: fieldData.relationTo,
      })
      result.push({
        type: 'number',
        path: `${keyPrefix}${field.name}.value`,
        value: fieldData.value,
      })
    } else {
      result.push({
        type: 'number',
        path: `${keyPrefix}${field.name}`,
        value: fieldData,
      })
    }

    return
  }

  if (field.type === 'select') {
    if (field.hasMany) {
      if (Array.isArray(fieldData)) {
        for (const [i, value] of fieldData.entries()) {
          result.push({ type: 'text', path: `${keyPrefix}${key}.${i}`, value })
        }
      }
    } else {
      result.push({ type: 'text', path: `${keyPrefix}${key}`, value: fieldData })
    }

    return
  }

  if (field.type === 'point') {
    // throw new Error('TODO')
  }
}

const transformDataIntoContentAPIFields = ({
  config,
  data,
  fields,
  keyPrefix = '',
  parentIsLocalized,
}: {
  config: SanitizedConfig
  data: any
  fields: FlattenedField[]
  keyPrefix?: string
  parentIsLocalized: boolean
}): ContentAPIField[] => {
  const result: ContentAPIField[] = []

  for (const field of fields) {
    if (!(field.name in data)) {
      continue
    }

    if (config.localization && fieldShouldBeLocalized({ field, parentIsLocalized })) {
      if (!data[field.name] || typeof data[field.name] !== 'object') {
        continue
      }

      for (const locale of config.localization.localeCodes) {
        if (!(locale in data[field.name])) {
          continue
        }

        transformField({
          config,
          data: data[field.name],
          field,
          key: locale,
          keyPrefix: `${keyPrefix}${field.name}.`,
          parentIsLocalized,
          result,
        })
      }
    } else {
      transformField({
        config,
        data,
        field,
        key: field.name,
        keyPrefix,
        parentIsLocalized,
        result,
      })
    }
  }

  return result
}

type Operator =
  | 'equals'
  | 'exists'
  | 'greater_than'
  | 'greater_than_equal'
  | 'in'
  | 'less_than'
  | 'less_than_equal'
  | 'not_equals'
  | 'not_in'

export type WhereConstraint =
  | {
      and: WhereConstraint[]
    }
  | {
      operator: Operator
      path: string
      type: ContentAPIField['type']
      value: unknown
    }
  | {
      or: WhereConstraint[]
    }

const transformQueryValue = ({
  fields,
  operator,
  path,
  value,
}: {
  fields: FlattenedField[]
  operator: Operator
  path: string
  value: any
}) => {
  let field = getFieldByPath({ fields, path })?.field

  if (!field) {
    if (path === 'id') {
      field = { name: 'id', type: 'number' }
      // todo improve here
    } else if (path.endsWith('.relationTo')) {
      field = { name: path, type: 'text' }
    } else if (path.endsWith('.value')) {
      field = { name: path, type: 'number' }
    }
  }

  if (operator === 'in' || operator === 'not_in') {
    if (typeof value === 'string') {
      value = createArrayFromCommaDelineated(value)
    }
  }

  if (
    operator === 'greater_than' ||
    operator === 'greater_than_equal' ||
    operator === 'less_than' ||
    operator === 'less_than_equal'
  ) {
    if (field.type === 'number') {
      value = Number(value)
    }

    return value
  }

  if (operator === 'exists') {
    if (typeof value === 'string') {
      if (value === 'false') {
        value = false
      } else {
        value = true
      }
    }
    return value
  }

  if (field.type === 'number' || field.type === 'relationship' || field.type === 'upload') {
    if (typeof value === 'string') {
      if (value === 'null') {
        value = null
      } else {
        value = Number(value)
      }
    } else if (Array.isArray(value)) {
      value = value.map((e) => Number(e))
    }
  }

  if (field.type === 'date') {
    value = new Date(value).toISOString()
  }

  if (field.type === 'checkbox') {
    if (typeof value === 'string') {
      if (value === 'null') {
        value = null
      } else if (value === 'false') {
        value = false
      } else {
        value = true
      }
    } else if (Array.isArray(value)) {
      value = value.map((e) => Boolean(e))
    }
  }

  return value
}

// TODO ARRAYS
const transformWhereIntoWhereConstraints = ({
  fields,
  locale,
  where,
}: {
  fields: FlattenedField[]
  locale?: string
  where?: Where
}): WhereConstraint[] => {
  if (!where) {
    return []
  }
  const constraints: WhereConstraint[] = []

  for (const key of Object.keys(where)) {
    const value = where[key] as any

    if (['AND', 'OR'].includes(key.toUpperCase()) && Array.isArray(value)) {
      const result: WhereConstraint[] = []
      for (const where of value) {
        result.push(...transformWhereIntoWhereConstraints({ fields, where }))
      }
      // @ts-expect-error
      constraints.push({ [key.toLowerCase() as 'and' | 'or']: result })
    } else {
      const operator = Object.keys(value)[0] as any
      const queryValue = transformQueryValue({
        fields,
        operator,
        path: key,
        value: value[operator],
      })

      if (key === 'id') {
        constraints.push({ type: 'number', operator, path: 'id', value: queryValue })
      } else {
        const fieldResult = getFieldByPath({ fields, path: key })

        if (!fieldResult) {
          continue
        }

        const { field, localizedPath, pathHasLocalized } = fieldResult

        let type: ContentAPIField['type'] | null = null

        if (field.type === 'checkbox') {
          type = 'boolean'
        } else if (
          field.type === 'number' ||
          field.type === 'relationship' ||
          field.type === 'upload'
        ) {
          type = 'number'
        } else if (field.type === 'date') {
          type = 'date'
        } else if (field.type === 'richText' || field.type === 'json') {
          type = 'json'
        } else if (
          field.type === 'code' ||
          field.type === 'email' ||
          field.type === 'radio' ||
          (field.type === 'select' && !field.hasMany) ||
          field.type === 'text' ||
          field.type === 'textarea'
        ) {
          type = 'text'
        }

        let pathToUse = key

        if (pathHasLocalized) {
          pathToUse = localizedPath.replace('<locale>', locale)
        }

        if (type) {
          constraints.push({ type, operator, path: pathToUse, value: queryValue })
        }
      }
    }
  }

  return constraints
}

const getFields = ({
  adapter,
  collectionSlug,
  versions,
}: {
  adapter: ContentAPIAdapter
  collectionSlug: string
  versions?: boolean
}) => {
  let fields: FlattenedField[]
  let globalConfig: null | SanitizedGlobalConfig = null
  if (slugIsGlobal(collectionSlug)) {
    globalConfig = adapter.payload.globals.config.find(
      (e) => e.slug === collectionSlug.replace('_global-', ''),
    )
    fields = globalConfig.flattenedFields
  } else {
    fields = adapter.payload.collections[collectionSlug].config.flattenedFields
  }

  if (versions) {
    if (globalConfig) {
      fields = buildVersionGlobalFields(adapter.payload.config, globalConfig, true)
    } else {
      fields = buildVersionCollectionFields(
        adapter.payload.config,
        adapter.payload.collections[collectionSlug].config,
        true,
      )
    }
  }

  return fields
}

type OrderBy = { order: 'asc' | 'desc'; path: string; type: ContentAPIField['type'] }

const findMany = async ({
  adapter,
  collectionSlug,
  countPath,
  fields,
  findPath,
  limit,
  locale,
  page,
  pagination,
  skip,
  sort,
  where,
}: {
  adapter: ContentAPIAdapter
  collectionSlug: string
  countPath: string
  fields: FlattenedField[]
  findPath: string
  limit: number
  locale?: string
  page: number
  pagination?: boolean
  skip?: number
  sort?: string
  where: Where
}) => {
  const whereConstraints = transformWhereIntoWhereConstraints({ fields, locale, where })

  const offset = skip || (page - 1) * limit

  let resolvedLimit: number | undefined = limit
  if (limit === 0) {
    pagination = false
    resolvedLimit = undefined
  }

  let totalDocs: number | undefined = undefined
  let totalPages: number
  let hasPrevPage: boolean
  let hasNextPage: boolean
  let pagingCounter: number

  if (pagination !== false) {
    const { count } = await adapter.request(countPath, {
      collectionSlug,
      whereConstraints,
    })
    totalDocs = count

    totalPages =
      typeof resolvedLimit === 'number' && limit !== 0 ? Math.ceil(totalDocs / resolvedLimit) : 1
    hasPrevPage = page > 1
    hasNextPage = totalPages > page
    pagingCounter = (page - 1) * resolvedLimit + 1
  }

  let orderBy: OrderBy

  if (sort) {
    const fieldPath = sort.startsWith('-') ? sort.replace('-', '') : sort
    const field = getFieldByPath({ fields, path: fieldPath })
    if (!field) {
      orderBy = { type: 'date', order: 'desc', path: 'createdAt' }
    } else {
      let type: ContentAPIField['type'] = 'text'

      switch (field.field.type) {
        case 'checkbox': {
          type = 'boolean'
          break
        }
        case 'code':
        case 'email':
        case 'radio':
        case 'select':
        case 'text':
        case 'textarea': {
          type = 'text'
          break
        }
        case 'date': {
          type = 'date'
          break
        }
        case 'json':
        case 'richText': {
          type = 'json'
          break
        }
        case 'number':
        case 'relationship':
        case 'upload': {
          type = 'number'
          break
        }
      }

      // TODO ARRAYS
      orderBy = { type, order: sort.startsWith('-') ? 'desc' : 'asc', path: findPath }
    }
  } else {
    orderBy = { type: 'date', order: 'desc', path: 'createdAt' }
  }

  const rawDocs = await adapter.request(findPath, {
    collectionSlug,
    limit: resolvedLimit,
    offset,
    orderBy,
    whereConstraints,
  })

  if (pagination === false || !totalDocs) {
    totalDocs = rawDocs.length
    totalPages = 1
    pagingCounter = 1
    hasPrevPage = false
    hasNextPage = false
  }

  return {
    docs: rawDocs.map((each) => ({
      ...each.data,
      id: each.id,
      ...('parent' in each && { parent: each.parent }),
      ...('latest' in each && { latest: each.latest }),
    })),
    hasNextPage,
    hasPrevPage,
    limit: resolvedLimit,
    nextPage: hasNextPage ? page + 1 : null,
    page,
    pagingCounter,
    prevPage: hasPrevPage ? page - 1 : null,
    totalDocs,
    totalPages,
  }
}

const find: Find = async function find(
  this: ContentAPIAdapter,
  { collection: collectionSlug, limit = 0, locale, page = 1, pagination, skip, where },
) {
  const fields = this.payload.collections[collectionSlug]?.config.flattenedFields

  return findMany({
    adapter: this,
    collectionSlug,
    countPath: '/count',
    fields,
    findPath: '/find',
    limit,
    locale,
    page,
    pagination,
    skip,
    where,
  })
}

const findVersions: FindVersions = async function find(
  this: ContentAPIAdapter,
  { collection: collectionSlug, limit = 0, locale, page = 1, pagination, where },
) {
  const fields = buildVersionCollectionFields(
    this.payload.config,
    this.payload.collections[collectionSlug]?.config,
    true,
  )

  const res = await findMany({
    adapter: this,
    collectionSlug,
    countPath: '/count-versions',
    fields,
    findPath: '/find-versions',
    limit,
    locale,
    page,
    pagination,
    where,
  })

  return res
}

const queryDrafts: QueryDrafts = async function queryDrafts(
  this: ContentAPIAdapter,
  { collection: collectionSlug, limit, locale, page, pagination, sort, where = {} },
) {
  const combinedWhere = combineQueries({ latest: { equals: true } }, where)

  const result = (await this.findVersions({
    collection: collectionSlug,
    limit,
    locale,
    page,
    pagination,
    sort,
    where: combinedWhere,
  })) as any

  for (let i = 0; i < result.docs.length; i++) {
    const id = result.docs[i].parent
    // const localeStatus = result.docs[i].localeStatus || {}
    // if (locale && localeStatus[locale]) {
    //   result.docs[i].status = localeStatus[locale]
    //   result.docs[i].version._status = localeStatus[locale]
    // }

    result.docs[i] = result.docs[i].version ?? {}
    result.docs[i].id = id
  }

  return result
}

const createVersion: CreateVersion = async function createVersion(
  this: ContentAPIAdapter,
  { autosave, collectionSlug, createdAt, parent, updatedAt, versionData },
) {
  const version = { ...versionData }
  if (version.id) {
    delete version.id
  }

  const versionFields = transformDataIntoContentAPIFields({
    config: this.payload.config,
    data: version,
    fields: getFields({ adapter: this, collectionSlug }),
    parentIsLocalized: false,
  })

  const resultFields: ContentAPIField[] = [
    {
      type: 'boolean',
      path: 'autosave',
      value: autosave,
    },
    {
      type: 'date',
      path: 'createdAt',
      value: createdAt,
    },
    {
      type: 'date',
      path: 'updatedAt',
      value: updatedAt,
    },
    ...versionFields.map((e) => ({ ...e, path: `version.${e.path}` })),
  ]

  const { id } = await this.request('/create-version', {
    collectionSlug,
    data: resultFields,
    documentID: parent,
    latest: true,
  })

  const {
    docs: [doc],
  } = await this.findVersions({
    collection: collectionSlug,
    limit: 1,
    pagination: false,
    where: { id: { equals: id } },
  })

  return doc as any
}

const updateVersion: UpdateVersion = async function updateVersion(
  this: ContentAPIAdapter,
  { id, collection: collectionSlug, locale, versionData, where },
) {
  const version: any = versionData

  delete version.parent
  let latest: boolean | undefined = undefined

  if (version.latest) {
    latest = version.latest
    delete version.latest
  }

  const versionFields = transformDataIntoContentAPIFields({
    config: this.payload.config,
    data: versionData,
    fields: getFields({ adapter: this, collectionSlug, versions: true }),
    parentIsLocalized: false,
  })

  await this.request('/update-versions', {
    collectionSlug,
    data: versionFields,
    latest,
    whereConstraints: transformWhereIntoWhereConstraints({
      fields: getFields({ adapter: this, collectionSlug, versions: true }),
      locale,
      where: where ?? { id: { equals: id } },
    }),
  })

  const {
    docs: [doc],
  } = await this.findVersions({
    collection: collectionSlug,
    limit: 1,
    locale,
    pagination: false,
    where: where ?? { id: { equals: id } },
  })

  return doc as any
}

const deleteVersions: DeleteVersions = async function deleteVersions(
  this: ContentAPIAdapter,
  { collection: collectionSlug, locale, where },
) {
  await this.request('/delete-versions', {
    collectionSlug,
    whereConstraints: transformWhereIntoWhereConstraints({
      fields: getFields({ adapter: this, collectionSlug, versions: true }),
      locale,
      where,
    }),
  })
}

const findOne: FindOne = async function findOne(
  this: ContentAPIAdapter,
  { collection, locale, where },
) {
  const {
    docs: [first],
  } = await this.find({ collection, limit: 1, locale, pagination: false, where })

  return first as any
}

const updateMany: UpdateMany = async function updateMany(
  this: ContentAPIAdapter,
  { collection: collectionSlug, data, locale, where },
) {
  const whereConstraints = transformWhereIntoWhereConstraints({
    fields: getFields({ adapter: this, collectionSlug }),
    locale,
    where,
  })
  const dataToUpdate = transformDataIntoContentAPIFields({
    config: this.payload.config,
    data,
    fields: getFields({ adapter: this, collectionSlug }),
    parentIsLocalized: false,
  })
  if (!dataToUpdate.some((e) => e.path === 'updatedAt')) {
    dataToUpdate.push({
      type: 'date',
      path: 'updatedAt',
      value: new Date().toISOString(),
    })
  }

  await this.request('/update', {
    collectionSlug,
    data: dataToUpdate,
    whereConstraints,
  })

  const { docs } = await this.find({
    collection: collectionSlug,
    limit: 1,
    locale,
    pagination: false,
    where,
  })

  return docs
}

const updateOne: UpdateOne = async function updateOne(
  this: ContentAPIAdapter,
  { id, collection: collectionSlug, data, locale, where },
) {
  await this.updateMany({
    collection: collectionSlug,
    data,
    limit: 1,
    locale,
    where: where ?? { id: { equals: id } },
  })

  const res = await this.findOne({
    collection: collectionSlug,
    locale,
    where: where ?? { id: { equals: id } },
  })

  return res
}

const deleteMany: DeleteMany = async function deleteMany(
  this: ContentAPIAdapter,
  { collection: collectionSlug, where },
) {
  const whereConstraints = transformWhereIntoWhereConstraints({
    fields: getFields({ adapter: this, collectionSlug }),
    where,
  })

  await this.request('/delete', { collectionSlug, whereConstraints })
}

const deleteOne: DeleteOne = async function deleteOne(
  this: ContentAPIAdapter,
  { collection: collectionSlug, where },
) {
  const whereConstraints = transformWhereIntoWhereConstraints({
    fields: getFields({ adapter: this, collectionSlug }),
    where,
  })
  const doc = await this.findOne({ collection: collectionSlug, where })
  await this.request('/delete', { collectionSlug, whereConstraints })
  return doc
}

const create: Create = async function create(this: ContentAPIAdapter, args) {
  const { id } = await this.request('/create', {
    collectionSlug: args.collection,
    data: transformDataIntoContentAPIFields({
      config: this.payload.config,
      data: {
        ...args.data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      fields: getFields({ adapter: this, collectionSlug: args.collection }),
      parentIsLocalized: false,
    }),
  })

  const [doc] = await this.request('/find', {
    collectionSlug: args.collection,
    limit: 1,
    whereConstraints: [
      {
        type: 'number',
        operator: 'equals',
        path: 'id',
        value: id,
      },
    ],
  })

  return {
    id: doc.id,
    ...doc.data,
  }
}

const count: Count = async function (
  this: ContentAPIAdapter,
  { collection: collectionSlug, locale, where },
) {
  const { count } = await this.request('/count', {
    collectionSlug,
    whereConstraints: transformWhereIntoWhereConstraints({
      fields: getFields({ adapter: this, collectionSlug }),
      locale,
      where,
    }),
  })

  return { totalDocs: count }
}

const countVersions: CountVersions = async function (
  this: ContentAPIAdapter,
  { collection: collectionSlug, locale, where },
) {
  const { count } = await this.request('/count-versions', {
    collectionSlug,
    whereConstraints: transformWhereIntoWhereConstraints({
      fields: getFields({ adapter: this, collectionSlug, versions: true }),
      locale,
      where,
    }),
  })

  return { totalDocs: count }
}

const upsert: Upsert = async function (
  this: ContentAPIAdapter,
  { collection: collectionSlug, data, locale, where },
) {
  const { id } = await this.request('/upsert', {
    collectionSlug,
    data: transformDataIntoContentAPIFields({
      config: this.payload.config,
      data,
      fields: getFields({ adapter: this, collectionSlug }),
      parentIsLocalized: false,
    }),
    whereConstraints: transformWhereIntoWhereConstraints({
      fields: getFields({ adapter: this, collectionSlug }),
      locale,
      where,
    }),
  })
  const doc = await this.findOne({
    collection: collectionSlug,
    locale,
    where: { id: { equals: id } },
  })
  return doc
}

const createGlobal: CreateGlobal = function (this: ContentAPIAdapter, { slug, data }) {
  return this.create({ collection: getGlobalSlug(slug), data: { ...data, globalType: slug } })
}

const findGlobal: FindGlobal = function (this: ContentAPIAdapter, { slug, locale, where = {} }) {
  return this.findOne({ collection: getGlobalSlug(slug), locale, where }) as any
}

const updateGlobal: UpdateGlobal = function (this: ContentAPIAdapter, { slug, data }) {
  return this.updateOne({ collection: getGlobalSlug(slug), data, where: {} })
}

const findGlobalVersions: FindGlobalVersions = function (
  this: ContentAPIAdapter,
  { global: slug, limit, locale, page, pagination, skip, sort, where },
) {
  return this.findVersions({
    collection: getGlobalSlug(slug),
    limit,
    locale,
    page,
    pagination,
    skip,
    sort,
    where,
  })
}

const createGlobalVersion: CreateGlobalVersion = function (
  this: ContentAPIAdapter,
  { autosave, createdAt, globalSlug, parent, updatedAt, versionData },
) {
  return this.createVersion({
    autosave,
    collectionSlug: getGlobalSlug(globalSlug),
    createdAt,
    parent,
    updatedAt,
    versionData,
  })
}

const updateGlobalVersion: UpdateGlobalVersion = function (
  this: ContentAPIAdapter,
  { id, global: slug, locale, versionData, where = {} },
) {
  // @ts-expect-error
  return this.updateVersion({ id, collection: getGlobalSlug(slug), locale, versionData, where })
}

const countGlobalVersions: CountGlobalVersions = function (
  this: ContentAPIAdapter,
  { global: slug, locale, where },
) {
  return this.countVersions({ collection: getGlobalSlug(slug), locale, where })
}

const request = async function <T = any>(this: ContentAPIAdapter, path, body = {}): Promise<T> {
  const res = await fetch(`${this.contentAPIURL}${path}`, {
    body: JSON.stringify({
      cmsID: this.cmsID,
      ...body,
    }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })

  return res.json() as T
}

export const contentAPIAdapter = (opts: ContentAPIDatabaseAdapterOptions): DatabaseAdapterObj => {
  return {
    name: 'content_api',
    defaultIDType: 'number',
    init: ({ payload }) => {
      return createDatabaseAdapter<ContentAPIAdapter>({
        name: 'content_api',
        beginTransaction: undefined,
        cmsID: opts.cmsID,
        commitTransaction: undefined,
        contentAPIURL: opts.contentAPIURL,
        count,
        countGlobalVersions,
        countVersions,
        create,
        createGlobal,
        createGlobalVersion,
        createVersion,
        defaultIDType: 'number',
        deleteMany,
        deleteOne,
        deleteVersions,
        find,
        findDistinct: undefined,
        findGlobal,
        findGlobalVersions,
        findOne,
        findVersions,
        init,
        packageName: '@payloadcms/db-content-api',
        payload,
        queryDrafts,
        request,
        rollbackTransaction: async () => {},
        updateGlobal,
        updateGlobalVersion,
        updateMany,
        updateOne,
        updateVersion,
        upsert,
      })
    },
  }
}
