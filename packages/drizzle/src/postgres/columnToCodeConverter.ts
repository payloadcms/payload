import type { ColumnToCodeConverter } from '../types.js'
export const columnToCodeConverter: ColumnToCodeConverter = ({
  adapter,
  addEnum,
  addImport,
  column,
  tableKey,
}) => {
  let columnBuilderFn: string = column.type

  if (column.type === 'geometry') {
    columnBuilderFn = 'geometryColumn'
    addImport(adapter.packageName, columnBuilderFn)
  } else if (column.type === 'enum') {
    if ('locale' in column) {
      columnBuilderFn = `enum__locales`
    } else {
      addEnum(column.enumName, column.options)
      columnBuilderFn = column.enumName
    }
  } else {
    addImport(`${adapter.packageName}/drizzle/pg-core`, columnBuilderFn)
  }

  const columnBuilderArgsArray: string[] = []

  if (column.type === 'timestamp') {
    columnBuilderArgsArray.push(`mode: '${column.mode}'`)
    if (column.withTimezone) {
      columnBuilderArgsArray.push('withTimezone: true')
    }

    if (typeof column.precision === 'number') {
      columnBuilderArgsArray.push(`precision: ${column.precision}`)
    }
  }

  if (column.type === 'vector') {
    if (column.dimensions) {
      columnBuilderArgsArray.push(`dimensions: ${column.dimensions}`)
    }
  }

  let columnBuilderArgs = ''

  if (columnBuilderArgsArray.length) {
    columnBuilderArgs = `, {${columnBuilderArgsArray.join(',')}}`
  }

  let code = `${columnBuilderFn}('${column.name}'${columnBuilderArgs})`

  if (column.type === 'timestamp' && column.defaultNow) {
    code = `${code}.defaultNow()`
  }

  if (column.type === 'uuid' && column.defaultRandom) {
    code = `${code}.defaultRandom()`
  }

  if (column.notNull) {
    code = `${code}.notNull()`
  }

  if (column.primaryKey) {
    code = `${code}.primaryKey()`
  }

  if (typeof column.default !== 'undefined') {
    let sanitizedDefault = column.default

    if (column.type === 'geometry') {
      sanitizedDefault = `sql\`${column.default}\``
    } else if (column.type === 'jsonb') {
      sanitizedDefault = `sql\`'${JSON.stringify(column.default)}'::jsonb\``
    } else if (column.type === 'numeric') {
      sanitizedDefault = `'${column.default}'`
    } else if (typeof column.default === 'string') {
      sanitizedDefault = `${JSON.stringify(column.default)}`
    }

    code = `${code}.default(${sanitizedDefault})`
  }

  if (column.reference) {
    let callback = `()`

    if (column.reference.table === tableKey) {
      addImport(`${adapter.packageName}/drizzle/pg-core`, 'type AnyPgColumn')
      callback = `${callback}: AnyPgColumn`
    }

    callback = `${callback} => ${column.reference.table}.${column.reference.name}`

    code = `${code}.references(${callback}, {
      ${column.reference.onDelete ? `onDelete: '${column.reference.onDelete}'` : ''}
  })`
  }

  return code
}
