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
  '@payloadcms/drizzle': 'payloadcms-drizzle-*',
  '@payloadcms/email-nodemailer': 'payloadcms-email-nodemailer-*',
  '@payloadcms/email-resend': 'payloadcms-email-resend-*',
  '@payloadcms/eslint-config': 'payloadcms-eslint-config-*',
  '@payloadcms/eslint-plugin': 'payloadcms-eslint-plugin-*',
  '@payloadcms/graphql': 'payloadcms-graphql-*',
  '@payloadcms/live-preview': 'payloadcms-live-preview-*',
  '@payloadcms/live-preview-react': 'payloadcms-live-preview-react-*',
  '@payloadcms/next': 'payloadcms-next-*',
  '@payloadcms/payload-cloud': 'payloadcms-payload-cloud-*',
  '@payloadcms/plugin-cloud-storage': 'payloadcms-plugin-cloud-storage-*',
  '@payloadcms/plugin-form-builder': 'payloadcms-plugin-form-builder-*',
  '@payloadcms/plugin-import-export': 'payloadcms-plugin-import-export-*',
  '@payloadcms/plugin-multi-tenant': 'payloadcms-plugin-multi-tenant-*',
  '@payloadcms/plugin-nested-docs': 'payloadcms-plugin-nested-docs-*',
  '@payloadcms/plugin-redirects': 'payloadcms-plugin-redirects-*',
  '@payloadcms/plugin-search': 'payloadcms-plugin-search-*',
  '@payloadcms/plugin-sentry': 'payloadcms-plugin-sentry-*',
  '@payloadcms/plugin-seo': 'payloadcms-plugin-seo-*',
  '@payloadcms/plugin-stripe': 'payloadcms-plugin-stripe-*',
  '@payloadcms/richtext-lexical': 'payloadcms-richtext-lexical-*',
  '@payloadcms/richtext-slate': 'payloadcms-richtext-slate-*',
  '@payloadcms/storage-azure': 'payloadcms-storage-azure-*',
  '@payloadcms/storage-gcs': 'payloadcms-storage-gcs-*',
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
