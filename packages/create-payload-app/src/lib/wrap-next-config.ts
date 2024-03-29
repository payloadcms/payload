import chalk from 'chalk'
import { parseModule } from 'esprima'
import fs from 'fs'

import { warning } from '../utils/log.js'

export const withPayloadImportStatement = `import { withPayload } from '@payloadcms/next'\n`

export const wrapNextConfig = (args: { nextConfigPath: string }) => {
  const { nextConfigPath } = args
  const configContent = fs.readFileSync(nextConfigPath, 'utf8')
  const { modifiedConfigContent: newConfig, success } = parseAndModifyConfigContent(configContent)

  if (!success) {
    return
  }

  fs.writeFileSync(nextConfigPath, newConfig)
}

/**
 * Parses config content with AST and wraps it with withPayload function
 */
export function parseAndModifyConfigContent(content: string): {
  modifiedConfigContent: string
  success: boolean
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
    return { modifiedConfigContent, success: true }
  } else if (exportNamedDeclaration) {
    const exportSpecifier = exportNamedDeclaration.specifiers.find(
      (s) =>
        s.type === 'ExportSpecifier' &&
        s.exported?.name === 'default' &&
        s.local?.type === 'Identifier' &&
        s.local?.name,
    )

    if (exportSpecifier) {
      warning('Could not automatically wrap next.config.js with withPayload.')
      warning('Automatic wrapping of named exports as default not supported yet.')

      warnUserWrapNotSuccessful()
      return {
        modifiedConfigContent: content,
        success: false,
      }
    }
  } else {
    warning('Could not automatically wrap next.config.js with withPayload.')
    warnUserWrapNotSuccessful()
    return {
      modifiedConfigContent: content,
      success: false,
    }
  }
}

function warnUserWrapNotSuccessful() {
  // Output directions for user to update next.config.js
  const withPayloadMessage = `

  ${chalk.bold(`Please manually wrap your existing next.config.js with the withPayload function. Here is an example:`)}

  import withPayload from '@payloadcms/next/withPayload'

  const nextConfig = {
    // Your Next.js config here
  }

  export default withPayload(nextConfig)

`

  console.log(withPayloadMessage)
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
