import fs from 'fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * Parse catalog entries from pnpm-workspace.yaml
 * Simple parser that doesn't require external yaml library
 */
function parseCatalog(yaml: string): Record<string, string> {
  const catalog: Record<string, string> = {}
  const catalogMatch = yaml.match(/catalog:\n((?: {2}[^\n]+\n)+)/)
  if (catalogMatch?.[1]) {
    const lines = catalogMatch[1].split('\n').filter(Boolean)
    for (const line of lines) {
      // Match "  package-name: version" format - specific pattern to avoid backtracking
      const colonIndex = line.indexOf(':')
      if (colonIndex > 0) {
        const key = line.slice(2, colonIndex).trim()
        const value = line.slice(colonIndex + 1).trim()
        if (key && value) {
          catalog[key] = value
        }
      }
    }
  }
  return catalog
}

export const tgzToPkgNameMap = {
  payload: 'payload-*',
  '@payloadcms/admin-bar': 'payloadcms-admin-bar-*',
  '@payloadcms/db-mongodb': 'payloadcms-db-mongodb-*',
  '@payloadcms/db-postgres': 'payloadcms-db-postgres-*',
  '@payloadcms/db-vercel-postgres': 'payloadcms-db-vercel-postgres-*',
  '@payloadcms/db-sqlite': 'payloadcms-db-sqlite-*',
  '@payloadcms/db-d1-sqlite': 'payloadcms-db-d1-sqlite-*',
  '@payloadcms/drizzle': 'payloadcms-drizzle-*',
  '@payloadcms/email-nodemailer': 'payloadcms-email-nodemailer-*',
  '@payloadcms/email-resend': 'payloadcms-email-resend-*',
  '@payloadcms/eslint-config': 'payloadcms-eslint-config-*',
  '@payloadcms/eslint-plugin': 'payloadcms-eslint-plugin-*',
  '@payloadcms/graphql': 'payloadcms-graphql-*',
  '@payloadcms/live-preview': 'payloadcms-live-preview-*',
  '@payloadcms/live-preview-react': 'payloadcms-live-preview-react-*',
  '@payloadcms/kv-redis': 'payloadcms-kv-redis-*',
  '@payloadcms/next': 'payloadcms-next-*',
  '@payloadcms/payload-cloud': 'payloadcms-payload-cloud-*',
  '@payloadcms/plugin-cloud-storage': 'payloadcms-plugin-cloud-storage-*',
  '@payloadcms/plugin-form-builder': 'payloadcms-plugin-form-builder-*',
  '@payloadcms/plugin-ecommerce': 'payloadcms-plugin-ecommerce-*',
  '@payloadcms/plugin-import-export': 'payloadcms-plugin-import-export-*',
  '@payloadcms/plugin-mcp': 'payloadcms-plugin-mcp-*',
  '@payloadcms/plugin-multi-tenant': 'payloadcms-plugin-multi-tenant-*',
  '@payloadcms/plugin-nested-docs': 'payloadcms-plugin-nested-docs-*',
  '@payloadcms/plugin-redirects': 'payloadcms-plugin-redirects-*',
  '@payloadcms/plugin-search': 'payloadcms-plugin-search-*',
  '@payloadcms/plugin-sentry': 'payloadcms-plugin-sentry-*',
  '@payloadcms/plugin-seo': 'payloadcms-plugin-seo-*',
  '@payloadcms/plugin-stripe': 'payloadcms-plugin-stripe-*',
  '@payloadcms/richtext-lexical': 'payloadcms-richtext-lexical-*',
  '@payloadcms/richtext-slate': 'payloadcms-richtext-slate-*',
  '@payloadcms/sdk': 'payloadcms-sdk-*',
  '@payloadcms/storage-azure': 'payloadcms-storage-azure-*',
  '@payloadcms/storage-gcs': 'payloadcms-storage-gcs-*',
  '@payloadcms/storage-r2': 'payloadcms-storage-r2-*',
  '@payloadcms/storage-s3': 'payloadcms-storage-s3-*',
  '@payloadcms/storage-uploadthing': 'payloadcms-storage-uploadthing-*',
  '@payloadcms/storage-vercel-blob': 'payloadcms-storage-vercel-blob-*',
  '@payloadcms/translations': 'payloadcms-translations-*',
  '@payloadcms/ui': 'payloadcms-ui-*',
  'create-payload-app': 'create-payload-app-*',
}

function findActualTgzName(pattern: string) {
  const packedDir = path.resolve(dirname, 'packed')
  const files = fs.readdirSync(packedDir)
  const matchingFile = files.find((file) => file.startsWith(pattern.replace('*', '')))
  return matchingFile ? `file:packed/${matchingFile}` : null
}

/**
 * This does the following:
 * - installs all packages from test/packed to test/package.json
 */
export function setupProd() {
  const packageJsonString = fs.readFileSync(path.resolve(dirname, 'package.json'), 'utf8')
  const packageJson = JSON.parse(packageJsonString)

  // Parse catalog from root pnpm-workspace.yaml to resolve catalog: entries
  // This is needed because --ignore-workspace ignores all workspace config including catalogs
  const rootWorkspaceYamlPath = path.resolve(dirname, '../pnpm-workspace.yaml')
  const rootWorkspaceYaml = fs.readFileSync(rootWorkspaceYamlPath, 'utf-8')
  const catalog = parseCatalog(rootWorkspaceYaml)

  const allDependencies: Record<string, string> = {}
  // Go through all the dependencies and devDependencies:
  // 1. Replace catalog: entries with actual versions from root catalog
  // 2. Replace workspace packages with tgz entries
  for (const key of ['dependencies', 'devDependencies']) {
    const dependencies = packageJson[key] as Record<string, string> | undefined
    if (dependencies) {
      for (const [packageName, packageVersion] of Object.entries(dependencies)) {
        // Replace catalog: protocol with actual version
        if (packageVersion === 'catalog:' && catalog[packageName]) {
          dependencies[packageName] = catalog[packageName]
        }

        // Replace workspace packages with tgz paths
        const tgzPattern = tgzToPkgNameMap[packageName as keyof typeof tgzToPkgNameMap]
        if (tgzPattern) {
          const actualTgzPath = findActualTgzName(tgzPattern)
          if (actualTgzPath) {
            dependencies[packageName] = actualTgzPath
            allDependencies[packageName] = actualTgzPath
          } else {
            console.warn(`Warning: No matching tgz found for ${packageName}`)
          }
        }
      }
    }
  }

  // now add them all to overrides and pnpm.overrides as well
  packageJson.pnpm = packageJson.pnpm || {}
  packageJson.pnpm.overrides = packageJson.pnpm.overrides || {}
  packageJson.overrides = packageJson.overrides || {}
  for (const [packageName, packageVersion] of Object.entries(allDependencies)) {
    packageJson.pnpm.overrides[packageName] = packageVersion
    packageJson.overrides[packageName] = packageVersion
  }

  // write it out
  fs.writeFileSync(path.resolve(dirname, 'package.json'), JSON.stringify(packageJson, null, 2))
}

setupProd()
