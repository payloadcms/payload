import type { CollectionPermission, FieldsPermissions, GlobalPermission } from '../../auth/types.js'
import type { DefaultDocumentIDType } from '../../index.js'
import type { AllOperations, JsonObject, PayloadRequest } from '../../types/index.js'

import { type Field, type FieldAccess, tabHasName } from '../../fields/config/types.js'
import { INHERITED_PERMISSIONS_KEY } from '../getFieldPermissions.js'

const fieldOperations = ['create', 'read', 'update'] as const

type FieldOperation = (typeof fieldOperations)[number]

type OperationResults = Partial<Record<FieldOperation, boolean>>

type PlanEntry = {
  access?: Partial<Record<FieldOperation, FieldAccess>>
  blocks?: PlanBlock[]
  fields?: PlanEntry[]
  name: string
}

type PlanBlock = { boundary: true; slug: string } | { fields: PlanEntry[]; slug: string }

type SparseNode = {
  blocks?: Record<string, OperationResults | SparseNode>
  fields?: Record<string, SparseNode>
} & OperationResults

type EvaluateArgs = {
  /**
   * Sparse results of each block plan, per inherited create/read/update results, so a block
   * repeated across the entity runs its access functions once.
   */
  blockResults: Map<PlanEntry[], Map<string, Promise<Record<string, SparseNode> | undefined>>>
  data: JsonObject | undefined
  id?: DefaultDocumentIDType
  operations: FieldOperation[]
  req: PayloadRequest
}

/**
 * Build the sparse field permissions of an entity: the entity's create/read/update results under
 * INHERITED_PERMISSIONS_KEY plus only the field paths whose own access result differs from what they
 * inherit. Missing entries inherit from their parent, see `resolveFieldPermissions`.
 */
export const populateFieldPermissions = async ({
  id,
  data,
  entityPermissions,
  fields,
  operations,
  req,
}: {
  data: JsonObject | undefined
  entityPermissions: Omit<CollectionPermission | GlobalPermission, 'fields'>
  fields: Field[]
  id?: DefaultDocumentIDType
  operations: AllOperations[]
  req: PayloadRequest
}): Promise<FieldsPermissions> => {
  const fieldOperationsToEvaluate = operations.filter((operation): operation is FieldOperation =>
    (fieldOperations as readonly string[]).includes(operation),
  )
  const inherited: OperationResults = {}

  for (const operation of fieldOperationsToEvaluate) {
    inherited[operation] = Boolean(
      (entityPermissions as Partial<CollectionPermission>)[operation]?.permission,
    )
  }

  const overrides = await evaluatePlan(getPlan(fields, req), inherited, {
    id,
    blockResults: new Map(),
    data,
    operations: fieldOperationsToEvaluate,
    req,
  })

  return { [INHERITED_PERMISSIONS_KEY]: inherited, ...overrides } as unknown as FieldsPermissions
}

// Plans only keep fields that can change a permission: fields with access functions, their
// containers, and recursive block occurrences. Keyed by the fields array, which is stable on a
// sanitized config.
const planCache = new WeakMap<Field[], PlanEntry[]>()
const topLevelBlockPlans = new WeakMap<object, PlanEntry[]>()

const getPlan = (fields: Field[], req: PayloadRequest): PlanEntry[] => {
  let plan = planCache.get(fields)

  if (!plan) {
    plan = buildPlan(fields, new Set(), req)
    planCache.set(fields, plan)
  }

  return plan
}

const hasFieldAccess = (field: Field): boolean =>
  'access' in field &&
  Boolean(field.access) &&
  fieldOperations.some((operation) => typeof field.access?.[operation] === 'function')

const buildPlan = (
  fields: Field[],
  activeBlocks: Set<object>,
  req: PayloadRequest,
): PlanEntry[] => {
  const plan: PlanEntry[] = []

  for (const field of fields) {
    if ('name' in field && field.name) {
      const entry: PlanEntry = { name: field.name }

      if (hasFieldAccess(field) && 'access' in field) {
        entry.access = field.access
      }

      if ('fields' in field && field.fields) {
        const fieldsPlan = buildPlan(field.fields, activeBlocks, req)

        if (fieldsPlan.length) {
          entry.fields = fieldsPlan
        }
      }

      const blocks =
        'blockReferences' in field && field.blockReferences?.length
          ? field.blockReferences
          : 'blocks' in field
            ? field.blocks
            : undefined

      if (blocks?.length) {
        const blockEntries: PlanBlock[] = []
        const seen = new Set<string>()

        for (const _block of blocks) {
          const block = typeof _block === 'string' ? req.payload.blocks[_block] : _block

          if (!block || seen.has(block.slug)) {
            continue
          }

          seen.add(block.slug)

          // A block that contains itself, directly or through another block, denies the
          // repeated occurrence: it has no finite permission subtree.
          if (activeBlocks.has(block)) {
            blockEntries.push({ slug: block.slug, boundary: true })
            continue
          }

          // Nested occurrences depend on the enclosing blocks for recursion boundaries, so only
          // top-level occurrences share one plan.
          const isTopLevel = activeBlocks.size === 0
          let blockPlan = isTopLevel ? topLevelBlockPlans.get(block) : undefined

          if (!blockPlan) {
            activeBlocks.add(block)
            blockPlan = buildPlan(block.fields, activeBlocks, req)
            activeBlocks.delete(block)

            if (isTopLevel) {
              topLevelBlockPlans.set(block, blockPlan)
            }
          }

          if (blockPlan.length) {
            blockEntries.push({ slug: block.slug, fields: blockPlan })
          }
        }

        if (blockEntries.length) {
          entry.blocks = blockEntries
        }
      }

      if (entry.access || entry.fields || entry.blocks) {
        plan.push(entry)
      }
    } else if ('fields' in field && field.fields) {
      plan.push(...buildPlan(field.fields, activeBlocks, req))
    }

    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        const tabPlan = buildPlan(tab.fields, activeBlocks, req)

        if (!tabPlan.length) {
          continue
        }

        if (tabHasName(tab)) {
          plan.push({ name: tab.name, fields: tabPlan })
        } else {
          plan.push(...tabPlan)
        }
      }
    }
  }

  return plan
}

const nonEmpty = <T extends object>(object: T): T | undefined =>
  Object.keys(object).length ? object : undefined

const evaluatePlan = async (
  plan: PlanEntry[],
  inherited: OperationResults,
  args: EvaluateArgs,
): Promise<Record<string, SparseNode> | undefined> => {
  const overrides: Record<string, SparseNode> = {}

  await Promise.all(
    plan.map(async (entry) => {
      const node = await evaluateEntry(entry, inherited, args)

      if (node) {
        overrides[entry.name] = node
      }
    }),
  )

  return nonEmpty(overrides)
}

const evaluateEntry = async (
  entry: PlanEntry,
  inherited: OperationResults,
  args: EvaluateArgs,
): Promise<SparseNode | undefined> => {
  const { id, data, operations, req } = args
  const effective: OperationResults = { ...inherited }
  const node: SparseNode = {}

  if (entry.access) {
    await Promise.all(
      operations.map(async (operation) => {
        const access = entry.access?.[operation]

        if (typeof access !== 'function') {
          return
        }

        // Schema permissions have no row data, so siblingData and blockData are never passed.
        effective[operation] = Boolean(await access({ id, data, doc: data, req }))

        if (effective[operation] !== inherited[operation]) {
          node[operation] = effective[operation]
        }
      }),
    )
  }

  if (entry.fields) {
    const fields = await evaluatePlan(entry.fields, effective, args)

    if (fields) {
      node.fields = fields
    }
  }

  if (entry.blocks) {
    const blocks: Record<string, OperationResults | SparseNode> = {}

    await Promise.all(
      entry.blocks.map(async (block) => {
        if ('boundary' in block) {
          const denied = nonEmpty(
            Object.fromEntries(
              operations
                .filter((operation) => effective[operation])
                .map((operation) => [operation, false]),
            ),
          )

          if (denied) {
            blocks[block.slug] = denied
          }

          return
        }

        const fields = await evaluateBlockPlan(block.fields, effective, args)

        if (fields) {
          blocks[block.slug] = { fields }
        }
      }),
    )

    if (nonEmpty(blocks)) {
      node.blocks = blocks
    }
  }

  return nonEmpty(node)
}

const evaluateBlockPlan = (
  plan: PlanEntry[],
  inherited: OperationResults,
  args: EvaluateArgs,
): Promise<Record<string, SparseNode> | undefined> => {
  let byInherited = args.blockResults.get(plan)

  if (!byInherited) {
    byInherited = new Map()
    args.blockResults.set(plan, byInherited)
  }

  const key = args.operations.map((operation) => `${operation}:${inherited[operation]}`).join('|')
  let result = byInherited.get(key)

  if (!result) {
    result = evaluatePlan(plan, inherited, args)
    byInherited.set(key, result)
  }

  return result
}
