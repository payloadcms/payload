import type { PipelineStage } from 'mongoose'
import type {
  BranchProjectionQueryContext,
  FlattenedField,
  JoinQuery,
  Operator,
  Where,
} from 'payload'

import { APIError, getFieldByPath, getLocalizedPaths } from 'payload'
import { isNestedRelationshipQuery, validOperatorSet } from 'payload/shared'

import type { MongooseAdapter } from '../index.js'

import { buildSearchParam } from '../queries/buildSearchParams.js'
import { getCollection } from '../utilities/getEntity.js'
import { compileProjectionScalarMatch } from './compileProjectionScalarMatch.js'

type Stage = Record<string, any>
type State = {
  adapter: MongooseAdapter
  context: BranchProjectionQueryContext
  isCompilingAccess: boolean
  locale?: string
  nextAlias: number
  privateFields: Set<string>
}

type Relation = {
  collection: string
  field: any
  path: string
}

/** Native correlated lookups keep effective predicates inside MongoDB and the caller's session. */
export const buildProjectionQuery = async ({
  adapter,
  collection,
  context,
  locale,
  where = {},
}: {
  adapter: MongooseAdapter
  collection: string
  context: BranchProjectionQueryContext
  locale?: string
  where?: Where
}) => {
  const state: State = {
    adapter,
    context,
    isCompilingAccess: false,
    locale,
    nextAlias: 0,
    privateFields: new Set(),
  }
  const stages: Stage[] = []
  const hasGeospatialPredicate =
    hasNearPredicate({ where }) ||
    (context.rootAccess?.collection === collection &&
      !!context.rootAccess.where &&
      hasNearPredicate({ where: context.rootAccess.where })) ||
    Object.values(context.relationAccess).some(
      (access) => access && hasNearPredicate({ where: access }),
    )
  const inverse = hasGeospatialPredicate
    ? undefined
    : findInversePredicate({ collection, state, where })
  if (
    inverse &&
    (context.rootAccess?.collection === collection
      ? context.rootAccess.where
      : context.relationAccess[collection])
  ) {
    stages.push({ $match: visibility({ collection: inverse.target, state }) })
    const foreignAccess = context.relationAccess[inverse.target]
    stages.push({
      $match: !foreignAccess
        ? { $expr: false }
        : await compileAccessWhere({
            collection: inverse.target,
            depth: 0,
            stages,
            state,
            where: foreignAccess,
          }),
    })
    stages.push({
      $match: await compileWhere({
        collection: inverse.target,
        depth: 0,
        stages,
        state,
        where: inverse.where,
      }),
    })
    const alias = nextAlias({ state })
    stages.push({
      $lookup: {
        as: alias,
        foreignField: inverse.path,
        from: getCollection({ adapter, collectionSlug: collection }).Model.collection.name,
        localField: '_id',
      },
    })
    stages.push(
      { $unwind: `$${alias}` },
      { $replaceWith: `$${alias}` },
      { $group: { _id: '$_id', __branchRoot: { $first: '$$ROOT' } } },
      { $replaceWith: '$__branchRoot' },
    )
  }
  const access =
    context.rootAccess?.collection === collection
      ? context.rootAccess.where
      : context.relationAccess[collection]
  const geo = await extractNear({
    collection,
    state,
    where: inverse && access ? inverse.remaining : where,
  })
  const policyGeo = await extractNear({ collection, state, where: access || {} })
  const near = combineNear({ near: geo.near, policyNear: policyGeo.near })

  if (near) {
    stages.push({ $geoNear: { ...near, query: visibility({ collection, state }) } })
  } else {
    stages.push({ $match: visibility({ collection, state }) })
  }

  const graphTarget = context.graphTarget
  const root = adapter.payload.collections[collection]?.config
  const source = root?.custom?.branchProjectionStorage?.collection
  if (
    !adapter.collation &&
    graphTarget?.collection === collection &&
    Array.isArray(graphTarget.ids) &&
    graphTarget.ids.length > 0 &&
    graphTarget.ids.length <= 50 &&
    graphTarget.ids.every((id) => typeof id === 'string' && /^bp2:[\w-]{43}$/.test(id)) &&
    typeof source === 'string' &&
    adapter.payload.collections[source]?.config.custom?.branchQueryStorage?.projection ===
      collection &&
    !root?.custom?.branchProjectionStorage?.global
  ) {
    stages.push({ $match: { _id: { $in: graphTarget.ids } } })
  }

  if (!access) {
    stages.push({ $match: { $expr: false } })
  } else {
    stages.push({
      $match: await compileAccessWhere({
        collection,
        depth: 0,
        stages,
        state,
        where: policyGeo.where,
      }),
    })
  }
  const predicate = await compileWhere({ collection, depth: 0, stages, state, where: geo.where })

  stages.push({ $match: predicate })

  return {
    buildJoins: ({ joins }: { joins?: JoinQuery }) => buildJoins({ collection, joins, state }),
    privateFields: state.privateFields,
    resolvePath: async ({ path }: { path: string }) => {
      const sortStages: Stage[] = []
      const resolved = await resolveValue({ collection, depth: 0, path, stages: sortStages, state })

      return { path: resolved, stages: sortStages as PipelineStage[] }
    },
    sourceCollection:
      inverse &&
      (context.rootAccess?.collection === collection
        ? context.rootAccess.where
        : context.relationAccess[collection])
        ? inverse.target
        : collection,
    stages: stages as PipelineStage[],
  }
}

const hasNearPredicate = ({ where }: { where: Where }): boolean =>
  Object.entries(where).some(([path, value]) =>
    ['and', 'or'].includes(path.toLowerCase()) && Array.isArray(value)
      ? value.some((where) => hasNearPredicate({ where }))
      : Boolean(value && typeof value === 'object' && Object.hasOwn(value, 'near')),
  )

/** A mandatory positive relation predicate can drive an indexed native reverse semijoin. */
const findInversePredicate = ({
  collection,
  state,
  where,
}: {
  collection: string
  state: State
  where: Where
}): { path: string; remaining: Where; target: string; where: Where } | undefined => {
  const config = state.adapter.payload.collections[collection]?.config
  if (!config?.custom?.branchProjectionStorage) {
    return undefined
  }
  for (const [path, condition] of Object.entries(where)) {
    if (path.toLowerCase() === 'and' && Array.isArray(condition)) {
      for (let index = 0; index < condition.length; index++) {
        const found = findInversePredicate({ collection, state, where: condition[index]! })
        if (found) {
          return {
            ...found,
            remaining: {
              ...where,
              [path]: condition.map((item, child) => (child === index ? found.remaining : item)),
            },
          }
        }
      }
    } else if (
      !['and', 'or'].includes(path.toLowerCase()) &&
      condition &&
      typeof condition === 'object' &&
      !Array.isArray(condition) &&
      !Object.hasOwn(condition, 'near')
    ) {
      const paths = localizedPaths({
        collectionSlug: collection,
        fields: config.flattenedFields,
        incomingPath: path,
        locale: state.locale,
        overrideAccess: true,
        payload: state.adapter.payload,
        showHiddenFields: true,
      })
      const first = paths[0]
      if (
        paths.length !== 2 ||
        !first?.field ||
        !['relationship', 'upload'].includes(first.field.type) ||
        first.path.includes('.') ||
        !('relationTo' in first.field) ||
        typeof first.field.relationTo !== 'string'
      ) {
        continue
      }
      const leaf = paths[1]
      if (
        !leaf?.field ||
        ['array', 'blocks', 'group', 'join', 'relationship', 'upload'].includes(leaf.field.type)
      ) {
        continue
      }
      const remaining = { ...where }
      delete remaining[path]
      return {
        path: first.path,
        remaining,
        target: first.field.relationTo,
        where: { [leaf.path]: condition },
      }
    }
  }
  return undefined
}

/** Flatten each array boundary without pulling relationship identities into application memory. */
export const projectionPathValues = ({
  path,
  root = '$$ROOT',
}: {
  path: string
  root?: string
}): any =>
  path.split('.').reduce<any>(
    (input, segment) => ({
      $reduce: {
        in: {
          $concatArrays: [
            '$$value',
            {
              $let: {
                in: {
                  $cond: [
                    { $isArray: '$$item' },
                    '$$item',
                    { $cond: [{ $eq: [{ $ifNull: ['$$item', null] }, null] }, [], ['$$item']] },
                  ],
                },
                vars: {
                  item: {
                    $getField: {
                      field: { $literal: segment },
                      input: { $cond: [{ $eq: [{ $type: '$$this' }, 'object'] }, '$$this', {}] },
                    },
                  },
                },
              },
            },
          ],
        },
        initialValue: [],
        input,
      },
    }),
    [root],
  )

const effectiveCollection = ({
  collection,
  state,
}: {
  collection: string
  state: State
}): string => {
  const projection =
    state.adapter.payload.collections[collection]?.config.custom?.branchQueryStorage?.projection
  return typeof projection === 'string' ? projection : collection
}

const visibility = ({ collection, state }: { collection: string; state: State }): Stage => {
  const config = state.adapter.payload.collections[collection]?.config

  return config?.custom?.branchProjectionStorage
    ? {
        '_branchProjection.branchKey': state.context.branchKey,
        '_branchProjection.isVisible': true,
      }
    : {}
}

const compileWhere = async ({
  collection,
  depth,
  fallbackFields,
  stages,
  state,
  unionCollection,
  where,
}: {
  collection: string
  depth: number
  fallbackFields?: FlattenedField[]
  stages: Stage[]
  state: State
  unionCollection?: string
  where: Where
}): Promise<Stage> => {
  if (depth > 64) {
    throw new APIError('Branch relationship query exceeds the supported nesting depth.', 400)
  }

  const conditions: Stage[] = []

  for (const [incomingPath, operators] of Object.entries(where)) {
    if (['and', 'or'].includes(incomingPath.toLowerCase()) && Array.isArray(operators)) {
      const children: Stage[] = []

      for (const child of operators) {
        children.push(
          await compileWhere({
            collection,
            depth: depth + 1,
            fallbackFields,
            stages,
            state,
            unionCollection,
            where: child,
          }),
        )
      }

      if (children.length) {
        conditions.push({ [incomingPath.toLowerCase() === 'and' ? '$and' : '$or']: children })
      }
      continue
    }

    if (!operators || typeof operators !== 'object' || Array.isArray(operators)) {
      continue
    }

    for (const [operator, value] of Object.entries(operators)) {
      if (!validOperatorSet.has(operator as Operator)) {
        throw new APIError(`Unsupported branch query operator "${operator}".`, 400)
      }
      if (unionCollection && incomingPath === 'relationTo') {
        const param = await buildSearchParam({
          collectionSlug: collection,
          fields: [{ name: 'relationTo', type: 'text' }],
          incomingPath: 'relationTo',
          locale: state.locale,
          operator: operator as Operator,
          parentIsLocalized: false,
          payload: state.adapter.payload,
          val: structuredClone(value),
        })
        const discriminator = nextAlias({ state })
        stages.push({ $set: { [discriminator]: { $literal: unionCollection } } })
        if (!param?.path) {
          throw new APIError('Invalid polymorphic join discriminator.', 400)
        }
        conditions.push({ [discriminator]: param.value })
        continue
      }
      const { collectionConfig } = getCollection({
        adapter: state.adapter,
        collectionSlug: collection,
      })
      const fields = fallbackFields
        ? [
            ...collectionConfig.flattenedFields,
            ...fallbackFields.filter(
              (field) => !collectionConfig.flattenedFields.some(({ name }) => name === field.name),
            ),
          ]
        : collectionConfig.flattenedFields
      const paths = localizedPaths({
        collectionSlug: collection,
        fields,
        incomingPath: incomingPath.replace(/__/g, '.'),
        locale: state.locale,
        overrideAccess: true,
        payload: state.adapter.payload,
        showHiddenFields: true,
      })
      const first = paths[0]

      if (!first?.field || paths.some((path) => path.invalid)) {
        throw new APIError(`Invalid branch query path "${incomingPath}".`, 400)
      }

      const isNested =
        isNestedRelationshipQuery(value) &&
        !(typeof value.relationTo === 'string' && Object.hasOwn(value, 'value'))
      const isRelationship = ['join', 'relationship', 'upload'].includes(first.field.type)

      const isPolymorphicOperand =
        isRelationship &&
        Array.isArray((first.field as any).relationTo) &&
        /\.(?:value|relationTo)$/.test(incomingPath)

      if ((paths.length > 1 && !isPolymorphicOperand) || (isNested && isRelationship)) {
        const field = first.field as any
        const target = field.type === 'join' ? field.collection : field.relationTo

        if (typeof target !== 'string') {
          throw new APIError(
            'Nested polymorphic branch predicates require a collection discriminator.',
            400,
          )
        }

        const nestedWhere =
          paths.length > 1
            ? {
                [paths
                  .slice(1)
                  .map((path) => path.path)
                  .join('.')]: { [operator]: value },
              }
            : (value as Where)
        const alias = await lookup({
          collection,
          depth,
          relation: { collection: target, field, path: first.path },
          stages,
          state,
          where: nestedWhere,
        })

        if (paths.length > 1 || operator === 'contains') {
          conditions.push({ [`${alias}.0`]: { $exists: true } })
        } else if (operator === 'not_equals') {
          conditions.push({ [`${alias}.0`]: { $exists: false } })
        } else if (operator === 'equals' && field.type !== 'join') {
          conditions.push({
            $expr: {
              $setIsSubset: [
                projectionPathValues({ path: first.path }),
                `$${alias}.${effectiveCollection({ collection: target, state }) !== target ? '_branchProjection.logicalID' : '_id'}`,
              ],
            },
          })
        } else {
          throw new APIError(`Unsupported nested branch relationship operator "${operator}".`, 400)
        }
      } else {
        if (operator === 'near') {
          throw new APIError(
            'Branch near predicates require one mandatory point predicate per queried collection.',
            400,
          )
        }
        const param = await buildSearchParam({
          collectionSlug: collection,
          fields:
            isPolymorphicOperand && incomingPath.endsWith('.value')
              ? [{ name: 'logicalValue', type: 'json' }]
              : fields,
          incomingPath:
            isPolymorphicOperand && incomingPath.endsWith('.value') ? 'logicalValue' : incomingPath,
          locale: state.locale,
          operator: operator as Operator,
          parentIsLocalized: false,
          payload: state.adapter.payload,
          val: structuredClone(value),
        })

        const guardedPath = isRelationship
          ? await guardedRelationshipValue({
              collection,
              depth,
              field: first.field,
              logicalValues: isPolymorphicOperand && incomingPath.endsWith('.value'),
              path: first.path.replace(/\.(?:value|relationTo)$/, ''),
              stages,
              state,
            })
          : undefined

        if (param?.path) {
          conditions.push({
            [guardedPath
              ? `${guardedPath}${isPolymorphicOperand ? (incomingPath.endsWith('.value') ? '.value' : '.relationTo') : ''}`
              : param.path]: param.value,
          })
        } else if (param?.value && typeof param.value === 'object') {
          conditions.push(
            guardedPath
              ? remapPredicatePaths({
                  source:
                    isPolymorphicOperand && incomingPath.endsWith('.value')
                      ? 'logicalValue'
                      : first.path.replace(/\.(?:value|relationTo)$/, ''),
                  target:
                    isPolymorphicOperand && incomingPath.endsWith('.value')
                      ? `${guardedPath}.value`
                      : guardedPath,
                  value: param.value,
                })
              : (param.value as Stage),
          )
        } else {
          throw new APIError(`Invalid branch query value on "${incomingPath}".`, 400)
        }
      }
    }
  }

  return conditions.length ? { $and: conditions } : {}
}

const lookup = async ({
  collection,
  depth,
  fallbackFields,
  relation,
  requiresPipeline = false,
  stages,
  state,
  where = {},
}: {
  collection: string
  depth: number
  fallbackFields?: FlattenedField[]
  relation: Relation
  requiresPipeline?: boolean
  stages: Stage[]
  state: State
  where?: Where
}): Promise<string> => {
  const alias = nextAlias({ state })
  const effectiveTarget = effectiveCollection({ collection: relation.collection, state })
  const usesLogicalReference = effectiveTarget !== relation.collection
  const target = getCollection({ adapter: state.adapter, collectionSlug: effectiveTarget })
  const access = state.context.relationAccess[effectiveTarget]
  const geo = await extractNear({ collection: effectiveTarget, state, where })
  const policyGeo = await extractNear({
    collection: effectiveTarget,
    state,
    where: !state.isCompilingAccess && access ? access : {},
  })
  const near = combineNear({ near: geo.near, policyNear: policyGeo.near })
  const pipeline: Stage[] = near
    ? [{ $geoNear: { ...near, query: visibility({ collection: effectiveTarget, state }) } }]
    : [{ $match: visibility({ collection: effectiveTarget, state }) }]
  const isJoin = relation.field.type === 'join'
  let linkage: Stage
  let rootID: any = '$_id'
  let referenceIDsExpression: any
  let equality: { foreignField: string; localField: string }

  if (isJoin) {
    const foreign = getFieldByPath({
      fields: target.collectionConfig.flattenedFields,
      path: relation.field.on,
    })

    if (!foreign) {
      throw new APIError('Branch reverse relationship field was not found.', 400)
    }

    const path = foreign.localizedPath.replace('<locale>', state.locale || '')
    const field = foreign.field as any
    const sourceProjection =
      state.adapter.payload.collections[collection]?.config.custom?.branchProjectionStorage
    const usesNativeRoot = Boolean(
      sourceProjection && !target.collectionConfig.custom?.branchProjectionStorage,
    )
    const rootCollection = usesNativeRoot ? sourceProjection.collection : collection
    if (usesNativeRoot) {
      rootID = !state.adapter.payload.collections[rootCollection]?.customIDType
        ? {
            $cond: [
              { $eq: [{ $type: '$_branchProjection.logicalID' }, 'string'] },
              {
                $convert: {
                  input: '$_branchProjection.logicalID',
                  onError: null,
                  onNull: null,
                  to: 'objectId',
                },
              },
              '$_branchProjection.logicalID',
            ],
          }
        : '$_branchProjection.logicalID'
      const rootReference = nextAlias({ state })
      stages.push({ $set: { [rootReference]: rootID } })
      rootID = `$${rootReference}`
    }
    equality = {
      foreignField: `${path}${Array.isArray(field.relationTo) ? '.value' : ''}`,
      localField: usesNativeRoot ? String(rootID).slice(1) : '_id',
    }

    if (Array.isArray(field.relationTo)) {
      linkage = {
        $expr: {
          $gt: [
            {
              $size: {
                $filter: {
                  as: 'reference',
                  cond: {
                    $and: [
                      { $eq: ['$$reference.value', '$$rootID'] },
                      { $eq: ['$$reference.relationTo', { $literal: rootCollection }] },
                    ],
                  },
                  input: projectionPathValues({ path }),
                },
              },
            },
            0,
          ],
        },
      }
    } else {
      linkage = { $expr: { $in: ['$$rootID', projectionPathValues({ path })] } }
    }
  } else {
    const referencePath = nextAlias({ state })
    const originalReferences = Array.isArray(relation.field.relationTo)
      ? {
          $map: {
            as: 'reference',
            in: '$$reference.value',
            input: {
              $filter: {
                as: 'reference',
                cond: { $eq: ['$$reference.relationTo', { $literal: relation.collection }] },
                input: projectionPathValues({ path: relation.path }),
              },
            },
          },
        }
      : projectionPathValues({ path: relation.path })
    const referenceIDs = usesLogicalReference
      ? {
          $map: {
            as: 'nativeReference',
            in: logicalMongoID({ value: '$$nativeReference' }),
            input: originalReferences,
          },
        }
      : originalReferences
    referenceIDsExpression = referenceIDs
    const isDirect =
      !usesLogicalReference &&
      !relation.path.includes('.') &&
      !Array.isArray(relation.field.relationTo)
    if (!isDirect) {
      stages.push({ $set: { [referencePath]: referenceIDs } })
    }
    equality = {
      foreignField: usesLogicalReference ? '_branchProjection.logicalID' : '_id',
      localField: isDirect ? relation.path : referencePath,
    }
    linkage = {
      $expr: {
        $in: [usesLogicalReference ? '$_branchProjection.logicalID' : '$_id', '$$referenceIDs'],
      },
    }
  }

  pipeline.push({ $match: linkage })

  if (!state.isCompilingAccess && !access) {
    pipeline.push({ $match: { $expr: false } })
  } else if (!state.isCompilingAccess && access) {
    pipeline.push({
      $match: await compileAccessWhere({
        collection: effectiveTarget,
        depth: depth + 1,
        stages: pipeline,
        state,
        where: policyGeo.where,
      }),
    })
  }

  pipeline.push({
    $match: await compileWhere({
      collection: effectiveTarget,
      depth: depth + 1,
      fallbackFields,
      stages: pipeline,
      state,
      unionCollection: fallbackFields
        ? (target.collectionConfig.custom?.branchProjectionStorage?.collection ??
          relation.collection)
        : undefined,
      where: geo.where,
    }),
  })
  const scalarConditions =
    !requiresPipeline && pipeline.every((stage) => stage.$match)
      ? pipeline
          .filter((stage) => stage.$match !== linkage)
          .map((stage) =>
            compileProjectionScalarMatch({
              fields: target.collectionConfig.flattenedFields,
              query: stage.$match,
            }),
          )
      : undefined
  if (scalarConditions && scalarConditions.every(Boolean)) {
    stages.push({ $lookup: { as: alias, from: target.Model.collection.name, ...equality } })
    stages.push({
      $set: {
        [alias]: {
          $filter: { as: 'candidate', cond: { $and: scalarConditions }, input: `$${alias}` },
        },
      },
    })
    return alias
  }
  stages.push({
    $lookup: {
      as: alias,
      from: target.Model.collection.name,
      // The equality shortcut inserts an implicit $match before the lookup pipeline.
      // A geospatial lookup must start with $geoNear and use explicit linkage afterward.
      ...(near ? {} : equality),
      let: isJoin ? { rootID } : { referenceIDs: referenceIDsExpression },
      pipeline,
    },
  })

  return alias
}

const remapPredicatePaths = ({
  source,
  target,
  value,
}: {
  source: string
  target: string
  value: any
}): any => {
  if (Array.isArray(value)) {
    return value.map((item) => remapPredicatePaths({ source, target, value: item }))
  }
  if (!value || typeof value !== 'object' || value instanceof RegExp || value instanceof Date) {
    return value
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key === source || key.startsWith(`${source}.`) ? `${target}${key.slice(source.length)}` : key,
      key.startsWith('$') ? remapPredicatePaths({ source, target, value: item }) : item,
    ]),
  )
}

/** Preserve source reference ordering/array equality while removing unreadable target identities. */
const guardedRelationshipValue = async ({
  collection,
  depth,
  field,
  logicalValues = false,
  path,
  stages,
  state,
}: {
  collection: string
  depth: number
  field: any
  logicalValues?: boolean
  path: string
  stages: Stage[]
  state: State
}): Promise<string> => {
  const relationTo = field.type === 'join' ? field.collection : field.relationTo
  const polymorphic = Array.isArray(relationTo)
  const targets: string[] = polymorphic ? relationTo : [relationTo]
  const aliases: { alias: string; target: string }[] = []

  for (const target of targets) {
    const alias = await lookup({
      collection,
      depth,
      relation: { collection: target, field, path },
      stages,
      state,
    })
    aliases.push({ alias, target })
  }
  const alias = nextAlias({ state })
  const references =
    field.type === 'join'
      ? {
          $concatArrays: aliases.map(({ alias, target }) =>
            polymorphic
              ? {
                  $map: {
                    as: 'document',
                    in: { relationTo: { $literal: target }, value: '$$document._id' },
                    input: `$${alias}`,
                  },
                }
              : `$${alias}._id`,
          ),
        }
      : projectionPathValues({ path })
  const matches = aliases.map(({ alias, target }) => ({
    $and: [
      ...(polymorphic ? [{ $eq: ['$$reference.relationTo', { $literal: target }] }] : []),
      {
        $in: [
          effectiveCollection({ collection: target, state }) !== target
            ? logicalMongoID({ value: polymorphic ? '$$reference.value' : '$$reference' })
            : polymorphic
              ? '$$reference.value'
              : '$$reference',
          `$${alias}.${effectiveCollection({ collection: target, state }) !== target ? '_branchProjection.logicalID' : '_id'}`,
        ],
      },
    ],
  }))
  let value: any = { $filter: { as: 'reference', cond: { $or: matches }, input: references } }

  if (logicalValues) {
    value = {
      $map: {
        as: 'reference',
        in: {
          relationTo: '$$reference.relationTo',
          value: {
            $switch: {
              branches: aliases.map(({ alias, target }) => ({
                case: { $eq: ['$$reference.relationTo', { $literal: target }] },
                then: {
                  $let: {
                    in: state.adapter.payload.collections[
                      effectiveCollection({ collection: target, state })
                    ]?.config.custom?.branchProjectionStorage
                      ? '$$document._branchProjection.logicalID'
                      : logicalMongoID({ value: '$$document._id' }),
                    vars: {
                      document: {
                        $first: {
                          $filter: {
                            as: 'document',
                            cond: {
                              $eq: [
                                effectiveCollection({ collection: target, state }) !== target
                                  ? '$$document._branchProjection.logicalID'
                                  : '$$document._id',
                                effectiveCollection({ collection: target, state }) !== target
                                  ? logicalMongoID({ value: '$$reference.value' })
                                  : '$$reference.value',
                              ],
                            },
                            input: `$${alias}`,
                          },
                        },
                      },
                    },
                  },
                },
              })),
              default: null,
            },
          },
        },
        input: value,
      },
    }
  }
  stages.push({
    $set: {
      [alias]:
        field.hasMany || field.type === 'join' ? value : { $ifNull: [{ $first: value }, null] },
    },
  })
  return alias
}

/** Policies are trusted attribute expressions, not recursively applied graph read operations. */
const compileAccessWhere = async (args: Parameters<typeof compileWhere>[0]): Promise<Stage> => {
  const previous = args.state.isCompilingAccess

  args.state.isCompilingAccess = true

  try {
    return await compileWhere(args)
  } finally {
    args.state.isCompilingAccess = previous
  }
}

const resolveValue = async ({
  collection,
  depth,
  path,
  stages,
  state,
}: {
  collection: string
  depth: number
  path: string
  stages: Stage[]
  state: State
}): Promise<string> => {
  if (depth > 64) {
    throw new APIError('Branch relationship value path exceeds the supported nesting depth.', 400)
  }

  const target = getCollection({ adapter: state.adapter, collectionSlug: collection })
  const paths = localizedPaths({
    collectionSlug: collection,
    fields: target.collectionConfig.flattenedFields,
    incomingPath: path,
    locale: state.locale,
    overrideAccess: true,
    payload: state.adapter.payload,
    showHiddenFields: true,
  })
  const first = paths[0]

  if (!first?.field || paths.some((item) => item.invalid)) {
    throw new APIError(`Invalid branch value path "${path}".`, 400)
  }

  if (
    ['relationship', 'upload'].includes(first.field.type) &&
    Array.isArray((first.field as any).relationTo) &&
    (paths.length === 1 || /\.(?:value|relationTo)$/.test(path))
  ) {
    const guarded = await guardedRelationshipValue({
      collection,
      depth,
      field: first.field,
      logicalValues: !path.endsWith('.relationTo'),
      path: first.path.replace(/\.(?:value|relationTo)$/, ''),
      stages,
      state,
    })
    return /\.(?:value|relationTo)$/.test(path)
      ? `${guarded}.${path.endsWith('.value') ? 'value' : 'relationTo'}`
      : guarded
  }
  if (paths.length === 1) {
    return path === 'id' ? '_id' : first.path
  }

  const field = first.field as any
  const relatedCollection = field.type === 'join' ? field.collection : field.relationTo

  if (typeof relatedCollection !== 'string') {
    throw new APIError(
      'Polymorphic branch value traversal requires a collection discriminator.',
      400,
    )
  }

  const alias = await lookup({
    collection,
    depth,
    relation: { collection: relatedCollection, field, path: first.path },
    requiresPipeline: true,
    stages,
    state,
  })
  const nestedStages: Stage[] = []
  const nestedPath = await resolveValue({
    collection: effectiveCollection({ collection: relatedCollection, state }),
    depth: depth + 1,
    path: paths
      .slice(1)
      .map((item) => item.path)
      .join('.'),
    stages: nestedStages,
    state,
  })
  const lookupStage = stages.at(-1)!.$lookup

  lookupStage.pipeline.push(...nestedStages)

  return `${alias}.${nestedPath}`
}

const buildJoins = async ({
  collection,
  joins,
  state,
}: {
  collection: string
  joins?: JoinQuery
  state: State
}): Promise<Stage[]> => {
  if (joins === false) {
    return []
  }

  const { collectionConfig } = getCollection({ adapter: state.adapter, collectionSlug: collection })
  const definitions = [
    ...Object.values(collectionConfig.joins).flat(),
    ...collectionConfig.polymorphicJoins,
  ]
  const stages: Stage[] = []

  for (const definition of definitions) {
    if (!definition || joins?.[definition.joinPath] === false) {
      continue
    }

    const options = joins?.[definition.joinPath] || {}
    const limit = options.limit ?? definition.field.defaultLimit ?? 10
    const page = options.page ?? 1
    const isPolymorphic = Array.isArray(definition.field.collection)
    const targets = isPolymorphic
      ? (definition.field.collection as string[])
      : [definition.field.collection as string]
    const aliases: string[] = []
    const localeSuffix = definition.field.localized && state.locale ? `.${state.locale}` : ''
    const output = `${definition.joinPath}${localeSuffix}`

    let sortDirections: (-1 | 1)[] = []
    for (const target of targets) {
      const targetOptions = state.context.joins?.[definition.joinPath]?.[target] || options
      const sort = targetOptions.sort ?? definition.field.defaultSort ?? '-createdAt'
      const sortEntries = (typeof sort === 'string' ? [sort] : sort).map((item, index) => ({
        direction: item.startsWith('-') ? (-1 as const) : (1 as const),
        key: `__sort${index}`,
        path: item.replace(/^-/, ''),
      }))
      sortDirections = sortEntries.map(({ direction }) => direction)
      const alias = await lookup({
        collection,
        depth: 0,
        fallbackFields: isPolymorphic
          ? targets.flatMap(
              (collection) => state.adapter.payload.collections[collection]!.config.flattenedFields,
            )
          : undefined,
        relation: { collection: target, field: definition.field, path: definition.joinPath },
        requiresPipeline: true,
        stages,
        state,
        where: targetOptions.where ?? {},
      })
      aliases.push(alias)
      const pipeline = stages.at(-1)!.$lookup.pipeline as Stage[]
      const sorting: Record<string, -1 | 1> = {}
      const sortValues: Record<string, unknown> = {}

      const targetConfig =
        state.adapter.payload.collections[effectiveCollection({ collection: target, state })]!
          .config
      for (const entry of sortEntries) {
        const hasField =
          targetConfig.flattenedFields.some(({ name }) => name === entry.path.split('.')[0]) ||
          entry.path === 'id'
        const resolved =
          isPolymorphic && !hasField
            ? undefined
            : await resolveValue({
                collection: target,
                depth: 0,
                path: entry.path,
                stages: pipeline,
                state,
              })

        sorting[entry.key] = entry.direction
        sortValues[entry.key] = resolved
          ? {
              $cond: [
                { $isArray: `$${resolved}` },
                {
                  $ifNull: [
                    {
                      $arrayElemAt: [
                        { $sortArray: { input: `$${resolved}`, sortBy: entry.direction } },
                        0,
                      ],
                    },
                    null,
                  ],
                },
                `$${resolved}`,
              ],
            }
          : null
      }
      sortValues.__logicalID = state.adapter.payload.collections[
        effectiveCollection({ collection: target, state })
      ]?.config.custom?.branchProjectionStorage
        ? '$_branchProjection.logicalID'
        : '$_id'
      sorting.__logicalID = 1
      pipeline.push({ $set: sortValues })
      const docs: Stage[] = [{ $sort: sorting }]

      if (limit > 0) {
        docs.push({ $limit: page * limit + 1 })
      }
      docs.push({
        $project: {
          _id: state.adapter.payload.collections[effectiveCollection({ collection: target, state })]
            ?.config.custom?.branchProjectionStorage
            ? '$_branchProjection.logicalID'
            : 1,
          ...Object.fromEntries(sortEntries.map((entry) => [entry.key, 1])),
          __logicalID: 1,
          ...(isPolymorphic
            ? {
                __collectionTie: {
                  $literal: targetConfig.custom?.branchProjectionStorage?.collection ?? target,
                },
                relationTo: { $literal: target },
              }
            : {}),
        },
      })
      pipeline.push({
        $facet: { docs, ...(options.count ? { count: [{ $count: 'totalDocs' }] } : {}) },
      })
    }

    const combined = nextAlias({ state })
    stages.push({
      $set: {
        [combined]: {
          $concatArrays: aliases.map((alias) => ({ $ifNull: [{ $first: `$${alias}.docs` }, []] })),
        },
      },
    })
    const sorting = Object.fromEntries(
      sortDirections.map((direction, index) => [`__sort${index}`, direction]),
    )
    sorting.__logicalID = 1
    if (isPolymorphic) {
      sorting.__collectionTie = 1
    }
    stages.push({
      $set: { [combined]: { $sortArray: { input: `$${combined}`, sortBy: sorting } } },
    })
    const sliced =
      limit > 0 ? { $slice: [`$${combined}`, (page - 1) * limit, limit] } : `$${combined}`
    stages.push({
      $set: {
        [`${output}.docs`]: {
          $map: {
            as: 'doc',
            in: isPolymorphic
              ? { relationTo: '$$doc.relationTo', value: '$$doc._id' }
              : '$$doc._id',
            input: sliced,
          },
        },
        [`${output}.hasNextPage`]:
          limit > 0 ? { $gt: [{ $size: `$${combined}` }, page * limit] } : false,
        ...(options.count
          ? {
              [`${output}.totalDocs`]: {
                $add: aliases.map((alias) => ({
                  $ifNull: [{ $first: { $first: `$${alias}.count.totalDocs` } }, 0],
                })),
              },
            }
          : {}),
      },
    })
  }

  return stages
}

const combineNear = ({
  near,
  policyNear,
}: {
  near?: Stage
  policyNear?: Stage
}): Stage | undefined => {
  if (near && policyNear) {
    throw new APIError(
      'Branch queries support one mandatory near predicate per queried collection.',
      400,
    )
  }
  return near ?? policyNear
}

const extractNear = async ({
  collection,
  isOptional = false,
  state,
  where,
}: {
  collection: string
  isOptional?: boolean
  state: State
  where: Where
}): Promise<{ near?: Stage; where: Where }> => {
  const output: Where = {}
  let near: Stage | undefined

  for (const [path, operators] of Object.entries(where)) {
    if (Array.isArray(operators) && ['and', 'or'].includes(path.toLowerCase())) {
      const children: Where[] = []

      for (const child of operators) {
        const extracted = await extractNear({
          collection,
          isOptional: isOptional || path.toLowerCase() === 'or',
          state,
          where: child,
        })

        if (extracted.near) {
          if (near) {
            throw new APIError('Branch queries support one mandatory root near predicate.', 400)
          }
          near = extracted.near
        }
        children.push(extracted.where)
      }
      output[path] = children
    } else if (operators && typeof operators === 'object' && 'near' in operators) {
      const { collectionConfig } = getCollection({
        adapter: state.adapter,
        collectionSlug: collection,
      })
      const paths = localizedPaths({
        collectionSlug: collection,
        fields: collectionConfig.flattenedFields,
        incomingPath: path,
        locale: state.locale,
        payload: state.adapter.payload,
      })

      if (
        paths.length > 1 &&
        paths[0]?.field &&
        ['join', 'relationship', 'upload'].includes(paths[0].field.type)
      ) {
        output[path] = operators
        continue
      }
      if (paths.length !== 1 || paths[0]?.field?.type !== 'point') {
        throw new APIError('Branch near predicates must target a point field.', 400)
      }
      if (isOptional || near) {
        throw new APIError('Branch queries support one mandatory root near predicate.', 400)
      }
      const param = await buildSearchParam({
        collectionSlug: collection,
        fields: collectionConfig.flattenedFields,
        incomingPath: path,
        locale: state.locale,
        operator: 'near',
        parentIsLocalized: false,
        payload: state.adapter.payload,
        val: operators.near,
      })
      const geometry = (param?.value as any)?.$near

      if (!geometry?.$geometry) {
        throw new APIError('Invalid branch near predicate.', 400)
      }
      near = {
        distanceField: nextAlias({ state }),
        key: param!.path,
        near: geometry.$geometry,
        spherical: true,
        ...(geometry.$maxDistance === undefined ? {} : { maxDistance: geometry.$maxDistance }),
        ...(geometry.$minDistance === undefined ? {} : { minDistance: geometry.$minDistance }),
      }
      const rest = Object.fromEntries(
        Object.entries(operators).filter(([operator]) => operator !== 'near'),
      )

      if (Object.keys(rest).length) {
        output[path] = rest
      }
    } else {
      output[path] = operators
    }
  }

  return { near, where: output }
}

const localizedPaths = (
  args: Parameters<typeof getLocalizedPaths>[0],
): ReturnType<typeof getLocalizedPaths> => {
  const paths = getLocalizedPaths(args)
  const first = paths[0]

  if (!first?.field || !['join', 'relationship', 'upload'].includes(first.field.type)) {
    return paths
  }

  const field = first.field as any
  const target = field.type === 'join' ? field.collection : field.relationTo
  const prefix = first.path.split('.')
  const incoming = args.incomingPath.split('.')
  const remaining = incoming.slice(prefix.length).join('.')

  if (
    typeof target === 'string' &&
    remaining &&
    incoming.slice(0, prefix.length).join('.') === first.path
  ) {
    const relatedTarget =
      args.payload.collections[target]?.config.custom?.branchQueryStorage?.projection ?? target
    const related = args.payload.collections[relatedTarget]?.config

    if (related) {
      return [
        first,
        ...localizedPaths({
          ...args,
          collectionSlug: relatedTarget,
          fields: related.flattenedFields,
          incomingPath: remaining,
        }),
      ]
    }
  }

  return paths
}

const nextAlias = ({ state }: { state: State }): string => {
  let alias: string

  do {
    alias = `__branchProjectionLookup${state.nextAlias++}`
  } while (
    Object.values(state.adapter.payload.collections).some(({ config }) =>
      config.flattenedFields.some((field) => field.name === alias),
    )
  )
  state.privateFields.add(alias)

  return alias
}

/** Stored default Mongo references are ObjectIds; effective logical identities remain typed API values. */
const logicalMongoID = ({ value }: { value: unknown }): unknown => ({
  $cond: [{ $eq: [{ $type: value }, 'objectId'] }, { $toString: value }, value],
})
