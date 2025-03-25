import type { ColumnToCodeConverter } from '@payloadcms/drizzle/types'

export const columnToCodeConverter: ColumnToCodeConverter = ({
  adapter,
  addImport,
  column,
  locales,
  tableKey,
}) => {
  let columnBuilderFn: string = column.type

  const columnBuilderArgsArray: string[] = []

  let defaultStatement: null | string = null

  switch (column.type) {
    case 'boolean': {
      columnBuilderFn = 'integer'
      columnBuilderArgsArray.push("mode: 'boolean'")
      break
    }

    case 'enum': {
      let options: string[]
      if ('locale' in column) {
        if (!locales?.length) {
          throw new Error('Locales must be defined for locale columns')
        }
        options = locales
      } else {
        options = column.options
      }

      columnBuilderFn = 'text'
      columnBuilderArgsArray.push(`enum: [${options.map((locale) => `'${locale}'`).join(', ')}]`)

      break
    }

    case 'geometry':
    case 'jsonb': {
      columnBuilderFn = 'text'
      columnBuilderArgsArray.push("mode: 'json'")
      break
    }

    case 'serial': {
      columnBuilderFn = 'integer'
      break
    }

    case 'timestamp': {
      columnBuilderFn = 'text'
      defaultStatement = `default(sql\`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))\`)`
      break
    }

    case 'uuid': {
      columnBuilderFn = 'text'

      if (column.defaultRandom) {
        addImport('crypto', 'randomUUID')
        defaultStatement = `$defaultFn(() => randomUUID())`
      }

      break
    }

    case 'varchar': {
      columnBuilderFn = 'text'
      break
    }

    default: {
      columnBuilderFn = column.type
    }
  }

  addImport(`${adapter.packageName}/drizzle/sqlite-core`, columnBuilderFn)

  let columnBuilderArgs = ''

  if (columnBuilderArgsArray.length) {
    columnBuilderArgs = `, {${columnBuilderArgsArray.join(',')}}`
  }

  let code = `${columnBuilderFn}('${column.name}'${columnBuilderArgs})`

  if (column.notNull) {
    code = `${code}.notNull()`
  }

  if (column.primaryKey) {
    let arg = ''

    if (column.type === 'integer' && column.autoIncrement) {
      arg = `{ autoIncrement: true }`
    }

    code = `${code}.primaryKey(${arg})`
  }

  if (defaultStatement) {
    code = `${code}.${defaultStatement}`
  } else if (typeof column.default !== 'undefined') {
    let sanitizedDefault = column.default

    if (column.type === 'jsonb' || column.type === 'geometry') {
      sanitizedDefault = `'${JSON.stringify(column.default)}'`
    } else if (typeof column.default === 'string') {
      sanitizedDefault = JSON.stringify(column.default)
    } else if (column.type === 'numeric') {
      sanitizedDefault = `'${column.default}'`
    }

    code = `${code}.default(${sanitizedDefault})`
  }

  if (column.reference) {
    let callback = `()`

    if (column.reference.table === tableKey) {
      addImport(`${adapter.packageName}/drizzle/sqlite-core`, 'type AnySQLiteColumn')
      callback = `${callback}: AnySQLiteColumn`
    }

    callback = `${callback} => ${column.reference.table}.${column.reference.name}`

    code = `${code}.references(${callback}, {
      ${column.reference.onDelete ? `onDelete: '${column.reference.onDelete}'` : ''}
  })`
  }

  return code
}
