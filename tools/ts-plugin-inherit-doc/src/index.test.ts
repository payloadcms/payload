import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import * as ts from 'typescript/lib/tsserverlibrary'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pluginFactory = require('./index')

describe('ts-plugin-inherit-doc', () => {
  let tempDir: string
  let testFilePath: string

  beforeEach(() => {
    // Create temporary directory for test files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ts-plugin-test-'))
    testFilePath = path.join(tempDir, 'test.ts')
  })

  afterEach(() => {
    // Clean up
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  function createLanguageService(fileContent: string): ts.LanguageService {
    fs.writeFileSync(testFilePath, fileContent)

    const servicesHost: ts.LanguageServiceHost = {
      getScriptFileNames: () => [testFilePath],
      getScriptVersion: () => '1',
      getScriptSnapshot: (fileName) => {
        if (fileName === testFilePath) {
          const text = fs.readFileSync(fileName, 'utf8')
          return ts.ScriptSnapshot.fromString(text)
        }
        return undefined
      },
      getCurrentDirectory: () => tempDir,
      getCompilationSettings: () => ({
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.CommonJS,
      }),
      getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
      fileExists: ts.sys.fileExists,
      readFile: ts.sys.readFile,
      readDirectory: ts.sys.readDirectory,
      directoryExists: ts.sys.directoryExists,
      getDirectories: ts.sys.getDirectories,
    }

    const languageService = ts.createLanguageService(servicesHost)

    // Initialize plugin
    const plugin = pluginFactory({ typescript: ts })
    const pluginInfo: ts.server.PluginCreateInfo = {
      languageService,
      languageServiceHost: servicesHost,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      project: {} as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      serverHost: {} as any,
      config: {},
    }

    return plugin.create(pluginInfo)
  }

  test('plugin adds debug marker to all hovers', () => {
    const content = `
type MyType = {
  prop: string
}
`
    const ls = createLanguageService(content)
    const position = content.indexOf('prop')
    const quickInfo = ls.getQuickInfoAtPosition(testFilePath, position)

    expect(quickInfo).toBeDefined()
    expect(quickInfo!.documentation).toBeDefined()
  })

  test('inherits documentation from referenced type', () => {
    const content = `
/**
 * Base type with documentation
 */
type BaseType = {
  /**
   * A property
   */
  prop: string
}

type DerivedType = {
  /**
   * @inheritDoc BaseType
   */
  field: BaseType
}
`
    const ls = createLanguageService(content)
    const position = content.indexOf('field:')
    const quickInfo = ls.getQuickInfoAtPosition(testFilePath, position)

    expect(quickInfo).toBeDefined()
    const docText = quickInfo!.documentation!.map((p) => p.text).join('')
    expect(docText).toContain('Base type with documentation')
    expect(docText).toContain('prop: A property')
  })

  test('shows debug message when type not found', () => {
    const content = `
type MyType = {
  /**
   * @inheritDoc NonExistentType
   */
  field: string
}
`
    const ls = createLanguageService(content)
    const position = content.indexOf('field:')
    const quickInfo = ls.getQuickInfoAtPosition(testFilePath, position)

    expect(quickInfo).toBeDefined()
    const docText = quickInfo!.documentation!.map((p) => p.text).join('')
    expect(docText).toContain('NonExistentType')
    expect(docText).toContain('not found')
  })

  test('works with interface declarations', () => {
    const content = `
/**
 * Interface documentation
 */
interface MyInterface {
  /**
   * Method docs
   */
  method(): void
}

type MyType = {
  /**
   * @inheritDoc MyInterface
   */
  field: MyInterface
}
`
    const ls = createLanguageService(content)
    const position = content.lastIndexOf('field:')
    const quickInfo = ls.getQuickInfoAtPosition(testFilePath, position)

    expect(quickInfo).toBeDefined()
    const docText = quickInfo!.documentation!.map((p) => p.text).join('')
    expect(docText).toContain('Interface documentation')
  })
})
