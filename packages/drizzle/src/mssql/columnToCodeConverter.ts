import type { ColumnToCodeConverter } from '../types.js'

export const columnToCodeConverter: ColumnToCodeConverter = ({
  adapter,
  addImport,
  circularEdges,
  column,
  locales,
  tableKey,
}) => {
  let columnBuilderFn: string = column.type

  const columnBuilderArgsArray: string[] = []

  let defaultStatement: null | string = null

  switch (column.type) {
    case 'boolean': {
      columnBuilderFn = 'bit'
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

      columnBuilderFn = 'nvarchar'
      columnBuilderArgsArray.push(`enum: [${options.map((locale) => `'${locale}'`).join(', ')}]`)
      columnBuilderArgsArray.push('length: 450')

      break
    }

    case 'geometry':
    case 'jsonb': {
      columnBuilderFn = 'nvarchar'
      columnBuilderArgsArray.push("length: 'max'", "mode: 'json'")
      break
    }

    case 'numeric': {
      columnBuilderFn = 'float'
      break
    }

    case 'serial': {
      columnBuilderFn = 'int'
      break
    }

    case 'timestamp': {
      columnBuilderFn = 'datetime2'
      columnBuilderArgsArray.push("mode: 'string'")
      defaultStatement = `default(sql\`sysutcdatetime()\`)`
      break
    }

    case 'uuid': {
      columnBuilderFn = 'nvarchar'
      columnBuilderArgsArray.push('length: 36')

      if (column.defaultRandom) {
        addImport('crypto', 'randomUUID')
        defaultStatement = `$defaultFn(() => randomUUID())`
      }

      if (column.defaultV7) {
        addImport('uuid', 'v7 as uuidv7')
        defaultStatement = `$defaultFn(() => uuidv7())`
      }

      break
    }

    case 'varchar': {
      columnBuilderFn = 'nvarchar'
      columnBuilderArgsArray.push('length: 450')
      break
    }

    default: {
      columnBuilderFn = column.type === 'integer' ? 'int' : column.type
    }
  }

  addImport(`${adapter.packageName}/drizzle/mssql-core`, columnBuilderFn)

  let columnBuilderArgs = ''

  if (columnBuilderArgsArray.length) {
    columnBuilderArgs = `, {${columnBuilderArgsArray.join(',')}}`
  }

  let code = `${columnBuilderFn}('${column.name}'${columnBuilderArgs})`

  if (column.notNull) {
    code = `${code}.notNull()`
  }

  // SQL Server auto-incrementing integer PKs use IDENTITY.
  if (
    column.primaryKey &&
    (column.type === 'serial' || (column.type === 'integer' && column.autoIncrement))
  ) {
    code = `${code}.identity()`
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
      sanitizedDefault = `${column.default}`
    }

    code = `${code}.default(${sanitizedDefault})`
  }

  if (column.reference) {
    let callback = `()`

    if (
      column.reference.table === tableKey ||
      circularEdges?.has(`${tableKey}:${column.reference.table}`)
    ) {
      addImport(`${adapter.packageName}/drizzle/mssql-core`, 'type AnyMsSqlColumn')
      callback = `${callback}: AnyMsSqlColumn`
    }

    callback = `${callback} => ${column.reference.table}.${column.reference.name}`

    code = `${code}.references(${callback}, {
      ${column.reference.onDelete ? `onDelete: '${column.reference.onDelete}'` : ''}
  })`
  }

  return code
}
