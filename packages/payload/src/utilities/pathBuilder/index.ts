import type { ClientField, Field } from '../../index.js'

type PathResult = {
  /**
   * The accumulated index path at the end of the path (e.g., '_index-0-1')
   * Empty string if the path does not end with an index path
   */
  indexPath: string
  /**
   * Path for accessing data (e.g., 'blocks.0.content.title')
   * Can be null when noIndex() is used
   */
  path: null | string
  /**
   * Path for accessing schema (e.g., 'blocks.content.title')
   * Can be null when noSchemaIndex() is used
   */
  schemaPath: null | string
}

// Root builder - can directly access fields (when withEntity: false)
type RootBuilder = {
  /**
   * Build empty paths (rarely used)
   */
  build(): PathResult
} & FieldBuilder<''>

// Root builder with entity - must start with collections or globals (when withEntity: true)
type RootBuilderWithEntity = {
  /**
   * Build empty paths (rarely used)
   */
  build(): PathResult

  /**
   * Start with a collection slug (must call .id() or .noId() next)
   */
  collections<TName extends string>(slug: TName): CollectionAfterSlugBuilder<TName>

  /**
   * Start with a global slug (can directly access fields)
   */
  globals<TName extends string>(slug: TName): GlobalBuilder<TName>
}

// Collection builder after slug - must specify id or noId
type CollectionAfterSlugBuilder<TCollection extends string> = {
  /**
   * Build without specifying id (rarely used)
   */
  build(): PathResult

  /**
   * Add a document ID to the (data) path (not included in schema path)
   */
  id(id: number | string): CollectionBuilder<TCollection>

  /**
   * Explicitly state no ID context (continues without ID)
   */
  noId(): CollectionBuilder<TCollection>
}

// Type for field parameter - accepts both Field and ClientField
type AnyField = ClientField | Field

// Type to map field types to their corresponding builder return types
type FieldTypeToBuilder<T extends AnyField> = T extends { type: 'array' }
  ? ArrayFieldBuilder<string>
  : T extends { type: 'blocks' }
    ? BlocksFieldBuilder<string>
    : T extends { type: 'collapsible' }
      ? CollapsibleAfterCallBuilder
      : T extends { name: string; type: 'group' }
        ? FieldBuilder<string>
        : T extends { type: 'group' }
          ? GroupAfterCallBuilder
          : T extends { type: 'row' }
            ? RowAfterCallBuilder
            : T extends { type: 'tabs' }
              ? TabsAfterCallBuilder
              : T extends
                    | { type: 'checkbox' }
                    | { type: 'code' }
                    | { type: 'date' }
                    | { type: 'json' }
                    | { type: 'number' }
                    | { type: 'point' }
                    | { type: 'radio' }
                    | { type: 'relationship' }
                    | { type: 'richText' }
                    | { type: 'select' }
                    | { type: 'text' }
                    | { type: 'textarea' }
                    | { type: 'upload' }
                ? TerminalFieldBuilder
                : FieldBuilder<string>

// Common field accessor methods shared across builders
type FieldAccessors = {
  /**
   * Add an array field
   */
  array<TName extends string>(name: TName): ArrayFieldBuilder<TName>
  /**
   * Add a blocks field
   */
  blocks<TName extends string>(name: TName): BlocksFieldBuilder<TName>

  /**
   * Build and return the final paths
   */
  build(): PathResult

  /**
   * Add a checkbox field (terminal - no nesting allowed)
   */
  checkbox<TName extends string>(name: TName): TerminalFieldBuilder

  /**
   * Add a code field (terminal - no nesting allowed)
   */
  code<TName extends string>(name: TName): TerminalFieldBuilder

  /**
   * Add a collapsible field (must call .schemaIndex() or .noSchemaIndex() next)
   */
  collapsible(): CollapsibleAfterCallBuilder

  /**
   * Add a date field (terminal - no nesting allowed)
   */
  date<TName extends string>(name: TName): TerminalFieldBuilder

  /**
   * Add any field based on its type (works with Field or ClientField)
   * The return type automatically adjusts based on the field type
   */
  field<T extends AnyField>(field: T): FieldTypeToBuilder<T>

  /**
   * Add an unnamed group field (must call .schemaIndex() or .noSchemaIndex() next)
   */
  group(): GroupAfterCallBuilder
  /**
   * Add a named group field (allows nesting)
   */
  group<TName extends string>(name: TName): FieldBuilder<string>

  /**
   * Add a JSON field (terminal - no nesting allowed)
   */
  json<TName extends string>(name: TName): TerminalFieldBuilder

  /**
   * Add a number field (terminal - no nesting allowed)
   */
  number<TName extends string>(name: TName): TerminalFieldBuilder

  /**
   * Add a point field (terminal - no nesting allowed)
   */
  point<TName extends string>(name: TName): TerminalFieldBuilder

  /**
   * Add a radio field (terminal - no nesting allowed)
   */
  radio<TName extends string>(name: TName): TerminalFieldBuilder

  /**
   * Add a relationship field (terminal - no nesting allowed)
   */
  relationship<TName extends string>(name: TName): TerminalFieldBuilder

  /**
   * Add a rich text field (terminal - no nesting allowed)
   */
  richText<TName extends string>(name: TName): TerminalFieldBuilder

  /**
   * Add a row field (must call .schemaIndex() or .noSchemaIndex() next)
   */
  row(): RowAfterCallBuilder

  /**
   * Add a select field (terminal - no nesting allowed)
   */
  select<TName extends string>(name: TName): TerminalFieldBuilder

  /**
   * Add a tabs field (must call .schemaIndex() or .noSchemaIndex() next)
   */
  tabs(): TabsAfterCallBuilder

  /**
   * Add a text field (terminal - no nesting allowed)
   */
  text<TName extends string>(name: TName): TerminalFieldBuilder

  /**
   * Add a textarea field (terminal - no nesting allowed)
   */
  textarea<TName extends string>(name: TName): TerminalFieldBuilder

  /**
   * Add an upload field (terminal - no nesting allowed)
   */
  upload<TName extends string>(name: TName): TerminalFieldBuilder
}

// Collection builder - after id/noId, can access fields
type CollectionBuilder<_TCollection extends string> = FieldAccessors

// Global builder - can directly access fields (same as CollectionBuilder but for globals)
type GlobalBuilder<TGlobal extends string> = CollectionBuilder<TGlobal>

// Terminal field builder - fields that cannot have nested fields (only build allowed)
type TerminalFieldBuilder = {
  /**
   * Build and return the final paths
   */
  build(): PathResult
}

// Field builder - includes all field methods (both nesting-capable and terminal)
type FieldBuilder<_TField extends string> = FieldAccessors

// Tabs field builder - after calling tabs(), must specify schema index
type TabsAfterCallBuilder = {
  /**
   * Build without specifying schema index
   */
  build(): PathResult

  /**
   * Skip adding schema index (makes schemaPath null)
   */
  noSchemaIndex(): TabsFieldBuilder

  /**
   * Add schema index for the tabs field
   */
  schemaIndex(index: number): TabsFieldBuilder
}

// Tabs field builder - after schema index, must specify a tab
type TabsFieldBuilder = {
  /**
   * Build without specifying a tab
   */
  build(): PathResult

  /**
   * Navigate to an unnamed tab (must call .schemaIndex() or .noSchemaIndex() next)
   */
  tab(): TabAfterCallBuilder
  /**
   * Navigate to a specific named tab
   */
  tab<TName extends string>(name: TName): FieldBuilder<TName>
}

// Tab field builder - after calling tab() without name, must specify schema index
type TabAfterCallBuilder = {
  /**
   * Build without specifying schema index
   */
  build(): PathResult

  /**
   * Skip adding schema index (makes schemaPath null)
   */
  noSchemaIndex(): FieldBuilder<string>

  /**
   * Add schema index for the unnamed tab
   */
  schemaIndex(index: number): FieldBuilder<string>
}

// Group field builder - after calling group() without name, must specify schema index
type GroupAfterCallBuilder = {
  /**
   * Build without specifying schema index
   */
  build(): PathResult

  /**
   * Skip adding schema index (makes schemaPath null)
   */
  noSchemaIndex(): FieldBuilder<string>

  /**
   * Add schema index for the unnamed group
   */
  schemaIndex(index: number): FieldBuilder<string>
}

// Row field builder - after calling row(), must specify schema index
type RowAfterCallBuilder = {
  /**
   * Build without specifying schema index
   */
  build(): PathResult

  /**
   * Skip adding schema index (makes schemaPath null)
   */
  noSchemaIndex(): FieldBuilder<string>

  /**
   * Add schema index for the row
   */
  schemaIndex(index: number): FieldBuilder<string>
}

// Collapsible field builder - after calling collapsible(), must specify schema index
type CollapsibleAfterCallBuilder = {
  /**
   * Build without specifying schema index
   */
  build(): PathResult

  /**
   * Skip adding schema index (makes schemaPath null)
   */
  noSchemaIndex(): FieldBuilder<string>

  /**
   * Add schema index for the collapsible
   */
  schemaIndex(index: number): FieldBuilder<string>
}

// Blocks field builder - must specify a block next
type BlocksFieldBuilder<_TBlocks extends string> = {
  /**
   * Specify a block type by its slug
   */
  block<TName extends string>(blockSlug: TName): BlockBuilder<TName>

  /**
   * Build without specifying a block (useful for getting the blocks field path)
   */
  build(): PathResult
}

// Block builder - must specify index or noIndex before accessing fields
type BlockBuilder<TBlock extends string> = {
  /**
   * Build without specifying an index (useful for getting the block path)
   */
  build(): PathResult

  /**
   * Add an array index for the block
   */
  index(i: number): FieldBuilder<TBlock>

  /**
   * Skip adding index to path (useful for schema-only paths)
   */
  noIndex(): FieldBuilder<TBlock>
}

// Array field builder - must specify index or noIndex
type ArrayFieldBuilder<TArray extends string> = {
  /**
   * Build without specifying an index (useful for getting the array field path)
   */
  build(): PathResult

  /**
   * Add an array index
   */
  index(i: number): FieldBuilder<TArray>

  /**
   * Skip adding index to path (useful for schema-only paths)
   */
  noIndex(): FieldBuilder<TArray>
}

// State type for path building
type PathBuilderState = {
  /**
   * Accumulates schema indices for unnamed layout fields (tabs, rows, collapsibles, unnamed groups).
   * When a named field is encountered, this gets flushed as _index-X-Y-Z...
   * Examples:
   * - tabs().schemaIndex(3).tab().schemaIndex(0) accumulates [3, 0] → _index-3-0
   */
  accumulatedIndices: number[]
  /**
   * Entity slug (collection or global name)
   */
  entitySlug?: string
  /**
   * Entity context - either 'collection' or 'global'
   */
  entityType?: 'collection' | 'global'
  /**
   * When true, path should be null (used when noIndex is called)
   */
  hasNoIndex: boolean
  /**
   * When true, schemaPath should be null (used when noSchemaIndex is called)
   */
  hasNoSchemaIndex: boolean
  pathSegments: string[]
  schemaPathSegments: string[]
  skipNextIndex: boolean
}

// Helper function to create a new builder with copied state
const cloneBuilder = (state: PathBuilderState): PathBuilderState => {
  return Object.create(methods, {
    accumulatedIndices: { value: [...state.accumulatedIndices], writable: true },
    entitySlug: { value: state.entitySlug, writable: true },
    entityType: { value: state.entityType, writable: true },
    hasNoIndex: { value: state.hasNoIndex, writable: true },
    hasNoSchemaIndex: { value: state.hasNoSchemaIndex, writable: true },
    pathSegments: { value: [...state.pathSegments], writable: false },
    schemaPathSegments: { value: [...state.schemaPathSegments], writable: false },
    skipNextIndex: { value: state.skipNextIndex, writable: true },
  })
}

// Helper functions that operate on state
const appendPath = (state: PathBuilderState, segment: string): void => {
  if (segment) {
    state.pathSegments.push(segment)
  }
}

const appendSchemaPath = (state: PathBuilderState, segment: string): void => {
  if (segment) {
    state.schemaPathSegments.push(segment)
  }
}

/**
 * Flush accumulated indices as a single _index-X-Y-Z segment in schema path
 */
const flushAccumulatedIndices = (state: PathBuilderState, includeInPath = false): void => {
  if (state.accumulatedIndices.length > 0) {
    const indexMarker = `_index-${state.accumulatedIndices.join('-')}`
    if (includeInPath) {
      appendPath(state, indexMarker)
    }
    appendSchemaPath(state, indexMarker)
    state.accumulatedIndices = []
  }
}

/**
 * Add a named field - flushes accumulated indices first, then adds field to both paths
 */
const addField = (state: PathBuilderState, name: string): void => {
  flushAccumulatedIndices(state)
  appendPath(state, name)
  appendSchemaPath(state, name)
}

// Shared builder methods object (created once, reused for all builders)
const methods = {
  array(this: PathBuilderState, name: string): ArrayFieldBuilder<string> {
    const newState = cloneBuilder(this)
    newState.skipNextIndex = false // Reset flag when entering a new array
    addField(newState, name)
    // @ts-expect-error - Prototype chain provides these methods
    return newState
  },

  block(this: PathBuilderState, blockSlug: string): BlockBuilder<string> {
    const newState = cloneBuilder(this)
    appendSchemaPath(newState, blockSlug)
    // @ts-expect-error - Prototype chain provides these methods
    return newState
  },

  blocks(this: PathBuilderState, name: string): BlocksFieldBuilder<string> {
    const newState = cloneBuilder(this)
    newState.skipNextIndex = false // Reset flag when entering a new blocks field
    addField(newState, name)
    // @ts-expect-error - Prototype chain provides these methods
    return newState
  },

  build(this: PathBuilderState): PathResult {
    // Calculate indexPath from accumulated indices before flushing
    const indexPath =
      this.accumulatedIndices.length > 0 ? `_index-${this.accumulatedIndices.join('-')}` : ''

    // Flush any remaining accumulated indices before building
    // Include in path since we're at the end (no named field follows)
    flushAccumulatedIndices(this, true)

    // Build the base paths
    let path = this.pathSegments.join('.')
    let schemaPath = this.schemaPathSegments.join('.')

    // Prepend entity context if present
    if (this.entityType && this.entitySlug) {
      const entityPrefix = `${this.entityType}.${this.entitySlug}`
      path = path ? `${entityPrefix}.${path}` : entityPrefix
      schemaPath = schemaPath ? `${entityPrefix}.${schemaPath}` : entityPrefix
    }

    return {
      indexPath,
      path: this.hasNoIndex ? null : path,
      schemaPath: this.hasNoSchemaIndex ? null : schemaPath,
    }
  },

  checkbox(this: PathBuilderState, name: string): TerminalFieldBuilder {
    const newState = cloneBuilder(this)
    addField(newState, name)
    // @ts-expect-error - Prototype chain provides these methods
    return newState
  },

  code(this: PathBuilderState, name: string): TerminalFieldBuilder {
    const newState = cloneBuilder(this)
    addField(newState, name)
    // @ts-expect-error - Prototype chain provides these methods
    return newState
  },

  collapsible(this: PathBuilderState): CollapsibleAfterCallBuilder {
    const newState = cloneBuilder(this)
    // @ts-expect-error - Prototype chain provides these methods
    return newState
  },

  collections(this: PathBuilderState, slug: string): CollectionAfterSlugBuilder<string> {
    const newState = cloneBuilder(this)
    newState.entityType = 'collection'
    newState.entitySlug = slug
    // @ts-expect-error - Prototype chain provides these methods
    return newState
  },

  date(this: PathBuilderState, name: string): TerminalFieldBuilder {
    const newState = cloneBuilder(this)
    addField(newState, name)
    // @ts-expect-error - Prototype chain provides these methods
    return newState
  },

  field<T extends AnyField>(this: PathBuilderState, field: T): FieldTypeToBuilder<T> {
    const newState = cloneBuilder(this)

    // Handle named fields
    if ('name' in field && field.name) {
      switch (field.type) {
        case 'array':
          return methods.array.call(newState, field.name) as FieldTypeToBuilder<T>
        case 'blocks':
          return methods.blocks.call(newState, field.name) as FieldTypeToBuilder<T>
        case 'checkbox':
          return methods.checkbox.call(newState, field.name) as FieldTypeToBuilder<T>
        case 'code':
          return methods.code.call(newState, field.name) as FieldTypeToBuilder<T>
        case 'date':
          return methods.date.call(newState, field.name) as FieldTypeToBuilder<T>
        case 'group':
          return methods.group.call(newState, field.name) as FieldTypeToBuilder<T>
        case 'json':
          return methods.json.call(newState, field.name) as FieldTypeToBuilder<T>
        case 'number':
          return methods.number.call(newState, field.name) as FieldTypeToBuilder<T>
        case 'point':
          return methods.point.call(newState, field.name) as FieldTypeToBuilder<T>
        case 'radio':
          return methods.radio.call(newState, field.name) as FieldTypeToBuilder<T>
        case 'relationship':
          return methods.relationship.call(newState, field.name) as FieldTypeToBuilder<T>
        case 'richText':
          return methods.richText.call(newState, field.name) as FieldTypeToBuilder<T>
        case 'select':
          return methods.select.call(newState, field.name) as FieldTypeToBuilder<T>
        case 'text':
          return methods.text.call(newState, field.name) as FieldTypeToBuilder<T>
        case 'textarea':
          return methods.textarea.call(newState, field.name) as FieldTypeToBuilder<T>
        case 'upload':
          return methods.upload.call(newState, field.name) as FieldTypeToBuilder<T>
        default:
          // For unknown field types with names, treat as generic field builder
          addField(newState, field.name)
          // @ts-expect-error - Prototype chain provides these methods
          return newState as FieldTypeToBuilder<T>
      }
    }

    // Handle unnamed layout fields (no name property)
    switch (field.type) {
      case 'collapsible':
        return methods.collapsible.call(newState) as FieldTypeToBuilder<T>
      case 'group':
        return methods.group.call(newState) as FieldTypeToBuilder<T>
      case 'row':
        return methods.row.call(newState) as FieldTypeToBuilder<T>
      case 'tabs':
        return methods.tabs.call(newState) as FieldTypeToBuilder<T>
      default:
        // Unknown unnamed field type - return as-is
        // @ts-expect-error - Prototype chain provides these methods
        return newState as FieldTypeToBuilder<T>
    }
  },

  globals(this: PathBuilderState, slug: string): GlobalBuilder<string> {
    const newState = cloneBuilder(this)
    newState.entityType = 'global'
    newState.entitySlug = slug
    // @ts-expect-error - Prototype chain provides these methods
    return newState
  },

  group(this: PathBuilderState, name?: string): FieldBuilder<string> | GroupAfterCallBuilder {
    const newState = cloneBuilder(this)
    if (name !== undefined) {
      addField(newState, name)
    }
    // @ts-expect-error - Prototype chain provides these methods
    return newState
  },

  id(this: PathBuilderState, id: number | string): CollectionBuilder<string> {
    const newState = cloneBuilder(this)
    appendPath(newState, String(id))
    // @ts-expect-error - Prototype chain provides these methods
    return newState
  },

  noId(this: PathBuilderState): CollectionBuilder<string> {
    const newState = cloneBuilder(this)
    // @ts-expect-error - Prototype chain provides these methods
    return newState
  },

  index(this: PathBuilderState, i: number): FieldBuilder<string> {
    const newState = cloneBuilder(this)
    if (!newState.skipNextIndex) {
      appendPath(newState, String(i))
    }
    newState.skipNextIndex = false
    // @ts-expect-error - Prototype chain provides these methods
    return newState
  },

  json(this: PathBuilderState, name: string): TerminalFieldBuilder {
    const newState = cloneBuilder(this)
    addField(newState, name)
    // @ts-expect-error - Prototype chain provides these methods
    return newState
  },

  noIndex(this: PathBuilderState): FieldBuilder<string> {
    const newState = cloneBuilder(this)
    newState.skipNextIndex = true
    newState.hasNoIndex = true
    // @ts-expect-error - Prototype chain provides these methods
    return newState
  },

  number(this: PathBuilderState, name: string): TerminalFieldBuilder {
    const newState = cloneBuilder(this)
    addField(newState, name)
    // @ts-expect-error - Prototype chain provides these methods
    return newState
  },

  point(this: PathBuilderState, name: string): TerminalFieldBuilder {
    const newState = cloneBuilder(this)
    addField(newState, name)
    // @ts-expect-error - Prototype chain provides these methods
    return newState
  },

  radio(this: PathBuilderState, name: string): TerminalFieldBuilder {
    const newState = cloneBuilder(this)
    addField(newState, name)
    // @ts-expect-error - Prototype chain provides these methods
    return newState
  },

  relationship(this: PathBuilderState, name: string): TerminalFieldBuilder {
    const newState = cloneBuilder(this)
    addField(newState, name)
    // @ts-expect-error - Prototype chain provides these methods
    return newState
  },

  richText(this: PathBuilderState, name: string): TerminalFieldBuilder {
    const newState = cloneBuilder(this)
    addField(newState, name)
    // @ts-expect-error - Prototype chain provides these methods
    return newState
  },

  row(this: PathBuilderState): RowAfterCallBuilder {
    const newState = cloneBuilder(this)
    // @ts-expect-error - Prototype chain provides these methods
    return newState
  },

  select(this: PathBuilderState, name: string): TerminalFieldBuilder {
    const newState = cloneBuilder(this)
    addField(newState, name)
    // @ts-expect-error - Prototype chain provides these methods
    return newState
  },

  tab(this: PathBuilderState, name?: string): FieldBuilder<string> | TabAfterCallBuilder {
    const newState = cloneBuilder(this)
    if (name !== undefined) {
      flushAccumulatedIndices(newState)
      appendPath(newState, name)
      appendSchemaPath(newState, name)
    }
    // @ts-expect-error - Prototype chain provides these methods
    return newState
  },

  tabs(this: PathBuilderState): TabsAfterCallBuilder {
    const newState = cloneBuilder(this)
    // @ts-expect-error - Prototype chain provides these methods
    return newState
  },

  text(this: PathBuilderState, name: string): TerminalFieldBuilder {
    const newState = cloneBuilder(this)
    addField(newState, name)
    // @ts-expect-error - Prototype chain provides these methods
    return newState
  },

  textarea(this: PathBuilderState, name: string): TerminalFieldBuilder {
    const newState = cloneBuilder(this)
    addField(newState, name)
    // @ts-expect-error - Prototype chain provides these methods
    return newState
  },

  upload(this: PathBuilderState, name: string): TerminalFieldBuilder {
    const newState = cloneBuilder(this)
    addField(newState, name)
    // @ts-expect-error - Prototype chain provides these methods
    return newState
  },

  schemaIndex(this: PathBuilderState, index: number): FieldBuilder<string> | TabsFieldBuilder {
    const newState = cloneBuilder(this)
    newState.accumulatedIndices.push(index)
    // @ts-expect-error - Prototype chain provides these methods
    return newState
  },

  noSchemaIndex(
    this: PathBuilderState,
  ): FieldBuilder<string> | TabAfterCallBuilder | TabsFieldBuilder {
    const newState = cloneBuilder(this)
    newState.hasNoSchemaIndex = true
    // @ts-expect-error - Prototype chain provides these methods
    return newState
  },
}

// Create a new builder instance with state
function createPathBuilder(): RootBuilder {
  const state: PathBuilderState = {
    accumulatedIndices: [],
    entitySlug: undefined,
    entityType: undefined,
    hasNoIndex: false,
    hasNoSchemaIndex: false,
    pathSegments: [],
    schemaPathSegments: [],
    skipNextIndex: false,
  }

  // Bind all methods to the state object
  return Object.create(methods, {
    accumulatedIndices: { value: state.accumulatedIndices, writable: true },
    entitySlug: { value: undefined, writable: true },
    entityType: { value: undefined, writable: true },
    hasNoIndex: { value: false, writable: true },
    hasNoSchemaIndex: { value: false, writable: true },
    pathSegments: { value: state.pathSegments, writable: false },
    schemaPathSegments: { value: state.schemaPathSegments, writable: false },
    skipNextIndex: { value: false, writable: true },
  })
}

/**
 * Create a new path builder instance
 *
 * @example
 * ```ts
 * // Simple field path (no entity context)
 * const result = getPathBuilder()
 *   .text('title')
 *   .build()
 * // { path: 'title', schemaPath: 'title' }
 * ```
 *
 * @example
 * ```ts
 * // With entity context - collection
 * const result = getPathBuilder({ withEntity: true })
 *   .collections('pages')
 *   .id(123)
 *   .text('title')
 *   .build()
 * // { path: 'title', schemaPath: 'title' }
 * ```
 *
 * @example
 * ```ts
 * // With entity context - global
 * const result = getPathBuilder({ withEntity: true })
 *   .globals('header')
 *   .text('title')
 *   .build()
 * // { path: 'title', schemaPath: 'title' }
 * ```
 *
 * @experimental may change in a minor release
 * @internal
 */
export function getPathBuilder(): RootBuilder
export function getPathBuilder(options: { withEntity: true }): RootBuilderWithEntity
export function getPathBuilder(_options?: {
  withEntity?: boolean
}): RootBuilder | RootBuilderWithEntity {
  return createPathBuilder()
}

/**
 * Assertion function to narrow the builder type based on an already-narrowed field type.
 * Use this after you've narrowed the field type to also narrow the builder.
 *
 * @example
 * ```ts
 * const field: Field = getFieldFromSomewhere()
 * const builder = getPathBuilder().field(field)
 *
 * if (field.type === 'array') {
 *   // field is now ArrayField, but builder is still a union
 *   narrowBuilder(field, builder)
 *   // Now builder is narrowed to ArrayFieldBuilder!
 *   builder.index(0).text('label')
 * }
 * ```
 */
export function narrowBuilder<T extends Field>(
  field: T,
  builder: FieldTypeToBuilder<Field>,
): asserts builder is FieldTypeToBuilder<T> {
  // This is purely for type narrowing - no runtime logic needed
  // TypeScript will use the field's already-narrowed type to narrow the builder
}

/**
 * @experimental may change in a minor release
 * @internal
 */
export type {
  ArrayFieldBuilder,
  BlockBuilder,
  BlocksFieldBuilder,
  CollapsibleAfterCallBuilder,
  CollectionAfterSlugBuilder,
  CollectionBuilder,
  FieldAccessors,
  FieldBuilder,
  GlobalBuilder,
  GroupAfterCallBuilder,
  PathResult,
  RootBuilder,
  RootBuilderWithEntity,
  RowAfterCallBuilder,
  TabAfterCallBuilder,
  TabsAfterCallBuilder,
  TabsFieldBuilder,
  TerminalFieldBuilder,
}
