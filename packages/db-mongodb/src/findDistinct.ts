import type { PipelineStage } from 'mongoose'
import type { FindDistinct, FlattenedField } from 'payload'

import { getFieldByPath } from 'payload'

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

  const { where = {} } = args

  let sortAggregation: PipelineStage[] = []

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
    config: this.payload.config,
    fields: collectionConfig.flattenedFields,
    includeRelationships: true,
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
  let foundField: FlattenedField | null = null

  let rels: {
    fieldPath: string
    relationTo: string
  }[] = []

  let tempPath = ''
  let insideRelation = false

  const segments = args.field.split('.')

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    const field = currentFields.find((e) => e.name === segment)
    if (rels.length) {
      insideRelation = true
    }

    if (!field) {
      break
    }

    if (tempPath) {
      tempPath = `${tempPath}.${field.name}`
    } else {
      tempPath = field.name
    }

    if ('flattenedFields' in field) {
      currentFields = field.flattenedFields
      continue
    }

    if (
      (field.type === 'relationship' || field.type === 'upload') &&
      typeof field.relationTo === 'string'
    ) {
      if (i === segments.length - 2 && segments[i + 1] === 'id') {
        foundField = field
        fieldPath = tempPath
        break
      }
      rels.push({ fieldPath: tempPath, relationTo: field.relationTo })
      currentFields = this.payload.collections[field.relationTo]?.config
        .flattenedFields as FlattenedField[]
      continue
    }
    foundField = field
  }

  const resolvedField = foundField || fieldPathResult?.field
  const isHasManyValue = resolvedField && 'hasMany' in resolvedField && resolvedField

  let relationLookup: null | PipelineStage[] = null

  if (!insideRelation) {
    rels = []
  }

  if (rels.length) {
    if (sortProperty.startsWith('_')) {
      const sortWithoutRelationPrefix = sortProperty.replace(/^_+/, '')
      const lastFieldPath = rels.at(-1)?.fieldPath as string
      if (sortWithoutRelationPrefix.startsWith(lastFieldPath)) {
        sortProperty = sortWithoutRelationPrefix
      }
    }
    relationLookup = rels.reduce<PipelineStage[]>((acc, { fieldPath, relationTo }) => {
      sortAggregation = sortAggregation.filter((each) => {
        if ('$lookup' in each && each.$lookup.as.replace(/^_+/, '') === fieldPath) {
          return false
        }

        return true
      })
      const { Model: foreignModel } = getCollection({ adapter: this, collectionSlug: relationTo })
      acc.push({
        $lookup: {
          as: fieldPath,
          foreignField: '_id',
          from: foreignModel.collection.name,
          localField: fieldPath,
        },
      })
      acc.push({ $unwind: `$${fieldPath}` })
      return acc
    }, [])
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
      _id: `$${fieldPath}`,
      ...(sortProperty === fieldPath
        ? {}
        : {
            _sort: { $max: `$${sortProperty}` },
          }),
    }
  }

  const pipeline: PipelineStage[] = [
    {
      $match: query,
    },
    ...(sortAggregation.length > 0 ? sortAggregation : []),
    ...(relationLookup?.length ? relationLookup : []),
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
        [sortProperty === fieldPath ? '_id' : '_sort']: sortDirection,
      },
    },
  ]

  const session = await getSession(this, args.req)

  const getValues = async () => {
    return Model.aggregate(pipeline, { session }).then((res) =>
      res.map((each) => ({
        [args.field]: JSON.parse(JSON.stringify(each._id)),
      })),
    )
  }

  if (args.limit) {
    pipeline.push({
      $skip: (page - 1) * args.limit,
    })
    pipeline.push({ $limit: args.limit })

    // Build count pipeline with the same structure as the main pipeline
    // to ensure relationship lookups are included
    const countPipeline: PipelineStage[] = [
      {
        $match: query,
      },
      ...(sortAggregation.length > 0 ? sortAggregation : []),
      ...(relationLookup?.length ? relationLookup : []),
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
      { $count: 'count' },
    ]

    const totalDocs = await Model.aggregate(countPipeline, {
      session,
    }).then((res) => res[0]?.count ?? 0)
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
