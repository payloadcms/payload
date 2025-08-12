import type { PayloadComponent } from '../../index.js'
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
    expectedSpecifier,
    expectedImportMapToBaseDirPath,
  }: {
    baseDir: string
    importMapFilePath: string
    payloadComponent: PayloadComponent
    expectedPath: string
    expectedImportMapToBaseDirPath: string
    expectedSpecifier: string
  }) {
    const importMapToBaseDirPath = getImportMapToBaseDirPath({
      baseDir,
      importMapPath: importMapFilePath,
    })

    expect(importMapToBaseDirPath).toBe(expectedImportMapToBaseDirPath)

    const { path, specifier } =
      addPayloadComponentToImportMap({
        importMapToBaseDirPath,
        importMap,
        imports,
        payloadComponent,
      }) ?? {}

    expect(path).toBe(expectedPath)
    expect(specifier).toBe(expectedSpecifier)
  }

  it('relative path with import map partially in base dir', () => {
    componentPathTest({
      baseDir: '/myPackage/test/myTest',
      importMapFilePath: '/myPackage/app/(payload)/importMap.js',
      payloadComponent: './MyComponent.js#MyExport',
      expectedImportMapToBaseDirPath: '../../test/myTest/',
      expectedPath: '../../test/myTest/MyComponent.js',
      expectedSpecifier: 'MyExport',
    })
  })

  it('relative path with import map partially in base dir 2', () => {
    componentPathTest({
      baseDir: '/myPackage/test/myTest',
      importMapFilePath: '/myPackage/test/prod/app/(payload)/importMap.js',
      payloadComponent: {
        path: './MyComponent.js#MyExport',
      },
      expectedImportMapToBaseDirPath: '../../../myTest/',
      expectedPath: '../../../myTest/MyComponent.js',
      expectedSpecifier: 'MyExport',
    })
  })

  it('relative path with import map partially in base dir 3', () => {
    componentPathTest({
      baseDir: '/myPackage/test/myTest',
      importMapFilePath: '/myPackage/test/prod/app/(payload)/importMap.js',
      payloadComponent: {
        path: '../otherTest/MyComponent.js',
        exportName: 'MyExport',
      },
      expectedImportMapToBaseDirPath: '../../../myTest/',
      expectedPath: '../../../otherTest/MyComponent.js',
      expectedSpecifier: 'MyExport',
    })
  })

  it('relative path with import map within base dir', () => {
    componentPathTest({
      baseDir: '/myPackage/test/myTest',
      importMapFilePath: '/myPackage/test/myTest/prod/app/(payload)/importMap.js',
      payloadComponent: './MyComponent.js#MyExport',
      expectedImportMapToBaseDirPath: '../../../',
      expectedPath: '../../../MyComponent.js',
      expectedSpecifier: 'MyExport',
    })
  })

  it('relative path with import map not in base dir', () => {
    componentPathTest({
      baseDir: '/test/myTest',
      importMapFilePath: '/app/(payload)/importMap.js',
      payloadComponent: './MyComponent.js#MyExport',
      expectedImportMapToBaseDirPath: '../../test/myTest/',
      expectedPath: '../../test/myTest/MyComponent.js',
      expectedSpecifier: 'MyExport',
    })
  })

  it('relative path with import map not in base dir 2', () => {
    componentPathTest({
      baseDir: '/test/myTest',
      importMapFilePath: '/app/(payload)/importMap.js',
      payloadComponent: '../myOtherTest/MyComponent.js#MyExport',
      expectedImportMapToBaseDirPath: '../../test/myTest/',
      expectedPath: '../../test/myOtherTest/MyComponent.js',
      expectedSpecifier: 'MyExport',
    })
  })

  it('relative path with import map not in base dir, baseDir ending with slash', () => {
    componentPathTest({
      baseDir: '/test/myTest/',
      importMapFilePath: '/app/(payload)/importMap.js',
      payloadComponent: './MyComponent.js#MyExport',
      expectedImportMapToBaseDirPath: '../../test/myTest/',
      expectedPath: '../../test/myTest/MyComponent.js',
      expectedSpecifier: 'MyExport',
    })
  })

  it('relative path with import map not in base dir, component starting with slash', () => {
    componentPathTest({
      baseDir: '/test/myTest',
      importMapFilePath: '/app/(payload)/importMap.js',
      payloadComponent: '/MyComponent.js#MyExport',
      expectedImportMapToBaseDirPath: '../../test/myTest/',
      expectedPath: '../../test/myTest/MyComponent.js',
      expectedSpecifier: 'MyExport',
    })
  })

  it('aliased path', () => {
    componentPathTest({
      baseDir: '/test/myTest',
      importMapFilePath: '/app/(payload)/importMap.js',
      payloadComponent: '@components/MyComponent.js#MyExport',
      expectedImportMapToBaseDirPath: '../../test/myTest/',
      expectedPath: '@components/MyComponent.js',
      expectedSpecifier: 'MyExport',
    })
  })
  it('aliased path in PayloadComponent object', () => {
    componentPathTest({
      baseDir: '/test/',
      importMapFilePath: '/app/(payload)/importMap.js',
      payloadComponent: {
        path: '@components/MyComponent.js',
      },
      expectedImportMapToBaseDirPath: '../../test/',
      expectedPath: '@components/MyComponent.js',
      expectedSpecifier: 'default',
    })
  })

  it('relative path import starting with slash, going up', () => {
    componentPathTest({
      baseDir: '/test/myTest',
      importMapFilePath: '/test/myTest/app/importMap.js',
      payloadComponent: '/../MyComponent.js#MyExport',
      expectedImportMapToBaseDirPath: '../',
      expectedPath: '../../MyComponent.js',
      expectedSpecifier: 'MyExport',
    })
  })

  it('relative path import starting with dot-slash, going up', () => {
    componentPathTest({
      baseDir: '/test/myTest',
      importMapFilePath: '/test/myTest/app/importMap.js',
      payloadComponent: './../MyComponent.js#MyExport',
      expectedImportMapToBaseDirPath: '../',
      expectedPath: '../../MyComponent.js',
      expectedSpecifier: 'MyExport',
    })
  })

  it('importMap and baseDir in same directory', () => {
    componentPathTest({
      baseDir: '/test/myTest',
      importMapFilePath: '/test/myTest/importMap.js',
      payloadComponent: './MyComponent.js#MyExport',
      expectedImportMapToBaseDirPath: './',
      expectedPath: './MyComponent.js',
      expectedSpecifier: 'MyExport',
    })
  })

  it('baseDir within importMap dir', () => {
    componentPathTest({
      baseDir: '/test/myTest/components',
      importMapFilePath: '/test/myTest/importMap.js',
      payloadComponent: './MyComponent.js#MyExport',
      expectedImportMapToBaseDirPath: './components/',
      expectedPath: './components/MyComponent.js',
      expectedSpecifier: 'MyExport',
    })
  })
})
