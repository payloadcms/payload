import { execFile } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'

import { buildResearchPrompt, parseResearchResult } from '../codex-contract.mjs'
import { buildCodexEvidence, fetchPackageMeta, fetchReleaseNotes } from '../upstream.mjs'
import { parseCatalog } from './plan.mjs'
import {
  createFetch,
  findBump,
  findStoredEntry,
  findUnit,
  readJson,
  readPlan,
  readResearchResults,
  readToken,
  requireOption,
  writeOutputs,
} from './shared.mjs'

const execFileAsync = promisify(execFile)

const MAX_BUFFER = 64 * 1024 * 1024
const MAX_PIN_HISTORY_LENGTH = 20000
const WORKSPACE_FILE = 'pnpm-workspace.yaml'
const MAJOR_PIN_HISTORY = 'Not applicable: major bump.\n'

/**
 * `evidence --plan --bump --cwd --out-dir`: writes notes.md, pin-history.txt and
 * evidence.json (`{ hasNotes }`) for one bump. `--cwd` needs full git history.
 */
export async function runEvidence({ options }) {
  const plan = await readPlan({ options })
  const bump = findBump({ plan, bumpId: requireOption({ name: 'bump', options }) })
  const cwd = options.cwd ?? process.cwd()
  const outDir = requireOption({ name: 'out-dir', options })
  const fetch = await createFetch()
  const token = readToken()

  const { repo } = await fetchPackageMeta({ fetch, name: bump.dependency, version: bump.to })
  const notes = await fetchReleaseNotes({
    fetch,
    repo,
    name: bump.dependency,
    from: bump.fromVersion,
    to: bump.to,
    isMajor: bump.isMajor,
    includeMinors: true,
    token,
  })
  const hasNotes = notes.entries.length > 0
  const pinHistory = bump.isMajor ? MAJOR_PIN_HISTORY : await readPinHistory({ bump, cwd })

  await mkdir(outDir, { recursive: true })
  await writeFile(
    path.join(outDir, 'notes.md'),
    hasNotes ? buildCodexEvidence({ notes: notes.entries }) : '',
  )
  await writeFile(path.join(outDir, 'pin-history.txt'), pinHistory)
  await writeFile(path.join(outDir, 'evidence.json'), `${JSON.stringify({ hasNotes })}\n`)
}

/** `build-research-prompt --plan --bump --template --skill --evidence-dir --ref --out` */
export async function runBuildResearchPrompt({ options }) {
  const plan = await readPlan({ options })
  const bump = findBump({ plan, bumpId: requireOption({ name: 'bump', options }) })
  const evidenceDir = path.resolve(requireOption({ name: 'evidence-dir', options }))
  const evidence = await readJson({ file: path.join(evidenceDir, 'evidence.json') })
  if (typeof evidence?.hasNotes !== 'boolean') {
    throw new Error('evidence.json has no boolean hasNotes')
  }

  const [template, skill] = await Promise.all([
    readFile(requireOption({ name: 'template', options }), 'utf8'),
    readFile(requireOption({ name: 'skill', options }), 'utf8'),
  ])
  const prompt = buildResearchPrompt({
    bump,
    evidencePaths: {
      notesPath: path.join(evidenceDir, 'notes.md'),
      pinHistoryPath: path.join(evidenceDir, 'pin-history.txt'),
    },
    hasNotes: evidence.hasNotes,
    ref: requireOption({ name: 'ref', options }),
    skill,
    template,
  })

  await writeFile(requireOption({ name: 'out', options }), prompt)
}

/** `check-research --result`: exits 1 when Codex's result does not match the contract. */
export async function runCheckResearch({ options }) {
  parseResearchResult({ text: await readFile(requireOption({ name: 'result', options }), 'utf8') })
}

/**
 * `select-bumps --plan --unit --research-dir`: outputs `bump_ids`. The group takes applied
 * non-majors plus applied fallbacks whose major was declined now or on an earlier run.
 */
export async function runSelectBumps({ options }) {
  const plan = await readPlan({ options })
  const unit = findUnit({ plan, unitId: requireOption({ name: 'unit', options }) })
  const research = await readResearchResults({
    bumpIds: plan.bumps.map((bump) => bump.id),
    researchDir: requireOption({ name: 'research-dir', options }),
  })

  await writeOutputs({
    values: { bump_ids: JSON.stringify(selectUnitBumpIds({ plan, research, unit })) },
  })
}

/** Bump ids of `unit` that the pipeline applies, from today's research and the store. */
export function selectUnitBumpIds({ plan, research, unit }) {
  return unit.bumpIds.filter((bumpId) => {
    if (research[bumpId]?.decision !== 'apply') {
      return false
    }

    const bump = findBump({ plan, bumpId })
    return !bump.fallbackFor || isMajorDeclined({ majorId: bump.fallbackFor, plan, research })
  })
}

export function isMajorDeclined({ majorId, plan, research }) {
  const major = findBump({ plan, bumpId: majorId })

  return (
    research[majorId]?.decision === 'decline' || findStoredEntry({ plan, bump: major }) !== null
  )
}

/**
 * `git log -L` on each line that pins the dependency. A `catalog:` manifest entry points at
 * the catalog line in pnpm-workspace.yaml, read once.
 */
async function readPinHistory({ bump, cwd }) {
  const targets = []

  for (const manifest of bump.manifests) {
    const text = await readFile(path.join(cwd, manifest), 'utf8')
    const declaration = findManifestLine({ dependency: bump.dependency, text })
    if (!declaration) {
      throw new Error(`${manifest} does not declare ${bump.dependency}`)
    }
    targets.push(
      declaration.spec.startsWith('catalog:')
        ? await findCatalogTarget({ bump, cwd })
        : { file: manifest, line: declaration.line },
    )
  }

  const unique = [...new Map(targets.map((target) => [target.file, target])).values()]
  const sections = []
  for (const { file, line } of unique) {
    const { stdout } = await execFileAsync(
      'git',
      ['log', '--no-color', `-L${line},${line}:${file}`],
      {
        cwd,
        maxBuffer: MAX_BUFFER,
      },
    )
    sections.push(`## ${file}:${line}\n\n${stdout.trim() || 'No history.'}`)
  }

  const history = `${sections.join('\n\n')}\n`
  return history.length <= MAX_PIN_HISTORY_LENGTH
    ? history
    : `${history.slice(0, MAX_PIN_HISTORY_LENGTH)}\n… cut at ${MAX_PIN_HISTORY_LENGTH} characters\n`
}

function findManifestLine({ dependency, text }) {
  const pattern = new RegExp(`^\\s*"${escapeRegExp(dependency)}"\\s*:\\s*"([^"]*)"`)
  const lines = text.split('\n')
  const index = lines.findIndex((line) => pattern.test(line))

  return index === -1 ? null : { line: index + 1, spec: pattern.exec(lines[index])[1] }
}

async function findCatalogTarget({ bump, cwd }) {
  const text = await readFile(path.join(cwd, WORKSPACE_FILE), 'utf8')
  const entry = parseCatalog({ text }).get(bump.dependency)
  if (!entry) {
    throw new Error(`${WORKSPACE_FILE} catalog does not declare ${bump.dependency}`)
  }

  return { file: WORKSPACE_FILE, line: entry.line }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
