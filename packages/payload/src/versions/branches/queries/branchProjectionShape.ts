import type { Block, Field } from '../../../fields/config/types.js'

type Shape = { absent: string[]; locales: Record<string, string[]>; nulls: string[] }

/** Schema presence only; content values remain exclusively in the derived native row. */
export const captureBranchProjectionShape = ({
  blocks = [],
  data,
  fields,
}: {
  blocks?: Block[]
  data: Record<string, unknown>
  fields: Field[]
}): Shape => {
  const shape: Shape = { absent: [], locales: {}, nulls: [] }
  walk({ blocks, data, fields, mode: 'capture', path: [], shape })
  return shape
}

export const restoreBranchProjectionShape = ({
  blocks = [],
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
    absent: new Set(shape.absent),
    blocks,
    data,
    fields,
    mode: 'restore',
    nulls: new Set(shape.nulls),
    path: [],
    shape,
  })
  return data
}

type Args = {
  absent?: Set<string>
  blocks: Block[]
  data: Record<string, unknown>
  fields: Field[]
  isBlock?: boolean
  mode: 'capture' | 'restore'
  nulls?: Set<string>
  parentIsLocalized?: boolean
  path: unknown[]
  shape: Shape
}
const walk = (args: Args): void => {
  if (args.mode === 'capture' && Object.hasOwn(args.data, '_branchProjection')) {
    throw new Error('Content collides with private branch projection metadata.')
  }
  const fields = namedFields({ fields: args.fields })
  const allowed = new Set([
    'id',
    ...(args.isBlock ? ['blockType', 'blockName'] : []),
    ...fields.map(({ name }) => name),
  ])
  for (const key of Object.keys(args.data)) {
    if (!allowed.has(key)) {
      delete args.data[key]
    }
  }
  for (const field of fields) {
    if (field.type === 'join' || ('virtual' in field && field.virtual)) {
      if (args.mode === 'capture') {
        delete args.data[field.name]
      }
      continue
    }
    const path = [...args.path, field.name]
    const key = JSON.stringify(path)
    const value = args.data[field.name]
    if (args.mode === 'capture' && value === undefined) {
      args.shape.absent.push(key)
      delete args.data[field.name]
      continue
    }
    if (args.mode === 'restore' && args.absent!.has(key)) {
      if (!isCleared({ value })) {
        throw invalid()
      }
      delete args.data[field.name]
      continue
    }
    const isContainer = 'fields' in field || field.type === 'blocks'
    if (args.mode === 'capture' && value === null && isContainer) {
      args.shape.nulls.push(key)
    }
    if (args.mode === 'restore' && args.nulls!.has(key)) {
      if (!isCleared({ value })) {
        throw invalid()
      }
      args.data[field.name] = null
      continue
    }
    if ('localized' in field && field.localized && !args.parentIsLocalized && record({ value })) {
      const localized = value as Record<string, unknown>
      if (args.mode === 'capture') {
        args.shape.locales[key] = Object.keys(localized)
      }
      const locales = args.shape.locales[key]
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
        const localePath = [...path, locale]
        const localeKey = JSON.stringify(localePath)
        if (args.mode === 'capture' && localized[locale] === null && isContainer) {
          args.shape.nulls.push(localeKey)
        }
        if (args.mode === 'restore' && args.nulls!.has(localeKey)) {
          if (!isCleared({ value: localized[locale] })) {
            throw invalid()
          }
          localized[locale] = null
          continue
        }
        content({
          ...args,
          field,
          parentIsLocalized: true,
          path: localePath,
          value: localized[locale],
        })
      }
    } else {
      content({ ...args, field, path, value })
    }
  }
}
const content = ({ field, value, ...args }: { field: Field; value: unknown } & Args): void => {
  if (field.type === 'array' || field.type === 'blocks') {
    if (!Array.isArray(value)) {
      return
    }
    for (const row of value) {
      if (!record({ value: row })) {
        throw invalid()
      }
      const block =
        field.type === 'blocks'
          ? field.blocks
              .map((reference) =>
                typeof reference === 'string'
                  ? args.blocks.find(({ slug }) => slug === reference)
                  : reference,
              )
              .find((block) => block?.slug === row.blockType)
          : undefined
      const fields = field.type === 'array' ? field.fields : block?.fields
      if (!fields) {
        throw new Error('Unknown block in branch projection document.')
      }
      walk({
        ...args,
        data: row,
        fields,
        isBlock: field.type === 'blocks',
        path: [...args.path, row.id],
      })
    }
  } else if ('fields' in field && record({ value })) {
    walk({ ...args, data: value as Record<string, unknown>, fields: field.fields, isBlock: false })
  }
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
