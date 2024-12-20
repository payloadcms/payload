import type { GenerateSchema } from 'payload'

import { existsSync } from 'fs'
import { writeFile } from 'fs/promises'
import path from 'path'

import type { ColumnToCodeConverter, DrizzleAdapter } from '../types.js'

/**
 * @example
 * console.log(sanitizeObjectKey("oneTwo"));   // oneTwo
 * console.log(sanitizeObjectKey("one-two"));  // 'one-two'
 * console.log(sanitizeObjectKey("_one$Two3")); // _one$Two3
 * console.log(sanitizeObjectKey("3invalid")); // '3invalid'
 */
const sanitizeObjectKey = (key: string) => {
  // Regular expression for a valid identifier
  const identifierRegex = /^[a-z_$][\w$]*$/i
  if (identifierRegex.test(key)) {
    return key
  }

  return `'${key}'`
}

/**
 * @example
 * (columns default-valuesID) -> columns['default-valuesID']
 * (columns defaultValues) -> columns.defaultValues
 */
const accessProperty = (objName: string, key: string) => {
  const sanitized = sanitizeObjectKey(key)

  if (sanitized.startsWith("'")) {
    return `${objName}[${sanitized}]`
  }

  return `${objName}.${key}`
}

export const createSchemaGenerator = ({
  columnToCodeConverter,
  corePackageSuffix,
  defaultOutputFile,
  enumImport,
  schemaImport,
  tableImport,
}: {
  columnToCodeConverter: ColumnToCodeConverter
  corePackageSuffix: string
  defaultOutputFile?: string
  enumImport?: string
  schemaImport?: string
  tableImport: string
}): GenerateSchema => {
  return async function generateSchema(
    this: DrizzleAdapter,
    { log = true, outputFile = defaultOutputFile, prettify = true } = {},
  ) {
    const importDeclarations: Record<string, Set<string>> = {}

    const tableDeclarations: string[] = []
    const enumDeclarations: string[] = []
    const relationsDeclarations: string[] = []

    const addImport = (from: string, name: string) => {
      if (!importDeclarations[from]) {
        importDeclarations[from] = new Set()
      }

      importDeclarations[from].add(name)
    }

    const corePackage = `${this.packageName}/drizzle/${corePackageSuffix}`

    let schemaDeclaration: null | string = null

    if (this.schemaName) {
      addImport(corePackage, schemaImport)
      schemaDeclaration = `export const db_schema = ${schemaImport}('${this.schemaName}')`
    }

    const enumFn = this.schemaName ? `db_schema.enum` : enumImport

    const enumsList: string[] = []
    const addEnum = (name: string, options: string[]) => {
      if (enumsList.some((each) => each === name)) {
        return
      }
      enumsList.push(name)
      enumDeclarations.push(
        `export const ${name} = ${enumFn}('${name}', [${options.map((option) => `'${option}'`).join(', ')}])`,
      )
    }

    if (this.payload.config.localization && enumImport) {
      addEnum('enum__locales', this.payload.config.localization.localeCodes)
    }

    const tableFn = this.schemaName ? `db_schema.table` : tableImport

    if (!this.schemaName) {
      addImport(corePackage, tableImport)
    }

    addImport(corePackage, 'index')
    addImport(corePackage, 'uniqueIndex')
    addImport(corePackage, 'foreignKey')

    addImport(`${this.packageName}/drizzle`, 'sql')
    addImport(`${this.packageName}/drizzle`, 'relations')

    for (const tableName in this.rawTables) {
      const table = this.rawTables[tableName]

      const extrasDeclarations: string[] = []

      if (table.indexes) {
        for (const key in table.indexes) {
          const index = table.indexes[key]
          let indexDeclaration = `${sanitizeObjectKey(key)}: ${index.unique ? 'uniqueIndex' : 'index'}('${index.name}')`
          indexDeclaration += `.on(${typeof index.on === 'string' ? `${accessProperty('columns', index.on)}` : `${index.on.map((on) => `${accessProperty('columns', on)}`).join(', ')}`}),`
          extrasDeclarations.push(indexDeclaration)
        }
      }

      if (table.foreignKeys) {
        for (const key in table.foreignKeys) {
          const foreignKey = table.foreignKeys[key]

          let foreignKeyDeclaration = `${sanitizeObjectKey(key)}: foreignKey({
      columns: [${foreignKey.columns.map((col) => `columns['${col}']`).join(', ')}],
      foreignColumns: [${foreignKey.foreignColumns.map((col) => `${accessProperty(col.table, col.name)}`).join(', ')}],
      name: '${foreignKey.name}' 
    })`

          if (foreignKey.onDelete) {
            foreignKeyDeclaration += `.onDelete('${foreignKey.onDelete}')`
          }
          if (foreignKey.onUpdate) {
            foreignKeyDeclaration += `.onUpdate('${foreignKey.onDelete}')`
          }

          foreignKeyDeclaration += ','

          extrasDeclarations.push(foreignKeyDeclaration)
        }
      }

      const tableCode = `
export const ${tableName} = ${tableFn}('${tableName}', {
${Object.entries(table.columns)
  .map(
    ([key, column]) =>
      `  ${sanitizeObjectKey(key)}: ${columnToCodeConverter({
        adapter: this,
        addEnum,
        addImport,
        column,
        locales: this.payload.config.localization
          ? this.payload.config.localization.localeCodes
          : undefined,
        tableKey: tableName,
      })},`,
  )
  .join('\n')}
}${
        extrasDeclarations.length
          ? `, (columns) => ({
    ${extrasDeclarations.join('\n    ')}  
  })`
          : ''
      }
) 
`

      tableDeclarations.push(tableCode)
    }

    for (const tableName in this.rawRelations) {
      const relations = this.rawRelations[tableName]
      const properties: string[] = []

      for (const key in relations) {
        const relation = relations[key]
        let declaration: string

        if (relation.type === 'one') {
          declaration = `${sanitizeObjectKey(key)}: one(${relation.to}, {
    ${relation.fields.some((field) => field.table !== tableName) ? '// @ts-expect-error Drizzle TypeScript bug for ONE relationships with a field in different table' : ''}
    fields: [${relation.fields.map((field) => `${accessProperty(field.table, field.name)}`).join(', ')}],
    references: [${relation.references.map((col) => `${accessProperty(relation.to, col)}`).join(', ')}],
    ${relation.relationName ? `relationName: '${relation.relationName}',` : ''}
    }),`
        } else {
          declaration = `${sanitizeObjectKey(key)}: many(${relation.to}, {
            ${relation.relationName ? `relationName: '${relation.relationName}',` : ''}
    }),`
        }

        properties.push(declaration)
      }

      // beautify / lintify relations callback output, when no many for example, don't add it
      const args = []

      if (Object.values(relations).some((rel) => rel.type === 'one')) {
        args.push('one')
      }

      if (Object.values(relations).some((rel) => rel.type === 'many')) {
        args.push('many')
      }

      const arg = args.length ? `{ ${args.join(', ')} }` : ''

      const declaration = `export const relations_${tableName} = relations(${tableName}, (${arg}) => ({
  ${properties.join('\n    ')}
      }))`

      relationsDeclarations.push(declaration)
    }

    if (enumDeclarations.length && !this.schemaName) {
      addImport(corePackage, enumImport)
    }

    const importDeclarationsSanitized: string[] = []

    for (const moduleName in importDeclarations) {
      const moduleImports = importDeclarations[moduleName]

      importDeclarationsSanitized.push(
        `import { ${Array.from(moduleImports).join(', ')} } from '${moduleName}'`,
      )
    }

    const schemaType = `
type DatabaseSchema = {
  ${[
    this.schemaName ? 'db_schema' : null,
    ...enumsList,
    ...Object.keys(this.rawTables),
    ...Object.keys(this.rawRelations).map((table) => `relations_${table}`),
  ]
    .filter(Boolean)
    .map((name) => `${name}: typeof ${name}`)
    .join('\n  ')}
}
    `

    const finalDeclaration = `
declare module '${this.packageName}/types' {
  export interface GeneratedDatabaseSchema {
    schema: DatabaseSchema
  }
}
    `

    const warning = `
/* tslint:disable */
/* eslint-disable */
/**
 * This file was automatically generated by Payload.
 * DO NOT MODIFY IT BY HAND. Instead, modify your source Payload config,
 * and re-run \`payload generate:db-schema\` to regenerate this file.
 */
`

    let code = [
      warning,
      ...importDeclarationsSanitized,
      schemaDeclaration,
      ...enumDeclarations,
      ...tableDeclarations,
      ...relationsDeclarations,
      schemaType,
      finalDeclaration,
    ]
      .filter(Boolean)
      .join('\n')

    if (!outputFile) {
      const cwd = process.cwd()
      const srcDir = path.resolve(cwd, 'src')

      if (existsSync(srcDir)) {
        outputFile = path.resolve(srcDir, 'payload-generated-schema.ts')
      } else {
        outputFile = path.resolve(cwd, 'payload-generated-schema.ts')
      }
    }

    if (prettify) {
      try {
        const prettier = await import('prettier')
        const configPath = await prettier.resolveConfigFile()
        const config = configPath ? await prettier.resolveConfig(configPath) : {}
        code = await prettier.format(code, { ...config, parser: 'typescript' })
        // eslint-disable-next-line no-empty
      } catch {}
    }

    await writeFile(outputFile, code, 'utf-8')

    if (log) {
      this.payload.logger.info(`Written ${outputFile}`)
    }
  }
}
