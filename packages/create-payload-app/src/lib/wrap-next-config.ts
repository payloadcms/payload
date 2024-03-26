import { parseModule } from 'esprima'
import fs from 'fs'
import globby from 'globby'
import path from 'path'

export const wrapNextConfig = async (args: { projectDir: string }): Promise<void> => {
  const foundConfig = (await globby('next.config.*js', { cwd: args.projectDir }))?.[0]

  if (!foundConfig) {
    throw new Error(`No next.config.js found at ${args.projectDir}`)
  }
  const configPath = path.resolve(args.projectDir, foundConfig)
  const configContent = fs.readFileSync(configPath, 'utf8')
  const newConfig = parseAndInsertWithPayload(configContent)
  fs.writeFileSync(configPath, newConfig)
}

export function parseAndInsertWithPayload(content: string) {
  const ast = parseModule(content, { loc: true })
  const statement = ast.body.find((p) => p.type === 'ExportDefaultDeclaration') as
    | Directive
    | undefined

  if (!statement) {
    throw new Error('Could not find ExportDefaultDeclaration in next.config.js')
  }

  return insertBeforeAndAfter(content, statement.declaration?.loc)
}

type Directive = {
  declaration?: {
    loc: Loc
  }
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
