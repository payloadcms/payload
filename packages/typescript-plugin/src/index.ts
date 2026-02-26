import type tslib from 'typescript/lib/tsserverlibrary'

import { findNodeAtPosition, getPayloadComponentContext } from './helpers.js'

function init(modules: { typescript: typeof tslib }) {
  const ts = modules.typescript

  function create(info: tslib.server.PluginCreateInfo): tslib.LanguageService {
    const log = (msg: string) =>
      info.project.projectService.logger.info(`[@payloadcms/typescript-plugin] ${msg}`)

    log('Plugin initializing')

    const baseDirConfig: string | undefined = info.config?.baseDir
    const baseDirCache = new Map<string, string | undefined>()

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

      const detected = findPayloadConfigDir(ts, fileName)
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
          const node = findNodeAtPosition(ts, sourceFile, position)

          if (node && ts.isStringLiteral(node)) {
            const baseDir = getBaseDir(fileName)
            const result = getPayloadCompletions(ts, node, position, checker, program, baseDir)
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
          const node = findNodeAtPosition(ts, sourceFile, position)

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

      if (context?.type === 'string') {
        validateFullComponentString(ts, node, sourceFile, checker, program, diagnostics, baseDir)
      } else if (context?.type === 'path') {
        validateModulePath(ts, node, node.text, sourceFile, program, diagnostics, baseDir)
      } else if (context?.type === 'exportName' && context.pathValue) {
        validateExportName(
          ts,
          node,
          context.pathValue,
          node.text,
          sourceFile,
          program,
          diagnostics,
          baseDir,
        )
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return diagnostics
}

function validateFullComponentString(
  ts: typeof tslib,
  node: tslib.StringLiteral,
  sourceFile: tslib.SourceFile,
  _checker: tslib.TypeChecker,
  program: tslib.Program,
  diagnostics: tslib.Diagnostic[],
  baseDir: string | undefined,
) {
  const { exportName, path } = parsePayloadComponentString(node.text)

  if (!path) {
    return
  }

  const resolved = resolveModulePath(ts, path, sourceFile.fileName, program, baseDir)

  if (!resolved) {
    diagnostics.push({
      category: ts.DiagnosticCategory.Error,
      code: 71001,
      file: sourceFile,
      length: node.text.length,
      messageText: `Cannot find module '${path}'. Ensure the file exists and the path is correct.`,
      start: node.getStart() + 1,
    })
    return
  }

  const exports = getModuleExports(ts, resolved, program)

  if (!exports.includes(exportName)) {
    let message = `Module '${path}' has no exported member '${exportName}'.`

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

function validateModulePath(
  ts: typeof tslib,
  node: tslib.StringLiteral,
  path: string,
  sourceFile: tslib.SourceFile,
  program: tslib.Program,
  diagnostics: tslib.Diagnostic[],
  baseDir: string | undefined,
) {
  if (!path) {
    return
  }

  const resolved = resolveModulePath(ts, path, sourceFile.fileName, program, baseDir)

  if (!resolved) {
    diagnostics.push({
      category: ts.DiagnosticCategory.Error,
      code: 71001,
      file: sourceFile,
      length: node.text.length,
      messageText: `Cannot find module '${path}'. Ensure the file exists and the path is correct.`,
      start: node.getStart() + 1,
    })
  }
}

function validateExportName(
  ts: typeof tslib,
  node: tslib.StringLiteral,
  path: string,
  exportName: string,
  sourceFile: tslib.SourceFile,
  program: tslib.Program,
  diagnostics: tslib.Diagnostic[],
  baseDir: string | undefined,
) {
  const resolved = resolveModulePath(ts, path, sourceFile.fileName, program, baseDir)

  if (!resolved) {
    return
  }

  const exports = getModuleExports(ts, resolved, program)

  if (!exports.includes(exportName)) {
    let message = `Module '${path}' has no exported member '${exportName}'.`

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
): tslib.CompletionInfo | undefined {
  const context = getPayloadComponentContext(ts, node, checker)
  if (!context) {
    return undefined
  }

  if (context.type === 'string') {
    return getStringFormCompletions(ts, node, position, program, baseDir)
  }

  if (context.type === 'exportName' && context.pathValue) {
    return getExportNameCompletions(ts, node, context.pathValue, program, baseDir)
  }

  if (context.type === 'path') {
    return getPathCompletions(ts, node, position, baseDir)
  }

  return undefined
}

function getStringFormCompletions(
  ts: typeof tslib,
  node: tslib.StringLiteral,
  position: number,
  program: tslib.Program,
  baseDir: string | undefined,
): tslib.CompletionInfo | undefined {
  const text = node.text
  const offsetInString = position - node.getStart() - 1
  const hashIndex = text.indexOf('#')

  // After #: suggest export names
  if (hashIndex !== -1 && offsetInString > hashIndex) {
    const modulePath = text.substring(0, hashIndex)
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

    const exports = getModuleExports(ts, resolved, program)

    return {
      entries: exports.map((name) => ({
        name,
        kind: ts.ScriptElementKind.constElement,
        replacementSpan: {
          length: text.length - hashIndex - 1,
          start: node.getStart() + 1 + hashIndex + 1,
        },
        sortText: name,
      })),
      isGlobalCompletion: false,
      isMemberCompletion: true,
      isNewIdentifierLocation: false,
    }
  }

  // Before # (or no #): suggest file paths
  return getPathCompletions(ts, node, position, baseDir)
}

function getExportNameCompletions(
  ts: typeof tslib,
  node: tslib.StringLiteral,
  pathValue: string,
  program: tslib.Program,
  baseDir: string | undefined,
): tslib.CompletionInfo | undefined {
  const resolved = resolveModulePath(ts, pathValue, node.getSourceFile().fileName, program, baseDir)
  if (!resolved) {
    return undefined
  }

  const exports = getModuleExports(ts, resolved, program)

  return {
    entries: exports.map((name) => ({
      name,
      kind: ts.ScriptElementKind.constElement,
      replacementSpan: {
        length: node.text.length,
        start: node.getStart() + 1,
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
  ts: typeof tslib,
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

  // Only complete the path portion (everything before #, or the whole string)
  const pathPortion =
    hashIndex !== -1 ? text.substring(0, hashIndex) : text.substring(0, offsetInString)
  const lastSlash = pathPortion.lastIndexOf('/')

  // Directory to list entries from, and the partial segment being typed
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

    // Resolve directory: '/' paths are relative to baseDir
    if (dirPortion.startsWith('/')) {
      dirPath = baseDir + dirPortion
    } else if (dirPortion.startsWith('./')) {
      dirPath = baseDir + '/' + dirPortion.substring(2)
    } else {
      dirPath = baseDir + '/' + dirPortion
    }
  }

  if (!ts.sys.directoryExists(dirPath)) {
    return undefined
  }

  const entries: tslib.CompletionEntry[] = []

  // Add subdirectories
  const dirs = ts.sys.getDirectories(dirPath)
  for (const dir of dirs) {
    if (dir.startsWith('.') || dir === 'node_modules') {
      continue
    }
    if (prefix && !dir.toLowerCase().startsWith(prefix.toLowerCase())) {
      continue
    }
    entries.push({
      name: dir,
      kind: ts.ScriptElementKind.directory,
      replacementSpan: {
        length: prefix.length,
        start: replacementStart,
      },
      sortText: '0' + dir,
    })
  }

  // Add files (stripping extensions for cleaner suggestions)
  const files = ts.sys.readDirectory(dirPath, COMPONENT_EXTENSIONS, undefined, undefined, 1)
  for (const file of files) {
    const fileName = file.substring(file.lastIndexOf('/') + 1)
    const nameWithoutExt = fileName.replace(/\.(?:tsx?|jsx?)$/, '')

    if (prefix && !fileName.toLowerCase().startsWith(prefix.toLowerCase())) {
      continue
    }

    entries.push({
      name: fileName,
      kind: ts.ScriptElementKind.scriptElement,
      replacementSpan: {
        length: prefix.length,
        start: replacementStart,
      },
      sortText: '1' + fileName,
    })

    // Also suggest without extension if it differs from the filename
    if (nameWithoutExt !== fileName) {
      entries.push({
        name: nameWithoutExt,
        kind: ts.ScriptElementKind.scriptElement,
        replacementSpan: {
          length: prefix.length,
          start: replacementStart,
        },
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

  let modulePath: string
  let exportName: string

  if (context.type === 'string') {
    const parsed = parsePayloadComponentString(node.text)
    modulePath = parsed.path
    exportName = parsed.exportName
  } else if (context.type === 'path') {
    modulePath = node.text
    exportName = 'default'
  } else if (context.type === 'exportName' && context.pathValue) {
    modulePath = context.pathValue
    exportName = node.text
  } else {
    return undefined
  }

  if (!modulePath) {
    return undefined
  }

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
// Resolution utilities
// -------------------------------------------------------------------

function parsePayloadComponentString(value: string): { exportName: string; path: string } {
  if (value.includes('#')) {
    const [path, exportName] = value.split('#', 2) as [string, string]
    return { exportName: exportName || 'default', path }
  }

  return { exportName: 'default', path: value }
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

  if (modulePath.startsWith('/') || modulePath.startsWith('./')) {
    // Payload convention: '/' and './' paths are relative to baseDir.
    // Create a synthetic "containing file" inside baseDir so TypeScript's
    // module resolution resolves relative to it.
    if (baseDir) {
      resolveFrom = baseDir + '/_.ts'
    }

    if (modulePath.startsWith('/')) {
      pathToResolve = '.' + modulePath
    }
  }

  const result = ts.resolveModuleName(pathToResolve, resolveFrom, compilerOptions, ts.sys)

  if (result.resolvedModule) {
    return result.resolvedModule
  }

  // Fallback: if the path has a .js/.jsx extension, try without it.
  // Payload allows '/components/Foo.js' where the file is actually .tsx/.ts.
  if (pathToResolve.endsWith('.js') || pathToResolve.endsWith('.jsx')) {
    const withoutExt = pathToResolve.replace(/\.jsx?$/, '')
    const retry = ts.resolveModuleName(withoutExt, resolveFrom, compilerOptions, ts.sys)
    return retry.resolvedModule
  }

  return undefined
}

const PAYLOAD_CONFIG_NAMES = ['payload.config.ts', 'payload.config.js', 'config.ts']

/**
 * Walks up from a file to find the nearest Payload config file and returns its directory.
 * This serves as the default `baseDir` when not explicitly configured.
 */
function findPayloadConfigDir(ts: typeof tslib, fromFile: string): string | undefined {
  let dir = fromFile.includes('/') ? fromFile.substring(0, fromFile.lastIndexOf('/')) : fromFile

  const root = dir.startsWith('/') ? '/' : ''

  for (let i = 0; i < 50; i++) {
    for (const name of PAYLOAD_CONFIG_NAMES) {
      if (ts.sys.fileExists(dir + '/' + name)) {
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

function getModuleExports(
  ts: typeof tslib,
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

  const exports = checker.getExportsOfModule(moduleSymbol)
  return exports.map((e) => e.name)
}

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
  const matrix: number[][] = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0]![j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1
      matrix[i]![j] = Math.min(
        matrix[i - 1]![j]! + 1,
        matrix[i]![j - 1]! + 1,
        matrix[i - 1]![j - 1]! + cost,
      )
    }
  }

  return matrix[b.length]![a.length]!
}

export = init
