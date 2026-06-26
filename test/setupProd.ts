import fs from 'fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

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
  '@payloadcms/figma': 'payloadcms-figma-*',
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

  const allDependencies = {}
  // Go through all the dependencies and devDependencies, replace the normal package entry with the tgz entry
  for (const key of ['dependencies', 'devDependencies']) {
    const dependencies = packageJson[key]
    if (dependencies) {
      for (const [packageName, _packageVersion] of Object.entries(dependencies)) {
        if (tgzToPkgNameMap[packageName]) {
          const actualTgzPath = findActualTgzName(tgzToPkgNameMap[packageName])
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

  // write out package.json (direct deps now point at local tarballs)
  fs.writeFileSync(path.resolve(dirname, 'package.json'), JSON.stringify(packageJson, null, 2))

  // This file makes test/ its own pnpm workspace root, isolating it from the monorepo (which lists
  // `test` as a workspace package) without `--ignore-workspace` — which we cannot use, because under
  // v11 it makes pnpm skip this file entirely (overrides and build approvals alike). v11 also ignores
  // package.json#pnpm, so config has nowhere else to live. overrides pin @payloadcms deps to local
  // tarballs (else transitive requests hit the unpublished in-repo beta); graphql mirrors the
  // committed baseline; dangerouslyAllowAllBuilds keeps build scripts running under v11's strict
  // default; verifyDepsBeforeRun disables the v11 re-install check on later `pnpm run` commands.
  const overrides = { graphql: '16.8.1', ...allDependencies }
  const overrideLines = Object.entries(overrides).map(([name, spec]) => `  '${name}': '${spec}'`)
  const workspaceYaml = `verifyDepsBeforeRun: false\noverrides:\n${overrideLines.join('\n')}\ndangerouslyAllowAllBuilds: true\n`
  fs.writeFileSync(path.resolve(dirname, 'pnpm-workspace.yaml'), workspaceYaml)
}

setupProd()
