import type { PipelineStage } from 'mongoose'
import type { FindDistinct, FlattenedField } from 'payload'

import { APIError, getFieldByPath } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildQuery } from './queries/buildQuery.js'
import { buildSortParam } from './queries/buildSortParam.js'
import { getCollection } from './utilities/getEntity.js'
import { getSession } from './utilities/getSession.js'

export const findDistinct: FindDistinct = async function (this: MongooseAdapter, args) {
  const { collectionConfig, Model } = getCollection({
    adapter: this,
    collectionSlug: args.collection,
  })

  const session = await getSession(this, args.req)

  const { where = {} } = args

  const sortAggregation: PipelineStage[] = []

  const sort = buildSortParam({
    adapter: this,
    config: this.payload.config,
    fields: collectionConfig.flattenedFields,
    locale: args.locale,
    sort: args.sort ?? args.field,
    sortAggregation,
    timestamps: true,
  })

  const query = await buildQuery({
    adapter: this,
    collectionSlug: args.collection,
    fields: collectionConfig.flattenedFields,
    locale: args.locale,
    where,
  })

  const fieldPathResult = getFieldByPath({
    fields: collectionConfig.flattenedFields,
    path: args.field,
  })
  let fieldPath = args.field
  if (fieldPathResult?.pathHasLocalized && args.locale) {
    fieldPath = fieldPathResult.localizedPath.replace('<locale>', args.locale)
  }

  const page = args.page || 1

  let sortProperty = Object.keys(sort)[0]! // assert because buildSortParam always returns at least 1 key.
  const sortDirection = sort[sortProperty] === 'asc' ? 1 : -1

  let currentFields = collectionConfig.flattenedFields
  let relationTo: null | string = null
  let foundField: FlattenedField | null = null
  let foundFieldPath = ''
  let relationFieldPath = ''

  for (const segment of args.field.split('.')) {
    const field = currentFields.find((e) => e.name === segment)

    if (!field) {
      break
    }

    if (relationTo) {
      foundFieldPath = `${foundFieldPath}${field?.name}`
    } else {
      relationFieldPath = `${relationFieldPath}${field.name}`
    }

    if ('flattenedFields' in field) {
      currentFields = field.flattenedFields

      if (relationTo) {
        foundFieldPath = `${foundFieldPath}.`
      } else {
        relationFieldPath = `${relationFieldPath}.`
      }
      continue
    }

    if (
      (field.type === 'relationship' || field.type === 'upload') &&
      typeof field.relationTo === 'string'
    ) {
      if (relationTo) {
        throw new APIError(
          `findDistinct for fields nested to relationships supported 1 level only, errored field: ${args.field}`,
        )
      }
      relationTo = field.relationTo
      currentFields = this.payload.collections[field.relationTo]?.config
        .flattenedFields as FlattenedField[]
      continue
    }
    foundField = field

    if (
      sortAggregation.some(
        (stage) => '$lookup' in stage && stage.$lookup.localField === relationFieldPath,
      )
    ) {
      sortProperty = sortProperty.replace('__', '')
      sortAggregation.pop()
    }
  }

  const resolvedField = foundField || fieldPathResult?.field
  const isHasManyValue = resolvedField && 'hasMany' in resolvedField && resolvedField

  let relationLookup: null | PipelineStage = null
  if (relationTo && foundFieldPath && relationFieldPath) {
    const { Model: foreignModel } = getCollection({ adapter: this, collectionSlug: relationTo })

    relationLookup = {
      $lookup: {
        as: relationFieldPath,
        foreignField: '_id',
        from: foreignModel.collection.name,
        localField: relationFieldPath,
      },
    }
  }

  let $unwind: any = ''
  let $group: any = null
  if (
    isHasManyValue &&
    sortAggregation.length &&
    sortAggregation[0] &&
    '$lookup' in sortAggregation[0]
  ) {
    $unwind = { path: `$${sortAggregation[0].$lookup.as}`, preserveNullAndEmptyArrays: true }
    $group = {
      _id: {
        _field: `$${sortAggregation[0].$lookup.as}._id`,
        _sort: `$${sortProperty}`,
      },
    }
  } else if (isHasManyValue) {
    $unwind = { path: `$${args.field}`, preserveNullAndEmptyArrays: true }
  }

  if (!$group) {
    $group = {
      _id: {
        _field: `$${fieldPath}`,
        ...(sortProperty === fieldPath
          ? {}
          : {
              _sort: `$${sortProperty}`,
            }),
      },
    }
  }

  const pipeline: PipelineStage[] = [
    {
      $match: query,
    },
    ...(sortAggregation.length > 0 ? sortAggregation : []),
    ...(relationLookup ? [relationLookup, { $unwind: `$${relationFieldPath}` }] : []),
    ...($unwind
      ? [
          {
            $unwind,
          },
        ]
      : []),
    {
      $group,
    },
    {
      $sort: {
        [sortProperty === fieldPath ? '_id._field' : '_id._sort']: sortDirection,
      },
    },
  ]

  const getValues = async () => {
    return Model.aggregate(pipeline, { session }).then((res) =>
      res.map((each) => ({
        [args.field]: JSON.parse(JSON.stringify(each._id._field)),
      })),
    )
  }

  if (args.limit) {
    pipeline.push({
      $skip: (page - 1) * args.limit,
    })
    pipeline.push({ $limit: args.limit })
    const totalDocs = await Model.aggregate(
      [
        {
          $match: query,
        },
        {
          $group: {
            _id: `$${fieldPath}`,
          },
        },
        { $count: 'count' },
      ],
      {
        session,
      },
    ).then((res) => res[0]?.count ?? 0)
    const totalPages = Math.ceil(totalDocs / args.limit)
    const hasPrevPage = page > 1
    const hasNextPage = totalPages > page
    const pagingCounter = (page - 1) * args.limit + 1

    return {
      hasNextPage,
      hasPrevPage,
      limit: args.limit,
      nextPage: hasNextPage ? page + 1 : null,
      page,
      pagingCounter,
      prevPage: hasPrevPage ? page - 1 : null,
      totalDocs,
      totalPages,
      values: await getValues(),
    }
  }

  const values = await getValues()

  return {
    hasNextPage: false,
    hasPrevPage: false,
    limit: 0,
    page: 1,
    pagingCounter: 1,
    totalDocs: values.length,
    totalPages: 1,
    values,
  }
}
