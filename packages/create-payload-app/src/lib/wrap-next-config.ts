import type { Program } from 'esprima-next'

import chalk from 'chalk'
import { Syntax, parseModule } from 'esprima-next'
import fs from 'fs'

import { log, warning } from '../utils/log.js'

export const withPayloadStatement = {
  cjs: `const { withPayload } = require('@payloadcms/next/withPayload')\n`,
  esm: `import { withPayload } from '@payloadcms/next/withPayload'\n`,
}

type NextConfigType = 'cjs' | 'esm'

export const wrapNextConfig = (args: {
  nextConfigPath: string
  nextConfigType: NextConfigType
}) => {
  const { nextConfigPath, nextConfigType: configType } = args
  const configContent = fs.readFileSync(nextConfigPath, 'utf8')
  const { modifiedConfigContent: newConfig, success } = parseAndModifyConfigContent(
    configContent,
    configType,
  )

  if (!success) {
    return
  }

  fs.writeFileSync(nextConfigPath, newConfig)
}

/**
 * Parses config content with AST and wraps it with withPayload function
 */
export function parseAndModifyConfigContent(
  content: string,
  configType: NextConfigType,
): { modifiedConfigContent: string; success: boolean } {
  content = withPayloadStatement[configType] + content

  let ast: Program | undefined
  try {
    ast = parseModule(content, { loc: true })
  } catch (error: unknown) {
    if (error instanceof Error) {
      warning(`Unable to parse Next config. Error: ${error.message} `)
      warnUserWrapNotSuccessful(configType)
    }
    return {
      modifiedConfigContent: content,
      success: false,
    }
  }

  if (configType === 'esm') {
    const exportDefaultDeclaration = ast.body.find(
      (p) => p.type === Syntax.ExportDefaultDeclaration,
    ) as Directive | undefined

    const exportNamedDeclaration = ast.body.find(
      (p) => p.type === Syntax.ExportNamedDeclaration,
    ) as ExportNamedDeclaration | undefined

    if (!exportDefaultDeclaration && !exportNamedDeclaration) {
      throw new Error('Could not find ExportDefaultDeclaration in next.config.js')
    }

    if (exportDefaultDeclaration && exportDefaultDeclaration.declaration?.loc) {
      const modifiedConfigContent = insertBeforeAndAfter(
        content,
        exportDefaultDeclaration.declaration.loc,
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

        warnUserWrapNotSuccessful(configType)
        return {
          modifiedConfigContent: content,
          success: false,
        }
      }
    }

    warning('Could not automatically wrap Next config with withPayload.')
    warnUserWrapNotSuccessful(configType)
    return {
      modifiedConfigContent: content,
      success: false,
    }
  } else if (configType === 'cjs') {
    // Find `module.exports = X`
    const moduleExports = ast.body.find(
      (p) =>
        p.type === Syntax.ExpressionStatement &&
        p.expression?.type === Syntax.AssignmentExpression &&
        p.expression.left?.type === Syntax.MemberExpression &&
        p.expression.left.object?.type === Syntax.Identifier &&
        p.expression.left.object.name === 'module' &&
        p.expression.left.property?.type === Syntax.Identifier &&
        p.expression.left.property.name === 'exports',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any

    if (moduleExports && moduleExports.expression.right?.loc) {
      const modifiedConfigContent = insertBeforeAndAfter(
        content,
        moduleExports.expression.right.loc,
      )
      return { modifiedConfigContent, success: true }
    }

    return {
      modifiedConfigContent: content,
      success: false,
    }
  }

  warning('Could not automatically wrap Next config with withPayload.')
  warnUserWrapNotSuccessful(configType)
  return {
    modifiedConfigContent: content,
    success: false,
  }
}

function warnUserWrapNotSuccessful(configType: NextConfigType) {
  // Output directions for user to update next.config.js
  const withPayloadMessage = `

  ${chalk.bold(`Please manually wrap your existing next.config.js with the withPayload function. Here is an example:`)}

  ${withPayloadStatement[configType]}

  const nextConfig = {
    // Your Next.js config here
  }

  ${configType === 'esm' ? 'export default withPayload(nextConfig)' : 'module.exports = withPayload(nextConfig)'}

`

  log(withPayloadMessage)
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
