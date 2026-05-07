#!/usr/bin/env node
/**
 * Migration helper for `@payloadcms/graphql` → `@payloadcms/plugin-graphql`
 * (Payload v3 → v4).
 *
 * Run from the root of a Payload v3 project:
 *
 *   npx @payloadcms/plugin-graphql migrate
 *
 * The script:
 *   1. Updates `payload.config.ts` (and `.js`/`.tsx` variants):
 *      - Adds `import { graphQLPlugin } from '@payloadcms/plugin-graphql'`
 *      - Wraps any top-level `graphQL: { ... }` block as `graphQLPlugin({...})`
 *        and pushes it into the `plugins` array. The `graphQL` block is removed.
 *      - Moves `routes.graphQL` / `routes.graphQLPlayground` into the plugin's
 *        `routes` option. Removes the keys from `routes`.
 *   2. Updates Next.js route handlers under `app/(payload)/api/graphql/route.ts`
 *      and `.../graphql-playground/route.ts`:
 *      - Rewrites imports from `@payloadcms/next/routes` to
 *        `@payloadcms/plugin-graphql/next` for `GRAPHQL_POST` / `GRAPHQL_PLAYGROUND_GET`.
 *
 * The script edits files in place. Use `--dry` to preview changes without
 * writing. Always commit your tree before running so you can `git diff` the
 * result.
 *
 * Limitations: the config rewrite is regex-based and assumes a reasonably
 * conventional `payload.config.ts`. Verify the diff and finish by hand if your
 * config uses unusual formatting (e.g. `graphQL` defined in a separate variable).
 */
import fs from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
const DRY = args.includes('--dry')
const ROOT = process.cwd()

const log = (msg: string) => process.stdout.write(`${msg}\n`)
const warn = (msg: string) => process.stderr.write(`WARN: ${msg}\n`)

function walk(dir: string, acc: string[] = []): string[] {
  if (!fs.existsSync(dir)) {
    return acc
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'dist') {
      continue
    }
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full, acc)
    } else {
      acc.push(full)
    }
  }
  return acc
}

function rewriteRouteFiles(): { changed: string[]; skipped: string[] } {
  const changed: string[] = []
  const skipped: string[] = []
  const candidates = walk(ROOT).filter(
    (f) =>
      /\/(graphql|graphql-playground)\/route\.(ts|tsx|js|mjs)$/.test(f) &&
      !f.includes('/node_modules/') &&
      !f.includes('/.next/') &&
      !f.includes('/dist/'),
  )

  for (const file of candidates) {
    const original = fs.readFileSync(file, 'utf8')
    let updated = original

    // Replace single-import line from @payloadcms/next/routes if it contains
    // GRAPHQL_POST or GRAPHQL_PLAYGROUND_GET.
    updated = updated.replace(
      /import\s*\{\s*([^}]*?)\}\s*from\s*['"]@payloadcms\/next\/routes(?:\/index\.js)?['"]/g,
      (match, inner: string) => {
        const names = inner
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
        const graphqlNames = names.filter(
          (n) => n === 'GRAPHQL_POST' || n === 'GRAPHQL_PLAYGROUND_GET',
        )
        const otherNames = names.filter((n) => !graphqlNames.includes(n))
        if (graphqlNames.length === 0) {
          return match
        }

        const pluginImport = `import { ${graphqlNames.join(', ')} } from '@payloadcms/plugin-graphql/next'`
        if (otherNames.length === 0) {
          return pluginImport
        }
        return `import { ${otherNames.join(', ')} } from '@payloadcms/next/routes'\n${pluginImport}`
      },
    )

    if (updated !== original) {
      changed.push(file)
      if (!DRY) {
        fs.writeFileSync(file, updated, 'utf8')
      }
    } else {
      skipped.push(file)
    }
  }

  return { changed, skipped }
}

function rewritePayloadConfig(): { changed: string[]; warnings: string[] } {
  const changed: string[] = []
  const warnings: string[] = []
  const candidates = walk(ROOT).filter(
    (f) =>
      /payload\.config\.(ts|tsx|js|mjs)$/.test(f) &&
      !f.includes('/node_modules/') &&
      !f.includes('/.next/') &&
      !f.includes('/dist/'),
  )

  for (const file of candidates) {
    const original = fs.readFileSync(file, 'utf8')
    let updated = original

    // 1. Capture top-level `graphQL: { ... }` block. Match the outermost braces
    //    by counting depth from the opening `{` after `graphQL:`.
    const graphQLMatch = original.match(/^(\s*)graphQL\s*:\s*\{/m)
    let graphQLBlock: string | null = null
    if (graphQLMatch) {
      const startIdx = graphQLMatch.index! + graphQLMatch[0].length - 1 // points at `{`
      let depth = 0
      let endIdx = -1
      for (let i = startIdx; i < original.length; i++) {
        if (original[i] === '{') {
          depth++
        } else if (original[i] === '}') {
          depth--
          if (depth === 0) {
            endIdx = i
            break
          }
        }
      }
      if (endIdx > startIdx) {
        const fullStart = graphQLMatch.index! // start of `\s*graphQL: { ... }`
        // Include trailing comma + newline if present.
        let fullEnd = endIdx + 1
        if (original[fullEnd] === ',') {
          fullEnd++
        }
        if (original[fullEnd] === '\n') {
          fullEnd++
        }
        graphQLBlock = original.substring(startIdx, endIdx + 1) // keep braces only
        updated =
          updated.substring(0, fullStart) +
          updated.substring(fullEnd)
      }
    }

    // 2. Capture `routes.graphQL` / `routes.graphQLPlayground` keys inside `routes: { ... }`.
    let routesGraphQL: null | string = null
    let routesGraphQLPlayground: null | string = null
    const routesGraphQLRe = /^(\s*)graphQL\s*:\s*(['"][^'"]+['"]),?\s*$/m
    const routesPlaygroundRe = /^(\s*)graphQLPlayground\s*:\s*(['"][^'"]+['"]),?\s*$/m

    const grMatch = updated.match(routesGraphQLRe)
    if (grMatch) {
      routesGraphQL = grMatch[2] ?? null
      updated = updated.replace(routesGraphQLRe, '')
    }
    const gpMatch = updated.match(routesPlaygroundRe)
    if (gpMatch) {
      routesGraphQLPlayground = gpMatch[2] ?? null
      updated = updated.replace(routesPlaygroundRe, '')
    }

    if (!graphQLBlock && !routesGraphQL && !routesGraphQLPlayground) {
      warnings.push(`${file}: no migration markers found (graphQL config block, routes.graphQL, or routes.graphQLPlayground); skipped`)
      continue
    }

    // 3. Construct plugin invocation. Each part is normalized to drop any
    //    trailing comma so we can join cleanly without duplicates.
    const stripTrailingComma = (s: string) => s.replace(/,\s*$/, '').trim()
    const pluginOptionParts: string[] = []
    if (graphQLBlock) {
      // Strip the surrounding braces; we re-insert them inside the plugin call.
      const inner = stripTrailingComma(graphQLBlock.slice(1, -1).trim())
      if (inner) {
        pluginOptionParts.push(inner)
      }
    }
    if (routesGraphQL || routesGraphQLPlayground) {
      const routeParts: string[] = []
      if (routesGraphQL) {
        routeParts.push(`graphQL: ${routesGraphQL}`)
      }
      if (routesGraphQLPlayground) {
        routeParts.push(`graphQLPlayground: ${routesGraphQLPlayground}`)
      }
      pluginOptionParts.push(`routes: { ${routeParts.join(', ')} }`)
    }
    const pluginCall =
      pluginOptionParts.length > 0
        ? `graphQLPlugin({ ${pluginOptionParts.join(', ')} })`
        : `graphQLPlugin({})`

    // 4. Add or extend `plugins: [...]`. Append the plugin call at the end of
    //    the array. If `plugins` doesn't exist, the user must add it manually.
    const pluginsArrayRe = /(plugins\s*:\s*\[)([\s\S]*?)(\])/
    if (pluginsArrayRe.test(updated)) {
      updated = updated.replace(pluginsArrayRe, (_match, open, body, close) => {
        const trimmedBody = body.trimEnd()
        const sep = trimmedBody.endsWith(',') || trimmedBody.length === 0 ? '' : ','
        return `${open}${trimmedBody}${sep}\n    ${pluginCall},\n  ${close}`
      })
    } else {
      warnings.push(
        `${file}: no \`plugins:\` array found. Add the following manually:\n    plugins: [${pluginCall}],`,
      )
    }

    // 5. Add the import statement if missing.
    if (!/from\s+['"]@payloadcms\/plugin-graphql['"]/.test(updated)) {
      // Insert after the last `import` line near the top.
      const importLines = updated.match(/^(import .*)$/gm) || []
      if (importLines.length > 0) {
        const lastImport = importLines[importLines.length - 1]!
        updated = updated.replace(
          lastImport,
          `${lastImport}\nimport { graphQLPlugin } from '@payloadcms/plugin-graphql'`,
        )
      } else {
        updated = `import { graphQLPlugin } from '@payloadcms/plugin-graphql'\n${updated}`
      }
    }

    if (updated !== original) {
      changed.push(file)
      if (!DRY) {
        fs.writeFileSync(file, updated, 'utf8')
      }
    }
  }

  return { changed, warnings }
}

log(`Migrating from @payloadcms/graphql to @payloadcms/plugin-graphql${DRY ? ' (dry run)' : ''}`)
log('')

const routes = rewriteRouteFiles()
log(`Route files updated: ${routes.changed.length}`)
for (const f of routes.changed) {
  log(`  + ${path.relative(ROOT, f)}`)
}

log('')
const config = rewritePayloadConfig()
log(`payload.config files updated: ${config.changed.length}`)
for (const f of config.changed) {
  log(`  + ${path.relative(ROOT, f)}`)
}

if (config.warnings.length > 0) {
  log('')
  for (const w of config.warnings) {
    warn(w)
  }
}

log('')
log('Next steps:')
log('  1. Install @payloadcms/plugin-graphql:')
log('       pnpm add @payloadcms/plugin-graphql')
log('  2. Remove `@payloadcms/graphql` from package.json if present.')
log('  3. Run `pnpm install` then start your app and verify /api/graphql works.')
log('')
log('If you used `dry` mode, re-run without `--dry` to write changes.')
