import { addPayloadComponentToImportMap } from './utilities/addPayloadComponentToImportMap.js'
import { getImportMapToBaseDirPath } from './utilities/getImportMapToBaseDirPath.js'

describe('addPayloadComponentToImportMap', () => {
  let importMap: Record<string, string>
  let imports: Record<
    string,
    {
      path: string
      specifier: string
    }
  >

  beforeEach(() => {
    importMap = {}
    imports = {}
    jest.restoreAllMocks()
  })

  function componentPathTest({
    baseDir,
    importMapFilePath,
    payloadComponent,
    expectedPath,
    expectedImportMapToBaseDirPath,
  }: {
    baseDir: string
    importMapFilePath: string
    payloadComponent: string
    expectedPath: string
    expectedImportMapToBaseDirPath: string
  }) {
    const importMapToBaseDirPath = getImportMapToBaseDirPath({
      baseDir,
      importMapPath: importMapFilePath,
    })

    expect(importMapToBaseDirPath).toBe(expectedImportMapToBaseDirPath)

    const { path } =
      addPayloadComponentToImportMap({
        importMapToBaseDirPath,
        importMap,
        imports,
        payloadComponent,
      }) ?? {}

    expect(path).toBe(expectedPath)
  }

  it('relative path with import map partially in base dir', () => {
    componentPathTest({
      baseDir: '/myPackage/test/myTest',
      importMapFilePath: '/myPackage/app/(payload)/importMap.js',
      payloadComponent: './MyComponent.js#MyExport',
      expectedImportMapToBaseDirPath: '../../test/myTest/',
      expectedPath: '../../test/myTest/MyComponent.js',
    })
  })

  it('relative path with import map partially in base dir 2', () => {
    componentPathTest({
      baseDir: '/myPackage/test/myTest',
      importMapFilePath: '/myPackage/test/prod/app/(payload)/importMap.js',
      payloadComponent: './MyComponent.js#MyExport',
      expectedImportMapToBaseDirPath: '../../../myTest/',
      expectedPath: '../../../myTest/MyComponent.js',
    })
  })

  it('relative path with import map partially in base dir 3', () => {
    componentPathTest({
      baseDir: '/myPackage/test/myTest',
      importMapFilePath: '/myPackage/test/prod/app/(payload)/importMap.js',
      payloadComponent: '../otherTest/MyComponent.js#MyExport',
      expectedImportMapToBaseDirPath: '../../../myTest/',
      expectedPath: '../../../otherTest/MyComponent.js',
    })
  })

  it('relative path with import map within base dir', () => {
    componentPathTest({
      baseDir: '/myPackage/test/myTest',
      importMapFilePath: '/myPackage/test/myTest/prod/app/(payload)/importMap.js',
      payloadComponent: './MyComponent.js#MyExport',
      expectedImportMapToBaseDirPath: '../../../',
      expectedPath: '../../../MyComponent.js',
    })
  })

  it('relative path with import map not in base dir', () => {
    componentPathTest({
      baseDir: '/test/myTest',
      importMapFilePath: '/app/(payload)/importMap.js',
      payloadComponent: './MyComponent.js#MyExport',
      expectedImportMapToBaseDirPath: '../../test/myTest/',
      expectedPath: '../../test/myTest/MyComponent.js',
    })
  })

  it('relative path with import map not in base dir 2', () => {
    componentPathTest({
      baseDir: '/test/myTest',
      importMapFilePath: '/app/(payload)/importMap.js',
      payloadComponent: '../myOtherTest/MyComponent.js#MyExport',
      expectedImportMapToBaseDirPath: '../../test/myTest/',
      expectedPath: '../../test/myOtherTest/MyComponent.js',
    })
  })

  it('relative path with import map not in base dir, baseDir ending with slash', () => {
    componentPathTest({
      baseDir: '/test/myTest/',
      importMapFilePath: '/app/(payload)/importMap.js',
      payloadComponent: './MyComponent.js#MyExport',
      expectedImportMapToBaseDirPath: '../../test/myTest/',
      expectedPath: '../../test/myTest/MyComponent.js',
    })
  })

  it('relative path with import map not in base dir, component starting with slash', () => {
    componentPathTest({
      baseDir: '/test/myTest',
      importMapFilePath: '/app/(payload)/importMap.js',
      payloadComponent: '/MyComponent.js#MyExport',
      expectedImportMapToBaseDirPath: '../../test/myTest/',
      expectedPath: '../../test/myTest/MyComponent.js',
    })
  })
})
