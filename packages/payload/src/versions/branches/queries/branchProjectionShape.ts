import type { Block, Field } from '../../../fields/config/types.js'

type Shape = { absent: string[]; locales: Record<string, string[]>; nulls: string[] }

type PlannedField = {
  blockFields?: Map<string, Field[]>
  fields?: Field[]
  isContainer: boolean
  isIgnored: boolean
  isLocalized: boolean
  name: string
  segment: string
  type: Field['type']
}
type Plan = {
  allowed: Set<string>
  allowedBlock: Set<string>
  fields: PlannedField[]
}
type Context = {
  absent?: Set<string>
  blocks: Block[]
  isCapturing: boolean
  nulls?: Set<string>
  shape: Shape
}

const emptyBlocks: Block[] = []
// Sanitized field definitions and block catalogs are stable for the lifetime of a Payload config.
// Catalog identity matters: the same referenced field can resolve differently in another config.
const plans = new WeakMap<Field[], WeakMap<Block[], Plan>>()

/** Schema presence only; content values remain exclusively in the derived native row. */
export const captureBranchProjectionShape = ({
  blocks = emptyBlocks,
  data,
  fields,
}: {
  blocks?: Block[]
  data: Record<string, unknown>
  fields: Field[]
}): Shape => {
  const shape: Shape = { absent: [], locales: {}, nulls: [] }

  walk({ context: { blocks, isCapturing: true, shape }, data, fields, path: '[' })
  return shape
}

export const restoreBranchProjectionShape = ({
  blocks = emptyBlocks,
  data,
  fields,
  shape: input,
}: {
  blocks?: Block[]
  data: Record<string, unknown>
  fields: Field[]
  shape: unknown
}): Record<string, unknown> => {
  if (!input || typeof input !== 'object') {
    throw invalid()
  }
  const shape = input as Shape
  if (
    !Array.isArray(shape.absent) ||
    !Array.isArray(shape.nulls) ||
    !shape.absent.every((value) => typeof value === 'string') ||
    !shape.nulls.every((value) => typeof value === 'string') ||
    !shape.locales ||
    typeof shape.locales !== 'object' ||
    Array.isArray(shape.locales) ||
    Object.values(shape.locales).some(
      (value) => !Array.isArray(value) || !value.every((code) => typeof code === 'string'),
    )
  ) {
    throw invalid()
  }
  walk({
    context: {
      absent: new Set(shape.absent),
      blocks,
      isCapturing: false,
      nulls: new Set(shape.nulls),
      shape,
    },
    data,
    fields,
    path: '[',
  })
  return data
}

type WalkArgs = {
  context: Context
  data: Record<string, unknown>
  fields: Field[]
  isBlock?: boolean
  parentIsLocalized?: boolean
  /** JSON array prefix without its closing bracket, preserving the stored shape key format. */
  path: string
}
const walk = ({ context, data, fields, isBlock, parentIsLocalized, path }: WalkArgs): void => {
  if (context.isCapturing && Object.hasOwn(data, '_branchProjection')) {
    throw new Error('Content collides with private branch projection metadata.')
  }
  const plan = getPlan({ blocks: context.blocks, fields })
  const allowed = isBlock ? plan.allowedBlock : plan.allowed

  for (const key of Object.keys(data)) {
    if (!allowed.has(key)) {
      delete data[key]
    }
  }
  for (const field of plan.fields) {
    if (field.isIgnored) {
      if (context.isCapturing) {
        delete data[field.name]
      }
      continue
    }
    const fieldPath = `${path}${path === '[' ? '' : ','}${field.segment}`
    const key = `${fieldPath}]`
    const value = data[field.name]

    if (context.isCapturing && value === undefined) {
      context.shape.absent.push(key)
      delete data[field.name]
      continue
    }
    if (!context.isCapturing && context.absent!.has(key)) {
      if (!isCleared({ value })) {
        throw invalid()
      }
      delete data[field.name]
      continue
    }
    if (context.isCapturing && value === null && field.isContainer) {
      context.shape.nulls.push(key)
    }
    if (!context.isCapturing && context.nulls!.has(key)) {
      if (!isCleared({ value })) {
        throw invalid()
      }
      data[field.name] = null
      continue
    }
    if (field.isLocalized && !parentIsLocalized && record({ value })) {
      const localized = value as Record<string, unknown>

      if (context.isCapturing) {
        context.shape.locales[key] = Object.keys(localized)
      }
      const locales = context.shape.locales[key]

      if (!locales) {
        throw invalid()
      }
      for (const locale of Object.keys(localized)) {
        if (!locales.includes(locale)) {
          if (!isCleared({ value: localized[locale] })) {
            throw invalid()
          }
          delete localized[locale]
          continue
        }
        // Scalar localized fields need no nested path or content traversal.
        if (!field.isContainer && (context.isCapturing || context.nulls!.size === 0)) {
          continue
        }
        const localePath = `${fieldPath},${JSON.stringify(locale)}`
        const localeKey = `${localePath}]`

        if (context.isCapturing && localized[locale] === null && field.isContainer) {
          context.shape.nulls.push(localeKey)
        }
        if (!context.isCapturing && context.nulls!.has(localeKey)) {
          if (!isCleared({ value: localized[locale] })) {
            throw invalid()
          }
          localized[locale] = null
          continue
        }
        if (field.isContainer) {
          content({
            context,
            field,
            parentIsLocalized: true,
            path: localePath,
            value: localized[locale],
          })
        }
      }
    } else if (field.isContainer) {
      content({ context, field, parentIsLocalized, path: fieldPath, value })
    }
  }
}
const content = ({
  context,
  field,
  parentIsLocalized,
  path,
  value,
}: {
  context: Context
  field: PlannedField
  parentIsLocalized?: boolean
  path: string
  value: unknown
}): void => {
  if (field.type === 'array' || field.type === 'blocks') {
    if (!Array.isArray(value)) {
      return
    }
    for (const row of value) {
      if (!record({ value: row })) {
        throw invalid()
      }
      const fields = field.type === 'array' ? field.fields : field.blockFields!.get(row.blockType)

      if (!fields) {
        throw new Error('Unknown block in branch projection document.')
      }
      walk({
        context,
        data: row,
        fields,
        isBlock: field.type === 'blocks',
        parentIsLocalized,
        path: `${path},${JSON.stringify(row.id) ?? 'null'}`,
      })
    }
  } else if (field.fields && record({ value })) {
    walk({
      context,
      data: value as Record<string, unknown>,
      fields: field.fields,
      parentIsLocalized,
      path,
    })
  }
}
const getPlan = ({ blocks, fields }: { blocks: Block[]; fields: Field[] }): Plan => {
  let catalogs = plans.get(fields)
  const cached = catalogs?.get(blocks)

  if (cached) {
    return cached
  }
  if (!catalogs) {
    catalogs = new WeakMap()
    plans.set(fields, catalogs)
  }
  const plannedFields = namedFields({ fields }).map((field): PlannedField => {
    const blockFields = field.type === 'blocks' ? new Map<string, Field[]>() : undefined

    if (field.type === 'blocks') {
      for (const reference of field.blocks) {
        const block =
          typeof reference === 'string' ? blocks.find(({ slug }) => slug === reference) : reference

        if (block && !blockFields!.has(block.slug)) {
          blockFields!.set(block.slug, block.fields)
        }
      }
    }
    return {
      name: field.name,
      type: field.type,
      blockFields,
      fields: 'fields' in field ? field.fields : undefined,
      isContainer: 'fields' in field || field.type === 'blocks',
      isIgnored: field.type === 'join' || ('virtual' in field && Boolean(field.virtual)),
      isLocalized: 'localized' in field && Boolean(field.localized),
      segment: JSON.stringify(field.name),
    }
  })
  const names = plannedFields.map(({ name }) => name)
  const plan = {
    allowed: new Set(['id', ...names]),
    allowedBlock: new Set(['blockName', 'blockType', 'id', ...names]),
    fields: plannedFields,
  }

  catalogs.set(blocks, plan)
  return plan
}
const namedFields = ({ fields }: { fields: Field[] }): ({ name: string } & Field)[] =>
  fields.flatMap((field) =>
    field.type === 'tabs'
      ? field.tabs.flatMap((tab) =>
          'name' in tab && tab.name
            ? [{ ...tab, type: 'group' } as { name: string } & Field]
            : namedFields({ fields: tab.fields }),
        )
      : 'name' in field
        ? [field as { name: string } & Field]
        : 'fields' in field
          ? namedFields({ fields: field.fields })
          : [],
  )
const record = ({ value }: { value: unknown }): boolean =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value))
const isCleared = ({ value }: { value: unknown }): boolean =>
  value == null || Array.isArray(value)
    ? value == null || value.every((item) => isCleared({ value: item }))
    : typeof value === 'object' && Object.values(value).every((item) => isCleared({ value: item }))
const invalid = (): Error => new Error('Invalid branch projection presence metadata.')
