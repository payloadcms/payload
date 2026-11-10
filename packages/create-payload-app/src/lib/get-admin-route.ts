import type { ObjectLiteralExpression } from 'ts-morph'

import fse from 'fs-extra'
import path from 'path'
import { Node, Project, SyntaxKind, ts, VariableDeclarationKind } from 'ts-morph'

import { detectPayloadConfigStructure } from './ast/payload-config.js'

/** Read the configured route without executing the application's config or plugins. */
export function getAdminRoute({ projectDir }: { projectDir: string }): string {
  const tsconfigPath = path.join(projectDir, 'tsconfig.json')
  const project = new Project({
    ...(fse.existsSync(tsconfigPath) && { tsConfigFilePath: tsconfigPath }),
    skipAddingFilesFromTsConfig: true,
    skipFileDependencyResolution: true,
  })
  const options = project.getCompilerOptions()
  const envConfigPath = process.env.PAYLOAD_CONFIG_PATH
  const configuredPath = envConfigPath || options.paths?.['@payload-config']?.[0]
  const explicitFile = envConfigPath ? path.resolve(projectDir, envConfigPath) : undefined
  const configuredFile = !configuredPath
    ? undefined
    : explicitFile && fse.existsSync(explicitFile)
      ? explicitFile
      : (ts.resolveModuleName(
          explicitFile ?? '@payload-config',
          path.join(projectDir, 'next.config.ts'),
          options,
          ts.sys,
        ).resolvedModule?.resolvedFileName ?? explicitFile)
  const candidates = configuredPath
    ? configuredFile
      ? [configuredFile]
      : []
    : [
        'payload.config.ts',
        'payload.config.js',
        'src/payload.config.ts',
        'src/payload.config.js',
      ].map((file) => path.join(projectDir, file))
  const configPaths = candidates.filter((file) => fse.existsSync(file))
  const failure = new Error(
    'Cannot determine routes.admin safely. Use a statically defined admin route before upgrading with create-payload-app.',
  )

  if (configPaths.length === 0 && !configuredPath) {
    return '/admin'
  }
  if (configPaths.length !== 1) {
    throw failure
  }

  const sourceFile = project.addSourceFileAtPath(configPaths[0]!)
  const detection = detectPayloadConfigStructure(sourceFile)
  const buildConfigCall = detection.structures?.buildConfigCall
  const config = buildConfigCall?.getArguments()[0]
  let exported = sourceFile
    .getExportAssignments()
    .find((assignment) => !assignment.isExportEquals())
    ?.getExpression()

  if (Node.isIdentifier(exported)) {
    const declaration = sourceFile.getVariableDeclaration(exported.getText())

    exported =
      declaration?.getVariableStatement()?.getDeclarationKind() === VariableDeclarationKind.Const
        ? declaration.getInitializer()
        : undefined
  }

  if (
    !detection.success ||
    exported !== buildConfigCall ||
    !sourceFile
      .getImportDeclaration('payload')
      ?.getNamedImports()
      .some((specifier) => specifier.getName() === 'buildConfig') ||
    detection.edgeCases?.multipleBuildConfigCalls ||
    !Node.isObjectLiteralExpression(config) ||
    config
      .getProperties()
      .some(
        (property) =>
          Node.isSpreadAssignment(property) || Node.isComputedPropertyName(property.getNameNode()),
      )
  ) {
    throw failure
  }
  const routesProperty = findConfigProperty({ name: 'routes', config })

  if (!routesProperty) {
    return '/admin'
  }
  const routes = routesProperty.asKind(SyntaxKind.PropertyAssignment)?.getInitializer()

  if (
    !Node.isObjectLiteralExpression(routes) ||
    routes
      .getProperties()
      .some(
        (property) =>
          Node.isSpreadAssignment(property) || Node.isComputedPropertyName(property.getNameNode()),
      )
  ) {
    throw failure
  }
  const adminProperty = findConfigProperty({ name: 'admin', config: routes })

  if (!adminProperty) {
    return '/admin'
  }
  const initializer = adminProperty.asKind(SyntaxKind.PropertyAssignment)?.getInitializer()
  const route =
    Node.isStringLiteral(initializer) || Node.isNoSubstitutionTemplateLiteral(initializer)
      ? initializer.getLiteralText()
      : undefined

  if (
    typeof route !== 'string' ||
    !route.startsWith('/') ||
    route.includes('\\') ||
    route.split('/').some((segment) => segment === '.' || segment === '..')
  ) {
    throw failure
  }
  return route.replace(/\/+$/, '') || '/'
}

function findConfigProperty({ name, config }: { config: ObjectLiteralExpression; name: string }) {
  const matches = config.getProperties().filter((property) => {
    if (Node.isSpreadAssignment(property)) {
      return false
    }
    const key = property.getNameNode()

    return (Node.isStringLiteral(key) ? key.getLiteralText() : key.getText()) === name
  })

  if (matches.length > 1) {
    throw new Error(`Cannot determine routes.admin safely: duplicate ${name} properties.`)
  }
  return matches[0]
}
