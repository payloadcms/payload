import { parseModule } from 'esprima'
import fs from 'fs'
import globby from 'globby'
import path from 'path'

export const withPayloadImportStatement = `import { withPayload } from '@payloadcms/next/withPayload'\n`

export const wrapNextConfig = async (args: { projectDir: string }): Promise<void> => {
  const foundConfig = (await globby('next.config.*js', { cwd: args.projectDir }))?.[0]

  if (!foundConfig) {
    throw new Error(`No Next config found at ${args.projectDir}`)
  }
  const configPath = path.resolve(args.projectDir, foundConfig)
  const configContent = fs.readFileSync(configPath, 'utf8')
  const { error, modifiedConfigContent: newConfig } = parseAndInsertWithPayload(configContent)
  if (error) {
    console.warn(error)
  }
  fs.writeFileSync(configPath, newConfig)
}

export function parseAndInsertWithPayload(content: string): {
  error?: string
  modifiedConfigContent: string
} {
  content = withPayloadImportStatement + content
  const ast = parseModule(content, { loc: true })
  const exportDefaultDeclaration = ast.body.find((p) => p.type === 'ExportDefaultDeclaration') as
    | Directive
    | undefined

  const exportNamedDeclaration = ast.body.find((p) => p.type === 'ExportNamedDeclaration') as
    | ExportNamedDeclaration
    | undefined

  if (!exportDefaultDeclaration && !exportNamedDeclaration) {
    throw new Error('Could not find ExportDefaultDeclaration in next.config.js')
  }

  if (exportDefaultDeclaration) {
    const modifiedConfigContent = insertBeforeAndAfter(
      content,
      exportDefaultDeclaration.declaration?.loc,
    )
    return { modifiedConfigContent }
  } else if (exportNamedDeclaration) {
    const exportSpecifier = exportNamedDeclaration.specifiers.find(
      (s) =>
        s.type === 'ExportSpecifier' &&
        s.exported?.name === 'default' &&
        s.local?.type === 'Identifier' &&
        s.local?.name,
    )

    if (exportSpecifier) {
      // TODO: Improve with this example and/or link to docs
      return {
        error: `Automatic wrapping of named exports as default not supported yet.
  Please manually wrap your Next config with the withPayload function`,
        modifiedConfigContent: content,
      }
    }
  } else {
    throw new Error('Could not automatically wrap next.config.js with withPayload')
  }
}

type Directive = {
  declaration?: {
    loc: Loc
  }
}

type ExportNamedDeclaration = {
  declaration: null
  loc: Loc
  specifiers: {
    exported: {
      loc: Loc
      name: string
      type: string
    }
    loc: Loc
    local: {
      loc: Loc
      name: string
      type: string
    }
    type: string
  }[]
  type: string
}

type Loc = {
  end: { column: number; line: number }
  start: { column: number; line: number }
}

function insertBeforeAndAfter(content: string, loc: Loc) {
  const { end, start } = loc
  const lines = content.split('\n')

  const insert = (line: string, column: number, text: string) => {
    return line.slice(0, column) + text + line.slice(column)
  }

  // insert ) after end
  lines[end.line - 1] = insert(lines[end.line - 1], end.column, ')')
  // insert withPayload before start
  if (start.line === end.line) {
    lines[end.line - 1] = insert(lines[end.line - 1], start.column, 'withPayload(')
  } else {
    lines[start.line - 1] = insert(lines[start.line - 1], start.column, 'withPayload(')
  }

  return lines.join('\n')
}
