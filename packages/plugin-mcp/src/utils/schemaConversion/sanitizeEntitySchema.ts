import type { JsonSchemaType } from '../../types.js'

/**
 * Refines Payload's `input`-variant JSON Schema into an MCP create/update tool's input schema. The
 * variant already covers correctness (ID-only relationships, no managed/virtual/join fields); the
 * passes here are MCP-specific - reshaping fields for the model and shrinking the result - and keep
 * every node valid JSON Schema draft 2020-12. Each is tagged **Correctness**, **Size**, or **LLM
 * ergonomics**, with a before/after example on its definition.
 */
export const sanitizeEntitySchema = (schema: JsonSchemaType): JsonSchemaType => {
  // Work on a copy — the caller reuses the original schema elsewhere (e.g. when listing tools).
  let result = structuredClone(schema)

  // LLM ergonomics — drop the redundant `'null'` from optional arrays/objects (`['array','null']` → `'array'`).
  result = collapseOptionalContainerTypes(result)

  // LLM ergonomics — rewrite point fields from a `[number, number]` tuple into a `{ longitude, latitude }` object.
  result = pointFieldsToObjects(result)

  // Size — strip inert type-gen leftovers that only bloat the schema (`tsType`, block-collision notes).
  result = removeTypeGenArtifacts(result)

  // Size — where a `const` already pins a value, the sibling `type` is redundant; remove it.
  result = dropRedundantConstType(result)

  // Size — fold per-collection relationship/upload variants (identical but for `relationTo`) into one `enum`.
  result = mergeConstDiscriminatedUnions(result)

  // Size — pull any subschema that appears more than once into a single shared `$defs` entry.
  result = deduplicateIntoDefinitions(result)

  // LLM ergonomics — give `$defs` short, readable names (`Code`, `paragraph`, `node`) so the `$ref`s read nicely.
  result = shortenDefinitionNames(result)

  return result
}

/**
 * Rebuilds a schema bottom-up, calling `visit` on each node after its children. Shared by the
 * transforms that need to touch every node in the tree.
 */
const mapNodes = (node: unknown, visit: (node: JsonSchemaType) => JsonSchemaType): unknown => {
  if (Array.isArray(node)) {
    return node.map((child) => mapNodes(child, visit))
  }
  if (!node || typeof node !== 'object') {
    return node
  }
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(node)) {
    out[key] = mapNodes(value, visit)
  }
  return visit(out)
}

/**
 * **LLM ergonomics.** Collapses optional array/object types (`['array', 'null']` → `'array'`) via
 * {@link collapseNullableType}, recursing through `properties` and array items. The `required` list
 * already conveys optionality, so the `'null'` is redundant noise for the model.
 *
 * @example
 * { properties: { tags: { type: ['array', 'null'], items: {} } }, required: [] }
 * → { properties: { tags: { type: 'array', items: {} } }, required: [] }
 */
const collapseOptionalContainerTypes = (schema: JsonSchemaType): JsonSchemaType => {
  if (schema.properties && typeof schema.properties === 'object') {
    for (const key of Object.keys(schema.properties)) {
      const prop = schema.properties[key] as JsonSchemaType
      if (!prop || typeof prop !== 'object') {
        continue
      }
      const isRequired = Array.isArray(schema.required) && schema.required.includes(key)
      collapseNullableType(prop, isRequired)
      if (prop.properties) {
        collapseOptionalContainerTypes(prop)
      }
      if (prop.items && typeof prop.items === 'object' && !Array.isArray(prop.items)) {
        collapseOptionalContainerTypes(prop.items)
      }
    }
  }

  return schema
}

/**
 * Drops the `'null'` from an optional array/object type (`['array', 'null']` → `'array'`, likewise
 * `'object'`). Payload marks a field optional by unioning its type with `'null'`, but a create/update
 * tool already conveys "optional" through the `required` list - the client just omits the field - so the
 * `'null'` is redundant here. Dropping it shows the model a plain `type: 'array'` instead of implying it
 * should send a literal `null`.
 *
 * We never touch the `required` list, so this can't change whether a field is required. And we skip fields
 * that ARE required (`isRequired`): there a `'null'` is a value the field genuinely accepts, not optionality
 * encoding. Nullable scalars (`['string', 'null']`) are also left alone - they read fine as `string | null`.
 *
 * @example
 * optional { type: ['array', 'null'] } → { type: 'array' }   (still optional, just no longer null-valued)
 * required { type: ['array', 'null'] } → unchanged
 * { type: ['string', 'null'] } → unchanged
 */
const collapseNullableType = (schema: JsonSchemaType, isRequired: boolean): void => {
  if (isRequired || !Array.isArray(schema.type)) {
    return
  }
  const nonNullTypes = schema.type.filter((t) => t !== 'null')
  if (nonNullTypes.length === 1 && (nonNullTypes[0] === 'array' || nonNullTypes[0] === 'object')) {
    schema.type = nonNullTypes[0]
  }
}

/**
 * **LLM ergonomics.** Rewrites a point field (stored as a two-number tuple) into a `{ longitude, latitude }` object, which
 * is far easier for the model to fill in than a positional array. This is input-only and lossless: the
 * create/update handler converts the object back to the `[longitude, latitude]` tuple Payload stores,
 * via `transformPointDataToPayload`.
 *
 * @example
 * { type: 'array', items: [{ type: 'number' }, { type: 'number' }] }
 * → { type: 'object', properties: { longitude: { type: 'number' }, latitude: { type: 'number' } }, required: ['longitude', 'latitude'] }
 */
const pointFieldsToObjects = (schema: JsonSchemaType): JsonSchemaType => {
  if (!schema || typeof schema !== 'object') {
    return schema
  }

  const transformed = { ...schema }

  if (transformed.properties && typeof transformed.properties === 'object') {
    transformed.properties = Object.fromEntries(
      Object.entries(transformed.properties).map(([key, value]) => {
        if (!value || typeof value !== 'object') {
          return [key, value]
        }
        const isArrayType =
          value.type === 'array' || (Array.isArray(value.type) && value.type.includes('array'))
        const isPointField =
          isArrayType &&
          Array.isArray(value.items) &&
          value.items.length === 2 &&
          value.items.every((item) => item && typeof item === 'object' && item.type === 'number')

        if (isPointField) {
          const isNullable = Array.isArray(value.type) && value.type.includes('null')
          return [
            key,
            {
              type: isNullable ? ['object', 'null'] : 'object',
              description: value.description || 'Geographic coordinates (longitude, latitude)',
              properties: {
                latitude: { type: 'number', description: 'Latitude coordinate' },
                longitude: { type: 'number', description: 'Longitude coordinate' },
              },
              required: ['longitude', 'latitude'],
            },
          ]
        }

        return [key, pointFieldsToObjects(value)]
      }),
    )
  }

  if (
    transformed.items &&
    typeof transformed.items === 'object' &&
    !Array.isArray(transformed.items)
  ) {
    transformed.items = pointFieldsToObjects(transformed.items)
  }

  return transformed
}

/**
 * **Size.** Strips type-generation leftovers that bloat the schema without helping the model: the `tsType`
 * hint (a `json-schema-to-typescript` extension; JSON Schema validators just ignore it, they don't reject it)
 * and the block-interface-collision note Payload adds to some block descriptions (the
 * `block-interface-name-collisions` docs link set in `registerBlockInterface`, see configToJSONSchema.ts).
 * Both are inert here - removing them only shrinks the schema (and spares the model irrelevant noise).
 *
 * @example
 * { type: 'object', tsType: 'SerializedBlockNode', description: 'see …#block-interface-name-collisions' }
 * → { type: 'object' }
 */
const removeTypeGenArtifacts = (schema: JsonSchemaType): JsonSchemaType =>
  mapNodes(schema, (node) => {
    delete (node as { tsType?: unknown }).tsType
    const { description } = node as { description?: string }
    if (
      typeof description === 'string' &&
      description.includes('block-interface-name-collisions')
    ) {
      delete (node as { description?: unknown }).description
    }
    return node
  }) as JsonSchemaType

/**
 * **Size.** Removes `type` whenever a `const` sits next to it — the constant already fixes the value.
 *
 * @example
 * { type: 'string', const: 'paragraph' } → { const: 'paragraph' }
 */
const dropRedundantConstType = (schema: JsonSchemaType): JsonSchemaType =>
  mapNodes(schema, (node) => {
    if ('const' in node && 'type' in node) {
      delete (node as { type?: unknown }).type
    }
    return node
  }) as JsonSchemaType

/**
 * **Size.** Merges the members of a `oneOf`/`anyOf` that are identical except for one `const`-valued property
 * into a single member with that property as an `enum`. Since the members differ only by that one
 * constant, the `enum` form accepts exactly the same values - it's just smaller. This folds the
 * per-collection relationship and upload variants, which differ only in their `relationTo` constant.
 *
 * @example
 * { oneOf: [
 *   { properties: { relationTo: { const: 'posts' }, value: { type: 'string' } } },
 *   { properties: { relationTo: { const: 'pages' }, value: { type: 'string' } } },
 * ] }
 * → { properties: { relationTo: { enum: ['posts', 'pages'] }, value: { type: 'string' } } }
 */
const mergeConstDiscriminatedUnions = (schema: JsonSchemaType): JsonSchemaType =>
  mapNodes(schema, (node) => {
    for (const keyword of ['oneOf', 'anyOf'] as const) {
      const members = node[keyword]
      if (Array.isArray(members) && members.length > 1) {
        const merged = mergeMembersByConst(members)
        if (merged) {
          delete node[keyword]
          Object.assign(node, merged)
        }
      }
    }
    return node
  }) as JsonSchemaType

/** Returns the merged member for {@link mergeConstDiscriminatedUnions}, or `null` if they can't merge. */
const mergeMembersByConst = (members: Array<boolean | JsonSchemaType>): JsonSchemaType | null => {
  const objects = members.filter(
    (member): member is JsonSchemaType =>
      typeof member === 'object' && member !== null && typeof member.properties === 'object',
  )
  if (objects.length < 2 || objects.length !== members.length) {
    return null
  }

  for (const discriminator of Object.keys(objects[0]!.properties!)) {
    // Each member must pin this property to a `const`...
    const constValues: unknown[] = []
    const everyMemberPinsConst = objects.every((member) => {
      const prop = member.properties![discriminator]
      if (prop && typeof prop === 'object' && 'const' in prop) {
        constValues.push(prop.const)
        return true
      }
      return false
    })
    if (!everyMemberPinsConst) {
      continue
    }

    // ...and be otherwise identical (compare each member with the discriminator removed).
    const fingerprintWithoutDiscriminator = (member: JsonSchemaType): string => {
      const { [discriminator]: _discriminator, ...otherProperties } = member.properties!
      return JSON.stringify({ ...member, properties: otherProperties })
    }
    if (new Set(objects.map(fingerprintWithoutDiscriminator)).size !== 1) {
      continue
    }

    const uniqueConstValues = [...new Set(constValues)]
    if (uniqueConstValues.length < 2) {
      continue
    }

    // Replace the per-member `const` with a single `enum` of every value.
    const merged = structuredClone(objects[0]!)
    const discriminatorProp = merged.properties![discriminator]
    if (discriminatorProp && typeof discriminatorProp === 'object') {
      delete discriminatorProp.const
      discriminatorProp.enum = uniqueConstValues as NonNullable<typeof discriminatorProp.enum>
    }
    return merged
  }
  return null
}

// A `$ref` costs ~30 characters once names are shortened, so sharing a subschema only pays off when
// it's larger than that and appears more than once.
const MIN_SHARED_SIZE = 64

/** A subschema worth sharing: a standalone object/union/described schema, not a `$ref` or a primitive. */
const isShareable = (node: unknown): node is Record<string, unknown> => {
  if (!node || typeof node !== 'object' || Array.isArray(node) || '$ref' in node) {
    return false
  }
  const schema = node as JsonSchemaType
  return (
    Array.isArray(schema.oneOf) ||
    Array.isArray(schema.anyOf) ||
    Boolean(schema.properties) ||
    Boolean(schema.items) ||
    typeof schema.description === 'string'
  )
}

/**
 * **Size.** Replaces any subschema that appears more than once with a single shared `$defs` entry referenced by
 * `$ref`. Lossless — only the serialized size shrinks. A collection with several rich-text fields, for
 * example, inlines the same large lexical node schema once per field; this collapses them into one.
 *
 * @example
 * { properties: { billing: address, shipping: address } }
 * → { properties: { billing: { $ref: '#/$defs/shared_0' }, shipping: { $ref: '#/$defs/shared_0' } }, $defs: { shared_0: address } }
 */
const deduplicateIntoDefinitions = (schema: JsonSchemaType): JsonSchemaType => {
  // Count how often each shareable subschema appears, keyed by its serialized form.
  const counts = new Map<string, number>()
  const count = (node: unknown): void => {
    if (isShareable(node)) {
      const key = JSON.stringify(node)
      if (key.length >= MIN_SHARED_SIZE) {
        counts.set(key, (counts.get(key) ?? 0) + 1)
      }
    }
    if (Array.isArray(node)) {
      node.forEach(count)
    } else if (node && typeof node === 'object') {
      Object.values(node).forEach(count)
    }
  }
  count(schema)

  if (![...counts.values()].some((n) => n >= 2)) {
    return schema
  }

  // Replace each subschema seen 2+ times with a `$ref`. The first time we meet one it becomes a shared
  // entry; we never descend into a stored entry, so shared entries never reference one another.
  const sharedEntries: Record<string, JsonSchemaType> = {}
  const nameByKey = new Map<string, string>()
  const share = (node: unknown): unknown => {
    if (isShareable(node)) {
      const key = JSON.stringify(node)
      if ((counts.get(key) ?? 0) >= 2) {
        let name = nameByKey.get(key)
        if (!name) {
          name = `shared_${nameByKey.size}`
          nameByKey.set(key, name)
          sharedEntries[name] = node
        }
        return { $ref: `#/$defs/${name}` }
      }
    }
    if (Array.isArray(node)) {
      return node.map(share)
    }
    if (node && typeof node === 'object') {
      return Object.fromEntries(
        Object.entries(node).map(([childKey, value]) => [childKey, share(value)]),
      )
    }
    return node
  }

  const result = share(schema) as JsonSchemaType
  result.$defs = { ...result.$defs, ...sharedEntries }
  return result
}

/**
 * **LLM ergonomics.** Renames `$defs` entries to short, readable names so the `$ref`s stay legible to the model: a block's
 * `blockType` (`Code`), a node's `type` (`paragraph`), `node` for a rich-text node union, otherwise the
 * generated name with its disambiguating hash dropped. A numeric suffix keeps collisions unique.
 *
 * @example
 * { properties: { body: { $ref: '#/$defs/LexicalNodes_9FBEC708' } }, $defs: { LexicalNodes_9FBEC708: {} } }
 * → { properties: { body: { $ref: '#/$defs/node' } }, $defs: { node: {} } }
 */
const shortenDefinitionNames = (schema: JsonSchemaType): JsonSchemaType => {
  const definitions = schema.$defs
  if (!definitions || Object.keys(definitions).length === 0) {
    return schema
  }

  const shortNameFor = (name: string, definition: boolean | JsonSchemaType): string => {
    const properties = (typeof definition === 'object' && definition.properties) || {}
    const constString = (key: string): string | undefined => {
      const prop = properties[key]
      return prop && typeof prop === 'object' && typeof prop.const === 'string'
        ? prop.const
        : undefined
    }
    const members =
      typeof definition === 'object' ? (definition.anyOf ?? definition.oneOf) : undefined
    const isNodeUnion =
      Array.isArray(members) &&
      members.some((m) => typeof m === 'object' && Boolean(m.$ref || m.properties?.type))
    return (
      constString('blockType') ??
      constString('type') ??
      (isNodeUnion ? 'node' : undefined) ??
      name.replace(/_[0-9A-F]{6,}$/i, '')
    )
  }

  const prefix = '#/$defs/'
  const usedNames = new Map<string, number>()
  const rename = new Map<string, string>()
  for (const [name, definition] of Object.entries(definitions)) {
    const shortName = shortNameFor(name, definition)
    const used = usedNames.get(shortName) ?? 0
    usedNames.set(shortName, used + 1)
    rename.set(name, used === 0 ? shortName : `${shortName}${used + 1}`)
  }

  const result = mapNodes(schema, (node) => {
    if (typeof node.$ref === 'string' && node.$ref.startsWith(prefix)) {
      const name = node.$ref.slice(prefix.length)
      node.$ref = `${prefix}${rename.get(name) ?? name}`
    }
    return node
  }) as JsonSchemaType
  result.$defs = Object.fromEntries(
    Object.entries(result.$defs!).map(([name, body]) => [rename.get(name) ?? name, body]),
  )
  return result
}
