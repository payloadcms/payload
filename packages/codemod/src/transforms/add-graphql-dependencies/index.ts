import type { Project, SourceFile } from 'ts-morph'

import { Node, SyntaxKind } from 'ts-morph'

import type { PackageJsonFile, Transform } from '../../types.js'

const GRAPHQL_PACKAGE = '@payloadcms/graphql'

/** Peer ranges declared by `@payloadcms/next`. `@payloadcms/graphql` follows the project's `payload` range instead. */
const GRAPHQL_PEER_RANGES: Record<string, string> = {
  graphql: '^16.8.1',
  'graphql-http': '^1.22.4',
  'graphql-playground-html': '^1.6.30',
}

const DEPENDENCY_FIELDS = ['dependencies', 'devDependencies', 'peerDependencies'] as const

const GRAPHQL_ROUTE_PATH = /\/app\/(?:.*\/)?api\/graphql(?:-playground)?\/route\.[jt]sx?$/

/**
 * Statement sequences of the GraphQL route files Payload has scaffolded, normalized by
 * `normalizeStatements`. A route only counts as untouched scaffold when it matches one exactly.
 */
const SCAFFOLDED_ROUTES = [
  [
    "import config from '@payload-config'",
    "import { GRAPHQL_POST, REST_OPTIONS } from '@payloadcms/next/routes'",
    'export const POST = GRAPHQL_POST(config)',
    'export const OPTIONS = REST_OPTIONS(config)',
  ],
  [
    "import config from '@payload-config'",
    "import '@payloadcms/next/css'",
    "import { GRAPHQL_PLAYGROUND_GET } from '@payloadcms/next/routes'",
    'export const GET = GRAPHQL_PLAYGROUND_GET(config)',
  ],
  [
    "import config from '@payload-config'",
    "import { GRAPHQL_PLAYGROUND_GET } from '@payloadcms/next/routes'",
    'export const GET = GRAPHQL_PLAYGROUND_GET(config)',
  ],
].map((statements) => statements.join('\n'))

export const addGraphQLDependencies: Transform = {
  name: 'add-graphql-dependencies',
  apply: ({ packageJsons, project }) => {
    if (isGraphQLDisabled(project)) {
      return deleteScaffoldedGraphQLRoutes(project)
    }

    return addMissingGraphQLDependencies(packageJsons)
  },
  description:
    'Adds `@payloadcms/graphql`, `graphql`, `graphql-http` and `graphql-playground-html` to projects that depend on `@payloadcms/next`, since they are now optional peers. When every Payload config sets `graphQL: { disable: true }`, deletes the scaffolded GraphQL route files instead.',
}

function addMissingGraphQLDependencies(packageJsons: PackageJsonFile[]) {
  const filesChanged: string[] = []
  const notes: string[] = []

  for (const pkg of packageJsons) {
    const nextRange = getDependencyRange({ name: '@payloadcms/next', data: pkg.data })
    if (!nextRange) {
      continue
    }

    const payloadRange = getDependencyRange({ name: 'payload', data: pkg.data }) ?? nextRange
    const requiredRanges: Record<string, string> = {
      [GRAPHQL_PACKAGE]: payloadRange,
      ...GRAPHQL_PEER_RANGES,
    }

    const missing = Object.keys(requiredRanges).filter(
      (name) => !getDependencyRange({ name, data: pkg.data }),
    )
    if (missing.length === 0) {
      continue
    }

    const dependencies = isRecord(pkg.data.dependencies) ? pkg.data.dependencies : {}
    const additions = Object.fromEntries(missing.map((name) => [name, requiredRanges[name]]))
    pkg.data.dependencies = mergeDependencies({ additions, dependencies })

    filesChanged.push(pkg.path)
    notes.push(
      `${pkg.path}: added ${missing.join(', ')}. Run your package manager's install. If you do not use GraphQL, set \`graphQL: { disable: true }\` in your Payload config and re-run this transform to delete the GraphQL routes instead.`,
    )
  }

  return { filesChanged, notes }
}

function deleteScaffoldedGraphQLRoutes(project: Project) {
  const filesChanged: string[] = []
  const notes: string[] = []

  for (const sourceFile of project.getSourceFiles()) {
    const filePath = sourceFile.getFilePath()
    if (!GRAPHQL_ROUTE_PATH.test(filePath)) {
      continue
    }

    if (SCAFFOLDED_ROUTES.includes(normalizeStatements(sourceFile))) {
      sourceFile.delete()
      filesChanged.push(filePath)
      continue
    }

    if (importsGraphQLRouteHandler(sourceFile)) {
      notes.push(
        `${filePath}: GraphQL is disabled but this route was customized, so it was not deleted. Delete it manually, or install \`${GRAPHQL_PACKAGE}\`, otherwise the build fails with \`Module not found: Can't resolve '${GRAPHQL_PACKAGE}'\`.`,
      )
    }
  }

  return { filesChanged, notes }
}

/**
 * True only when at least one `buildConfig()` call exists and every one of them sets a literal
 * `graphQL: { disable: true }`. Anything less certain keeps GraphQL installed.
 */
function isGraphQLDisabled(project: Project): boolean {
  const configs = project
    .getSourceFiles()
    .flatMap((sourceFile) => getBuildConfigArguments(sourceFile))

  return configs.length > 0 && configs.every((config) => hasLiteralGraphQLDisable(config))
}

function getBuildConfigArguments(sourceFile: SourceFile): Node[] {
  const localNames = sourceFile
    .getImportDeclarations()
    .filter((importDecl) => importDecl.getModuleSpecifierValue() === 'payload')
    .flatMap((importDecl) => importDecl.getNamedImports())
    .filter((specifier) => specifier.getName() === 'buildConfig')
    .map((specifier) => specifier.getAliasNode()?.getText() ?? 'buildConfig')

  if (localNames.length === 0) {
    return []
  }

  return sourceFile
    .getDescendantsOfKind(SyntaxKind.CallExpression)
    .filter((call) => localNames.includes(call.getExpression().getText()))
    .map((call) => call.getArguments()[0])
    .filter((arg): arg is Node => Boolean(arg))
}

function hasLiteralGraphQLDisable(config: Node): boolean {
  const graphQL = getObjectPropertyInitializer({ name: 'graphQL', node: config })
  const disable = graphQL && getObjectPropertyInitializer({ name: 'disable', node: graphQL })

  return disable?.getKind() === SyntaxKind.TrueKeyword
}

function getObjectPropertyInitializer({ name, node }: { name: string; node: Node }) {
  if (!Node.isObjectLiteralExpression(node)) {
    return undefined
  }

  const property = node.getProperty(name)

  return Node.isPropertyAssignment(property) ? property.getInitializer() : undefined
}

function importsGraphQLRouteHandler(sourceFile: SourceFile): boolean {
  return sourceFile
    .getImportDeclarations()
    .some(
      (importDecl) =>
        importDecl.getModuleSpecifierValue() === '@payloadcms/next/routes' &&
        importDecl
          .getNamedImports()
          .some((specifier) => specifier.getName().startsWith('GRAPHQL_')),
    )
}

/** Statement text without comments, semicolons, or quote and whitespace differences. */
function normalizeStatements(sourceFile: SourceFile): string {
  return sourceFile
    .getStatements()
    .map((statement) =>
      statement
        .getText()
        .replace(/;\s*$/, '')
        .replace(/"/g, "'")
        .replace(/\s+/g, ' ')
        .replace(/\{\s*/g, '{ ')
        .replace(/\s*\}/g, ' }'),
    )
    .join('\n')
}

function getDependencyRange({
  name,
  data,
}: {
  data: Record<string, unknown>
  name: string
}): string | undefined {
  for (const field of DEPENDENCY_FIELDS) {
    const deps = data[field]
    if (isRecord(deps) && typeof deps[name] === 'string') {
      return deps[name]
    }
  }

  return undefined
}

/** Keeps an alphabetized dependency map alphabetized; otherwise appends. */
function mergeDependencies({
  additions,
  dependencies,
}: {
  additions: Record<string, string | undefined>
  dependencies: Record<string, unknown>
}): Record<string, unknown> {
  const merged = { ...dependencies, ...additions }
  const existingKeys = Object.keys(dependencies)
  const isSorted = existingKeys.every((key, i) => i === 0 || existingKeys[i - 1]! <= key)

  if (!isSorted) {
    return merged
  }

  return Object.fromEntries(Object.entries(merged).sort(([a], [b]) => (a < b ? -1 : 1)))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
