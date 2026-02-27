import type tslib from 'typescript/lib/tsserverlibrary'

import type { PayloadComponentContext } from './helpers.js'

import { findNodeAtPosition, getPayloadComponentContext } from './helpers.js'

function init(modules: { typescript: typeof tslib }) {
  const ts = modules.typescript

  function create(info: tslib.server.PluginCreateInfo): tslib.LanguageService {
    const log = (msg: string) =>
      info.project.projectService.logger.info(`[@payloadcms/typescript-plugin] ${msg}`)

    log('Plugin initializing')

    const baseDirConfig: string | undefined = info.config?.baseDir
    const baseDirCache = new Map<string, string | undefined>()
    const sys = info.serverHost || ts.sys

    const proxy: tslib.LanguageService = Object.create(null)

    for (const k of Object.keys(info.languageService) as Array<keyof tslib.LanguageService>) {
      const x = info.languageService[k]!
      // @ts-expect-error - decorator pattern for language service proxy
      proxy[k] = (...args: Array<{}>) => x.apply(info.languageService, args)
    }

    function getBaseDir(fileName: string): string | undefined {
      if (baseDirConfig) {
        const projectDir = info.project.getCurrentDirectory()
        return ts.sys.resolvePath(projectDir + '/' + baseDirConfig)
      }

      const cached = baseDirCache.get(fileName)
      if (cached !== undefined) {
        return cached
      }

      const detected = findPayloadConfigDir(sys, fileName)
      baseDirCache.set(fileName, detected)

      if (detected) {
        log(`Detected baseDir: ${detected} (from payload config near ${fileName})`)
      }

      return detected
    }

    proxy.getSemanticDiagnostics = (fileName) => {
      const prior = info.languageService.getSemanticDiagnostics(fileName)

      const program = info.languageService.getProgram()
      if (!program) {
        return prior
      }

      const sourceFile = program.getSourceFile(fileName)
      if (!sourceFile) {
        return prior
      }

      const checker = program.getTypeChecker()
      const baseDir = getBaseDir(fileName)
      const additional = getPayloadDiagnostics(ts, sourceFile, checker, program, baseDir)

      return [...prior, ...additional]
    }

    proxy.getCompletionsAtPosition = (fileName, position, options, formattingSettings) => {
      const program = info.languageService.getProgram()
      if (program) {
        const sourceFile = program.getSourceFile(fileName)
        if (sourceFile) {
          const checker = program.getTypeChecker()
          const node = findNodeAtPosition(sourceFile, position)

          if (node && ts.isStringLiteral(node)) {
            const baseDir = getBaseDir(fileName)
            const result = getPayloadCompletions(ts, node, position, checker, program, baseDir, sys)
            if (result) {
              return result
            }
          }
        }
      }

      return info.languageService.getCompletionsAtPosition(
        fileName,
        position,
        options,
        formattingSettings,
      )
    }

    proxy.getDefinitionAndBoundSpan = (fileName, position) => {
      const program = info.languageService.getProgram()
      if (program) {
        const sourceFile = program.getSourceFile(fileName)
        if (sourceFile) {
          const checker = program.getTypeChecker()
          const node = findNodeAtPosition(sourceFile, position)

          if (node && ts.isStringLiteral(node)) {
            const baseDir = getBaseDir(fileName)
            const result = getPayloadDefinition(ts, node, checker, program, baseDir)
            if (result) {
              return result
            }
          }
        }
      }

      return info.languageService.getDefinitionAndBoundSpan(fileName, position)
    }

    log('Plugin initialized successfully')
    return proxy
  }

  return { create }
}

// -------------------------------------------------------------------
// Shared utilities
// -------------------------------------------------------------------

function parsePayloadComponentString(value: string): { exportName: string; path: string } {
  if (value.includes('#')) {
    const [path, exportName] = value.split('#', 2) as [string, string]
    return { exportName: exportName || 'default', path }
  }

  return { exportName: 'default', path: value }
}

/**
 * Extracts the module path and export name from any PayloadComponent context,
 * accounting for `#export` syntax and sibling `exportName`/`path` properties.
 */
function resolveComponentRef(
  context: PayloadComponentContext,
  nodeText: string,
): { exportName: string; path: string } | undefined {
  if (context.type === 'string' || context.type === 'path') {
    const parsed = parsePayloadComponentString(nodeText)
    if (context.type === 'path' && context.exportNameValue) {
      parsed.exportName = context.exportNameValue
    }
    return parsed
  }

  if (context.type === 'exportName' && context.pathValue) {
    const { path } = parsePayloadComponentString(context.pathValue)
    return { exportName: nodeText, path }
  }

  return undefined
}

function resolveModulePath(
  ts: typeof tslib,
  modulePath: string,
  containingFile: string,
  program: tslib.Program,
  baseDir: string | undefined,
): tslib.ResolvedModuleFull | undefined {
  const compilerOptions = program.getCompilerOptions()

  let pathToResolve = modulePath
  let resolveFrom = containingFile

  // Payload convention: '/' and './' paths are relative to baseDir.
  // Resolve from a synthetic file inside baseDir so TypeScript uses it as the base.
  if (modulePath.startsWith('/') || modulePath.startsWith('./')) {
    if (baseDir) {
      resolveFrom = baseDir + '/_.ts'
    }

    if (modulePath.startsWith('/')) {
      pathToResolve = '.' + modulePath
    }
  }

  // Delegate entirely to TypeScript's module resolution -- respects the project's
  // moduleResolution, paths, allowImportingTsExtensions, etc.
  const result = ts.resolveModuleName(pathToResolve, resolveFrom, compilerOptions, ts.sys)
  return result.resolvedModule
}

function getModuleExports(
  resolvedModule: tslib.ResolvedModuleFull,
  program: tslib.Program,
): string[] {
  const sourceFile = program.getSourceFile(resolvedModule.resolvedFileName)
  if (!sourceFile) {
    return []
  }

  const checker = program.getTypeChecker()
  const moduleSymbol = checker.getSymbolAtLocation(sourceFile)
  if (!moduleSymbol) {
    return []
  }

  return checker.getExportsOfModule(moduleSymbol).map((e) => e.name)
}

// -------------------------------------------------------------------
// Diagnostics
// -------------------------------------------------------------------

function getPayloadDiagnostics(
  ts: typeof tslib,
  sourceFile: tslib.SourceFile,
  checker: tslib.TypeChecker,
  program: tslib.Program,
  baseDir: string | undefined,
): tslib.Diagnostic[] {
  const diagnostics: tslib.Diagnostic[] = []

  function visit(node: tslib.Node) {
    if (ts.isStringLiteral(node) && node.text.length > 0) {
      const context = getPayloadComponentContext(ts, node, checker)
      if (!context) {
        ts.forEachChild(node, visit)
        return
      }

      const ref = resolveComponentRef(context, node.text)
      if (!ref?.path) {
        ts.forEachChild(node, visit)
        return
      }

      const { exportName, path: modulePath } = ref

      const resolved = resolveModulePath(ts, modulePath, sourceFile.fileName, program, baseDir)

      if (!resolved) {
        diagnostics.push({
          category: ts.DiagnosticCategory.Error,
          code: 71001,
          file: sourceFile,
          length: node.text.length,
          messageText: `Cannot find module '${modulePath}'. Ensure the file exists and the path is correct.`,
          start: node.getStart() + 1,
        })
      } else {
        const exports = getModuleExports(resolved, program)
        if (!exports.includes(exportName)) {
          let message = `Module '${modulePath}' has no exported member '${exportName}'.`

          const suggestion = findClosestMatch(exportName, exports)
          if (suggestion) {
            message += ` Did you mean '${suggestion}'?`
          }

          if (exports.length > 0) {
            message += ` Available exports: ${exports.join(', ')}.`
          }

          diagnostics.push({
            category: ts.DiagnosticCategory.Error,
            code: 71002,
            file: sourceFile,
            length: node.text.length,
            messageText: message,
            start: node.getStart() + 1,
          })
        }
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return diagnostics
}

// -------------------------------------------------------------------
// Completions
// -------------------------------------------------------------------

function getPayloadCompletions(
  ts: typeof tslib,
  node: tslib.StringLiteral,
  position: number,
  checker: tslib.TypeChecker,
  program: tslib.Program,
  baseDir: string | undefined,
  sys: tslib.System,
): tslib.CompletionInfo | undefined {
  const context = getPayloadComponentContext(ts, node, checker)
  if (!context) {
    return undefined
  }

  if (context.type === 'exportName') {
    const ref = resolveComponentRef(context, node.text)
    if (!ref) {
      return undefined
    }
    return buildExportCompletions(ts, node, ref.path, node.text.length, program, baseDir)
  }

  // Both 'string' and 'path' contexts: check if cursor is after #
  const text = node.text
  const offsetInString = position - node.getStart() - 1
  const hashIndex = text.indexOf('#')

  if (hashIndex !== -1 && offsetInString > hashIndex) {
    const modulePath = text.substring(0, hashIndex)
    return buildExportCompletions(
      ts,
      node,
      modulePath,
      text.length - hashIndex - 1,
      program,
      baseDir,
      node.getStart() + 1 + hashIndex + 1,
    )
  }

  return getPathCompletions(sys, node, position, baseDir)
}

function buildExportCompletions(
  ts: typeof tslib,
  node: tslib.StringLiteral,
  modulePath: string,
  replacementLength: number,
  program: tslib.Program,
  baseDir: string | undefined,
  replacementStart?: number,
): tslib.CompletionInfo | undefined {
  const resolved = resolveModulePath(
    ts,
    modulePath,
    node.getSourceFile().fileName,
    program,
    baseDir,
  )
  if (!resolved) {
    return undefined
  }

  const exports = getModuleExports(resolved, program)

  return {
    entries: exports.map((name) => ({
      name,
      kind: ts.ScriptElementKind.constElement,
      replacementSpan: {
        length: replacementLength,
        start: replacementStart ?? node.getStart() + 1,
      },
      sortText: name,
    })),
    isGlobalCompletion: false,
    isMemberCompletion: true,
    isNewIdentifierLocation: false,
  }
}

const COMPONENT_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js']

function getPathCompletions(
  sys: tslib.System,
  node: tslib.StringLiteral,
  position: number,
  baseDir: string | undefined,
): tslib.CompletionInfo | undefined {
  if (!baseDir) {
    return undefined
  }

  const text = node.text
  const offsetInString = position - node.getStart() - 1
  const hashIndex = text.indexOf('#')

  const endOffset = hashIndex !== -1 ? Math.min(offsetInString, hashIndex) : offsetInString
  const pathPortion = text.substring(0, endOffset)
  const lastSlash = pathPortion.lastIndexOf('/')

  let dirPath: string
  let prefix: string
  let replacementStart: number

  if (lastSlash === -1) {
    dirPath = baseDir
    prefix = pathPortion
    replacementStart = node.getStart() + 1
  } else {
    const dirPortion = pathPortion.substring(0, lastSlash)
    prefix = pathPortion.substring(lastSlash + 1)
    replacementStart = node.getStart() + 1 + lastSlash + 1

    if (dirPortion.startsWith('/')) {
      dirPath = baseDir + dirPortion
    } else if (dirPortion.startsWith('./')) {
      dirPath = baseDir + '/' + dirPortion.substring(2)
    } else {
      dirPath = baseDir + '/' + dirPortion
    }
  }

  if (!sys.directoryExists(dirPath)) {
    return undefined
  }

  const entries: tslib.CompletionEntry[] = []
  const prefixLower = prefix.toLowerCase()

  for (const dir of sys.getDirectories(dirPath)) {
    if (dir.startsWith('.') || dir === 'node_modules') {
      continue
    }
    if (prefix && !dir.toLowerCase().startsWith(prefixLower)) {
      continue
    }
    entries.push({
      name: dir,
      kind: 'directory' as tslib.ScriptElementKind,
      replacementSpan: { length: prefix.length, start: replacementStart },
      sortText: '0' + dir,
    })
  }

  const files = sys.readDirectory(dirPath, COMPONENT_EXTENSIONS, undefined, undefined, 1)
  for (const file of files) {
    const fileName = file.substring(file.lastIndexOf('/') + 1)
    const nameWithoutExt = fileName.replace(/\.(?:tsx?|jsx?)$/, '')

    if (prefix && !fileName.toLowerCase().startsWith(prefixLower)) {
      continue
    }

    entries.push({
      name: fileName,
      kind: 'script' as tslib.ScriptElementKind,
      replacementSpan: { length: prefix.length, start: replacementStart },
      sortText: '1' + fileName,
    })

    if (nameWithoutExt !== fileName) {
      entries.push({
        name: nameWithoutExt,
        kind: 'script' as tslib.ScriptElementKind,
        replacementSpan: { length: prefix.length, start: replacementStart },
        sortText: '1' + nameWithoutExt,
      })
    }
  }

  if (entries.length === 0) {
    return undefined
  }

  return {
    entries,
    isGlobalCompletion: false,
    isMemberCompletion: false,
    isNewIdentifierLocation: true,
  }
}

// -------------------------------------------------------------------
// Go-to-definition
// -------------------------------------------------------------------

function getPayloadDefinition(
  ts: typeof tslib,
  node: tslib.StringLiteral,
  checker: tslib.TypeChecker,
  program: tslib.Program,
  baseDir: string | undefined,
): tslib.DefinitionInfoAndBoundSpan | undefined {
  const context = getPayloadComponentContext(ts, node, checker)
  if (!context) {
    return undefined
  }

  const ref = resolveComponentRef(context, node.text)
  if (!ref?.path) {
    return undefined
  }

  const { exportName, path: modulePath } = ref

  const resolved = resolveModulePath(
    ts,
    modulePath,
    node.getSourceFile().fileName,
    program,
    baseDir,
  )
  if (!resolved) {
    return undefined
  }

  const targetSourceFile = program.getSourceFile(resolved.resolvedFileName)
  if (!targetSourceFile) {
    return undefined
  }

  const textSpan: tslib.TextSpan = {
    length: node.text.length,
    start: node.getStart() + 1,
  }

  const moduleSymbol = checker.getSymbolAtLocation(targetSourceFile)
  if (moduleSymbol) {
    const moduleExports = checker.getExportsOfModule(moduleSymbol)
    const targetExport = moduleExports.find((e) => e.name === exportName)

    if (targetExport) {
      const declarations = targetExport.getDeclarations()
      if (declarations && declarations.length > 0) {
        const decl = declarations[0]!
        const declSourceFile = decl.getSourceFile()

        return {
          definitions: [
            {
              name: exportName,
              containerKind: ts.ScriptElementKind.moduleElement,
              containerName: modulePath,
              contextSpan: { length: decl.getWidth(), start: decl.getStart() },
              fileName: declSourceFile.fileName,
              kind: ts.ScriptElementKind.alias,
              textSpan: { length: decl.getWidth(), start: decl.getStart() },
            },
          ],
          textSpan,
        }
      }
    }
  }

  return {
    definitions: [
      {
        name: modulePath,
        containerKind: ts.ScriptElementKind.unknown,
        containerName: '',
        fileName: resolved.resolvedFileName,
        kind: ts.ScriptElementKind.moduleElement,
        textSpan: { length: 0, start: 0 },
      },
    ],
    textSpan,
  }
}

// -------------------------------------------------------------------
// baseDir detection
// -------------------------------------------------------------------

const PAYLOAD_CONFIG_NAMES = ['payload.config.ts', 'payload.config.js', 'config.ts']

function findPayloadConfigDir(sys: tslib.System, fromFile: string): string | undefined {
  let dir = fromFile.includes('/') ? fromFile.substring(0, fromFile.lastIndexOf('/')) : fromFile
  const root = dir.startsWith('/') ? '/' : ''

  for (let i = 0; i < 50; i++) {
    for (const name of PAYLOAD_CONFIG_NAMES) {
      if (sys.fileExists(dir + '/' + name)) {
        return dir
      }
    }

    const parent = dir.substring(0, dir.lastIndexOf('/')) || root
    if (parent === dir) {
      break
    }
    dir = parent
  }

  return undefined
}

// -------------------------------------------------------------------
// String matching
// -------------------------------------------------------------------

function findClosestMatch(target: string, candidates: string[]): string | undefined {
  if (candidates.length === 0) {
    return undefined
  }

  const targetLower = target.toLowerCase()
  let bestMatch: string | undefined
  let bestDistance = Infinity

  for (const candidate of candidates) {
    const distance = levenshteinDistance(targetLower, candidate.toLowerCase())
    if (distance < bestDistance && distance <= Math.max(target.length, candidate.length) * 0.5) {
      bestDistance = distance
      bestMatch = candidate
    }
  }

  return bestMatch
}

function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) {
    return b.length
  }
  if (b.length === 0) {
    return a.length
  }

  let prev = Array.from({ length: a.length + 1 }, (_, i) => i)

  for (let i = 1; i <= b.length; i++) {
    const curr = [i]
    for (let j = 1; j <= a.length; j++) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1
      curr[j] = Math.min(prev[j]! + 1, curr[j - 1]! + 1, prev[j - 1]! + cost)
    }
    prev = curr
  }

  return prev[a.length]!
}

export = init
