import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

const skillDir = path.resolve(process.cwd(), 'tools/claude-plugin/skills/payload')
const referenceDir = path.join(skillDir, 'reference')

let cached: null | string = null

/**
 * Concatenates SKILL.md plus every `reference/*.md` file into a single string
 * for injection into eval system prompts. The eval LLM has no tool access, so
 * the markdown links inside SKILL.md (e.g. `[FIELDS.md](reference/FIELDS.md)`)
 * are inert text — without inlining, references are effectively invisible.
 *
 * Memoized for the process lifetime.
 */
export function loadSkillContext(): string {
  if (cached !== null) {
    return cached
  }
  const skillBody = readFileSync(path.join(skillDir, 'SKILL.md'), 'utf-8')
  const refFiles = readdirSync(referenceDir)
    .filter((f) => f.endsWith('.md'))
    .sort()
  const refSections = refFiles.map((f) => {
    const body = readFileSync(path.join(referenceDir, f), 'utf-8')
    return `\n\n---\n\n# Reference: ${f}\n\n${body}`
  })
  cached = `${skillBody}${refSections.join('')}`
  return cached
}
